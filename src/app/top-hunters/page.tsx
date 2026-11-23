import React from "react";
import type { Metadata } from "next";
import { getTopHuntersData, getProducts, Hunter, Product } from "@/lib/supabase";
import TopHuntersClient from "./TopHuntersClient";

export const revalidate = 60; // ISR: Revalidate page data every 60 seconds

const SITE_URL = "https://indihunt.in";

export const metadata: Metadata = {
  title: "Top Product Hunters & Makers Leaderboard in 2026 | IndiHunt",
  description: "Discover the top indie product hunters and creators on IndiHunt. Ranked by verified launches, community upvotes, maker discussions, and #1 placements.",
  alternates: {
    canonical: `${SITE_URL}/top-hunters`,
  },
  openGraph: {
    title: "Top Product Hunters & Makers Leaderboard | IndiHunt",
    description: "Explore the most influential product hunters and software makers in the indie ecosystem.",
    url: `${SITE_URL}/top-hunters`,
    siteName: "IndiHunt",
    images: [{ url: `${SITE_URL}/og-image.webp`, width: 1200, height: 630, alt: "IndiHunt Top Hunters Leaderboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Product Hunters & Makers Leaderboard | IndiHunt",
    description: "Explore the most influential product hunters and software makers.",
    images: [`${SITE_URL}/og-image.webp`],
  },
};

export default async function TopHuntersPage() {
  // Fetch initial data on the server in parallel
  const [hunters, products] = await Promise.all([
    getTopHuntersData("all_time").catch(() => [] as Hunter[]),
    getProducts().catch(() => [] as Product[]),
  ]);

  // JSON-LD ItemList Schema for Top Hunters Leaderboard
  const topHuntersItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Top Product Hunters on IndiHunt",
    "description": "Leaderboard of top product hunters and indie makers on IndiHunt ranked by hunts, upvotes, and engagement.",
    "itemListElement": hunters.slice(0, 20).map((hunter, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": hunter.name || hunter.username,
      "url": `${SITE_URL}/@${(hunter.username || "maker").replace(/^@/, "")}`,
      "image": hunter.avatar_url || `${SITE_URL}/og-image.webp`,
      "description": `${hunter.name} has hunted ${hunter.hunts_count || 0} products with ${hunter.upvotes_count || 0} total upvotes on IndiHunt.`,
    })),
  };

  // Breadcrumb Schema
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
        "name": "Top Hunters",
        "item": `${SITE_URL}/top-hunters`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(topHuntersItemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Semantic Crawlability Layer for Bots */}
      <div className="sr-only" aria-hidden="true">
        <h1>Top IndiHunt Hunters & Makers Leaderboard</h1>
        <p>The highest-voted hunters and top products built by makers across India and global indie tech.</p>
        <section>
          <h2>Top Ranked Hunters</h2>
          <ol>
            {hunters.slice(0, 30).map((hunter, idx) => (
              <li key={hunter.id || idx}>
                <a href={`/@${(hunter.username || "maker").replace(/^@/, "")}`}>{hunter.name}</a> — @{hunter.username} ({hunter.hunts_count || 0} hunts, {hunter.upvotes_count || 0} upvotes)
              </li>
            ))}
          </ol>
        </section>
      </div>

      <TopHuntersClient
        initialHunters={hunters}
        initialProducts={products}
      />
    </>
  );
}
