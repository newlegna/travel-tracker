import { getNearestCity } from "offline-geocode-city";
import { placeKey } from "@/app/lib/geo";

export type GeocodedPlace = {
  lat: number;
  lng: number;
  placeKey: string;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  displayName: string;
};

type CityResult = {
  cityName?: string;
  countryName?: string;
  countryIso2?: string;
};

export function reverseGeocodeCity(lat: number, lng: number): GeocodedPlace {
  const nearest = getNearestCity(lat, lng) as CityResult | undefined;
  const city = nearest?.cityName ?? null;
  const country = nearest?.countryName ?? null;
  const countryCode = nearest?.countryIso2?.toUpperCase() ?? null;
  const displayName = [city, country].filter(Boolean).join(", ") || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;

  return {
    lat,
    lng,
    placeKey: placeKey(lat, lng),
    city,
    region: null,
    country,
    countryCode,
    displayName,
  };
}

export function geocodeUniquePlaces(visits: Array<{ lat: number; lng: number }>) {
  const places = new Map<string, GeocodedPlace>();
  for (const visit of visits) {
    const key = placeKey(visit.lat, visit.lng);
    if (!places.has(key)) {
      places.set(key, reverseGeocodeCity(visit.lat, visit.lng));
    }
  }
  return places;
}
