BEGIN;

CREATE OR REPLACE FUNCTION reject_probation(p_actor TEXT, p_contract TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  UPDATE "Contract"
  SET "status" = 'พ้นสภาพ',
      "end" = COALESCE("end", "probationEnd")
  WHERE "id" = p_contract
    AND "status" = 'ทดลองงาน'
    AND "probationEnd" <= th_today();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ไม่อนุมัติได้เฉพาะสัญญาทดลองงานที่ครบกำหนดแล้ว';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION cancel_terminated_contract(p_actor TEXT, p_contract TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM assert_hr(p_actor);
  DELETE FROM "Contract"
  WHERE "id" = p_contract
    AND "status" = 'พ้นสภาพ';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ยกเลิกได้เฉพาะสัญญาที่พ้นสภาพแล้ว';
  END IF;
END $$;

COMMIT;
