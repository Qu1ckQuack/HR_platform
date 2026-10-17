import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { getSafeBackendErrorFields, logBackendEvent } from "./backend-logger";

declare module "express-serve-static-core" {
  interface Request {
    backendRequestId?: string;
  }
}

function getRouteName(request: Parameters<RequestHandler>[0]): string {
  const routePath = request.route?.path;
  if (typeof routePath === "string") return `${request.baseUrl}${routePath}`;
  if (Array.isArray(routePath)) return `${request.baseUrl}${routePath.join("|")}`;
  return "unmatched";
}

export const logBackendRequests: RequestHandler = (request, response, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  request.backendRequestId = requestId;
  response.setHeader("X-Request-Id", requestId);

  logBackendEvent("http_request_started", {
    requestId,
    method: request.method,
  }, "info", "http");

  response.once("finish", () => {
    const statusCode = response.statusCode;
    logBackendEvent("http_request_finished", {
      requestId,
      method: request.method,
      route: getRouteName(request),
      statusCode,
      durationMs: Date.now() - startedAt,
    }, statusCode >= 500 ? "error" : "info", "http");
  });

  response.once("close", () => {
    if (response.writableFinished) return;
    logBackendEvent("http_request_aborted", {
      requestId,
      method: request.method,
      route: getRouteName(request),
      durationMs: Date.now() - startedAt,
    }, "warn", "http");
  });

  next();
};

export const logUnhandledBackendErrors: ErrorRequestHandler = (error, request, _response, next) => {
  logBackendEvent("http_request_unhandled_error", {
    requestId: request.backendRequestId,
    method: request.method,
    route: getRouteName(request),
    ...getSafeBackendErrorFields(error),
  }, "error", "http");
  next(error);
};
