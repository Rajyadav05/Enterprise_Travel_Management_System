import { z } from "zod";

const dateStringTransform = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional()
  .transform((val) => (val ? new Date(val) : undefined));

export const auditLogQuerySchema = z.object({
  action: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  actorUserId: z.string().trim().min(1).optional(),
  actorEmployeeId: z.string().trim().min(1).optional(),
  fromDate: dateStringTransform,
  toDate: dateStringTransform,
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 20;
      return Math.min(Math.max(parsed, 1), 100);
    }),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
