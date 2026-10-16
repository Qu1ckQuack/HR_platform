import { config } from "dotenv";
import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { assertConfirmedLocalDatabase, clearLocalDatabase } from "./local-database-maintenance";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const { db } = await import("../src/db");
  try {
    await assertConfirmedLocalDatabase(db);
    await migrate(db, { migrationsFolder: "./drizzle" });
    await clearLocalDatabase(db);
    console.info("Cleared application data from local hr_platform.");
  } finally {
    await db.$client.end();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
