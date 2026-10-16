import type { Employee } from "@hr-platform/shared/types/employee";
import type { TableColumnKey } from "./EmployeeSearchBar";

export type EmployeeXlsxColumn = { header: string; key: string; width: number };

const expandedColumns: Partial<Record<TableColumnKey, EmployeeXlsxColumn[]>> = {
  employee: [
    { header: "ชื่อ - สกุล (ไทย)", key: "thaiName", width: 30 },
    { header: "ชื่อ - สกุล (Eng)", key: "englishName", width: 30 },
  ],
  department: [
    { header: "หน่วยงาน", key: "department", width: 28 },
    { header: "ตำแหน่ง", key: "position", width: 28 },
  ],
  deadline: [
    { header: "วันสิ้นสุดสัญญา", key: "contractEndDate", width: 18 },
    { header: "ครบทดลองงาน", key: "probationCompletionDate", width: 18 },
  ],
};

export function getEmployeeXlsxColumns(columns: Array<{ key: TableColumnKey; header: string }>) {
  return columns.flatMap(({ key, header }) => expandedColumns[key] ?? [{
    header,
    key,
    width: key === "id" ? 18 : 22,
  }]);
}

export function getEmployeeXlsxRow(employee: Employee) {
  return {
    id: employee.id,
    thaiName: `${employee.firstNameThai} ${employee.lastNameThai}`.trim(),
    englishName: employee.englishName,
    department: employee.department,
    position: employee.position,
    status: employee.employmentStatus,
    startDate: employee.startDate,
    contractEndDate: employee.contractEndDate,
    probationCompletionDate: employee.probationCompletionDate,
  };
}
