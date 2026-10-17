import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { Request, Response } from "express";
import { logBackendRequests, logUnhandledBackendErrors } from "./request-logging";

function responseStub() {
  const listeners = new Map<string, () => void>();
  const headers = new Map<string, string>();
  return {
    statusCode: 200,
    writableFinished: false,
    listeners,
    headers,
    setHeader(name: string, value: string) { headers.set(name, value); return this; },
    once(event: string, callback: () => void) { listeners.set(event, callback); return this; },
  };
}

test("logs request completion and disconnect with one request ID and a route template", () => {
  const lines: string[] = [];
  const infoLog = mock.method(console, "info", (line: string) => { lines.push(line); });
  const warnLog = mock.method(console, "warn", (line: string) => { lines.push(line); });
  const errorLog = mock.method(console, "error", (line: string) => { lines.push(line); });
  const response = responseStub();
  const request = {
    method: "POST",
    baseUrl: "/api/auth/password/reset",
    route: { path: "/request-otp" },
  } as unknown as Request;
  let nextCalled = false;

  logBackendRequests(request, response as unknown as Response, () => { nextCalled = true; });

  const requestId = request.backendRequestId;
  assert.equal(nextCalled, true);
  assert.ok(requestId);
  assert.equal(response.headers.get("X-Request-Id"), requestId);
  assert.equal(JSON.parse(lines[0] ?? "{}").event, "http_request_started");

  response.statusCode = 503;
  response.writableFinished = true;
  response.listeners.get("finish")?.();
  const finished = JSON.parse(lines[1] ?? "{}") as Record<string, unknown>;
  assert.equal(finished.event, "http_request_finished");
  assert.equal(finished.requestId, requestId);
  assert.equal(finished.route, "/api/auth/password/reset/request-otp");
  assert.equal(finished.statusCode, 503);
  assert.equal(finished.level, "error");

  const abortedResponse = responseStub();
  logBackendRequests(request, abortedResponse as unknown as Response, () => {});
  abortedResponse.listeners.get("close")?.();
  assert.equal(JSON.parse(lines[2] ?? "{}").event, "http_request_started");
  assert.equal(JSON.parse(lines[3] ?? "{}").event, "http_request_aborted");

  infoLog.mock.restore();
  warnLog.mock.restore();
  errorLog.mock.restore();
});

test("logs unhandled errors with the request context and safe diagnostics", () => {
  const lines: string[] = [];
  const errorLog = mock.method(console, "error", (line: string) => { lines.push(line); });
  const error = Object.assign(new Error("DB request for jane@example.test failed"), { code: "42P01" });
  let forwarded: unknown;

  logUnhandledBackendErrors(
    error,
    { backendRequestId: "request-error", method: "POST", baseUrl: "/api", route: { path: "/users" } } as unknown as Request,
    {} as Response,
    (nextError) => { forwarded = nextError; },
  );

  const record = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
  assert.equal(record.event, "http_request_unhandled_error");
  assert.equal(record.requestId, "request-error");
  assert.equal(record.errorCode, "42P01");
  assert.equal(record.errorMessage, "DB request for [redacted]@example.test failed");
  assert.equal(forwarded, error);
  errorLog.mock.restore();
});
