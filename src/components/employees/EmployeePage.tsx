"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Employee } from "@/types/employee";
import { useEmployees } from "@/hooks/loadEmployee";
import { EmployeeHeader } from "@/components/employees/EmployeeHeader";
import { EmployeeToolbar } from "@/components/employees/EmployeeToolbar";
import {
  EmployeeStatusFilter,
  type StatusFilter,
} from "@/components/employees/EmployeeStatusFilter";
import { EmployeeSearchBar } from "@/components/employees/EmployeeSearchBar";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeePagination } from "@/components/employees/EmployeePagination";
import { EmployeeEditModal } from "@/components/employees/EmployeeEditModal";
import { EmployeeViewDrawer } from "@/components/employees/EmployeeViewDrawer";
import { EmployeeHistoryModal } from "@/components/employees/EmployeeHistoryModal";

export default function EmployeePage() {
  const router = useRouter();
  const reportRef = useRef<HTMLTableElement>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tableMode, setTableMode] = useState<"column" | "row">("column");

  const {
    employees,
    selected,
    setSelected,
    totalEmployees,
    totalPages,
    activeEmployees,
    probationEmployees,
    isLoading,
    loadError,
    refreshEmployees,
  } = useEmployees({ page, search, statusFilter });

  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [historyEmployeeId, setHistoryEmployeeId] = useState<string | null>(null);

  const open = (employee: Employee, mode: "edit" | "view") => {
    setSelected(employee);
    if (mode === "edit") setModal(true);
    else setDrawer(true);
  };

  const startCreate = () => {
    setSelected(null);
    setModal(true);
  };

  const softDeleteEmployee = async (employee: Employee) => {
    const confirmed = window.confirm(
      `ลบพนักงาน ${employee.name} ชั่วคราว 7 วันเพื่อรอการลบถาวร ?`,
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "ไม่สามารถลบพนักงานชั่วคราวได้");
      }
      refreshEmployees();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบพนักงานชั่วคราวได้",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-700">
      <EmployeeHeader
        onRefreshEmployees={refreshEmployees}
        onNavigateToLogin={() => router.push("/login")}
      />
      <section className="p-3 sm:p-6">
        <EmployeeToolbar onCreateEmployee={startCreate} />
        <EmployeeStatusFilter
          statusFilter={statusFilter}
          onFilterChange={(status) => {
            setStatusFilter(status);
            setPage(1);
          }}
          totalEmployees={totalEmployees}
          activeEmployees={activeEmployees}
          probationEmployees={probationEmployees}
        />
        <section className="overflow-hidden rounded-xl border border-gray-400 bg-white shadow-sm">
          <EmployeeSearchBar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            tableMode={tableMode}
            onToggleTableMode={() =>
              setTableMode((current) =>
                current === "column" ? "row" : "column",
              )
            }
            reportRef={reportRef}
          />
          <EmployeeTable
            reportRef={reportRef}
            employees={employees}
            isLoading={isLoading}
            loadError={loadError}
            onView={(employee) => open(employee, "view")}
            onEdit={(employee) => open(employee, "edit")}
            onHistory={(employeeId) => setHistoryEmployeeId(employeeId)}
            onDelete={softDeleteEmployee}
          />
          <EmployeePagination
            page={page}
            totalPages={totalPages}
            totalEmployees={totalEmployees}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </section>
      </section>

      {modal && (
        <EmployeeEditModal
          employee={selected}
          close={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            refreshEmployees();
          }}
        />
      )}

      {drawer && selected && (
        <EmployeeViewDrawer
          employee={selected}
          close={() => setDrawer(false)}
          edit={() => {
            setDrawer(false);
            setModal(true);
          }}
        />
      )}

      {historyEmployeeId && (
        <EmployeeHistoryModal
          employeeId={historyEmployeeId}
          onClose={() => setHistoryEmployeeId(null)}
        />
      )}
    </main>
  );
}
