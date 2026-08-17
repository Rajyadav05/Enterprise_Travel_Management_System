import type { Server } from "http";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { disconnectPrisma, prisma } from "./config/prisma";

let server: Server;

/**
 * Starts the HTTP server and establishes database connection.
 */
const startServer = async (): Promise<void> => {
  try {
    // Verify database connectivity
    await prisma.$connect();
    logger.info(" Database connection established successfully via Prisma.");

    server = app.listen(env.PORT, () => {
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info("  Enterprise Travel Management System (ETMS) API");
      logger.info(`  Environment : ${env.NODE_ENV}`);
      logger.info(`  Server Port : ${env.PORT}`);
      logger.info(`  Local URL   : http://localhost:${env.PORT}`);
      logger.info(`  Health Check: http://localhost:${env.PORT}/`);
      logger.info(`  Auth API    : http://localhost:${env.PORT}/api/auth`);
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  } catch (error) {
    logger.error("Failed to start ETMS server:", error);
    await disconnectPrisma();
    process.exit(1);
  }
};

/**
 * Handles graceful shutdown of HTTP server and database connections.
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed.");
      await disconnectPrisma();
      logger.info("Database connection closed. Exiting process.");
      process.exit(0);
    });

    // Force shutdown after timeout if graceful close hangs
    setTimeout(() => {
      logger.error("Forcefully shutting down server after timeout.");
      process.exit(1);
    }, 10000);
  } else {
    await disconnectPrisma();
    process.exit(0);
  }
};

// Listen for termination signals
process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception detected:", error);
  void gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled Rejection detected:", reason);
  void gracefulShutdown("unhandledRejection");
});

// Launch server
void startServer();
