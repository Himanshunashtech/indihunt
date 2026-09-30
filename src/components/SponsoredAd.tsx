"use client";

import Image from "next/image";

import React, { useEffect, useState } from "react";
import { AdCampaign, getProductById } from "@/lib/supabase";
import { secureApiFetch } from "@/lib/api/client";

interface SponsoredAdProps {
  excludeProductId?: string;
  placement?: "product_pages" | "search" | "category" | "forums";
  category?: string;
}



export function SponsoredAd({ excludeProductId, placement = "product_pages", category }: SponsoredAdProps) {
  const [ad, setAd] = useState<AdCampaign | null>(null);
  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);

  // Fetch live ad from API
  useEffect(() => {
    let cancelled = false;

    let sid = "";
    if (typeof window !== "undefined") {
      sid = sessionStorage.getItem("ih_ad_sid") || "";
      if (!sid) {
        sid = `sid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("ih_ad_sid", sid);
      }
    }

    async function loadAd() {
      try {
        const queryParams = new URLSearchParams();
        if (excludeProductId) queryParams.set("excludeProductId", excludeProductId);
        queryParams.set("placement", placement);
        if (category) queryParams.set("category", category);
        if (sid) queryParams.set("sessionId", sid);

        const seenRaw = typeof window !== "undefined" ? sessionStorage.getItem("ih_seen_ad_ids") : null;
        if (seenRaw) queryParams.set("seenAdIds", seenRaw);

        const res = await secureApiFetch<{ ad: AdCampaign | null }>(`/t/ads?${queryParams.toString()}`);
        if (res && res.success && res.data) {
          const adObj = res.data.ad || (res.data as any);
          if (adObj && adObj.id && !cancelled) {
            setAd(adObj);

            if (typeof window !== "undefined") {
              try {
                const seenArr: string[] = seenRaw ? JSON.parse(seenRaw) : [];
                const updatedSeen = Array.from(new Set([...seenArr, adObj.id]));
                sessionStorage.setItem("ih_seen_ad_ids", JSON.stringify(updatedSeen));
              } catch (e) { }
            }
            return;
          }
        }
      } catch (err) {
        console.error("Error loading sponsored ad:", err);
      }
    }

    loadAd();

    return () => {
      cancelled = true;
    };
  }, [excludeProductId, placement, category]);

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
      getProductById(ad.product_id).then((p) => {
        if (p?.logo_url) setResolvedLogo(p.logo_url);
      }).catch(() => { });
    }
  }, [ad]);

  const handleAdClick = () => {
    if (!ad) return;
    try {
      const sid = typeof window !== "undefined" ? sessionStorage.getItem("ih_ad_sid") || "" : "";
      fetch("/t/ads/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: ad.id,
          eventType: "click",
          sessionId: sid,
        }),
      }).catch(() => { });
    } catch (e) { }
  };

  if (!ad) return null;

  const hostname = (() => {
    try {
      const u = ad.destination_url || "";
      if (u.startsWith("/")) return "indihunt.in";
      return new URL(u.startsWith("http") ? u : `https://${u}`).hostname;
    } catch (e) {
      return "indihunt.in";
    }
  })();

  const faviconFallback = hostname && hostname !== "indihunt.in"
    ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
    : "/logo.webp";
  const logoSrc = resolvedLogo || ad.logo_url || ad.products?.logo_url || faviconFallback;

  const adTitle = (ad.name || "IndiHunt for Startups")
    .replace(/\s*(?:-|:)?\s*Ad$/i, "")
    .replace(/^Ad\s*(?:-|:)?\s*/i, "")
    .trim();

  return (
    <a
      href={ad.destination_url || "/advertise"}
      target={ad.destination_url?.startsWith("/") ? "_self" : "_blank"}
      rel="noopener noreferrer"
      onClick={handleAdClick}
      className="relative w-full max-w-full mx-auto bg-slate-100/90 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-5 hover:bg-slate-200/80 dark:hover:bg-slate-800/90 hover:border-orange-500/40 cursor-pointer transition-all duration-300 group animate-in fade-in duration-200 block overflow-hidden box-border shadow-2xs my-4"
    >
      <div className="flex items-center gap-3 sm:gap-5 min-w-0 w-full sm:w-auto overflow-hidden">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-background flex items-center justify-center p-1">
          <Image
            src={logoSrc}
            alt={adTitle}
            className="w-full h-full object-contain"
          width={48} height={48} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="font-semibold text-foreground text-sm sm:text-[15px] block transition-colors truncate">
            {adTitle}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground block mt-0.5 line-clamp-1">
            {ad.headline || "Featured sponsored campaign"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-start sm:justify-end w-full sm:w-auto pt-0.5 sm:pt-0 max-w-full overflow-hidden">
        <span
          className="border border-slate-300 dark:border-slate-700 bg-card group-hover:border-slate-400 dark:group-hover:border-slate-600 text-foreground px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all truncate max-w-full inline-block shadow-2xs"
        >
          Try {hostname || "IndiHunt"}
        </span>
      </div>

      <span className="absolute bottom-0 right-0 bg-orange-500 text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-tl-lg rounded-br-xl sm:rounded-br-2xl pointer-events-none">
        Promoted
      </span>
    </a>
  );
}
