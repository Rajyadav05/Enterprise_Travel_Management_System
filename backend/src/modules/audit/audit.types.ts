import type { AuditLog, Prisma } from "@prisma/client";

// ─── Input Interfaces ─────────────────────────────────────────────────────────

export interface CreateAuditLogInput {
  actorUserId?: string | null;
  actorEmployeeId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ─── Filter Interfaces ────────────────────────────────────────────────────────

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  actorEmployeeId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

// ─── Paginated Response ───────────────────────────────────────────────────────

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
