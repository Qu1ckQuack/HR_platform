BEGIN;
DROP FUNCTION approve_probation(TEXT, UUID);
DROP FUNCTION reject_probation(TEXT, UUID);
DROP FUNCTION renew_contract(TEXT, UUID, DATE);
DROP FUNCTION cancel_terminated_contract(TEXT, UUID);
DROP FUNCTION soft_delete_employee(TEXT, UUID);
DROP FUNCTION restore_employee(TEXT, UUID);

CREATE FUNCTION approve_probation(p_actor TEXT, p_contract UUID) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Contract" SET "status" = 'ปฏิบัติงาน', "probationEnd" = COALESCE("probationEnd", th_today()) WHERE "id" = p_contract AND "status" = 'ทดลองงาน';
  IF NOT FOUND THEN RETURN 'probation_not_eligible'; END IF;
  RETURN 'ok';
END $$;

CREATE FUNCTION reject_probation(p_actor TEXT, p_contract UUID) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Contract" SET "status" = 'พ้นสภาพ', "end" = COALESCE("end", "probationEnd") WHERE "id" = p_contract AND "status" = 'ทดลองงาน' AND "probationEnd" <= th_today();
  IF NOT FOUND THEN RETURN 'probation_not_due'; END IF;
  RETURN 'ok';
END $$;

CREATE FUNCTION renew_contract(p_actor TEXT, p_contract UUID, p_new_end DATE) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  IF p_new_end IS NOT NULL AND p_new_end <= th_today() THEN RETURN 'renewal_end_date_invalid'; END IF;
  UPDATE "Contract" SET "status" = 'ปฏิบัติงาน', "end" = p_new_end WHERE "id" = p_contract AND "status" = 'พ้นสภาพ';
  IF NOT FOUND THEN RETURN 'contract_not_terminated'; END IF;
  RETURN 'ok';
END $$;

CREATE FUNCTION cancel_terminated_contract(p_actor TEXT, p_contract UUID) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  DELETE FROM "Contract" WHERE "id" = p_contract AND "status" = 'พ้นสภาพ';
  IF NOT FOUND THEN RETURN 'contract_not_terminated'; END IF;
  RETURN 'ok';
END $$;

CREATE FUNCTION soft_delete_employee(p_actor TEXT, p_employee UUID) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE c "Contract"%ROWTYPE;
BEGIN
  PERFORM assert_hr(p_actor);
  PERFORM 1 FROM "Employees" WHERE "id" = p_employee AND "deletedAt" IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN 'employee_not_found'; END IF;
  SELECT * INTO c FROM "Contract" WHERE "employeeId" = p_employee ORDER BY "start" DESC, "id" DESC LIMIT 1;
  IF FOUND THEN
    IF c."status" <> 'พ้นสภาพ' THEN RETURN 'employee_not_terminated'; END IF;
    IF c."type" = 'พนักงานสัญญาจ้าง' AND (c."end" IS NULL OR c."end" > th_today()) THEN RETURN 'contract_not_expired'; END IF;
  END IF;
  UPDATE "Employees" SET "deletedAt" = now(), "deletedBy" = p_actor WHERE "id" = p_employee;
  DELETE FROM "Sessions" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "employeeId" = p_employee);
  RETURN 'ok';
END $$;

CREATE FUNCTION restore_employee(p_actor TEXT, p_employee UUID) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE deleted_at TIMESTAMPTZ;
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Employees" SET "deletedAt" = NULL, "deletedBy" = NULL WHERE "id" = p_employee AND "deletedAt" > now() - interval '7 days';
  IF FOUND THEN RETURN 'ok'; END IF;
  SELECT "deletedAt" INTO deleted_at FROM "Employees" WHERE "id" = p_employee;
  IF deleted_at IS NOT NULL THEN RETURN 'restore_window_expired'; END IF;
  RETURN 'employee_not_found';
END $$;
COMMIT;
