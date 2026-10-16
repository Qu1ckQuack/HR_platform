import assert from "node:assert/strict";
import test from "node:test";

import {
  getScramPasswordErrorHint,
  requireDatabaseUrl,
} from "./database-connection-config";

test("requires a non-empty database URL", () => {
  assert.throws(() => requireDatabaseUrl({}), /DATABASE_URL is required/);
  assert.throws(() => requireDatabaseUrl({ DATABASE_URL: "  " }), /DATABASE_URL is required/);
});

test("trims the configured database URL", () => {
  assert.equal(
    requireDatabaseUrl({ DATABASE_URL: " postgresql://db.example/hr " }),
    "postgresql://db.example/hr",
  );
});

test("explains nested SCRAM password configuration errors without credentials", () => {
  const error = new Error("Drizzle query failed", {
    cause: new Error("SASL: client password must be a string"),
  });

  assert.match(getScramPasswordErrorHint(error) ?? "", /DATABASE_URL credentials or set PGPASSWORD/);
  assert.equal(getScramPasswordErrorHint(new Error("connection refused")), undefined);
});
