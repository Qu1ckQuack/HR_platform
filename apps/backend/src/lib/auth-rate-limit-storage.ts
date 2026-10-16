import { sql } from "drizzle-orm";

import { db } from "./db";
import { isUnresolvedClientIpKey } from "./auth-ip-config";
import { getRateLimitRetryAfterSeconds } from "./rate-limit-retry";

type RateLimitRule = { window: number; max: number };

function getPostgresErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("cause" in error)) {
    return undefined;
  }

  const cause = error.cause;
  if (typeof cause !== "object" || cause === null || !("code" in cause)) {
    return undefined;
  }

  return typeof cause.code === "string" ? cause.code : undefined;
}

export async function consumeAuthRateLimit(key: string, rule: RateLimitRule) {
  if (isUnresolvedClientIpKey(key)) {
    console.error(
      "[auth.rate-limit] No trusted client IP was resolved; check the forwarded header and trusted proxy configuration.",
    );
    throw new Error("Authentication rate limiting requires a trusted client IP.");
  }

  const now = Date.now();
  const cutoff = now - rule.window * 1000;

  try {
    return await db.transaction(async (transaction) => {
      const result = await transaction.execute(sql`
        INSERT INTO "AuthRateLimits" ("key", "count", "lastRequest")
        VALUES (${key}, 1, ${now})
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE WHEN "AuthRateLimits"."lastRequest" <= ${cutoff}
            THEN 1 ELSE "AuthRateLimits"."count" + 1 END,
          "lastRequest" = ${now}
        WHERE "AuthRateLimits"."lastRequest" <= ${cutoff}
          OR "AuthRateLimits"."count" < ${rule.max}
        RETURNING "count", "lastRequest"
      `);

      if (result.rows.length === 0) {
        // Keep the row lock from ON CONFLICT while reading the exact retry time.
        const blocked = await transaction.execute(sql`
          SELECT "lastRequest" FROM "AuthRateLimits" WHERE "key" = ${key}
        `);
        const lastRequest = Number(blocked.rows[0]?.lastRequest);

        return {
          allowed: false,
          retryAfter: Number.isFinite(lastRequest)
            ? getRateLimitRetryAfterSeconds(lastRequest, rule.window)
            : rule.window,
        };
      }

      return {
        allowed: true,
        retryAfter: null,
      };
    });
  } catch (error) {
    const code = getPostgresErrorCode(error);
    const reason = code === "42P01"
      ? 'AuthRateLimits is missing or not visible to the backend search_path; apply migration 0011 to the backend DATABASE_URL.'
      : code === "42501"
        ? "The backend database role needs SELECT, INSERT, and UPDATE on AuthRateLimits."
        : `PostgreSQL SQLSTATE ${code ?? "unknown"}.`;

    console.error(`[auth.rate-limit] Persistent rate limit failed. ${reason}`);
    throw new Error("Authentication rate-limit storage is unavailable.");
  }
}
