import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiSuccessSecure, apiFailure } from "@/lib/api/response";
import { evaluateFeaturing } from "@/lib/supabase";
import { bumpFeedVersion } from "@/lib/cache";
import { invalidateCachePattern } from "@/lib/redis";
import { broadcastLiveEvent } from "@/lib/sseBroadcaster";

export const dynamic = "force-dynamic";

/**
 * Pillar 1: The 12:01 AM Launch Drop (Scheduled Batch Ingestion)
 *
 * Runs daily at 00:01 IST (Pacific / UTC adjusted) to:
 * 1. Identify all products scheduled for the incoming daily partition (scheduled_for <= now).
 * 2. Transition status from 'scheduled' -> 'live' in batch.
 * 3. Evaluate staff-curated featuring (quality_score >= 60 -> featured = true),
 *    separating Featured launches from Community feed.
 * 4. Invalidate feed caches and broadcast live SSE drop event.
 */
export async function POST(request: NextRequest) {
  const start = performance.now();

  try {
    let supabase: any;
    try {
      supabase = createAdminSupabaseClient();
    } catch {
      supabase = await createServerSupabaseClient();
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Fetch scheduled products eligible for launch
    const { data: scheduledProds, error: fetchErr } = await supabase
      .from("products")
      .select("id, name, tagline, website_url, logo_url, screenshots, status, scheduled_for, maker_id, upvotes_count, comments_count, quality_score, featured, editor_pick, never_feature, maker:profiles!maker_id(id, username, is_verified, karma_points)")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .limit(600);

    if (fetchErr) {
      return apiFailure(fetchErr.message, 500);
    }

    if (!scheduledProds || scheduledProds.length === 0) {
      return apiSuccessSecure({
        success: true,
        message: "No scheduled launches to drop at this time.",
        droppedCount: 0,
        featuredCount: 0,
        durationMs: Math.round(performance.now() - start),
      });
    }

    // 2. Separate Featured vs Community based on quality thresholds
    const featuredIds: string[] = [];
    const communityIds: string[] = [];

    for (const prod of scheduledProds) {
      const evaluation = evaluateFeaturing(prod, prod.maker, prod.comments_count || 0);
      if (evaluation.featured) {
        featuredIds.push(prod.id);
      } else {
        communityIds.push(prod.id);
      }
    }

    // 3. Batch update status to 'live' and assign featured flags in parallel
    const updatePromises: Promise<any>[] = [];

    if (featuredIds.length > 0) {
      updatePromises.push(
        supabase
          .from("products")
          .update({
            status: "live",
            featured: true,
            featured_at: nowIso,
          })
          .in("id", featuredIds)
      );
    }

    if (communityIds.length > 0) {
      updatePromises.push(
        supabase
          .from("products")
          .update({
            status: "live",
            featured: false,
          })
          .in("id", communityIds)
      );
    }

    await Promise.all(updatePromises);

    // 4. Invalidate Redis feed caches and bump global version
    await Promise.allSettled([
      bumpFeedVersion(),
      invalidateCachePattern("feed_"),
      invalidateCachePattern("redis_products_"),
      invalidateCachePattern("public_products"),
    ]);

    // 5. Broadcast real-time SSE drop event across all active browser tabs
    broadcastLiveEvent({
      type: "launch_drop",
      data: {
        droppedCount: scheduledProds.length,
        featuredCount: featuredIds.length,
        communityCount: communityIds.length,
        dropTimestamp: nowIso,
      },
    });

    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    return apiSuccessSecure({
      success: true,
      message: `Successfully dropped ${scheduledProds.length} launches at 00:01!`,
      droppedCount: scheduledProds.length,
      featuredCount: featuredIds.length,
      communityCount: communityIds.length,
      durationMs,
      throughputPerSecond: Math.round((scheduledProds.length / (durationMs / 1000))),
    });
  } catch (error: any) {
    return apiFailure(error?.message || "Launch drop batch ingestion failed", 500);
  }
}

// Allow GET for health checks / manual cron triggers
export async function GET(request: NextRequest) {
  return POST(request);
}
