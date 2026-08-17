import { env } from "./env";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogMeta {
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const metaString = meta && Object.keys(meta).length > 0 ? ` | Meta: ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  public info(message: string, meta?: LogMeta): void {
    console.log(this.formatMessage("INFO", message, meta));
  }

  public warn(message: string, meta?: LogMeta): void {
    console.warn(this.formatMessage("WARN", message, meta));
  }

  public error(message: string, error?: unknown, meta?: LogMeta): void {
    let errorDetails: LogMeta = { ...meta };
    if (error instanceof Error) {
      errorDetails = {
        ...errorDetails,
        errorName: error.name,
        errorMessage: error.message,
        ...(env.NODE_ENV !== "production" ? { stack: error.stack } : {}),
      };
    } else if (error !== undefined) {
      errorDetails = { ...errorDetails, rawError: String(error) };
    }

    console.error(this.formatMessage("ERROR", message, errorDetails));
  }

  public debug(message: string, meta?: LogMeta): void {
    if (env.NODE_ENV === "development") {
      console.debug(this.formatMessage("DEBUG", message, meta));
    }
  }
}

export const logger = new Logger();
