import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rateLimit.middleware";
import routes from "./routes";
import { RESPONSE_MESSAGES } from "./utils/constants";

/**
 * Express application configuration and middleware registration.
 */
const app: Application = express();

// Trust reverse proxy (e.g. Nginx, AWS ALB) for accurate IP rate limiting in production
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security headers middleware
app.use(helmet());

// Hardened CORS policy
const allowedOrigins =
  env.CORS_ORIGIN === "*"
    ? "*"
    : env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, internal calls)
      if (!origin) return callback(null, true);

      if (allowedOrigins === "*") {
        if (env.NODE_ENV === "production") {
          return callback(
            new Error("Wildcard CORS origin is not permitted in production mode.")
          );
        }
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin ${origin} is not permitted by CORS policy.`)
      );
    },
    credentials: true,
  })
);

// Logging middleware
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Body and cookie parsing middleware with hardened payload size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

/**
 * Health check endpoint with database connectivity probe.
 */
const healthCheckHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Lightweight database ping
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      status: "healthy",
      database: "connected",
      message: RESPONSE_MESSAGES.HEALTH_CHECK,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: "disconnected",
      message: "Database connectivity check failed.",
      timestamp: new Date().toISOString(),
    });
  }
};

app.get("/", healthCheckHandler);
app.get("/health", healthCheckHandler);

// Apply global API rate limiter to all `/api` endpoints
app.use("/api", apiLimiter);

// Central API routing
app.use("/api", routes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global centralized error handler
app.use(errorHandler);

export default app;

