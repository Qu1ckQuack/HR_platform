import { requireHrSession } from "@/lib/role-guard";
import {
  EmployeeServiceError,
  getEmployeeNotifications,
} from "@/services/employee.service";

export async function GET(request: Request) {
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;

  try {
    const notifications = await getEmployeeNotifications(authorization.session.user.id);
    return Response.json({ notifications });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to load employee notifications:", error);
    return Response.json({ error: "ไม่สามารถโหลดการแจ้งเตือนได้" }, { status: 500 });
  }
}
