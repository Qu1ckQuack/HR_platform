const names = [
  ["กานต์", "พิมพ์ใจ"], ["ธนา", "ศิริสุข"], ["ชญานิศ", "วัฒนกุล"], ["ดาริน", "วงศ์ดี"], ["เอกชัย", "ตั้งมั่น"],
  ["ฟ้าใส", "กิตติรักษ์"], ["กวิน", "เจริญทรัพย์"], ["ฮานะ", "แสงทอง"], ["อิทธิ", "บุญช่วย"], ["จันทรา", "พรหมมา"],
  ["กิตติ", "วัฒนา"], ["ลลิตา", "ใจดี"], ["มาลี", "ศรีสวัสดิ์"], ["นรินทร์", "พัฒนกุล"], ["อรทัย", "มั่นคง"],
  ["พิมพ์ชนก", "ทองคำ"], ["กฤต", "รุ่งเรือง"], ["รดา", "แสนสุข"], ["ศรัณย์", "ประเสริฐ"], ["ธารา", "คำดี"],
  ["อุไรวรรณ", "บุญมี"], ["วารุณี", "แซ่ตั้ง"], ["วรินทร์", "ยิ้มแย้ม"], ["ชยพล", "แก้วงาม"], ["ญาดา", "สุขสันต์"],
  ["นที", "พูนผล"], ["อรุณ", "ใจมั่น"], ["บัว", "รัตนวงศ์"], ["ชัย", "ศรีทอง"], ["ดารา", "คำภา"],
] as const;

export const departmentFixtures = [
  { code: "HR", name: "Human Resources" },
  { code: "SALES", name: "Sales" },
  { code: "ENG", name: "Engineering" },
  { code: "OPS", name: "Operations" },
] as const;

export const positionFixtures = [
  { code: "HR_MGR", name: "HR Manager", department: "HR" },
  { code: "HR_OFF", name: "HR Officer", department: "HR" },
  { code: "SALES_MGR", name: "Sales Manager", department: "SALES" },
  { code: "SALES_OFF", name: "Sales Officer", department: "SALES" },
  { code: "ENG_MGR", name: "Engineering Manager", department: "ENG" },
  { code: "ENG_DEV", name: "Software Engineer", department: "ENG" },
  { code: "OPS_MGR", name: "Operations Manager", department: "OPS" },
  { code: "OPS_OFF", name: "Operations Officer", department: "OPS" },
] as const;

export function employeeFixture(index: number, adminEmail: string) {
  const [firstName, lastName] = names[index]!;
  const prefix = index % 2 ? "นางสาว" : "นาย";
  const department = departmentFixtures[index % departmentFixtures.length]!;
  const position = positionFixtures.find((item) => item.department === department.code && item.code.endsWith(index % 2 ? "OFF" : "MGR"))!;
  const employmentType = ["พนักงานประจำ", "พนักงานสัญญาจ้าง", "ฟรีแลนซ์", "พนักงานพาร์ทไทม์"][index % 4]!;
  const employmentStatus = index % 7 === 0 ? "ทดลองงาน" : index % 11 === 0 ? "พ้นสภาพ" : "ปฏิบัติงาน";
  const emailName = `demo.employee${String(index + 1).padStart(2, "0")}`;
  const employeeEmail = index === 0 ? adminEmail : `${emailName}@example.com`;
  return {
    employee: { prefix, nickname: firstName, sex: prefix === "นาย" ? "ชาย" : "หญิง", firstName, lastName, englishName: `Demo Employee ${String(index + 1).padStart(2, "0")}`, companyEmail: employeeEmail },
    personal: {
      nationalId: String(1101000000000 + index), bankAccount: String(1000000000 + index),
      socialSecurity: String(1200000000 + index), providentFund: `PF-DEMO-${String(index + 1).padStart(4, "0")}`,
      taxAllowance: String(12000 + index * 250), religion: index % 3 ? "Buddhist" : "None",
      disability: "None", criminalRecord: "None", salary: String(28000 + index * 1250),
      location: `${100 + index} Demo Road, Bangkok`, email: `${emailName}@personal.example.com`,
      phone: `080-${String(100 + index).padStart(3, "0")}-${String(1000 + index).padStart(4, "0")}`,
    },
    contract: { employmentType, employmentStatus, startDate: "2025-01-15", endDate: employmentType === "พนักงานสัญญาจ้าง" ? "2027-01-14" : null, probationEndDate: employmentStatus === "ทดลองงาน" ? "2025-04-15" : null },
    departmentCode: department.code, positionCode: position.code,
  };
}
