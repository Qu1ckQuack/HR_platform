"use client";

import { useState, type RefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faTableColumns,
} from "@fortawesome/free-solid-svg-icons";
import { ExportPdfButton } from "@/hooks/useExportTable";

export type EmployeeSearchBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  tableMode: "column" | "row";
  onToggleTableMode: () => void;
  reportRef: RefObject<HTMLTableElement | null>;
};

export function EmployeeSearchBar({
  search,
  onSearchChange,
  tableMode,
  onToggleTableMode,
  reportRef,
}: EmployeeSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative grid gap-2 border-b border-gray-400 p-3 sm:flex">
      {!isFocused && (
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pl-1 pr-1"
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
      <select className="min-h-11 rounded-md border border-gray-400 px-3 text-sm cursor-pointer">
        <option>ทุกหน่วยงาน</option>
      </select>
      <select className="min-h-11 rounded-md border-gray-400 border px-3 text-sm cursor-pointer">
        <option>ทุกประเภทการจ้าง</option>
      </select>
      <button
        type="button"
        onClick={onToggleTableMode}
        className="min-h-11 rounded-md border border-gray-400 px-3 text-sm *:cursor-pointer"
      >
        <FontAwesomeIcon icon={faTableColumns} className="mr-1 h-4 w-4" />
        {tableMode === "column" ? "คอลัมน์" : "แถว"}
      </button>
      <ExportPdfButton targetRef={reportRef} filename="employees.pdf" />
    </div>
  );
}
