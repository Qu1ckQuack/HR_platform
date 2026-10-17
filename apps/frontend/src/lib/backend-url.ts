type Environment = Record<string, string | undefined>;

const LOCAL_BACKEND_URL = "http://localhost:4000";

export function getBackendUrl(environment: Environment = process.env): string {
  const configuredUrl = environment.BACKEND_URL?.trim();
  if (!configuredUrl) {
    if (environment.VERCEL === "1") {
      throw new Error("BACKEND_URL must be configured for Vercel deployments.");
    }
    return LOCAL_BACKEND_URL;
  }

  try {
    const url = new URL(configuredUrl);
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
    throw new Error("BACKEND_URL must be an absolute HTTP(S) origin without credentials or a path.");
  }
}
