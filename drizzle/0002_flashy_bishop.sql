ALTER TABLE "employees" ADD COLUMN "employee_code" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "english_name" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "position_histories" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "position_histories" ADD COLUMN "supervisor_employee_id" uuid;--> statement-breakpoint
WITH numbered_employees AS (
	SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at", "id") AS employee_number
	FROM "employees"
)
UPDATE "employees" AS employee
SET "employee_code" = 'EMP-' || LPAD(numbered.employee_number::text, 4, '0')
FROM numbered_employees AS numbered
WHERE employee."id" = numbered."id";--> statement-breakpoint
UPDATE "position_histories" AS history
SET "department_id" = position."department_id"
FROM "positions" AS position
WHERE history."position_id" = position."id";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "employee_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "position_histories" ALTER COLUMN "department_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "position_histories" ADD CONSTRAINT "position_histories_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_histories" ADD CONSTRAINT "position_histories_supervisor_employee_id_employees_id_fk" FOREIGN KEY ("supervisor_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code");