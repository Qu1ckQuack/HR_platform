import {
  createEmployee,
  EmployeeServiceError,
  expireDueContracts,
  listEmployees,
} from "@/services/employee.service";
import { requireHrSession } from "@/lib/role-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;
  try {
    const url = new URL(request.url);
    const requestedPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const search = url.searchParams.get("search")?.trim().toLocaleLowerCase() ?? "";
    const statusFilter = url.searchParams.get("status") ?? "all";
    const departmentFilter = url.searchParams.get("department") ?? "all";
    const employmentTypeFilter = url.searchParams.get("employmentType") ?? "all";
    await expireDueContracts(authorization.session.user.id);
    return Response.json(
      await listEmployees({
        requestedPage,
        search,
        statusFilter,
        departmentFilter,
        employmentTypeFilter,
      }),
    );
  } catch (error) {
    console.error("Unable to load employees from PostgreSQL:", error);
    return Response.json(
      { error: "ไม่สามารถโหลดข้อมูลพนักงานได้" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = await requireHrSession(request.headers);
  if (!authorization.session) return authorization.response;

  try {
    const result = await createEmployee(authorization.session.user.id, await request.json());
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof EmployeeServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to create employee:", error);
    return Response.json({ error: "ไม่สามารถสร้างข้อมูลพนักงานได้" }, { status: 500 });
  }
}
