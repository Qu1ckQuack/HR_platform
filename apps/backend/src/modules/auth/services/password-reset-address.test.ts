import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRecoveryEmail } from "./password-reset-address";

test("normalizes the recovery email", () => {
  assert.equal(parseRecoveryEmail(" HR@Example.com "), "hr@example.com");
});

test("rejects phone numbers, employee codes, IDs, malformed and oversized values", () => {
  for (const value of ["", "user", "not-an-email", "081-234-5678", "EMP00002", "Ed3BVIUd2d4G718yw20MmahySjSfP4GI", `${"a".repeat(245)}@example.test`]) {
    assert.equal(parseRecoveryEmail(value), null, value);
  }
});
