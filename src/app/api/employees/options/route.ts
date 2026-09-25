import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  departments,
  employees,
  employmentContracts,
  positionHistories,
  positions,
} from "@/db/business-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [departmentRows, positionRows, supervisorRows] = await Promise.all([
      db
        .select({ id: departments.id, name: departments.departmentName })
        .from(departments)
        .orderBy(asc(departments.departmentName)),
      db
        .select({
          id: positions.id,
          name: positions.positionName,
          departmentId: positions.departmentId,
        })
        .from(positions)
        .orderBy(asc(positions.positionName)),
      db
        .select({
          id: employees.id,
          employeeCode: employees.employeeCode,
          prefix: employees.prefix,
          firstName: employees.firstName,
          lastName: employees.lastName,
          departmentId: positionHistories.departmentId,
        })
        .from(employees)
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
        .orderBy(asc(employees.employeeCode)),
    ]);

    const supervisorMap = new Map<string, (typeof supervisorRows)[number]>();
    for (const row of supervisorRows) {
      if (!supervisorMap.has(row.id)) supervisorMap.set(row.id, row);
    }

    return Response.json({
      departments: departmentRows,
      positions: positionRows,
      supervisors: Array.from(supervisorMap.values()).map((row) => ({
        id: row.id,
        employeeCode: row.employeeCode,
        name: `${row.prefix ? `${row.prefix} ` : ""}${row.firstName} ${row.lastName}`,
        departmentId: row.departmentId ?? "",
      })),
    });
  } catch (error) {
    console.error("Unable to load employee form options:", error);
    return Response.json(
      { error: "ไม่สามารถโหลดตัวเลือกข้อมูลพนักงานได้" },
      { status: 500 },
    );
  }
}