import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  departments,
  employees,
  employmentContracts,
  personalInfo,
  positionHistories,
  positions,
} from "@/db/business-schema";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const search = url.searchParams.get("search")?.trim().toLocaleLowerCase() ?? "";
    const statusFilter = url.searchParams.get("status") ?? "all";
    const page = Number.isFinite(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
    const rows = await db
      .select({
        employee: employees,
        personalInfo,
        contract: employmentContracts,
        positionHistory: positionHistories,
        position: positions,
        department: departments,
      })
      .from(employees)
      .leftJoin(personalInfo, eq(personalInfo.employeeId, employees.id))
      .leftJoin(
        employmentContracts,
        eq(employmentContracts.employeeId, employees.id),
      )
      .leftJoin(
        positionHistories,
        and(
          eq(positionHistories.contractId, employmentContracts.id),
          isNull(positionHistories.effectiveTo),
        ),
      )
      .leftJoin(positions, eq(positions.id, positionHistories.positionId))
      .leftJoin(departments, eq(departments.id, positions.departmentId))
      .orderBy(employees.createdAt, desc(employmentContracts.startDate));

    const employeeMap = new Map<string, ReturnType<typeof serializeEmployee>>();
    for (const row of rows) {
      if (!employeeMap.has(row.employee.id)) {
        employeeMap.set(row.employee.id, serializeEmployee(row));
      }
    }

    const searchResults = Array.from(employeeMap.values()).filter((employee) => {
      const matchesSearch =
        !search ||
        [
          employee.id,
          employee.name,
          employee.firstNameThai,
          employee.lastNameThai,
          employee.businessEmail,
          employee.department,
          employee.position,
          employee.employmentType,
        ].some((value) => value.toLocaleLowerCase().includes(search));
      return matchesSearch;
    });
    const filteredEmployees = searchResults.filter(
      (employee) => statusFilter === "all" || employee.status === statusFilter,
    );
    const total = filteredEmployees.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;

    return Response.json({
      employees: filteredEmployees.slice(start, start + PAGE_SIZE),
      pagination: {
        page: currentPage,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
        active: searchResults.filter((employee) => employee.status === "Active").length,
        probation: searchResults.filter(
          (employee) => employee.status === "Probation",
        ).length,
      },
    });
  } catch (error) {
    console.error("Unable to load employees from PostgreSQL:", error);
    return Response.json(
      { error: "ไม่สามารถโหลดข้อมูลพนักงานได้" },
      { status: 500 },
    );
  }
}

function serializeEmployee(row: {
  employee: typeof employees.$inferSelect;
  personalInfo: typeof personalInfo.$inferSelect | null;
  contract: typeof employmentContracts.$inferSelect | null;
  positionHistory: typeof positionHistories.$inferSelect | null;
  position: typeof positions.$inferSelect | null;
  department: typeof departments.$inferSelect | null;
}) {
  const { employee, personalInfo: personal, contract, position, department } =
    row;
  const status = toUiStatus(contract?.employmentStatus);

  return {
    id: `EMP-${employee.id.slice(0, 8).toUpperCase()}`,
    databaseId: employee.id,
    displayId: `EMP-${employee.id.slice(0, 8).toUpperCase()}`,
    color: "bg-sky-500",
    initials: `${employee.firstName.slice(0, 1)}${employee.lastName.slice(0, 1)}`,
    name: `${employee.prefix ? `${employee.prefix} ` : ""}${employee.firstName} ${employee.lastName}`,
    prefix: employee.prefix ?? "",
    nickname: "",
    firstNameThai: employee.firstName,
    lastNameThai: employee.lastName,
    citizenId: personal?.nationalId ?? "",
    businessEmail: employee.companyEmail,
    phone: "",
    englishName: "",
    department: department?.departmentName ?? "ยังไม่ระบุ",
    position: position?.positionName ?? "ยังไม่ระบุ",
    employmentType: contract?.employmentType ?? "ยังไม่ระบุ",
    startDate: contract?.startDate ?? "",
    status,
  };
}

function toUiStatus(
  status: string | null | undefined,
): "Active" | "Probation" | "Inactive" {
  if (status === "ทดลองงาน") return "Probation";
  if (status === "พ้นสภาพ") return "Inactive";
  return "Active";
}
