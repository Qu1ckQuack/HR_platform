import { config } from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { departmentFixtures, employeeFixture, positionFixtures } from "./employee-fixtures";
import { assertConfirmedLocalDatabase, clearLocalDatabase } from "./local-database-maintenance";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

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
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) throw new Error("SEED_ADMIN_EMAIL is required in the environment before resetting demo data.");
  const { db } = await import("../src/db");
  try {
    await assertConfirmedLocalDatabase(db);
    await migrate(db, { migrationsFolder: "./drizzle" });
    await clearLocalDatabase(db);
    const constraint = await db.$client.query<{ found: boolean }>(`SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PersonalData_bankAccount_check') AS found`);
    if (!constraint.rows[0]?.found) await db.$client.query(`ALTER TABLE "PersonalData" ADD CONSTRAINT "PersonalData_bankAccount_check" CHECK ("bankAccount" ~ '^[0-9]{10}$')`);
    await seedEmployees(db, adminEmail);
    const counts = await db.$client.query<{ employees: number; personal: number; contracts: number; invalid_banks: number }>(`SELECT (SELECT count(*)::int FROM "Employees") employees, (SELECT count(*)::int FROM "PersonalData") personal, (SELECT count(*)::int FROM "Contract") contracts, (SELECT count(*)::int FROM "PersonalData" WHERE "bankAccount" !~ '^[0-9]{10}$') invalid_banks`);
    const result = counts.rows[0];
    if (result?.employees !== 30 || result.personal !== 30 || result.contracts !== 30 || result.invalid_banks !== 0) throw new Error("Seed validation failed. Check the database before continuing.");
    console.log("Reset local hr_platform and verified 30 complete employee, personal-data, and contract records.");
  } finally { await db.$client.end(); }
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
