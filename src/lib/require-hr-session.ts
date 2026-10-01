import { auth } from "@/lib/auth";

export async function requireHrSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) {
    return {
      session: null,
      response: Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }),
    };
  }

  const role = session.user.role ?? "";
  if (!session.user.emailVerified || (role !== "hr" && role !== "super_admin")) {
    return {
      session: null,
      response: Response.json({ error: "ไม่มีสิทธิ์ดำเนินการ" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
