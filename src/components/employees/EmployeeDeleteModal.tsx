"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faXmark,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import type { Employee } from "@/types/employee";

export type EmployeeDeleteModalProps = {
  employee: Employee;
  isDeleting: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function EmployeeDeleteModal({
  employee,
  isDeleting,
  error = "",
  onConfirm,
  onCancel,
}: EmployeeDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded p-1 text-slate-400 hover:text-slate-600 cursor-pointer hover:cursor-pointer"
            aria-label="ปิด"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-slate-900">
            ยืนยันการลบข้อมูลพนักงาน
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            คุณแน่ใจหรือไม่ว่าต้องการลบพนักงาน{" "}
            <span className="font-semibold text-slate-800">
              {employee.name}
            </span>{" "}
            (<span className="font-mono">{employee.id}</span>)?
          </p>
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            ⚠️ ข้อมูลจะถูกลบชั่วคราวเป็นเวลา 7 วันเพื่อรอการลบถาวร
            สามารถกู้คืนได้ภายในระยะเวลาดังกล่าว
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="min-h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer hover:cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-h-10 rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer hover:cursor-pointer"
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
            {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
          </button>
        </div>
      </div>
    </div>
  );
}
