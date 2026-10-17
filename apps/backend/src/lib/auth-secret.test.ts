import assert from "node:assert/strict";
import { test } from "node:test";
import { getBetterAuthSecret } from "./auth-secret";

test("uses the configured Better Auth secret when present", () => {
  assert.equal(getBetterAuthSecret({ BETTER_AUTH_SECRET: "configured-secret", NODE_ENV: "development" }), "configured-secret");
});

test("uses the same local development fallback outside production", () => {
  assert.equal(getBetterAuthSecret({ NODE_ENV: "development" }), "local-development-secret-change-me-32-chars");
  assert.equal(getBetterAuthSecret({}), "local-development-secret-change-me-32-chars");
});

test("requires an explicit secret in production", () => {
  assert.throws(() => getBetterAuthSecret({ NODE_ENV: "production" }), /BETTER_AUTH_SECRET must be set in production/);
  assert.throws(() => getBetterAuthSecret({ BETTER_AUTH_SECRET: "", NODE_ENV: "development" }), /BETTER_AUTH_SECRET must be set in production/);
});

test("provides the build-only secret during a production build", () => {
  assert.equal(
    getBetterAuthSecret({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" }),
    "build-only-secret-set-the-environment-variable",
  );
});
