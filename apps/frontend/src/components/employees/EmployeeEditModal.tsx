"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import type { Employee } from "@hr-platform/shared/types/employee";
import {
  getCurrentBangkokDate,
  getProbationCompletionDate,
} from "@hr-platform/shared/lib/employment-dates";
import { FormInput } from "./form/FormInput";
import { FormSelect } from "./form/FormSelect";
import { formatCitizenId, formatPhone } from "./utils/format-input";
import type { EmployeeEditForm, EmployeeFormOptions } from "./form/types";

export type EmployeeEditModalProps = {
  employee: Employee | null;
  close: () => void;
  onSaved: () => void;
};

export function EmployeeEditModal({
  employee,
  close,
  onSaved,
}: EmployeeEditModalProps) {
  const [form, setForm] = useState<EmployeeEditForm>(() => ({
    prefix: employee?.prefix ?? "",
    nickname: employee?.nickname ?? "",
    sex: employee?.sex ?? "อื่นๆ",
    firstNameThai: employee?.firstNameThai ?? "",
    lastNameThai: employee?.lastNameThai ?? "",
    englishName: employee?.englishName ?? "",
    citizenId: "",
    bankAccount: "",
    location: employee?.location ?? "",
    personalEmail: employee?.personalEmail ?? "",
    religion: employee?.religion ?? "ไม่มีศาสนา",
    disability: employee?.disability ?? "",
    criminalRecord: employee?.criminalRecord ?? "",
    salary: employee?.salary ?? "",
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
    employmentTypes: [],
    supervisors: [],
  });
  const [optionsError, setOptionsError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Custom department and position state
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptName, setCustomDeptName] = useState("");
  const [isCustomPos, setIsCustomPos] = useState(false);
  const [customPosName, setCustomPosName] = useState("");

  // Confirmation dialog state for adding custom items
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
  });

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
      supervisor.id !== employee?.id,
  );
  const setField = <K extends keyof EmployeeEditForm>(
    field: K,
    value: EmployeeEditForm[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const handleSaveCustomDepartment = () => {
    const trimmed = customDeptName.trim();
    if (!trimmed) {
      setFormError("กรุณากรอกชื่อหน่วยงานใหม่");
      return;
    }
    setFormError("");

    setConfirmDialog({
      isOpen: true,
      title: "ยืนยันการเพิ่มหน่วยงานใหม่",
      message: `คุณต้องการเพิ่มหน่วยงาน "${trimmed}" เข้าสู่ฐานข้อมูลใช่หรือไม่?`,
      action: async () => {
        try {
          const response = await fetch("/api/employees/options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "department", name: trimmed }),
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.error ?? "ไม่สามารถสร้างหน่วยงานใหม่ได้");
          }
          const newDept = payload.department;
          setOptions((prev) => ({
            ...prev,
            departments: [...prev.departments, newDept],
          }));
          setForm((current) => ({
            ...current,
            departmentId: newDept.id,
            positionId: "",
            supervisorEmployeeId: "",
          }));
          setIsCustomDept(false);
          setCustomDeptName("");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error(error);
          setFormError(
            error instanceof Error ? error.message : "ไม่สามารถสร้างหน่วยงานได้",
          );
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSaveCustomPosition = () => {
    const trimmed = customPosName.trim();
    if (!form.departmentId) {
      setFormError("กรุณาเลือกหรือระบุหน่วยงานก่อนเพิ่มตำแหน่ง");
      return;
    }
    if (!trimmed) {
      setFormError("กรุณากรอกชื่อตำแหน่งใหม่");
      return;
    }
    setFormError("");

    setConfirmDialog({
      isOpen: true,
      title: "ยืนยันการเพิ่มตำแหน่งใหม่",
      message: `คุณต้องการเพิ่มตำแหน่ง "${trimmed}" ในหน่วยงานที่เลือกเข้าสู่ฐานข้อมูลใช่หรือไม่?`,
      action: async () => {
        try {
          const response = await fetch("/api/employees/options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "position",
              name: trimmed,
              departmentId: form.departmentId,
            }),
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.error ?? "ไม่สามารถสร้างตำแหน่งใหม่ได้");
          }
          const newPos = payload.position;
          setOptions((prev) => ({
            ...prev,
            positions: [...prev.positions, newPos],
          }));
          setForm((current) => ({
            ...current,
            positionId: newPos.id,
          }));
          setIsCustomPos(false);
          setCustomPosName("");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error(error);
          setFormError(
            error instanceof Error ? error.message : "ไม่สามารถสร้างตำแหน่งได้",
          );
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);
    try {
      const response = await fetch(
        employee ? `/api/employees/${employee.id}` : "/api/employees",
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
        <header className="sticky top-0 flex justify-between border-b bg-white p-4 sm:p-5 z-10">
          <div>
            <h2 className="font-bold text-slate-900 sm:text-xl">
              {employee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงาน"}
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              ช่องที่มี * จำเป็นต้องกรอก - ตรวจสอบไฟล์ซ้ำที่ Server
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="hover:text-red-500 cursor-pointer hover:cursor-pointer p-1"
          >
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
                  required={!employee || !employee.citizenId}
                  value={form.citizenId}
                  inputMode="numeric"
                  placeholder={employee?.citizenId ? "เว้นว่างเพื่อคงข้อมูลเดิม" : "x-xxxx-xxxxx-xx-x"}
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
                  required={!employee || !employee.bankAccount}
                  value={form.bankAccount}
                  placeholder={employee?.bankAccount ? "เว้นว่างเพื่อคงข้อมูลเดิม" : "กรอกเลขบัญชี"}
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
                <FormInput
                  label="ศาสนา"
                  value={form.religion}
                  onChange={(value) => setField("religion", value)}
                />
                <FormInput
                  label="ความพิการ"
                  value={form.disability}
                  onChange={(value) => setField("disability", value)}
                />
                <FormInput
                  label="ประวัติอาชญากรรม"
                  value={form.criminalRecord}
                  onChange={(value) => setField("criminalRecord", value)}
                />
                <FormInput
                  label="ค่าตอบแทน/เงินเดือน"
                  required
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="100"
                  value={form.salary}
                  onChange={(value) => setField("salary", value)}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-base font-bold text-slate-900">
                ข้อมูลการจ้างงาน
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Department with dropdown OR custom add */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      หน่วยงาน <span className="text-red-500">*</span>
                    </span>
                    {!isCustomDept ? (
                      <button
                        type="button"
                        onClick={() => setIsCustomDept(true)}
                        className="text-xs text-[#102d59] font-medium hover:underline cursor-pointer hover:cursor-pointer"
                      >
                        + เพิ่มหน่วยงานใหม่
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomDept(false);
                          setCustomDeptName("");
                        }}
                        className="text-xs text-slate-500 hover:underline cursor-pointer hover:cursor-pointer"
                      >
                        เลือกจากรายการ
                      </button>
                    )}
                  </div>
                  {!isCustomDept ? (
                    <select
                      required
                      value={form.departmentId}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((current) => ({
                          ...current,
                          departmentId: value,
                          positionId: "",
                          supervisorEmployeeId: "",
                        }));
                      }}
                      className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:border-[#2867b4] cursor-pointer hover:cursor-pointer text-sm"
                    >
                      <option value="">เลือกหน่วยงาน</option>
                      {options.departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="พิมพ์ชื่อหน่วยงานใหม่..."
                        value={customDeptName}
                        onChange={(e) => setCustomDeptName(e.target.value)}
                        className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#2867b4]"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomDepartment}
                        className="min-h-11 rounded-md bg-[#102d59] px-3 text-xs font-semibold text-white cursor-pointer hover:cursor-pointer hover:bg-[#244675]"
                      >
                        บันทึก
                      </button>
                    </div>
                  )}
                </div>

                {/* Position with dropdown OR custom add */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      ตำแหน่ง <span className="text-red-500">*</span>
                    </span>
                    {!isCustomPos ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!form.departmentId) {
                            setFormError(
                              "กรุณาเลือกหรือระบุหน่วยงานก่อนเพิ่มตำแหน่ง",
                            );
                            return;
                          }
                          setFormError("");
                          setIsCustomPos(true);
                        }}
                        className="text-xs text-[#102d59] font-medium hover:underline cursor-pointer hover:cursor-pointer"
                      >
                        + เพิ่มตำแหน่งใหม่
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomPos(false);
                          setCustomPosName("");
                        }}
                        className="text-xs text-slate-500 hover:underline cursor-pointer hover:cursor-pointer"
                      >
                        เลือกจากรายการ
                      </button>
                    )}
                  </div>
                  {!isCustomPos ? (
                    <select
                      required
                      value={form.positionId}
                      onChange={(event) =>
                        setField("positionId", event.target.value)
                      }
                      className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:border-[#2867b4] cursor-pointer hover:cursor-pointer text-sm"
                    >
                      <option value="">เลือกตำแหน่ง</option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="พิมพ์ชื่อตำแหน่งใหม่..."
                        value={customPosName}
                        onChange={(e) => setCustomPosName(e.target.value)}
                        className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#2867b4]"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomPosition}
                        className="min-h-11 rounded-md bg-[#102d59] px-3 text-xs font-semibold text-white cursor-pointer hover:cursor-pointer hover:bg-[#244675]"
                      >
                        บันทึก
                      </button>
                    </div>
                  )}
                </div>

                <FormSelect
                  label="ประเภทการจ้างงาน"
                  required
                  value={form.employmentType}
                  onChange={(value) => setField("employmentType", value)}
                  options={
                    options.employmentTypes.length > 0
                      ? options.employmentTypes
                      : [
                          "พนักงานประจำ",
                          "พนักงานพาร์ทไทม์",
                          "พนักงานสัญญาจ้าง",
                          "ฟรีแลนซ์",
                        ]
                  }
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
          <footer className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-4 z-10">
            <button
              type="button"
              onClick={close}
              className="min-h-10 rounded-md border px-4 hover:bg-gray-200 cursor-pointer hover:cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-10 rounded-md bg-[#102d59] px-4 font-semibold text-white hover:bg-[#244675] disabled:cursor-wait disabled:opacity-60 cursor-pointer hover:cursor-pointer flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="pr-1" />
              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </footer>
        </form>
      </section>

      {/* Confirmation pop-up for custom department/position addition */}
      {confirmDialog.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={() =>
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
          }
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-slate-900">
              {confirmDialog.title}
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              {confirmDialog.message}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                }
                className="min-h-9 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer hover:cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDialog.action}
                className="min-h-9 rounded-md bg-[#102d59] px-3 text-xs font-semibold text-white hover:bg-[#244675] cursor-pointer hover:cursor-pointer"
              >
                ยืนยันการเพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

