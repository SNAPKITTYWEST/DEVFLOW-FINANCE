/**
 * Sovereign OS Observability - Logger
 */

export const logger = {
  info: (message: string, context?: unknown) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(context) : "");
  },
  warn: (message: string, context?: unknown) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(context) : "");
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  debug: (message: string, context?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context ? JSON.stringify(context) : "");
    }
  },
  event: (traceId: string, stage: string, status: "ok" | "error" | "flagged", metadata?: unknown) => {
    console.log(`[BIFROST] [${traceId}] Stage: ${stage} | Status: ${status}`, metadata ? JSON.stringify(metadata) : "");
  }
};
