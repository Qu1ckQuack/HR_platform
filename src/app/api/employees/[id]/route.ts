import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  employees,
  employmentContracts,
  personalInfo,
  positionHistories,
  positions,
} from "@/db/business-schema";

const prefixes = new Set(["นาย", "นางสาว", "นาง"]);
const employmentTypes = new Set(["ประจำ", "พาร์ทไทม์", "สัญญาจ้างชั่วคราว", "ฟรีแลนซ์"]);
const phonePattern = /^\d{3}-\d{3}-\d{4}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EmployeeUpdate = {
  prefix: string;
  nickname: string;
  firstNameThai: string;
  lastNameThai: string;
  englishName: string;
  citizenId: string;
  businessEmail: string;
  phone: string;
  departmentId: string;
  positionId: string;
  employmentType: string;
  startDate: string;
  supervisorEmployeeId: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuidPattern.test(id)) {
    return Response.json({ error: "รหัสพนักงานไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Partial<EmployeeUpdate>;
    const values = normalizeUpdate(body);
    const validationError = validateUpdate(values);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      const [employee] = await tx
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.id, id))
        .limit(1);
      if (!employee) throw new RequestError("ไม่พบข้อมูลพนักงาน", 404);

      const [position] = await tx
        .select({ departmentId: positions.departmentId })
        .from(positions)
        .where(eq(positions.id, values.positionId))
        .limit(1);
      if (!position || position.departmentId !== values.departmentId) {
        throw new RequestError("ตำแหน่งไม่ตรงกับหน่วยงานที่เลือก", 400);
      }

      if (values.supervisorEmployeeId && values.supervisorEmployeeId === id) {
        throw new RequestError("พนักงานไม่สามารถเป็นผู้บังคับบัญชาของตนเองได้", 400);
      }

      await tx
        .update(employees)
        .set({
          prefix: values.prefix,
          nickname: values.nickname || null,
          firstName: values.firstNameThai,
          lastName: values.lastNameThai,
          englishName: values.englishName || null,
          companyEmail: values.businessEmail,
          phone: values.phone || null,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, id));

      await tx
        .insert(personalInfo)
        .values({
          employeeId: id,
          nationalId: values.citizenId,
        })
        .onConflictDoUpdate({
          target: personalInfo.employeeId,
          set: { nationalId: values.citizenId },
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
                startDate: values.startDate,
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
                employmentStatus: "จ้างงาน",
                startDate: values.startDate,
              })
              .returning()
          )[0];

      if (!contract) throw new RequestError("ไม่สามารถบันทึกข้อมูลการจ้างงานได้", 500);

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
            supervisorEmployeeId: values.supervisorEmployeeId || null,
            effectiveFrom: values.startDate,
          })
          .where(eq(positionHistories.id, existingHistory.id));
      } else {
        await tx.insert(positionHistories).values({
          contractId: contract.id,
          departmentId: values.departmentId,
          positionId: values.positionId,
          supervisorEmployeeId: values.supervisorEmployeeId || null,
          effectiveFrom: values.startDate,
        });
      }
    });

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Unable to update employee:", error);
    return Response.json(
      { error: "ไม่สามารถบันทึกข้อมูลพนักงานได้" },
      { status: 500 },
    );
  }
}

function normalizeUpdate(body: Partial<EmployeeUpdate>): EmployeeUpdate {
  return {
    prefix: String(body.prefix ?? "").trim(),
    nickname: String(body.nickname ?? "").trim(),
    firstNameThai: String(body.firstNameThai ?? "").trim(),
    lastNameThai: String(body.lastNameThai ?? "").trim(),
    englishName: String(body.englishName ?? "").trim(),
    citizenId: String(body.citizenId ?? "").trim(),
    businessEmail: String(body.businessEmail ?? "").trim().toLowerCase(),
    phone: String(body.phone ?? "").trim(),
    departmentId: String(body.departmentId ?? "").trim(),
    positionId: String(body.positionId ?? "").trim(),
    employmentType: String(body.employmentType ?? "").trim(),
    startDate: String(body.startDate ?? "").trim(),
    supervisorEmployeeId: String(body.supervisorEmployeeId ?? "").trim(),
  };
}

function validateUpdate(values: EmployeeUpdate) {
  if (!prefixes.has(values.prefix)) return "กรุณาเลือกคำนำหน้า";
  if (!values.firstNameThai) return "กรุณากรอกชื่อ (ไทย)";
  if (!values.lastNameThai) return "กรุณากรอกนามสกุล (ไทย)";
  if (!/^\d-\d{4}-\d{5}-\d{2}-\d$/.test(values.citizenId)) {
    return "เลขบัตรประชาชนต้องมี 13 หลักในรูปแบบ x-xxxx-xxxxx-xx-x";
  }
  if (!values.businessEmail || !values.businessEmail.includes("@")) {
    return "กรุณากรอกอีเมลบริษัทให้ถูกต้อง";
  }
  if (values.phone && !phonePattern.test(values.phone)) {
    return "โทรศัพท์ต้องอยู่ในรูปแบบ xxx-xxx-xxxx";
  }
  if (!uuidPattern.test(values.departmentId)) return "กรุณาเลือกหน่วยงาน";
  if (!uuidPattern.test(values.positionId)) return "กรุณาเลือกตำแหน่ง";
  if (!employmentTypes.has(values.employmentType)) return "กรุณาเลือกประเภทการจ้างงาน";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.startDate)) return "กรุณาเลือกวันที่เริ่มงาน";
  if (values.supervisorEmployeeId && !uuidPattern.test(values.supervisorEmployeeId)) {
    return "ผู้บังคับบัญชาไม่ถูกต้อง";
  }
  return null;
}

class RequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
