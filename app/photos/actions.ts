"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { extractExif } from "@/app/lib/exif";
import { reverseGeocodeCity } from "@/app/lib/geocode";
import { isSupportedPhoto, preparePhotoForStorage } from "@/app/lib/photo-image";
import { insertPhotos, deletePhoto as deletePhotoQuery } from "@/app/db/queries";
import { revalidatePath } from "next/cache";
import type { NewPhoto } from "@/app/db/schema";

const UPLOAD_DIR = join(process.cwd(), ".photo-uploads");

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
      if (!isSupportedPhoto(file.type, file.name)) {
        skipped++;
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);
      const exif = extractExif(arrayBuffer);
      if (!exif) {
        skipped++;
        continue;
      }

      let storedPhoto: Awaited<ReturnType<typeof preparePhotoForStorage>>;
      try {
        storedPhoto = await preparePhotoForStorage(inputBuffer, file.type, file.name);
      } catch {
        skipped++;
        continue;
      }

      const storageKey = join(UPLOAD_DIR, `${randomUUID()}.${storedPhoto.extension}`);
      await writeFile(storageKey, storedPhoto.buffer);

      const geo = reverseGeocodeCity(exif.lat, exif.lng);

      newPhotos.push({
        filename: file.name,
        mimeType: storedPhoto.mimeType,
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

async function deleteStoredPhoto(storageKey: string) {
  try {
    await unlink(storageKey);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

export async function deletePhotoAction(formData: FormData) {
  const id = Number(formData.get("photoId"));
  if (Number.isFinite(id)) {
    const deleted = await deletePhotoQuery(id);
    if (deleted) {
      await deleteStoredPhoto(deleted.storageKey);
      revalidatePath("/photos");
    }
  }
}
