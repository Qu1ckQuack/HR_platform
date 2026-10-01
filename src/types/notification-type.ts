export type NotificationType = "contract-expired" | "probation-due";

export type NotificationData = {
  id: string;
  contractId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employmentType: string;
  kind: NotificationType;
  eventDate: string;
};
