import { apiSuccessSecure, apiFailure } from "@/lib/api/response";
import { addNotification, getUserNotificationSettings } from "@/lib/supabase";
import { sendPushNotification } from "@/lib/onesignal";

export const dynamic = 'force-dynamic';

/**
 * Background worker endpoint handling QStash background jobs & Redis caching for notification processing.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, actorId: _actorId, entityType: _entityType, entityId: _entityId, data, title, message, url } = body;

    if (!userId || !type) {
      return apiFailure("Missing userId or type", 400);
    }

    // 1. Check user notification settings
    const settings = await getUserNotificationSettings(userId);

    // If user unsubscribed from all, skip
    if (settings.unsubscribe_all) {
      return apiSuccessSecure({ skipped: true, reason: "unsubscribed_all" });
    }

    // 2. Dispatch in-app notification row
    const added = await addNotification({
      user_id: userId,
      type,
      actor_name: data?.actor_name,
      actor_username: data?.actor_username,
      actor_avatar: data?.actor_avatar,
      secondary_avatar: data?.secondary_avatar,
      product_name: data?.product_name,
      product_logo: data?.product_logo,
      thread_title: data?.thread_title,
      category: data?.category,
      body_text: data?.body_text,
      reason_text: data?.reason_text,
      action_label: data?.action_label,
      action_url: url || data?.action_url,
      read: false,
      created_at: new Date().toISOString(),
    });

    // 3. Dispatch Push Notification if push setting enabled for type
    const isPushEnabled = (() => {
      if (type === "follow") return settings.new_followers_push;
      if (type === "following_activity" || type === "hunted") return settings.friend_posts_push;
      if (type === "mention") return settings.mentions_push;
      return true;
    })();

    if (isPushEnabled && (title || message)) {
      await sendPushNotification({
        userIds: [userId],
        title: title || "IndiHunt Notification",
        message: message || data?.body_text || "You have a new update on IndiHunt",
        url: url || data?.action_url,
        data,
      });
    }

    return apiSuccessSecure();
  } catch (error: any) {
    console.error("Notification process endpoint error:", error);
    return apiFailure(error?.message || "Internal server error", 500);
  }
}
