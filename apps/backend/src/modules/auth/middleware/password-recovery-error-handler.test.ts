import assert from "node:assert/strict";
import { mock, test } from "node:test";
import express from "express";
import type { Request, Response } from "express";
import { logBackendRequests } from "../../../lib/request-logging";
import { passwordRecoveryErrorHandler } from "./password-recovery-error-handler";
import { assignRecoveryRequestId } from "./password-recovery-request-id";

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

test("maps invalid JSON and oversized bodies to safe client errors", () => {
  const warningLog = mock.method(console, "warn", () => {});
  for (const [type, expectedStatus] of [["entity.parse.failed", 400], ["entity.too.large", 413]] as const) {
    const response = responseStub();
    const request = { backendRequestId: `request-${expectedStatus}` } as Request;
    assignRecoveryRequestId(request, response as unknown as Response, () => {});
    passwordRecoveryErrorHandler(
      Object.assign(new Error("private parser detail"), { type }),
      request,
      response as unknown as Response,
      () => {},
    );
    assert.equal(response.statusCode, expectedStatus);
    assert.equal(request.recoveryRequestId, request.backendRequestId);
    assert.equal((response.body as { requestId: string }).requestId, request.backendRequestId);
    assert.equal(JSON.stringify(response.body).includes("private parser detail"), false);
  }
  warningLog.mock.restore();
});

test("handles malformed JSON in Express and preserves the response request ID", async () => {
  const lines: string[] = [];
  const infoLog = mock.method(console, "info", (line: string) => { lines.push(line); });
  const warningLog = mock.method(console, "warn", (line: string) => { lines.push(line); });
  const app = express();
  app.use(logBackendRequests);
  app.use(assignRecoveryRequestId);
  app.use(express.json({ limit: "10kb" }));
  app.post("/api/auth/password/reset/request-otp", (_request, response) => response.json({ ok: true }));
  app.use(passwordRecoveryErrorHandler);

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/password/reset/request-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad-json",
    });
    const body = await response.json() as { requestId: string; error: string };

    assert.equal(response.status, 400);
    assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
    assert.equal(response.headers.get("x-request-id"), body.requestId);
    const records = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
    assert.ok(records.some((record) => record.event === "password_recovery.request_body_rejected" && record.requestId === body.requestId));
    assert.ok(records.some((record) => record.event === "http_request_finished" && record.requestId === body.requestId && record.statusCode === 400));
    assert.equal(records.some((record) => record.event === "http_request_unhandled_error"), false);
  } finally {
    infoLog.mock.restore();
    warningLog.mock.restore();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
