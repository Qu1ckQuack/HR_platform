CREATE SEQUENCE "employee_code_seq";
SELECT setval(
	'employee_code_seq',
	COALESCE((SELECT MAX(SUBSTRING("employee_code" FROM 5)::integer) FROM "employees"), 1),
	(SELECT COUNT(*) > 0 FROM "employees")
);--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "employee_code" SET DEFAULT 'EMP-' || lpad(nextval('employee_code_seq')::text, 4, '0');