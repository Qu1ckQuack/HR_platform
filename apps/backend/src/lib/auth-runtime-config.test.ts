import assert from "node:assert/strict";
import test from "node:test";

import { getAuthRuntimeConfig } from "./auth-runtime-config";

test("uses local origins outside production", () => {
  assert.deepEqual(getAuthRuntimeConfig({ NODE_ENV: "development" }), {
    backendUrl: "http://localhost:4000",
    frontendUrl: "http://localhost:3000",
  });
});

test("requires backend and frontend origins in production", () => {
  assert.throws(() => getAuthRuntimeConfig({ NODE_ENV: "production" }), /BETTER_AUTH_URL is required/);
  assert.throws(() => getAuthRuntimeConfig({
    NODE_ENV: "production",
    BETTER_AUTH_URL: "https://api.example.com",
  }), /FRONTEND_URL is required/);
});

test("normalizes valid production origins", () => {
  assert.deepEqual(getAuthRuntimeConfig({
    NODE_ENV: "production",
    BETTER_AUTH_URL: "https://api.example.com/",
    FRONTEND_URL: "https://hr.example.com",
  }), {
    backendUrl: "https://api.example.com",
    frontendUrl: "https://hr.example.com",
  });
});

test("rejects invalid production origins", () => {
  for (const value of ["localhost:4000", "https://user:pass@api.example.com", "https://api.example.com/path"]) {
    assert.throws(() => getAuthRuntimeConfig({
      NODE_ENV: "production",
      BETTER_AUTH_URL: value,
      FRONTEND_URL: "https://hr.example.com",
    }), /BETTER_AUTH_URL must be an absolute HTTP\(S\) origin/);
  }
});
