import { requireHrSession } from "@/lib/role-guard";
import {
  cancelTerminatedContract,
  EmployeeServiceError,
} from "@/services/employee.service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;
  const { contractId } = await params;

  try {
    await cancelTerminatedContract(authorization.session.user.id, contractId);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to cancel terminated contract:", error);
    return Response.json({ error: "ไม่สามารถยกเลิกสัญญาได้" }, { status: 500 });
  }
}
