export type EmployeeStatus = "Active" | "Probation" | "Inactive";

const statusText: Record<EmployeeStatus, string> = {
  Active: "ปฏิบัติงาน",
  Probation: "ทดลองงาน",
  Inactive: "พ้นสภาพ",
};

const statusColors: Record<EmployeeStatus, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  Probation: "bg-amber-50 text-amber-600",
  Inactive: "bg-slate-100",
};

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${statusColors[status]}`}
    >
      ● {statusText[status]}
    </span>
  );
}
