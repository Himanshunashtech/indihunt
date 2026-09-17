"use client";

import React, { useEffect, useState } from "react";
import { AdCampaign, getProductById, supabase } from "@/lib/supabase";

interface SponsoredAdProps {
  excludeProductId?: string;
  placement?: "product_pages" | "search" | "category" | "forums";
  category?: string;
}

export function SponsoredAd({ excludeProductId, placement = "product_pages", category }: SponsoredAdProps) {
  const [ad, setAd] = useState<AdCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [authChecked, setAuthChecked] = useState(false);
  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);

  // Resolve session ID + auth state ONCE on mount
  useEffect(() => {
    let sid = sessionStorage.getItem("ih_ad_sid");
    if (!sid) {
      sid = `sid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("ih_ad_sid", sid);
    }
    setSessionId(sid);

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCurrentUserId(session.user.id);
        }
        setAuthChecked(true);
      }).catch(() => {
        setAuthChecked(true);
      });
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Resolve logo once ad is loaded
  useEffect(() => {
    if (!ad) return;
    if (ad.products?.logo_url) {
      setResolvedLogo(ad.products.logo_url);
      return;
    }
    if (ad.logo_url) {
      setResolvedLogo(ad.logo_url);
      return;
    }
    if (ad.product_id && ad.product_id !== "00000000-0000-0000-0000-000000000000") {
      getProductById(ad.product_id).then(p => {
        if (p?.logo_url) setResolvedLogo(p.logo_url);
      }).catch(() => { });
    }
  }, [ad]);

  // Load the ad — waits until session + auth are fully resolved, fires exactly once
  useEffect(() => {
    if (!authChecked || !sessionId) return;

    let cancelled = false;

    async function loadAd() {
      let adSelected: AdCampaign | null = null;
      try {
        const queryParams = new URLSearchParams();
        if (excludeProductId) queryParams.set("excludeProductId", excludeProductId);
        queryParams.set("placement", placement);
        if (category) queryParams.set("category", category);

        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
        queryParams.set("device", isMobile ? "mobile" : "desktop");

        if (sessionId) queryParams.set("sessionId", sessionId);

        const seenRaw = typeof window !== "undefined" ? sessionStorage.getItem("ih_seen_ad_ids") : null;
        if (seenRaw) {
          queryParams.set("seenAdIds", seenRaw);
        }

        if (currentUserId) queryParams.set("userId", currentUserId);

        const res = await fetch(`/t/ads?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const adObj = data.data?.ad || data.ad;
          if (adObj) {
            const currentAd: AdCampaign = adObj;
            adSelected = currentAd;

            if (currentAd && typeof window !== "undefined") {
              try {
                const seenArr: string[] = seenRaw ? JSON.parse(seenRaw) : [];
                const updatedSeen = Array.from(new Set([...seenArr, currentAd.id]));
                sessionStorage.setItem("ih_seen_ad_ids", JSON.stringify(updatedSeen));
              } catch (e) { }
            }
          }
        }
      } catch (err) {
        console.error("Error loading sponsored ad from API, trying fallback:", err);
      }

      if (cancelled) return;

      if (adSelected) {
      } else {
      }

      setAd(adSelected);
      setLoading(false);
    }

    loadAd();

    return () => {
      cancelled = true;
    };
  }, [excludeProductId, placement, category, sessionId, currentUserId, authChecked]);

  // Log impression once loaded
  useEffect(() => {
    if (ad) {
      fetch("/t/ads/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: ad.id,
          eventType: "impression",
          sessionId,
          userId: currentUserId
        })
      }).catch(err => console.error("Error logging ad impression:", err));

      // Update local storage tracking counts for local fallback
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("indihunt_ad_campaigns") || "[]";
        const list: AdCampaign[] = JSON.parse(cached);
        const updated = list
          .map(c => {
            if (c.id === ad.id) {
              const nextImpressions = c.impressions + 1;
              const nextDelivered = c.delivered_impressions + 1;
              return {
                ...c,
                impressions: nextImpressions,
                delivered_impressions: nextDelivered,
                status: nextDelivered >= c.target_impressions ? ("completed" as const) : c.status
              };
            }
            return c;
          })
          .filter(c => c.delivered_impressions < c.target_impressions); // Auto-delete completed/exhausted ads

        localStorage.setItem("indihunt_ad_campaigns", JSON.stringify(updated));

        // Also save to events list for analytics page
        const eventsCached = localStorage.getItem(`indihunt_ad_events_${ad.id}`) || "[]";
        const eventsList = JSON.parse(eventsCached);
        eventsList.push({
          id: `ev-${Date.now()}`,
          campaign_id: ad.id,
          event_type: "impression",
          created_at: new Date().toISOString()
        });
        localStorage.setItem(`indihunt_ad_events_${ad.id}`, JSON.stringify(eventsList));
      }
    }
  }, [ad, sessionId, currentUserId]);

  const handleAdClick = async (e: React.MouseEvent) => {
    if (!ad) return;

    try {
      fetch("/t/ads/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: ad.id,
          eventType: "click",
          sessionId,
          userId: currentUserId
        })
      });

      // Update local storage tracking counts for local fallback
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("indihunt_ad_campaigns") || "[]";
        const list: AdCampaign[] = JSON.parse(cached);
        const updated = list
          .map(c => {
            if (c.id === ad.id) {
              const nextClicks = c.clicks + 1;
              return {
                ...c,
                clicks: nextClicks
              };
            }
            return c;
          })
          .filter(c => c.delivered_impressions < c.target_impressions); // Auto-delete completed/exhausted ads

        localStorage.setItem("indihunt_ad_campaigns", JSON.stringify(updated));

        // Also save to events list for analytics page
        const eventsCached = localStorage.getItem(`indihunt_ad_events_${ad.id}`) || "[]";
        const eventsList = JSON.parse(eventsCached);
        eventsList.push({
          id: `ev-${Date.now()}`,
          campaign_id: ad.id,
          event_type: "click",
          created_at: new Date().toISOString()
        });
        localStorage.setItem(`indihunt_ad_events_${ad.id}`, JSON.stringify(eventsList));
      }
    } catch (err) {
      console.error("Error logging ad click:", err);
    }
  };

  if (loading || !ad) return null;

  const hostname = (() => {
    try {
      return new URL(ad.destination_url).hostname;
    } catch (e) {
      return "";
    }
  })();

  const faviconFallback = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=128` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80";
  const logoSrc = resolvedLogo || ad.products?.logo_url || ad.logo_url || (ad.product_id && ad.product_id !== "00000000-0000-0000-0000-000000000000" ? `/t/products/logo?id=${ad.product_id}` : faviconFallback);

  const adTitle = ad.name
    .replace(/\s*(?:-|:)?\s*Ad$/i, "")
    .replace(/^Ad\s*(?:-|:)?\s*/i, "")
    .trim();

  return (
    <a
      href={ad.destination_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleAdClick}
      className="relative w-full max-w-full mx-auto bg-slate-100/90 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-5 hover:bg-slate-200/80 dark:hover:bg-slate-800/90 hover:border-orange-500/40 cursor-pointer transition-all duration-300 group animate-in fade-in duration-200 block overflow-hidden box-border shadow-2xs"
    >
      <div className="flex items-center gap-3 sm:gap-5 min-w-0 w-full sm:w-auto overflow-hidden">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-background">
          <img
            src={logoSrc}
            alt={adTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              const currentSrc = e.currentTarget.src;
              if (faviconFallback && !currentSrc.includes("google.com/s2/favicons")) {
                e.currentTarget.src = faviconFallback;
              } else {
                e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80";
              }
            }}
          />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="font-semibold text-foreground text-sm sm:text-[15px] block transition-colors truncate">
            {adTitle}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground block mt-0.5 line-clamp-1">
            {ad.headline}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-start sm:justify-end w-full sm:w-auto pt-0.5 sm:pt-0 max-w-full overflow-hidden">
        <span
          className="border border-slate-300 dark:border-slate-700 bg-card group-hover:border-slate-400 dark:group-hover:border-slate-600 text-foreground px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all truncate max-w-full inline-block shadow-2xs"
        >
          Try{" "}
          {(() => {
            try {
              return new URL(ad.destination_url).hostname;
            } catch (e) {
              return ad.destination_url;
            }
          })()}
        </span>
      </div>

      <span className="absolute bottom-0 right-0 bg-orange-500 text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-tl-lg rounded-br-xl sm:rounded-br-2xl pointer-events-none">
        Promoted
      </span>
    </a>
  );
}
