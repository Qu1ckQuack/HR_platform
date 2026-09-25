import type { EmployeeStatus } from "@/shared/components/StatusBadge";

export type Employee = {
  id: string;
  databaseId: string;
  displayId: string;
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
  departmentId: string;
  position: string;
  positionId: string;
  supervisorEmployeeId: string;
  employmentType: string;
  startDate: string;
  status: EmployeeStatus;
};
