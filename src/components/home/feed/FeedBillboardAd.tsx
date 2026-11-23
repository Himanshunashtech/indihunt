"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BillboardAd } from "@/lib/supabase";

interface FeedBillboardAdProps {
  ad?: BillboardAd;
  type: "supabase_fallback" | "indihunt_fallback";
}

function BillboardCardContent({
  imageUrl,
  altText,
  badgeText = "Promoted Ad",
  badgeBg = "bg-slate-900/80",
}: {
  imageUrl: string;
  altText: string;
  badgeText?: string;
  badgeBg?: string;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      {/* Billboard image fills 100% naturally with zero dark space on left, right, top, or bottom */}
      <Image
        src={imageUrl}
        alt={altText}
        decoding="async"
        className="w-full h-auto block rounded-2xl transition-transform duration-500 group-hover:scale-[1.008]"
        width={1200}
        height={300}
        sizes="(max-width: 768px) 100vw, 1200px"
        quality={95}
        unoptimized
      />

      {/* Promoted Ad Badge */}
      <div
        className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 ${badgeBg} text-white text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md shadow-xs pointer-events-none`}
      >
        {badgeText}
      </div>
    </div>
  );
}

export default function FeedBillboardAd({
  ad,
  type,
}: FeedBillboardAdProps) {
  const linkClasses =
    "block relative w-full max-w-full overflow-hidden rounded-2xl border border-border/80 dark:border-border/60 shadow-xs hover:shadow-md hover:border-[#ff5733]/50 dark:hover:border-[#ff5733]/50 group transition-all duration-300";

  if (ad) {
    const isInternal = ad.destination_url?.startsWith("/") || (!ad.destination_url?.startsWith("http://") && !ad.destination_url?.startsWith("https://") && !ad.destination_url?.includes("."));

    const content = (
      <BillboardCardContent
        imageUrl={ad.image_url}
        altText={ad.title || "Promoted Ad"}
        badgeText="Promoted Ad"
        badgeBg="bg-slate-900/80"
      />
    );

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
        } catch { }
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
        className={linkClasses}
        suppressHydrationWarning
      >
        <BillboardCardContent
          imageUrl="/supabase_ad_banner.webp"
          altText="Supabase — Build in a weekend, scale to millions"
          badgeText="Promoted Ad"
          badgeBg="bg-emerald-500/90"
        />
      </a>
    );
  }

  return (
    <Link
      href="/advertise"
      className={linkClasses}
      suppressHydrationWarning
    >
      <BillboardCardContent
        imageUrl="/indihunt_horizontal_banner.webp"
        altText="IndiHunt — Promoted Ad"
        badgeText="Promoted Ad"
        badgeBg="bg-orange-500/90"
      />
    </Link>
  );
}
