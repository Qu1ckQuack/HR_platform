import { Skeleton } from "@/components/ui/Skeleton";
import {
  type ColumnVisibility,
  DEFAULT_VISIBLE_COLUMNS,
} from "./EmployeeSearchBar";

export function EmployeeTableSkeleton({
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
}: {
  visibleColumns?: ColumnVisibility;
}) {
  return (
    <tr className="h-[4.75rem] border-b border-gray-300 last:border-0">
      {visibleColumns.id && (
        <td className="p-3 sm:p-4">
          <Skeleton className="h-3 w-24" />
        </td>
      )}
      {visibleColumns.employee && (
        <td className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          </div>
        </td>
      )}
      {visibleColumns.department && (
        <td className="hidden p-4 sm:table-cell">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </td>
      )}
      {visibleColumns.status && (
        <td className="p-3 sm:p-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </td>
      )}
      {visibleColumns.startDate && (
        <td className="hidden p-4 md:table-cell">
          <Skeleton className="h-3 w-20" />
        </td>
      )}
      {visibleColumns.deadline && (
        <td className="hidden p-4 md:table-cell">
          <Skeleton className="h-3 w-28" />
        </td>
      )}
      {visibleColumns.actions && (
        <td className="p-3 sm:p-4">
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
          </div>
        </td>
      )}
    </tr>
  );
}

