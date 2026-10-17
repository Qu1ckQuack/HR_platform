import { and, eq, gt } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "../../../lib/db";
import { account, passwordResetRecovery, session } from "../../../db/auth-schema";
import { hashRecoveryValue } from "./password-reset-crypto";

export async function completePasswordReset(input: {
  authToken: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const { authToken, newPassword, confirmPassword } = input;
  if (newPassword.length < 12 || newPassword.length > 200 || newPassword !== confirmPassword) return "invalid_password" as const;
  if (!authToken) return "invalid_token" as const;
  const tokenHash = hashRecoveryValue(authToken);
  const password = await hashPassword(newPassword);
  return db.transaction(async (tx) => {
    const consumed = await tx.delete(passwordResetRecovery)
      .where(and(eq(passwordResetRecovery.authTokenHash, tokenHash), gt(passwordResetRecovery.authTokenExpiresAt, new Date())))
      .returning({ userId: passwordResetRecovery.userId });
    if (!consumed.length) return "invalid_token" as const;
    const userId = consumed[0].userId;
    const changed = await tx.update(account).set({ password, updatedAt: new Date() })
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
      .returning({ id: account.id });
    if (!changed.length) throw new Error("Credential account not found");
    await tx.delete(session).where(eq(session.userId, userId));
    return "success" as const;
  });
}
