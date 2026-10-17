import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { authDatabaseHooks } from "./auth-database-hooks";
import { db } from "./db";
import { getAuthIpAddressOptions } from "./auth-ip-config";
import { getAuthRuntimeConfig } from "./auth-runtime-config";
import { consumeAuthRateLimit } from "./auth-rate-limit-storage";
import { getBetterAuthSecret } from "./auth-secret";

const { backendUrl, frontendUrl } = getAuthRuntimeConfig();

export const auth = betterAuth({
  baseURL: backendUrl,
  secret: getBetterAuthSecret(),
  database: drizzleAdapter(db, { provider: "pg" }),
  databaseHooks: authDatabaseHooks,
  user: {
    additionalFields: {
      employeeId: { type: "string", required: false, input: false },
      role: { type: "string", required: false, input: false, defaultValue: "user" },
    },
  },
  session: {
    fields: {
      userAgent: "deviceInfo",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    enabled: true,
    customStorage: {
      consume: consumeAuthRateLimit,
    },
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 5 },
    },
  },
  trustedOrigins: [
    frontendUrl,
    backendUrl,
  ],
  advanced: {
    ipAddress: getAuthIpAddressOptions(),
  },
});

export type Session = typeof auth.$Infer.Session;

