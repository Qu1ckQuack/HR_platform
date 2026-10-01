import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import type { EmployeeUpdate } from "@/types/employee";
import {
  departments,
  employees,
  employmentContracts,
  personalInfo,
  positionHistories,
  positions,
} from "@/db/business-schema";

export async function findEmployeesWithCurrentDetails() {
  return db
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
    .where(isNull(employees.deletedAt))
    .orderBy(employees.createdAt, desc(employmentContracts.startDate));
}

export async function findEmployeeFormOptions() {
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
        employeeCode: employees.id,
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
      .where(isNull(employees.deletedAt))
      .orderBy(asc(employees.id)),
  ]);

  return { departmentRows, positionRows, supervisorRows };
}

export async function updateEmployeeRecord(actorId: string, id: string, values: EmployeeUpdate) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT assert_hr(${actorId})`);
    const [employee] = await tx
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    if (!employee) throw new EmployeeRepositoryError("ไม่พบข้อมูลพนักงาน", 404);

    const [position] = await tx
      .select({ departmentId: positions.departmentId })
      .from(positions)
      .where(eq(positions.id, values.positionId))
      .limit(1);
    if (!position || position.departmentId !== values.departmentId) {
      throw new EmployeeRepositoryError("ตำแหน่งไม่ตรงกับหน่วยงานที่เลือก", 400);
    }

    await tx
      .update(employees)
      .set({
        prefix: values.prefix,
        nickname: values.nickname,
        sex: values.sex,
        firstName: values.firstNameThai,
        lastName: values.lastNameThai,
        englishName: values.englishName || null,
        companyEmail: values.businessEmail,
        supervisorEmployeeId: values.supervisorEmployeeId || null,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id));

    await tx
      .insert(personalInfo)
      .values({
        employeeId: id,
        nationalId: values.citizenId,
        bankAccount: values.bankAccount,
        location: values.location,
        email: values.personalEmail,
        phone: values.phone || null,
      })
      .onConflictDoUpdate({
        target: personalInfo.employeeId,
        set: {
          nationalId: values.citizenId,
          bankAccount: values.bankAccount,
          location: values.location,
          email: values.personalEmail,
          phone: values.phone || null,
        },
      });

    const [existingContract] = await tx
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.employeeId, id))
      .orderBy(desc(employmentContracts.startDate))
      .limit(1);

    const contract = existingContract
      ? (
          await tx
            .update(employmentContracts)
            .set({
              employmentType: values.employmentType,
              employmentStatus: values.employmentStatus,
              startDate: values.startDate,
              endDate: values.contractEndDate || null,
              probationEndDate: values.probationCompletionDate || null,
            })
            .where(eq(employmentContracts.id, existingContract.id))
            .returning()
        )[0]
      : (
          await tx
            .insert(employmentContracts)
            .values({
              employeeId: id,
              employmentType: values.employmentType,
              employmentStatus: values.employmentStatus,
              startDate: values.startDate,
              endDate: values.contractEndDate || null,
              probationEndDate: values.probationCompletionDate || null,
            })
            .returning()
        )[0];

    if (!contract) {
      throw new EmployeeRepositoryError("ใส่ข้อมูลไม่ถูกต้อง ไม่สามารถบันทึกข้อมูลการจ้างงานได้", 500);
    }

    const [existingHistory] = await tx
      .select()
      .from(positionHistories)
      .where(
        and(
          eq(positionHistories.contractId, contract.id),
          isNull(positionHistories.effectiveTo),
        ),
      )
      .orderBy(desc(positionHistories.effectiveFrom))
      .limit(1);

    if (existingHistory) {
      await tx
        .update(positionHistories)
        .set({
          departmentId: values.departmentId,
          positionId: values.positionId,
          effectiveFrom: values.startDate,
        })
        .where(eq(positionHistories.id, existingHistory.id));
    } else {
      await tx.insert(positionHistories).values({
        contractId: contract.id,
        departmentId: values.departmentId,
        positionId: values.positionId,
        effectiveFrom: values.startDate,
      });
    }
  });
}

export async function createEmployeeRecord(
  actorId: string,
  values: EmployeeUpdate,
) {
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT assert_hr(${actorId})`);

      const [position] = await tx
        .select({ departmentId: positions.departmentId })
        .from(positions)
        .where(eq(positions.id, values.positionId))
        .limit(1);
      if (!position || position.departmentId !== values.departmentId) {
        throw new EmployeeRepositoryError("ตำแหน่งไม่ตรงกับหน่วยงานที่เลือก", 400);
      }

      if (values.supervisorEmployeeId) {
        const [supervisor] = await tx
          .select({ id: employees.id })
          .from(employees)
          .where(and(eq(employees.id, values.supervisorEmployeeId), isNull(employees.deletedAt)))
          .limit(1);
        if (!supervisor) throw new EmployeeRepositoryError("ไม่พบผู้บังคับบัญชาที่เลือก", 400);
      }

      const [employee] = await tx
        .insert(employees)
        .values({
          prefix: values.prefix,
          nickname: values.nickname,
          firstName: values.firstNameThai,
          lastName: values.lastNameThai,
          englishName: values.englishName || null,
          companyEmail: values.businessEmail,
          sex: values.sex,
          supervisorEmployeeId: values.supervisorEmployeeId || null,
        })
        .returning({ id: employees.id });
      if (!employee) throw new EmployeeRepositoryError("ใส่ข้อมูลไม่ถูกต้อง ไม่สามารถสร้างพนักงานได้", 500);

      await tx.insert(personalInfo).values({
        employeeId: employee.id,
        nationalId: values.citizenId.replaceAll("-", ""),
        bankAccount: values.bankAccount,
        location: values.location,
        email: values.personalEmail,
        phone: values.phone || null,
      });

      const [contract] = await tx
        .insert(employmentContracts)
        .values({
          employeeId: employee.id,
          employmentType: values.employmentType,
          employmentStatus: values.employmentStatus,
          startDate: values.startDate,
          endDate: values.contractEndDate || null,
          probationEndDate: values.probationCompletionDate || null,
        })
        .returning({ id: employmentContracts.id });
      if (!contract) throw new EmployeeRepositoryError("ใส่ข้อมูลไม่ถูกต้อง ไม่สามารถสร้างสัญญาจ้างได้", 500);

      await tx.insert(positionHistories).values({
        contractId: contract.id,
        positionId: values.positionId,
        departmentId: values.departmentId,
        effectiveFrom: values.startDate,
      });

      return employee.id;
    });
  } catch (error) {
    if (error instanceof EmployeeRepositoryError) throw error;
    const code = getPostgresErrorCode(error);
    if (code === "23505") throw new EmployeeRepositoryError("อีเมลหรือเลขบัตรประชาชนนี้ถูกใช้แล้ว", 409);
    if (code === "42501") throw new EmployeeRepositoryError("คุณไม่มีสิทธิ์ดำเนินการ", 403);
    throw error;
  }
}

function getPostgresErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return "";
  return typeof error.code === "string" ? error.code : "";
}

export class EmployeeRepositoryError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}