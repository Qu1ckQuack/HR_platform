export function requireDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Set it in the repository-root .env.local for local development or in the backend runtime environment.",
    );
  }

  return databaseUrl;
}

export function getScramPasswordErrorHint(error: unknown): string | undefined {
  let current: unknown = error;

  while (current instanceof Error) {
    if (current.message.includes("client password must be a string")) {
      return "PostgreSQL requested SCRAM authentication, but the backend did not receive a string password. Check DATABASE_URL credentials or set PGPASSWORD in the backend environment. URL-encode reserved characters in the connection URL; credentials are not logged.";
    }

    current = current.cause;
  }

  return undefined;
}
