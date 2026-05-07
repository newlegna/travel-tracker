export type TimelineFormat = "old-google-timeline" | "new-google-timeline";

export type ParsedTimelineVisit = {
  lat: number;
  lng: number;
  arrivedAt: string;
  departedAt: string;
  source: "google-timeline";
  format: TimelineFormat;
  filename: string;
  googlePlaceId?: string;
  displayName?: string;
  raw: unknown;
};

export type ParsedTimelineFile = {
  filename: string;
  format: TimelineFormat;
  visits: ParsedTimelineVisit[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseDate(value: unknown) {
  const text = stringValue(value);
  if (!text) {
    return undefined;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function parseGeoUri(value: unknown) {
  const text = stringValue(value);
  if (!text?.startsWith("geo:")) {
    return undefined;
  }
  const [latText, lngText] = text.slice(4).split(",");
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return undefined;
  }
  return { lat, lng };
}

function parseOldFile(root: UnknownRecord, filename: string): ParsedTimelineFile {
  const timelineObjects = Array.isArray(root.timelineObjects) ? root.timelineObjects : [];
  const visits: ParsedTimelineVisit[] = [];

  for (const object of timelineObjects) {
    if (!isRecord(object) || !isRecord(object.placeVisit)) {
      continue;
    }
    const placeVisit = object.placeVisit;
    const location = isRecord(placeVisit.location) ? placeVisit.location : undefined;
    const duration = isRecord(placeVisit.duration) ? placeVisit.duration : undefined;
    const latE7 = numberValue(location?.latitudeE7);
    const lngE7 = numberValue(location?.longitudeE7);
    const arrivedAt = parseDate(duration?.startTimestamp);
    const departedAt = parseDate(duration?.endTimestamp);

    if (latE7 === undefined || lngE7 === undefined || !arrivedAt || !departedAt) {
      continue;
    }

    visits.push({
      lat: latE7 / 10_000_000,
      lng: lngE7 / 10_000_000,
      arrivedAt,
      departedAt,
      source: "google-timeline",
      format: "old-google-timeline",
      filename,
      googlePlaceId: stringValue(location?.placeId),
      displayName: stringValue(location?.name) ?? stringValue(location?.address),
      raw: placeVisit,
    });
  }

  return { filename, format: "old-google-timeline", visits };
}

function getNewVisitPayload(item: unknown) {
  if (!isRecord(item)) {
    return undefined;
  }
  if (isRecord(item.visit)) {
    return item.visit;
  }
  return undefined;
}

function parseNewFile(root: unknown[], filename: string): ParsedTimelineFile {
  const visits: ParsedTimelineVisit[] = [];

  for (const item of root) {
    if (!isRecord(item)) {
      continue;
    }
    const visit = getNewVisitPayload(item);
    const topCandidate = isRecord(visit?.topCandidate) ? visit.topCandidate : undefined;
    const coordinate = parseGeoUri(topCandidate?.placeLocation);
    const arrivedAt =
      parseDate(item.startTime) ??
      parseDate(item.startTimestamp) ??
      parseDate(visit?.startTime) ??
      parseDate(visit?.startTimestamp);
    const departedAt =
      parseDate(item.endTime) ??
      parseDate(item.endTimestamp) ??
      parseDate(visit?.endTime) ??
      parseDate(visit?.endTimestamp);

    if (!coordinate || !arrivedAt || !departedAt) {
      continue;
    }

    visits.push({
      ...coordinate,
      arrivedAt,
      departedAt,
      source: "google-timeline",
      format: "new-google-timeline",
      filename,
      googlePlaceId: stringValue(topCandidate?.placeId),
      displayName: stringValue(topCandidate?.placeName) ?? stringValue(topCandidate?.semanticType),
      raw: item,
    });
  }

  return { filename, format: "new-google-timeline", visits };
}

export function parseTimelineJson(jsonText: string, filename = "Timeline.json"): ParsedTimelineFile {
  const root = JSON.parse(jsonText) as unknown;
  if (isRecord(root) && Array.isArray(root.timelineObjects)) {
    return parseOldFile(root, filename);
  }
  if (Array.isArray(root)) {
    return parseNewFile(root, filename);
  }
  throw new Error(`${filename} is not a supported Google Timeline format.`);
}

export function parseTimelineFiles(files: Array<{ filename: string; contents: string }>) {
  const parsed = files.map((file) => parseTimelineJson(file.contents, file.filename));
  return {
    files: parsed,
    visits: parsed
      .flatMap((file) => file.visits)
      .sort((a, b) => new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime()),
  };
}
