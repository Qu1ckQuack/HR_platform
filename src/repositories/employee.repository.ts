import {
  and,
  asc,
  desc,
  eq,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import type { EmployeeUpdate } from "@/types/employee";
import type { NotificationType } from "@/types/notification-type";
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
  const [departmentRows, positionRows, supervisorRows, employmentTypeRows] =
    await Promise.all([
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
      db
        .selectDistinct({ employmentType: employmentContracts.employmentType })
        .from(employmentContracts)
        .orderBy(asc(employmentContracts.employmentType)),
    ]);

  return { departmentRows, positionRows, supervisorRows, employmentTypeRows };
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
        religion: values.religion || "ไม่มีศาสนา",
        disability: values.disability || null,
        criminalRecord: values.criminalRecord || null,
        salary: values.salary || null,
        location: values.location,
        email: values.personalEmail,
        phone: values.phone || null,
      })
      .onConflictDoUpdate({
        target: personalInfo.employeeId,
        set: {
          nationalId: values.citizenId,
          bankAccount: values.bankAccount,
          religion: values.religion || "ไม่มีศาสนา",
          disability: values.disability || null,
          criminalRecord: values.criminalRecord || null,
          salary: values.salary || null,
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
        religion: values.religion || "ไม่มีศาสนา",
        disability: values.disability || null,
        criminalRecord: values.criminalRecord || null,
        salary: values.salary || null,
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

export async function expireContractsForActor(actorId: string) {
  await db.execute(sql`SELECT expire_contracts(${actorId})`);
}

export async function findEmployeeNotifications() {
  const today = sql`th_today()`;
  const kind = sql<NotificationType>`CASE
    WHEN ${employmentContracts.employmentStatus} = 'ทดลองงาน' THEN 'probation-due'
    ELSE 'contract-expired'
  END`;
  const eventDate = sql<string>`CASE
    WHEN ${employmentContracts.employmentStatus} = 'ทดลองงาน' THEN ${employmentContracts.probationEndDate}
    ELSE ${employmentContracts.endDate}
  END`;

  return db
    .select({
      contractId: employmentContracts.id,
      employeeId: employees.id,
      employeeCode: employees.id,
      employeeName: sql<string>`concat_ws(' ', nullif(${employees.prefix}, ''), ${employees.firstName}, ${employees.lastName})`,
      employmentType: employmentContracts.employmentType,
      kind,
      eventDate,
    })
    .from(employmentContracts)
    .innerJoin(employees, eq(employees.id, employmentContracts.employeeId))
    .where(and(
      isNull(employees.deletedAt),
      or(
        and(
          eq(employmentContracts.employmentStatus, "ทดลองงาน"),
          lte(employmentContracts.probationEndDate, today),
        ),
        and(
          eq(employmentContracts.employmentType, "พนักงานสัญญาจ้าง"),
          eq(employmentContracts.employmentStatus, "พ้นสภาพ"),
          isNotNull(employmentContracts.endDate),
          lte(employmentContracts.endDate, today),
        ),
      ),
    ))
    .orderBy(asc(eventDate), asc(employees.id));
}

export async function approveProbationRecord(actorId: string, contractId: string) {
  try {
    await db.execute(sql`SELECT approve_probation(${actorId}, ${contractId})`);
  } catch (error) {
    throw mapContractActionError(error);
  }
}

export async function renewContractRecord(
  actorId: string,
  contractId: string,
  endDate: string | null,
) {
  try {
    await db.execute(sql`SELECT renew_contract(${actorId}, ${contractId}, ${endDate})`);
  } catch (error) {
    throw mapContractActionError(error);
  }
}

function mapContractActionError(error: unknown) {
  const code = getPostgresErrorCode(error);
  if (code === "42501") return new EmployeeRepositoryError("คุณไม่มีสิทธิ์ดำเนินการ", 403);
  if (code === "P0001") return new EmployeeRepositoryError("สถานะสัญญาไม่รองรับการดำเนินการนี้", 409);
  return error instanceof Error ? error : new Error("Contract action failed");
}

export async function rejectProbationRecord(actorId: string, contractId: string) {
  try {
    await db.execute(sql`SELECT reject_probation(${actorId}, ${contractId})`);
  } catch (error) {
    throw mapContractActionError(error);
  }
}

export async function cancelTerminatedContractRecord(actorId: string, contractId: string) {
  try {
    await db.execute(sql`SELECT cancel_terminated_contract(${actorId}, ${contractId})`);
  } catch (error) {
    throw mapContractActionError(error);
  }
}

export async function softDeleteEmployeeRecord(actorId: string, employeeId: string) {
  try {
    await db.execute(sql`SELECT soft_delete_employee(${actorId}, ${employeeId})`);
  } catch (error) {
    const code = getPostgresErrorCode(error);
    if (code === "42501") throw new EmployeeRepositoryError("คุณไม่มีสิทธิ์ดำเนินการ", 403);
    throw error instanceof Error ? error : new Error("soft delete failed");
  }
}

export async function restoreEmployeeRecord(actorId: string, employeeId: string) {
  try {
    await db.execute(sql`SELECT restore_employee(${actorId}, ${employeeId})`);
  } catch (error) {
    const code = getPostgresErrorCode(error);
    if (code === "42501") throw new EmployeeRepositoryError("คุณไม่มีสิทธิ์ดำเนินการ", 403);
    throw error instanceof Error ? error : new Error("restore employee failed");
  }
}

export async function pruneDeletedEmployees() {
  await db.execute(sql`SELECT purge_deleted_employees()`);
}

export async function findEmployeePositionHistory(employeeId: string) {
  const [activeContract] = await db
    .select({ id: employmentContracts.id })
    .from(employmentContracts)
    .where(eq(employmentContracts.employeeId, employeeId))
    .orderBy(desc(employmentContracts.startDate), desc(employmentContracts.id))
    .limit(1);

  if (!activeContract) {
    return [] as Array<{
      id: string;
      effectiveFrom: string;
      effectiveTo: string | null;
      departmentName: string | null;
      positionName: string | null;
    }>;
  }

  return db
    .select({
      id: positionHistories.id,
      effectiveFrom: positionHistories.effectiveFrom,
      effectiveTo: positionHistories.effectiveTo,
      departmentName: departments.departmentName,
      positionName: positions.positionName,
    })
    .from(positionHistories)
    .leftJoin(positions, eq(positions.id, positionHistories.positionId))
    .leftJoin(departments, eq(departments.id, positionHistories.departmentId))
    .where(eq(positionHistories.contractId, activeContract.id))
    .orderBy(desc(positionHistories.effectiveFrom), desc(positionHistories.id));
}


export async function findDepartmentByName(name: string) {
  const [existing] = await db
    .select({ id: departments.id, name: departments.departmentName })
    .from(departments)
    .where(eq(departments.departmentName, name.trim()))
    .limit(1);
  return existing;
}

export async function createDepartmentRecord(departmentName: string) {
  const existing = await findDepartmentByName(departmentName);
  if (existing) return existing;

  const [created] = await db
    .insert(departments)
    .values({ departmentName: departmentName.trim() })
    .returning({ id: departments.id, name: departments.departmentName });
  return created;
}

export async function findPositionByName(name: string, departmentId: string) {
  const [existing] = await db
    .select({ id: positions.id, name: positions.positionName, departmentId: positions.departmentId })
    .from(positions)
    .where(and(eq(positions.positionName, name.trim()), eq(positions.departmentId, departmentId)))
    .limit(1);
  return existing;
}

export async function createPositionRecord(positionName: string, departmentId: string) {
  const existing = await findPositionByName(positionName, departmentId);
  if (existing) return existing;

  const [created] = await db
    .insert(positions)
    .values({ positionName: positionName.trim(), departmentId })
    .returning({ id: positions.id, name: positions.positionName, departmentId: positions.departmentId });
  return created;
}