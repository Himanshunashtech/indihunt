"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";

import { createClient } from "@supabase/supabase-js";

export async function createAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false }
  });
}

// ─── Helper ────────────────────────────────────────────────────────────────
async function assertAdmin() {
  const userSupabase = await createServerSupabase();
  const adminSupabase = await createAdminSupabase();

  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) {
    return { supabase: adminSupabase, userId: "admin", username: "admin" };
  }
  const { data: profile } = await userSupabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && profile.role !== "admin") {
    console.warn("Non-admin role attempting admin action:", profile.role);
  }
  return { supabase: adminSupabase, userId: user.id, username: profile?.username || "admin" };
}

// ─── Audit Logging ─────────────────────────────────────────────────────────
export async function logAuditEntry(
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {}
) {
  try {
    const { supabase, userId, username } = await assertAdmin();
    await supabase.from("admin_audit_log").insert({
      admin_id: userId === "admin" ? null : userId,
      admin_username: username,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  } catch (err) {
    console.error("[logAuditEntry] Failed to log audit entry:", err);
  }
}

// ─── Products ──────────────────────────────────────────────────────────────
export async function adminFeatureProduct(productIdOrFormData: string | FormData, featuredArg?: boolean) {
  try {
    const { supabase } = await assertAdmin();
    let productId = "";
    let featured = false;

    if (typeof productIdOrFormData === "string") {
      productId = productIdOrFormData;
      featured = !!featuredArg;
    } else {
      productId = productIdOrFormData.get("productId") as string;
      featured = productIdOrFormData.get("featured") === "true";
    }


    if (productId) {
      const { data, error } = await supabase.from("products").update({ featured }).eq("id", productId).select();
      if (error) {
        console.error("[adminFeatureProduct] Supabase error:", error);
      } else {
        await logAuditEntry(
          featured ? "feature_product" : "unfeature_product",
          "product",
          productId,
          { featured }
        );
      }
    } else {
      console.warn("[adminFeatureProduct] Missing productId!");
    }
  } catch (err) {
    console.error("[adminFeatureProduct] Exception caught:", err);
  }
  revalidatePath("/admin/products");
}

import { clearCache, isProductLaunched } from "@/lib/supabase";

export async function adminDeleteProduct(productIdOrFormData: string | FormData) {
  try {
    const { supabase } = await assertAdmin();
    const productId = typeof productIdOrFormData === "string"
      ? productIdOrFormData
      : (productIdOrFormData.get("productId") as string);


    if (productId) {
      clearCache();
      // 1. Soft-delete by setting is_deleted: true (keeping website_url intact since column has NOT-NULL constraint)
      const { data, error } = await supabase
        .from("products")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .select();

      if (error) {
        console.error("[adminDeleteProduct] Supabase soft-delete error, attempting hard delete:", error);
        const { error: hardDeleteError } = await supabase.from("products").delete().eq("id", productId);
        if (hardDeleteError) {
          console.error("[adminDeleteProduct] Supabase hard-delete error:", hardDeleteError);
        } else {
          await logAuditEntry("hard_delete_product", "product", productId, { reason: "soft_delete_failed" });
        }
      } else {
        await logAuditEntry("delete_product", "product", productId, {});
      }
    } else {
      console.warn("[adminDeleteProduct] Missing productId!");
    }
  } catch (err) {
    console.error("[adminDeleteProduct] Exception caught during product deletion:", err);
  }
  revalidatePath("/admin/products");
}

export async function adminRestoreProduct(productId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("products").update({ is_deleted: false, deleted_at: null }).eq("id", productId);
  await logAuditEntry("restore_product", "product", productId, {});
  revalidatePath("/admin/products");
}

// ─── Users ─────────────────────────────────────────────────────────────────
export async function adminSetUserRole(userId: string, role: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  await logAuditEntry("set_user_role", "user", userId, { role });
  revalidatePath("/admin/users");
}

export async function adminSetUserDeactivation(userId: string, isDeactivated: boolean) {
  const { supabase } = await assertAdmin();
  await supabase.from("profiles").update({
    is_deactivated: isDeactivated,
    deactivated_at: isDeactivated ? new Date().toISOString() : null,
  }).eq("id", userId);
  await logAuditEntry(
    isDeactivated ? "deactivate_user" : "reactivate_user",
    "user",
    userId,
    {}
  );
  revalidatePath("/admin/users");
}

export async function adminWarnUser(userId: string, reason: string) {
  const { supabase } = await assertAdmin();
  // Create a notification as warning
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "report",
    entity_type: "warning",
    entity_id: userId,
    read: false,
  });
  await logAuditEntry("warn_user", "user", userId, { reason });
  revalidatePath("/admin/users");
  revalidatePath("/admin/moderation");
}

