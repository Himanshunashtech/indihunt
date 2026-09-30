import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache as reactCache } from "react";
import { createClient } from "@supabase/supabase-js";
import ProfilePage from "@/app/profile/page";
import Script from "next/script";

const baseUrl = "https://indihunt.in";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

import { MOCK_PROFILES } from "@/lib/supabase";

// React cache memoization ensures generateMetadata and UsernameProfilePage share the single query
const fetchProfileForSeo = reactCache(async (cleanUsername: string) => {
  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", cleanUsername)
        .maybeSingle();

      if (profile && !error) return profile;
      if (error) {
        console.error("Error fetching SEO profile from Supabase:", error);
      }
    }
  } catch (e) {
    console.error("Error fetching SEO profile:", e);
  }

  // Fallback to MOCK_PROFILES if database lookup fails
  const found = Object.values(MOCK_PROFILES).find(
    (p) => p.username?.toLowerCase() === cleanUsername.toLowerCase()
  );
  return found || null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const decoded = username ? decodeURIComponent(username) : "";

  if (!decoded.startsWith("@")) {
    return { title: "User Profile — IndiHunt" };
  }

  const cleanUsername = decoded.replace(/^@/, "");
  const profile = await fetchProfileForSeo(cleanUsername);

  if (!profile) {
    return {
      title: "User Not Found — IndiHunt",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const displayName = profile?.full_name || `@${cleanUsername}`;
  const title = `${displayName} (@${cleanUsername}) — IndiHunt`;
  const bio = profile?.headline || profile?.bio || `Explore launches, tech stacks, and discussions by @${cleanUsername} on IndiHunt.`;
  const canonicalUrl = `${baseUrl}/@${cleanUsername}`;
  const avatarUrl = profile?.avatar_url || `${baseUrl}/og-image.webp`;

  return {
    title,
    description: bio.length > 160 ? bio.slice(0, 157) + "…" : bio,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description: bio,
      url: canonicalUrl,
      siteName: "IndiHunt",
      type: "profile",
      username: cleanUsername,
      images: [
        {
          url: avatarUrl,
          width: 800,
          height: 800,
          alt: displayName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: bio,
      images: [avatarUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function UsernameProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  const username = resolvedParams.username ? decodeURIComponent(resolvedParams.username) : "";
  
  // profile pages must start with '@' to avoid colliding with other dynamic/static top-level paths
  if (!username.startsWith("@")) {
    notFound();
  }

  const cleanUsername = username.replace(/^@/, "");
  const profile = await fetchProfileForSeo(cleanUsername);

  if (!profile) {
    notFound();
  }

  let initialProducts: any[] = [];
  if (profile) {
    try {
      const supabase = getServiceSupabase();
      if (supabase) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, name, tagline, logo_url, website_url, category, tags, upvotes_count, comments_count, created_at, status, scheduled_for, maker_id")
          .eq("maker_id", profile.id)
          .order("upvotes_count", { ascending: false });
        if (prods && prods.length > 0) {
          initialProducts = prods.map(p => ({ ...p, maker: profile }));
        }
      }
    } catch (e) {
      console.error("Error fetching maker products for SSR profile:", e);
    }
  }

  const canonicalUrl = `${baseUrl}/@${cleanUsername}`;
  const displayName = profile?.full_name || `@${cleanUsername}`;

  // Schema.org Person & ProfilePage
  const personLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": displayName,
      "alternateName": `@${cleanUsername}`,
      "identifier": cleanUsername,
      "url": canonicalUrl,
      ...(profile?.avatar_url && { "image": profile.avatar_url }),
      ...(profile?.bio && { "description": profile.bio }),
      ...(profile?.job_title && { "jobTitle": profile.job_title }),
      ...(profile?.website && { "sameAs": [profile.website] }),
      ...(!(profile?.website) && (profile as any)?.website_url && { "sameAs": [(profile as any).website_url] }),
    },
  };

  // Breadcrumbs schema
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Makers", "item": `${baseUrl}/makers` },
      { "@type": "ListItem", "position": 3, "name": displayName, "item": canonicalUrl },
    ],
  };

  return (
    <>
      <Script
        id={`jsonld-profile-${cleanUsername}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <Script
        id={`jsonld-profile-bc-${cleanUsername}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ProfilePage
        initialUsername={cleanUsername}
        initialProfile={profile}
        initialProducts={initialProducts}
      />
    </>
  );
}
