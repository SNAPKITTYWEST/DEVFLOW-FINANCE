import { createBifrostEvent } from "../lib/contracts/factory";
import { runPipeline } from "../lib/bifrost/pipeline";
import { logger } from "../lib/observability/logger";
import { EventType, EventId, unwrapId } from "../lib/types/branded";

/**
 * Base class for all external connectors
 *
 * @remarks
 * Standardizes how events are ingested from third-party APIs into the Bifrost pipeline.
 * All connectors (Stripe, OpenCollective, LinkedIn, CRM) extend this base class.
 *
 * Pattern:
 * 1. Connector receives webhook or manual sync trigger
 * 2. Transforms external data to Bifrost standard
 * 3. Calls emit() to send through pipeline
 * 4. Returns result with eventId and trace
 *
 * @example
 * ```typescript
 * class StripeConnector extends BaseConnector {
 *   constructor() {
 *     super("stripe");
 *   }
 *
 *   async handleSignal(type: string, data: unknown) {
 *     return this.emit("payment.received", data as Record<string, unknown>);
 *   }
 * }
 * ```
 */
export abstract class BaseConnector {
  constructor(protected name: string) {}

  /**
   * Processes an incoming event and routes it through the Bifrost pipeline
   *
   * @param type - The event type (must be a valid EventType)
   * @param payload - Event-specific data
   * @returns Result object with success status, eventId, and trace
   *
   * @remarks
   * This method:
   * 1. Creates a standardized BifrostEvent
   * 2. Runs it through the 7-stage pipeline
   * 3. Returns success with eventId and trace, or error with message
   *
   * Errors are caught and logged but not thrown - connectors should
   * always return a result object indicating success or failure.
   *
   * @example
   * ```typescript
   * const result = await this.emit("deal.created", { dealId: "123" });
   * if (result.success) {
   *   console.log(`Event ${unwrapId(result.eventId)} processed`);
   * }
   * ```
   */
  protected async emit(type: EventType, payload: Record<string, unknown>) {
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
   * Abstract method for handling webhooks or manual syncs
   *
   * @param type - The signal type from the external system
   * @param data - The signal payload
   * @returns Result of processing the signal
   *
   * @remarks
   * Each connector must implement this method to:
   * 1. Validate the incoming signal
   * 2. Transform external data format to Bifrost standard
   * 3. Call emit() with the appropriate EventType
   * 4. Return the result
   *
   * @example
   * ```typescript
   * async handleSignal(type: string, data: unknown) {
   *   if (type === "payment_intent.succeeded") {
   *     return this.emit("payment.received", data as Record<string, unknown>);
   *   }
   *   return { status: "ignored" };
   * }
   * ```
   */
  abstract handleSignal(type: string, data: unknown): Promise<unknown>;
}
