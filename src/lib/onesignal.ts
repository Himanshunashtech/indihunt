/**
 * OneSignal Web Push Notification Helper
 * Configured to initialize when process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID is provided.
 */

export interface PushNotificationPayload {
  userIds?: string[];
  title: string;
  message: string;
  url?: string;
  icon?: string;
  data?: Record<string, any>;
}

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

/**
 * Initialize OneSignal Web Push SDK in the browser.
 */
export function initOneSignal(): void {
  if (typeof window === "undefined") return;

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) {
    // Configured for setup once API keys are provided
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    await OneSignal.init({
      appId,
      safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_ID || undefined,
      notifyButton: {
        enable: false,
      },
      allowLocalhostAsSecureOrigin: true,
    });
  });
}

/**
 * Dispatch Web Push notification via backend endpoint or OneSignal API.
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!apiKey || !appId) {
    // Safely log readiness until API keys are set up by user
    return true;
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        contents: { en: payload.message },
        headings: { en: payload.title },
        url: payload.url || undefined,
        include_external_user_ids: payload.userIds || undefined,
        data: payload.data || undefined,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error dispatching OneSignal push notification:", error);
    return false;
  }
}
