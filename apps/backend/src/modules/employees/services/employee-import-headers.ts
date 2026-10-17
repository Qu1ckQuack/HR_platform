const aliases: Record<string, string> = {
  prefix: "prefix", คำนำหน้า: "prefix",
  nickname: "nickname", ชื่อเล่น: "nickname",
  sex: "sex", gender: "sex", เพศ: "sex",
  firstnamethai: "firstNameThai", ชื่อไทย: "firstNameThai", ชื่อ: "firstNameThai",
  lastnamethai: "lastNameThai", นามสกุลไทย: "lastNameThai", นามสกุล: "lastNameThai",
  englishname: "englishName", fullnameeng: "englishName", ชื่อภาษาอังกฤษ: "englishName",
  thainame: "thaiName", ชื่อสกุลไทย: "thaiName",
  citizenid: "citizenId", nationalid: "citizenId", เลขบัตรประชาชน: "citizenId",
  bankaccount: "bankAccount", บัญชีธนาคาร: "bankAccount",
  location: "location", address: "location", ที่อยู่: "location",
  personalemail: "personalEmail", อีเมลส่วนตัว: "personalEmail",
  businessemail: "businessEmail", companyemail: "businessEmail", อีเมลบริษัท: "businessEmail",
  phone: "phone", โทรศัพท์: "phone", เบอร์โทรศัพท์: "phone",
  emergencycontactname: "emergencyContactName", ชื่อผู้ติดต่อกรณีฉุกเฉิน: "emergencyContactName",
  religion: "religion", ศาสนา: "religion", disability: "disability", ความพิการ: "disability",
  criminalrecord: "criminalRecord", ประวัติอาชญากรรม: "criminalRecord",
  salary: "salary", เงินเดือน: "salary", ค่าตอบแทนเงินเดือน: "salary",
  departmentid: "departmentId", department: "departmentId", หน่วยงาน: "departmentId",
  positionid: "positionId", position: "positionId", ตำแหน่ง: "positionId",
  employmenttype: "employmentType", ประเภทการจ้างงาน: "employmentType",
  employmentstatus: "employmentStatus", status: "employmentStatus",
  สถานะการจ้างงาน: "employmentStatus", สถานะ: "employmentStatus",
  startdate: "startDate", วันที่เริ่มงาน: "startDate",
  contractenddate: "contractEndDate", วันสิ้นสุดสัญญา: "contractEndDate",
  probationcompletiondate: "probationCompletionDate", วันครบทดลองงาน: "probationCompletionDate",
  supervisoremployeeid: "supervisorEmployeeId", supervisor: "supervisorEmployeeId", ผู้บังคับบัญชา: "supervisorEmployeeId",
};

export function normalizeImportHeader(header: unknown): string {
  const raw = String(header ?? "").replace(/^\uFEFF/, "").trim();
  const key = raw.toLocaleLowerCase().replace(/[\s_()\-./:]+/g, "");
  return aliases[key] ?? raw;
}

export function normalizeImportHeaders(headers: unknown[]): string[] {
  return headers.map(normalizeImportHeader);
}
