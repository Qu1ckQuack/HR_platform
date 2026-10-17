export function maskSensitiveValue(value: string, visibleDigits = 4): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const visible = digits.slice(-visibleDigits);
  return `${"x".repeat(Math.max(4, digits.length - visibleDigits))}${visible}`;
}

export function preserveSensitiveValue(input: unknown, storedValue: string, visibleDigits = 4): string {
  const value = String(input ?? "").trim();
  if (!value) return storedValue;

  const normalizedMask = value.replace(/[\s-]/g, "").toLowerCase();
  const expectedMask = maskSensitiveValue(storedValue, visibleDigits).toLowerCase();
  return normalizedMask === expectedMask ? storedValue : value;
}

export function normalizeNationalIdFormatting(input: unknown): string {
  return String(input ?? "").trim().replace(/[\s-]/g, "");
}
