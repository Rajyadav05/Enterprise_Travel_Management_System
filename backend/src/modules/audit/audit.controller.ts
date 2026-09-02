import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constants";
import { auditService } from "./audit.service";
import type { AuditLogQuery } from "./audit.validation";

const getParamId = (param: string | string[] | undefined): string => {
  const val = Array.isArray(param) ? param[0] : param;
  if (!val || typeof val !== "string" || val.trim().length === 0) {
    throw ApiError.badRequest("ID parameter is required");
  }
  return val.trim();
};

export class AuditController {
  // ─── GET /api/admin/audit-logs ──────────────────────────────────────────────

  public async listAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as AuditLogQuery;

      const result = await auditService.getAuditLogs({
        action: query.action,
        entityType: query.entityType,
        entityId: query.entityId,
        actorUserId: query.actorUserId,
        actorEmployeeId: query.actorEmployeeId,
        fromDate: query.fromDate,
        toDate: query.toDate,
        page: query.page,
        limit: query.limit,
      });

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.AUDIT_LOGS_FETCHED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/audit-logs/:id ──────────────────────────────────────────

  public async getAuditLogById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getParamId(req.params.id);

      const log = await auditService.getAuditLogById(id);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.AUDIT_LOG_FETCHED,
        log
      );
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
