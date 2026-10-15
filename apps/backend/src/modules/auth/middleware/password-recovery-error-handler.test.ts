import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { Request, Response } from "express";
import { passwordRecoveryErrorHandler } from "./password-recovery-error-handler";

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
  const errorLog = mock.method(console, "error", () => {});
  for (const [type, expectedStatus] of [["entity.parse.failed", 400], ["entity.too.large", 413]] as const) {
    const response = responseStub();
    passwordRecoveryErrorHandler(
      Object.assign(new Error("private parser detail"), { type }),
      { recoveryRequestId: "request-body" } as Request,
      response as unknown as Response,
      () => {},
    );
    assert.equal(response.statusCode, expectedStatus);
    assert.equal((response.body as { requestId: string }).requestId, "request-body");
    assert.equal(JSON.stringify(response.body).includes("private parser detail"), false);
  }
  errorLog.mock.restore();
});
