import {
  approveProbationRecord,
  cancelTerminatedContractRecord,
  createEmployeeRecord,
  EmployeeRepositoryError,
  expireContractsForActor,
  findEmployeeNotifications,
  findEmployeeFormOptions,
  findEmployeesWithCurrentDetails,
  renewContractRecord,
  rejectProbationRecord,
  updateEmployeeRecord,
} from "@/repositories/employee.repository";
import {
  getCurrentBangkokDate,
  getProbationCompletionDate,
} from "@/lib/employment-dates";
import type { ContractType, EmployeeUpdate } from "@/types/employee";
import type { NotificationData } from "@/types/notification-type";

const PAGE_SIZE = 10;
const prefixes = new Set(["นาย", "นางสาว", "นาง"]);
const contractStatuses = new Set(["ทดลองงาน", "ปฏิบัติงาน", "พ้นสภาพ"]);
const employmentTypes = new Set<ContractType>([
  "พนักงานประจำ",
  "พนักงานพาร์ทไทม์",
  "พนักงานสัญญาจ้าง",
  "ฟรีแลนซ์",
]);
const phonePattern = /^\d{3}-\d{3}-\d{4}$/;
const employeeCodePattern = /^EMP\d{5,}$/;
const departmentCodePattern = /^DEP_\d{4,}$/;
const positionCodePattern = /^POS_\d{4,}$/;
const contractCodePattern = /^CNT_\d{4,}$/;

export async function listEmployees({
  requestedPage,
  search,
  statusFilter,
}: {
  requestedPage: number;
  search: string;
  statusFilter: string;
}) {
  const page = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const rows = await findEmployeesWithCurrentDetails();
  const employeeMap = new Map<string, ReturnType<typeof serializeEmployee>>();

  for (const row of rows) {
    if (!employeeMap.has(row.employee.id)) {
      employeeMap.set(row.employee.id, serializeEmployee(row));
    }
  }

  const searchResults = Array.from(employeeMap.values()).filter((employee) => {
    const matchesSearch =
      !search ||
      [
        employee.id,
        employee.name,
        employee.firstNameThai,
        employee.lastNameThai,
        employee.businessEmail,
        employee.department,
        employee.position,
        employee.employmentType,
      ].some((value) => value.toLocaleLowerCase().includes(search));
    return matchesSearch;
  });
  const filteredEmployees = searchResults.filter(
    (employee) => statusFilter === "all" || employee.status === statusFilter,
  );
  const totalRecords = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages); // confuse flag
  const start = (currentPage - 1) * PAGE_SIZE; // confuse flag

  return {
    employees: filteredEmployees.slice(start, start + PAGE_SIZE),
    pagination: {
      page: currentPage,
      pageSize: PAGE_SIZE,
      totalRecords,
      totalPages,
      active: searchResults.filter((employee) => employee.status === "Active").length,
      probation: searchResults.filter((employee) => employee.status === "Probation").length,
    },
  };
}

export async function getEmployeeFormOptions() {
  const { departmentRows, positionRows, supervisorRows } =
    await findEmployeeFormOptions();
  const supervisorMap = new Map<string, (typeof supervisorRows)[number]>();

  for (const row of supervisorRows) {
    if (!supervisorMap.has(row.id)) supervisorMap.set(row.id, row);
  }

  return {
    departments: departmentRows,
    positions: positionRows,
    supervisors: Array.from(supervisorMap.values()).map((row) => ({
      id: row.id,
      employeeCode: row.employeeCode,
      name: `${row.prefix ? `${row.prefix} ` : ""}${row.firstName} ${row.lastName}`,
      departmentId: row.departmentId ?? "",
    })),
  };
}

