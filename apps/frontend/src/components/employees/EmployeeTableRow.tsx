import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPenToSquare,
  faClockRotateLeft,
  faTrashCan,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import type { Employee } from "@hr-platform/shared/types/employee";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatBuddhistDate } from "@hr-platform/shared/lib/employment-dates";
import { formatContractDeadline } from "./utils/format-contract";
import {
  type ColumnVisibility,
  DEFAULT_VISIBLE_COLUMNS,
} from "./EmployeeSearchBar";

export type EmployeeTableRowProps = {
  employee: Employee;
  visibleColumns?: ColumnVisibility;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onHistory: (employeeId: string) => void;
  onDelete: (employee: Employee) => void;
};

export function EmployeeTableRow({
  employee,
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
  onView,
  onEdit,
  onHistory,
  onDelete,
}: EmployeeTableRowProps) {
  return (
    <tr className="border-b border-gray-300 last:border-0 hover:bg-blue-50/40">
      {visibleColumns.id && (
        <td className="p-3 font-mono text-xs text-slate-500 sm:p-4">
          {employee.id}
        </td>
      )}
      {visibleColumns.employee && (
        <td className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-500">
              <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{employee.name}</p>
              <p className="text-xs text-slate-500">{employee.englishName}</p>
            </div>
          </div>
        </td>
      )}
      {visibleColumns.department && (
        <td className="hidden p-4 sm:table-cell">
          <p>{employee.department}</p>
          <p className="text-xs text-slate-500">{employee.position}</p>
        </td>
      )}
      {visibleColumns.status && (
        <td className="p-3 sm:p-4">
          <StatusBadge status={employee.status} />
        </td>
      )}
      {visibleColumns.startDate && (
        <td className="hidden p-4 md:table-cell">
          {formatBuddhistDate(employee.startDate)}
        </td>
      )}
      {visibleColumns.deadline && (
        <td className="hidden max-w-56 p-4 text-center md:table-cell">
          <p className="whitespace-nowrap text-xs">
            {formatContractDeadline(employee)}
          </p>
        </td>
      )}
      {visibleColumns.actions && (
        <td className="p-3 text-right sm:p-4">
          <div className="flex justify-end gap-2 whitespace-nowrap text-[#102d59]">
            <button
              title="ดูข้อมูล"
              onClick={() => onView(employee)}
              className="min-h-10 min-w-10 rounded hover:bg-slate-100 cursor-pointer hover:cursor-pointer"
              aria-label="Show employee"
            >
              <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
            </button>
            <button
              title="แก้ไขข้อมูลพนักงาน"
              onClick={() => onEdit(employee)}
              className="min-h-10 min-w-10 rounded hover:bg-slate-100 cursor-pointer hover:cursor-pointer"
              aria-label="Edit employee"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
            </button>
            <button
              title="ดูประวัติการดำรงตำแหน่ง"
              onClick={() => onHistory(employee.id)}
              className="min-h-10 min-w-10 rounded hover:bg-slate-100 cursor-pointer hover:cursor-pointer"
              aria-label="History"
            >
              <FontAwesomeIcon icon={faClockRotateLeft} className="h-4 w-4" />
            </button>
            <button
              title="ลบข้อมูลผู้ใช้ (soft delete 7 วัน)"
              onClick={() => onDelete(employee)}
              className="min-h-10 min-w-10 text-red-500 rounded hover:bg-slate-100 cursor-pointer hover:cursor-pointer"
              aria-label="Delete employee"
            >
              <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

