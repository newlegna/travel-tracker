import { NextResponse, type NextRequest } from "next/server";
import { getPhoto } from "@/app/db/queries";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

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
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
