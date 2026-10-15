import { and, eq, ilike, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "../../../lib/db";
import { user } from "../../../db/auth-schema";
import { employees, employmentContracts, personalInfo, positionHistories, positions } from "../../../db/business-schema";

export async function findHrAccount(contact: string) {
  const isEmail = contact.includes("@");
  const normalized = isEmail ? contact.trim().toLowerCase() : contact.replace(/\D/g, "");
  const contactMatch = isEmail
    ? or(sql`lower(${employees.companyEmail}) = ${normalized}`, sql`lower(${personalInfo.email}) = ${normalized}`)
    : sql`regexp_replace(coalesce(${personalInfo.phone}, ''), '\\D', '', 'g') = ${normalized}`;
  const [record] = await db.select({ id: user.id, email: user.email })
    .from(employees)
    .innerJoin(user, eq(user.employeeId, employees.id))
    .innerJoin(employmentContracts, and(eq(employmentContracts.employeeId, employees.id), ne(employmentContracts.employmentStatus, "พ้นสภาพ")))
    .innerJoin(positionHistories, and(eq(positionHistories.contractId, employmentContracts.id), isNull(positionHistories.effectiveTo)))
    .innerJoin(positions, eq(positions.id, positionHistories.positionId))
    .leftJoin(personalInfo, eq(personalInfo.employeeId, employees.id))
    .where(and(
      isNull(employees.deletedAt),
      contactMatch,
      or(ilike(positions.positionName, "%hr%"), ilike(positions.positionName, "%บุคคล%")),
    ))
    .limit(1);
  return record;
}
