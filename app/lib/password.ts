import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const iterations = 310_000;
const digest = "sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, iterations, 32, digest).toString("base64url");
  return `pbkdf2_${digest}$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationText, salt, expected] = storedHash.split("$");
  if (algorithm !== `pbkdf2_${digest}` || !salt || !expected) {
    return false;
  }
  const parsedIterations = Number(iterationText);
  if (!Number.isInteger(parsedIterations)) {
    return false;
  }
  const actual = pbkdf2Sync(password, salt, parsedIterations, 32, digest);
  const expectedBytes = Buffer.from(expected, "base64url");
  return actual.length === expectedBytes.length && timingSafeEqual(actual, expectedBytes);
}
