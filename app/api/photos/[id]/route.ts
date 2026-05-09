import { NextResponse, type NextRequest } from "next/server";
import { getPhoto } from "@/app/db/queries";
import { preparePhotoForResponse } from "@/app/lib/photo-image";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photoId = Number(id);
  if (!Number.isFinite(photoId)) {
    return NextResponse.json({ error: "Invalid photo ID" }, { status: 400 });
  }

  const photo = await getPhoto(photoId);
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const filePath = photo.storageKey;
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const buffer = await readFile(filePath);
  const image = await preparePhotoForResponse(buffer, photo.mimeType, photo.filename);
  return new NextResponse(toArrayBuffer(image.buffer), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
