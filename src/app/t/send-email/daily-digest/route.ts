import { NextResponse } from 'next/server';
import { apiSuccessSecure } from '@/lib/api/response';
import { getProducts } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const dbClient = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Direct Supabase query for fresh products — bypasses Redis/public cache
// so the daily digest always sees the latest launches.
const LIST_COLS =
  'id,name,tagline,logo_url,website_url,tags,status,scheduled_for,created_at,upvotes_count,comments_count,quality_score,featured,featured_at,editor_pick,never_feature,country,pricing_type,is_open_source,is_deleted,maker_id,worked_on_launch,is_promoted,promoted';

async function getFreshProducts(): Promise<any[]> {
  // 1. Try a direct DB query (no cache) so today's products are always included
  if (dbClient) {
    try {
      const { data, error } = await dbClient
        .from('products')
        .select(LIST_COLS)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(300);

      if (!error && data && data.length > 0) {
        const now = new Date();
        return data.map((p: any) =>
          p.status === 'scheduled' && p.scheduled_for && new Date(p.scheduled_for) <= now
            ? { ...p, status: 'live' }
            : p
        );
      }
    } catch { }
  }

  // 2. Fallback to getProducts() (may serve cached data, but better than nothing)
  const fallback = await getProducts();
  return (fallback && fallback.length > 0) ? fallback : [];
}

export async function POST(req: Request) {
  return handleDailyDigest(req);
}

export async function GET(req: Request) {
  return handleDailyDigest(req);
}

