DROP TABLE IF EXISTS "position_histories";
--> statement-breakpoint
DROP TABLE IF EXISTS "employment_contracts";
--> statement-breakpoint
DROP TABLE IF EXISTS "personal_info";
--> statement-breakpoint
DROP TABLE IF EXISTS "positions";
--> statement-breakpoint
DROP TABLE IF EXISTS "departments";
--> statement-breakpoint
DROP TABLE IF EXISTS "employees";
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text,
	"prefix" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_company_email_unique" UNIQUE("company_email")
);
--> statement-breakpoint
CREATE TABLE "employment_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"employment_type" text NOT NULL,
	"employment_status" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"national_id" text,
	"address" text,
	"tax_allowance" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_info_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "position_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_name" text NOT NULL,
	"department_id" uuid NOT NULL,
	"is_hr_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_auth_user_id_auth_users_id_fk"
  FOREIGN KEY ("auth_user_id") REFERENCES "public"."auth_users"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_employee_id_employees_id_fk"
  FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_info" ADD CONSTRAINT "personal_info_employee_id_employees_id_fk"
  FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "position_histories" ADD CONSTRAINT "position_histories_contract_id_employment_contracts_id_fk"
  FOREIGN KEY ("contract_id") REFERENCES "public"."employment_contracts"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "position_histories" ADD CONSTRAINT "position_histories_position_id_positions_id_fk"
  FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_departments_id_fk"
  FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "employees_auth_user_id_unique" ON "employees" USING btree ("auth_user_id");
--> statement-breakpoint
CREATE INDEX "employees_auth_user_id_idx" ON "employees" USING btree ("auth_user_id");
--> statement-breakpoint
CREATE INDEX "employment_contracts_employee_id_idx" ON "employment_contracts" USING btree ("employee_id");
--> statement-breakpoint
CREATE INDEX "position_histories_contract_id_idx" ON "position_histories" USING btree ("contract_id");
--> statement-breakpoint
CREATE INDEX "position_histories_position_id_idx" ON "position_histories" USING btree ("position_id");
--> statement-breakpoint
CREATE INDEX "positions_department_id_idx" ON "positions" USING btree ("department_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION check_hr_before_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auth_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM position_histories ph
    JOIN employment_contracts ec ON ec.id = ph.contract_id
    JOIN positions p ON p.id = ph.position_id
    WHERE ec.employee_id = NEW.id
      AND p.is_hr_role = TRUE
      AND ph.effective_to IS NULL
  ) THEN
    RAISE EXCEPTION 'Only employees currently in an HR position can be linked to an auth user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_check_hr_before_link
BEFORE INSERT OR UPDATE OF auth_user_id ON employees
FOR EACH ROW
EXECUTE FUNCTION check_hr_before_link();
