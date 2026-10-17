import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler } from "express";
import { logBackendEvent } from "../../../lib/backend-logger";

export const passwordRecoveryErrorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  void _next;
  const requestId = request.recoveryRequestId ?? randomUUID();
  const type = error && typeof error === "object" && "type" in error ? String(error.type) : "unknown";
  const status = type === "entity.too.large" ? 413 : type === "entity.parse.failed" ? 400 : 500;
  logBackendEvent("password_recovery.request_body_rejected", {
    requestId,
    errorType: type,
    statusCode: status,
  }, status >= 500 ? "error" : "warn", "password_recovery");
  response.status(status).json({
    error: status === 413
      ? "คำขอมีขนาดใหญ่เกินไป กรุณาลองใหม่"
      : status === 400
        ? "ข้อมูลคำขอไม่ถูกต้อง กรุณาลองอีกครั้ง"
        : "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้งพร้อมแจ้งรหัสอ้างอิงแก่ผู้ดูแลหากยังพบปัญหา",
    requestId,
  });
};
