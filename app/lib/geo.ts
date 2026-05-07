export type Coordinate = {
  lat: number;
  lng: number;
};

const earthRadiusKm = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function distanceKm(a: Coordinate, b: Coordinate) {
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function placeKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export function daysBetween(start: Date | string, end: Date | string) {
  const started = typeof start === "string" ? new Date(start) : start;
  const ended = typeof end === "string" ? new Date(end) : end;
  return Math.max(1, Math.ceil((ended.getTime() - started.getTime()) / 86_400_000));
}

export function dateOnly(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}
