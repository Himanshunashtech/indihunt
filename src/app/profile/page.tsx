import React from "react";
import type { Metadata } from "next";
import { getUserProfile, getUserProducts, Profile, Product } from "@/lib/supabase";
import ProfilePageClient from "./ProfilePageClient";

export const revalidate = 60; // ISR revalidation

const SITE_URL = "https://indihunt.in";

export const metadata: Metadata = {
  title: "Maker Profile & Portfolio — IndiHunt",
  description: "Explore maker journeys, launched products, karma streak, tech stack, and community discussions on IndiHunt.",
  alternates: {
    canonical: `${SITE_URL}/profile`,
  },
  openGraph: {
    title: "Maker Profile & Portfolio — IndiHunt",
    description: "Discover Indian indie builders, launched software, badges, and maker activity.",
    url: `${SITE_URL}/profile`,
    siteName: "IndiHunt",
    images: [{ url: `${SITE_URL}/og-image.webp`, width: 1200, height: 630, alt: "IndiHunt Maker Profile" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maker Profile & Portfolio — IndiHunt",
    description: "Discover Indian indie builders, launched software, badges, and maker activity.",
    images: [`${SITE_URL}/og-image.webp`],
  },
};

interface PageProps {
  searchParams?: Promise<{
    id?: string;
    target?: string;
    tab?: string;
  }>;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const queryUserId = resolvedSearchParams?.id || null;

  let initialProfile: Profile | null = null;
  let initialProducts: Product[] = [];

  if (queryUserId) {
    try {
      const [profileData, productsData] = await Promise.all([
        getUserProfile(queryUserId).catch(() => null),
        getUserProducts(queryUserId).catch(() => [] as Product[]),
      ]);
      initialProfile = profileData;
      initialProducts = productsData;
    } catch {
      // Fallback handled seamlessly by Client Component
    }
  }

  // Schema.org Breadcrumbs
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
        "name": initialProfile?.full_name || "Maker Profile",
        "item": `${SITE_URL}/profile${queryUserId ? `?id=${queryUserId}` : ""}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProfilePageClient
        initialUserId={queryUserId}
        initialProfile={initialProfile}
        initialProducts={initialProducts}
      />
    </>
  );
}
