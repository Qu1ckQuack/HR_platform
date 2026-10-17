import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHome,
  faExpand,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { EmployeeNotifications } from "./EmployeeNotifications";

export type EmployeeHeaderProps = {
  onRefreshEmployees: () => void;
  onShowTrash: () => void;
  onNavigateToLogin: () => void;
};

export function EmployeeHeader({
  onRefreshEmployees,
  onShowTrash,
  onNavigateToLogin,
}: EmployeeHeaderProps) {
  return (
    <header className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-400 bg-white px-3 py-2 shadow-sm sm:px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="min-h-10 min-w-10 text-xl hover:cursor-pointer"
          title="Not implemented yet"
        >
          <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
        </button>
        <p className="hidden text-sm sm:block">
          <FontAwesomeIcon icon={faHome} className="mr-1 h-4 w-4" />
          <b>ทะเบียนพนักงาน</b>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hidden rounded-md bg-[#102d59] px-4 py-2 text-sm font-semibold text-white hover:cursor-pointer sm:block"
        >
          ＋ สร้างรายการ
        </button>
        <button
          type="button"
          title="(ยังไม่เสร็จ)"
          className="min-h-10 min-w-10 rounded hover:bg-slate-100 hover:cursor-pointer"
          aria-label="Show employee"
        >
          <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="รายการที่ลบล่าสุด (กู้คืนได้ภายใน 7 วัน)"
          onClick={onShowTrash}
          className="min-h-10 min-w-10 rounded text-slate-600 hover:bg-slate-100 hover:cursor-pointer"
          aria-label="รายการพนักงานที่ถูกลบล่าสุด"
        >
          <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
        </button>
        <EmployeeNotifications onEmployeesChanged={onRefreshEmployees} />
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="min-h-10 min-w-10 rounded-full bg-slate-200 text-xs font-bold hover:cursor-pointer"
        >
          HR
        </button>
      </div>
    </header>
  );
}

