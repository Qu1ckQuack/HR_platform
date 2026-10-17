import assert from "node:assert/strict";
import test from "node:test";
import { resolveEmployeeImportReferences } from "./employee-import-references";
import { parseEmployeeImportRow } from "./employee-import-row";

test("maps Thai form headers and converts XLSX dates and numeric phone values", () => {
  const row = parseEmployeeImportRow(
    [
      "คำนำหน้า", "ชื่อเล่น", "เพศ", "ชื่อ (ไทย)", "นามสกุล (ไทย)", "Full Name (ENG)",
      "เลขบัตรประชาชน", "บัญชีธนาคาร", "ที่อยู่", "อีเมลส่วนตัว", "อีเมลบริษัท", "โทรศัพท์",
      "ชื่อผู้ติดต่อกรณีฉุกเฉิน", "ศาสนา", "ความพิการ", "ประวัติอาชญากรรม", "ค่าตอบแทน/เงินเดือน",
      "หน่วยงาน", "ตำแหน่ง", "ประเภทการจ้างงาน", "สถานะการจ้างงาน", "วันที่เริ่มงาน",
      "วันสิ้นสุดสัญญา", "ผู้บังคับบัญชา",
    ],
    [
      "นางสาว", "ดา", "หญิง", "กานดา", "ใจดี", "Kanda Jaidee", "1234567890123", 123456789,
      "กรุงเทพมหานคร", "kanda@example.com", "kanda@company.com", 812345678, "สมใจ ใจดี", "พุทธ",
      "", "", 35000, "People", "HR", "พนักงานประจำ", "ปฏิบัติงาน",
      new Date("2025-04-01T00:00:00.000Z"), "", "EMP00001",
    ],
  );
  assert.deepEqual(row, {
    prefix: "นางสาว", nickname: "ดา", sex: "หญิง", firstNameThai: "กานดา", lastNameThai: "ใจดี",
    englishName: "Kanda Jaidee", citizenId: "1234567890123", bankAccount: "0123456789",
    location: "กรุงเทพมหานคร", personalEmail: "kanda@example.com", businessEmail: "kanda@company.com",
    phone: "081-234-5678", emergencyContactName: "สมใจ ใจดี", religion: "พุทธ", disability: "",
    criminalRecord: "", salary: "35000", departmentId: "People", positionId: "HR",
    employmentType: "พนักงานประจำ", employmentStatus: "ปฏิบัติงาน", startDate: "2025-04-01",
    contractEndDate: "", supervisorEmployeeId: "EMP00001",
  });
});

test("splits the combined Thai name column used by XLSX exports", () => {
  const row = parseEmployeeImportRow(["ชื่อ - สกุล (ไทย)"], ["กานดา ใจดี"]);
  assert.deepEqual(row, { firstNameThai: "กานดา", lastNameThai: "ใจดี" });
});

test("converts Excel serial numbers in date columns to ISO dates", () => {
  const row = parseEmployeeImportRow(["startDate"], [45748]);
  assert.deepEqual(row, { startDate: "2025-04-01" });
});

test("maps app export status labels and values to employment statuses", () => {
  assert.deepEqual(parseEmployeeImportRow(["สถานะ"], ["Active"]), {
    employmentStatus: "ปฏิบัติงาน",
  });
  assert.deepEqual(parseEmployeeImportRow(["status"], ["Probation"]), {
    employmentStatus: "ทดลองงาน",
  });
});

test("resolves department, position, and supervisor labels to form values", () => {
  const row = resolveEmployeeImportReferences({
    departmentId: " People ", positionId: "HR", supervisorEmployeeId: "EMP00001",
  }, {
    departments: [{ id: "DEP_0001", name: "People" }],
    positions: [{ id: "POS_0001", name: "HR", departmentId: "DEP_0001" }],
    supervisors: [{ id: "EMP00001", employeeCode: "EMP00001", name: "นาย สมชาย ใจดี" }],
  });
  assert.deepEqual(row, {
    departmentId: "DEP_0001", positionId: "POS_0001", supervisorEmployeeId: "EMP00001",
  });
});

test("does not guess when a supervisor name is ambiguous", () => {
  const row = resolveEmployeeImportReferences({ supervisorEmployeeId: "นาย สมชาย ใจดี" }, {
    departments: [], positions: [],
    supervisors: [
      { id: "EMP00001", employeeCode: "EMP00001", name: "นาย สมชาย ใจดี" },
      { id: "EMP00002", employeeCode: "EMP00002", name: "นาย สมชาย ใจดี" },
    ],
  });
  assert.deepEqual(row, { supervisorEmployeeId: "นาย สมชาย ใจดี" });
});
