import assert from "node:assert/strict";
import { test } from "node:test";
import { getSafeBackendErrorFields, sanitizeBackendLogMessage, serializeBackendLog } from "./backend-logger";

test("redacts emails, secrets, API keys, OTPs, URL credentials, and line breaks", () => {
  const message = sanitizeBackendLogMessage(
    "Send to jane.doe@example.test failed with re_abcdefghijklmnopqrstuvwxyz123456; otp=123456 verification_code=verify-value recoveryCode=recovery-value access_token=access.secret.value refreshToken=refresh.secret.value client_secret=client.secret.value Authorization: Bearer eyJhbGciOiJIUzI1NiJ9\nhttps://user:pass@example.test postgres://db-user:db-pass@database.internal/hr",
  );

  assert.match(message, /\[redacted\]@example\.test/);
  assert.match(message, /otp=\[redacted\]/i);
  assert.match(message, /https:\/\/\[redacted\]@example\.test/);
  assert.match(message, /postgres:\/\/\[redacted\]@database\.internal\/hr/);
  assert.match(message, /Authorization: \[redacted\]/i);
  assert.doesNotMatch(message, /jane\.doe|re_abcdefghijklmnopqrstuvwxyz123456|123456|verify-value|recovery-value|access\.secret\.value|refresh\.secret\.value|client\.secret\.value|eyJhbGciOiJIUzI1NiJ9|\n|user:pass|db-user:db-pass/);
});

test("keeps useful provider and database error diagnostics while sanitizing messages", () => {
  const providerError = Object.assign(new Error("Domain example.test is not verified for jane@example.test"), {
    code: "validation_error",
    statusCode: 422,
  });
  const wrappedError = new Error("Resend delivery failed", { cause: providerError });

  assert.deepEqual(getSafeBackendErrorFields(wrappedError), {
    errorName: "Error",
    errorMessage: "Resend delivery failed",
    causeName: "Error",
    causeMessage: "Domain example.test is not verified for [redacted]@example.test",
    causeCode: "validation_error",
    causeStatusCode: 422,
  });
});

test("serializes searchable one-line JSON records with request context", () => {
  const line = serializeBackendLog("http_request_finished", {
    requestId: "request-123",
    statusCode: 503,
    durationMs: 25,
    email: "jane@example.test",
    authorization: "Bearer eyJhbGciOiJIUzI1NiJ9",
    errorCode: "42P01",
  }, "error", "http", new Date("2026-10-17T00:00:00.000Z"));
  const record = JSON.parse(line) as Record<string, unknown>;

  assert.equal(record.event, "http_request_finished");
  assert.equal(record.requestId, "request-123");
  assert.equal(record.statusCode, 503);
  assert.equal(record.level, "error");
  assert.equal(record.area, "http");
  assert.equal(record.email, "[redacted]");
  assert.equal(record.authorization, "[redacted]");
  assert.equal(record.errorCode, "42P01");
  assert.equal(line.includes("\n"), false);
});
