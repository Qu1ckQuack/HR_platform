BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION th_today() RETURNS date
LANGUAGE sql STABLE AS $$ SELECT (now() AT TIME ZONE 'Asia/Bangkok')::date $$;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW."updatedAt" := now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION make_code(p_prefix TEXT, p_n BIGINT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT p_prefix || '_' || lpad(p_n::text, greatest(4, length(p_n::text)), '0')
$$;

CREATE SEQUENCE department_code_seq START 1;
CREATE SEQUENCE position_code_seq   START 1;
CREATE SEQUENCE contract_code_seq   START 1;
CREATE SEQUENCE poshist_code_seq    START 1;
CREATE SEQUENCE personal_code_seq   START 1;

CREATE TABLE "Department" (
  "id"    TEXT PRIMARY KEY DEFAULT make_code('DEP', nextval('department_code_seq'))
          CHECK ("id" ~ '^DEP_[0-9]{4,}$'),
  "title" TEXT NOT NULL UNIQUE
);

CREATE TABLE "Position" (
  "id"           TEXT PRIMARY KEY DEFAULT make_code('POS', nextval('position_code_seq'))
                 CHECK ("id" ~ '^POS_[0-9]{4,}$'),
  "title"        TEXT NOT NULL,
  "departmentId" TEXT NOT NULL REFERENCES "Department"("id") ON DELETE RESTRICT,
  UNIQUE ("departmentId", "title"),
  UNIQUE ("id", "departmentId")
);

CREATE SEQUENCE employee_code_seq START 1;

CREATE TABLE "Employees" (
  "id"            TEXT PRIMARY KEY DEFAULT ('EMP' || lpad(nextval('employee_code_seq')::text, 5, '0')),
  "prefix"        TEXT NOT NULL,
  "nickName"      TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  "fullNameEn"    TEXT,
  "businessEmail" TEXT NOT NULL UNIQUE,
  "sex"           TEXT NOT NULL CHECK ("sex" IN ('ชาย','หญิง','อื่นๆ')),
  "supervisor_id" TEXT REFERENCES "Employees"("id") ON DELETE SET NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt"     TIMESTAMPTZ,
  "deletedBy"     TEXT,
  "searchText"    TEXT GENERATED ALWAYS AS (
      lower("id" || ' ' || "name" || ' ' || "lastName" || ' ' || "nickName" || ' ' || coalesce("fullNameEn",''))
  ) STORED,
  CHECK ("supervisor_id" IS DISTINCT FROM "id"),
  CHECK (("deletedAt" IS NULL) = ("deletedBy" IS NULL))
);
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON "Employees"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE "User" (
  "id"            TEXT PRIMARY KEY,
  "employeeId"    TEXT NOT NULL UNIQUE REFERENCES "Employees"("id") ON DELETE CASCADE,
  "name"          TEXT NOT NULL,
  "email"         TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image"         TEXT,
  "role"          TEXT NOT NULL DEFAULT 'user'
                  CHECK ("role" IN ('super_admin','hr','user')),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_user_updated BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE "Employees"
  ADD CONSTRAINT fk_employees_deleted_by FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE SET NULL;

CREATE TABLE "Sessions" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "token"      TEXT NOT NULL UNIQUE,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "ipAddress"  INET,
  "deviceInfo" TEXT NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Account" (
  "id"                    TEXT PRIMARY KEY,
  "userId"                TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "accountId"             TEXT NOT NULL,
  "providerId"            TEXT NOT NULL,
  "accessToken"           TEXT NOT NULL,
  "refreshToken"          TEXT NOT NULL,
  "accessTokenExpiresAt"  TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  "scope"                 TEXT,
  "idToken"               TEXT,
  "password"              TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("providerId", "accountId")
);

CREATE TABLE "Verification" (
  "id"         TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value"      TEXT NOT NULL,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Contract" (
  "id"           TEXT PRIMARY KEY DEFAULT make_code('CNT', nextval('contract_code_seq'))
                 CHECK ("id" ~ '^CNT_[0-9]{4,}$'),
  "employeeId"   TEXT NOT NULL REFERENCES "Employees"("id") ON DELETE CASCADE,
  "type"         TEXT NOT NULL CHECK ("type" IN ('พนักงานประจำ','พนักงานสัญญาจ้าง','ฟรีแลนซ์','พนักงานพาร์ทไทม์')),
  "status"       TEXT NOT NULL CHECK ("status" IN ('ทดลองงาน','ปฏิบัติงาน','พ้นสภาพ')),
  "start"        DATE NOT NULL,
  "end"          DATE,
  "probationEnd" DATE,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ("end" IS NULL OR "end" >= "start"),
  CHECK ("probationEnd" IS NULL OR "probationEnd" >= "start"),
  CHECK ("type" <> 'พนักงานสัญญาจ้าง' OR "end" IS NOT NULL),
  CHECK ("status" <> 'ทดลองงาน' OR "probationEnd" IS NOT NULL)
);
CREATE TRIGGER trg_contract_updated BEFORE UPDATE ON "Contract"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE UNIQUE INDEX uq_contract_one_active ON "Contract"("employeeId") WHERE "status" <> 'พ้นสภาพ';

CREATE TABLE "PositioningHistory" (
  "id"           TEXT PRIMARY KEY DEFAULT make_code('PSH', nextval('poshist_code_seq'))
                 CHECK ("id" ~ '^PSH_[0-9]{4,}$'),
  "contractId"   TEXT NOT NULL REFERENCES "Contract"("id") ON DELETE CASCADE,
  "positionId"   TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "start"        DATE NOT NULL,
  "end"          DATE,
  CHECK ("end" IS NULL OR "end" >= "start"),
  FOREIGN KEY ("positionId","departmentId") REFERENCES "Position"("id","departmentId")
);
CREATE UNIQUE INDEX uq_poshist_one_current ON "PositioningHistory"("contractId") WHERE "end" IS NULL;

CREATE TABLE "PersonalData" (
  "id"             TEXT PRIMARY KEY DEFAULT make_code('PDT', nextval('personal_code_seq'))
                   CHECK ("id" ~ '^PDT_[0-9]{4,}$'),
  "employeeId"     TEXT NOT NULL UNIQUE REFERENCES "Employees"("id") ON DELETE CASCADE,
  "citizenId"      TEXT NOT NULL UNIQUE CHECK ("citizenId" ~ '^[0-9]{13}$'),
  "bankAccount"    TEXT NOT NULL,
  "socialSecurity" TEXT,
  "providentFund"  TEXT,
  "taxDeductions"  NUMERIC(12,2) CHECK ("taxDeductions" >= 0),
  "location"       TEXT NOT NULL,
  "email"          TEXT NOT NULL,
  "phone"          TEXT,
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_personal_updated BEFORE UPDATE ON "PersonalData"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX ix_employees_search_trgm ON "Employees" USING gin ("searchText" gin_trgm_ops) WHERE "deletedAt" IS NULL;
CREATE INDEX ix_employees_id_prefix   ON "Employees" ("id" text_pattern_ops) WHERE "deletedAt" IS NULL;
CREATE INDEX ix_employees_supervisor  ON "Employees" ("supervisor_id");
CREATE INDEX ix_employees_deleted_at  ON "Employees" ("deletedAt") WHERE "deletedAt" IS NOT NULL;

CREATE INDEX ix_department_title_trgm ON "Department" USING gin ("title" gin_trgm_ops);
CREATE INDEX ix_position_title_trgm   ON "Position" USING gin ("title" gin_trgm_ops);
CREATE INDEX ix_position_department   ON "Position" ("departmentId");

CREATE INDEX ix_contract_emp_start    ON "Contract" ("employeeId", "start" DESC);
CREATE INDEX ix_contract_status       ON "Contract" ("status");
CREATE INDEX ix_contract_end_alert    ON "Contract" ("end") WHERE "status" <> 'พ้นสภาพ' AND "end" IS NOT NULL;
CREATE INDEX ix_contract_probation    ON "Contract" ("probationEnd") WHERE "status" = 'ทดลองงาน';

CREATE INDEX ix_poshist_contract      ON "PositioningHistory" ("contractId", "start" DESC);
CREATE INDEX ix_poshist_dept          ON "PositioningHistory" ("departmentId");
CREATE INDEX ix_poshist_position      ON "PositioningHistory" ("positionId");

CREATE INDEX ix_sessions_user         ON "Sessions" ("userId");
CREATE INDEX ix_sessions_expires      ON "Sessions" ("expiresAt");
CREATE INDEX ix_account_user          ON "Account" ("userId");
CREATE INDEX ix_verification_ident    ON "Verification" ("identifier");
CREATE INDEX ix_verification_expires  ON "Verification" ("expiresAt");

CREATE OR REPLACE FUNCTION assert_hr(p_actor TEXT) RETURNS void
LANGUAGE plpgsql STABLE AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "User"
                 WHERE "id" = p_actor AND "role" IN ('super_admin','hr') AND "emailVerified") THEN
    RAISE EXCEPTION 'ไม่มีสิทธิ์ดำเนินการ (ต้องเป็น HR/Super Admin ที่ยืนยันอีเมลแล้ว)' USING ERRCODE = '42501';
  END IF;
END $$;

CREATE OR REPLACE VIEW v_employee_list AS
SELECT e."id"                         AS "employeeCode",
       e."prefix", e."name", e."lastName", e."nickName", e."searchText",
       c."id"                         AS "contractId",
       c."type", c."status", c."start",
       CASE WHEN c."status" = 'ทดลองงาน' THEN c."probationEnd" ELSE c."end" END AS "dueDate",
       c."end", c."probationEnd",
       d."title"                      AS "department",
       p."title"                      AS "position"
FROM "Employees" e
LEFT JOIN LATERAL (
    SELECT * FROM "Contract" WHERE "employeeId" = e."id" ORDER BY "start" DESC, "id" DESC LIMIT 1
) c ON TRUE
LEFT JOIN "PositioningHistory" ph ON ph."contractId" = c."id" AND ph."end" IS NULL
LEFT JOIN "Position"   p ON p."id" = ph."positionId"
LEFT JOIN "Department" d ON d."id" = ph."departmentId"
WHERE e."deletedAt" IS NULL;

CREATE OR REPLACE VIEW v_contract_alerts AS
SELECT c."id" AS "contractId", c."employeeId", c."type", c."status", c."end", c."probationEnd",
       'CONTRACT_EXPIRED'::text AS "alert"
FROM "Contract" c JOIN "Employees" e ON e."id" = c."employeeId" AND e."deletedAt" IS NULL
WHERE c."status" <> 'พ้นสภาพ' AND c."end" IS NOT NULL AND c."end" < th_today()
UNION ALL
SELECT c."id", c."employeeId", c."type", c."status", c."end", c."probationEnd",
       'PROBATION_DUE'
FROM "Contract" c JOIN "Employees" e ON e."id" = c."employeeId" AND e."deletedAt" IS NULL
WHERE c."status" = 'ทดลองงาน' AND c."probationEnd" <= th_today();

CREATE OR REPLACE VIEW v_employee_trash AS
SELECT "id" AS "employeeCode", "name", "lastName", "deletedAt", "deletedBy",
       "deletedAt" + interval '7 days' AS "restorableUntil"
FROM "Employees"
WHERE "deletedAt" IS NOT NULL AND "deletedAt" > now() - interval '7 days';

CREATE OR REPLACE FUNCTION get_or_create_position(p_actor TEXT, p_department TEXT, p_title TEXT)
RETURNS TABLE (out_department TEXT, out_position TEXT)
LANGUAGE plpgsql AS $$
DECLARE d TEXT; p TEXT;
BEGIN
  PERFORM assert_hr(p_actor);
  INSERT INTO "Department"("title") VALUES (p_department)
    ON CONFLICT ("title") DO UPDATE SET "title" = EXCLUDED."title" RETURNING "id" INTO d;
  INSERT INTO "Position"("title","departmentId") VALUES (p_title, d)
    ON CONFLICT ("departmentId","title") DO UPDATE SET "title" = EXCLUDED."title" RETURNING "id" INTO p;
  RETURN QUERY SELECT d, p;
END $$;

CREATE OR REPLACE FUNCTION create_employee(
  p_actor TEXT,
  p_prefix TEXT, p_nick TEXT, p_name TEXT, p_last TEXT, p_full_en TEXT,
  p_business_email TEXT, p_sex TEXT, p_supervisor TEXT,
  p_type TEXT, p_status TEXT, p_start DATE, p_end DATE, p_probation_end DATE,
  p_department TEXT, p_position TEXT,
  p_personal JSONB DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE emp TEXT; con TEXT; dep TEXT; pos TEXT;
BEGIN
  PERFORM assert_hr(p_actor);
  INSERT INTO "Employees"("prefix","nickName","name","lastName","fullNameEn","businessEmail","sex","supervisor_id")
  VALUES (p_prefix,p_nick,p_name,p_last,p_full_en,p_business_email,p_sex,p_supervisor) RETURNING "id" INTO emp;

  INSERT INTO "Contract"("employeeId","type","status","start","end","probationEnd")
  VALUES (emp,p_type,p_status,p_start,p_end,p_probation_end) RETURNING "id" INTO con;

  SELECT g.out_department, g.out_position INTO dep, pos FROM get_or_create_position(p_actor,p_department,p_position) g;
  INSERT INTO "PositioningHistory"("contractId","positionId","departmentId","start")
  VALUES (con,pos,dep,p_start);

  IF p_personal IS NOT NULL THEN
    INSERT INTO "PersonalData"("employeeId","citizenId","bankAccount","socialSecurity","providentFund",
                               "taxDeductions","location","email","phone")
    VALUES (emp,p_personal->>'citizenId',p_personal->>'bankAccount',p_personal->>'socialSecurity',
            p_personal->>'providentFund',(p_personal->>'taxDeductions')::numeric,
            p_personal->>'location',p_personal->>'email',p_personal->>'phone');
  END IF;
  RETURN emp;
END $$;

CREATE OR REPLACE FUNCTION approve_probation(p_actor TEXT, p_contract TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Contract" SET "status" = 'ปฏิบัติงาน', "probationEnd" = COALESCE("probationEnd", th_today())
  WHERE "id" = p_contract AND "status" = 'ทดลองงาน';
  IF NOT FOUND THEN RAISE EXCEPTION 'สัญญานี้ไม่ได้อยู่ในสถานะทดลองงาน'; END IF;
END $$;

CREATE OR REPLACE FUNCTION renew_contract(p_actor TEXT, p_contract TEXT, p_new_end DATE)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  IF p_new_end IS NOT NULL AND p_new_end <= th_today() THEN
    RAISE EXCEPTION 'วันสิ้นสุดสัญญาใหม่ต้องเป็นวันในอนาคต';
  END IF;
  UPDATE "Contract" SET "status" = 'ปฏิบัติงาน', "end" = p_new_end
  WHERE "id" = p_contract AND "status" = 'พ้นสภาพ';
  IF NOT FOUND THEN RAISE EXCEPTION 'ต่อสัญญาได้เฉพาะสัญญาที่พ้นสภาพแล้ว'; END IF;
END $$;

CREATE OR REPLACE FUNCTION expire_contracts(p_actor TEXT DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  IF p_actor IS NOT NULL THEN PERFORM assert_hr(p_actor); END IF;
  UPDATE "Contract" SET "status" = 'พ้นสภาพ'
  WHERE "status" <> 'พ้นสภาพ' AND "end" IS NOT NULL AND "end" < th_today();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION soft_delete_employee(p_actor TEXT, p_employee TEXT)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE c "Contract"%ROWTYPE; uid TEXT;
BEGIN
  PERFORM assert_hr(p_actor);
  PERFORM 1 FROM "Employees" WHERE "id" = p_employee AND "deletedAt" IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ไม่พบพนักงาน % หรือถูกลบไปแล้ว', p_employee; END IF;

  SELECT * INTO c FROM "Contract" WHERE "employeeId" = p_employee ORDER BY "start" DESC, "id" DESC LIMIT 1;
  IF FOUND THEN
    IF c."status" <> 'พ้นสภาพ' THEN
      RAISE EXCEPTION 'ลบไม่ได้: สถานะการจ้างงานต้องเป็น "พ้นสภาพ"';
    END IF;
    IF c."type" = 'พนักงานสัญญาจ้าง' AND (c."end" IS NULL OR c."end" > th_today()) THEN
      RAISE EXCEPTION 'ลบไม่ได้: สัญญาจ้างยังไม่ถึงวันครบสัญญา';
    END IF;
  END IF;

  UPDATE "Employees" SET "deletedAt" = now(), "deletedBy" = p_actor WHERE "id" = p_employee;
  DELETE FROM "Sessions" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "employeeId" = p_employee);
END $$;

CREATE OR REPLACE FUNCTION restore_employee(p_actor TEXT, p_employee TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Employees" SET "deletedAt" = NULL, "deletedBy" = NULL
  WHERE "id" = p_employee AND "deletedAt" > now() - interval '7 days';
  IF NOT FOUND THEN RAISE EXCEPTION 'กู้คืนไม่ได้: ไม่พบรายการ หรือเกิน 7 วันแล้ว'; END IF;
END $$;

CREATE OR REPLACE FUNCTION purge_deleted_employees()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  DELETE FROM "Employees" WHERE "deletedAt" IS NOT NULL AND "deletedAt" <= now() - interval '7 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

COMMIT;