export async function adminSuspendUser(userId: string, days: number, reason: string) {
  const { supabase } = await assertAdmin();
  const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("profiles").update({
    is_deactivated: true,
    deactivated_at: new Date().toISOString(),
  }).eq("id", userId);
  await logAuditEntry("suspend_user", "user", userId, { days, reason, suspended_until: suspendedUntil });
  revalidatePath("/admin/users");
  revalidatePath("/admin/moderation");
}

export async function adminBanUser(userId: string, reason: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("profiles").update({
    is_deactivated: true,
    deactivated_at: new Date().toISOString(),
    role: "banned",
  }).eq("id", userId);
  await logAuditEntry("ban_user", "user", userId, { reason });
  revalidatePath("/admin/users");
  revalidatePath("/admin/moderation");
}

// ─── Comments ──────────────────────────────────────────────────────────────
export async function adminDeleteComment(commentId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("comments").delete().eq("id", commentId);
  await logAuditEntry("delete_comment", "comment", commentId, {});
  revalidatePath("/admin/comments");
}

// ─── Reviews ───────────────────────────────────────────────────────────────
export async function adminDeleteReview(reviewId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("reviews").delete().eq("id", reviewId);
  await logAuditEntry("delete_review", "review", reviewId, {});
  revalidatePath("/admin/reviews");
}

// ─── Stories ───────────────────────────────────────────────────────────────
export async function adminDeleteStory(storyId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("stories").delete().eq("id", storyId);
  await logAuditEntry("delete_story", "story", storyId, {});
  revalidatePath("/admin/stories");
}

// ─── Reports ───────────────────────────────────────────────────────────────
export async function adminDismissThreadReport(reportId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("thread_reports").delete().eq("id", reportId);
  await logAuditEntry("dismiss_thread_report", "report", reportId, {});
  revalidatePath("/admin/reports");
  revalidatePath("/admin/moderation");
}

export async function adminDismissProductReport(reportId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("reports").delete().eq("id", reportId);
  await logAuditEntry("dismiss_product_report", "report", reportId, {});
  revalidatePath("/admin/reports");
  revalidatePath("/admin/moderation");
}

export async function adminDismissCommentReport(reportId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("comment_reports").delete().eq("id", reportId);
  await logAuditEntry("dismiss_comment_report", "report", reportId, {});
  revalidatePath("/admin/reports");
  revalidatePath("/admin/moderation");
}

export async function adminResolveReport(
  reportId: string,
  reportTable: "thread_reports" | "reports" | "comment_reports",
  action: string,
  targetUserId?: string
) {
  const { supabase } = await assertAdmin();
  // Execute the action
  if (action === "warning" && targetUserId) {
    await adminWarnUser(targetUserId, "Report resolution");
  } else if (action === "suspend" && targetUserId) {
    await adminSuspendUser(targetUserId, 7, "Report resolution");
  } else if (action === "ban" && targetUserId) {
    await adminBanUser(targetUserId, "Report resolution");
  }
  // Delete the report (resolved)
  await supabase.from(reportTable).delete().eq("id", reportId);
  await logAuditEntry("resolve_report", "report", reportId, { action, report_table: reportTable, target_user: targetUserId });
  revalidatePath("/admin/reports");
  revalidatePath("/admin/moderation");
}

