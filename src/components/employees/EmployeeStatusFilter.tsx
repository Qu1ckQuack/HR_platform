import type { Employee } from "@/types/employee";

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
      className={`min-h-10 shrink-0 rounded-full px-4 text-sm ${active ? "bg-[#102d59] font-semibold text-white" : "bg-white shadow-sm"}`}
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
};

export function EmployeeStatusFilter({
  statusFilter,
  onFilterChange,
  totalEmployees,
  activeEmployees,
  probationEmployees,
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
    </div>
  );
}
