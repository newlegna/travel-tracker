import ExifReader from "exifreader";

export type PhotoExif = {
  lat: number;
  lng: number;
  takenAt: Date | null;
  widthPx: number | null;
  heightPx: number | null;
};

function dmsToDecimal(
  dms: { value: number[] }[] | undefined,
  ref: { value: string[] } | undefined,
): number | null {
  if (!dms || dms.length < 3) return null;
  const degrees = dms[0].value[0] / (dms[0].value[1] || 1);
  const minutes = dms[1].value[0] / (dms[1].value[1] || 1);
  const seconds = dms[2].value[0] / (dms[2].value[1] || 1);
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref?.value?.[0] === "S" || ref?.value?.[0] === "W") {
    decimal = -decimal;
  }
  return decimal;
}

export function extractExif(buffer: ArrayBuffer): PhotoExif | null {
  try {
    const tags = ExifReader.load(buffer, { expanded: true });

    let lat: number | null = null;
    let lng: number | null = null;

    if (tags.gps?.Latitude != null && tags.gps?.Longitude != null) {
      lat = tags.gps.Latitude;
      lng = tags.gps.Longitude;
    } else if (tags.exif) {
      lat = dmsToDecimal(
        tags.exif.GPSLatitude?.value as { value: number[] }[] | undefined,
        tags.exif.GPSLatitudeRef as { value: string[] } | undefined,
      );
      lng = dmsToDecimal(
        tags.exif.GPSLongitude?.value as { value: number[] }[] | undefined,
        tags.exif.GPSLongitudeRef as { value: string[] } | undefined,
      );
    }

    if (lat == null || lng == null || (lat === 0 && lng === 0)) {
      return null;
    }

    let takenAt: Date | null = null;
    const dateStr =
      tags.exif?.DateTimeOriginal?.description ??
      tags.exif?.DateTime?.description;
    if (dateStr) {
      const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
      const parsed = new Date(normalized);
      if (!isNaN(parsed.getTime())) {
        takenAt = parsed;
      }
    }

    const widthPx =
      (tags.exif?.PixelXDimension?.value as number) ??
      (tags.file?.["Image Width"]?.value as number) ??
      null;
    const heightPx =
      (tags.exif?.PixelYDimension?.value as number) ??
      (tags.file?.["Image Height"]?.value as number) ??
      null;

    return { lat, lng, takenAt, widthPx, heightPx };
  } catch {
    return null;
  }
}
