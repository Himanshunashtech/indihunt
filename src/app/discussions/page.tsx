import React from "react";
import type { Metadata } from "next";
import { getThreads, Thread } from "@/lib/supabase";
import DiscussionsClient from "./DiscussionsClient";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

const SITE_URL = "https://indihunt.in";

export const metadata: Metadata = {
  title: "Community Discussions & Maker Forum | IndiHunt",
  description: "Join the IndiHunt maker forum — discuss startups, AI tools, vibe coding, growth tips, and connect with builders worldwide.",
  alternates: {
    canonical: `${SITE_URL}/discussions`,
  },
  openGraph: {
    title: "Community Discussions & Maker Forum | IndiHunt",
    description: "Join the IndiHunt maker forum — discuss startups, AI tools, vibe coding, growth tips, and connect with builders worldwide.",
    url: `${SITE_URL}/discussions`,
    siteName: "IndiHunt",
    images: [{ url: `${SITE_URL}/og-image.webp`, width: 1200, height: 630, alt: "IndiHunt Community Discussions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Discussions & Maker Forum | IndiHunt",
    description: "Join the IndiHunt maker forum — discuss startups, tech, and connect with global builders.",
    images: [`${SITE_URL}/og-image.webp`],
  },
};

export default async function DiscussionsPage() {
  let initialThreads: Thread[] = [];
  try {
    initialThreads = await getThreads();
  } catch {
    initialThreads = [];
  }

  // Schema.org ItemList Schema for forum threads
  const discussionItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "IndiHunt Community Discussions",
    "description": "Trending startup and maker discussion threads on IndiHunt.",
    "itemListElement": (initialThreads || []).slice(0, 20).map((thread, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": thread.title,
      "url": `${SITE_URL}/threads/${thread.id}`,
    })),
  };

  // Breadcrumbs schema
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
        "name": "Discussions",
        "item": `${SITE_URL}/discussions`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(discussionItemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DiscussionsClient initialThreads={initialThreads} />
    </>
  );
}
