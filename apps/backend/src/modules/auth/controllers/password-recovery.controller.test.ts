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

test("returns actionable Thai messages for OTP request outcomes", async () => {
  const expectedStatuses = { not_found: 404, rate_limited: 429, delivery_failed: 503, sent: 202 } as const;
  for (const [state, expectedStatus] of Object.entries(expectedStatuses) as [keyof typeof expectedStatuses, number][]) {
    const handler = createRequestOtpHandler(async () => state, () => "request-test");
    const response = responseStub();
    await handler({ body: { email: "hr@example.test" }, ip: "192.0.2.10" } as Request, response as unknown as Response, () => {});
    assert.equal(response.statusCode, expectedStatus, `${state} should have its own status`);
    const body = response.body as { error?: string; message?: string; requestId: string };
    assert.equal(body.requestId, "request-test");
    assert.ok(body.error ?? body.message);
    assert.match(body.error ?? body.message ?? "", /[\u0E00-\u0E7F]/, `${state} response should be Thai`);
  }
});

test("rejects non-email reset identifiers without calling the requester", async () => {
  let called = false;
  const handler = createRequestOtpHandler(async () => { called = true; return "sent"; }, () => "request-test");
  for (const email of ["not-an-email", "081-234-5678", "EMP00002", "Ed3BVIUd2d4G718yw20MmahySjSfP4GI"]) {
    const response = responseStub();
    await handler({ body: { email } } as Request, response as unknown as Response, () => {});
    assert.equal(response.statusCode, 400, `${email} must be rejected`);
    assert.equal((response.body as { requestId: string }).requestId, "request-test");
  }
  assert.equal(called, false);
});

test("maps request processing errors to a sanitized response with a trace id", async () => {
  const logs: string[] = [];
  const handler = createRequestOtpHandler(
    async () => { throw Object.assign(new Error("private database detail"), { code: "42P01" }); },
    () => "request-test",
    (requestId, error) => logs.push(`${requestId}:${(error as Error).message}`),
  );
  const response = responseStub();

  await handler({ body: { email: "hr@example.test" }, ip: "192.0.2.11" } as Request, response as unknown as Response, () => {});

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, {
    error: "ระบบขอรหัส OTP ขัดข้องชั่วคราว กรุณาลองอีกครั้ง หากยังพบปัญหา โปรดติดต่อผู้ดูแลระบบพร้อมแจ้งรหัสอ้างอิง",
    requestId: "request-test",
  });
  assert.deepEqual(logs, ["request-test:private database detail"]);
});
