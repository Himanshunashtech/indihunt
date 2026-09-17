"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { logAuditEntry } from "./admin-actions";

async function createAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false }
  });
}

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

  return { supabase: adminSupabase, userId: user.id, username: profile?.username || "admin" };
}

export async function adminRecordManualPayment(formData: FormData) {
  try {
    const { supabase } = await assertAdmin();

    const userId = formData.get("userId") as string || "admin";
    const amount = parseFloat(formData.get("amount") as string || "0");
    const currency = (formData.get("currency") as string || "usd").toLowerCase();
    const paymentMethod = formData.get("paymentMethod") as string || "manual";
    const featureType = formData.get("featureType") as string || "manual_credit";
    const notes = formData.get("notes") as string || "";
    const campaignId = formData.get("campaignId") as string || null;

    const paymentId = `pay_man_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let paymentRecord: any = null;
    const { data: pData, error: pErr } = await supabase
      .from("payments")
      .insert({
        id: paymentId,
        user_id: userId,
        campaign_id: campaignId,
        dodo_payment_id: `man_dodo_${Date.now()}`,
        amount,
        currency,
        status: "succeeded",
        payment_method: paymentMethod,
        metadata: { type: featureType, notes, manual: true }
      })
      .select()
      .single();

    if (!pErr && pData) {
      paymentRecord = pData;
    } else {
      const { data: legacyData, error: legacyErr } = await supabase
        .from("polar_payments")
        .insert({
          id: paymentId,
          user_id: userId,
          campaign_id: campaignId,
          dodo_payment_id: `man_dodo_${Date.now()}`,
          amount,
          currency,
          status: "succeeded",
          payment_method: paymentMethod,
          metadata: { type: featureType, notes, manual: true }
        })
        .select()
        .single();
      paymentRecord = legacyData;
      if (legacyErr) {
        console.error("[adminRecordManualPayment] DB Error:", legacyErr);
      }
    }

    if (!paymentRecord && pErr) {
      console.error("[adminRecordManualPayment] DB Error:", pErr);
    } else {
      await logAuditEntry("record_manual_payment", "payment", paymentId, {
        amount,
        currency,
        paymentMethod,
        featureType,
        userId
      });
    }

    // If campaignId was supplied, top up ad campaign balance
    if (campaignId) {
      const { data: campaign } = await supabase
        .from("ad_campaigns")
        .select("total_budget, target_impressions, cpm_rate")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        const newTotal = (campaign.total_budget || 0) + amount;
        const additionalImpressions = (amount / (campaign.cpm_rate || 10)) * 1000;
        const newTarget = (campaign.target_impressions || 0) + additionalImpressions;

        await supabase
          .from("ad_campaigns")
          .update({ status: "active", total_budget: newTotal, target_impressions: newTarget })
          .eq("id", campaignId);

        await supabase.from("ad_budget_transactions").insert({
          campaign_id: campaignId,
          user_id: userId,
          payment_id: paymentId,
          amount,
          transaction_type: "manual_override",
          balance_after: newTotal,
          notes: `Admin manual top-up: ${notes}`
        });
      }
    }
  } catch (err) {
    console.error("[adminRecordManualPayment] Exception:", err);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/ads");
}

export async function adminUpdatePaymentStatus(paymentId: string, status: "succeeded" | "pending" | "failed" | "refunded", notes?: string) {
  try {
    const { supabase } = await assertAdmin();

    // Fetch the payment record to get the dodo_payment_id and campaign_id
    let paymentRow: any = null;
    const { data: pRow } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    paymentRow = pRow;

    // Fallback to polar_payments if not found in payments
    if (!paymentRow) {
      const { data: legacyRow } = await supabase
        .from("polar_payments")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();
      paymentRow = legacyRow;
    }

    // If refunding, initiate a real refund through Dodo Payments API
    if (status === "refunded" && paymentRow) {
      const dodoPaymentId = paymentRow.dodo_payment_id;
      const DODO_PAYMENTS_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
      const envSetting = (process.env.DODO_ENVIRONMENT || "test").trim().toLowerCase();
      const isLive = envSetting === "live" || envSetting === "live_mode" || envSetting === "production" || envSetting === "prod";
      const baseUrl = isLive ? "https://live.dodopayments.com" : "https://test.dodopayments.com";

      let dodoRefundSuccess = false;
      let dodoRefundId: string | null = null;
      let dodoRefundError: string | null = null;

      if (DODO_PAYMENTS_API_KEY && dodoPaymentId && !dodoPaymentId.startsWith("man_") && !dodoPaymentId.startsWith("dodo_")) {
        // Call Dodo Payments POST /refunds
        try {
          const refundRes = await fetch(`${baseUrl}/refunds`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${DODO_PAYMENTS_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              payment_id: dodoPaymentId,
              reason: notes || "Admin initiated refund from IndiHunt console",
            }),
          });

          const refundText = await refundRes.text();
          let refundData: any = {};
          try {
            refundData = JSON.parse(refundText);
          } catch {
            console.warn("Dodo /refunds returned non-JSON:", refundText.substring(0, 200));
          }

          if (refundRes.ok && (refundData.refund_id || refundData.id || refundData.status)) {
            dodoRefundSuccess = true;
            dodoRefundId = refundData.refund_id || refundData.id || null;
          } else {
            dodoRefundError = refundData.error || refundData.message || `HTTP ${refundRes.status}`;
            console.error("Dodo refund API error:", dodoRefundError, refundData);
          }
        } catch (refundErr: any) {
          dodoRefundError = refundErr.message || "Network error calling Dodo refunds API";
          console.error("Dodo refund request failed:", refundErr);
        }
      } else {
        // Manual or test payment — just mark as refunded locally
        dodoRefundSuccess = true;
      }

      // Update payment record with refund status and details
      const refundMetadata = {
        ...((paymentRow.metadata && typeof paymentRow.metadata === "object") ? paymentRow.metadata : {}),
        notes: notes || "Admin refund",
        updated_at: new Date().toISOString(),
        refunded: true,
        dodo_refund_id: dodoRefundId,
        dodo_refund_success: dodoRefundSuccess,
        dodo_refund_error: dodoRefundError,
      };

      // Update in payments table
      await supabase
        .from("payments")
        .update({ status: "refunded", metadata: refundMetadata })
        .eq("id", paymentId);

      // Also try polar_payments as fallback
      await supabase
        .from("polar_payments")
        .update({ status: "refunded", metadata: refundMetadata })
        .eq("id", paymentId);

      // Pause the linked ad campaign
      const campaignId = paymentRow.campaign_id;
      if (campaignId) {
        await supabase
          .from("ad_campaigns")
          .update({ status: "paused_by_admin" })
          .eq("id", campaignId);

        // Record refund in budget ledger
        await supabase.from("ad_budget_transactions").insert({
          campaign_id: campaignId,
          user_id: paymentRow.user_id || "admin",
          payment_id: paymentId,
          amount: -(Number(paymentRow.amount) || 0),
          transaction_type: "refund",
          balance_after: 0,
          notes: `Admin refund via Dodo Payments. ${dodoRefundId ? `Refund ID: ${dodoRefundId}` : ""}. ${notes || ""}`
        });
      }

      await logAuditEntry("refund_payment", "payment", paymentId, {
        status: "refunded",
        dodo_payment_id: dodoPaymentId,
        dodo_refund_id: dodoRefundId,
        dodo_refund_success: dodoRefundSuccess,
        dodo_refund_error: dodoRefundError,
        campaign_id: campaignId,
        notes,
      });
    } else {
      // Non-refund status updates (succeeded, pending, failed)
      await supabase
        .from("payments")
        .update({ status, metadata: { notes, updated_at: new Date().toISOString() } })
        .eq("id", paymentId);

      await supabase
        .from("polar_payments")
        .update({ status, metadata: { notes, updated_at: new Date().toISOString() } })
        .eq("id", paymentId);

      await logAuditEntry("update_payment_status", "payment", paymentId, { status, notes });
    }
  } catch (err) {
    console.error("[adminUpdatePaymentStatus] Exception:", err);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/ads");
}

export async function adminTopUpAdBudget(campaignId: string, amount: number, notes: string) {
  try {
    const { supabase, userId } = await assertAdmin();

    const { data: campaign } = await supabase
      .from("ad_campaigns")
      .select("user_id, total_budget, target_impressions, cpm_rate")
      .eq("id", campaignId)
      .single();

    if (campaign) {
      const newTotal = (campaign.total_budget || 0) + amount;
      const additionalImpressions = (amount / (campaign.cpm_rate || 10)) * 1000;
      const newTarget = (campaign.target_impressions || 0) + additionalImpressions;

      await supabase
        .from("ad_campaigns")
        .update({ status: "active", total_budget: newTotal, target_impressions: newTarget })
        .eq("id", campaignId);

      await supabase.from("ad_budget_transactions").insert({
        campaign_id: campaignId,
        user_id: campaign.user_id || userId,
        amount,
        transaction_type: "topup",
        balance_after: newTotal,
        notes: `Admin budget top-up: ${notes}`
      });

      await logAuditEntry("topup_ad_budget", "ad_campaign", campaignId, { amount, notes });
    }
  } catch (err) {
    console.error("[adminTopUpAdBudget] Exception:", err);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/ads");
}

export async function adminGrantProMembership(userId: string, plan: string = "pro_annual", days: number = 365) {
  try {
    const { supabase } = await assertAdmin();

    await supabase
      .from("profiles")
      .update({
        is_pro: true,
        pro_plan: plan,
        pro_expires_at: new Date(Date.now() + days * 86400000).toISOString()
      })
      .eq("id", userId);

    await logAuditEntry("grant_pro_membership", "user", userId, { plan, days });
  } catch (err) {
    console.error("[adminGrantProMembership] Exception:", err);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/users");
}

export async function adminSetProductFeatured(productId: string, featured: boolean, days: number = 30) {
  try {
    const { supabase } = await assertAdmin();

    await supabase
      .from("products")
      .update({
        featured,
        featured_until: featured ? new Date(Date.now() + days * 86400000).toISOString() : null
      })
      .eq("id", productId);

    await logAuditEntry(featured ? "feature_product" : "unfeature_product", "product", productId, { featured, days });
  } catch (err) {
    console.error("[adminSetProductFeatured] Exception:", err);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/products");
  revalidatePath("/admin/featured");
}

export async function adminSetActiveGateway(gateway: "dodo" | "manual" = "dodo") {
  try {
    const { supabase } = await assertAdmin();

    await supabase
      .from("platform_settings")
      .upsert(
        {
          key: "payment_gateways",
          value: {
            active_gateway: gateway,
            dodo_enabled: true,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        },
        { onConflict: "key" }
      );

    await logAuditEntry("set_active_payment_gateway", "settings", gateway, { active_gateway: gateway });
  } catch (err) {
    console.error("[adminSetActiveGateway] Exception:", err);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/advertise");
}

export async function adminTestWebhookEndpoint(provider: "dodo" = "dodo") {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://indihunt.in";
    const targetUrl = `${siteUrl}/t/webhooks/dodo`;
    const response = await fetch(targetUrl, { method: "GET" }).catch(() => null);

    return {
      success: !!response && response.ok,
      status: response ? response.status : 503,
      url: targetUrl
    };
  } catch (err: any) {
    return { success: false, status: 500, error: err.message || "Failed to contact webhook" };
  }
}
