"use client";

import { useEffect, useState } from "react";
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
  faUser
} from "@fortawesome/free-solid-svg-icons";
import type { Employee } from "@/features/employees/types";
import { InfoSection } from "@/shared/components/InfoSection";
import { Skeleton } from "@/shared/components/Skeleton";
import { StatusBadge } from "@/shared/components/StatusBadge";

export default function EmployeePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [page, setPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [probationEmployees, setProbationEmployees] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Employee["status"]>("all");
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadEmployees() {
      setIsLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          search,
          status: statusFilter,
        });
        const response = await fetch(`/api/employees?${params.toString()}`);
        const body = (await response.json()) as
          | {
              employees: Employee[];
              pagination: {
                page: number;
                total: number;
                totalPages: number;
                active: number;
                probation: number;
              };
            }
          | { error: string };

        if (!response.ok || !("employees" in body)) {
          throw new Error("error" in body ? body.error : "Unable to load employees");
        }

        if (isCurrent) {
          setEmployees(body.employees);
          setSelected(body.employees[0] ?? null);
          setTotalEmployees(body.pagination.total);
          setTotalPages(body.pagination.totalPages);
          setActiveEmployees(body.pagination.active);
          setProbationEmployees(body.pagination.probation);
        }
      } catch (error) {
        console.error("Unable to load employees:", error);
        if (isCurrent) {
          setLoadError("ไม่สามารถโหลดข้อมูลพนักงานได้ กรุณาลองใหม่อีกครั้ง");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadEmployees();
    return () => {
      isCurrent = false;
    };
  }, [page, search, statusFilter]);

  const open = (employee: Employee, mode: "edit" | "view") => {
    setSelected(employee);
    if (mode === "edit") setModal(true);
    else setDrawer(true);
  };
  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-700">
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-400 bg-white px-3 py-2 shadow-sm sm:px-5">
        <div className="flex items-center gap-3">
          <button className="min-h-10 min-w-10 text-xl" title="Not implemented yet"><FontAwesomeIcon icon={faBars} className="h-5 w-5" /></button>
          <p className="hidden text-sm sm:block">
            <FontAwesomeIcon icon={faHome} className="mr-1 h-4 w-4" />
            <b>ทะเบียนพนักงาน</b>
          </p>
        </div>
        <div className="flex items-center gap-2 *:cursor-pointer">
          <button className="hidden rounded-md bg-[#102d59] px-4 py-2 text-sm font-semibold text-white sm:block">
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
            <button className="min-h-10 rounded-md bg-[#102d59] px-3 text-sm font-semibold text-white">
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
              placeholder={ isFocused ? "" : "     ค้นหา ชื่อ, รหัส, อีเมล..." }
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
                  <th className="hidden p-4 md:table-cell">วันเริ่มงาน</th>
                  <th className="p-3 sm:p-4">สถานะ</th>
                  <th className="p-3 sm:p-4" />
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  Array.from({ length: 10 }, (_, index) => (
                    <EmployeeSkeletonRow key={`employee-skeleton-${index}`} />
                  ))
                )}
                {!isLoading && loadError && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-red-600">
                      {loadError}
                    </td>
                  </tr>
                )}
                {!isLoading && !loadError && employees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                      ไม่พบข้อมูลพนักงาน
                    </td>
                  </tr>
                )}
                {!isLoading && !loadError && employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-gray-300 last:border-0 hover:bg-blue-50/40"
                  >
                    <td className="p-3 font-mono text-xs text-slate-500 sm:p-4">
                      {employee.id}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-500"
                        >
                          <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
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
                    <td className="hidden p-4 md:table-cell">
                      {employee.startDate}
                    </td>
                    <td className="p-3 sm:p-4">
                      <StatusBadge status={employee.status} />
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
                          <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
                        </button>
                        <button
                          title="Not implemented yet"
                          className="min-h-10 min-w-10 rounded"
                          aria-label="History"
                        >
                          <FontAwesomeIcon icon={faClockRotateLeft} className="h-4 w-4" />
                        </button>
                        <button
                          className="min-h-10 min-w-10 text-red-500 rounded hover:bg-slate-100"
                          aria-label="Delete employee"
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
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
              <b className="rounded bg-[#102d59] px-3 py-2 text-white">{page}</b>
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
      {modal && selected && (
        <EditModal employee={selected} close={() => setModal(false)} />
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

function EditModal({
  employee,
  close,
}: {
  employee: Employee;
  close: () => void;
}) {
  const fields = [
    ["รหัสพนักงาน", employee.id], // UNIQUE auto generate id
    ["คำนำหน้า", employee.prefix], // NOT NULL
    ["ชื่อเล่น", employee.nickname], // NULLABLE
    ["ชื่อ (ไทย)", employee.firstNameThai], // NOT NULL
    ["นามสกุล (ไทย)", employee.lastNameThai], // NOT NULL
    ["Full Name (EN)", employee.englishName], // NULLABLE
    ["อีเมลบริษัท", employee.businessEmail], // NOT NULL
    ["โทรศัพท์", employee.phone], // NULLABLE
    ["หน่วยงาน", employee.department], // DROPDOWN NOT NULL
    ["ตำแหน่ง", employee.position], // DROPDOWN NOT NULL
    ["ประเภทการจ้าง", employee.employmentType],
    ["วันที่เริ่มงาน", employee.startDate]
  ];
  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-slate-950/45 p-3 sm:p-6"
      onMouseDown={close}
    >
      <section
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 flex justify-between border-b bg-white p-4 sm:p-5">
          <div>
            <h2 className="font-bold text-slate-900 sm:text-xl">
              แก้ไขข้อมูลพนักงาน
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              ช่องที่มี * จำเป็นต้องกรอก - ตรวจสอบไฟล์ซ้ำที่ Server
            </p>
          </div>
          <button
            onClick={close}
            className="hover:text-red-500"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </header>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          {fields.map(([label, value]) => (
            <label key={label} className="text-sm font-medium">
              {label}
              <input
                defaultValue={value}
                className="mt-1 min-h-11 w-full rounded-md border px-3 font-normal outline-none focus:border-[#2867b4]"
              />
            </label>
          ))}
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-4">
          <button onClick={close} className="min-h-10 rounded-md border px-4 hover:bg-gray-200">
            ยกเลิก
          </button>
          <button
            onClick={close}
            className="min-h-10 rounded-md bg-[#102d59] px-4 font-semibold text-white hover:bg-[#244675]"
          >
            บันทึก
          </button>
        </footer>
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
              <div
                className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-500"
              >
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
          <button className="shrink-0 py-4 hover:cursor-pointer">Employment</button>
          <button className="shrink-0 py-4 hover:cursor-pointer">Attendance</button>
          <button className="shrink-0 py-4 hover:cursor-pointer">Payroll</button>
        </nav>
        <div className="space-y-4 p-4 sm:p-5">
          <InfoSection
            title="ข้อมูลส่วนบุคคล"
            items={[
              ["รหัสพนักงาน", employee.id],
              ["คำนำหน้า", employee.prefix],
              ["ชื่อเล่น", employee.nickname],
              ["ชื่อ (ไทย)", employee.firstNameThai],
              ["นามสกุล (ไทย)", employee.lastNameThai],
              ["Full Name (English)", employee.englishName],
              ["เลขบัตรประชาชน", maskCitizenId(employee.citizenId)],
              ["อีเมล์บริษัท", employee.businessEmail],
              ["โทรศัพท์", employee.phone],
            ]}
          />
          <InfoSection
            title="ข้อมูลการจ้างงาน"
            items={[
              ["หน่วยงาน", employee.department],
              ["ตำแหน่ง", employee.position],
              ["ประเภทการจ้าง", employee.employmentType],
              ["วันที่เริ่มงาน", employee.startDate],
            ]}
          />
        </div>
      </aside>
    </div>
  );
}
function maskCitizenId(citizenId: string) {
  if (!citizenId) return "ยังไม่ระบุ";
  return `${citizenId.slice(0, 1)}-${citizenId.slice(1, 5)}-*****-${citizenId.slice(-2)}`;
}
