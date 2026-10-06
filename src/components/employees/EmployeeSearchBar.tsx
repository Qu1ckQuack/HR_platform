"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faTableColumns,
  faCheck,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { ExportPdfButton } from "@/hooks/useExportTable";

export type TableColumnKey =
  | "id"
  | "employee"
  | "department"
  | "status"
  | "startDate"
  | "deadline"
  | "actions";

export type ColumnVisibility = Record<TableColumnKey, boolean>;

export const DEFAULT_VISIBLE_COLUMNS: ColumnVisibility = {
  id: true,
  employee: true,
  department: true,
  status: true,
  startDate: true,
  deadline: true,
  actions: true,
};

export const COLUMN_LABELS: Record<TableColumnKey, string> = {
  id: "รหัสพนักงาน",
  employee: "พนักงาน",
  department: "หน่วยงาน / ตำแหน่ง",
  status: "สถานะ",
  startDate: "วันเริ่มงาน",
  deadline: "วันสิ้นสุดสัญญา / ครบทดลองงาน",
  actions: "ปุ่มการจัดการ",
};

export type EmployeeSearchBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  departments: { id: string; name: string }[];
  departmentFilter: string;
  onDepartmentFilterChange: (deptId: string) => void;
  employmentTypes: string[];
  employmentTypeFilter: string;
  onEmploymentTypeFilterChange: (type: string) => void;
  visibleColumns: ColumnVisibility;
  onToggleColumn: (key: TableColumnKey) => void;
  onShowAllColumns: () => void;
  onResetColumns: () => void;
  reportRef: RefObject<HTMLTableElement | null>;
};

export function EmployeeSearchBar({
  search,
  onSearchChange,
  departments,
  departmentFilter,
  onDepartmentFilterChange,
  employmentTypes,
  employmentTypeFilter,
  onEmploymentTypeFilterChange,
  visibleColumns,
  onToggleColumn,
  onShowAllColumns,
  onResetColumns,
  reportRef,
}: EmployeeSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target as Node)
      ) {
        setIsColumnDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative grid gap-2 border-b border-gray-400 p-3 sm:flex">
      {!isFocused && (
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pl-1 pr-1 pointer-events-none"
        />
      )}

      <input
        type="text"
        className="min-h-11 w-full rounded-md border border-gray-400 px-3 text-sm sm:flex-1"
        placeholder={isFocused ? "" : "     ค้นหา ชื่อ, รหัส, อีเมล..."}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <select
        value={departmentFilter}
        onChange={(event) => onDepartmentFilterChange(event.target.value)}
        className="min-h-11 rounded-md border border-gray-400 px-3 text-sm cursor-pointer hover:cursor-pointer bg-white"
      >
        <option value="all">ทุกหน่วยงาน</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>

      <select
        value={employmentTypeFilter}
        onChange={(event) => onEmploymentTypeFilterChange(event.target.value)}
        className="min-h-11 rounded-md border-gray-400 border px-3 text-sm cursor-pointer hover:cursor-pointer bg-white"
      >
        <option value="all">ทุกประเภทการจ้าง</option>
        {employmentTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Column Visibility Dropdown */}
      <div className="relative" ref={columnDropdownRef}>
        <button
          type="button"
          onClick={() => setIsColumnDropdownOpen((prev) => !prev)}
          className={`min-h-11 w-full sm:w-auto rounded-md border border-gray-400 px-3 text-sm cursor-pointer hover:cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
            isColumnDropdownOpen ? "bg-slate-100 font-semibold" : "bg-white hover:bg-slate-50"
          }`}
        >
          <FontAwesomeIcon icon={faTableColumns} className="h-4 w-4" />
          <span>คอลัมน์</span>
        </button>

        {isColumnDropdownOpen && (
          <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700">
                เลือกคอลัมน์ที่ต้องการแสดง
              </span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {(Object.keys(COLUMN_LABELS) as TableColumnKey[]).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-1 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded cursor-pointer hover:cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns[key]}
                    onChange={() => onToggleColumn(key)}
                    className="h-4 w-4 rounded border-gray-300 text-[#102d59] focus:ring-[#102d59] cursor-pointer hover:cursor-pointer"
                  />
                  <span>{COLUMN_LABELS[key]}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <button
                type="button"
                onClick={onShowAllColumns}
                className="text-[#102d59] font-semibold hover:underline flex items-center gap-1 cursor-pointer hover:cursor-pointer"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                แสดงทั้งหมด
              </button>
              <button
                type="button"
                onClick={onResetColumns}
                className="text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer hover:cursor-pointer"
              >
                <FontAwesomeIcon icon={faRotateRight} className="h-3 w-3" />
                รีเซ็ต
              </button>
            </div>
          </div>
        )}
      </div>

      <ExportPdfButton targetRef={reportRef} filename="employees.pdf" />
    </div>
  );
}
