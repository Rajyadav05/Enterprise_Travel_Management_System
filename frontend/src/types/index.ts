// ─── Core Enums & Entity Types ────────────────────────────────────────────────

export type UserRoleName = "ADMIN" | "EMPLOYEE" | string;

export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "BOOKED"
  | "REJECTED"
  | "CANCELLED";

export type TripType = "ONE_WAY" | "ROUND_TRIP";

export type BookingVendor =
  | "MAKEMYTRIP"
  | "CLEARTRIP"
  | "AIRLINE_WEBSITE"
  | "TRAVEL_AGENT"
  | "CORPORATE_TRAVEL_AGENT"
  | "KNOWN_PERSON"
  | "OTHER";

export interface Role {
  id: string;
  name: UserRoleName;
  description?: string | null;
}

export interface Department {
  id: string;
  name: string;
  code?: string | null;
}

export interface Designation {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  state?: string | null;
  country?: string | null;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  dateOfJoining?: string | null;
  employmentType?: string | null;
  status: "ACTIVE" | "INACTIVE" | "RESIGNED";
  departmentId: string;
  designationId: string;
  branchId: string;
  reportingManagerId?: string | null;
  department?: Department;
  designation?: Designation;
  branch?: Branch;
  user?: {
    id: string;
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
  roleId: string;
  isActive: boolean;
  role: Role;
  employee?: Employee | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    roleId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  employee?: Employee | null;
  role: Role;
}

export interface AuthSession {
  user: User;
  employee?: Employee | null;
  token: string;
}

// ─── Travel Request ───────────────────────────────────────────────────────────

export interface TravelRequest {
  id: string;
  employeeId: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  tripType: TripType;
  purpose: string;
  additionalInfo?: string | null;
  status: RequestStatus;
  approvedById?: string | null;
  approvalDate?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
    branch?: { id: string; name: string; city?: string };
    user?: { email: string };
  };
  approvedBy?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
  } | null;
  booking?: Booking | null;
}

// ─── Flight Booking ───────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  travelRequestId: string;
  airline: string;
  flightNumber: string;
  pnr: string;
  ticketNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDatetime: string;
  arrivalDatetime: string;
  fare: string | number;
  currency: string;
  seat?: string | null;
  baggage?: string | null;
  vendor: BookingVendor;
  bookingSource?: string | null;
  bookingDate: string;
  ticketFilePath?: string | null;
  createdAt: string;
  updatedAt: string;
  travelRequest?: TravelRequest;
}

// ─── Reports & Analytics ──────────────────────────────────────────────────────

export interface DashboardSummary {
  totalTravelRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  bookedRequests: number;
  totalBookings: number;
  totalTravelSpend: number;
  approvalRate: number;
  rejectionRate: number;
}

export interface MonthlyAnalyticsItem {
  month: string;
  monthIndex: number;
  year: number;
  requestCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  bookedCount: number;
  bookingCount: number;
  travelSpend: number;
}

export interface DepartmentAnalyticsItem {
  departmentId: string;
  departmentName: string;
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  bookedRequests: number;
  totalBookings: number;
  totalSpend: number;
  approvalRate: number;
}

export interface VendorAnalyticsItem {
  vendor: BookingVendor | string;
  bookingCount: number;
  totalSpend: number;
  averageFare: number;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actorUserId?: string | null;
  actorEmployeeId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

// ─── API Wrapper Responses ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
