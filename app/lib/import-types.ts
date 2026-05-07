import type { GeocodedPlace } from "@/app/lib/geocode";
import type { DetectedTrip } from "@/app/lib/trip-detector";
import type { ParsedTimelineVisit, TimelineFormat } from "@/app/lib/timeline-parser";

export type PreviewVisit = ParsedTimelineVisit & {
  place: GeocodedPlace;
};

export type ImportPreview = {
  filename: string;
  formats: TimelineFormat[];
  visitCount: number;
  home: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
  trips: Array<DetectedTrip & { selected: boolean }>;
  visits: PreviewVisit[];
};
