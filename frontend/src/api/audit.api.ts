import { apiClient } from "./client";
import type { AuditLog, PaginatedData } from "../types";

export interface AuditLogQueryParams {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  actorEmployeeId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  getAuditLogs: async (
    params?: AuditLogQueryParams
  ): Promise<PaginatedData<AuditLog>> => {
    return apiClient<PaginatedData<AuditLog>>("/admin/audit-logs", {
      method: "GET",
      params: params as Record<string, string | number>,
    });
  },

  getAuditLogById: async (id: string): Promise<AuditLog> => {
    return apiClient<AuditLog>(`/admin/audit-logs/${id}`, {
      method: "GET",
    });
  },
};
