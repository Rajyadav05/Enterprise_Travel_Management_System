import { apiClient, apiDownload } from "./client";
import type {
  Booking,
  DashboardSummary,
  DepartmentAnalyticsItem,
  MonthlyAnalyticsItem,
  PaginatedData,
  TravelRequest,
  VendorAnalyticsItem,
} from "../types";

export interface ReportQueryParams {
  status?: string;
  vendor?: string;
  departmentId?: string;
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export const reportsApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    return apiClient<DashboardSummary>("/admin/reports/summary", {
      method: "GET",
    });
  },

  getMonthly: async (year?: number): Promise<MonthlyAnalyticsItem[]> => {
    return apiClient<MonthlyAnalyticsItem[]>("/admin/reports/monthly", {
      method: "GET",
      params: year ? { year } : undefined,
    });
  },

  getDepartments: async (): Promise<DepartmentAnalyticsItem[]> => {
    return apiClient<DepartmentAnalyticsItem[]>("/admin/reports/departments", {
      method: "GET",
    });
  },

  getVendors: async (): Promise<VendorAnalyticsItem[]> => {
    return apiClient<VendorAnalyticsItem[]>("/admin/reports/vendors", {
      method: "GET",
    });
  },

  getTravelRequestsReport: async (
    params?: ReportQueryParams
  ): Promise<PaginatedData<TravelRequest>> => {
    return apiClient<PaginatedData<TravelRequest>>(
      "/admin/reports/travel-requests",
      {
        method: "GET",
        params: params as Record<string, string | number>,
      }
    );
  },

  getBookingsReport: async (
    params?: ReportQueryParams
  ): Promise<PaginatedData<Booking>> => {
    return apiClient<PaginatedData<Booking>>("/admin/reports/bookings", {
      method: "GET",
      params: params as Record<string, string | number>,
    });
  },

  exportTravelRequests: async (
    params?: ReportQueryParams
  ): Promise<void> => {
    const today = new Date().toISOString().split("T")[0];
    return apiDownload(
      "/admin/reports/travel-requests/export",
      `ETMS_Travel_Requests_${today}.xlsx`,
      params as Record<string, string | number>
    );
  },

  exportBookings: async (params?: ReportQueryParams): Promise<void> => {
    const today = new Date().toISOString().split("T")[0];
    return apiDownload(
      "/admin/reports/bookings/export",
      `ETMS_Bookings_${today}.xlsx`,
      params as Record<string, string | number>
    );
  },
};
