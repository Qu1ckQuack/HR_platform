import { requireHrSession } from "@/lib/role-guard";
import {
  EmployeeServiceError,
  softDeleteEmployee,
  updateEmployee,
} from "@/services/employee.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;

  try {
    await updateEmployee(authorization.session.user.id, id, await request.json());
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to update employee:", error);
    return Response.json(
      { error: "ใส่ข้อมูลไม่ถูกต้อง ไม่สามารถบันทึกข้อมูลพนักงานได้" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;

  try {
    await softDeleteEmployee(authorization.session.user.id, id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to soft delete employee:", error);
    return Response.json({ error: "ไม่สามารถลบพนักงานชั่วคราวได้" }, { status: 500 });
  }
}
