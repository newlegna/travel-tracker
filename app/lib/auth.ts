const encoder = new TextEncoder();

export const authCookieName = "travel_tracker_session";

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of array) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) {
    return false;
  }
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }
  return result === 0;
}

export function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.APP_PASSWORD || "dev-only-change-me";
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signValue(value: string, secret = getSessionSecret()) {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return `${value}.${toBase64Url(signature)}`;
}

export async function verifySignedValue(signedValue: string | undefined, secret = getSessionSecret()) {
  if (!signedValue) {
    return null;
  }
  const separator = signedValue.lastIndexOf(".");
  if (separator < 1) {
    return null;
  }
  const value = signedValue.slice(0, separator);
  const signature = signedValue.slice(separator + 1);
  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signature),
    encoder.encode(value),
  );
  return valid ? value : null;
}

export async function createSessionCookieValue() {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
  return signValue(`authenticated:${expiresAt}`);
}

export async function isValidSessionCookie(cookieValue: string | undefined) {
  const value = await verifySignedValue(cookieValue);
  if (!value?.startsWith("authenticated:")) {
    return false;
  }
  const expiresAt = Number(value.split(":")[1]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function passwordMatches(password: string, configuredPassword = process.env.APP_PASSWORD) {
  if (!configuredPassword) {
    return process.env.NODE_ENV !== "production";
  }
  return timingSafeEqual(password, configuredPassword);
}
