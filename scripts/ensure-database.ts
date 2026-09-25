import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error(
      "DATABASE_URL is missing. Add it to .env.local before running npm run db:ensure.",
    );
  }

  return value;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function getDatabaseName(connectionString: string) {
  let url: URL;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

  if (!databaseName) {
    throw new Error(
      "DATABASE_URL must include a database name, for example /hr_platform.",
    );
  }

  return { databaseName, url };
}

async function canConnect(connectionString: string) {
  const client = new Client({ connectionString });
  client.on("error", (error) => {
    console.error("Unexpected PostgreSQL client error:", error);
  });

  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function createDatabase(connectionString: string, databaseName: string) {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  const databaseUrl = requireDatabaseUrl();
  const { databaseName, url } = getDatabaseName(databaseUrl);

  try {
    await canConnect(databaseUrl);
    console.log(`Database "${databaseName}" already exists and is reachable.`);
    return;
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    if (code !== "3D000") {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to connect to "${databaseName}": ${message}`);
    }
  }

  const adminUrl = process.env.DATABASE_ADMIN_URL ?? new URL(url);
  if (adminUrl instanceof URL) {
    adminUrl.pathname = "/postgres";
  }

  try {
    await createDatabase(adminUrl.toString(), databaseName);
    console.log(`Created database "${databaseName}".`);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    if (code === "42P04") {
      console.log(`Database "${databaseName}" was created by another process.`);
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Unable to create database "${databaseName}" using DATABASE_ADMIN_URL or the postgres maintenance database: ${message}`,
    );
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
