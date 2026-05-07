"use server";

import JSZip from "jszip";
import { geocodeUniquePlaces } from "@/app/lib/geocode";
import type { ImportPreview } from "@/app/lib/import-types";
import { parseTimelineFiles } from "@/app/lib/timeline-parser";
import { detectTrips, inferHome } from "@/app/lib/trip-detector";
import { getSettings, persistImport } from "@/app/db/queries";

export type ImportActionState = {
  preview?: ImportPreview;
  error?: string;
  message?: string;
  committed?: {
    visitCount: number;
    tripCount: number;
  };
};

async function fileToTimelineFiles(file: File) {
  const filename = file.name || "Timeline.json";
  if (filename.toLowerCase().endsWith(".zip")) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entries = Object.values(zip.files).filter(
      (entry) => !entry.dir && entry.name.toLowerCase().endsWith(".json"),
    );
    return Promise.all(
      entries.map(async (entry) => ({
        filename: entry.name,
        contents: await entry.async("string"),
      })),
    );
  }
  return [{ filename, contents: await file.text() }];
}

async function readUploadedTimelineFiles(formData: FormData) {
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    throw new Error("Choose a Google Takeout zip or Timeline JSON file first.");
  }

  const nested = await Promise.all(files.map(fileToTimelineFiles));
  return nested.flat();
}

function readNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : undefined;
}

async function getDefaultHome(visits: Array<{ lat: number; lng: number; arrivedAt: string; departedAt: string }>, formData: FormData) {
  const settings = await getSettings();
  const lat = readNumber(formData, "homeLat") ?? (typeof settings.get("home_lat") === "number" ? settings.get("home_lat") as number : undefined);
  const lng = readNumber(formData, "homeLng") ?? (typeof settings.get("home_lng") === "number" ? settings.get("home_lng") as number : undefined);
  if (lat !== undefined && lng !== undefined) {
    return { lat, lng };
  }
  return inferHome(visits) ?? { lat: visits[0]?.lat ?? 0, lng: visits[0]?.lng ?? 0 };
}

function recalculateTrips(preview: ImportPreview, formData: FormData): ImportPreview {
  const home = {
    lat: readNumber(formData, "homeLat") ?? preview.home.lat,
    lng: readNumber(formData, "homeLng") ?? preview.home.lng,
    radiusKm: readNumber(formData, "homeRadiusKm") ?? preview.home.radiusKm,
  };
  const places = new Map(preview.visits.map((visit) => [visit.place.placeKey, visit.place]));
  const selectedTrips = new Set(
    formData.getAll("selectedTrips").map((value) => String(value)),
  );
  const trips = detectTrips(preview.visits, {
    home,
    homeRadiusKm: home.radiusKm,
    maxGapDays: 2,
    placesByKey: places,
  }).map((trip) => ({
    ...trip,
    selected: selectedTrips.size === 0 ? true : selectedTrips.has(trip.tempId),
  }));
  return { ...preview, home, trips };
}

async function buildPreview(formData: FormData): Promise<ImportPreview> {
  const timelineFiles = await readUploadedTimelineFiles(formData);
  const parsed = parseTimelineFiles(timelineFiles);
  if (parsed.visits.length === 0) {
    throw new Error("No place visits were found in those Timeline files.");
  }

  const places = geocodeUniquePlaces(parsed.visits);
  const home = {
    ...(await getDefaultHome(parsed.visits, formData)),
    radiusKm: readNumber(formData, "homeRadiusKm") ?? 100,
  };
  const visits = parsed.visits.map((visit) => ({
    ...visit,
    place: places.get(`${visit.lat.toFixed(3)},${visit.lng.toFixed(3)}`)!,
  }));
  const trips = detectTrips(visits, {
    home,
    homeRadiusKm: home.radiusKm,
    maxGapDays: 2,
    placesByKey: places,
  }).map((trip) => ({ ...trip, selected: true }));

  return {
    filename: timelineFiles.map((file) => file.filename).join(", "),
    formats: [...new Set(parsed.files.map((file) => file.format))],
    visitCount: visits.length,
    home,
    trips,
    visits,
  };
}

function readPreview(formData: FormData) {
  const raw = String(formData.get("previewJson") ?? "");
  if (!raw) {
    throw new Error("Preview data is missing. Upload the Timeline files again.");
  }
  return JSON.parse(raw) as ImportPreview;
}

export async function importAction(_previous: ImportActionState, formData: FormData): Promise<ImportActionState> {
  try {
    const intent = String(formData.get("intent") ?? "preview");
    if (intent === "preview") {
      const preview = await buildPreview(formData);
      return { preview, message: `Parsed ${preview.visitCount} visits and detected ${preview.trips.length} trips.` };
    }
    if (intent === "recalculate") {
      const preview = recalculateTrips(readPreview(formData), formData);
      return { preview, message: `Recalculated ${preview.trips.length} trips with the updated home location.` };
    }
    if (intent === "commit") {
      const preview = recalculateTrips(readPreview(formData), formData);
      const selectedTripIds = formData.getAll("selectedTrips").map((value) => String(value));
      const committed = await persistImport(preview, selectedTripIds);
      return { committed, message: `Imported ${committed.visitCount} visits and ${committed.tripCount} trips.` };
    }
    return { error: "Unknown import action." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Import failed." };
  }
}
