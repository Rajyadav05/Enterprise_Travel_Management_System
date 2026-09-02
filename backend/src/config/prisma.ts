import { PrismaClient } from "@prisma/client";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Singleton instance of PrismaClient.
 * In development, reuse the client across hot reloads to avoid exhausting connection pools.
 */
export const prisma: PrismaClient =
  global.prismaGlobal ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

/**
 * Gracefully disconnect Prisma client from the database.
 */
export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error disconnecting Prisma Client:", error);
  }
};
