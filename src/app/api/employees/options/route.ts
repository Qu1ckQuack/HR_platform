import {
  createDepartment,
  createPosition,
  EmployeeServiceError,
  getEmployeeFormOptions,
} from "@/services/employee.service";
import { requireHrSession } from "@/lib/role-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;
  try {
    return Response.json(await getEmployeeFormOptions());
  } catch (error) {
    console.error("Unable to load employee form options:", error);
    return Response.json(
      { error: "ไม่สามารถโหลดตัวเลือกข้อมูลพนักงานได้" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      type?: "department" | "position";
      name?: string;
      departmentId?: string;
    };

    if (body.type === "department") {
      if (!body.name) {
        return Response.json({ error: "กรุณาระบุชื่อหน่วยงาน" }, { status: 400 });
      }
      const department = await createDepartment(body.name);
      return Response.json({ department }, { status: 201 });
    }

    if (body.type === "position") {
      if (!body.name || !body.departmentId) {
        return Response.json(
          { error: "กรุณาระบุชื่อตำแหน่งและหน่วยงาน" },
          { status: 400 },
        );
      }
      const position = await createPosition(body.name, body.departmentId);
      return Response.json({ position }, { status: 201 });
    }

    return Response.json({ error: "ประเภทข้อมูลไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to create department or position:", error);
    return Response.json(
      { error: "ไม่สามารถบันทึกข้อมูลได้" },
      { status: 500 },
    );
  }
}