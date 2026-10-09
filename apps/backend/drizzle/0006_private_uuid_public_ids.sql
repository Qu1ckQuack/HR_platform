BEGIN;

-- Preserve the existing stable codes while changing internal primary keys to UUIDs.
DROP VIEW IF EXISTS v_employee_list;
DROP VIEW IF EXISTS v_contract_alerts;
DROP VIEW IF EXISTS v_employee_trash;

ALTER TABLE "Employees" DROP CONSTRAINT "Employees_supervisor_id_fkey";
ALTER TABLE "Employees" DROP CONSTRAINT IF EXISTS "Employees_supervisor_check";
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_employeeId_fkey";
ALTER TABLE "PersonalData" DROP CONSTRAINT "PersonalData_employeeId_fkey";
ALTER TABLE "PositioningHistory" DROP CONSTRAINT "PositioningHistory_contractId_fkey";
ALTER TABLE "User" DROP CONSTRAINT "User_employeeId_fkey";

ALTER TABLE "Employees" DROP CONSTRAINT "Employees_pkey";
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_pkey";
ALTER TABLE "PersonalData" DROP CONSTRAINT "PersonalData_pkey";

ALTER TABLE "Employees" RENAME COLUMN "id" TO "publicId";
ALTER TABLE "Contract" RENAME COLUMN "id" TO "publicId";
ALTER TABLE "PersonalData" RENAME COLUMN "id" TO "publicId";

ALTER TABLE "Employees" ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "Contract" ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "PersonalData" ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_pkey" PRIMARY KEY ("id");
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_pkey" PRIMARY KEY ("id");
ALTER TABLE "PersonalData" ADD CONSTRAINT "PersonalData_pkey" PRIMARY KEY ("id");
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_publicId_key" UNIQUE ("publicId");
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_publicId_key" UNIQUE ("publicId");
ALTER TABLE "PersonalData" ADD CONSTRAINT "PersonalData_publicId_key" UNIQUE ("publicId");

ALTER TABLE "Employees" RENAME COLUMN "supervisor_id" TO "supervisorPublicId";
ALTER TABLE "Employees" ADD COLUMN "supervisor_id" UUID;
UPDATE "Employees" employee SET "supervisor_id" = supervisor."id"
FROM "Employees" supervisor WHERE employee."supervisorPublicId" = supervisor."publicId";
ALTER TABLE "Employees" DROP COLUMN "supervisorPublicId";
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_supervisor_id_fkey"
  FOREIGN KEY ("supervisor_id") REFERENCES "Employees"("id") ON DELETE SET NULL;
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_supervisor_check"
  CHECK ("supervisor_id" IS DISTINCT FROM "id");

ALTER TABLE "Contract" RENAME COLUMN "employeeId" TO "employeePublicId";
ALTER TABLE "Contract" ADD COLUMN "employeeId" UUID;
UPDATE "Contract" contract SET "employeeId" = employee."id"
FROM "Employees" employee WHERE contract."employeePublicId" = employee."publicId";
ALTER TABLE "Contract" DROP COLUMN "employeePublicId";
ALTER TABLE "Contract" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE;

ALTER TABLE "PersonalData" RENAME COLUMN "employeeId" TO "employeePublicId";
ALTER TABLE "PersonalData" ADD COLUMN "employeeId" UUID;
UPDATE "PersonalData" data SET "employeeId" = employee."id"
FROM "Employees" employee WHERE data."employeePublicId" = employee."publicId";
ALTER TABLE "PersonalData" DROP COLUMN "employeePublicId";
ALTER TABLE "PersonalData" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "PersonalData" ADD CONSTRAINT "PersonalData_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE;
ALTER TABLE "PersonalData" ADD CONSTRAINT "PersonalData_employeeId_key" UNIQUE ("employeeId");

ALTER TABLE "User" RENAME COLUMN "employeeId" TO "employeePublicId";
ALTER TABLE "User" ADD COLUMN "employeeId" UUID;
UPDATE "User" account SET "employeeId" = employee."id"
FROM "Employees" employee WHERE account."employeePublicId" = employee."publicId";
ALTER TABLE "User" DROP COLUMN "employeePublicId";
ALTER TABLE "User" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_key" UNIQUE ("employeeId");

ALTER TABLE "PositioningHistory" RENAME COLUMN "contractId" TO "contractPublicId";
ALTER TABLE "PositioningHistory" ADD COLUMN "contractId" UUID;
UPDATE "PositioningHistory" history SET "contractId" = contract."id"
FROM "Contract" contract WHERE history."contractPublicId" = contract."publicId";
ALTER TABLE "PositioningHistory" DROP COLUMN "contractPublicId";
ALTER TABLE "PositioningHistory" ALTER COLUMN "contractId" SET NOT NULL;
ALTER TABLE "PositioningHistory" ADD CONSTRAINT "PositioningHistory_contractId_fkey"
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE;

