import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().min(1, "JWT_EXPIRES_IN is required").default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1, "REFRESH_TOKEN_EXPIRES_IN is required").default("7d"),
  JWT_REFRESH_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("*"),
  SMTP_HOST: z
    .preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  SMTP_PORT: z
    .preprocess(
      (val) => (val === "" || val === undefined ? undefined : val),
      z.coerce.number().int().positive().optional()
    )
    .default(587),
  SMTP_USER: z
    .preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  SMTP_PASS: z
    .preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  SMTP_FROM: z
    .preprocess((val) => (val === "" ? undefined : val), z.string().optional())
    .default("ETMS <no-reply@etms.local>"),
  ADMIN_EMAIL: z
    .preprocess((val) => (val === "" ? undefined : val), z.string().optional())
    .default("admin@etms.local"),
}).refine(
  (data) => {
    if (data.NODE_ENV === "production" && data.CORS_ORIGIN === "*") {
      return false;
    }
    return true;
  },
  {
    message: "Wildcard CORS_ORIGIN ('*') is not permitted in production mode with credentials enabled. Specify explicit origin(s).",
    path: ["CORS_ORIGIN"],
  }
);

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment validation error:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error("Invalid application environment configuration. Please check your .env file.");
  }

  return result.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;
