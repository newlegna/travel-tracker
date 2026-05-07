import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDatabase, requireDatabase } from "@/app/db";
import { imports, places, settings, trips, visits, type NewPlace, type NewVisit } from "@/app/db/schema";
import type { ImportPreview } from "@/app/lib/import-types";
import { dateOnly, daysBetween, placeKey } from "@/app/lib/geo";

export type PlaceSummary = {
  id: number;
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  displayName: string | null;
  googlePlaceId: string | null;
};

export type TripSummary = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  primaryCountryCode: string | null;
  notes: string | null;
};

export type VisitSummary = {
  id: number;
  arrivedAt: string;
  departedAt: string;
  source: string;
  raw: unknown;
  place: PlaceSummary;
  trip: TripSummary | null;
};

export type YearSummary = {
  year: number;
  countries: number;
  daysAway: number;
  tripCount: number;
  visitCount: number;
  points: Array<{ lat: number; lng: number; label: string }>;
};

function serializeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function serializeDateOnly(value: Date | string) {
  return typeof value === "string" ? value : value.toISOString().slice(0, 10);
}

function rowToVisit(row: {
  visit: typeof visits.$inferSelect;
  place: typeof places.$inferSelect;
  trip: typeof trips.$inferSelect | null;
}): VisitSummary {
  return {
    id: row.visit.id,
    arrivedAt: serializeDate(row.visit.arrivedAt),
    departedAt: serializeDate(row.visit.departedAt),
    source: row.visit.source,
    raw: row.visit.raw,
    place: {
      id: row.place.id,
      lat: row.place.lat,
      lng: row.place.lng,
      city: row.place.city,
      region: row.place.region,
      country: row.place.country,
      countryCode: row.place.countryCode,
      displayName: row.place.displayName,
      googlePlaceId: row.place.googlePlaceId,
    },
    trip: row.trip
      ? {
          id: row.trip.id,
          name: row.trip.name,
          startDate: serializeDateOnly(row.trip.startDate),
          endDate: serializeDateOnly(row.trip.endDate),
          primaryCountryCode: row.trip.primaryCountryCode,
          notes: row.trip.notes,
        }
      : null,
  };
}

export async function getVisitsWithPlaces() {
  const db = getDatabase();
  if (!db) {
    return [];
  }
  const rows = await db
    .select({ visit: visits, place: places, trip: trips })
    .from(visits)
    .innerJoin(places, eq(visits.placeId, places.id))
    .leftJoin(trips, eq(visits.tripId, trips.id))
    .orderBy(asc(visits.arrivedAt));
  return rows.map(rowToVisit);
}

export async function getTrips() {
  const db = getDatabase();
  if (!db) {
    return [];
  }
  const rows = await db.select().from(trips).orderBy(desc(trips.startDate));
  return rows.map((trip) => ({
    id: trip.id,
    name: trip.name,
    startDate: serializeDateOnly(trip.startDate),
    endDate: serializeDateOnly(trip.endDate),
    primaryCountryCode: trip.primaryCountryCode,
    notes: trip.notes,
  }));
}

export async function getPlaces() {
  const db = getDatabase();
  if (!db) {
    return [];
  }
  return db.select().from(places).orderBy(asc(places.displayName));
}

export async function getSettings() {
  const db = getDatabase();
  if (!db) {
    return new Map<string, unknown>();
  }
  const rows = await db.select().from(settings);
  return new Map(rows.map((row) => [row.key, row.value]));
}

