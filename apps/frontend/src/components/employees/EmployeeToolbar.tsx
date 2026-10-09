import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { ImportEmployeesButton } from "./ImportEmployeesButton";

export type EmployeeToolbarProps = {
  onCreateEmployee: () => void;
  onImported: () => void;
};

export function EmployeeToolbar({ onCreateEmployee, onImported }: EmployeeToolbarProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs uppercase text-slate-500">
          ● HRM · Employee Master
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
          ทะเบียนพนักงาน
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ข้อมูลพนักงานแบบ 360° เชื่อมกับเวลาทำงาน การลา เงินเดือน และผลงาน
        </p>
      </div>
      <div className="flex gap-2">
        <ImportEmployeesButton onImported={onImported} />
        <button
          type="button"
          onClick={onCreateEmployee}
          className="min-h-10 rounded-md bg-[#102d59] px-3 text-sm font-semibold text-white hover:cursor-pointer"
        >
          <FontAwesomeIcon icon={faUserPlus} className="mr-1 h-4 w-4" />
          เพิ่มพนักงาน
        </button>
      </div>
    </div>
  );
}

