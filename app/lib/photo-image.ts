import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type HeicConvert = (options: {
  buffer: Buffer;
  format: "JPEG";
  quality: number;
}) => Promise<ArrayBuffer | Buffer | Uint8Array>;

const convertHeic = require("heic-convert") as HeicConvert;

const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  ...HEIC_MIME_TYPES,
]);

const MIME_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export const JPEG_MIME_TYPE = "image/jpeg";

function normalizedMimeType(mimeType: string) {
  return mimeType.toLowerCase().split(";")[0].trim();
}

function isJpegBuffer(buffer: Buffer) {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPngBuffer(buffer: Buffer) {
  return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function isWebpBuffer(buffer: Buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function isHeicBuffer(buffer: Buffer) {
  if (buffer.length < 12) {
    return false;
  }

  const boxType = buffer.subarray(4, 8).toString("ascii");
  if (boxType !== "ftyp") {
    return false;
  }

  const brands = buffer.subarray(8, Math.min(buffer.length, 64)).toString("ascii");
  return ["heic", "heix", "hevc", "hevx", "heif", "heim", "heis", "mif1", "msf1"].some((brand) =>
    brands.includes(brand),
  );
}

function fileExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
}

export function isHeicImage(mimeType: string, filename = "") {
  const normalized = normalizedMimeType(mimeType);
  return HEIC_MIME_TYPES.has(normalized) || /\.(heic|heif)$/i.test(filename);
}

export function isSupportedPhoto(mimeType: string, filename: string) {
  const normalized = normalizedMimeType(mimeType);
  return SUPPORTED_MIME_TYPES.has(normalized) || isHeicImage(mimeType, filename);
}

async function convertHeicToJpeg(buffer: Buffer) {
  const output = await convertHeic({
    buffer,
    format: "JPEG",
    quality: 0.9,
  });
  if (output instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(output));
  }
  return Buffer.from(output);
}

export async function preparePhotoForStorage(buffer: Buffer, mimeType: string, filename: string) {
  if (isHeicImage(mimeType, filename)) {
    return {
      buffer: await convertHeicToJpeg(buffer),
      extension: "jpg",
      mimeType: JPEG_MIME_TYPE,
    };
  }

  const normalized = normalizedMimeType(mimeType);
  return {
    buffer,
    extension: MIME_EXTENSIONS.get(normalized) ?? fileExtension(filename),
    mimeType: normalized || JPEG_MIME_TYPE,
  };
}

export async function preparePhotoForResponse(buffer: Buffer, mimeType: string, filename: string) {
  if (isHeicBuffer(buffer)) {
    return {
      buffer: await convertHeicToJpeg(buffer),
      mimeType: JPEG_MIME_TYPE,
    };
  }

  if (isJpegBuffer(buffer)) {
    return { buffer, mimeType: JPEG_MIME_TYPE };
  }

  if (isPngBuffer(buffer)) {
    return { buffer, mimeType: "image/png" };
  }

  if (isWebpBuffer(buffer)) {
    return { buffer, mimeType: "image/webp" };
  }

  return {
    buffer,
    mimeType: normalizedMimeType(mimeType) || JPEG_MIME_TYPE,
  };
}
