import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { requireDatabaseUrl } from "./src/lib/database-connection-config";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

export default defineConfig({
  schema: "./src/db/*-schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: requireDatabaseUrl(),
  },
});
