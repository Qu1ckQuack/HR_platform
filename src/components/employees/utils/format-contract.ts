import type { Employee } from "@/types/employee";
import { formatBuddhistDate } from "@/lib/employment-dates";

export function formatContractDeadline(employee: Employee): string {
  const rawDate = employee.probationCompletionDate || employee.contractEndDate;
  if (!rawDate) return "-";
  if (
    employee.employmentType === "พนักงานสัญญาจ้าง" &&
    employee.daysUntilEnd === 0
  ) {
    return "หมดสัญญา";
  }
  const date = formatBuddhistDate(rawDate);
  if (employee.probationCompletionDate) {
    if (employee.daysUntilEnd === 0) return `${date} (จบการทดลองงาน)`;
    return `${date} (ทดลองงาน เหลือ ${employee.daysUntilEnd ?? 0} วัน)`;
  }
  return `${date} (เหลือ ${employee.daysUntilEnd ?? 0} วัน)`;
}
