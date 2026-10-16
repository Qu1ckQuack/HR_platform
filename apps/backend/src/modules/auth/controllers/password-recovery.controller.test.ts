import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { createRequestOtpHandler } from "./password-recovery.controller";

function responseStub() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(this: { statusCode: number }, code: number) {
      this.statusCode = code;
      return this;
    },
    json(this: { body: unknown }, body: unknown) {
      this.body = body;
      return this;
    },
  };
}

test("keeps OTP request responses generic to avoid revealing account existence", async () => {
  const expectedStatuses = { not_found: 202, rate_limited: 429, delivery_failed: 202, sent: 202 } as const;
  let genericMessage: string | undefined;
  for (const [state, expectedStatus] of Object.entries(expectedStatuses) as [keyof typeof expectedStatuses, number][]) {
    const handler = createRequestOtpHandler(async () => state, () => "request-test");
    const response = responseStub();
    await handler({ body: { contact: "hr@example.test" }, ip: "192.0.2.10" } as Request, response as unknown as Response, () => {});
    assert.equal(response.statusCode, expectedStatus, `${state} should not be reported as successful`);
    assert.equal((response.body as { requestId: string }).requestId, "request-test");
    if (expectedStatus === 202) {
      const message = (response.body as { message: string }).message;
      genericMessage ??= message;
      assert.equal(message, genericMessage);
    } else {
      assert.ok((response.body as { error?: string }).error);
    }
  }
});

test("rejects malformed contact without calling the requester", async () => {
  let called = false;
  const handler = createRequestOtpHandler(async () => { called = true; return "sent"; }, () => "request-test");
  const response = responseStub();

  await handler({ body: { contact: "not a contact" } } as Request, response as unknown as Response, () => {});

  assert.equal(called, false);
  assert.equal(response.statusCode, 400);
  assert.equal((response.body as { requestId: string }).requestId, "request-test");
});

test("maps request processing errors to a sanitized response with a trace id", async () => {
  const logs: string[] = [];
  const handler = createRequestOtpHandler(
    async () => { throw Object.assign(new Error("private database detail"), { code: "42P01" }); },
    () => "request-test",
    (requestId, error) => logs.push(`${requestId}:${(error as Error).message}`),
  );
  const response = responseStub();

  await handler({ body: { contact: "hr@example.test" }, ip: "192.0.2.11" } as Request, response as unknown as Response, () => {});

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, {
    error: "Unable to process the request right now. Please try again later.",
    requestId: "request-test",
  });
  assert.deepEqual(logs, ["request-test:private database detail"]);
});
