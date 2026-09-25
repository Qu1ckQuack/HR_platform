import type { EmployeeStatus } from "@/shared/components/StatusBadge";

export type Employee = {
  id: string;
  initials: string;
  color: string;
  name: string;
  prefix: string;
  nickname: string;
  firstNameThai: string;
  lastNameThai: string;
  citizenId: string;
  businessEmail: string;
  phone: string;
  englishName: string;
  department: string;
  position: string;
  employmentType: string;
  startDate: string;
  status: EmployeeStatus;
};