export async function updateEmployee(actorId: string, id: string, input: unknown) {
  if (!employeeCodePattern.test(id)) {
    throw new EmployeeServiceError("รหัสพนักงานไม่ถูกต้อง", 400);
  }

  const values = prepareEmployeeInput(input);
  if (values.supervisorEmployeeId === id) {
    throw new EmployeeServiceError("ไม่สามารถตั้งพนักงานเป็นผู้บังคับบัญชาของตนเองได้", 400);
  }

  try {
    await updateEmployeeRecord(actorId, id, values);
  } catch (error) {
    if (error instanceof EmployeeRepositoryError) {
      throw new EmployeeServiceError(error.message, error.status);
    }
    throw error;
  }
}

export async function createEmployee(actorId: string, input: unknown) {
  const values = prepareEmployeeInput(input);

  try {
    const id = await createEmployeeRecord(actorId, values);
    return { id };
  } catch (error) {
    if (error instanceof EmployeeRepositoryError) {
      throw new EmployeeServiceError(error.message, error.status);
    }
    throw error;
  }
}

export async function getEmployeeNotifications(actorId: string) {
  await expireDueContracts(actorId);
  const rows = await findEmployeeNotifications();
  return rows.map((row): NotificationData => ({
    ...row,
    id: `${row.kind}:${row.contractId}`,
  }));
}

export async function expireDueContracts(actorId: string) {
  try {
    await expireContractsForActor(actorId);
  } catch (error) {
    if (error instanceof EmployeeRepositoryError) {
      throw new EmployeeServiceError(error.message, error.status);
    }
    throw error;
  }
}

export async function approveProbation(actorId: string, contractId: string) {
  if (!contractCodePattern.test(contractId)) {
    throw new EmployeeServiceError("รหัสสัญญาไม่ถูกต้อง", 400);
  }
  await runContractAction(() => approveProbationRecord(actorId, contractId));
}

export async function rejectProbation(actorId: string, contractId: string) {
  if (!contractCodePattern.test(contractId)) {
    throw new EmployeeServiceError("รหัสสัญญาไม่ถูกต้อง", 400);
  }
  await runContractAction(() => rejectProbationRecord(actorId, contractId));
}

export async function cancelTerminatedContract(actorId: string, contractId: string) {
  if (!contractCodePattern.test(contractId)) {
    throw new EmployeeServiceError("รหัสสัญญาไม่ถูกต้อง", 400);
  }
  await runContractAction(() => cancelTerminatedContractRecord(actorId, contractId));
}

export async function renewContract(
  actorId: string,
  contractId: string,
  input: unknown,
) {
  if (!contractCodePattern.test(contractId)) {
    throw new EmployeeServiceError("รหัสสัญญาไม่ถูกต้อง", 400);
  }
  const endDate = getRenewalEndDate(input);
  if (!isValidDate(endDate)) {
    throw new EmployeeServiceError("กรุณาระบุวันสิ้นสุดสัญญาใหม่", 400);
  }
  if (endDate <= getCurrentBangkokDate()) {
    throw new EmployeeServiceError("วันสิ้นสุดสัญญาใหม่ต้องเป็นวันในอนาคต", 400);
  }
  await runContractAction(() => renewContractRecord(actorId, contractId, endDate));
}

function getRenewalEndDate(input: unknown) {
  if (typeof input !== "object" || input === null || !("endDate" in input)) return "";
  return typeof input.endDate === "string" ? input.endDate.trim() : "";
}

async function runContractAction(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    if (error instanceof EmployeeRepositoryError) {
      throw new EmployeeServiceError(error.message, error.status);
    }
    throw error;
  }
}

function prepareEmployeeInput(input: unknown): EmployeeUpdate {
  const values = normalizeEmployeeInput(input);
  const validationError = validateEmployeeInput(values);
  if (validationError) throw new EmployeeServiceError(validationError, 400);

  return {
    ...values,
    probationCompletionDate:
      values.employmentStatus === "ทดลองงาน"
        ? getProbationCompletionDate(values.startDate)
        : "",
  };
}

