import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faPen, faXmark, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import type { Employee } from "@hr-platform/shared/types/employee";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InfoSection } from "@/components/ui/InfoSection";

export type EmployeeViewDrawerProps = {
  employee: Employee;
  close: () => void;
  edit: () => void;
};

export function EmployeeViewDrawer({
  employee,
  close,
  edit,
}: EmployeeViewDrawerProps) {
  const [sensitive, setSensitive] = useState<{ nationalId: string; bankAccount: string } | null>(null);
  const [loadingSensitive, setLoadingSensitive] = useState(false);

  async function toggleSensitive() {
    if (sensitive) {
      setSensitive(null);
      return;
    }
    setLoadingSensitive(true);
    try {
      const response = await fetch(`/api/employees/${encodeURIComponent(employee.id)}/sensitive`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to reveal sensitive employee data");
      setSensitive(await response.json());
    } catch {
      window.alert("ไม่สามารถเปิดดูข้อมูลส่วนบุคคลได้");
    } finally {
      setLoadingSensitive(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/45" onMouseDown={close}>
      <aside
        className="animate-drawer-in ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#f6f8fa] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="bg-[linear-gradient(135deg,#fff,#e5efff)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-500">
                <FontAwesomeIcon icon={faUser} className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{employee.id} · G6</p>
                <h2 className="font-bold text-slate-900 sm:text-xl">
                  {employee.name}
                </h2>
                <p className="text-sm text-slate-500">{employee.englishName}</p>
                <div className="mt-2">
                  <StatusBadge status={employee.status} />
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={edit}
                className="min-h-10 min-w-10 rounded bg-white shadow hover:cursor-pointer"
              >
                <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={close}
                className="min-h-10 min-w-10 rounded bg-white shadow hover:cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <nav className="flex gap-5 overflow-x-auto border-b bg-white px-4 text-sm">
          <button className="shrink-0 hover:border-b-2 border-[#102d59] py-4 text-[#102d59] hover:cursor-pointer">
            Profile
          </button>
          <button className="shrink-0 py-4 hover:cursor-pointer">
            Employment
          </button>
          <button className="shrink-0 py-4 hover:cursor-pointer">
            Attendance
          </button>
          <button className="shrink-0 py-4 hover:cursor-pointer">
            Payroll
          </button>
        </nav>
        <div className="space-y-4 p-4 sm:p-5">
          <InfoSection
            title="ข้อมูลส่วนบุคคล"
            columns={3}
            items={[
              ["ชื่อ-สกุล (ไทย)", employee.name],
              ["Full Name (ENG)", employee.englishName],
              ["ชื่อเล่น", employee.nickname],
              ["วันเกิด", ""],
              ["สัญชาติ", ""],
              ["เลขบัตรประชาชน", employee.citizenId],
              ["อีเมล", employee.businessEmail],
              ["โทรศัพท์", employee.phone],
              ["ผู้ติดต่อฉุกเฉิน", ""],
            ]}
          />
          <button
            type="button"
            onClick={toggleSensitive}
            disabled={loadingSensitive}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={sensitive ? faEyeSlash : faEye} className="mr-2 h-4 w-4" />
            {loadingSensitive ? "กำลังโหลด�" : sensitive ? "ซ่อนข้อมูลสำคัญ" : "เปิดดูเลขบัตรประชาชนและบัญชีธนาคาร"}
          </button>
          {sensitive && (
            <div className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm sm:grid-cols-2">
              <p><span className="font-medium">เลขบัตรประชาชน:</span> {sensitive.nationalId}</p>
              <p><span className="font-medium">บัญชีธนาคาร:</span> {sensitive.bankAccount}</p>
            </div>
          )}
          <InfoSection
            title="การเงิน & สิทธิประโยชน์"
            columns={3}
            items={[
              ["บัญชีธนาคาร", ""],
              ["ประกันสังคม", ""],
              ["กองทุนสำรองเลี้ยงชีพ", ""],
              ["ลดหย่อนภาษีเพิ่มเติม", employee.taxAllowance],
              ["สิทธิประโยชน์อื่น", ""],
              ["หมายเหตุ", ""],
            ]}
          />
        </div>
      </aside>
    </div>
  );
}

