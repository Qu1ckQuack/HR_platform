"use client";

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport } from "@fortawesome/free-solid-svg-icons";

type ImportSummary = {
  imported: number;
  rejected: number;
  errors: ImportDraft[];
};
export type ImportDraft = { row: number; error: string; values: Record<string, string> };

const xlsxMimeType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const unsupportedFileMessage =
  "\u0e23\u0e2d\u0e07\u0e23\u0e31\u0e1a\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e44\u0e1f\u0e25\u0e4c CSV \u0e2b\u0e23\u0e37\u0e2d XLSX \u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c\u0e0a\u0e19\u0e34\u0e14\u0e17\u0e35\u0e48\u0e23\u0e2d\u0e07\u0e23\u0e31\u0e1a";
const maxFileBytes = 100 * 1024 * 1024;

export function ImportEmployeesButton({ onImported, onEditDraft }: { onImported: () => void; onEditDraft: (draft: ImportDraft, onSaved: () => void) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<ImportDraft[]>([]);

  async function importFile(file?: File) {
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension !== "csv" && extension !== "xlsx") {
      window.alert(unsupportedFileMessage);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > maxFileBytes) {
      window.alert("\u0e44\u0e1f\u0e25\u0e4c\u0e15\u0e49\u0e2d\u0e07\u0e21\u0e35\u0e02\u0e19\u0e32\u0e14\u0e44\u0e21\u0e48\u0e40\u0e01\u0e34\u0e19 100 MB");
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

      setDrafts(result.errors);
      if (!result.errors.length) window.alert(`\u0e19\u0e33\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 ${result.imported} \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23`);
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
      {drafts.length > 0 && <ImportDraftReview drafts={drafts} onDismiss={(row) => setDrafts((items) => items.filter((item) => item.row !== row))} onEdit={(draft, onSaved) => onEditDraft(draft, onSaved)} />}
    </>
  );
}

function ImportDraftReview({ drafts, onDismiss, onEdit }: { drafts: ImportDraft[]; onDismiss: (row: number) => void; onEdit: (draft: ImportDraft, onSaved: () => void) => void }) {
  return <div role="dialog" aria-modal="true" aria-label="ข้อมูลนำเข้าที่ต้องแก้ไข" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
    <section className="max-h-[80vh] w-full max-w-2xl space-y-3 overflow-auto rounded-xl bg-white p-5 shadow-xl">
      <h2 className="text-lg font-bold">ข้อมูลนำเข้าที่ไม่ครบ ({drafts.length})</h2>
      <p className="text-sm text-slate-600">แก้ไขข้อมูลที่ยังไม่ครบ หรือทิ้งรายการที่ไม่ต้องการนำเข้า</p>
      {drafts.map((draft) => <div key={draft.row} className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <p className="text-sm">แถว {draft.row}: {draft.error}</p>
        <div className="flex gap-2"><button type="button" onClick={() => onEdit(draft, () => onDismiss(draft.row))} className="rounded bg-blue-700 px-3 py-2 text-sm text-white">แก้ไข</button><button type="button" onClick={() => onDismiss(draft.row)} className="rounded border px-3 py-2 text-sm">ละทิ้ง</button></div>
      </div>)}
      <button type="button" onClick={() => drafts.forEach(({ row }) => onDismiss(row))} className="rounded border px-3 py-2 text-sm">ปิด</button>
    </section>
  </div>;
}
