"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Employee } from "@/types/employee";
import { useEmployees } from "@/hooks/loadEmployee";
import { EmployeeHeader } from "@/components/employees/EmployeeHeader";
import { EmployeeToolbar } from "@/components/employees/EmployeeToolbar";
import {
  EmployeeStatusFilter,
  type StatusFilter,
} from "@/components/employees/EmployeeStatusFilter";
import {
  DEFAULT_VISIBLE_COLUMNS,
  EmployeeSearchBar,
  type ColumnVisibility,
  type TableColumnKey,
} from "@/components/employees/EmployeeSearchBar";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeePagination } from "@/components/employees/EmployeePagination";
import { EmployeeEditModal } from "@/components/employees/EmployeeEditModal";
import { EmployeeViewDrawer } from "@/components/employees/EmployeeViewDrawer";
import { EmployeeHistoryModal } from "@/components/employees/EmployeeHistoryModal";
import { EmployeeDeleteModal } from "@/components/employees/EmployeeDeleteModal";
import type { EmployeeFormOptions } from "@/components/employees/form/types";

export default function EmployeePage() {
  const router = useRouter();
  const reportRef = useRef<HTMLTableElement>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(
    DEFAULT_VISIBLE_COLUMNS,
  );
  const [formOptions, setFormOptions] = useState<EmployeeFormOptions>({
    departments: [],
    positions: [],
    employmentTypes: [],
    supervisors: [],
  });

  const {
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
    refreshEmployees,
  } = useEmployees({
    page,
    search,
    statusFilter,
    departmentFilter,
    employmentTypeFilter,
  });

  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [historyEmployeeId, setHistoryEmployeeId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadOptions() {
      try {
        const response = await fetch("/api/employees/options");
        const body = (await response.json()) as
          | EmployeeFormOptions
          | { error: string };
        if (!response.ok || !("departments" in body)) return;
        if (isCurrent) setFormOptions(body);
      } catch (error) {
        console.error("Unable to load employee filter options:", error);
      }
    }

    void loadOptions();
    return () => {
      isCurrent = false;
    };
  }, [modal]);

  const open = (employee: Employee, mode: "edit" | "view") => {
    setSelected(employee);
    if (mode === "edit") setModal(true);
    else setDrawer(true);
  };

  const startCreate = () => {
    setSelected(null);
    setModal(true);
  };

  const confirmSoftDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/employees/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "ไม่สามารถลบพนักงานชั่วคราวได้");
      }
      setDeleteTarget(null);
      refreshEmployees();
    } catch (error) {
      console.error(error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "ไม่สามารถลบพนักงานชั่วคราวได้",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleColumn = (key: TableColumnKey) => {
    setVisibleColumns((current) => {
      const next = { ...current, [key]: !current[key] };
      if (!Object.values(next).some(Boolean)) return current;
      return next;
    });
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
          inactiveEmployees={inactiveEmployees}
        />
        <section className="overflow-hidden rounded-xl border border-gray-400 bg-white shadow-sm">
          <EmployeeSearchBar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            departments={formOptions.departments}
            departmentFilter={departmentFilter}
            onDepartmentFilterChange={(value) => {
              setDepartmentFilter(value);
              setPage(1);
            }}
            employmentTypes={formOptions.employmentTypes}
            employmentTypeFilter={employmentTypeFilter}
            onEmploymentTypeFilterChange={(value) => {
              setEmploymentTypeFilter(value);
              setPage(1);
            }}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onShowAllColumns={() =>
              setVisibleColumns({
                id: true,
                employee: true,
                department: true,
                status: true,
                startDate: true,
                deadline: true,
                actions: true,
              })
            }
            onResetColumns={() =>
              setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
            }
            reportRef={reportRef}
          />
          <EmployeeTable
            reportRef={reportRef}
            employees={employees}
            isLoading={isLoading}
            loadError={loadError}
            visibleColumns={visibleColumns}
            onView={(employee) => open(employee, "view")}
            onEdit={(employee) => open(employee, "edit")}
            onHistory={(employeeId) => setHistoryEmployeeId(employeeId)}
            onDelete={(employee) => {
              setDeleteError("");
              setDeleteTarget(employee);
            }}
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

      {deleteTarget && (
        <EmployeeDeleteModal
          employee={deleteTarget}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={() => void confirmSoftDelete()}
          onCancel={() => {
            if (isDeleting) return;
            setDeleteTarget(null);
            setDeleteError("");
          }}
        />
      )}
    </main>
  );
}
