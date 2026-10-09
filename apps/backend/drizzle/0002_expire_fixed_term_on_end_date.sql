BEGIN;

CREATE OR REPLACE FUNCTION expire_contracts(p_actor TEXT DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  IF p_actor IS NOT NULL THEN PERFORM assert_hr(p_actor); END IF;
  UPDATE "Contract"
  SET "status" = 'พ้นสภาพ'
  WHERE "status" <> 'พ้นสภาพ'
    AND "type" = 'พนักงานสัญญาจ้าง'
    AND "end" IS NOT NULL
    AND "end" <= th_today();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE VIEW v_contract_alerts AS
SELECT c."id" AS "contractId", c."employeeId", c."type", c."status", c."end", c."probationEnd",
       'CONTRACT_EXPIRED'::text AS "alert"
FROM "Contract" c
JOIN "Employees" e ON e."id" = c."employeeId" AND e."deletedAt" IS NULL
WHERE c."type" = 'พนักงานสัญญาจ้าง'
  AND c."status" = 'พ้นสภาพ'
  AND c."end" IS NOT NULL
  AND c."end" <= th_today()
UNION ALL
SELECT c."id", c."employeeId", c."type", c."status", c."end", c."probationEnd",
       'PROBATION_DUE'
FROM "Contract" c
JOIN "Employees" e ON e."id" = c."employeeId" AND e."deletedAt" IS NULL
WHERE c."status" = 'ทดลองงาน'
  AND c."probationEnd" <= th_today();

COMMIT;
