import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { completePasswordReset } from "../services/password-reset-completion";
import { parseRecoveryEmail } from "../services/password-reset-address";
import { requestPasswordReset, verifyPasswordResetEmail } from "../services/password-reset-request";
import type { PasswordResetRequestState } from "../services/password-reset-requester";

type PasswordResetRequester = (email: string, ip: string, requestId: string) => Promise<PasswordResetRequestState>;
type FailureLogger = (requestId: string, error: unknown) => void;

function logRequestFailure(requestId: string, error: unknown, event = "request_failed") {
  const errorCode = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error({ event: `password_recovery.${event}`, requestId, errorName, errorCode });
}

export function createRequestOtpHandler(
  requester: PasswordResetRequester = requestPasswordReset,
  createRequestId: () => string = randomUUID,
  logFailure: FailureLogger = logRequestFailure,
): RequestHandler {
  return async (request, response) => {
    const requestId = request.recoveryRequestId ?? createRequestId();
    const email = String(request.body?.email ?? "").trim();
    const recoveryEmail = parseRecoveryEmail(email);
    if (!recoveryEmail) {
      response.status(400).json({ error: "กรุณากรอกอีเมลให้ถูกต้อง เช่น name@example.com", requestId });
      return;
    }
    try {
      const result = await requester(recoveryEmail, request.ip ?? "unknown", requestId);
      if (result === "not_found") {
        response.status(404).json({ error: "ไม่พบอีเมลนี้ในบัญชีพนักงาน HR ที่ใช้งานอยู่ กรุณาตรวจสอบอีเมลที่ลงทะเบียนกับ HR หรือติดต่อผู้ดูแลระบบ", requestId });
        return;
      }
      if (result === "rate_limited") {
        response.status(429).json({ error: "ขอรหัส OTP หลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่", requestId });
        return;
      }
      if (result === "delivery_failed") {
        response.status(503).json({ error: "ระบบส่งอีเมลไม่สำเร็จ กรุณาลองใหม่ภายหลัง หากยังมีปัญหา โปรดติดต่อผู้ดูแลระบบพร้อมแจ้งรหัสอ้างอิง", requestId });
        return;
      }
      response.status(202).json({ message: "ส่งรหัส OTP แล้ว กรุณาตรวจสอบกล่องจดหมายและอีเมลขยะ รหัสมีอายุ 10 นาที", requestId });
    } catch (error) {
      logFailure(requestId, error);
      response.status(503).json({ error: "ระบบขอรหัส OTP ขัดข้องชั่วคราว กรุณาลองอีกครั้ง หากยังพบปัญหา โปรดติดต่อผู้ดูแลระบบพร้อมแจ้งรหัสอ้างอิง", requestId });
    }
  };
}

export const requestOtp = createRequestOtpHandler();

export const verifyOtp: RequestHandler = async (request, response) => {
  const requestId = request.recoveryRequestId ?? randomUUID();
  try {
    const token = await verifyPasswordResetEmail(String(request.body?.email ?? "").trim(), String(request.body?.code ?? "").trim());
    if (!token) {
      response.status(400).json({ error: "รหัส OTP ไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว กรุณาตรวจสอบรหัสหรือขอรหัสใหม่", requestId });
      return;
    }
    response.json({ authToken: token, requestId });
  } catch (error) {
    logRequestFailure(requestId, error, "otp_verification_failed");
    response.status(503).json({ error: "ระบบตรวจสอบรหัส OTP ขัดข้องชั่วคราว กรุณาลองอีกครั้งพร้อมแจ้งรหัสอ้างอิงแก่ผู้ดูแลหากยังพบปัญหา", requestId });
  }
};

export const completeReset: RequestHandler = async (request, response) => {
  const requestId = request.recoveryRequestId ?? randomUUID();
  const result = await completePasswordReset({
    authToken: String(request.body?.authToken ?? ""),
    newPassword: String(request.body?.newPassword ?? ""),
    confirmPassword: String(request.body?.confirmPassword ?? ""),
  }).catch((error) => {
    logRequestFailure(requestId, error, "password_reset_failed");
    return null;
  });
  if (result === null) {
    response.status(503).json({ error: "ระบบเปลี่ยนรหัสผ่านขัดข้องชั่วคราว กรุณาลองอีกครั้งพร้อมแจ้งรหัสอ้างอิงแก่ผู้ดูแลหากยังพบปัญหา", requestId });
    return;
  }
  if (result === "invalid_password") {
    response.status(400).json({ error: "รหัสผ่านใหม่ต้องมีความยาว 12–200 ตัวอักษร และต้องตรงกับช่องยืนยันรหัสผ่าน", requestId });
    return;
  }
  if (result === "invalid_token") {
    response.status(400).json({ error: "ขั้นตอนยืนยันรหัสหมดอายุหรือไม่ถูกต้อง กรุณาเริ่มรีเซ็ตรหัสผ่านใหม่", requestId });
    return;
  }
  response.json({ message: "เปลี่ยนรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่", requestId });
};
