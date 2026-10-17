import { normalizeImportHeaders } from "./employee-import-headers";

const dateFields = new Set(["startDate", "contractEndDate", "probationCompletionDate"]);

export function parseEmployeeImportRow(headers: unknown[], values: unknown[]): Record<string, string> {
  const fields = normalizeImportHeaders(headers);
  const row = Object.fromEntries(fields.flatMap((field, index) => {
    if (!field) return [];
    const value = toImportValue(values[index], dateFields.has(field));
    return [[field, normalizeFieldValue(field, value)]];
  }));
  if (row.thaiName) {
    const [firstNameThai, ...lastName] = row.thaiName.trim().split(/\s+/);
    row.firstNameThai ||= firstNameThai ?? "";
    row.lastNameThai ||= lastName.join(" ");
    delete row.thaiName;
  }
  return row;
}

function toImportValue(value: unknown, isDate: boolean): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date && isDate && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && isDate && value > 0 && value < 100_000) {
    const excelDate = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000);
    return excelDate.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((item) => String(item.text ?? "")).join("").trim();
    }
    if ("result" in value) return toImportValue(value.result, isDate);
    return "";
  }
  return String(value).trim();
}

function normalizeFieldValue(field: string, value: string): string {
  if (field === "employmentStatus") {
    const statuses: Record<string, string> = {
      active: "ปฏิบัติงาน", probation: "ทดลองงาน", inactive: "พ้นสภาพ",
    };
    return statuses[value.toLocaleLowerCase()] ?? value;
  }
  if (field === "phone") {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.length === 9 ? `0${digits}` : digits;
    return normalized.length === 10
      ? `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`
      : value;
  }
  if (field === "bankAccount") {
    const digits = value.replace(/\D/g, "");
    return digits.length === 9 ? `0${digits}` : digits || value;
  }
  return value;
}
