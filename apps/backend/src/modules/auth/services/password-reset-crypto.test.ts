import assert from "node:assert/strict";
import { test } from "node:test";
import { hashRecoveryValue } from "./password-reset-crypto";

test("hashes recovery values with the configured local Better Auth fallback", () => {
  const originalSecret = process.env.BETTER_AUTH_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;
  delete process.env.BETTER_AUTH_SECRET;
  process.env.NODE_ENV = "development";

  try {
    assert.match(hashRecoveryValue("test-value"), /^[a-f0-9]{64}$/);
  } finally {
    if (originalSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = originalSecret;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test("does not allow recovery-value hashing without a production secret", () => {
  const originalSecret = process.env.BETTER_AUTH_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;
  delete process.env.BETTER_AUTH_SECRET;
  process.env.NODE_ENV = "production";

  try {
    assert.throws(() => hashRecoveryValue("test-value"), /BETTER_AUTH_SECRET must be set in production/);
  } finally {
    if (originalSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = originalSecret;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
