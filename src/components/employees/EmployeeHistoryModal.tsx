"use client";

import { useEffect, useState } from "react";
import { formatBuddhistDate } from "@/lib/employment-dates";

export type PositionHistoryEntry = {
  id: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  departmentName: string | null;
  positionName: string | null;
};

export type EmployeeHistoryModalProps = {
  employeeId: string;
  onClose: () => void;
};

export function EmployeeHistoryModal({
  employeeId,
  onClose,
}: EmployeeHistoryModalProps) {
  const [historyEntries, setHistoryEntries] = useState<PositionHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const response = await fetch(`/api/employees/${employeeId}/history`, {
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error ?? "ไม่สามารถโหลดประวัติการดำรงตำแหน่งได้");
        }
        if (isCurrent) {
          setHistoryEntries(payload.history ?? []);
        }
      } catch (error) {
        console.error(error);
        if (isCurrent) {
          setHistoryEntries([]);
          window.alert(
            error instanceof Error ? error.message : "ไม่สามารถโหลดประวัติการดำรงตำแหน่งได้"
          );
        }
      } finally {
        if (isCurrent) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();
    return () => {
      isCurrent = false;
    };
  }, [employeeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4">
      <div className="w-full max-w-xl rounded-md border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">ประวัติการดำรงตำแหน่ง</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:cursor-pointer"
          >
            ปิด
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          {historyLoading ? (
            <p className="text-sm text-slate-500">กำลังโหลดประวัติ...</p>
          ) : historyEntries.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มีประวัติการดำรงตำแหน่ง</p>
          ) : (
            <ul className="space-y-3">
              {historyEntries.map((entry) => (
                <li key={entry.id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800">{entry.positionName ?? "ยังไม่ระบุตำแหน่ง"}</p>
                  <p className="text-xs text-slate-500">{entry.departmentName ?? "ยังไม่ระบุหน่วยงาน"}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    {formatBuddhistDate(entry.effectiveFrom)}
                    {entry.effectiveTo ? ` - ${formatBuddhistDate(entry.effectiveTo)}` : " - ปัจจุบัน"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