ALTER TABLE "Employees" DROP CONSTRAINT IF EXISTS "Employees_id_check";
ALTER TABLE "Employees" ADD CONSTRAINT "Employees_publicId_check" CHECK ("publicId" ~ '^EMP[0-9]{5,}$');
ALTER TABLE "Contract" DROP CONSTRAINT IF EXISTS "Contract_id_check";
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_publicId_check" CHECK ("publicId" ~ '^CNT_[0-9]{4,}$');
ALTER TABLE "PersonalData" DROP CONSTRAINT IF EXISTS "PersonalData_id_check";
ALTER TABLE "PersonalData" ADD CONSTRAINT "PersonalData_publicId_check" CHECK ("publicId" ~ '^PDT_[0-9]{4,}$');

DROP INDEX IF EXISTS "ix_contract_emp_start";
DROP INDEX IF EXISTS "uq_contract_one_active";
CREATE INDEX "ix_contract_emp_start" ON "Contract"("employeeId", "start" DESC);
CREATE UNIQUE INDEX "uq_contract_one_active" ON "Contract"("employeeId") WHERE "status" <> 'พ้นสภาพ';
CREATE INDEX "ix_employees_supervisor" ON "Employees"("supervisor_id");
CREATE INDEX "ix_poshist_contract" ON "PositioningHistory"("contractId", "start" DESC);
CREATE UNIQUE INDEX "uq_poshist_one_current" ON "PositioningHistory"("contractId") WHERE "end" IS NULL;
DROP INDEX IF EXISTS "ix_employees_id_prefix";
CREATE INDEX "ix_employees_public_id_prefix" ON "Employees"("publicId" text_pattern_ops) WHERE "deletedAt" IS NULL;

CREATE OR REPLACE VIEW v_employee_list AS
SELECT e."publicId" AS "employeeCode",
       e."prefix", e."name", e."lastName", e."nickName", e."searchText",
       c."publicId" AS "contractId",
       c."type", c."status", c."start",
       CASE WHEN c."status" = 'ทดลองงาน' THEN c."probationEnd" ELSE c."end" END AS "dueDate",
       c."end", c."probationEnd",
       d."title" AS "department", p."title" AS "position"
FROM "Employees" e
LEFT JOIN LATERAL (
    SELECT * FROM "Contract" WHERE "employeeId" = e."id" ORDER BY "start" DESC, "id" DESC LIMIT 1
) c ON TRUE
LEFT JOIN "PositioningHistory" ph ON ph."contractId" = c."id" AND ph."end" IS NULL
LEFT JOIN "Position" p ON p."id" = ph."positionId"
LEFT JOIN "Department" d ON d."id" = ph."departmentId"
WHERE e."deletedAt" IS NULL;

CREATE OR REPLACE VIEW v_contract_alerts AS
SELECT c."publicId" AS "contractId", e."publicId" AS "employeeId", c."type", c."status", c."end", c."probationEnd",
       'CONTRACT_EXPIRED'::text AS "alert"
FROM "Contract" c JOIN "Employees" e ON e."id" = c."employeeId" AND e."deletedAt" IS NULL
WHERE c."status" <> 'พ้นสภาพ' AND c."end" IS NOT NULL AND c."end" < th_today()
UNION ALL
SELECT c."publicId", e."publicId", c."type", c."status", c."end", c."probationEnd",
       'PROBATION_DUE'
FROM "Contract" c JOIN "Employees" e ON e."id" = c."employeeId" AND e."deletedAt" IS NULL
WHERE c."status" = 'ทดลองงาน' AND c."probationEnd" <= th_today();

CREATE OR REPLACE VIEW v_employee_trash AS
SELECT "publicId" AS "employeeCode", "name", "lastName", "deletedAt", "deletedBy",
       "deletedAt" + interval '7 days' AS "restorableUntil"
FROM "Employees"
WHERE "deletedAt" IS NOT NULL AND "deletedAt" > now() - interval '7 days';

-- SQL actions accept private IDs; the HTTP layer resolves public codes first.
DROP FUNCTION IF EXISTS create_employee(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,DATE,DATE,DATE,TEXT,TEXT,JSONB);
DROP FUNCTION IF EXISTS approve_probation(TEXT,TEXT);
DROP FUNCTION IF EXISTS reject_probation(TEXT,TEXT);
DROP FUNCTION IF EXISTS renew_contract(TEXT,TEXT,DATE);
DROP FUNCTION IF EXISTS cancel_terminated_contract(TEXT,TEXT);
DROP FUNCTION IF EXISTS soft_delete_employee(TEXT,TEXT);
DROP FUNCTION IF EXISTS restore_employee(TEXT,TEXT);

