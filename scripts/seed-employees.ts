import { config } from "dotenv";
import { and, eq } from "drizzle-orm";

config({ path: ".env.local" });
config({ path: ".env" });

const employeeSeed = [
  ["นางสาว", "พิมพ์ชนก", "ทองคำ", "pimchanok.thongkham"],
  ["นางสาว", "วิภาวดี", "วงศ์สวัสดิ์", "wipawadee.wongsawat"],
  ["นางสาว", "จิราพร", "มั่นคง", "jiraporn.mankong"],
  ["นางสาว", "นันทนา", "พรมมา", "nantana.prommar"],
  ["นาย", "อนุชษา", "วงศ์สวัสดิ์", "anucha.wongsawat"],
  ["นาย", "ธนกร", "ศรีสุข", "thanakorn.srisuk"],
  ["นางสาว", "กัญญารัตน์", "มีสุข", "kanyarat.meesuk"],
  ["นาย", "ภาคภูมิ", "เจริญทรัพย์", "phakphum.charoensap"],
  ["นางสาว", "สุภัสสรา", "ใจดี", "supassara.jaidee"],
  ["นาย", "กิตติพงษ์", "วัฒนะ", "kittipong.wattana"],
  ["นางสาว", "รัตนาภรณ์", "บุญช่วย", "rattanaporn.boonchuay"],
  ["นาย", "ศุภกร", "รุ่งเรือง", "supakorn.rungrueang"],
  ["นางสาว", "ชลธิชา", "แสงทอง", "chonlathicha.saengthong"],
  ["นาย", "ณัฐวุฒิ", "พัฒนกุล", "natthawut.pattanakul"],
  ["นางสาว", "ปาริฉัตร", "คงมั่น", "parichat.kongman"],
  ["นาย", "วรเมธ", "เกียรติไพบูลย์", "woramet.kiatphaiboon"],
  ["นางสาว", "มณีรัตน์", "อ่อนหวาน", "maneerat.onwan"],
  ["นาย", "พีรพล", "สกุลไทย", "peeraphon.sakunthai"],
  ["นางสาว", "อริสา", "ธรรมรักษ์", "arisa.thammarak"],
  ["นาย", "ชยพล", "มั่นคงดี", "chayaphon.mankongdee"],
] as const;

const departmentSeed = [
  ["HR", "ทรัพยากรบุคคล"],
  ["SALES", "ฝ่ายขายและการตลาด"],
  ["ENGINEERING", "วิศวกรรม"],
  ["OPERATIONS", "ปฏิบัติการ"],
] as const;

