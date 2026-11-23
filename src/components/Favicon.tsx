"use client";

/**
 * Favicon — 3-stage fallback logo component.
 *
 * Stage 1: src  (whatever is stored in logo_url — original scraped URL or Supabase public URL)
 * Stage 2: websiteUrl-derived Google Favicons API URL (zero our-egress, computed client-side)
 * Stage 3: /default-favicon.png  (local placeholder, always works)
 *
 * Uses a plain <img> (not Next <Image>) so we can set referrerPolicy and handle
 * cross-origin errors properly without a configured next.config domain list.
 */

import React, { useState, useEffect } from "react";

const DEFAULT_FAVICON = "/default-favicon.png";

function googleFaviconUrl(websiteUrl: string): string | null {
  try {
    const hostname = new URL(websiteUrl).hostname;
    if (!hostname || hostname === "indihunt.in") return null;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
}

type Stage = 0 | 1 | 2;

interface FaviconProps {
  /** Primary source — logo_url from the DB (stored URL or original scraped URL). */
  src: string | null | undefined;
  /** The product's website URL, used to compute a Google Favicons fallback. */
  websiteUrl?: string | null;
  /** Pixel dimensions (renders as width × height square). Defaults to 48. */
  size?: number;
  alt?: string;
  className?: string;
}

/**
 * Renders a product logo / favicon with 3-stage fallback:
 *   logo_url → Google Favicons (derived from website_url) → /default-favicon.png
 */
export default function Favicon({
  src,
  websiteUrl,
  size = 48,
  alt = "",
  className = "",
}: FaviconProps) {
  const [stage, setStage] = useState<Stage>(0);

  // Reset stage whenever the primary src or websiteUrl changes
  useEffect(() => {
    setStage(0);
  }, [src, websiteUrl]);

  function getUrl(s: Stage): string {
    if (s === 0 && src && src.trim().length > 0) {
      return src.trim();
    }
    if (s <= 1 && websiteUrl && websiteUrl.trim().length > 0) {
      const gf = googleFaviconUrl(websiteUrl.trim());
      if (gf) return gf;
    }
    return DEFAULT_FAVICON;
  }

  function handleError() {
    setStage((prev) => {
      const next = (prev + 1) as Stage;
      // If next stage still won't produce a different URL, jump to default
      if (next >= 2) return 2;
      // If stage 1 would give the same URL as stage 0 (no websiteUrl), skip to 2
      if (next === 1 && (!websiteUrl || !googleFaviconUrl(websiteUrl))) return 2;
      return next;
    });
  }

  const url = getUrl(stage);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
}
