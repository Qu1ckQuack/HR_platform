import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "../../../lib/db";
import { passwordResetRecovery } from "../../../db/auth-schema";
import { findHrAccount } from "./password-reset-identity";
import { sendResetOtpEmail } from "./password-reset-email";
import { createEmailCode, createRecoveryToken, hashRecoveryValue, matchesRecoveryValue } from "./password-reset-crypto";
import { createPasswordResetRequester } from "./password-reset-requester";

function safeErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
}

function logRequestEvent(event: string, requestId: string, error?: unknown) {
  const details = {
    event: `password_recovery.${event}`,
    requestId,
    errorName: error instanceof Error ? error.name : undefined,
    errorCode: safeErrorCode(error),
  };
  if (event.endsWith("failed")) console.error(details);
  else console.info(details);
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
          authenticatorAttempts: 0,
          otpVerifiedAt: null,
          authTokenHash: null,
          authTokenExpiresAt: null,
          authenticatorSecret: null,
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

export async function verifyPasswordResetEmail(contact: string, code: string) {
  const account = await findHrAccount(contact.trim().toLowerCase());
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
