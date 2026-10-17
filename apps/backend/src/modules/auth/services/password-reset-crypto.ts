import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getBetterAuthSecret } from "../../../lib/auth-secret";

export function hashRecoveryValue(value: string) {
  return createHmac("sha256", getBetterAuthSecret()).update(value).digest("hex");
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