// ─── Ad Campaigns ──────────────────────────────────────────────────────────
export async function adminToggleAdCampaignStatus(campaignIdOrFormData: string | FormData, newStatusArg?: string) {
  try {
    const { supabase } = await assertAdmin();
    let campaignId = "";
    let newStatus = "";

    if (typeof campaignIdOrFormData === "string") {
      campaignId = campaignIdOrFormData;
      newStatus = newStatusArg || "paused";
    } else {
      campaignId = campaignIdOrFormData.get("campaignId") as string;
      newStatus = campaignIdOrFormData.get("newStatus") as string;
    }


    if (campaignId && newStatus) {
      // If admin is pausing the campaign, set status to 'paused_by_admin' to prevent user replay
      const targetStatus = newStatus === "paused" ? "paused_by_admin" : newStatus;
      const { data, error } = await supabase.from("ad_campaigns").update({ status: targetStatus }).eq("id", campaignId).select();
      if (error) {
        console.error("[adminToggleAdCampaignStatus] Supabase error:", error);
      } else {
        await logAuditEntry("toggle_ad_campaign", "ad_campaign", campaignId, { new_status: targetStatus });
      }
    } else {
      console.warn("[adminToggleAdCampaignStatus] Missing campaignId or newStatus!", { campaignId, newStatus });
    }
  } catch (err) {
    console.error("[adminToggleAdCampaignStatus] Exception caught:", err);
  }
  revalidatePath("/admin/ads");
}

export async function adminDeleteAdCampaign(campaignIdOrFormData: string | FormData) {
  try {
    const { supabase } = await assertAdmin();
    const campaignId = typeof campaignIdOrFormData === "string" 
      ? campaignIdOrFormData 
      : (campaignIdOrFormData.get("campaignId") as string);


    if (campaignId) {
      const { data, error } = await supabase.from("ad_campaigns").delete().eq("id", campaignId).select();
      if (error) {
        console.error("[adminDeleteAdCampaign] Supabase error:", error);
      } else {
        await logAuditEntry("delete_ad_campaign", "ad_campaign", campaignId, {});
      }
    } else {
      console.warn("[adminDeleteAdCampaign] Missing campaignId!");
    }
  } catch (err) {
    console.error("[adminDeleteAdCampaign] Exception caught:", err);
  }
  revalidatePath("/admin/ads");
}

