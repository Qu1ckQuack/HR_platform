import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const departments = pgTable(
  "Department",
  {
    id: text("id").primaryKey().default(sql`make_code('DEP', nextval('department_code_seq'))`),
    departmentName: text("title").notNull(),
  },
  (table) => [
    check("Department_id_check", sql`${table.id} ~ '^DEP_[0-9]{4,}$'`),
    unique("Department_title_key").on(table.departmentName),
    index("ix_department_title_trgm").using("gin", table.departmentName.op("gin_trgm_ops")),
  ],
);
export const positions = pgTable(
  "Position",
  {
    id: text("id").primaryKey().default(sql`make_code('POS', nextval('position_code_seq'))`),
    positionName: text("title").notNull(),
    departmentId: text("departmentId").notNull().references(() => departments.id, { onDelete: "restrict" }),
  },
  (table) => [
    check("Position_id_check", sql`${table.id} ~ '^POS_[0-9]{4,}$'`),
    unique("Position_departmentId_title_key").on(table.departmentId, table.positionName),
    unique("Position_id_departmentId_key").on(table.id, table.departmentId),
    index("ix_position_title_trgm").using("gin", table.positionName.op("gin_trgm_ops")),
    index("ix_position_department").on(table.departmentId),
  ],
);

export const employees = pgTable(
  "Employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("publicId").notNull().unique().default(sql`'EMP' || lpad(nextval('employee_code_seq')::text, 5, '0')`),
    prefix: text("prefix").notNull(),
    nickname: text("nickName").notNull(),
    firstName: text("name").notNull(),
    lastName: text("lastName").notNull(),
    englishName: text("fullNameEn"),
    companyEmail: text("businessEmail").notNull(),
    sex: text("sex").notNull(),
    supervisorEmployeeId: uuid("supervisor_id").references((): AnyPgColumn => employees.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deletedAt", { withTimezone: true }),
    deletedBy: text("deletedBy").references((): AnyPgColumn => user.id, { onDelete: "set null" }),
    searchText: text("searchText").generatedAlwaysAs(sql`lower("publicId" || ' ' || "name" || ' ' || "lastName" || ' ' || "nickName" || ' ' || coalesce("fullNameEn",''))`),
  },
  (table) => [
    unique("Employees_businessEmail_key").on(table.companyEmail),
    check("Employees_sex_check", sql`${table.sex} IN ('ชาย','หญิง','อื่นๆ')`),
    check("Employees_supervisor_check", sql`${table.supervisorEmployeeId} IS DISTINCT FROM ${table.id}`),
    check("Employees_deleted_check", sql`(${table.deletedAt} IS NULL) = (${table.deletedBy} IS NULL)`),
    index("ix_employees_search_trgm").using("gin", table.searchText.op("gin_trgm_ops")).where(sql`${table.deletedAt} IS NULL`),
    index("ix_employees_public_id_prefix").on(table.publicId.op("text_pattern_ops")).where(sql`${table.deletedAt} IS NULL`),
    index("ix_employees_supervisor").on(table.supervisorEmployeeId),
    index("ix_employees_deleted_at").on(table.deletedAt).where(sql`${table.deletedAt} IS NOT NULL`),
  ],
);

export const employmentContracts = pgTable(
  "Contract",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("publicId").notNull().unique().default(sql`make_code('CNT', nextval('contract_code_seq'))`),
    employeeId: uuid("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
    employmentType: text("type").notNull(),
    employmentStatus: text("status").notNull(),
    startDate: date("start").notNull(),
    endDate: date("end"),
    probationEndDate: date("probationEnd"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("Contract_publicId_check", sql`${table.publicId} ~ '^CNT_[0-9]{4,}$'`),
    check("Contract_type_check", sql`${table.employmentType} IN ('พนักงานประจำ','พนักงานสัญญาจ้าง','ฟรีแลนซ์','พนักงานพาร์ทไทม์')`),
    check("Contract_status_check", sql`${table.employmentStatus} IN ('ทดลองงาน','ปฏิบัติงาน','พ้นสภาพ')`),
    check("Contract_end_check", sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`),
    check("Contract_probation_end_check", sql`${table.probationEndDate} IS NULL OR ${table.probationEndDate} >= ${table.startDate}`),
    check("Contract_type_end_check", sql`${table.employmentType} <> 'พนักงานสัญญาจ้าง' OR ${table.endDate} IS NOT NULL`),
    check("Contract_status_probation_check", sql`${table.employmentStatus} <> 'ทดลองงาน' OR ${table.probationEndDate} IS NOT NULL`),
    uniqueIndex("uq_contract_one_active").on(table.employeeId).where(sql`${table.employmentStatus} <> 'พ้นสภาพ'`),
    index("ix_contract_emp_start").on(table.employeeId, table.startDate.desc()),
    index("ix_contract_status").on(table.employmentStatus),
    index("ix_contract_end_alert").on(table.endDate).where(sql`${table.employmentStatus} <> 'พ้นสภาพ' AND ${table.endDate} IS NOT NULL`),
    index("ix_contract_probation").on(table.probationEndDate).where(sql`${table.employmentStatus} = 'ทดลองงาน'`),
  ],
);

export const positionHistories = pgTable(
  "PositioningHistory",
  {
    id: text("id").primaryKey().default(sql`make_code('PSH', nextval('poshist_code_seq'))`),
    contractId: uuid("contractId").notNull().references(() => employmentContracts.id, { onDelete: "cascade" }),
    positionId: text("positionId").notNull(),
    departmentId: text("departmentId").notNull(),
    effectiveFrom: date("start").notNull(),
    effectiveTo: date("end"),
  },
  (table) => [
    check("PositioningHistory_id_check", sql`${table.id} ~ '^PSH_[0-9]{4,}$'`),
    check("PositioningHistory_end_check", sql`${table.effectiveTo} IS NULL OR ${table.effectiveTo} >= ${table.effectiveFrom}`),
    foreignKey({ columns: [table.positionId, table.departmentId], foreignColumns: [positions.id, positions.departmentId] }),
    uniqueIndex("uq_poshist_one_current").on(table.contractId).where(sql`${table.effectiveTo} IS NULL`),
    index("ix_poshist_contract").on(table.contractId, table.effectiveFrom.desc()),
    index("ix_poshist_dept").on(table.departmentId),
    index("ix_poshist_position").on(table.positionId),
  ],
);
export const personalInfo = pgTable(
  "PersonalData",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("publicId").notNull().unique().default(sql`make_code('PDT', nextval('personal_code_seq'))`),
    employeeId: uuid("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
    nationalId: text("citizenId").notNull(),
    bankAccount: text("bankAccount").notNull(),
    socialSecurity: text("socialSecurity"),
    providentFund: text("providentFund"),
    taxAllowance: numeric("taxDeductions", { precision: 12, scale: 2 }),
    religion: text("religion").notNull().default("ไม่มีศาสนา"),
    disability: text("disability"),
    criminalRecord: text("criminalRecord"),
    salary: numeric("salary", { precision: 12, scale: 2 }),
    location: text("location").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("PersonalData_publicId_check", sql`${table.publicId} ~ '^PDT_[0-9]{4,}$'`),
    unique("PersonalData_employeeId_key").on(table.employeeId),
    unique("PersonalData_citizenId_key").on(table.nationalId),
    check("PersonalData_citizenId_check", sql`${table.nationalId} ~ '^[0-9]{13}$'`),
    check("PersonalData_taxDeductions_check", sql`${table.taxAllowance} >= 0`),
    check("PersonalData_salary_check", sql`${table.salary} IS NULL OR ${table.salary} >= 0`),
  ],
);


