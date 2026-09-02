import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import routes from "./routes";
import { RESPONSE_MESSAGES } from "./utils/constants";

/**
 * Express application configuration and middleware registration.
 */
const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
);

// Logging middleware
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Body and cookie parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

/**
 * Health check endpoint.
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: RESPONSE_MESSAGES.HEALTH_CHECK,
  });
});

// Central API routing
app.use("/api", routes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global centralized error handler
app.use(errorHandler);

export default app;
