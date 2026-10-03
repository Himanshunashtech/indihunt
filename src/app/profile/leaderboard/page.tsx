import React from "react";
import type { Metadata } from "next";
import { getKarmaLeaderboard, Profile } from "@/lib/supabase";
import ProfileLeaderboardClient from "./ProfileLeaderboardClient";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

const SITE_URL = "https://indihunt.in";

export const metadata: Metadata = {
  title: "Maker Karma & Community Leaderboard — IndiHunt",
  description: "Discover the top community makers and contributors on IndiHunt ranked by Karma Points, product launches, comments, and reviews.",
  alternates: {
    canonical: `${SITE_URL}/profile/leaderboard`,
  },
  openGraph: {
    title: "Maker Karma & Community Leaderboard | IndiHunt",
    description: "Discover the top community makers and contributors on IndiHunt ranked by Karma Points.",
    url: `${SITE_URL}/profile/leaderboard`,
    siteName: "IndiHunt",
    images: [{ url: `${SITE_URL}/og-image.webp`, width: 1200, height: 630, alt: "IndiHunt Maker Karma Leaderboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maker Karma & Community Leaderboard | IndiHunt",
    description: "Discover the top community makers and contributors on IndiHunt ranked by Karma Points.",
    images: [`${SITE_URL}/og-image.webp`],
  },
};

export default async function ProfileLeaderboardPage() {
  let leaders: Profile[] = [];
  try {
    leaders = await getKarmaLeaderboard(100);
  } catch {
    leaders = [];
  }

  // Schema.org ItemList for top makers
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Maker Karma Leaderboard",
    "description": "Top indie makers and community contributors on IndiHunt ranked by karma points.",
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
        "name": "Karma Leaderboard",
        "item": `${SITE_URL}/profile/leaderboard`,
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
      <ProfileLeaderboardClient initialLeaders={leaders} />
    </>
  );
}