function normalizeEmployeeInput(input: unknown): EmployeeUpdate {
  const body = input && typeof input === "object"
    ? input as Partial<EmployeeUpdate>
    : {};
  return {
    prefix: String(body.prefix ?? "").trim(),
    nickname: String(body.nickname ?? "").trim(),
    sex: parseSex(body.sex),
    firstNameThai: String(body.firstNameThai ?? "").trim(),
    lastNameThai: String(body.lastNameThai ?? "").trim(),
    englishName: String(body.englishName ?? "").trim(),
    citizenId: String(body.citizenId ?? "").replace(/\D/g, ""),
    bankAccount: String(body.bankAccount ?? "").trim(),
    location: String(body.location ?? "").trim(),
    personalEmail: String(body.personalEmail ?? "").trim().toLowerCase(),
    businessEmail: String(body.businessEmail ?? "").trim().toLowerCase(),
    phone: String(body.phone ?? "").trim(),
    departmentId: String(body.departmentId ?? "").trim(),
    positionId: String(body.positionId ?? "").trim(),
    employmentType: parseContractType(body.employmentType),
    employmentStatus: parseContractStatus(body.employmentStatus),
    startDate: String(body.startDate ?? "").trim() || getCurrentBangkokDate(),
    contractEndDate: String(body.contractEndDate ?? "").trim(),
    probationCompletionDate: "",
    supervisorEmployeeId: String(body.supervisorEmployeeId ?? "").trim(),
  };
}

