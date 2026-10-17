import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "../../../lib/db";
import { passwordResetRecovery } from "../../../db/auth-schema";
import { parseRecoveryEmail } from "./password-reset-address";
import { findHrAccount } from "./password-reset-identity";
import { sendResetOtpEmail } from "./password-reset-email";
import { createEmailCode, createRecoveryToken, hashRecoveryValue, matchesRecoveryValue } from "./password-reset-crypto";
import { createPasswordResetRequester } from "./password-reset-requester";
import { getSafeBackendErrorFields, logBackendEvent } from "../../../lib/backend-logger";

function logRequestEvent(
  event: string,
  requestId: string,
  error?: unknown,
  details: Record<string, string | number | boolean | undefined> = {},
) {
  const level = event.endsWith("failed") ? "error" : event === "rate_limited" ? "warn" : "info";
  logBackendEvent(`password_recovery.${event}`, {
    requestId,
    ...details,
    ...(error === undefined ? {} : getSafeBackendErrorFields(error)),
  }, level, "password_recovery");
}

export const requestPasswordReset = createPasswordResetRequester({
  findAccount: findHrAccount,
  createCode: createEmailCode,
  hashCode: hashRecoveryValue,
  now: () => new Date(),
  log: logRequestEvent,
  saveOtp: async ({ userId, hash, expiresAt }) => {
    const now = new Date();
    await db.insert(passwordResetRecovery).values({ userId, otpHash: hash, otpExpiresAt: expiresAt })
      .onConflictDoUpdate({
        target: passwordResetRecovery.userId,
        set: {
          otpHash: hash,
          otpExpiresAt: expiresAt,
          otpAttempts: 0,
          otpVerifiedAt: null,
          authTokenHash: null,
          authTokenExpiresAt: null,
          updatedAt: now,
        },
      });
  },
  sendEmail: sendResetOtpEmail,
  deleteOtp: async (userId, hash) => {
    await db.delete(passwordResetRecovery).where(and(
      eq(passwordResetRecovery.userId, userId),
      eq(passwordResetRecovery.otpHash, hash),
    ));
  },
});

export async function verifyPasswordResetEmail(email: string, code: string) {
  const normalizedEmail = parseRecoveryEmail(email);
  const account = normalizedEmail ? await findHrAccount(normalizedEmail) : null;
  if (!account || !/^\d{6}$/.test(code)) return null;
  const [record] = await db.select().from(passwordResetRecovery)
    .where(eq(passwordResetRecovery.userId, account.id)).limit(1);
  if (!record || record.otpExpiresAt <= new Date() || record.otpVerifiedAt || record.otpAttempts >= 5) return null;
  const [attempt] = await db.update(passwordResetRecovery)
    .set({ otpAttempts: sql`${passwordResetRecovery.otpAttempts} + 1`, updatedAt: new Date() })
    .where(and(
      eq(passwordResetRecovery.id, record.id),
      lt(passwordResetRecovery.otpAttempts, 5),
      isNull(passwordResetRecovery.otpVerifiedAt),
    ))
    .returning({ otpHash: passwordResetRecovery.otpHash });
  if (!attempt || !matchesRecoveryValue(code, attempt.otpHash)) return null;
  const token = createRecoveryToken();
  const now = new Date();
  const verified = await db.update(passwordResetRecovery).set({
    otpVerifiedAt: now,
    authTokenHash: hashRecoveryValue(token),
    authTokenExpiresAt: new Date(now.getTime() + 15 * 60_000),
    updatedAt: now,
  }).where(and(
    eq(passwordResetRecovery.id, record.id),
    isNull(passwordResetRecovery.otpVerifiedAt),
  )).returning({ id: passwordResetRecovery.id });
  return verified.length ? token : null;
}
