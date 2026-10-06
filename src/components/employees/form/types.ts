import type { Employee } from "@/types/employee";

export type EmployeeEditForm = {
  prefix: string;
  nickname: string;
  sex: Employee["sex"];
  firstNameThai: string;
  lastNameThai: string;
  englishName: string;
  citizenId: string;
  bankAccount: string;
  location: string;
  personalEmail: string;
  religion: string;
  disability: string;
  criminalRecord: string;
  salary: string;
  businessEmail: string;
  phone: string;
  departmentId: string;
  positionId: string;
  employmentType: string;
  employmentStatus: Employee["employmentStatus"];
  startDate: string;
  contractEndDate: string;
  probationCompletionDate: string;
  supervisorEmployeeId: string;
};

export type EmployeeFormOptions = {
  departments: { id: string; name: string }[];
  positions: { id: string; name: string; departmentId: string }[];
  supervisors: {
    id: string;
    employeeCode: string;
    name: string;
    departmentId: string;
  }[];
};
