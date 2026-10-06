"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BillboardAd } from "@/lib/supabase";

interface FeedBillboardAdProps {
  ad?: BillboardAd;
  type: "supabase_fallback" | "indihunt_fallback";
}

export default function FeedBillboardAd({
  ad,
  type,
}: FeedBillboardAdProps) {
  if (ad) {
    const isInternal = ad.destination_url?.startsWith("/") || (!ad.destination_url?.startsWith("http://") && !ad.destination_url?.startsWith("https://") && !ad.destination_url?.includes("."));

    const content = (
      <>
        <div className="relative w-full" style={{ paddingBottom: "25%" }}>
          <Image
            src={ad.image_url}
            alt={ad.title || "Promoted Ad"}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            width={1200}
            height={300}
            sizes="(max-width: 768px) 100vw, 1200px"
            quality={90}
          />
        </div>
        <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-slate-900/80 text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm shadow-xs">
          Promoted Ad
        </div>
      </>
    );

    const linkClasses =
      "block relative w-full overflow-hidden border border-emerald-500/30 shadow-md hover:border-emerald-500/60 group transition-all duration-300 bg-muted/40";

    const handleBillboardClick = () => {
      let sid = "";
      if (typeof window !== "undefined") {
        sid = sessionStorage.getItem("ih_ad_sid") || "";
      }
      const payload = {
        billboardId: ad.id,
        eventType: "click",
        sessionId: sid,
      };
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        try {
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
          navigator.sendBeacon("/t/billboards/event", blob);
          return;
        } catch {}
      }
      fetch("/t/billboards/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) =>
        console.error("Error logging billboard click:", err)
      );
    };

    if (ad.destination_url) {
      if (isInternal) {
        return (
          <Link
            href={ad.destination_url}
            onClick={handleBillboardClick}
            className={linkClasses}
            suppressHydrationWarning
          >
            {content}
          </Link>
        );
      }

      let finalUrl = ad.destination_url;
      try {
        let u = finalUrl.trim();
        if (!/^https?:\/\//i.test(u)) u = "https://" + u;
        const parsed = new URL(u);
        if (!parsed.searchParams.has("utm_source"))
          parsed.searchParams.set("utm_source", "indihunt");
        if (!parsed.searchParams.has("utm_medium"))
          parsed.searchParams.set("utm_medium", "paid_ad");
        if (!parsed.searchParams.has("utm_campaign"))
          parsed.searchParams.set(
            "utm_campaign",
            ad.title
              ? ad.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")
              : "indihunt_billboard"
          );
        if (!parsed.searchParams.has("ref"))
          parsed.searchParams.set("ref", "indihunt_home");
        finalUrl = parsed.toString();
      } catch {
        finalUrl = finalUrl.includes("?")
          ? `${finalUrl}&utm_source=indihunt&utm_medium=paid_ad&utm_campaign=indihunt_billboard&ref=indihunt_home`
          : `${finalUrl}?utm_source=indihunt&utm_medium=paid_ad&utm_campaign=indihunt_billboard&ref=indihunt_home`;
      }

      return (
        <a
          href={finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleBillboardClick}
          className={linkClasses}
          suppressHydrationWarning
        >
          {content}
        </a>
      );
    }
    return <div className={linkClasses} suppressHydrationWarning>{content}</div>;
  }

  // Fallbacks
  if (type === "supabase_fallback") {
    return (
      <a
        href="https://supabase.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full overflow-hidden border border-emerald-500/30 shadow-md hover:border-emerald-500/60 group transition-all duration-300 bg-muted/40"
        suppressHydrationWarning
      >
        <div className="relative w-full" style={{ paddingBottom: "25%" }}>
          <Image
            src="/supabase_ad_banner.webp"
            alt="Supabase — Build in a weekend, scale to millions"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            width={1200}
            height={300}
            sizes="(max-width: 768px) 100vw, 1200px"
            quality={90}
          />
        </div>
        <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-emerald-500/90 text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
          Promoted Ad
        </div>
      </a>
    );
  }

  return (
    <Link
      href="/advertise"
      className="block relative w-full overflow-hidden border border-orange-500/30 shadow-md hover:border-orange-500/60 group transition-all duration-300 bg-muted/40"
      suppressHydrationWarning
    >
      <div className="relative w-full" style={{ paddingBottom: "25%" }}>
        <Image
          src="/indihunt_horizontal_banner.webp"
          alt="IndiHunt — Promoted Ad"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          width={1200}
          height={300}
          sizes="(max-width: 768px) 100vw, 1200px"
          quality={90}
        />
      </div>
      <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-orange-500/90 text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
        Promoted Ad
      </div>
    </Link>
  );
}
