import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not configured");
  return value;
}

export function hashRecoveryValue(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function matchesRecoveryValue(value: string, expectedHash: string) {
  const actual = Buffer.from(hashRecoveryValue(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createEmailCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function createRecoveryToken() {
  return randomBytes(32).toString("base64url");
}
