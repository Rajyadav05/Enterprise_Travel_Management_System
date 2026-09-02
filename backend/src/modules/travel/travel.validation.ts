import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parses a date string or Date and returns a Date set to midnight UTC.
 * Accepts "YYYY-MM-DD" and ISO datetime strings.
 */
const dateField = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    z.string().datetime({ offset: true }),
  ])
  .transform((val) => new Date(val));

// ─── Create Travel Request ─────────────────────────────────────────────────────

export const createTravelRequestSchema = z
  .object({
    origin: z
      .string()
      .trim()
      .min(1, "Origin is required")
      .max(100, "Origin must not exceed 100 characters"),

    destination: z
      .string()
      .trim()
      .min(1, "Destination is required")
      .max(100, "Destination must not exceed 100 characters"),

    departureDate: dateField,

    returnDate: dateField.optional().nullable(),

    tripType: z.enum(["ONE_WAY", "ROUND_TRIP"] as const),

    purpose: z
      .string()
      .trim()
      .min(1, "Purpose is required")
      .max(500, "Purpose must not exceed 500 characters"),

    additionalInfo: z
      .string()
      .trim()
      .max(1000, "Additional info must not exceed 1000 characters")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    // Rule: origin and destination cannot be identical
    if (data.origin.toLowerCase() === data.destination.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination"],
        message: "Destination must be different from origin",
      });
    }

    // Rule: departureDate cannot be in the past (compare date portion only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const departure = new Date(data.departureDate);
    departure.setHours(0, 0, 0, 0);
    if (departure < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departureDate"],
        message: "Departure date cannot be in the past",
      });
    }

    // Rule: ROUND_TRIP requires returnDate
    if (data.tripType === "ROUND_TRIP") {
      if (!data.returnDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["returnDate"],
          message: "Return date is required for ROUND_TRIP",
        });
      } else {
        // Rule: returnDate must be after departureDate
        const ret = new Date(data.returnDate);
        const dep = new Date(data.departureDate);
        ret.setHours(0, 0, 0, 0);
        dep.setHours(0, 0, 0, 0);
        if (ret <= dep) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["returnDate"],
            message: "Return date must be after departure date",
          });
        }
      }
    }
  });

export type CreateTravelRequestSchema = z.infer<typeof createTravelRequestSchema>;

// ─── Reject Travel Request ─────────────────────────────────────────────────────

export const rejectTravelRequestSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, "Rejection reason is required")
    .max(500, "Rejection reason must not exceed 500 characters"),
});

export type RejectTravelRequestSchema = z.infer<typeof rejectTravelRequestSchema>;

// ─── Admin List Query Filters ──────────────────────────────────────────────────

export const adminListQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "BOOKED", "REJECTED", "CANCELLED"] as const)
    .optional(),
  employeeId: z.string().optional(),
  departmentId: z.string().optional(),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "fromDate must be YYYY-MM-DD")
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "toDate must be YYYY-MM-DD")
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 20;
      return Math.min(Math.max(parsed, 1), 100); // clamp 1..100
    }),
});

export type AdminListQuerySchema = z.infer<typeof adminListQuerySchema>;