export async function setSetting(key: string, value: unknown) {
  const db = requireDatabase();
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function deleteAllData() {
  const db = requireDatabase();
  await db.delete(visits);
  await db.delete(trips);
  await db.delete(places);
  await db.delete(imports);
}

export async function getYears() {
  const allVisits = await getVisitsWithPlaces();
  const tripsByYear = new Map<number, Set<number>>();
  const summaries = new Map<number, YearSummary>();

  for (const visit of allVisits) {
    const year = new Date(visit.arrivedAt).getUTCFullYear();
    const summary =
      summaries.get(year) ??
      ({
        year,
        countries: 0,
        daysAway: 0,
        tripCount: 0,
        visitCount: 0,
        points: [],
      } satisfies YearSummary);
    summary.visitCount += 1;
    summary.points.push({
      lat: visit.place.lat,
      lng: visit.place.lng,
      label: visit.place.displayName ?? "Unknown place",
    });
    summaries.set(year, summary);

    if (visit.trip) {
      const set = tripsByYear.get(year) ?? new Set<number>();
      set.add(visit.trip.id);
      tripsByYear.set(year, set);
    }
  }

  for (const summary of summaries.values()) {
    const yearVisits = allVisits.filter((visit) => new Date(visit.arrivedAt).getUTCFullYear() === summary.year);
    summary.countries = new Set(yearVisits.map((visit) => visit.place.countryCode).filter(Boolean)).size;
    const tripIds = tripsByYear.get(summary.year) ?? new Set<number>();
    summary.tripCount = tripIds.size;
    summary.daysAway = [...tripIds].reduce((days, tripId) => {
      const trip = yearVisits.find((visit) => visit.trip?.id === tripId)?.trip;
      return trip ? days + daysBetween(trip.startDate, trip.endDate) : days;
    }, 0);
  }

  return [...summaries.values()].sort((a, b) => b.year - a.year);
}

export async function getYear(year: number) {
  const visitsForYear = (await getVisitsWithPlaces()).filter(
    (visit) => new Date(visit.arrivedAt).getUTCFullYear() === year,
  );
  const tripMap = new Map<number, TripSummary>();
  for (const visit of visitsForYear) {
    if (visit.trip) {
      tripMap.set(visit.trip.id, visit.trip);
    }
  }
  const countries = new Set(visitsForYear.map((visit) => visit.place.countryCode).filter(Boolean));
  const tripList = [...tripMap.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const longestTrip = tripList
    .map((trip) => ({ trip, days: daysBetween(trip.startDate, trip.endDate) }))
    .sort((a, b) => b.days - a.days)[0];
  const topPlaces = [...visitsForYear.reduce((map, visit) => {
    const current = map.get(visit.place.id) ?? { place: visit.place, count: 0 };
    current.count += 1;
    map.set(visit.place.id, current);
    return map;
  }, new Map<number, { place: PlaceSummary; count: number }>()).values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    visits: visitsForYear,
    trips: tripList,
    stats: {
      countries: countries.size,
      daysAway: tripList.reduce((total, trip) => total + daysBetween(trip.startDate, trip.endDate), 0),
      longestTrip,
      topPlaces,
    },
  };
}

export async function getTrip(id: number) {
  const trip = (await getTrips()).find((item) => item.id === id) ?? null;
  if (!trip) {
    return null;
  }
  const tripVisits = (await getVisitsWithPlaces()).filter((visit) => visit.trip?.id === id);
  return { trip, visits: tripVisits };
}

export async function getPlace(id: number) {
  const placeVisits = (await getVisitsWithPlaces()).filter((visit) => visit.place.id === id);
  return {
    place: placeVisits[0]?.place ?? null,
    visits: placeVisits,
  };
}

export async function getAllTime() {
  const visitsAll = await getVisitsWithPlaces();
  const years = await getYears();
  return {
    visits: visitsAll,
    years,
    countries: new Set(visitsAll.map((visit) => visit.place.countryCode).filter(Boolean)).size,
    places: new Set(visitsAll.map((visit) => visit.place.id)).size,
  };
}

async function upsertPlaces(preview: ImportPreview) {
  const db = requireDatabase();
  const uniquePlaces = new Map<string, NewPlace>();
  for (const visit of preview.visits) {
    uniquePlaces.set(visit.place.placeKey, {
      lat: visit.place.lat,
      lng: visit.place.lng,
      placeKey: visit.place.placeKey,
      city: visit.place.city,
      region: visit.place.region,
      country: visit.place.country,
      countryCode: visit.place.countryCode,
      displayName: visit.displayName ?? visit.place.displayName,
      googlePlaceId: visit.googlePlaceId,
    });
  }
  if (uniquePlaces.size > 0) {
    await db
      .insert(places)
      .values([...uniquePlaces.values()])
      .onConflictDoNothing({ target: places.placeKey });
  }
  const keys = [...uniquePlaces.keys()];
  if (keys.length === 0) {
    return new Map<string, number>();
  }
  const rows = await db.select({ id: places.id, placeKey: places.placeKey }).from(places).where(inArray(places.placeKey, keys));
  return new Map(rows.map((row) => [row.placeKey, row.id]));
}

export async function persistImport(preview: ImportPreview, selectedTripIds: string[]) {
  const db = requireDatabase();
  const selected = new Set(selectedTripIds);
  const placeIdsByKey = await upsertPlaces(preview);
  const visitIndexToTripId = new Map<number, number>();

  for (const detectedTrip of preview.trips.filter((trip) => selected.has(trip.tempId))) {
    const [insertedTrip] = await db
      .insert(trips)
      .values({
        name: detectedTrip.name,
        startDate: detectedTrip.startDate,
        endDate: detectedTrip.endDate,
        primaryCountryCode: detectedTrip.primaryCountryCode,
        notes: null,
      })
      .returning({ id: trips.id });
    for (const index of detectedTrip.visitIndexes) {
      visitIndexToTripId.set(index, insertedTrip.id);
    }
  }

  const newVisits: NewVisit[] = preview.visits.flatMap((visit, index) => {
    const placeId = placeIdsByKey.get(placeKey(visit.lat, visit.lng));
    if (!placeId) {
      return [];
    }
    return [
      {
        placeId,
        arrivedAt: new Date(visit.arrivedAt),
        departedAt: new Date(visit.departedAt),
        source: visit.source,
        tripId: visitIndexToTripId.get(index),
        raw: visit.raw,
      },
    ];
  });

  if (newVisits.length > 0) {
    await db.insert(visits).values(newVisits);
  }
  await db.insert(imports).values({
    filename: preview.filename,
    format: preview.formats.join(", "),
    visitCount: newVisits.length,
  });
  await setSetting("home_lat", preview.home.lat);
  await setSetting("home_lng", preview.home.lng);
  await setSetting("home_radius_km", preview.home.radiusKm);

  return { visitCount: newVisits.length, tripCount: selected.size };
}

export async function exportJson() {
  const [visitsAll, tripsAll, placesAll, settingsAll] = await Promise.all([
    getVisitsWithPlaces(),
    getTrips(),
    getPlaces(),
    getSettings(),
  ]);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      visits: visitsAll,
      trips: tripsAll,
      places: placesAll,
      settings: Object.fromEntries(settingsAll),
    },
    null,
    2,
  );
}

