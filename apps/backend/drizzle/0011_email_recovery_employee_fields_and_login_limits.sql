ALTER TABLE "User"
  DROP COLUMN IF EXISTS "totpSecret",
  DROP COLUMN IF EXISTS "totpEnabledAt",
  DROP COLUMN IF EXISTS "totpLastStep";

ALTER TABLE "PasswordResetRecovery"
  DROP COLUMN IF EXISTS "authenticatorAttempts",
  DROP COLUMN IF EXISTS "authenticatorSecret";

CREATE TABLE "AuthRateLimits" (
  "key" text PRIMARY KEY,
  "count" integer NOT NULL,
  "lastRequest" bigint NOT NULL
);

ALTER TABLE "PersonalData" ADD COLUMN "emergencyContactName" text;
