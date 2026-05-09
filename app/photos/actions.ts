"use server";

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import heicConvert from "heic-convert";
import { extractExif } from "@/app/lib/exif";
import { reverseGeocodeCity } from "@/app/lib/geocode";
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

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
const HEIC_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);
const MIME_BY_EXTENSION = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function isAllowedPhoto(file: File) {
  const extension = getExtension(file.name);
  return ALLOWED_TYPES.has(file.type.toLowerCase()) || ALLOWED_EXTENSIONS.has(extension);
}

function isHeicPhoto(file: File) {
  const extension = getExtension(file.name);
  return HEIC_TYPES.has(file.type.toLowerCase()) || HEIC_EXTENSIONS.has(extension);
}

async function prepareForDisplay(file: File, buffer: ArrayBuffer) {
  if (isHeicPhoto(file)) {
    const converted = await heicConvert({
      buffer: Buffer.from(buffer),
      format: "JPEG",
      quality: 0.92,
    });
    return {
      buffer: Buffer.from(converted),
      extension: "jpg",
      mimeType: "image/jpeg",
    };
  }

  const extension = getExtension(file.name);
  return {
    buffer: Buffer.from(buffer),
    extension: extension === "jpeg" ? "jpg" : extension || "jpg",
    mimeType: file.type || MIME_BY_EXTENSION.get(extension) || "image/jpeg",
  };
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
      if (!isAllowedPhoto(file)) {
        skipped++;
        continue;
      }

      const buffer = await file.arrayBuffer();
      const exif = extractExif(buffer);
      if (!exif) {
        skipped++;
        continue;
      }

      const displayFile = await prepareForDisplay(file, buffer);
      const storageKey = join(UPLOAD_DIR, `${randomUUID()}.${displayFile.extension}`);
      await writeFile(storageKey, displayFile.buffer);

      const geo = reverseGeocodeCity(exif.lat, exif.lng);

      newPhotos.push({
        filename: file.name,
        mimeType: displayFile.mimeType,
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
