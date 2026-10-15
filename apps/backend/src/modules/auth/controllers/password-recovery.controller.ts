import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { completePasswordReset } from "../services/password-reset-completion";
import { requestPasswordReset, verifyPasswordResetEmail } from "../services/password-reset-request";
import type { PasswordResetRequestState } from "../services/password-reset-requester";

type PasswordResetRequester = (contact: string, ip: string, requestId: string) => Promise<PasswordResetRequestState>;
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
    const contact = String(request.body?.contact ?? "").trim();
    const validEmail = contact.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const phoneDigits = contact.replace(/\D/g, "");
    if (!validEmail && phoneDigits.length !== 10) {
      response.status(400).json({ error: "Enter a valid email address or 10-digit phone number.", requestId });
      return;
    }
    try {
      const result = await requester(validEmail ? contact : phoneDigits, request.ip ?? "unknown", requestId);
      if (result === "not_found") {
        response.status(404).json({ error: "No HR employee account was found. Check the email or phone number and try again.", requestId });
        return;
      }
      if (result === "rate_limited") {
        response.status(429).json({ error: "Too many OTP requests. Please wait 15 minutes before trying again.", requestId });
        return;
      }
      if (result === "delivery_failed") {
        response.status(503).json({ error: "We could not send the OTP. Please try again later.", requestId });
        return;
      }
      response.status(202).json({ message: "A verification code was sent to the registered email.", requestId });
    } catch (error) {
      logFailure(requestId, error);
      response.status(503).json({ error: "Unable to process the request right now. Please try again later.", requestId });
    }
  };
}

export const requestOtp = createRequestOtpHandler();

export const verifyOtp: RequestHandler = async (request, response) => {
  const requestId = request.recoveryRequestId ?? randomUUID();
  try {
    const token = await verifyPasswordResetEmail(String(request.body?.contact ?? "").trim(), String(request.body?.code ?? "").trim());
    if (!token) {
      response.status(400).json({ error: "The email code is invalid or expired.", requestId });
      return;
    }
    response.json({ authToken: token, requestId });
  } catch (error) {
    logRequestFailure(requestId, error, "otp_verification_failed");
    response.status(503).json({ error: "Unable to verify the code right now. Please try again later.", requestId });
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
    response.status(503).json({ error: "Unable to reset the password right now. Please try again later.", requestId });
    return;
  }
  if (!result) {
    response.status(400).json({ error: "The recovery code or password details are invalid or expired.", requestId });
    return;
  }
  response.json({ message: "Password reset successfully. Sign in with your new password.", requestId });
};
