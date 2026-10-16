export function getRateLimitRetryAfterSeconds(
  lastRequest: number,
  windowSeconds: number,
  now = Date.now(),
): number {
  const remaining = Math.ceil((lastRequest + windowSeconds * 1000 - now) / 1000);
  return Math.max(0, remaining);
}
