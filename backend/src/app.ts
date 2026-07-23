import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

/**
 * Express application instance.
 * Middleware and routes are registered here.
 */
const app: Application = express();

// Security and request parsing middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check endpoint — confirms the API is running.
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    application: "Enterprise Travel Management System",
    version: "1.0.0",
    status: "Running",
  });
});

export default app;
