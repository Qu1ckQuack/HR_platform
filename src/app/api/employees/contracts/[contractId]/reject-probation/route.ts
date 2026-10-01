import { requireHrSession } from "@/lib/role-guard";
import {
  EmployeeServiceError,
  rejectProbation,
} from "@/services/employee.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;
  const { contractId } = await params;

  try {
    await rejectProbation(authorization.session.user.id, contractId);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to reject probation:", error);
    return Response.json({ error: "ไม่สามารถบันทึกผลไม่อนุมัติได้" }, { status: 500 });
  }
}
