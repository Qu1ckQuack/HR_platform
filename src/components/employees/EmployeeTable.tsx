import type { RefObject } from "react";
import type { Employee } from "@/types/employee";
import { EmployeeTableRow } from "./EmployeeTableRow";
import { EmployeeTableSkeleton } from "./EmployeeTableSkeleton";

export type EmployeeTableProps = {
  reportRef: RefObject<HTMLTableElement | null>;
  employees: Employee[];
  isLoading: boolean;
  loadError: string;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onHistory: (employeeId: string) => void;
  onDelete: (employee: Employee) => void;
};

export function EmployeeTable({
  reportRef,
  employees,
  isLoading,
  loadError,
  onView,
  onEdit,
  onHistory,
  onDelete,
}: EmployeeTableProps) {
  return (
    <div className="min-h-[40rem] overflow-x-auto">
      <table
        ref={reportRef}
        className="w-full min-w-[42rem] text-left text-sm sm:min-w-[62rem] border-b border-gray-300"
      >
        <thead className="border-b border-gray-300 bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="p-3 sm:p-4">รหัส</th>
            <th className="p-3 sm:p-4">พนักงาน</th>
            <th className="hidden p-4 sm:table-cell">หน่วยงาน / ตำแหน่ง</th>
            <th className="p-3 sm:p-4">สถานะ</th>
            <th className="hidden p-4 md:table-cell">วันเริ่มงาน</th>
            <th className="hidden p-4 text-center md:table-cell">
              วันสิ้นสุดสัญญา / ครบทดลองงาน
            </th>
            <th className="p-3 sm:p-4" />
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 10 }, (_, index) => (
              <EmployeeTableSkeleton key={`employee-skeleton-${index}`} />
            ))}
          {!isLoading && loadError && (
            <tr>
              <td
                colSpan={7}
                className="p-8 text-center text-sm text-red-600"
              >
                {loadError}
              </td>
            </tr>
          )}
          {!isLoading && !loadError && employees.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="p-8 text-center text-sm text-slate-500"
              >
                ไม่พบข้อมูลพนักงาน
              </td>
            </tr>
          )}
          {!isLoading &&
            !loadError &&
            employees.map((employee) => (
              <EmployeeTableRow
                key={employee.id}
                employee={employee}
                onView={onView}
                onEdit={onEdit}
                onHistory={onHistory}
                onDelete={onDelete}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}
