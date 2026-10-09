import { eq } from "drizzle-orm";

import { employees } from "../db/business-schema";
import { db } from "./db";
import { auth } from "./auth";

export function isHrRole(role?: string | null) {
  return role === "hr" || role === "super_admin";
}

export async function requireHrSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) {
    return {
      session: null,
      response: Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }),
    };
  }

  const role = session.user.role ?? "";
  if (!isHrRole(role)) {
    return {
      session: null,
      response: Response.json({ error: "ไม่มีสิทธิ์ดำเนินการ" }, { status: 403 }),
    };
  }

  if (!session.user.employeeId) {
    return {
      session: null,
      response: Response.json({ error: "พนักงานที่เข้าสู่ระบบยังไม่ได้ผูกกับบัญชี HR" }, { status: 403 }),
    };
  }

  const [employee] = await db
    .select({ deletedAt: employees.deletedAt })
    .from(employees)
    .where(eq(employees.id, session.user.employeeId))
    .limit(1);

  if (!employee || employee.deletedAt) {
    return {
      session: null,
      response: Response.json({ error: "บัญชี HR นี้ถูกระงับการใช้งาน หรือถูกลบชั่วคราว" }, { status: 403 }),
    };
  }

  return { session, response: null };
}