CREATE OR REPLACE FUNCTION create_employee(
  p_actor TEXT,
  p_prefix TEXT, p_nick TEXT, p_name TEXT, p_last TEXT, p_full_en TEXT,
  p_business_email TEXT, p_sex TEXT, p_supervisor UUID,
  p_type TEXT, p_status TEXT, p_start DATE, p_end DATE, p_probation_end DATE,
  p_department TEXT, p_position TEXT,
  p_personal JSONB DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE emp UUID; con UUID; dep TEXT; pos TEXT;
BEGIN
  PERFORM assert_hr(p_actor);
  INSERT INTO "Employees"("prefix","nickName","name","lastName","fullNameEn","businessEmail","sex","supervisor_id")
  VALUES (p_prefix,p_nick,p_name,p_last,p_full_en,p_business_email,p_sex,p_supervisor) RETURNING "id" INTO emp;
  INSERT INTO "Contract"("employeeId","type","status","start","end","probationEnd")
  VALUES (emp,p_type,p_status,p_start,p_end,p_probation_end) RETURNING "id" INTO con;
  SELECT g.out_department, g.out_position INTO dep, pos FROM get_or_create_position(p_actor,p_department,p_position) g;
  INSERT INTO "PositioningHistory"("contractId","positionId","departmentId","start") VALUES (con,pos,dep,p_start);
  IF p_personal IS NOT NULL THEN
    INSERT INTO "PersonalData"("employeeId","citizenId","bankAccount","socialSecurity","providentFund","taxDeductions","location","email","phone")
    VALUES (emp,p_personal->>'citizenId',p_personal->>'bankAccount',p_personal->>'socialSecurity',p_personal->>'providentFund',(p_personal->>'taxDeductions')::numeric,p_personal->>'location',p_personal->>'email',p_personal->>'phone');
  END IF;
  RETURN emp;
END $$;

CREATE OR REPLACE FUNCTION approve_probation(p_actor TEXT, p_contract UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Contract" SET "status" = 'ปฏิบัติงาน', "probationEnd" = COALESCE("probationEnd", th_today())
  WHERE "id" = p_contract AND "status" = 'ทดลองงาน';
  IF NOT FOUND THEN RAISE EXCEPTION 'สัญญานี้ไม่ได้อยู่ในสถานะทดลองงาน'; END IF;
END $$;

CREATE OR REPLACE FUNCTION reject_probation(p_actor TEXT, p_contract UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Contract" SET "status" = 'พ้นสภาพ', "end" = COALESCE("end", "probationEnd")
  WHERE "id" = p_contract AND "status" = 'ทดลองงาน' AND "probationEnd" <= th_today();
  IF NOT FOUND THEN RAISE EXCEPTION 'ไม่อนุมัติได้เฉพาะสัญญาทดลองงานที่ครบกำหนดแล้ว'; END IF;
END $$;

CREATE OR REPLACE FUNCTION renew_contract(p_actor TEXT, p_contract UUID, p_new_end DATE)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  IF p_new_end IS NOT NULL AND p_new_end <= th_today() THEN RAISE EXCEPTION 'วันสิ้นสุดสัญญาใหม่ต้องเป็นวันในอนาคต'; END IF;
  UPDATE "Contract" SET "status" = 'ปฏิบัติงาน', "end" = p_new_end
  WHERE "id" = p_contract AND "status" = 'พ้นสภาพ';
  IF NOT FOUND THEN RAISE EXCEPTION 'ต่อสัญญาได้เฉพาะสัญญาที่พ้นสภาพแล้ว'; END IF;
END $$;

CREATE OR REPLACE FUNCTION cancel_terminated_contract(p_actor TEXT, p_contract UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  DELETE FROM "Contract" WHERE "id" = p_contract AND "status" = 'พ้นสภาพ';
  IF NOT FOUND THEN RAISE EXCEPTION 'ลบได้เฉพาะสัญญาที่พ้นสภาพแล้ว'; END IF;
END $$;

CREATE OR REPLACE FUNCTION soft_delete_employee(p_actor TEXT, p_employee UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE c "Contract"%ROWTYPE;
BEGIN
  PERFORM assert_hr(p_actor);
  PERFORM 1 FROM "Employees" WHERE "id" = p_employee AND "deletedAt" IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ไม่พบพนักงานหรือถูกลบไปแล้ว'; END IF;
  SELECT * INTO c FROM "Contract" WHERE "employeeId" = p_employee ORDER BY "start" DESC, "id" DESC LIMIT 1;
  IF FOUND THEN
    IF c."status" <> 'พ้นสภาพ' THEN RAISE EXCEPTION 'ลบไม่ได้: สถานะการจ้างงานต้องเป็นพ้นสภาพ'; END IF;
    IF c."type" = 'พนักงานสัญญาจ้าง' AND (c."end" IS NULL OR c."end" > th_today()) THEN RAISE EXCEPTION 'ลบไม่ได้: สัญญาจ้างยังไม่ถึงวันครบสัญญา'; END IF;
  END IF;
  UPDATE "Employees" SET "deletedAt" = now(), "deletedBy" = p_actor WHERE "id" = p_employee;
  DELETE FROM "Sessions" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "employeeId" = p_employee);
END $$;

CREATE OR REPLACE FUNCTION restore_employee(p_actor TEXT, p_employee UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Employees" SET "deletedAt" = NULL, "deletedBy" = NULL WHERE "id" = p_employee AND "deletedAt" > now() - interval '7 days';
  IF NOT FOUND THEN RAISE EXCEPTION 'กู้คืนไม่ได้: ไม่พบรายการหรือเกิน 7 วันแล้ว'; END IF;
END $$;

COMMIT;