function validateEmployeeInput(values: EmployeeUpdate) {
  if (!prefixes.has(values.prefix)) return "กรุณาเลือกคำนำหน้า";
  if (!values.firstNameThai) return "กรุณากรอกชื่อ (ไทย)";
  if (!values.lastNameThai) return "กรุณากรอกนามสกุล (ไทย)";
  if (!/^\d{13}$/.test(values.citizenId)) {
    return "เลขบัตรประชาชนต้องมี 13 หลักในรูปแบบ x-xxxx-xxxxx-xx-x";
  }
  if (!isEmail(values.businessEmail)) {
    return "กรุณากรอกอีเมลบริษัทให้ถูกต้องตามรูปแบบสากล";
  }
  if (values.phone && !phonePattern.test(values.phone)) {
    return "โทรศัพท์ต้องอยู่ในรูปแบบ xxx-xxx-xxxx";
  }
  if (!departmentCodePattern.test(values.departmentId)) return "กรุณาเลือกหน่วยงาน";
  if (!positionCodePattern.test(values.positionId)) return "กรุณาเลือกตำแหน่ง";
  if (!employmentTypes.has(values.employmentType)) return "กรุณาเลือกประเภทการจ้างงาน";
  if (!contractStatuses.has(values.employmentStatus)) return "กรุณาเลือกสถานะการจ้างงาน";
  if (!isValidDate(values.startDate)) return "กรุณาเลือกวันที่เริ่มงาน";
  if (values.employmentType === "พนักงานสัญญาจ้าง" && !isValidDate(values.contractEndDate)) {
    return "กรุณาระบุวันสิ้นสุดสัญญาจ้าง";
  }
  if (values.contractEndDate && !isValidDate(values.contractEndDate)) {
    return "วันสิ้นสุดสัญญาไม่ถูกต้อง";
  }
  if (values.contractEndDate && values.contractEndDate < values.startDate) {
    return "ต้องตั้งวันสิ้นสุดสัญญาหลังวันเริ่มงาน";
  }
  if (values.supervisorEmployeeId && !employeeCodePattern.test(values.supervisorEmployeeId)) {
    return "ผู้บังคับบัญชาไม่ถูกต้อง";
  }
  if (!values.bankAccount) return "กรุณากรอกบัญชีธนาคาร";
  if (!values.location) return "กรุณากรอกที่อยู่";
  if (!isEmail(values.personalEmail)) return "กรุณากรอกอีเมลส่วนตัวให้ถูกต้อง";
  return null;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseSex(value: unknown): EmployeeUpdate["sex"] {
  if (value === "ชาย" || value === "หญิง" || value === "อื่นๆ") return value;
  throw new EmployeeServiceError("กรุณาเลือกเพศ", 400);
}

function parseContractStatus(value: unknown): EmployeeUpdate["employmentStatus"] {
  if (value === "ทดลองงาน" || value === "ปฏิบัติงาน" || value === "พ้นสภาพ") return value;
  throw new EmployeeServiceError("กรุณาเลือกสถานะการจ้างงาน", 400);
}

function parseContractType(value: unknown): ContractType {
  if (
    value === "พนักงานประจำ" ||
    value === "พนักงานสัญญาจ้าง" ||
    value === "ฟรีแลนซ์" ||
    value === "พนักงานพาร์ทไทม์"
  ) return value;
  throw new EmployeeServiceError("กรุณาเลือกประเภทการจ้างงาน", 400);
}

export class EmployeeServiceError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function serializeEmployee(row: Awaited<ReturnType<typeof findEmployeesWithCurrentDetails>>[number]) {
  const { employee, personalInfo: personal, contract, positionHistory, position, department } = row;
  const employmentStatus = contract
    ? toContractStatus(contract.employmentStatus)
    : "พ้นสภาพ";
  const contractEndDate = contract?.endDate ?? "";
  const probationCompletionDate = contract?.probationEndDate ?? "";
  const deadline = probationCompletionDate || contractEndDate;

  return {
    id: employee.id,
    databaseId: employee.id,
    displayId: employee.id,
    color: "bg-sky-500",
    initials: `${employee.firstName.slice(0, 1)}${employee.lastName.slice(0, 1)}`,
    name: `${employee.prefix ? `${employee.prefix} ` : ""}${employee.firstName} ${employee.lastName}`,
    prefix: employee.prefix ?? "",
    nickname: employee.nickname ?? "",
    sex: employee.sex === "ชาย" || employee.sex === "หญิง" ? employee.sex : "อื่นๆ",
    firstNameThai: employee.firstName,
    lastNameThai: employee.lastName,
    englishName: employee.englishName ?? "",
    citizenId: personal?.nationalId ?? "",
    bankAccount: personal?.bankAccount ?? "",
    location: personal?.location ?? "",
    personalEmail: personal?.email ?? "",
    taxAllowance: personal?.taxAllowance ?? "",
    businessEmail: employee.companyEmail,
    phone: personal?.phone ?? "",
    department: department?.departmentName ?? "ยังไม่ระบุ",
    departmentId: positionHistory?.departmentId ?? "",
    position: position?.positionName ?? "ยังไม่ระบุ",
    positionId: position?.id ?? "",
    supervisorEmployeeId: employee.supervisorEmployeeId ?? "",
    employmentType: contract?.employmentType ?? "ยังไม่ระบุ",
    employmentStatus,
    startDate: contract?.startDate ?? "",
    contractEndDate,
    probationCompletionDate,
    daysUntilEnd: deadline ? daysUntil(deadline) : null,
    status: toUiStatus(employmentStatus),
  };
}

function daysUntil(dateValue: string) {
  const today = getCurrentBangkokDate();
  const todayUtc = Date.parse(`${today}T00:00:00Z`);
  const deadlineUtc = Date.parse(`${dateValue}T00:00:00Z`);
  return Math.max(0, Math.ceil((deadlineUtc - todayUtc) / 86_400_000));
}

function toContractStatus(status: string | null | undefined): EmployeeUpdate["employmentStatus"] {
  if (status === "ทดลองงาน" || status === "พ้นสภาพ") return status;
  return "ปฏิบัติงาน";
}

function toUiStatus(status: EmployeeUpdate["employmentStatus"]): "Active" | "Probation" | "Inactive" {
  if (status === "ทดลองงาน") return "Probation";
  if (status === "พ้นสภาพ") return "Inactive";
  return "Active";
}
