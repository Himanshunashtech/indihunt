import React from "react";
import type { Metadata } from "next";
import { getStreakLeaderboard, Profile } from "@/lib/supabase";
import ProfileStreakClient from "./ProfileStreakClient";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

const SITE_URL = "https://indihunt.in";

export const metadata: Metadata = {
  title: "Maker Streaks & Daily Builder Leaderboard — IndiHunt",
  description: "Check the longest active maker streaks on IndiHunt. Stay active daily to build consistency, earn maker badges, and climb the leaderboard.",
  alternates: {
    canonical: `${SITE_URL}/profile/streak`,
  },
  openGraph: {
    title: "Maker Streaks & Daily Builder Leaderboard | IndiHunt",
    description: "Check the longest active maker streaks and daily indie builders on IndiHunt.",
    url: `${SITE_URL}/profile/streak`,
    siteName: "IndiHunt",
    images: [{ url: `${SITE_URL}/og-image.webp`, width: 1200, height: 630, alt: "IndiHunt Maker Streaks Leaderboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maker Streaks & Daily Builder Leaderboard | IndiHunt",
    description: "Check the longest active maker streaks and daily indie builders on IndiHunt.",
    images: [`${SITE_URL}/og-image.webp`],
  },
};

export default async function ProfileStreakPage() {
  let leaders: Profile[] = [];
  try {
    leaders = await getStreakLeaderboard(100);
    console.log(`[ProfileStreakPage SSR] fetched ${leaders.length} leaders for Streak Leaderboard`);
  } catch (err: any) {
    console.error('[ProfileStreakPage SSR Error]:', err?.message);
    leaders = [];
  }

  // Schema.org ItemList for top streak makers
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Maker Streaks Leaderboard",
    "description": "Leaderboard of indie makers with the longest active daily streaks on IndiHunt.",
    "itemListElement": (leaders || []).slice(0, 20).map((maker, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": maker.full_name || maker.username || "Maker",
      "url": `${SITE_URL}/@${(maker.username || "maker").replace(/^@/, "")}`,
      "image": maker.avatar_url || `${SITE_URL}/og-image.webp`,
    })),
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Makers",
        "item": `${SITE_URL}/makers`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Maker Streaks",
        "item": `${SITE_URL}/profile/streak`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProfileStreakClient initialLeaders={leaders} />
    </>
  );
}