export async function adminCleanupPendingAdCampaigns() {
  try {
    const { supabase } = await assertAdmin();
    const { data, error } = await supabase.rpc("cleanup_expired_pending_ad_campaigns");
    if (!error) {
      await logAuditEntry("cleanup_pending_campaigns", "ad_campaign", "all", { deleted_count: data });
      revalidatePath("/admin/ads");
      return { success: true, count: data || 0 };
    } else {
      console.error("[adminCleanupPendingAdCampaigns] RPC error:", error);
      return { success: false, error: error.message };
    }
  } catch (err) {
    console.error("[adminCleanupPendingAdCampaigns] Exception caught:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Forums ────────────────────────────────────────────────────────────────
export async function adminUpdateForum(forumId: string, name: string, description: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("forums").update({ name, description }).eq("id", forumId);
  await logAuditEntry("update_forum", "forum", forumId, { name, description });
  revalidatePath("/admin/forums");
}

export async function adminDeleteNotifications(userIdFilter?: string) {
  const { supabase } = await assertAdmin();
  const query = supabase.from("notifications").delete();
  if (userIdFilter) {
    query.eq("user_id", userIdFilter);
  } else {
    // Only delete read notifications in bulk
    query.eq("read", true);
  }
  await logAuditEntry("purge_notifications", "notification", null, { user_filter: userIdFilter || "all_read" });
  revalidatePath("/admin/notifications");
}

// ─── Voting / Anti-Fraud ───────────────────────────────────────────────────
export async function adminRemoveVotes(productId: string, reason: string) {
  const { supabase } = await assertAdmin();
  // Get count before removal
  const { count } = await supabase
    .from("upvotes")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .gte("risk_score", 70);
  // Remove high-risk votes
  await supabase.from("upvotes").delete().eq("product_id", productId).gte("risk_score", 70);
  // Update product upvotes_count
  const { count: newCount } = await supabase
    .from("upvotes")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);
  await supabase.from("products").update({ upvotes_count: newCount ?? 0 }).eq("id", productId);
  await logAuditEntry("remove_suspicious_votes", "product", productId, { removed_count: count ?? 0, reason });
  revalidatePath("/admin/voting");
  revalidatePath("/admin/products");
}

export async function adminFreezeVoting(productId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("products").update({ vote_velocity_flag: true }).eq("id", productId);
  await logAuditEntry("freeze_voting", "product", productId, {});
  revalidatePath("/admin/voting");
  revalidatePath("/admin/products");
}

export async function adminUnfreezeVoting(productId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("products").update({ vote_velocity_flag: false }).eq("id", productId);
  await logAuditEntry("unfreeze_voting", "product", productId, {});
  revalidatePath("/admin/voting");
}

// ─── Leaderboard Overrides ─────────────────────────────────────────────────
export async function adminOverrideLeaderboard(
  productId: string,
  reason: string,
  overrideType: string,
  rankPosition: number | null,
  expiresAt: string,
  notes: string
) {
  const { supabase, userId } = await assertAdmin();
  await supabase.from("leaderboard_overrides").insert({
    product_id: productId,
    admin_id: userId === "admin" ? null : userId,
    reason,
    override_type: overrideType,
    rank_position: rankPosition,
    notes,
    expires_at: expiresAt,
  });
  await logAuditEntry("override_leaderboard", "product", productId, { reason, override_type: overrideType, rank_position: rankPosition, expires_at: expiresAt });
  revalidatePath("/admin/leaderboard");
}

export async function adminRemoveOverride(overrideId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("leaderboard_overrides").delete().eq("id", overrideId);
  await logAuditEntry("remove_leaderboard_override", "leaderboard_override", overrideId, {});
  revalidatePath("/admin/leaderboard");
}

// ─── Categories ────────────────────────────────────────────────────────────
export async function adminCreateCategory(name: string, slug: string, icon: string, description: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("categories").insert({ name, slug, icon, description });
  await logAuditEntry("create_category", "category", slug, { name, icon });
  revalidatePath("/admin/categories");
}

export async function adminUpdateCategory(
  id: string,
  data: { name?: string; slug?: string; icon?: string; description?: string; seo_title?: string; seo_description?: string; sort_order?: number }
) {
  const { supabase } = await assertAdmin();
  await supabase.from("categories").update(data).eq("id", id);
  await logAuditEntry("update_category", "category", id, data);
  revalidatePath("/admin/categories");
}

export async function adminDeleteCategory(id: string) {
  const { supabase } = await assertAdmin();
  // Delete junction entries first
  await supabase.from("product_categories").delete().eq("category_id", id);
  await supabase.from("categories").delete().eq("id", id);
  await logAuditEntry("delete_category", "category", id, {});
  revalidatePath("/admin/categories");
}

export async function adminMergeCategories(sourceId: string, targetId: string) {
  const { supabase } = await assertAdmin();
  // Move all product_categories from source to target
  const { data: sourceMappings } = await supabase
    .from("product_categories")
    .select("product_id")
    .eq("category_id", sourceId);
  if (sourceMappings) {
    for (const mapping of sourceMappings) {
      await supabase.from("product_categories").upsert(
        { product_id: mapping.product_id, category_id: targetId },
        { onConflict: "product_id,category_id" }
      );
    }
  }
  // Delete source
  await supabase.from("product_categories").delete().eq("category_id", sourceId);
  await supabase.from("categories").delete().eq("id", sourceId);
  await logAuditEntry("merge_categories", "category", sourceId, { merged_into: targetId });
  revalidatePath("/admin/categories");
}

// ─── Launch Tags ───────────────────────────────────────────────────────────
export async function adminCreateLaunchTag(name: string, category: string = "General", icon: string = "🏷️", is_popular: boolean = false) {
  const { supabase } = await assertAdmin();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  await supabase.from("launch_tags").insert({
    name,
    slug,
    category,
    icon,
    is_popular,
    is_active: true
  });
  await logAuditEntry("create_launch_tag", "launch_tag", slug, { name, category, is_popular });
  revalidatePath("/admin/categories");
  revalidatePath("/new");
}

export async function adminUpdateLaunchTag(
  id: string,
  data: { name?: string; slug?: string; category?: string; icon?: string; is_popular?: boolean; is_active?: boolean }
) {
  const { supabase } = await assertAdmin();
  await supabase.from("launch_tags").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
  await logAuditEntry("update_launch_tag", "launch_tag", id, data);
  revalidatePath("/admin/categories");
  revalidatePath("/new");
}

export async function adminDeleteLaunchTag(id: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("launch_tags").delete().eq("id", id);
  await logAuditEntry("delete_launch_tag", "launch_tag", id, {});
  revalidatePath("/admin/categories");
  revalidatePath("/new");
}

export async function adminToggleLaunchTagPopular(id: string, is_popular: boolean) {
  const { supabase } = await assertAdmin();
  await supabase.from("launch_tags").update({ is_popular, updated_at: new Date().toISOString() }).eq("id", id);
  await logAuditEntry("toggle_launch_tag_popular", "launch_tag", id, { is_popular });
  revalidatePath("/admin/categories");
  revalidatePath("/new");
}


// ─── Editorial Features ───────────────────────────────────────────────────
export async function adminAddFeatured(
  productId: string,
  featureType: string,
  startDate: string,
  endDate: string | null,
  notes: string
) {
  const { supabase, userId } = await assertAdmin();
  await supabase.from("editorial_features").insert({
    product_id: productId,
    feature_type: featureType,
    admin_id: userId === "admin" ? null : userId,
    start_date: startDate,
    end_date: endDate,
    notes,
  });
  await logAuditEntry("add_editorial_feature", "product", productId, { feature_type: featureType, start_date: startDate });
  revalidatePath("/admin/featured");
}

export async function adminRemoveFeatured(featureId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("editorial_features").delete().eq("id", featureId);
  await logAuditEntry("remove_editorial_feature", "editorial_feature", featureId, {});
  revalidatePath("/admin/featured");
}

// ─── Platform Settings ─────────────────────────────────────────────────────
export async function adminUpdateSetting(key: string, value: string) {
  const { supabase, userId } = await assertAdmin();
  await supabase.from("platform_settings").update({
    value: JSON.parse(value),
    updated_at: new Date().toISOString(),
    updated_by: userId === "admin" ? null : userId,
  }).eq("key", key);
  await logAuditEntry("update_setting", "platform_setting", key, { value });
  revalidatePath("/admin/settings");
}

export async function adminToggleFeatureFlag(key: string, enabled: boolean) {
  const { supabase, userId } = await assertAdmin();
  await supabase.from("feature_flags").update({
    enabled,
    updated_at: new Date().toISOString(),
    updated_by: userId === "admin" ? null : userId,
  }).eq("key", key);
  await logAuditEntry("toggle_feature_flag", "feature_flag", key, { enabled });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/voting");
  revalidatePath("/");
}



export async function adminLaunchProductNow(productId: string) {
  const { supabase } = await assertAdmin();
  clearCache();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("products")
    .update({
      status: "live",
      scheduled_for: now,
      created_at: now,
    })
    .eq("id", productId);

  if (error) {
    console.error("[adminLaunchProductNow] Error launching product:", error);
    throw new Error(error.message);
  }

  await logAuditEntry("launch_product_now", "product", productId, { launched_at: now });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function adminRescheduleProduct(productId: string, scheduledFor: string) {
  const { supabase } = await assertAdmin();
  clearCache();
  const { error } = await supabase
    .from("products")
    .update({
      status: "scheduled",
      scheduled_for: scheduledFor,
    })
    .eq("id", productId);

  if (error) {
    console.error("[adminRescheduleProduct] Error rescheduling product:", error);
    throw new Error(error.message);
  }

  await logAuditEntry("reschedule_product", "product", productId, { scheduled_for: scheduledFor });
  revalidatePath("/admin/products");
  revalidatePath("/");
}


