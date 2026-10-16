CREATE OR REPLACE FUNCTION soft_delete_employee(p_actor TEXT, p_employee UUID) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE c "Contract"%ROWTYPE;
BEGIN
  PERFORM assert_hr(p_actor);
  IF EXISTS (SELECT 1 FROM "User" WHERE "id" = p_actor AND "employeeId" = p_employee) THEN
    RETURN 'cannot_delete_self';
  END IF;
  PERFORM 1 FROM "Employees" WHERE "id" = p_employee AND "deletedAt" IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN 'employee_not_found'; END IF;
  SELECT * INTO c FROM "Contract" WHERE "employeeId" = p_employee ORDER BY "start" DESC, "id" DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    IF c."status" <> 'พ้นสภาพ' THEN RETURN 'employee_not_terminated'; END IF;
    IF c."type" = 'พนักงานสัญญาจ้าง' AND (c."end" IS NULL OR c."end" > th_today()) THEN RETURN 'contract_not_expired'; END IF;
  END IF;
  UPDATE "Employees" SET "deletedAt" = now(), "deletedBy" = p_actor WHERE "id" = p_employee;
  DELETE FROM "Sessions" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "employeeId" = p_employee);
  RETURN 'ok';
END $$;
