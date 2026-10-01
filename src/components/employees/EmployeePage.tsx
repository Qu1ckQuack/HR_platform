"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPenToSquare,
  faClockRotateLeft,
  faTrashCan,
  faTableColumns,
  faDownload,
  faFileImport,
  faUserPlus,
  faMagnifyingGlass,
  faGear,
  faBell,
  faExpand,
  faPen,
  faXmark,
  faHome,
  faBars,
  faUser,
  faFloppyDisk
} from "@fortawesome/free-solid-svg-icons";
import type { Employee } from "@/types/employee";
import { useEmployees } from "@/hooks/useEmployees";
import { InfoSection } from "@/components/ui/InfoSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getCurrentBangkokDate,
  getProbationCompletionDate,
} from "@/lib/employment-dates";

export default function EmployeePage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Employee["status"]>(
    "all",
  );
  const {
    employees,
    selected,
    setSelected,
    totalEmployees,
    totalPages,
    activeEmployees,
    probationEmployees,
    isLoading,
    loadError,
    refreshEmployees,
  } = useEmployees({ page, search, statusFilter });
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const open = (employee: Employee, mode: "edit" | "view") => {
    setSelected(employee);
    if (mode === "edit") setModal(true);
    else setDrawer(true);
  };
  const startCreate = () => {
    setSelected(null);
    setModal(true);
  };
  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-700">
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
            onClick={startCreate}
            className="hidden rounded-md bg-[#102d59] px-4 py-2 text-sm font-semibold text-white sm:block"
          >
            ＋ สร้างรายการ
          </button>
          <button
            title="Not implemented yet"
            className="min-h-10 min-w-10 rounded hover:bg-slate-100"
            aria-label="Show employee"
          >
            <FontAwesomeIcon icon={faGear} className="h-4 w-4" />
          </button>
          <button
            title="Not implemented yet"
            className="min-h-10 min-w-10 rounded hover:bg-slate-100"
            aria-label="Show employee"
          >
            <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />
          </button>
          <button
            title="Not implemented yet"
            className="min-h-10 min-w-10 rounded hover:bg-slate-100"
            aria-label="Show employee"
          >
            <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push("/login")}
            className="min-h-10 min-w-10 rounded-full bg-slate-200 text-xs font-bold"
          >
            AW
          </button>
        </div>
      </header>
      <section className="p-3 sm:p-6">
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
          <div className="flex gap-2 *:cursor-pointer">
            <button className="min-h-10 rounded-md border bg-white px-3 text-sm">
              <FontAwesomeIcon icon={faFileImport} className="mr-1 h-4 w-4" />
              นำเข้า
            </button>
            <button
              onClick={startCreate}
              className="min-h-10 rounded-md bg-[#102d59] px-3 text-sm font-semibold text-white"
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-1 h-4 w-4" />
              เพิ่มพนักงาน
            </button>
          </div>
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 *:cursor-pointer">
          <Pill
            active={statusFilter === "all"}
            label={`ทั้งหมด ${totalEmployees}`}
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
          />
          <Pill
            active={statusFilter === "Active"}
            label={`ปฏิบัติงาน ${activeEmployees}`}
            onClick={() => {
              setStatusFilter("Active");
              setPage(1);
            }}
          />
          <Pill
            active={statusFilter === "Probation"}
            label={`ทดลองงาน ${probationEmployees}`}
            onClick={() => {
              setStatusFilter("Probation");
              setPage(1);
            }}
          />
        </div>
        <section className="overflow-hidden rounded-xl border border-gray-400 bg-white shadow-sm">
          <div className="relative grid gap-2 border-b border-gray-400 p-3 sm:flex">
            {!isFocused && (
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
            )}

            <input
              type="text"
              className="min-h-11 w-full rounded-md border border-gray-400 px-3 text-sm sm:flex-1"
              placeholder={isFocused ? "" : "     ค้นหา ชื่อ, รหัส, อีเมล..."}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <select className="min-h-11 rounded-md border border-gray-400 px-3 text-sm cursor-pointer">
              <option>ทุกหน่วยงาน</option>
            </select>
            <select className="min-h-11 rounded-md border-gray-400 border px-3 text-sm cursor-pointer">
              <option>ทุกประเภทการจ้าง</option>
            </select>
            <button className="min-h-11 rounded-md border border-gray-400 px-3 text-sm *:cursor-pointer">
              <FontAwesomeIcon icon={faTableColumns} className="mr-1 h-4 w-4" />
              คอลัมน์
            </button>
            <button className="min-h-11 rounded-md border border-gray-400 px-3 text-sm">
              <FontAwesomeIcon icon={faDownload} className="mr-1 h-4 w-4" />
              ส่งออก
            </button>
          </div>
          <div className="min-h-[40rem] overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm sm:min-w-[62rem] border-b border-gray-300">
              <thead className="border-b border-gray-300 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="p-3 sm:p-4">รหัส</th>
                  <th className="p-3 sm:p-4">พนักงาน</th>
                  <th className="hidden p-4 sm:table-cell">
                    หน่วยงาน / ตำแหน่ง
                  </th>
                  <th className="p-3 sm:p-4">สถานะ</th>
                  <th className="hidden p-4 md:table-cell">วันเริ่มงาน</th>
                  <th className="hidden p-4 text-center md:table-cell">
                    วันสิ้นสุดสัญญา / ครบทดลองงาน
                  </th>
                  <th className="p-3 sm:p-4" />
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 10 }, (_, index) => (
                    <EmployeeSkeletonRow key={`employee-skeleton-${index}`} />
                  ))}
                {!isLoading && loadError && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-sm text-red-600"
                    >
                      {loadError}
                    </td>
                  </tr>
                )}
                {!isLoading && !loadError && employees.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-sm text-slate-500"
                    >
                      ไม่พบข้อมูลพนักงาน
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  !loadError &&
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-gray-300 last:border-0 hover:bg-blue-50/40"
                    >
                      <td className="p-3 font-mono text-xs text-slate-500 sm:p-4">
                        {employee.id}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-500">
                            <FontAwesomeIcon
                              icon={faUser}
                              className="h-5 w-5"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {employee.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {employee.englishName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-4 sm:table-cell">
                        <p>{employee.department}</p>
                        <p className="text-xs text-slate-500">
                          {employee.position}
                        </p>
                      </td>
                      <td className="p-3 sm:p-4">
                        <StatusBadge status={employee.status} />
                      </td>
                      <td className="hidden p-4 md:table-cell">
                        {employee.startDate}
                      </td>
                      <td className="hidden max-w-56 p-4 text-center md:table-cell">
                        <p className="whitespace-nowrap text-xs">
                          {formatContractDeadline(employee)}
                        </p>
                      </td>
                      <td className="p-3 text-right sm:p-4">
                        <div className="flex justify-end gap-2 whitespace-nowrap text-[#102d59]">
                          <button
                            onClick={() => open(employee, "view")}
                            className="min-h-10 min-w-10 rounded hover:bg-slate-100"
                            aria-label="Show employee"
                          >
                            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => open(employee, "edit")}
                            className="min-h-10 min-w-10 rounded hover:bg-slate-100"
                            aria-label="Edit employee"
                          >
                            <FontAwesomeIcon
                              icon={faPenToSquare}
                              className="h-4 w-4"
                            />
                          </button>
                          <button
                            title="Not implemented yet"
                            className="min-h-10 min-w-10 rounded"
                            aria-label="History"
                          >
                            <FontAwesomeIcon
                              icon={faClockRotateLeft}
                              className="h-4 w-4"
                            />
                          </button>
                          <button
                            className="min-h-10 min-w-10 text-red-500 rounded hover:bg-slate-100"
                            aria-label="Delete employee"
                          >
                            <FontAwesomeIcon
                              icon={faTrashCan}
                              className="h-4 w-4"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <footer className="flex justify-between p-3 text-xs text-slate-500">
            <span>
              แสดง {totalEmployees === 0 ? 0 : (page - 1) * 10 + 1}–
              {Math.min(page * 10, totalEmployees)} จาก {totalEmployees}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="หน้าก่อนหน้า"
                disabled={page === 1 || isLoading}
                onClick={() => setPage((current) => current - 1)}
                className="rounded px-2 py-1 text-base enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹
              </button>
              <b className="rounded bg-[#102d59] px-3 py-2 text-white">
                {page}
              </b>
              <button
                type="button"
                aria-label="หน้าถัดไป"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded px-2 py-1 text-base enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </footer>
        </section>
      </section>
      {modal && (
        <EditModal
          employee={selected}
          close={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            refreshEmployees();
          }}
        />
      )}
      {drawer && selected && (
        <Drawer
          employee={selected}
          close={() => setDrawer(false)}
          edit={() => {
            setDrawer(false);
            setModal(true);
          }}
        />
      )}
    </main>
  );
}

