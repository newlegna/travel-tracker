"use server";

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { extractExif } from "@/app/lib/exif";
import { insertPhotos, deletePhoto as deletePhotoQuery } from "@/app/db/queries";
import { revalidatePath } from "next/cache";
import type { NewPhoto } from "@/app/db/schema";

const UPLOAD_DIR = join(process.cwd(), ".photo-uploads");

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function geocodeOffline(lat: number, lng: number) {
  try {
    const { geocode } = require("offline-geocode-city"); // dynamic require for server-only module
    const result = geocode(lat, lng);
    if (result) {
      return {
        city: result.city ?? result.name ?? null,
        country: result.country ?? null,
        countryCode: result.countryCode ?? null,
      };
    }
  } catch {
    // offline-geocode-city not available at import time in some contexts
  }
  return { city: null, country: null, countryCode: null };
}

export type PhotoUploadState = {
  error?: string;
  message?: string;
  uploaded?: number;
  skipped?: number;
};

export async function uploadPhotosAction(
  _previous: PhotoUploadState,
  formData: FormData,
): Promise<PhotoUploadState> {
  try {
    const files = formData
      .getAll("photos")
      .filter((v): v is File => v instanceof File && v.size > 0);

    if (files.length === 0) {
      return { error: "Select at least one photo to upload." };
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const newPhotos: NewPhoto[] = [];
    let skipped = 0;

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        skipped++;
        continue;
      }

      const buffer = await file.arrayBuffer();
      const exif = extractExif(buffer);
      if (!exif) {
        skipped++;
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const storageKey = join(UPLOAD_DIR, `${randomUUID()}.${ext}`);
      await writeFile(storageKey, Buffer.from(buffer));

      const geo = geocodeOffline(exif.lat, exif.lng);

      newPhotos.push({
        filename: file.name,
        mimeType: file.type,
        lat: exif.lat,
        lng: exif.lng,
        city: geo.city,
        country: geo.country,
        countryCode: geo.countryCode,
        takenAt: exif.takenAt,
        storageKey,
        widthPx: exif.widthPx,
        heightPx: exif.heightPx,
      });
    }

    if (newPhotos.length === 0) {
      return { error: `No photos had GPS data. ${skipped} file(s) were skipped (no location or unsupported format).` };
    }

    await insertPhotos(newPhotos);
    revalidatePath("/photos");

    return {
      uploaded: newPhotos.length,
      skipped,
      message: `Uploaded ${newPhotos.length} photo${newPhotos.length === 1 ? "" : "s"} with GPS data.${skipped > 0 ? ` ${skipped} skipped (no GPS or unsupported format).` : ""}`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed." };
  }
}

export async function deletePhotoAction(formData: FormData) {
  const id = Number(formData.get("photoId"));
  if (Number.isFinite(id)) {
    await deletePhotoQuery(id);
    revalidatePath("/photos");
  }
}
