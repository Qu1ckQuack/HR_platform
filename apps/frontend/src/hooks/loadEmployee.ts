"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Employee, EmployeeListResponse } from "@hr-platform/shared/types/employee";

type EmployeeStatusFilter = "all" | Employee["status"];

export function useEmployees({
  page,
  search,
  statusFilter,
  departmentFilter = "all",
  employmentTypeFilter = "all",
}: {
  page: number;
  search: string;
  statusFilter: EmployeeStatusFilter;
  departmentFilter?: string;
  employmentTypeFilter?: string;
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [probationEmployees, setProbationEmployees] = useState(0);
  const [inactiveEmployees, setInactiveEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadEmployees() {
      setIsLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          search,
          status: statusFilter,
          department: departmentFilter,
          employmentType: employmentTypeFilter,
        });
        const response = await fetch(`/api/employees?${params.toString()}`, {
          credentials: "include",
        });
        const body = (await response.json()) as EmployeeListResponse | { error: string };

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        if (!response.ok || !("employees" in body)) {
          throw new Error("error" in body ? body.error : "Unable to load employees");
        }

        if (isCurrent) {
          setEmployees(body.employees);
          setSelected(body.employees[0] ?? null);
          setTotalEmployees(body.pagination.totalRecords);
          setTotalPages(body.pagination.totalPages);
          setActiveEmployees(body.pagination.active);
          setProbationEmployees(body.pagination.probation);
          setInactiveEmployees(body.pagination.inactive ?? 0);
        }
      } catch (error) {
        console.error("Unable to load employees:", error);
        if (isCurrent) {
          setLoadError("ไม่สามารถโหลดข้อมูลพนักงานได้ กรุณาลองใหม่อีกครั้ง");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadEmployees();
    return () => {
      isCurrent = false;
    };
  }, [page, search, statusFilter, departmentFilter, employmentTypeFilter, refreshToken, router]);

  return {
    employees,
    selected,
    setSelected,
    totalEmployees,
    totalPages,
    activeEmployees,
    probationEmployees,
    inactiveEmployees,
    isLoading,
    loadError,
    refreshEmployees: () => setRefreshToken((current) => current + 1),
  };
}
