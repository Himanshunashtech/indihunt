import { Client } from "@upstash/qstash";

// Initialize Upstash QStash client
// Make sure to add QSTASH_TOKEN to your environment variables (.env.local)
export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

/**
 * Publishes a task or webhook event payload to a background worker URL via QStash
 */
export async function publishBackgroundTask(
  destinationUrl: string,
  payload: Record<string, any>,
  options?: {
    delaySeconds?: number;
    retries?: number;
  }
) {
  try {
    if (!process.env.QSTASH_TOKEN) {
      console.warn("QStash token is missing. Task was not queued.");
      return null;
    }

    const response = await qstashClient.publishJSON({
      url: destinationUrl,
      body: payload,
      delay: options?.delaySeconds,
      retries: options?.retries,
    });

    return response;
  } catch (error) {
    console.error(`QStash publish error to ${destinationUrl}:`, error);
    return null;
  }
}
