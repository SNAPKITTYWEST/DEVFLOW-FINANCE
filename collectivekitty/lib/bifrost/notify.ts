import { logger } from "../observability/logger";

export interface NotificationPayload {
  title: string;
  message: string;
  level: "info" | "warning" | "error" | "critical";
  channels: ("slack" | "email" | "in-app")[];
  metadata?: Record<string, any>;
}

/**
 * Stage 6: Notify
 * Standardized notification dispatcher for the Bifrost pipeline.
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

async function sendToSlack(title: string, message: string, level: string, metadata?: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("[Notify][Slack] SLACK_WEBHOOK_URL not configured, skipping.");
    return;
  }

  // Implementation for Slack API call would go here
  logger.debug(`[Notify][Slack] Sending: ${title}`);
}

async function sendEmail(title: string, message: string, level: string, metadata?: any) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn("[Notify][Email] SENDGRID_API_KEY not configured, skipping.");
    return;
  }

  // Implementation for SendGrid API call would go here
  logger.debug(`[Notify][Email] Sending: ${title}`);
}

async function sendInApp(title: string, message: string, level: string, metadata?: any) {
  // Logic to persist in-app notification to DB (e.g. a Notifications table)
  logger.debug(`[Notify][In-App] Sending: ${title}`);
}
