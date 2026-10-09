
export type ApplicationStatus =
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected";

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  jobUrl: string;
  notes: string;
};