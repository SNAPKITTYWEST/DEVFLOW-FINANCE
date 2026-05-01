import { createBifrostEvent } from "../lib/contracts/factory";
import { runPipeline } from "../lib/bifrost/pipeline";
import { logger } from "../lib/observability/logger";

/**
 * Base class for all external connectors.
 * Standardizes how events are ingested from third-party APIs.
 */
export abstract class BaseConnector {
  constructor(protected name: string) {}

  /**
   * Process an incoming raw event and route it through the pipeline.
   */
  protected async emit(type: string, payload: Record<string, unknown>) {
    logger.info(`[Connector:${this.name}] Emitting event: ${type}`);

    const event = createBifrostEvent(type, this.name, payload);

    try {
      const result = await runPipeline(event);
      return {
        success: true,
        eventId: result.eventId,
        trace: result.trace
      };
    } catch (error) {
      logger.error(`[Connector:${this.name}] Failed to emit event: ${type}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Abstract method for handling webhooks or manual syncs.
   */
  abstract handleSignal(type: string, data: unknown): Promise<unknown>;
}
