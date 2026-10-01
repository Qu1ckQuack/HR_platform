import { getEmployeeFormOptions } from "@/services/employee.service";
import { requireHrSession } from "@/lib/require-hr-session";

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