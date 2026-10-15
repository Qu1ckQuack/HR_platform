ALTER TABLE "PersonalData"
  ADD CONSTRAINT "PersonalData_bankAccount_check"
  CHECK ("bankAccount" ~ '^[0-9]{10}$');
