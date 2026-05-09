import { describe, expect, it } from "vitest";
import {
  JPEG_MIME_TYPE,
  isHeicImage,
  isSupportedPhoto,
  preparePhotoForResponse,
  preparePhotoForStorage,
} from "./photo-image";

describe("photo image helpers", () => {
  it("detects HEIC and HEIF images by MIME type or filename", () => {
    expect(isHeicImage("image/heic")).toBe(true);
    expect(isHeicImage("image/heif")).toBe(true);
    expect(isHeicImage("", "IMG_1234.HEIC")).toBe(true);
    expect(isHeicImage("application/octet-stream", "IMG_1234.heif")).toBe(true);
    expect(isHeicImage("image/jpeg", "photo.jpg")).toBe(false);
  });

  it("allows supported browser images and HEIC images", () => {
    expect(isSupportedPhoto("image/jpeg", "photo.jpg")).toBe(true);
    expect(isSupportedPhoto("image/png", "photo.png")).toBe(true);
    expect(isSupportedPhoto("image/webp", "photo.webp")).toBe(true);
    expect(isSupportedPhoto("", "photo.heic")).toBe(true);
    expect(isSupportedPhoto("application/pdf", "doc.pdf")).toBe(false);
  });

  it("keeps browser-compatible uploads unchanged", async () => {
    const buffer = Buffer.from("image");
    const prepared = await preparePhotoForStorage(buffer, "image/png", "photo.png");

    expect(prepared.buffer).toBe(buffer);
    expect(prepared.extension).toBe("png");
    expect(prepared.mimeType).toBe("image/png");
  });

  it("keeps browser-compatible responses unchanged", async () => {
    const buffer = Buffer.from("image");
    const prepared = await preparePhotoForResponse(buffer, "image/jpeg", "photo.jpg");

    expect(prepared.buffer).toBe(buffer);
    expect(prepared.mimeType).toBe(JPEG_MIME_TYPE);
  });
});
