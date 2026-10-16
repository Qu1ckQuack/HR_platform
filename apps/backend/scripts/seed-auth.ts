import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

requiredEnv("DATABASE_URL");

const email = requiredEnv("SEED_ADMIN_EMAIL").trim().toLowerCase();
const password = requiredEnv("SEED_ADMIN_PASSWORD");
const name = process.env.SEED_ADMIN_NAME ?? "HR Administrator";
const role = process.env.SEED_ADMIN_ROLE ?? "super_admin";

if (password.length < 12) {
  throw new Error("SEED_ADMIN_PASSWORD must contain at least 12 characters.");
}

if (role !== "super_admin" && role !== "hr") {
  throw new Error("SEED_ADMIN_ROLE must be either super_admin or hr.");
}

async function main() {
  const { and, eq, ilike, isNull, not, or } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { user } = await import("../src/db/auth-schema");
  const { employees, employmentContracts, positionHistories, positions } = await import("../src/db/business-schema");
  const { auth } = await import("../src/lib/auth");
  const [hrEmployee] = await db
    .select({ id: employees.id })
    .from(employees)
    .innerJoin(employmentContracts, and(eq(employmentContracts.employeeId, employees.id), not(eq(employmentContracts.employmentStatus, "พ้นสภาพ"))))
    .innerJoin(positionHistories, and(eq(positionHistories.contractId, employmentContracts.id), isNull(positionHistories.effectiveTo)))
    .innerJoin(positions, eq(positions.id, positionHistories.positionId))
    .where(and(
      eq(employees.companyEmail, email),
      isNull(employees.deletedAt),
      or(ilike(positions.positionName, "%hr%"), ilike(positions.positionName, "%บุคคล%")),
    ))
    .limit(1);

  if (!hrEmployee) throw new Error("SEED_ADMIN_EMAIL must match an active employee in an HR position.");

  const [existingUser] = await db
    .select({ id: user.id, employeeId: user.employeeId })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUser && existingUser.employeeId !== hrEmployee.id) {
    throw new Error("The existing account is not linked to the HR employee for SEED_ADMIN_EMAIL.");
  }

  if (!existingUser) {
    try {
      await auth.api.signUpEmail({ body: { email, password, name } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown seed error";
      throw new Error(`Unable to seed the admin user: ${message}`);
    }
  }

  const [updatedUser] = await db
    .update(user)
    .set({ role, emailVerified: true, updatedAt: new Date() })
    .where(eq(user.email, email))
    .returning({ id: user.id });

  if (!updatedUser) throw new Error("Unable to promote the admin account.");

  console.log(`Seeded auth user: ${email}`);
}

void main();
