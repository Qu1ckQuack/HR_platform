import type { Employee } from "@hr-platform/shared/types/employee";

export type StatusFilter = "all" | Employee["status"];

function Pill({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 shrink-0 rounded-full px-4 text-sm cursor-pointer hover:cursor-pointer transition-colors ${
        active
          ? "bg-[#102d59] font-semibold text-white"
          : "bg-white shadow-sm hover:bg-slate-50 text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

export type EmployeeStatusFilterProps = {
  statusFilter: StatusFilter;
  onFilterChange: (status: StatusFilter) => void;
  totalEmployees: number;
  activeEmployees: number;
  probationEmployees: number;
  inactiveEmployees: number;
};

export function EmployeeStatusFilter({
  statusFilter,
  onFilterChange,
  totalEmployees,
  activeEmployees,
  probationEmployees,
  inactiveEmployees,
}: EmployeeStatusFilterProps) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1 *:cursor-pointer">
      <Pill
        active={statusFilter === "all"}
        label={`ทั้งหมด ${totalEmployees}`}
        onClick={() => onFilterChange("all")}
      />
      <Pill
        active={statusFilter === "Active"}
        label={`ปฏิบัติงาน ${activeEmployees}`}
        onClick={() => onFilterChange("Active")}
      />
      <Pill
        active={statusFilter === "Probation"}
        label={`ทดลองงาน ${probationEmployees}`}
        onClick={() => onFilterChange("Probation")}
      />
      <Pill
        active={statusFilter === "Inactive"}
        label={`พ้นสภาพ ${inactiveEmployees}`}
        onClick={() => onFilterChange("Inactive")}
      />
    </div>
  );
}

