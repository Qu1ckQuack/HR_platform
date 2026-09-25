import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    departmentName: text("department_name").notNull(),
  },
);

export const positions = pgTable(
  "positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    positionName: text("position_name").notNull(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    isHrRole: boolean("is_hr_role").notNull().default(false),
  },
  (table) => [index("positions_department_id_idx").on(table.departmentId)],
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: text("auth_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    prefix: text("prefix"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    companyEmail: text("company_email").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("employees_auth_user_id_unique").on(table.authUserId),
    index("employees_auth_user_id_idx").on(table.authUserId),
  ],
);

export const personalInfo = pgTable("personal_info", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .unique()
    .references(() => employees.id, { onDelete: "cascade" }),
  nationalId: text("national_id"),
  address: text("address"),
  taxAllowance: text("tax_allowance"),
});

export const employmentContracts = pgTable(
  "employment_contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    employmentType: text("employment_type").notNull(),
    employmentStatus: text("employment_status").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("employment_contracts_employee_id_idx").on(table.employeeId),
    checkDateRange("employment_contracts_date_range_check", table.startDate, table.endDate),
  ],
);

export const positionHistories = pgTable(
  "position_histories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => employmentContracts.id, { onDelete: "cascade" }),
    positionId: uuid("position_id")
      .notNull()
      .references(() => positions.id, { onDelete: "restrict" }      ),
      effectiveFrom: date("effective_from").notNull(),
      effectiveTo: date("effective_to"),
  },
  (table) => [
    index("position_histories_contract_id_idx").on(table.contractId),
    index("position_histories_position_id_idx").on(table.positionId),
    checkDateRange(
      "position_histories_date_range_check",
      table.effectiveFrom,
      table.effectiveTo,
    ),
  ],
);

function checkDateRange(
  name: string,
  startDate: { name: string },
  endDate: { name: string },
) {
  return sql.raw(
    `CONSTRAINT "${name}" CHECK ("${endDate.name}" IS NULL OR "${endDate.name}" >= "${startDate.name}")`,
  );
}
