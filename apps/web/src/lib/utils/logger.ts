type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    if (this.isDevelopment) {
      console[level](`[${level.toUpperCase()}]`, message, ...args);
    }
  }

  debug(message: string, ...args: unknown[]) {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log("warn", message, ...args);
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]) {
    const errorInfo =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error;

    this.log("error", message, errorInfo, ...args);
  }
}

export const logger = new Logger();
