type Environment = Record<string, string | undefined>;

const DEFAULT_IP_HEADERS = ["x-forwarded-for"];

function parseList(value: string | undefined): string[] {
  return value
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean) ?? [];
}

export function getAuthIpAddressOptions(environment: Environment = process.env) {
  const configuredHeaders = parseList(environment.BETTER_AUTH_IP_ADDRESS_HEADERS);

  return {
    ipAddressHeaders: configuredHeaders.length > 0 ? configuredHeaders : DEFAULT_IP_HEADERS,
    trustedProxies: parseList(environment.BETTER_AUTH_TRUSTED_PROXIES),
  };
}

export function assertAuthIpAddressOptionsConfigured(
  environment: Environment = process.env,
): void {
  if (
    environment.NODE_ENV === "production" &&
    parseList(environment.BETTER_AUTH_IP_ADDRESS_HEADERS).length === 0
  ) {
    throw new Error(
      "Set BETTER_AUTH_IP_ADDRESS_HEADERS in production to the client-IP header forwarded by the trusted ingress.",
    );
  }
}

export function isUnresolvedClientIpKey(key: string): boolean {
  // Better Auth 1.7.5 uses this prefix when no trustworthy request IP is available.
  return key.startsWith("no-trusted-ip|");
}