async function handleDailyDigest(req: Request) {
  try {
    const prods = await getFreshProducts();

    const now = new Date();
    const nowMs = now.getTime();

    // IndiHunt is India-first — bucket by IST calendar day, not UTC
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(nowMs + IST_OFFSET_MS);
    const todayStr = istNow.toISOString().split('T')[0]; // IST calendar date

    const startOfTodayMs = new Date(`${todayStr}T00:00:00.000Z`).getTime() - IST_OFFSET_MS; // UTC instant of IST midnight

    // Effective launch date — use scheduled/launch date if present, else created_at.
    const getEffectiveDate = (p: any) => {
      const raw = p.scheduled_for || p.scheduled_date || p.launch_date || p.created_at;
      return raw ? new Date(raw) : null;
    };
    const getEffectiveDateStrIST = (p: any) => {
      const d = getEffectiveDate(p);
      if (!d) return null;
      return new Date(d.getTime() + IST_OFFSET_MS).toISOString().split('T')[0];
    };

    // Match the home page logic: allow 'scheduled' products if their scheduled_for is in the past (already launched)
    const isLiveProduct = (p: any) => {
      if (!p) return false;
      if (p.status === 'draft' || p.is_draft) return false;
      if (p.status === 'scheduled' || p.is_scheduled) {
        const eff = getEffectiveDate(p);
        if (!eff || eff.getTime() > nowMs) return false;
        return true;
      }
      const eff = getEffectiveDate(p);
      if (eff && eff.getTime() > nowMs) return false;
      return true;
    };

    const liveProds = prods.filter(isLiveProduct);

    // Filter Today's Products (launched IST today)
    let todaysLaunches = liveProds
      .filter((p: any) => {
        const eff = getEffectiveDate(p);
        if (!eff) return false;
        return eff.getTime() >= startOfTodayMs || getEffectiveDateStrIST(p) === todayStr;
      })
      .sort((a: any, b: any) => (b.upvotes_count || b.upvotes || 0) - (a.upvotes_count || a.upvotes || 0));

    const topToday = todaysLaunches.slice(0, 10);
    const queryLogs: string[] = [];

    // Helper functions for absolute URL formatting in emails
    const ensureAbsoluteUrl = (url?: string, defaultUrl: string = 'https://indihunt.in'): string => {
      if (!url || typeof url !== 'string' || !url.trim()) return defaultUrl;
      const clean = url.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      return `https://indihunt.in${clean.startsWith('/') ? '' : '/'}${clean}`;
    };

    const getAdClickUrl = (ad: any): string => {
      const dest = ensureAbsoluteUrl(ad.destination_url, 'https://indihunt.in/advertise');
      try {
        const urlObj = new URL(dest);
        if (!urlObj.searchParams.has('utm_source')) {
          urlObj.searchParams.set('utm_source', 'indihunt_digest');
          urlObj.searchParams.set('utm_medium', 'email');
        }
        return urlObj.toString();
      } catch {
        return dest;
      }
    };

    // 1. Fetch active billboard ads from database
    let billboardAds: any[] = [];
    if (dbClient) {
      try {
        const { data: bData, error: bErr } = await dbClient
          .from('billboard_ads')
          .select('id, title, image_url, destination_url, is_active')
          .eq('is_active', true);
        if (!bErr && bData && bData.length > 0) {
          billboardAds = bData;
          queryLogs.push(`Fetched ${bData.length} active billboard ads from database`);
        } else if (bErr) {
          queryLogs.push(`billboard_ads query error: ${bErr.message}`);
        }
      } catch (e: any) {
        queryLogs.push(`billboard_ads query exception: ${e.message}`);
      }
    }

    if (billboardAds.length === 0) {
      billboardAds = [
        {
          id: "bb_supabase_default",
          title: "Supabase — Build in a weekend, scale to millions",
          image_url: "https://indihunt.in/supabase_ad_banner.webp",
          destination_url: "https://supabase.com",
          is_active: true,
        },
        {
          id: "bb_indihunt_default",
          title: "Launch & Advertise Your Product on IndiHunt",
          image_url: "https://indihunt.in/indihunt_horizontal_banner.webp",
          destination_url: "https://indihunt.in/advertise",
          is_active: true,
        }
      ];
      queryLogs.push(`Using fallback billboard ads pool (${billboardAds.length} ads available)`);
    }

    // Billboard Ad HTML component for email
    const renderBillboardAdHtml = (ad: any) => {
      const destUrl = getAdClickUrl(ad);
      const imgUrl = ensureAbsoluteUrl(ad.image_url, 'https://indihunt.in/supabase_ad_banner.webp');
      const adTitle = ad.title || 'Featured Partner';

      return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; margin-top: 10px;">
        <tr>
          <td>
            <a href="${destUrl}" target="_blank" style="text-decoration: none; display: block;">
              <img src="${imgUrl}" alt="${adTitle}" width="100%" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; border: 1px solid #10b981; display: block; object-fit: cover;" />
            </a>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 6px;">
              <tr>
                <td align="left" style="font-size: 11px; font-weight: 600; color: #475569;">
                  <a href="${destUrl}" target="_blank" style="color: #475569; text-decoration: none;">${adTitle}</a>
                </td>
                <td align="right" style="font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  <span style="background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px;">Promoted Ad</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    };

    const renderBillboardAdText = (ad: any) => {
      const destUrl = getAdClickUrl(ad);
      const adTitle = ad.title || 'Featured Partner';
      return `\n--- PROMOTED BILLBOARD ---\n${adTitle}\n${destUrl}\n\n`;
    };

    // Table-based row layout for top products
    const formatProductItem = (p: any, idx: number) => {
      const logo = p.logo_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80";
      const category = p.tags && p.tags[0] ? p.tags[0] : (p.category || "Productivity");
      const commentsCount = p.comments_count || p.commentsCount || 0;
      const slug = encodeURIComponent(p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      const productUrl = `https://indihunt.in/products/${slug}`;
      const promotedBadge = (p.is_promoted || p.promoted)
        ? `<span style="background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">&nbsp;•&nbsp;Promoted</span>`
        : '';

      return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
        <tr>
          <td width="52" valign="middle" style="padding-right: 14px;">
            <a href="${productUrl}" target="_blank" style="text-decoration: none;">
              <img src="${logo}" alt="${p.name}" width="52" height="52" style="width: 52px; height: 52px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0; display: block;" />
            </a>
          </td>
          <td valign="middle" style="padding-right: 12px;">
            <div style="font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.3;">
              <a href="${productUrl}" target="_blank" style="color: #0f172a; text-decoration: none;">${idx + 1}. ${p.name}</a>
              <span style="font-weight: 400; color: #475569;"> — ${p.tagline || ''}</span>
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
              <span>💬 ${commentsCount}</span>
              <span style="margin: 0 4px;">•</span>
              <span>🏷️ ${category}</span>
              ${promotedBadge}
            </div>
          </td>
          <td width="44" valign="middle" align="right">
            <a href="${productUrl}" target="_blank" style="text-decoration: none;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
                <tr>
                  <td align="center" style="padding: 6px 8px; min-width: 36px;">
                    <div style="font-size: 10px; color: #64748b; line-height: 1;">▲</div>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; line-height: 1;">${p.upvotes_count || p.upvotes || 0}</div>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
      </table>`;
    };

    const firstFiveProductsHtml = topToday.slice(0, 5).map((p, idx) => formatProductItem(p, idx)).join('');
    const remainingProductsHtml = topToday.slice(5).map((p, idx) => formatProductItem(p, idx + 5)).join('');
    const emptyNoticeHtml = topToday.length === 0 ? `
      <div style="padding: 24px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: 600; color: #475569;">No live product launches recorded for today yet.</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Check back soon or launch your product today on IndiHunt!</div>
      </div>
    ` : '';

    const formatProductListText = (items: any[]) => {
      if (!items || items.length === 0) return 'No live product launches recorded for today yet.';
      return items.map((p, idx) => `${idx + 1}. ${p.name} (▲ ${p.upvotes_count || 0})\n   ${p.tagline || ''}\n   https://indihunt.in/products/${encodeURIComponent(p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`).join('\n\n');
    };

    const dateFormatted = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });

    // Function to generate full HTML content for a specific billboard ad
    const generateHtmlForAd = (ad: any) => {
      const adHtml = renderBillboardAdHtml(ad);
      const productSectionHtml = topToday.length === 0
        ? `${emptyNoticeHtml}${adHtml}`
        : `${firstFiveProductsHtml}${adHtml}${remainingProductsHtml}`;

      return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1e293b; margin: 0; padding: 16px;">
    <div style="width: 100%; max-width: 100%; margin: 0; padding: 0;">

      <div style="font-size: 22px; font-weight: 800; color: #ea580c; margin-bottom: 4px;">
        The Leaderboard
      </div>
      <div style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
        ${dateFormatted}
      </div>

      <!-- Single Focused Section: Today's Top 10 Products -->
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 24px 0 16px 0; border-left: 4px solid #ea580c; padding-left: 10px;">
        🔥 Today's Top 10 Products
      </h3>
      ${productSectionHtml}

      <!-- View All Button Below Top Ten -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 12px 0 28px 0;">
        <tr>
          <td align="center">
            <a href="https://indihunt.in" target="_blank" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 30px; border-radius: 9999px; text-align: center; box-shadow: 0 2px 4px rgba(234, 88, 12, 0.25);">
              View All Products on IndiHunt
            </a>
          </td>
        </tr>
      </table>

      <!-- Useful Links Section -->
      <div style="margin-top: 32px; padding: 16px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
        <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 8px;">Quick Links</div>
        <div style="font-size: 13px; color: #2563eb;">
           <a href="https://indihunt.in/advertise" style="color: #eb6725ff; text-decoration: underline;">Advertise</a> &nbsp;|&nbsp;
          <a href="https://indihunt.in/stories" style="color: #eb6725ff; text-decoration: underline;">Stories</a> &nbsp;|&nbsp;
          <a href="https://x.com/SonuHs9557" style="color: #eb6725ff; text-decoration: underline;">X</a>
        </div>
      </div>

      <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: left;">
        Sent with ❤️ by <strong>IndiHunt</strong> — Empowering Indian Indie Makers.<br/>
        You are receiving this because you subscribed to IndiHunt Daily Digest.<br/>
        <a href="https://indihunt.in/profile/settings" style="color: #64748b; text-decoration: underline;">Unsubscribe / Update Preferences</a>
      </div>

    </div>
  </body>
</html>`;
    };

    const generateTextForAd = (ad: any) => {
      const adText = renderBillboardAdText(ad);
      return `IndiHunt Digest - ${dateFormatted}\n\n` +
        `--- TODAY'S TOP 10 PRODUCTS ---\n\n${formatProductListText(topToday)}\n\n` +
        `View All Products on IndiHunt: https://indihunt.in\n\n` +
        `${adText}` +
        `--- QUICK LINKS ---\n` +
        `Advertise: https://indihunt.in/advertise\n` +
        `Stories: https://indihunt.in/stories\n` +
        `Follow on X: https://x.com/SonuHs9557\n\n` +
        `Best,\nIndiHunt Team`;
    };

    // Precompute email template for each distinct billboard ad (O(number_of_ads) generation)
    const adEmailCache = new Map<string, { html: string; text: string; ad: any }>();
    for (const ad of billboardAds) {
      adEmailCache.set(ad.id, {
        html: generateHtmlForAd(ad),
        text: generateTextForAd(ad),
        ad,
      });
    }

    const defaultContent = adEmailCache.get(billboardAds[0].id) || {
      html: generateHtmlForAd(billboardAds[0]),
      text: generateTextForAd(billboardAds[0]),
      ad: billboardAds[0]
    };

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[Daily Digest API] Missing RESEND_API_KEY env var');
      return NextResponse.json({ error: 'Email service not configured (RESEND_API_KEY missing)' }, { status: 500 });
    }

    const urlObj = new URL(req.url);
    const testEmailParam = urlObj.searchParams.get('testEmail') || urlObj.searchParams.get('email') || urlObj.searchParams.get('to');
    const isExplicitTest = !!testEmailParam;

    const emailsSet = new Set<string>();

    if (isExplicitTest && testEmailParam.includes('@')) {
      emailsSet.add(testEmailParam.toLowerCase().trim());
      queryLogs.push(`Explicit Test Mode: sending daily digest email to requested recipient (${testEmailParam})`);
    } else if (dbClient) {
      queryLogs.push(`Broadcasting mode: fetching all registered users and subscribers...`);
      try {
        const { data: rpcData, error: rpcErr } = await dbClient.rpc('get_all_user_emails');
        if (rpcErr) {
          queryLogs.push(`RPC get_all_user_emails error: ${rpcErr.message}`);
        } else if (rpcData && Array.isArray(rpcData)) {
          let count = 0;
          rpcData.forEach((row: any) => {
            const em = typeof row === 'string' ? row : (row.email || row.work_email);
            if (em && em.includes('@')) {
              emailsSet.add(em.toLowerCase().trim());
              count++;
            }
          });
          queryLogs.push(`Fetched ${count} emails from RPC get_all_user_emails`);
        }
      } catch (e: any) {
        queryLogs.push(`RPC exception: ${e.message}`);
      }

      try {
        const { data: subData, error: subErr } = await dbClient.from('newsletter_subscriptions').select('email');
        if (subErr) {
          queryLogs.push(`newsletter_subscriptions query error: ${subErr.message}`);
        } else if (subData) {
          subData.forEach((row: any) => {
            if (row.email && row.email.includes('@')) emailsSet.add(row.email.toLowerCase().trim());
          });
          queryLogs.push(`Found ${subData.length} entries in newsletter_subscriptions`);
        }
      } catch (e: any) {
        queryLogs.push(`newsletter_subscriptions exception: ${e.message}`);
      }

      try {
        const { data: profData, error: profErr } = await dbClient.from('profiles').select('work_email');
        if (profErr) {
          queryLogs.push(`profiles query error: ${profErr.message}`);
        } else if (profData) {
          let profCount = 0;
          profData.forEach((row: any) => {
            if (row.work_email && row.work_email.includes('@')) {
              emailsSet.add(row.work_email.toLowerCase().trim());
              profCount++;
            }
          });
          queryLogs.push(`Found ${profCount} emails in profiles table (work_email)`);
        }
      } catch (e: any) {
        queryLogs.push(`profiles exception: ${e.message}`);
      }

      try {
        if (serviceRoleKey && dbClient.auth && dbClient.auth.admin) {
          const { data: authData } = await dbClient.auth.admin.listUsers();
          if (authData && authData.users) {
            authData.users.forEach((u: any) => {
              if (u.email && u.email.includes('@')) emailsSet.add(u.email.toLowerCase().trim());
            });
            queryLogs.push(`Found ${authData.users.length} users in auth.users via Admin API`);
          }
        }
      } catch (e: any) { }
    }

    const recipientList = Array.from(emailsSet);

    if (recipientList.length === 0) {
      return apiSuccessSecure({
        success: false,
        message: "No subscribers found in database to send daily digest.",
        tip: "You can test email sending immediately by adding ?testEmail=your@email.com to the API URL",
        diagnostics: queryLogs,
        databaseConnected: !!dbClient
      });
    }

    const results = [];
    const BATCH_SIZE = 100;
    const servedAdImpressions: Record<string, number> = {};

    for (let i = 0; i < recipientList.length; i += BATCH_SIZE) {
      const batch = recipientList.slice(i, i + BATCH_SIZE);
      const batchPayload = batch.map((toEmail) => {
        // Pick a random billboard ad from the active pool for each user
        const randomIndex = Math.floor(Math.random() * billboardAds.length);
        const selectedAd = billboardAds[randomIndex];
        const content = adEmailCache.get(selectedAd.id) || defaultContent;

        // Track impression counts for this ad
        servedAdImpressions[selectedAd.id] = (servedAdImpressions[selectedAd.id] || 0) + 1;

        return {
          from: 'IndiHunt Daily Digest <hello@indihunt.in>',
          to: [toEmail],
          subject: `IndiHunt Daily: Today's Top 10 Products 🚀`,
          text: content.text,
          html: content.html,
        };
      });

      const resendRes = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchPayload),
      });

      const resData = await resendRes.json();
      if (!resendRes.ok) {
        console.error('[Daily Digest Resend Batch Error]', resData);
        results.push({ success: false, status: resendRes.status, error: resData });
      } else {
        results.push({ success: true, status: resendRes.status, data: resData });
      }
    }

    // Safely update views_count in database for all served billboard ads
    if (dbClient && Object.keys(servedAdImpressions).length > 0) {
      try {
        await Promise.allSettled(
          Object.entries(servedAdImpressions).map(async ([adId, impressions]) => {
            if (adId && !adId.startsWith('bb_')) {
              try {
                const { data: currentAd } = await dbClient
                  .from('billboard_ads')
                  .select('views_count')
                  .eq('id', adId)
                  .single();
                const newCount = (currentAd?.views_count || 0) + impressions;
                await dbClient
                  .from('billboard_ads')
                  .update({ views_count: newCount })
                  .eq('id', adId);
              } catch (e) { }
            }
          })
        );
      } catch (e) { }
    }

    const anySuccess = results.some(r => r.success);
    return apiSuccessSecure({
      success: anySuccess,
      totalRecipients: recipientList.length,
      recipientsCount: recipientList.length,
      activeBillboardAdsCount: billboardAds.length,
      billboardAdsDistribution: servedAdImpressions,
      batchesSent: results.length,
      results
    });
  } catch (error: any) {
    console.error('[Daily Digest API Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
