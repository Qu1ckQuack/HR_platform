import assert from "node:assert/strict";
import test from "node:test";
import { maskSensitiveValue, normalizeNationalIdFormatting, preserveSensitiveValue } from "./sensitive-value";

test("masks private digits while preserving the last four", () => {
  assert.equal(maskSensitiveValue("123-456-7890"), "xxxxxx7890");
});

test("preserves stored data for blank or matching formatted mask input", () => {
  assert.equal(preserveSensitiveValue("", "1234567890"), "1234567890");
  assert.equal(preserveSensitiveValue("xxxxxx7890", "1234567890"), "1234567890");
  assert.equal(preserveSensitiveValue("xxx-xxx-7890", "1234567890"), "1234567890");
});

test("does not silently ignore a different malformed value containing a mask character", () => {
  assert.equal(preserveSensitiveValue("12x345", "1234567890"), "12x345");
});

test("normalizes only national ID separators, leaving invalid characters for validation", () => {
  assert.equal(normalizeNationalIdFormatting("1-2345-67890-12-3"), "1234567890123");
  assert.equal(normalizeNationalIdFormatting("1234567890123x"), "1234567890123x");
});
