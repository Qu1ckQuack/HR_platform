CREATE TABLE "PasswordResetRecovery" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "otpHash" text NOT NULL,
  "otpExpiresAt" timestamp with time zone NOT NULL,
  "otpAttempts" integer DEFAULT 0 NOT NULL,
  "authenticatorAttempts" integer DEFAULT 0 NOT NULL,
  "otpVerifiedAt" timestamp with time zone,
  "authTokenHash" text,
  "authTokenExpiresAt" timestamp with time zone,
  "authenticatorSecret" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "ix_password_reset_expiry" ON "PasswordResetRecovery" USING btree ("otpExpiresAt");
