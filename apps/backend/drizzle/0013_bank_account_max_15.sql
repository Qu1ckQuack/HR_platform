ALTER TABLE "PersonalData"
  DROP CONSTRAINT IF EXISTS "PersonalData_bankAccount_check";

ALTER TABLE "PersonalData"
  ADD CONSTRAINT "PersonalData_bankAccount_check"
  CHECK ("bankAccount" ~ '^[0-9]{1,15}$');
