export type PasswordResetRequestState = "sent" | "not_found" | "rate_limited" | "delivery_failed";

export type PasswordResetRequesterDependencies = {
  findAccount: (email: string) => Promise<{ id: string; email: string } | null>;
  saveOtp: (record: { userId: string; hash: string; expiresAt: Date }) => Promise<void>;
  sendEmail: (email: string, code: string) => Promise<void>;
  deleteOtp: (userId: string, hash: string) => Promise<void>;
  log: (
    event: string,
    requestId: string,
    error?: unknown,
    details?: Record<string, string | number | boolean | undefined>,
  ) => void;
  createCode: () => string;
  hashCode: (value: string) => string;
  now: () => Date;
};

export function createPasswordResetRequester(
  dependencies: PasswordResetRequesterDependencies,
  options: { maxRequests?: number; windowMs?: number } = {},
) {
  const attempts = new Map<string, { count: number; resetAt: number }>();
  const maxRequests = options.maxRequests ?? 5;
  const windowMs = options.windowMs ?? 15 * 60_000;

  return async (email: string, ip: string, requestId: string): Promise<PasswordResetRequestState> => {
    dependencies.log("request_processing_started", requestId);
    const lookupEmail = email.trim().toLowerCase();
    const key = `${ip}:${lookupEmail}`;
    const now = dependencies.now().getTime();
    if (attempts.size > 10_000) {
      for (const [attemptKey, attempt] of attempts) {
        if (attempt.resetAt <= now) attempts.delete(attemptKey);
      }
    }
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      if (current.count >= maxRequests) {
        dependencies.log("rate_limited", requestId);
        return "rate_limited";
      }
      current.count += 1;
    }

    let account: Awaited<ReturnType<PasswordResetRequesterDependencies["findAccount"]>>;
    const lookupStartedAt = Date.now();
    dependencies.log("account_lookup_started", requestId);
    try {
      account = await dependencies.findAccount(lookupEmail);
    } catch (error) {
      dependencies.log("account_lookup_failed", requestId, error, { durationMs: Date.now() - lookupStartedAt });
      throw error;
    }
    dependencies.log("account_lookup_completed", requestId, undefined, {
      accountFound: Boolean(account),
      durationMs: Date.now() - lookupStartedAt,
    });
    if (!account) {
      dependencies.log("account_not_found", requestId);
      return "not_found";
    }

    const code = dependencies.createCode();
    const hash = dependencies.hashCode(code);
    const expiresAt = new Date(now + 10 * 60_000);
    const persistStartedAt = Date.now();
    dependencies.log("otp_persist_started", requestId);
    try {
      await dependencies.saveOtp({ userId: account.id, hash, expiresAt });
    } catch (error) {
      dependencies.log("otp_persist_failed", requestId, error, { durationMs: Date.now() - persistStartedAt });
      throw error;
    }
    dependencies.log("otp_persist_succeeded", requestId, undefined, { durationMs: Date.now() - persistStartedAt });

    const deliveryStartedAt = Date.now();
    dependencies.log("email_delivery_started", requestId);
    try {
      await dependencies.sendEmail(account.email, code);
      dependencies.log("otp_email_sent", requestId, undefined, { durationMs: Date.now() - deliveryStartedAt });
      return "sent";
    } catch (error) {
      const cleanupStartedAt = Date.now();
      dependencies.log("otp_cleanup_started", requestId);
      try {
        await dependencies.deleteOtp(account.id, hash);
        dependencies.log("otp_cleanup_succeeded", requestId, undefined, { durationMs: Date.now() - cleanupStartedAt });
      } catch (cleanupError) {
        dependencies.log("otp_cleanup_failed", requestId, cleanupError, { durationMs: Date.now() - cleanupStartedAt });
      }
      dependencies.log("email_delivery_failed", requestId, error, { durationMs: Date.now() - deliveryStartedAt });
      return "delivery_failed";
    }
  };
}
