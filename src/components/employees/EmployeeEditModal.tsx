"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import type { Employee } from "@/types/employee";
import {
  getCurrentBangkokDate,
  getProbationCompletionDate,
} from "@/lib/employment-dates";
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
    citizenId: employee?.citizenId ?? "",
    bankAccount: employee?.bankAccount ?? "",
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
