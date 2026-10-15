import assert from "node:assert/strict";
import { test } from "node:test";
import { createPasswordResetRequester, type PasswordResetRequesterDependencies } from "./password-reset-requester";

function createHarness(overrides: Partial<PasswordResetRequesterDependencies> = {}) {
  const events: string[] = [];
  const logs: Array<{ event: string; requestId: string; code?: string }> = [];
  const savedRecords: Array<{ userId: string; hash: string; expiresAt: Date }> = [];
  const sentEmails: Array<{ email: string; code: string }> = [];
  const dependencies = {
    findAccount: async () => ({ id: "user-1", email: "hr@example.test" }),
    saveOtp: async (record: { userId: string; hash: string; expiresAt: Date }) => {
      events.push("save");
      savedRecords.push(record);
    },
    sendEmail: async (email: string, code: string) => {
      events.push("send");
      sentEmails.push({ email, code });
    },
    deleteOtp: async () => { events.push("delete"); },
    log: (event: string, requestId: string, error?: unknown) => {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
      logs.push({ event, requestId, ...(code ? { code } : {}) });
    },
    createCode: () => "123456",
    hashCode: (value: string) => `hashed:${value}`,
    now: () => new Date("2026-10-15T00:00:00.000Z"),
    ...overrides,
  };
  return { events, logs, savedRecords, sentEmails, requester: createPasswordResetRequester(dependencies) };
}

test("stores an OTP before sending and reports a successful delivery", async () => {
  const { events, logs, requester, savedRecords, sentEmails } = createHarness();

  const result = await requester("hr@example.test", "192.0.2.1", "request-1");

  assert.equal(result, "sent");
  assert.deepEqual(events, ["save", "send"]);
  assert.deepEqual(savedRecords, [{
    userId: "user-1",
    hash: "hashed:123456",
    expiresAt: new Date("2026-10-15T00:10:00.000Z"),
  }]);
  assert.deepEqual(sentEmails, [{ email: "hr@example.test", code: "123456" }]);
  assert.deepEqual(logs, [{ event: "otp_email_sent", requestId: "request-1" }]);
});

test("does not store or send when no eligible account matches", async () => {
  const { events, requester } = createHarness({ findAccount: async () => null });

  const result = await requester("unknown@example.test", "192.0.2.2", "request-2");

  assert.equal(result, "not_found");
  assert.deepEqual(events, []);
});

test("removes the newly stored OTP when email delivery fails", async () => {
  const { events, logs, requester } = createHarness({
    sendEmail: async () => { events.push("send"); throw Object.assign(new Error("SMTP unavailable"), { code: "ECONNECTION" }); },
  });

  const result = await requester("hr@example.test", "192.0.2.3", "request-3");

  assert.equal(result, "delivery_failed");
  assert.deepEqual(events, ["save", "send", "delete"]);
  assert.deepEqual(logs, [{ event: "email_delivery_failed", requestId: "request-3", code: "ECONNECTION" }]);
});

test("preserves delivery failure diagnostics when OTP cleanup also fails", async () => {
  const { events, logs, requester } = createHarness({
    sendEmail: async () => { events.push("send"); throw new Error("SMTP unavailable"); },
    deleteOtp: async () => { events.push("delete"); throw Object.assign(new Error("DB unavailable"), { code: "08006" }); },
  });

  const result = await requester("hr@example.test", "192.0.2.4", "request-4");

  assert.equal(result, "delivery_failed");
  assert.deepEqual(events, ["save", "send", "delete"]);
  assert.deepEqual(logs.map(({ event, requestId }) => [event, requestId]), [
    ["otp_cleanup_failed", "request-4"],
    ["email_delivery_failed", "request-4"],
  ]);
});

test("rate limits after the configured number without writing another OTP", async () => {
  const events: string[] = [];
  const logs: Array<{ event: string; requestId: string }> = [];
  const limitedRequester = createPasswordResetRequester(
    {
      findAccount: async () => ({ id: "user-1", email: "hr@example.test" }),
      saveOtp: async () => { events.push("save"); },
      sendEmail: async () => { events.push("send"); },
      deleteOtp: async () => { events.push("delete"); },
      log: (event, requestId) => { logs.push({ event, requestId }); },
      createCode: () => "123456",
      hashCode: (value) => `hashed:${value}`,
      now: () => new Date("2026-10-15T00:00:00.000Z"),
    },
    { maxRequests: 1 },
  );
  assert.equal(await limitedRequester("hr@example.test", "192.0.2.5", "first"), "sent");

  const result = await limitedRequester("HR@example.test", "192.0.2.5", "second");

  assert.equal(result, "rate_limited");
  assert.deepEqual(events, ["save", "send"]);
  assert.deepEqual(logs, [
    { event: "otp_email_sent", requestId: "first" },
    { event: "rate_limited", requestId: "second" },
  ]);
});

test("logs and rethrows OTP persistence errors without attempting email", async () => {
  const { events, logs, requester } = createHarness({
    saveOtp: async () => { events.push("save"); throw Object.assign(new Error("database failure"), { code: "42P01" }); },
  });

  await assert.rejects(requester("hr@example.test", "192.0.2.7", "request-db"), /database failure/);

  assert.deepEqual(events, ["save"]);
  assert.deepEqual(logs, [{ event: "otp_persist_failed", requestId: "request-db", code: "42P01" }]);
});

test("allows a new request after the rate-limit window expires", async () => {
  let timestamp = 0;
  const events: string[] = [];
  const requester = createPasswordResetRequester({
    findAccount: async () => ({ id: "user-1", email: "hr@example.test" }),
    saveOtp: async () => { events.push("save"); },
    sendEmail: async () => { events.push("send"); },
    deleteOtp: async () => { events.push("delete"); },
    log: () => {},
    createCode: () => "123456",
    hashCode: (value) => `hashed:${value}`,
    now: () => new Date(timestamp),
  }, { maxRequests: 1, windowMs: 1000 });

  assert.equal(await requester("hr@example.test", "192.0.2.8", "first"), "sent");
  assert.equal(await requester("hr@example.test", "192.0.2.8", "limited"), "rate_limited");
  timestamp = 1000;
  assert.equal(await requester("hr@example.test", "192.0.2.8", "after-window"), "sent");
  assert.deepEqual(events, ["save", "send", "save", "send"]);
});
