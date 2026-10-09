"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import type { Employee } from "@hr-platform/shared/types/employee";
import { formatContractDeadline } from "./utils/format-contract";
import type { TableColumnKey } from "./EmployeeSearchBar";
import { fetchFilteredEmployees, type EmployeeFilters } from "./fetchFilteredEmployees";

type Props = {
  columns: Array<{ key: TableColumnKey; header: string }>;
  filters: EmployeeFilters;
};

export function ExportEmployeesXlsxButton({ columns, filters }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function exportEmployees() {
    setIsExporting(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const employees = await fetchFilteredEmployees(filters);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Employees");
      const exportColumns = columns.filter(({ key }) => key !== "actions");

      worksheet.columns = exportColumns.map(({ key, header }) => ({
        header,
        key,
        width: key === "employee" || key === "department" ? 32 : 22,
      }));
      worksheet.addRows(
        employees.map((employee) =>
          Object.fromEntries(
            exportColumns.map(({ key }) => [key, getExportValue(employee, key)]),
          ),
        ),
      );
      worksheet.getRow(1).font = { bold: true };
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "employees.xlsx";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("XLSX export error:", error);
      window.alert("\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2a\u0e48\u0e07\u0e2d\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c XLSX \u0e44\u0e14\u0e49");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void exportEmployees()}
      disabled={isExporting}
      className="min-h-11 rounded-md border border-gray-400 px-3 text-sm cursor-pointer hover:cursor-pointer disabled:opacity-60"
    >
      <FontAwesomeIcon icon={faDownload} className="mr-1 h-4 w-4" />
      ส่งออก
    </button>
  );
}

function getExportValue(employee: Employee, key: TableColumnKey) {
  switch (key) {
    case "id": return employee.id;
    case "employee": return [employee.name, employee.englishName].filter(Boolean).join(" / ");
    case "department": return [employee.department, employee.position].filter(Boolean).join(" / ");
    case "status": return employee.employmentStatus;
    case "startDate": return employee.startDate;
    case "deadline": return formatContractDeadline(employee);
    case "actions": return "";
  }
}
