type Environment = Record<string, string | undefined>;

const LOCAL_BACKEND_URL = "http://localhost:4000";
const LOCAL_FRONTEND_URL = "http://localhost:3000";

function resolveOrigin(
  variable: "BETTER_AUTH_URL" | "FRONTEND_URL",
  value: string | undefined,
  fallback: string,
  isProduction: boolean,
): string {
  const configured = value?.trim();
  if (!configured) {
    if (isProduction) throw new Error(`${variable} is required in production.`);
    return fallback;
  }

  try {
    const url = new URL(configured);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new Error(`${variable} must be an absolute HTTP(S) origin without credentials or a path.`);
  }
}

export function getAuthRuntimeConfig(environment: Environment = process.env) {
  const isProduction = environment.NODE_ENV === "production";
  const backendUrl = resolveOrigin("BETTER_AUTH_URL", environment.BETTER_AUTH_URL, LOCAL_BACKEND_URL, isProduction);
  const frontendUrl = resolveOrigin("FRONTEND_URL", environment.FRONTEND_URL, LOCAL_FRONTEND_URL, isProduction);
  return { backendUrl, frontendUrl };
}
