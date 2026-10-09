import { eq } from "drizzle-orm";

import { user } from "../db/auth-schema";
import { employees } from "../db/business-schema";
import { db } from "./db";

type NewUser = { name: string; email: string };

async function findOrCreateEmployee({ name, email }: NewUser) {
  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: employees.id, deletedAt: employees.deletedAt })
    .from(employees)
    .where(eq(employees.companyEmail, normalizedEmail))
    .limit(1);

  if (existing) {
    if (existing.deletedAt) throw new Error("This employee record is deleted.");
    const [linkedUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.employeeId, existing.id))
      .limit(1);
    if (linkedUser) throw new Error("This employee already has an account.");
    return existing.id;
  }

  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  const [employee] = await db
    .insert(employees)
    .values({
      prefix: "",
      nickname: nameParts[0] ?? name,
      firstName: nameParts[0] ?? name,
      lastName: nameParts.slice(1).join(" ") || nameParts[0] || "User",
      companyEmail: normalizedEmail,
      sex: "อื่นๆ",
    })
    .returning({ id: employees.id });

  if (!employee) throw new Error("Unable to create the employee account record.");
  return employee.id;
}

export const authDatabaseHooks = {
  user: {
    create: {
      before: async (data: NewUser) => ({
        data: { ...data, employeeId: await findOrCreateEmployee(data) },
      }),
    },
  },
  session: {
    create: {
      before: async (data: { userAgent?: string | null; ipAddress?: string | null }) => ({
        data: {
          ...data,
          userAgent: data.userAgent ?? "",
          ipAddress: data.ipAddress || null,
        },
      }),
    },
  },
  account: {
    create: {
      before: async (data: { accessToken?: string | null; refreshToken?: string | null }) => ({
        data: {
          ...data,
          accessToken: data.accessToken ?? "",
          refreshToken: data.refreshToken ?? "",
        },
      }),
    },
  },
};

