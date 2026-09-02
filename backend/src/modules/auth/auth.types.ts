import type { EmployeeStatus, EmploymentType } from "@prisma/client";

export interface LoginInput {
  login: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfJoining?: string | Date;
  employmentType?: EmploymentType;
  departmentId: string;
  designationId: string;
  branchId: string;
  roleId: string;
  reportingManagerId?: string;
}

export interface RoleSummary {
  id: string;
  name: string;
  description?: string | null;
}

export interface SafeUser {
  id: string;
  email: string;
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfJoining: Date | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  departmentId: string;
  designationId: string;
  branchId: string;
  reportingManagerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  description: string | null;
}

export interface DesignationSummary {
  id: string;
  name: string;
  description: string | null;
}

export interface BranchSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
}

export interface ReportingManagerSummary {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
}

export interface FullEmployeeProfile extends SafeEmployee {
  department: DepartmentSummary;
  designation: DesignationSummary;
  branch: BranchSummary;
  reportingManager: ReportingManagerSummary | null;
}

export interface AuthResponseData {
  token: string;
  user: SafeUser;
  employee: SafeEmployee | null;
  role: RoleSummary;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: RoleSummary;
  employee: FullEmployeeProfile | null;
}
