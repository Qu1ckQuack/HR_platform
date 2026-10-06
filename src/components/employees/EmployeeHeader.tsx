import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHome,
  faGear,
  faExpand,
} from "@fortawesome/free-solid-svg-icons";
import { EmployeeNotifications } from "./EmployeeNotifications";

export type EmployeeHeaderProps = {
  onRefreshEmployees: () => void;
  onNavigateToLogin: () => void;
};

export function EmployeeHeader({
  onRefreshEmployees,
  onNavigateToLogin,
}: EmployeeHeaderProps) {
  return (
    <header className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-400 bg-white px-3 py-2 shadow-sm sm:px-5">
      <div className="flex items-center gap-3">
        <button
          className="min-h-10 min-w-10 text-xl"
          title="Not implemented yet"
        >
          <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
        </button>
        <p className="hidden text-sm sm:block">
          <FontAwesomeIcon icon={faHome} className="mr-1 h-4 w-4" />
          <b>ทะเบียนพนักงาน</b>
        </p>
      </div>
      <div className="flex items-center gap-2 *:cursor-pointer">
        <button
          className="hidden rounded-md bg-[#102d59] px-4 py-2 text-sm font-semibold text-white sm:block"
        >
          ＋ สร้างรายการ
        </button>
        <button
          title="การตั้งค่า(ยังไม่เสร็จ)"
          className="min-h-10 min-w-10 rounded hover:bg-slate-100"
          aria-label="Show employee"
        >
          <FontAwesomeIcon icon={faGear} className="h-4 w-4" />
        </button>
        <button
          title="(ยังไม่เสร็จ)"
          className="min-h-10 min-w-10 rounded hover:bg-slate-100"
          aria-label="Show employee"
        >
          <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />
        </button>
        <EmployeeNotifications onEmployeesChanged={onRefreshEmployees} />
        <button
          onClick={onNavigateToLogin}
          className="min-h-10 min-w-10 rounded-full bg-slate-200 text-xs font-bold"
        >
          HR
        </button>
      </div>
    </header>
  );
}
