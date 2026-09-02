import type { BookingVendor, RequestStatus } from "@prisma/client";

// ─── Analytics Interfaces ─────────────────────────────────────────────────────

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
  monthIndex: number; // 1..12
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

// ─── Filter Interfaces ────────────────────────────────────────────────────────

export interface TravelRequestReportFilters {
  status?: RequestStatus;
  departmentId?: string;
  employeeId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface BookingReportFilters {
  vendor?: BookingVendor;
  departmentId?: string;
  employeeId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

// ─── Paginated Response Wrappers ──────────────────────────────────────────────

export interface PaginatedReport<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
