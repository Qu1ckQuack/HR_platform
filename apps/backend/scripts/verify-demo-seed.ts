import { config } from "dotenv";
import path from "node:path";
import { isThaiName } from "@hr-platform/shared/lib/thai-name";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

const seedEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const seedRole = process.env.SEED_ADMIN_ROLE ?? "super_admin";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!seedEmail) throw new Error("SEED_ADMIN_EMAIL is required.");

async function main() {
  const { db } = await import("../src/db");
  try {
    const result = await db.$client.query(`
      SELECT (SELECT count(*)::int FROM "Employees") employees,
        (SELECT count(*)::int FROM "PersonalData") personal,
        (SELECT count(*)::int FROM "Contract") contracts,
        (SELECT count(*)::int FROM "PositioningHistory") histories,
        (SELECT count(*)::int FROM "Department") departments,
        (SELECT count(*)::int FROM "Position") positions,
        (SELECT count(*)::int FROM "User" WHERE lower(email) = lower($1) AND role = $2 AND "emailVerified") admins,
        (SELECT count(*)::int FROM "Employees" WHERE coalesce("nickName", '') = '' OR coalesce("fullNameEn", '') = '' OR coalesce("businessEmail", '') = '' OR coalesce("sex", '') = '') missing_employee_fields,
        (SELECT count(*)::int FROM "PersonalData" WHERE "bankAccount" !~ '^[0-9]{1,15}$') invalid_banks,
        (SELECT count(*)::int FROM "PersonalData" WHERE "citizenId" !~ '^[0-9]{13}$') invalid_ids,
        (SELECT count(*)::int FROM "PersonalData" WHERE "phone" !~ '^[0-9]{3}-[0-9]{3}-[0-9]{4}$') invalid_phones,
        (SELECT count(*)::int FROM "PersonalData" WHERE coalesce("socialSecurity", '') = '' OR coalesce("providentFund", '') = '' OR coalesce("taxDeductions"::text, '') = '' OR coalesce("religion", '') = '' OR coalesce("disability", '') = '' OR coalesce("criminalRecord", '') = '' OR coalesce("salary"::text, '') = '' OR coalesce("location", '') = '' OR coalesce("email", '') = '') missing_personal_fields
    `, [seedEmail, seedRole]);
    const names = await db.$client.query<{ firstName: string; lastName: string }>(`SELECT "name" AS "firstName", "lastName" FROM "Employees"`);
    const nonThaiNames = names.rows.filter((row) => !isThaiName(row.firstName) || !isThaiName(row.lastName)).length;
    const routine = await db.$client.query<{ args: string; definition: string }>(`SELECT pg_get_function_identity_arguments(p.oid) AS args, pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = current_schema() AND p.proname = 'soft_delete_employee'`);
    const softDeleteUsesPrivateUuid = routine.rows.some((row) => row.args.includes("uuid") && /WHERE "id" = p_employee/.test(row.definition));
    const counts = result.rows[0];
    console.log(JSON.stringify({ ...counts, non_thai_names: nonThaiNames, soft_delete_uses_private_uuid: softDeleteUsesPrivateUuid }));
    if (counts.employees !== 30 || counts.personal !== 30 || counts.contracts !== 30 || counts.histories !== 30 || counts.departments !== 4 || counts.positions !== 8 || counts.admins !== 1 || counts.invalid_banks !== 0 || counts.invalid_ids !== 0 || counts.invalid_phones !== 0 || counts.missing_employee_fields !== 0 || counts.missing_personal_fields !== 0 || nonThaiNames !== 0 || !softDeleteUsesPrivateUuid) {
      throw new Error("Demo seed verification failed.");
    }
  } finally { await db.$client.end(); }
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
