import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { auditController } from "./audit.controller";
import { auditLogQuerySchema } from "./audit.validation";

export const adminAuditRouter = Router();

// Apply authentication and admin role authorization
adminAuditRouter.use(authenticate, authorize("ADMIN"));

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get paginated, filterable security and business audit logs
 * @access  Private (Admin)
 */
adminAuditRouter.get(
  "/",
  validate({ query: auditLogQuerySchema }),
  auditController.listAuditLogs.bind(auditController)
);

/**
 * @route   GET /api/admin/audit-logs/:id
 * @desc    Get single audit log complete record
 * @access  Private (Admin)
 */
adminAuditRouter.get(
  "/:id",
  auditController.getAuditLogById.bind(auditController)
);

export default adminAuditRouter;
