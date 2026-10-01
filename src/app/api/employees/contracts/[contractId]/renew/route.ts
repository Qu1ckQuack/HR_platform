import { requireHrSession } from "@/lib/role-guard";
import {
  EmployeeServiceError,
  renewContract,
} from "@/services/employee.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;
  const { contractId } = await params;

  try {
    await renewContract(
      authorization.session.user.id,
      contractId,
      await request.json(),
    );
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to renew contract:", error);
    return Response.json({ error: "ไม่สามารถต่อสัญญาได้" }, { status: 500 });
  }
}
