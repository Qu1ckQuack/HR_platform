"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft, faTrashCan, faXmark } from "@fortawesome/free-solid-svg-icons";

type DeletedEmployee = {
  id: string;
  name: string;
  deletedAt: string;
};

export function EmployeeTrashModal({
  onClose,
  onRestored,
}: {
  onClose: () => void;
  onRestored: () => void;
}) {
  const [employees, setEmployees] = useState<DeletedEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLElement>(null);

  async function loadTrash() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/employees/trash", { credentials: "include" });
      const body = (await response.json()) as { employees?: DeletedEmployee[]; error?: string };
      if (!response.ok || !body.employees) {
        throw new Error(body.error ?? "ไม่สามารถโหลดรายการที่ลบล่าสุดได้");
      }
      setEmployees(body.employees);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดรายการที่ลบล่าสุดได้");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);
    dialogRef.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus();

    async function loadInitialTrash() {
      try {
        const response = await fetch("/api/employees/trash", { credentials: "include" });
        const body = (await response.json()) as { employees?: DeletedEmployee[]; error?: string };
        if (!response.ok || !body.employees) {
          throw new Error(body.error ?? "ไม่สามารถโหลดรายการที่ลบล่าสุดได้");
        }
        if (isCurrent) setEmployees(body.employees);
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดรายการที่ลบล่าสุดได้");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadInitialTrash();
    return () => {
      isCurrent = false;
      document.removeEventListener("keydown", handleDialogKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  async function restoreEmployee(employee: DeletedEmployee) {
    setRestoringId(employee.id);
    setError("");
    try {
      const response = await fetch(`/api/employees/${encodeURIComponent(employee.id)}/restore`, {
        method: "POST",
        credentials: "include",
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถกู้คืนพนักงานได้");
      await loadTrash();
      onRestored();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "ไม่สามารถกู้คืนพนักงานได้");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby="employee-trash-title"
        className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4 text-slate-500" />
            <div>
              <h2 id="employee-trash-title" className="font-semibold text-slate-900">รายการพนักงานที่ลบล่าสุด</h2>
              <p className="text-xs text-slate-500">กู้คืนได้ภายใน 7 วันหลังลบ</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="grid h-10 w-10 place-items-center rounded hover:bg-slate-100">
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[65vh] overflow-y-auto p-4">
          {error && <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {isLoading ? (
            <p className="p-6 text-center text-sm text-slate-500">กำลังโหลดรายการ...</p>
          ) : employees.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">ไม่มีรายการที่ถูกลบในช่วง 7 วันที่ผ่านมา</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <li key={employee.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{employee.name}</p>
                    <p className="text-xs text-slate-500">
                      ลบเมื่อ {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(employee.deletedAt))}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={restoringId !== null}
                    onClick={() => void restoreEmployee(employee)}
                    className="min-h-10 shrink-0 rounded-md border border-slate-300 px-3 text-sm font-medium text-[#102d59] hover:bg-slate-50 disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className="mr-2 h-3.5 w-3.5" />
                    {restoringId === employee.id ? "กำลังกู้คืน..." : "กู้คืน"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
