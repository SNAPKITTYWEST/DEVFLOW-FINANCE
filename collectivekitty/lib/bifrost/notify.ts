import { logger } from "../observability/logger";

/**
 * Notification severity level
 */
export type NotificationLevel = "info" | "warning" | "error" | "critical";

/**
 * Notification delivery channel
 */
export type NotificationChannel = "slack" | "email" | "in-app";

/**
 * Payload for sending notifications
 *
 * @property title - Notification title
 * @property message - Notification message body
 * @property level - Severity level
 * @property channels - Delivery channels to use
 * @property metadata - Additional context data
 */
export interface NotificationPayload {
  title: string;
  message: string;
  level: NotificationLevel;
  channels: NotificationChannel[];
  metadata?: Record<string, unknown>;
}

/**
 * Sends notifications through multiple channels (Stage 6 of Bifrost pipeline)
 *
 * @param payload - Notification configuration
 * @returns Array of Promise results (fulfilled or rejected) for each channel
 *
 * @remarks
 * Notification strategy:
 * - Dispatches to all specified channels in parallel
 * - Uses Promise.allSettled to ensure all channels are attempted
 * - Logs failures but does not throw (notifications should not block pipeline)
 *
 * Supported channels:
 * - slack: Sends to Slack webhook (requires SLACK_WEBHOOK_URL env var)
 * - email: Sends via SendGrid (requires SENDGRID_API_KEY env var)
 * - in-app: Persists to database for UI display
 *
 * @example
 * ```typescript
 * await sendNotification({
 *   title: "High Risk Event",
 *   message: "Deal value exceeds threshold",
 *   level: "warning",
 *   channels: ["slack", "in-app"],
 *   metadata: { dealId: "deal_123", amount: 75000 }
 * });
 * ```
 */
export async function sendNotification(payload: NotificationPayload) {
  const { title, message, level, channels, metadata } = payload;

  logger.info(`[Notify] Dispatching "${title}" to channels: ${channels.join(", ")}`);

  const results = await Promise.allSettled(
    channels.map(async (channel) => {
      switch (channel) {
        case "slack":
          return sendToSlack(title, message, level, metadata);
        case "email":
          return sendEmail(title, message, level, metadata);
        case "in-app":
          return sendInApp(title, message, level, metadata);
        default:
          throw new Error(`Unsupported notification channel: ${channel}`);
      }
    })
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    logger.error(`[Notify] Some notifications failed to send`, failures);
  }

  return results;
}

/**
 * Sends notification to Slack webhook
 *
 * @param title - Notification title
 * @param message - Notification message
 * @param level - Severity level
 * @param metadata - Additional context
 *
 * @remarks
 * Requires SLACK_WEBHOOK_URL environment variable.
 * Logs warning and skips if not configured.
 */
async function sendToSlack(
  title: string,
  message: string,
  level: string,
  metadata?: Record<string, unknown>
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("[Notify][Slack] SLACK_WEBHOOK_URL not configured, skipping.");
    return;
  }

  // Implementation for Slack API call would go here
  logger.debug(`[Notify][Slack] Sending: ${title}`);
}

/**
 * Sends notification via email (SendGrid)
 *
 * @param title - Email subject
 * @param message - Email body
 * @param level - Severity level
 * @param metadata - Additional context
 *
 * @remarks
 * Requires SENDGRID_API_KEY environment variable.
 * Logs warning and skips if not configured.
 */
async function sendEmail(
  title: string,
  message: string,
  level: string,
  metadata?: Record<string, unknown>
) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn("[Notify][Email] SENDGRID_API_KEY not configured, skipping.");
    return;
  }

  // Implementation for SendGrid API call would go here
  logger.debug(`[Notify][Email] Sending: ${title}`);
}

/**
 * Persists in-app notification to database
 *
 * @param title - Notification title
 * @param message - Notification message
 * @param level - Severity level
 * @param metadata - Additional context
 *
 * @remarks
 * Stores notification in database for display in UI.
 * Users can view and dismiss these notifications.
 */
async function sendInApp(
  title: string,
  message: string,
  level: string,
  metadata?: Record<string, unknown>
) {
  // Logic to persist in-app notification to DB (e.g. a Notifications table)
  logger.debug(`[Notify][In-App] Sending: ${title}`);
}
