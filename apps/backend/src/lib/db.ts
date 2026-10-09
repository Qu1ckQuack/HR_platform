import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as accountSchema from "../db/auth-schema";
import * as businessSchema from "../db/business-schema";
import * as relationSchema from "../db/relations";

const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
  });

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, {
  schema: { ...accountSchema, ...businessSchema, ...relationSchema },
});
