import { z } from "zod";

const dateStringTransform = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional()
  .transform((val) => (val ? new Date(val) : undefined));

// ─── Monthly Analytics Query ──────────────────────────────────────────────────

export const monthlyAnalyticsQuerySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, "Year must be a 4-digit number (e.g. 2026)")
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : new Date().getFullYear())),
});

export type MonthlyAnalyticsQuery = z.infer<typeof monthlyAnalyticsQuerySchema>;

// ─── Travel Requests Report Query ─────────────────────────────────────────────

export const travelRequestReportQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "BOOKED", "REJECTED", "CANCELLED"] as const)
    .optional(),
  departmentId: z.string().trim().min(1).optional(),
  employeeId: z.string().trim().min(1).optional(),
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

export type TravelRequestReportQuery = z.infer<
  typeof travelRequestReportQuerySchema
>;

// ─── Bookings Report Query ────────────────────────────────────────────────────

export const bookingReportQuerySchema = z.object({
  vendor: z
    .enum([
      "MAKEMYTRIP",
      "CLEARTRIP",
      "AIRLINE_WEBSITE",
      "TRAVEL_AGENT",
      "CORPORATE_TRAVEL_AGENT",
      "KNOWN_PERSON",
      "OTHER",
    ] as const)
    .optional(),
  departmentId: z.string().trim().min(1).optional(),
  employeeId: z.string().trim().min(1).optional(),
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

export type BookingReportQuery = z.infer<typeof bookingReportQuerySchema>;

// ─── Export Query Schemas (Filters without pagination) ─────────────────────────

export const travelRequestExportQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "BOOKED", "REJECTED", "CANCELLED"] as const)
    .optional(),
  departmentId: z.string().trim().min(1).optional(),
  employeeId: z.string().trim().min(1).optional(),
  fromDate: dateStringTransform,
  toDate: dateStringTransform,
});

export type TravelRequestExportQuery = z.infer<
  typeof travelRequestExportQuerySchema
>;

export const bookingExportQuerySchema = z.object({
  vendor: z
    .enum([
      "MAKEMYTRIP",
      "CLEARTRIP",
      "AIRLINE_WEBSITE",
      "TRAVEL_AGENT",
      "CORPORATE_TRAVEL_AGENT",
      "KNOWN_PERSON",
      "OTHER",
    ] as const)
    .optional(),
  departmentId: z.string().trim().min(1).optional(),
  employeeId: z.string().trim().min(1).optional(),
  fromDate: dateStringTransform,
  toDate: dateStringTransform,
});

export type BookingExportQuery = z.infer<typeof bookingExportQuerySchema>;
