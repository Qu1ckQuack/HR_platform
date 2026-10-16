import type { db } from "../src/db";

const confirmationFlag = "--confirm-local-reset";
const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export async function assertConfirmedLocalDatabase(database: typeof db) {
  if (!process.argv.includes(confirmationFlag)) {
    throw new Error(`Pass ${confirmationFlag} to confirm this destructive operation.`);
  }

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const url = new URL(connectionString);
  const { rows } = await database.$client.query<{ database: string }>(
    "SELECT current_database() AS database",
  );
  if (!localHosts.has(url.hostname) || rows[0]?.database !== "hr_platform") {
    throw new Error("Refusing destructive operation: target must be local hr_platform.");
  }
}

export async function clearLocalDatabase(database: typeof db) {
  await assertConfirmedLocalDatabase(database);
  await database.$client.query(`TRUNCATE TABLE
    "Verification", "Sessions", "Account", "PasswordResetRecovery", "AuthRateLimits",
    "User", "PositioningHistory", "PersonalData", "Contract", "Employees", "Position", "Department"
    RESTART IDENTITY CASCADE`);
}
