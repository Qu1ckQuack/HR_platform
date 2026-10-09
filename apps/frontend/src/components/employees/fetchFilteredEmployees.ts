import type { EmployeeListResponse } from "@hr-platform/shared/types/employee";
import type { StatusFilter } from "./EmployeeStatusFilter";

export type EmployeeFilters = {
  search: string;
  status: StatusFilter;
  department: string;
  employmentType: string;
};

export async function fetchFilteredEmployees(filters: EmployeeFilters) {
  const params = new URLSearchParams({
    all: "true",
    search: filters.search,
    status: filters.status,
    department: filters.department,
    employmentType: filters.employmentType,
  });
  const response = await fetch(`/api/employees?${params}`, {
    credentials: "include",
  });
  const body = (await response.json()) as EmployeeListResponse | { error?: string };
  if (!response.ok || !("employees" in body)) {
    throw new Error("error" in body ? body.error : "โหลดข้อมูลเพื่อส่งออกไม่สำเร็จ");
  }
  return body.employees;
}