function Pill({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 shrink-0 rounded-full px-4 text-sm ${active ? "bg-[#102d59] font-semibold text-white" : "bg-white shadow-sm"}`}
    >
      {label}
    </button>
  );
}
function EmployeeSkeletonRow() {
  return (
    <tr className="h-[4.75rem] border-b border-gray-300 last:border-0">
      <td className="p-3 sm:p-4">
        <Skeleton className="h-3 w-24" />
      </td>
      <td className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        </div>
      </td>
      <td className="hidden p-4 sm:table-cell">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </td>
      <td className="hidden p-4 md:table-cell">
        <Skeleton className="h-3 w-20" />
      </td>
      <td className="hidden p-4 md:table-cell">
        <Skeleton className="h-3 w-28" />
      </td>
      <td className="p-3 sm:p-4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="p-3 sm:p-4">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-10 rounded" />
        </div>
      </td>
    </tr>
  );
}

function formatContractDeadline(employee: Employee) {
  const date = employee.probationCompletionDate || employee.contractEndDate;
  if (!date) return "-";
  if (employee.probationCompletionDate) {
    if (employee.daysUntilEnd === 0) return `${date} (จบการทดลองงาน)`;
    return `${date} (ทดลองงาน เหลือ ${employee.daysUntilEnd ?? 0} วัน)`;
  }
  return `${date} (เหลือ ${employee.daysUntilEnd ?? 0} วัน)`;
}

type EmployeeEditForm = {
  prefix: string;
  nickname: string;
  sex: Employee["sex"];
  firstNameThai: string;
  lastNameThai: string;
  englishName: string;
  citizenId: string;
  bankAccount: string;
  location: string;
  personalEmail: string;
  businessEmail: string;
  phone: string;
  departmentId: string;
  positionId: string;
  employmentType: string;
  employmentStatus: Employee["employmentStatus"];
  startDate: string;
  contractEndDate: string;
  probationCompletionDate: string;
  supervisorEmployeeId: string;
};

type EmployeeFormOptions = {
  departments: { id: string; name: string }[];
  positions: { id: string; name: string; departmentId: string }[];
  supervisors: {
    id: string;
    employeeCode: string;
    name: string;
    departmentId: string;
  }[];
};

type FormInputProps = {
  label: string;
  value: string;
  required?: boolean;
  readOnly?: boolean;
  readOnlyBackground?: boolean;
  type?: "text" | "email" | "date";
  placeholder?: string;
  inputMode?: "text" | "numeric" | "email" | "tel";
  onChange?: (value: string) => void;
};

function FormInput({
  label,
  value,
  required = false,
  readOnly = false,
  readOnlyBackground = true,
  type = "text",
  placeholder,
  inputMode,
  onChange,
}: FormInputProps) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      <input
        required={required}
        readOnly={readOnly}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange?.(event.target.value)}
        className={`mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-[#2867b4] ${readOnly && readOnlyBackground ? "read-only:bg-slate-100" : ""}`}
      />
    </label>
  );
}

type FormSelectProps = {
  label: string;
  value: string;
  options: (string | { value: string; label: string })[];
  required?: boolean;
  emptyLabel?: string;
  className?: string;
  onChange: (value: string) => void;
};

function FormSelect({
  label,
  value,
  options,
  required = false,
  emptyLabel = "เลือกข้อมูล",
  className = "",
  onChange,
}: FormSelectProps) {
  return (
    <label className={`text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:border-[#2867b4]"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => {
          const normalized =
            typeof option === "string"
              ? { value: option, label: option }
              : option;
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function formatWithGroups(value: string, groups: number[]) {
  const digits = value.replace(/\D/g, "").slice(
    0,
    groups.reduce((total, size) => total + size, 0),
  );
  let cursor = 0;
  return groups
    .map((size) => {
      const part = digits.slice(cursor, cursor + size);
      cursor += size;
      return part;
    })
    .filter(Boolean)
    .join("-");
}

function formatCitizenId(value: string) {
  return formatWithGroups(value, [1, 4, 5, 2, 1]);
}

function formatPhone(value: string) {
  return formatWithGroups(value, [3, 3, 4]);
}

function EditModal({
  employee,
  close,
  onSaved,
}: {
  employee: Employee | null;
  close: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EmployeeEditForm>(() => ({
    prefix: employee?.prefix ?? "",
    nickname: employee?.nickname ?? "",
    sex: employee?.sex ?? "อื่นๆ",
    firstNameThai: employee?.firstNameThai ?? "",
    lastNameThai: employee?.lastNameThai ?? "",
    englishName: employee?.englishName ?? "",
    citizenId: employee?.citizenId ?? "",
    bankAccount: employee?.bankAccount ?? "",
    location: employee?.location ?? "",
    personalEmail: employee?.personalEmail ?? "",
    businessEmail: employee?.businessEmail ?? "",
    phone: employee?.phone ?? "",
    departmentId: employee?.departmentId ?? "",
    positionId: employee?.positionId ?? "",
    employmentType:
      employee?.employmentType === "ยังไม่ระบุ"
        ? "พนักงานประจำ"
        : (employee?.employmentType ?? "พนักงานประจำ"),
    employmentStatus: employee?.employmentStatus || "ปฏิบัติงาน",
    startDate: employee?.startDate || getCurrentBangkokDate(),
    contractEndDate: employee?.contractEndDate ?? "",
    probationCompletionDate: employee?.probationCompletionDate ?? "",
    supervisorEmployeeId: employee?.supervisorEmployeeId ?? "",
  }));
  const [options, setOptions] = useState<EmployeeFormOptions>({
    departments: [],
    positions: [],
    supervisors: [],
  });
  const [optionsError, setOptionsError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadOptions() {
      try {
        const response = await fetch("/api/employees/options");
        const body = (await response.json()) as
          | EmployeeFormOptions
          | { error: string };
        if (!response.ok || !("departments" in body)) {
          throw new Error(
            "error" in body ? body.error : "Unable to load options",
          );
        }
        if (isCurrent) setOptions(body);
      } catch (error) {
        console.error("Unable to load employee form options:", error);
        if (isCurrent) setOptionsError("ไม่สามารถโหลดตัวเลือกข้อมูลได้");
      }
    }

    void loadOptions();
    return () => {
      isCurrent = false;
    };
  }, []);

  const positions = options.positions.filter(
    (position) => position.departmentId === form.departmentId,
  );
  const supervisors = options.supervisors.filter(
    (supervisor) =>
      supervisor.departmentId === form.departmentId &&
      supervisor.id !== employee?.databaseId,
  );
  const setField = <K extends keyof EmployeeEditForm>(
    field: K,
    value: EmployeeEditForm[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);
    try {
      const response = await fetch(
        employee ? `/api/employees/${employee.databaseId}` : "/api/employees",
        {
          method: employee ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(body.error ?? "Unable to save employee");
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลได้",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-slate-950/45 p-3 sm:p-6"
      onMouseDown={close}
    >
      <section
        className="hide-scrollbar max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 flex justify-between border-b bg-white p-4 sm:p-5">
          <div>
            <h2 className="font-bold text-slate-900 sm:text-xl">
              {employee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              ช่องที่มี * จำเป็นต้องกรอก - ตรวจสอบไฟล์ซ้ำที่ Server
            </p>
          </div>
          <button type="button" onClick={close} className="hover:text-red-500">
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="space-y-6 p-4 sm:p-5">
            <fieldset className="space-y-3">
              <legend className="text-base font-bold text-slate-900">
                ข้อมูลส่วนบุคคล
              </legend>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {employee ? (
                  <FormInput
                    label="รหัสพนักงาน"
                    required
                    value={employee.id}
                    readOnly
                  />
                ) : (
                  <p className="self-center text-sm text-slate-500">
                    ระบบจะสร้างรหัสพนักงานให้อัตโนมัติ
                  </p>
                )}
                <FormSelect
                  label="คำนำหน้า"
                  required
                  value={form.prefix}
                  onChange={(value) => setField("prefix", value)}
                  options={["นาย", "นางสาว", "นาง"]}
                />
                <FormInput
                  label="ชื่อเล่น"
                  value={form.nickname}
                  onChange={(value) => setField("nickname", value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="ชื่อ (ไทย)"
                  required
                  value={form.firstNameThai}
                  onChange={(value) => setField("firstNameThai", value)}
                />
                <FormInput
                  label="นามสกุล (ไทย)"
                  required
                  value={form.lastNameThai}
                  onChange={(value) => setField("lastNameThai", value)}
                />
                <FormInput
                  label="Full Name (ENG)"
                  value={form.englishName}
                  onChange={(value) => setField("englishName", value)}
                />
                <FormInput
                  label="เลขบัตรประชาชน"
                  required
                  value={form.citizenId}
                  inputMode="numeric"
                  placeholder="x-xxxx-xxxxx-xx-x"
                  onChange={(value) =>
                    setField("citizenId", formatCitizenId(value))
                  }
                />
                <FormInput
                  label="อีเมลบริษัท"
                  required
                  type="email"
                  value={form.businessEmail}
                  onChange={(value) => setField("businessEmail", value)}
                />
                <FormInput
                  label="อีเมลส่วนตัว"
                  required
                  type="email"
                  value={form.personalEmail}
                  onChange={(value) => setField("personalEmail", value)}
                />
                <FormInput
                  label="บัญชีธนาคาร"
                  required
                  value={form.bankAccount}
                  onChange={(value) => setField("bankAccount", value)}
                />
                <FormInput
                  label="ที่อยู่"
                  required
                  value={form.location}
                  onChange={(value) => setField("location", value)}
                />
                <FormInput
                  label="โทรศัพท์"
                  placeholder="xxx-xxx-xxxx"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(value) => setField("phone", formatPhone(value))}
                />
                <FormSelect
                  label="เพศ"
                  required
                  value={form.sex}
                  onChange={(value) =>
                    setField("sex", value as EmployeeEditForm["sex"])
                  }
                  options={["ชาย", "หญิง", "อื่นๆ"]}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-base font-bold text-slate-900">
                ข้อมูลการจ้างงาน
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label="หน่วยงาน"
                  required
                  value={form.departmentId}
                  onChange={(value) => {
                    setForm((current) => ({
                      ...current,
                      departmentId: value,
                      positionId: "",
                      supervisorEmployeeId: "",
                    }));
                  }}
                  options={options.departments.map((department) => ({
                    value: department.id,
                    label: department.name,
                  }))}
                />
                <FormSelect
                  label="ตำแหน่ง"
                  required
                  value={form.positionId}
                  onChange={(value) => setField("positionId", value)}
                  options={positions.map((position) => ({
                    value: position.id,
                    label: position.name,
                  }))}
                />
                <FormSelect
                  label="ประเภทการจ้างงาน"
                  required
                  value={form.employmentType}
                  onChange={(value) => setField("employmentType", value)}
                  options={[
                    "พนักงานประจำ",
                    "พนักงานพาร์ทไทม์",
                    "พนักงานสัญญาจ้าง",
                    "ฟรีแลนซ์",
                  ]}
                />
                <FormInput
                  label="วันที่เริ่มงาน"
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      startDate: value,
                      probationCompletionDate:
                        current.employmentStatus === "ทดลองงาน" && value
                          ? getProbationCompletionDate(value)
                          : current.probationCompletionDate,
                    }))
                  }
                />
                <FormSelect
                  label="สถานะการจ้างงาน"
                  required
                  value={form.employmentStatus}
                  onChange={(value) => {
                    const employmentStatus =
                      value as EmployeeEditForm["employmentStatus"];
                    setForm((current) => ({
                      ...current,
                      employmentStatus,
                      probationCompletionDate:
                        employmentStatus === "ทดลองงาน" && current.startDate
                          ? getProbationCompletionDate(current.startDate)
                          : "",
                    }));
                  }}
                  options={["ทดลองงาน", "ปฏิบัติงาน", "พ้นสภาพ"]}
                />
                <FormInput
                  label="วันสิ้นสุดสัญญา"
                  type="date"
                  required={form.employmentType === "พนักงานสัญญาจ้าง"}
                  value={form.contractEndDate}
                  onChange={(value) => setField("contractEndDate", value)}
                />
                {form.employmentStatus === "ทดลองงาน" && (
                  <FormInput
                    label="วันครบทดลองงาน"
                    type="date"
                    required
                    readOnly
                    readOnlyBackground={false}
                    value={form.probationCompletionDate}
                  />
                )}
                <FormSelect
                  label="ผู้บังคับบัญชา"
                  value={form.supervisorEmployeeId}
                  onChange={(value) => setField("supervisorEmployeeId", value)}
                  options={supervisors.map((supervisor) => ({
                    value: supervisor.id,
                    label: `${supervisor.employeeCode} · ${supervisor.name}`,
                  }))}
                  emptyLabel="ไม่ระบุ"
                  className="sm:col-span-2"
                />
              </div>
            </fieldset>

            {optionsError && (
              <p className="text-sm text-red-600">{optionsError}</p>
            )}
            {formError && (
              <p
                role="alert"
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {formError}
              </p>
            )}
          </div>
          <footer className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-4">
            <button
              type="button"
              onClick={close}
              className="min-h-10 rounded-md border px-4 hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-10 rounded-md bg-[#102d59] px-4 font-semibold text-white hover:bg-[#244675] disabled:cursor-wait disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="pr-1"/>
              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function Drawer({
  employee,
  close,
  edit,
}: {
  employee: Employee;
  close: () => void;
  edit: () => void;
}) {
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
