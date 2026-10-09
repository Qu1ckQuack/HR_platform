import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  inet,
  pgTable,
  text,
  timestamp,
  bigint,
  uuid,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { employees } from "./business-schema";

export const user = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    employeeId: uuid("employeeId").notNull().references((): AnyPgColumn => employees.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    role: text("role").notNull().default("user"),
    totpSecret: text("totpSecret"),
    totpEnabledAt: timestamp("totpEnabledAt", { withTimezone: true }),
    totpLastStep: bigint("totpLastStep", { mode: "number" }),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("User_employeeId_key").on(table.employeeId),
    unique("User_email_key").on(table.email),
    check("User_role_check", sql`${table.role} IN ('super_admin','hr','user')`),
  ],
);

export const session = pgTable(
  "Sessions",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    ipAddress: inet("ipAddress"),
    deviceInfo: text("deviceInfo").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("Sessions_token_key").on(table.token),
    index("ix_sessions_user").on(table.userId),
    index("ix_sessions_expires").on(table.expiresAt),
  ],
);

export const account = pgTable(
  "Account",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken").notNull(),
    refreshToken: text("refreshToken").notNull(),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
    scope: text("scope"),
    idToken: text("idToken"),
    password: text("password"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("Account_providerId_accountId_key").on(table.providerId, table.accountId),
    index("ix_account_user").on(table.userId),
  ],
);

export const verification = pgTable(
  "Verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ix_verification_ident").on(table.identifier), index("ix_verification_expires").on(table.expiresAt)],
);


