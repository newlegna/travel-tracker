import { dateOnly, daysBetween, distanceKm, type Coordinate } from "@/app/lib/geo";
import type { GeocodedPlace } from "@/app/lib/geocode";

export type DetectorVisit = {
  lat: number;
  lng: number;
  arrivedAt: string;
  departedAt: string;
};

export type DetectedTrip = {
  tempId: string;
  name: string;
  startDate: string;
  endDate: string;
  primaryCountryCode: string | null;
  visitIndexes: number[];
  days: number;
};

export type TripDetectorOptions = {
  home: Coordinate;
  homeRadiusKm?: number;
  maxGapDays?: number;
  placesByKey?: Map<string, GeocodedPlace>;
};

function mostCommon(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) {
      continue;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function buildTripName(countryCode: string | null, startDate: string, endDate: string) {
  const year = startDate.slice(0, 4);
  const dateLabel = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  return countryCode ? `${countryCode} trip, ${year}` : `Trip ${dateLabel}`;
}

export function inferHome(visits: DetectorVisit[]): Coordinate | null {
  if (visits.length === 0) {
    return null;
  }
  const buckets = new Map<string, { lat: number; lng: number; count: number }>();
  for (const visit of visits) {
    const key = `${visit.lat.toFixed(2)},${visit.lng.toFixed(2)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, { lat: visit.lat, lng: visit.lng, count: 1 });
    }
  }
  const bucket = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
  return bucket ? { lat: bucket.lat, lng: bucket.lng } : null;
}

export function detectTrips(visits: DetectorVisit[], options: TripDetectorOptions) {
  const homeRadiusKm = options.homeRadiusKm ?? 100;
  const maxGapMs = (options.maxGapDays ?? 2) * 86_400_000;
  const trips: DetectedTrip[] = [];
  let current: number[] = [];

  const finishCurrent = () => {
    if (current.length === 0) {
      return;
    }
    const tripVisits = current.map((index) => visits[index]);
    const startDate = dateOnly(tripVisits[0].arrivedAt);
    const endDate = dateOnly(tripVisits[tripVisits.length - 1].departedAt);
    const countryCode = mostCommon(
      current.map((index) => {
        const key = `${visits[index].lat.toFixed(3)},${visits[index].lng.toFixed(3)}`;
        return options.placesByKey?.get(key)?.countryCode;
      }),
    );
    trips.push({
      tempId: `trip-${trips.length + 1}`,
      name: buildTripName(countryCode, startDate, endDate),
      startDate,
      endDate,
      primaryCountryCode: countryCode,
      visitIndexes: current,
      days: daysBetween(startDate, endDate),
    });
    current = [];
  };

  visits.forEach((visit, index) => {
    const isAway = distanceKm(options.home, visit) > homeRadiusKm;
    if (!isAway) {
      finishCurrent();
      return;
    }

    const previousIndex = current[current.length - 1];
    if (previousIndex === undefined) {
      current.push(index);
      return;
    }

    const previous = visits[previousIndex];
    const gap = new Date(visit.arrivedAt).getTime() - new Date(previous.departedAt).getTime();
    if (gap <= maxGapMs) {
      current.push(index);
    } else {
      finishCurrent();
      current.push(index);
    }
  });

  finishCurrent();
  return trips;
}
