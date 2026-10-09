"use client";

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport } from "@fortawesome/free-solid-svg-icons";

type ImportSummary = {
  imported: number;
  rejected: number;
  errors: Array<{ row: number; error: string }>;
};

const xlsxMimeType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const unsupportedFileMessage =
  "\u0e23\u0e2d\u0e07\u0e23\u0e31\u0e1a\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e44\u0e1f\u0e25\u0e4c CSV \u0e2b\u0e23\u0e37\u0e2d XLSX \u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c\u0e0a\u0e19\u0e34\u0e14\u0e17\u0e35\u0e48\u0e23\u0e2d\u0e07\u0e23\u0e31\u0e1a";

export function ImportEmployeesButton({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function importFile(file?: File) {
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension !== "csv" && extension !== "xlsx") {
      window.alert(unsupportedFileMessage);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setBusy(true);
    try {
      const contentType = extension === "csv" ? "text/csv" : xlsxMimeType;
      const response = await fetch("/api/employees/import", {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: file,
        credentials: "include",
      });
      const result = (await response.json()) as
        | ImportSummary
        | { error: string };
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Import failed");
      }

      const rejectedRows = result.errors
        .slice(0, 5)
        .map(({ row, error }) => `\u0e41\u0e16\u0e27 ${row}: ${error}`)
        .join("\n");
      window.alert(
        `\u0e19\u0e33\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 ${result.imported}\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23, \u0e1b\u0e0f\u0e34\u0e40\u0e2a\u0e18 ${result.rejected}\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23${
          rejectedRows ? `\n\n${rejectedRows}` : ""
        }`,
      );
      onImported();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e19\u0e33\u0e40\u0e02\u0e49\u0e32\u0e44\u0e1f\u0e25\u0e4c\u0e44\u0e14\u0e49",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => void importFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="min-h-10 rounded-md border bg-white px-3 text-sm hover:cursor-pointer disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faFileImport} className="mr-1 h-4 w-4" />
        {busy ? "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e19\u0e33\u0e40\u0e02\u0e49\u0e32\u2026" : "\u0e19\u0e33\u0e40\u0e02\u0e49\u0e32"}
      </button>
    </>
  );
}
