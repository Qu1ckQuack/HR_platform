import { config } from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { departmentFixtures, employeeFixture, positionFixtures } from "./employee-fixtures";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

async function clearLocalDatabase(db: typeof import("../src/db").db) {
  const url = new URL(process.env.DATABASE_URL ?? "");
  const { rows } = await db.$client.query<{ database: string }>("SELECT current_database() AS database");
  if (!new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname) || rows[0]?.database !== "hr_platform") {
    throw new Error("Refusing reset: target must be the local hr_platform database.");
  }
  await db.$client.query(`TRUNCATE TABLE "Verification", "Sessions", "Account", "User", "PositioningHistory", "PersonalData", "Contract", "Employees", "Position", "Department" RESTART IDENTITY CASCADE`);
  await db.$client.query("ALTER SEQUENCE department_code_seq RESTART WITH 1; ALTER SEQUENCE position_code_seq RESTART WITH 1; ALTER SEQUENCE contract_code_seq RESTART WITH 1; ALTER SEQUENCE poshist_code_seq RESTART WITH 1; ALTER SEQUENCE personal_code_seq RESTART WITH 1; ALTER SEQUENCE employee_code_seq RESTART WITH 1");
}

async function seedEmployees(db: typeof import("../src/db").db, adminEmail: string) {
  const schema = await import("../src/db/business-schema");
  await db.transaction(async (tx) => {
    const departments = await tx.insert(schema.departments).values(departmentFixtures.map(({ name }) => ({ departmentName: name }))).returning();
    const departmentIds = new Map(departments.map((item) => [item.departmentName, item.id]));
    const positions = await tx.insert(schema.positions).values(positionFixtures.map((item) => ({ positionName: item.name, departmentId: departmentIds.get(departmentFixtures.find((department) => department.code === item.department)!.name)! }))).returning();
    const positionIds = new Map(positions.map((item) => [item.positionName, item.id]));
    let managerId: string | null = null;
    for (let index = 0; index < 30; index += 1) {
      const item = employeeFixture(index, adminEmail);
      const insertedEmployees: Array<{ id: string }> = await tx.insert(schema.employees).values({ ...item.employee, supervisorEmployeeId: managerId }).returning({ id: schema.employees.id });
      const employee = insertedEmployees[0];
      if (!employee) throw new Error(`Unable to create demo employee ${index + 1}.`);
      if (index === 0) managerId = employee.id;
      await tx.insert(schema.personalInfo).values({ ...item.personal, employeeId: employee.id });
      const [contract] = await tx.insert(schema.employmentContracts).values({ ...item.contract, employeeId: employee.id }).returning({ id: schema.employmentContracts.id });
      const departmentName = departmentFixtures.find((department) => department.code === item.departmentCode)!.name;
      const positionName = positionFixtures.find((position) => position.code === item.positionCode)!.name;
      await tx.insert(schema.positionHistories).values({ contractId: contract!.id, departmentId: departmentIds.get(departmentName)!, positionId: positionIds.get(positionName)!, effectiveFrom: item.contract.startDate });
    }
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!process.argv.includes("--reset")) throw new Error("Pass --reset to confirm the destructive local database reset.");
  const { db } = await import("../src/db");
  try {
    await clearLocalDatabase(db);
    await migrate(db, { migrationsFolder: "./drizzle" });
    const constraint = await db.$client.query<{ found: boolean }>(`SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PersonalData_bankAccount_check') AS found`);
    if (!constraint.rows[0]?.found) await db.$client.query(`ALTER TABLE "PersonalData" ADD CONSTRAINT "PersonalData_bankAccount_check" CHECK ("bankAccount" ~ '^[0-9]{10}$')`);
    await seedEmployees(db, process.env.SEED_ADMIN_EMAIL ?? "kullatorn.chai@gmail.com");
    const counts = await db.$client.query<{ employees: number; personal: number; contracts: number; invalid_banks: number }>(`SELECT (SELECT count(*)::int FROM "Employees") employees, (SELECT count(*)::int FROM "PersonalData") personal, (SELECT count(*)::int FROM "Contract") contracts, (SELECT count(*)::int FROM "PersonalData" WHERE "bankAccount" !~ '^[0-9]{10}$') invalid_banks`);
    const result = counts.rows[0];
    if (result?.employees !== 30 || result.personal !== 30 || result.contracts !== 30 || result.invalid_banks !== 0) throw new Error("Seed validation failed. Check the database before continuing.");
    console.log("Reset local hr_platform and verified 30 complete employee, personal-data, and contract records.");
  } finally { await db.$client.end(); }
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
