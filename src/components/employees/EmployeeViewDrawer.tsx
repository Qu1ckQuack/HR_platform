import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faPen, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Employee } from "@/types/employee";
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
                onClick={edit}
                className="min-h-10 min-w-10 rounded bg-white shadow"
              >
                <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
              </button>
              <button
                onClick={close}
                className="min-h-10 min-w-10 rounded bg-white shadow"
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
