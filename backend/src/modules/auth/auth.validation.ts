import { z } from "zod";

export const loginSchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, "Email or Employee ID is required"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
  employeeId: z
    .string()
    .trim()
    .min(2, "Employee ID must be at least 2 characters long"),
  firstName: z
    .string()
    .trim()
    .min(1, "First name cannot be empty"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name cannot be empty"),
  phone: z.string().trim().optional(),
  dateOfJoining: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  employmentType: z
    .enum(["PERMANENT", "CONTRACT", "INTERN"])
    .default("PERMANENT"),
  departmentId: z
    .string()
    .min(1, "Department ID is required"),
  designationId: z
    .string()
    .min(1, "Designation ID is required"),
  branchId: z
    .string()
    .min(1, "Branch ID is required"),
  roleId: z
    .string()
    .min(1, "Role ID is required"),
  reportingManagerId: z.string().optional().nullable(),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
export type RegisterSchemaType = z.infer<typeof registerSchema>;
