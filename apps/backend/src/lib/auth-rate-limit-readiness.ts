import { sql } from "drizzle-orm";

import { getScramPasswordErrorHint } from "./database-connection-config";
import { db } from "./db";

type ReadinessRow = {
  tableName: string | null;
  canSelect: boolean;
  canInsert: boolean;
  canUpdate: boolean;
};

export async function assertAuthRateLimitStorageReady(): Promise<void> {
  const result = await db.execute(sql`
    WITH target AS (SELECT to_regclass('"AuthRateLimits"') AS relation)
    SELECT relation::text AS "tableName",
      COALESCE(has_table_privilege(current_user, relation, 'SELECT'), false) AS "canSelect",
      COALESCE(has_table_privilege(current_user, relation, 'INSERT'), false) AS "canInsert",
      COALESCE(has_table_privilege(current_user, relation, 'UPDATE'), false) AS "canUpdate"
    FROM target
  `).catch((error: unknown) => {
    const hint = getScramPasswordErrorHint(error);
    throw hint ? new Error(hint) : error;
  });
  const row = result.rows[0] as ReadinessRow | undefined;

  if (!row?.tableName) {
    throw new Error(
      'AuthRateLimits is missing or not visible in the configured database search_path. Apply migration 0011 to the backend DATABASE_URL and keep the migration and backend schemas aligned.',
    );
  }

  const missingPrivileges = [
    !row.canSelect && "SELECT",
    !row.canInsert && "INSERT",
    !row.canUpdate && "UPDATE",
  ].filter(Boolean);

  if (missingPrivileges.length > 0) {
    throw new Error(
      `The backend database role needs ${missingPrivileges.join(", ")} on AuthRateLimits.`,
    );
  }
}
