import { relations } from "drizzle-orm";

import { user } from "./auth-schema";
import {
  departments,
  employees,
  employmentContracts,
  personalInfo,
  positionHistories,
  positions,
} from "./business-schema";

export const userRelations = relations(user, ({ one }) => ({
  employee: one(employees),
}));

export const departmentRelations = relations(departments, ({ many }) => ({
  positions: many(positions),
}));

export const positionRelations = relations(positions, ({ one, many }) => ({
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
  histories: many(positionHistories),
}));

export const employeeRelations = relations(employees, ({ one, many }) => ({
  user: one(user, {
    fields: [employees.authUserId],
    references: [user.id],
  }),
  personalInfo: one(personalInfo),
  contracts: many(employmentContracts),
}));

export const personalInfoRelations = relations(personalInfo, ({ one }) => ({
  employee: one(employees, {
    fields: [personalInfo.employeeId],
    references: [employees.id],
  }),
}));

export const employmentContractRelations = relations(
  employmentContracts,
  ({ one, many }) => ({
    employee: one(employees, {
      fields: [employmentContracts.employeeId],
      references: [employees.id],
    }),
    positionHistories: many(positionHistories),
  }),
);

export const positionHistoryRelations = relations(
  positionHistories,
  ({ one }) => ({
    contract: one(employmentContracts, {
      fields: [positionHistories.contractId],
      references: [employmentContracts.id],
    }),
    department: one(departments, {
      fields: [positionHistories.departmentId],
      references: [departments.id],
    }),
    position: one(positions, {
      fields: [positionHistories.positionId],
      references: [positions.id],
    }),
    supervisor: one(employees, {
      fields: [positionHistories.supervisorEmployeeId],
      references: [employees.id],
    }),
  }),
);
