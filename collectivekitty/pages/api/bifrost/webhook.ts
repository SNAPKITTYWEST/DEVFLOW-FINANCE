import { NextApiRequest, NextApiResponse } from "next";
import { handleStripeWebhook } from "../../../connectors/stripe.connector";
import { handleOCWebhook } from "../../../connectors/opencollective.connector";
import { handleLinkedInSignal } from "../../../connectors/linkedin.connector";
import { logger } from "../../../lib/observability/logger";

/**
 * Unified webhook listener for external system integrations
 *
 * @route POST /api/bifrost/webhook
 *
 * @remarks
 * Routes incoming third-party signals to their respective connectors.
 * Each connector handles authentication, validation, and event transformation
 * before sending events into the Bifrost pipeline.
 *
 * Required headers:
 * - x-bifrost-source: string (e.g., "stripe", "opencollective", "linkedin")
 * - x-bifrost-event: string (event type from the source system)
 *
 * Supported sources:
 * - stripe: Payment and subscription events
 * - opencollective: Funding and contribution events
 * - linkedin: Professional network signals
 *
 * Response:
 * - 200: { success: true, result: any } - Webhook processed
 * - 400: { error: string } - Missing headers or unknown source
 * - 405: { error: string } - Method not allowed (only POST accepted)
 * - 500: { success: false, error: string } - Processing failed
 *
 * @example
 * ```typescript
 * // Stripe webhook
 * fetch('/api/bifrost/webhook', {
 *   method: 'POST',
 *   headers: {
 *     'x-bifrost-source': 'stripe',
 *     'x-bifrost-event': 'payment_intent.succeeded'
 *   },
 *   body: JSON.stringify(stripeEvent)
 * });
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const source = req.headers["x-bifrost-source"] as string;
  const eventType = req.headers["x-bifrost-event"] as string;

  if (!source || !eventType) {
    return res.status(400).json({ error: "Missing source or event type headers" });
  }

  try {
    let result;

    switch (source.toLowerCase()) {
      case "stripe":
        result = await handleStripeWebhook(eventType, req.body);
        break;
      case "opencollective":
        result = await handleOCWebhook(eventType, req.body);
        break;
      case "linkedin":
        result = await handleLinkedInSignal(eventType, req.body);
        break;
      default:
        logger.warn(`[Webhook] Received event from unknown source: ${source}`);
        return res.status(400).json({ error: `Unknown source: ${source}` });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    logger.error(`[Webhook] Error processing ${source} event ${eventType}`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal processing error"
    });
  }
}
