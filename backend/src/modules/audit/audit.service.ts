import type { AuditLog, Prisma } from "@prisma/client";
import { logger } from "../../config/logger";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { RESPONSE_MESSAGES } from "../../utils/constants";
import type {
  AuditLogFilters,
  CreateAuditLogInput,
  PaginatedAuditLogs,
} from "./audit.types";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "refreshtoken",
  "secret",
  "jwtsecret",
  "smtppass",
  "authorization",
  "cookie",
]);

/**
 * Recursively sanitizes JSON objects by removing or masking sensitive fields.
 */
function sanitizeJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      sanitized[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      sanitized[k] = sanitizeJson(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export class AuditService {
  /**
   * Persists an audit record safely.
   * Never throws so audit failure cannot break primary business operations.
   */
  public async createAuditLog(
    input: CreateAuditLogInput
  ): Promise<AuditLog | null> {
    try {
      const sanitizedOld = input.oldValue
        ? (sanitizeJson(input.oldValue) as Prisma.InputJsonValue)
        : undefined;
      const sanitizedNew = input.newValue
        ? (sanitizeJson(input.newValue) as Prisma.InputJsonValue)
        : undefined;
      const sanitizedMeta = input.metadata
        ? (sanitizeJson(input.metadata) as Prisma.InputJsonValue)
        : undefined;

      const log = await prisma.auditLog.create({
        data: {
          actorUserId: input.actorUserId ?? null,
          actorEmployeeId: input.actorEmployeeId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          oldValue: sanitizedOld,
          newValue: sanitizedNew,
          metadata: sanitizedMeta,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });

      return log;
    } catch (error) {
      logger.error("[AUDIT_LOG_FAILED] Failed to record audit log", error, {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
      });
      return null;
    }
  }

  /**
   * Retrieves paginated, filtered audit logs (Admin only).
   */
  public async getAuditLogs(
    filters: AuditLogFilters
  ): Promise<PaginatedAuditLogs> {
    const page = filters.page ?? 1;
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters.actorEmployeeId) {
      where.actorEmployeeId = filters.actorEmployeeId;
    }
    if (filters.fromDate ?? filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) {
        const endOfDay = new Date(filters.toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const [data, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves full detail of a single audit log by ID (Admin only).
   */
  public async getAuditLogById(id: string): Promise<AuditLog> {
    const log = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw ApiError.notFound(RESPONSE_MESSAGES.AUDIT_LOG_NOT_FOUND);
    }

    return log;
  }
}

export const auditService = new AuditService();
