BEGIN;

ALTER TABLE "PersonalData"
  ADD COLUMN IF NOT EXISTS "religion" TEXT NOT NULL DEFAULT 'ไม่มีศาสนา',
  ADD COLUMN IF NOT EXISTS "disability" TEXT,
  ADD COLUMN IF NOT EXISTS "criminalRecord" TEXT,
  ADD COLUMN IF NOT EXISTS "salary" NUMERIC(12,2);

ALTER TABLE "PersonalData"
  ADD CONSTRAINT "PersonalData_salary_check"
  CHECK ("salary" IS NULL OR "salary" >= 0);

COMMIT;
