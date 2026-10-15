import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler } from "express";

export const passwordRecoveryErrorHandler: ErrorRequestHandler = (error, request, response) => {
  const requestId = request.recoveryRequestId ?? randomUUID();
  const type = error && typeof error === "object" && "type" in error ? String(error.type) : "unknown";
  const status = type === "entity.too.large" ? 413 : type === "entity.parse.failed" ? 400 : 500;
  console.error({ event: "password_recovery.request_body_rejected", requestId, errorType: type, status });
  response.status(status).json({
    error: status === 413 ? "Request body is too large." : status === 400 ? "Invalid JSON request body." : "Unable to process request.",
    requestId,
  });
};
