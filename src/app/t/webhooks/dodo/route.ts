import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

function getServiceDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "dodo-webhook-listener" }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

function verifyDodoSignature(rawBody: string, headers: { id: string; signature: string; timestamp: string }, secret: string): boolean {
  try {
    if (!secret) return true; // In dev if secret not configured
    if (!headers.id || !headers.signature || !headers.timestamp) return false;

    // Verify timestamp within 10 minutes (600s) to prevent replay attacks
    const currentTimestamp = Math.floor(Date.now() / 1000);
    let eventTimestamp = parseInt(headers.timestamp, 10);
    if (!isNaN(eventTimestamp) && eventTimestamp > 1e11) {
      eventTimestamp = Math.floor(eventTimestamp / 1000);
    }

    if (!isNaN(eventTimestamp) && Math.abs(currentTimestamp - eventTimestamp) > 600) {
      console.warn("Dodo webhook timestamp outside validity window:", eventTimestamp);
      return false;
    }

    let cleanSecret = secret.trim();
    if (cleanSecret.startsWith("whsec_")) {
      cleanSecret = cleanSecret.substring(6);
    }
    const secretBuffer = Buffer.from(cleanSecret, "base64");

    const signedPayload = `${headers.id}.${headers.timestamp}.${rawBody}`;
    const expectedSig = crypto.createHmac("sha256", secretBuffer).update(signedPayload).digest("base64");

    const signatures = headers.signature.split(" ").map(s => {
      const parts = s.split(",");
      return parts.length > 1 ? parts[1] : parts[0];
    });

    return signatures.some(sig => {
      try {
        const sigBuf = Buffer.from(sig, "base64");
        const expBuf = Buffer.from(expectedSig, "base64");
        return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
      } catch {
        return false;
      }
    });
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || process.env.DODO_WEBHOOK_KEY;

    // Verify Webhook Signature if secret configured
    if (DODO_WEBHOOK_SECRET) {
      const webhookId = req.headers.get("webhook-id") || req.headers.get("x-webhook-id") || "";
      const webhookSignature = req.headers.get("webhook-signature") || req.headers.get("x-webhook-signature") || "";
      const webhookTimestamp = req.headers.get("webhook-timestamp") || req.headers.get("x-webhook-timestamp") || "";

      if (webhookId && webhookSignature) {
        const isValid = verifyDodoSignature(rawBody, {
          id: webhookId,
          signature: webhookSignature,
          timestamp: webhookTimestamp
        }, DODO_WEBHOOK_SECRET);

        if (!isValid) {
          console.warn("Invalid Dodo webhook signature rejected.");
          return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
        }
      }
    }

    const body = JSON.parse(rawBody || "{}");

    // Dodo payload parsing
    const eventType = body?.type || body?.event || body?.event_type || "ping";
    const data = body?.data || body?.payload || body || {};

    const metadata = data?.metadata || body?.metadata || {};
    const campaignId = metadata?.campaignId || metadata?.campaign_id;
    const productId = metadata?.productId || metadata?.product_id;
    const userId = metadata?.userId || metadata?.user_id || data?.customer?.customer_id;
    const userEmail = metadata?.userEmail || data?.billing?.email || data?.customer?.email;

    // Amount parsing
    const rawAmount = data?.total_amount || data?.amount || data?.total;
    const paidAmount = rawAmount ? (rawAmount > 10000 ? rawAmount / 100 : rawAmount) : (Number(metadata?.amount) || 1199);

    const paymentId = data?.payment_id || data?.id || `dodo_${Date.now()}`;
    const status = data?.status || "succeeded";

    const db = getServiceDbClient();

    // Handle Payment Failure
    if (eventType === "payment.failed" || status === "failed" || status === "cancelled") {
      console.warn(`Dodo payment failed/cancelled for paymentId: ${paymentId}`);
      if (db && userId) {
        await db.from("payments").insert({
          user_id: userId,
          campaign_id: campaignId || null,
          dodo_payment_id: paymentId,
          amount: paidAmount,
          currency: data?.currency || "inr",
          status: "failed",
          payment_method: "dodo",
          metadata: {
            ...metadata,
            dodo_event: eventType,
            userEmail,
            error: data?.error_message || "Payment unsuccessful"
          }
        });
      }
      return NextResponse.json({ success: true, message: "Recorded failed payment status" });
    }

    // Supported successful events
    const successfulEvents = [
      "payment.succeeded",
      "payment.created",
      "payment_intent.succeeded",
      "order.completed",
      "subscription.active",
      "test.payment"
    ];

    if (successfulEvents.includes(eventType) || status === "succeeded" || status === "paid") {
      let activeCampaignId = campaignId;

      if (db) {
        // Check if campaign already exists
        if (campaignId) {
          const { data: existingCamp } = await db
            .from("ad_campaigns")
            .select("id, user_id, total_budget, target_impressions, cpm_rate")
            .eq("id", campaignId)
            .maybeSingle();

          if (existingCamp) {
            const newTotal = (existingCamp.total_budget || 0) + Number(paidAmount);
            const addedImpressions = Math.round((Number(paidAmount) / (existingCamp.cpm_rate || 10)) * 1000);
            const newTarget = (existingCamp.target_impressions || 0) + addedImpressions;

            await db
              .from("ad_campaigns")
              .update({
                status: "active",
                total_budget: newTotal,
                target_impressions: newTarget,
                dodo_payment_id: paymentId,
              })
              .eq("id", campaignId);
            
            activeCampaignId = existingCamp.id;
          }
        }

        // If campaign was NOT pre-created, CREATE IT NOW upon successful payment
        if (!activeCampaignId && (productId || metadata.destination_url) && userId) {
          const newCampPayload: any = {
            user_id: userId,
            product_id: productId || null,
            name: metadata.name || metadata.campaignName || "Sponsored Ad Campaign",
            headline: metadata.headline || "Featured on IndiHunt",
            description: metadata.description || "Discover high-growth indie software on IndiHunt.",
            cta_text: metadata.cta_text || "Visit Product",
            destination_url: metadata.destination_url || (productId ? `/products/${productId}` : "https://indihunt.in"),
            status: "active",
            total_budget: paidAmount,
            target_impressions: Number(metadata.target_impressions) || Math.round((paidAmount / 10) * 1000) || 119900,
            delivered_impressions: 0,
            daily_limit: Number(metadata.daily_limit) || 10,
            cpm_rate: Number(metadata.cpm_rate) || 10.00,
            dodo_payment_id: paymentId,
            start_date: new Date().toISOString()
          };

          if (campaignId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)) {
            newCampPayload.id = campaignId;
          }

          const { data: createdCamp, error: createErr } = await db
            .from("ad_campaigns")
            .insert(newCampPayload)
            .select("id")
            .maybeSingle();

          if (!createErr && createdCamp) {
            activeCampaignId = createdCamp.id;
          } else {
            console.error("Dodo webhook ad_campaigns insert error:", createErr);
          }
        }

        // Record in payments table (idempotent with unique dodo_payment_id constraint)
        let paymentRecord: any = null;
        if (userId) {
          const { data: pData, error: pErr } = await db
            .from("payments")
            .upsert({
              user_id: userId,
              campaign_id: activeCampaignId || null,
              dodo_payment_id: paymentId,
              amount: paidAmount,
              currency: data?.currency || "inr",
              status: "succeeded",
              payment_method: "dodo",
              metadata: {
                ...metadata,
                dodo_event: eventType,
                userEmail,
              }
            }, { onConflict: "dodo_payment_id" })
            .select("id")
            .maybeSingle();

          if (!pErr) {
            paymentRecord = pData;
          } else {
            console.error("Dodo webhook payments insert error:", pErr);
          }
        }

        // Record in budget ledger
        if (activeCampaignId && userId) {
          await db
            .from("ad_budget_transactions")
            .insert({
              campaign_id: activeCampaignId,
              user_id: userId,
              payment_id: paymentRecord?.id || null,
              amount: paidAmount,
              transaction_type: "topup",
              balance_after: paidAmount,
              notes: `Dodo Payments activation of ₹${paidAmount} (Payment: ${paymentId})`
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Dodo Payments webhook '${eventType}' processed securely`
    });
  } catch (err: any) {
    console.error("Error processing Dodo Payments webhook:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
