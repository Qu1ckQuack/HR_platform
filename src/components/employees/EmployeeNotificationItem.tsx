"use client";

import { useState } from "react";

import { formatBuddhistDate, getCurrentBangkokDate } from "@/lib/employment-dates";
import type { NotificationData } from "@/types/notification-type";

type Props = {
  notification: NotificationData;
  onActionComplete: () => Promise<void>;
};

export function EmployeeNotificationItem({ notification, onActionComplete }: Props) {
  const [isRenewing, setIsRenewing] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isProbation = notification.kind === "probation-due";

  async function runAction(
    path: string,
    body?: object,
    method: "POST" | "DELETE" = "POST",
  ) {
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/employees/contracts/${notification.contractId}/${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "ดำเนินการไม่สำเร็จ");
      await onActionComplete();
      setIsRenewing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  function cancelTerminatedContract() {
    const confirmed = window.confirm(
      `ยืนยันยกเลิกสัญญาของ ${notification.employeeName}? ประวัติสัญญานี้จะถูกลบ`,
    );
    if (confirmed) void runAction("cancel", undefined, "DELETE");
  }

  return (
    <li className="border-b border-slate-200 px-4 py-3 last:border-0">
      <p className="font-semibold text-slate-800">{notification.employeeName}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {notification.employeeCode} · {isProbation ? "ครบกำหนดทดลองงาน" : "หมดสัญญา"} · {formatBuddhistDate(notification.eventDate)}
      </p>
      {isRenewing ? (
        <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); void runAction("renew", { endDate }); }}>
          <input aria-label="วันสิ้นสุดสัญญาใหม่" required type="date" min={getCurrentBangkokDate()} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="min-h-9 min-w-0 flex-1 rounded border border-slate-300 px-2 text-sm" />
          <button disabled={isSaving} className="rounded bg-[#102d59] px-3 text-sm font-semibold text-white hover:cursor-pointer disabled:opacity-50">บันทึก</button>
          <button type="button" onClick={() => setIsRenewing(false)} className="rounded border px-3 text-sm hover:cursor-pointer">ยกเลิก</button>
        </form>
      ) : (
        <div className="mt-2">
          {isProbation ? (
            <div className="flex flex-wrap gap-2">
              <button disabled={isSaving} onClick={() => void runAction("approve-probation")} className="min-h-9 rounded bg-[#102d59] px-3 text-sm font-semibold text-white hover:cursor-pointer disabled:opacity-50">อนุมัติผ่านทดลองงาน</button>
              <button disabled={isSaving} onClick={() => void runAction("reject-probation")} className="min-h-9 rounded border border-red-300 px-3 text-sm text-red-700 hover:cursor-pointer disabled:opacity-50">ไม่อนุมัติ</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setIsRenewing(true)} className="min-h-9 rounded border border-slate-300 px-3 text-sm hover:cursor-pointer">ต่อสัญญา</button>
              <button disabled={isSaving} onClick={cancelTerminatedContract} className="min-h-9 rounded border border-red-300 px-3 text-sm text-red-700 hover:cursor-pointer disabled:opacity-50">ยกเลิกสัญญา</button>
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  );
}