const positionSeed = [
  ["HR_MANAGER", "ผู้จัดการฝ่ายทรัพยากรบุคคล", "HR", true],
  ["SALES_MANAGER", "ผู้จัดการฝ่ายขาย", "SALES", false],
  ["SALES_OFFICER", "เจ้าหน้าที่ฝ่ายขาย", "SALES", false],
  ["ENGINEER", "วิศวกร", "ENGINEERING", false],
  ["OPERATOR", "เจ้าหน้าที่ปฏิบัติการ", "OPERATIONS", false],
] as const;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Add it to .env.local before running npm run seed:employees.",
    );
  }

  const { db } = await import("../src/db");
  const { user } = await import("../src/db/auth-schema");
  const {
    departments,
    employees,
    employmentContracts,
    positionHistories,
    positions,
  } = await import("../src/db/business-schema");

  await db.transaction(async (tx) => {
    const getOrCreateDepartment = async (code: string, name: string) => {
      const existing = await tx
        .select()
        .from(departments)
        .where(eq(departments.departmentName, name))
        .limit(1);
      if (existing[0]) return existing[0];

      const [created] = await tx
        .insert(departments)
        .values({ departmentName: name })
        .returning();
      if (!created) throw new Error(`Unable to create department ${code}.`);
      return created;
    };
    const getOrCreatePosition = async (
      code: string,
      name: string,
      departmentId: string,
      isHrRole: boolean,
    ) => {
      const existing = await tx
        .select()
        .from(positions)
        .where(
          and(
            eq(positions.positionName, name),
            eq(positions.departmentId, departmentId),
          ),
        )
        .limit(1);
      if (existing[0]) return existing[0];

      const [created] = await tx
        .insert(positions)
        .values({ positionName: name, departmentId, isHrRole })
        .returning();
      if (!created) throw new Error(`Unable to create position ${code}.`);
      return created;
    };

    const departmentByCode = new Map<string, string>();
    for (const [code, name] of departmentSeed) {
      const department = await getOrCreateDepartment(code, name);
      departmentByCode.set(code, department.id);
    }

    const positionByCode = new Map<string, string>();
    for (const [code, name, departmentCode, isHrRole] of positionSeed) {
      const departmentId = departmentByCode.get(departmentCode);
      if (!departmentId) throw new Error(`Missing department ${departmentCode}.`);
      const position = await getOrCreatePosition(
        code,
        name,
        departmentId,
        isHrRole,
      );
      positionByCode.set(code, position.id);
    }

    const hrPositionId = positionByCode.get("HR_MANAGER");
    const salesManagerPositionId = positionByCode.get("SALES_MANAGER");
    const salesOfficerPositionId = positionByCode.get("SALES_OFFICER");
    const engineerPositionId = positionByCode.get("ENGINEER");
    const operatorPositionId = positionByCode.get("OPERATOR");
    if (
      !hrPositionId ||
      !salesManagerPositionId ||
      !salesOfficerPositionId ||
      !engineerPositionId ||
      !operatorPositionId
    ) {
      throw new Error("Seed positions were not created.");
    }

    let createdEmployees = 0;
    for (const [index, [prefix, firstName, lastName, emailPrefix]] of employeeSeed.entries()) {
      const companyEmail = `${emailPrefix}@example.com`;
      const existing = await tx
        .select()
        .from(employees)
        .where(eq(employees.companyEmail, companyEmail))
        .limit(1);

      const employee =
        existing[0] ??
        (
          await tx
            .insert(employees)
            .values({
              employeeCode: `EMP-${String(index + 1).padStart(4, "0")}`,
              prefix,
              firstName,
              lastName,
              companyEmail,
            })
            .returning()
        )[0];
      if (!employee) throw new Error(`Unable to create employee ${companyEmail}.`);
      if (!existing[0]) createdEmployees += 1;

      const positionId =
        index === 0
          ? hrPositionId
          : index === 1
            ? salesManagerPositionId
            : index % 3 === 0
              ? engineerPositionId
              : index % 3 === 1
                ? salesOfficerPositionId
                : operatorPositionId;
      const contract = await tx
        .select()
        .from(employmentContracts)
        .where(eq(employmentContracts.employeeId, employee.id))
        .limit(1);
      const employeeContract =
        contract[0] ??
        (
          await tx
            .insert(employmentContracts)
            .values({
              employeeId: employee.id,
              employmentType: index === 3 ? "ทดลองงาน" : "ประจำ",
              employmentStatus: index === 3 ? "ทดลองงาน" : "จ้างงาน",
              startDate: "2024-01-15",
            })
            .returning()
        )[0];
      if (!employeeContract) throw new Error(`Unable to create contract for ${companyEmail}.`);

      const [position] = await tx
        .select({ departmentId: positions.departmentId })
        .from(positions)
        .where(eq(positions.id, positionId))
        .limit(1);
      if (!position) throw new Error(`Unable to find position for ${companyEmail}.`);

      const history = await tx
        .select()
        .from(positionHistories)
        .where(eq(positionHistories.contractId, employeeContract.id))
        .limit(1);
      if (!history[0]) {
        await tx.insert(positionHistories).values({
          contractId: employeeContract.id,
          departmentId: position.departmentId,
          positionId,
          effectiveFrom: "2024-01-15",
        });
      } else {
        await tx
          .update(positionHistories)
          .set({ departmentId: position.departmentId, positionId })
          .where(eq(positionHistories.id, history[0].id));
      }

      if (index === 0) {
        const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
        const [admin] = await tx
          .select()
          .from(user)
          .where(eq(user.email, adminEmail))
          .limit(1);
        const linkedEmployee = admin
          ? await tx
              .select({ id: employees.id })
              .from(employees)
              .where(eq(employees.authUserId, admin.id))
              .limit(1)
          : [];
        if (admin && !employee.authUserId && !linkedEmployee[0]) {
          await tx
            .update(employees)
            .set({ authUserId: admin.id, updatedAt: new Date() })
            .where(eq(employees.id, employee.id));
        }
      }
    }

    console.log(`Seeded ${createdEmployees} new employees (20 total seed records).`);
  });
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unable to seed employees.",
  );
  process.exitCode = 1;
});