export async function updateTrip(id: number, values: { name?: string; notes?: string | null }) {
  const db = requireDatabase();
  await db.update(trips).set(values).where(eq(trips.id, id));
}

export async function mergeTrips(sourceId: number, targetId: number) {
  const db = requireDatabase();
  await db.update(visits).set({ tripId: targetId }).where(eq(visits.tripId, sourceId));
  await db.delete(trips).where(eq(trips.id, sourceId));
}

export async function splitTripAtVisit(tripId: number, visitId: number) {
  const db = requireDatabase();
  const tripVisits = await db
    .select()
    .from(visits)
    .where(eq(visits.tripId, tripId))
    .orderBy(asc(visits.arrivedAt));
  const splitIndex = tripVisits.findIndex((visit) => visit.id === visitId);
  if (splitIndex <= 0) {
    return;
  }
  const secondHalf = tripVisits.slice(splitIndex);
  const [newTrip] = await db
    .insert(trips)
    .values({
      name: `Split trip from ${dateOnly(secondHalf[0].arrivedAt)}`,
      startDate: dateOnly(secondHalf[0].arrivedAt),
      endDate: dateOnly(secondHalf[secondHalf.length - 1].departedAt),
      primaryCountryCode: null,
      notes: null,
    })
    .returning({ id: trips.id });
  await db.update(visits).set({ tripId: newTrip.id }).where(inArray(visits.id, secondHalf.map((visit) => visit.id)));
}

export async function databaseReady() {
  const db = getDatabase();
  if (!db) {
    return false;
  }
  await db.execute(sql`select 1`);
  return true;
}
