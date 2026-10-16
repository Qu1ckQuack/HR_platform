import assert from "node:assert/strict";
import { test } from "node:test";
import { getResendConfiguration } from "./password-reset-email";

test("requires the Resend API key and sender", () => {
  assert.deepEqual(getResendConfiguration({ RESEND_API_KEY: " key ", RESEND_FROM: "noreply@example.test" }), {
    apiKey: "key",
    from: "noreply@example.test",
  });
  assert.throws(() => getResendConfiguration({}), /RESEND_API_KEY and RESEND_FROM are required/);
});
