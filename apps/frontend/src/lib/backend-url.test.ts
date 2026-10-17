import assert from "node:assert/strict";
import test from "node:test";

import { getBackendUrl } from "./backend-url";

test("uses localhost when developing without BACKEND_URL", () => {
  assert.equal(getBackendUrl({}), "http://localhost:4000");
});

test("requires BACKEND_URL on Vercel", () => {
  assert.throws(() => getBackendUrl({ VERCEL: "1" }), /BACKEND_URL must be configured/);
  assert.throws(() => getBackendUrl({ VERCEL: "1", BACKEND_URL: " " }), /BACKEND_URL must be configured/);
});

test("normalizes a valid backend origin", () => {
  assert.equal(getBackendUrl({ BACKEND_URL: " https://api.example.com/ " }), "https://api.example.com");
});

test("rejects backend URLs with paths or credentials", () => {
  for (const value of ["https://api.example.com/path", "https://user:pass@api.example.com"]) {
    assert.throws(() => getBackendUrl({ BACKEND_URL: value }), /BACKEND_URL must be an absolute HTTP\(S\) origin/);
  }
});
