import { requireHrSession } from "@/lib/role-guard";
import {
  EmployeeServiceError,
  getEmployeePositionHistory,
} from "@/services/employee.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;

  try {
    const history = await getEmployeePositionHistory(
      authorization.session.user.id,
      id,
    );
    return Response.json({ history });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to load employee position history:", error);
    return Response.json({ error: "ไม่สามารถโหลดประวัติการดำรงตำแหน่งได้" }, { status: 500 });
  }
}
