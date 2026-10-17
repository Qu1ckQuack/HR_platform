export type BackendLogLevel = "info" | "warn" | "error";
export type BackendLogFields = Record<string, string | number | boolean | undefined>;

const SECRET_ASSIGNMENT = /\b([a-z0-9_.-]*(?:api[-_ ]?key|password|passwd|otp|code|token|secret|authorization|cookie|credential|email)[a-z0-9_.-]*)(\s*[:=]\s*)([^\s,;]+)/gi;
const AUTHORIZATION_HEADER = /\bauthorization\b(\s*[:=]\s*)(?:(?:bearer|basic)\s+)?[^\s,;]+/gi;
const SENSITIVE_FIELD_NAME = /(?:email|password|passwd|otp|token|secret|api.?key|authorization|cookie|credential|hash|verificationcode|recoverycode)/i;
const EMAIL_ADDRESS = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const RESEND_API_KEY = /\bre_[A-Z0-9_-]{10,}\b/gi;
const URL_CREDENTIALS = /([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi;
const SIX_DIGIT_VALUE = /\b\d{6}\b/g;

export function sanitizeBackendLogMessage(value: string): string {
  return value
    .replace(URL_CREDENTIALS, "$1[redacted]@")
    .replace(AUTHORIZATION_HEADER, "authorization$1[redacted]")
    .replace(SECRET_ASSIGNMENT, (_match, label: string, separator: string) => `${label}${separator}[redacted]`)
    .replace(RESEND_API_KEY, "[redacted_api_key]")
    .replace(EMAIL_ADDRESS, "[redacted]@$1")
    .replace(SIX_DIGIT_VALUE, "[redacted_otp]")
    .replace(/[\r\n\t\0-\x1f\x7f]/g, " ")
    .slice(0, 500);
}

function getObjectField(value: unknown, key: string): unknown {
  return value && typeof value === "object" && key in value
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

function getSafeErrorPart(error: unknown, prefix: string, fields: BackendLogFields) {
  if (!error || typeof error !== "object") {
    if (typeof error === "string") fields[`${prefix}Message`] = sanitizeBackendLogMessage(error);
    return;
  }

  const name = getObjectField(error, "name");
  const message = getObjectField(error, "message");
  const code = getObjectField(error, "code");
  const statusCode = getObjectField(error, "statusCode") ?? getObjectField(error, "status");

  if (typeof name === "string") fields[`${prefix}Name`] = sanitizeBackendLogMessage(name);
  if (typeof message === "string") fields[`${prefix}Message`] = sanitizeBackendLogMessage(message);
  if (typeof code === "string" || typeof code === "number") {
    fields[`${prefix}Code`] = sanitizeBackendLogMessage(String(code));
  }
  if (typeof statusCode === "number" && Number.isFinite(statusCode)) {
    fields[`${prefix}StatusCode`] = statusCode;
  }
}

export function getSafeBackendErrorFields(error: unknown): BackendLogFields {
  const fields: BackendLogFields = {};
  getSafeErrorPart(error, "error", fields);

  const cause = getObjectField(error, "cause");
  if (cause !== undefined) getSafeErrorPart(cause, "cause", fields);

  return fields;
}

export function serializeBackendLog(
  event: string,
  fields: BackendLogFields = {},
  level: BackendLogLevel = "info",
  area = "backend",
  now = new Date(),
): string {
  const safeFields = Object.fromEntries(Object.entries(fields).map(([key, value]) => [
    key,
    SENSITIVE_FIELD_NAME.test(key)
      ? "[redacted]"
      : typeof value === "string"
        ? sanitizeBackendLogMessage(value)
        : value,
  ]));

  return JSON.stringify({
    ...safeFields,
    timestamp: now.toISOString(),
    level,
    service: "hr-platform-backend",
    area,
    event,
  });
}

export function logBackendEvent(
  event: string,
  fields: BackendLogFields = {},
  level: BackendLogLevel = "info",
  area = "backend",
) {
  const line = serializeBackendLog(event, fields, level, area);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
