type AuthSecretEnvironment = Record<string, string | undefined>;

const LOCAL_DEVELOPMENT_SECRET = "local-development-secret-change-me-32-chars";
const PRODUCTION_BUILD_SECRET = "build-only-secret-set-the-environment-variable";

export function getBetterAuthSecret(environment: AuthSecretEnvironment = process.env): string {
  const authSecret = environment.BETTER_AUTH_SECRET ?? (
    environment.NODE_ENV !== "production"
      ? LOCAL_DEVELOPMENT_SECRET
      : environment.NEXT_PHASE === "phase-production-build"
        ? PRODUCTION_BUILD_SECRET
        : ""
  );

  if (!authSecret) throw new Error("BETTER_AUTH_SECRET must be set in production.");
  return authSecret;
}
