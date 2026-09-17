import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Script from "next/script";

const baseUrl = "https://indihunt.in";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    username: string;
  }>;
}

async function fetchIndiePageForSeo(cleanUsername: string) {
  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, products(id, name, tagline, logo_url, website_url)")
        .ilike("username", cleanUsername)
        .maybeSingle();

      if (profile) return profile;
    }
  } catch (e) {
    console.error("Error fetching SEO indie page:", e);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = username ? decodeURIComponent(username).replace(/^@/, "") : "";
  const profile = await fetchIndiePageForSeo(cleanUsername);

  const displayName = profile?.full_name || `@${cleanUsername}`;
  const title = `${displayName} — Products & Maker Portfolio | IndiHunt`;
  const bio = profile?.headline || profile?.bio || `Discover products, open-source tools, and projects built by ${displayName} on IndiHunt.`;
  const canonicalUrl = `${baseUrl}/page/${cleanUsername}`;
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

export default async function IndiePageLayout({ children, params }: LayoutProps) {
  const { username } = await params;
  const cleanUsername = username ? decodeURIComponent(username).replace(/^@/, "") : "";
  const profile = await fetchIndiePageForSeo(cleanUsername);

  const displayName = profile?.full_name || `@${cleanUsername}`;
  const canonicalUrl = `${baseUrl}/page/${cleanUsername}`;

  // Breadcrumb schema
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Makers", "item": `${baseUrl}/makers` },
      { "@type": "ListItem", "position": 3, "name": `${displayName}'s Portfolio`, "item": canonicalUrl },
    ],
  };

  // Person schema
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
      ...(profile?.website_url && { "sameAs": [profile.website_url] }),
    },
  };

  return (
    <>
      <Script
        id={`jsonld-indie-bc-${cleanUsername}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id={`jsonld-indie-person-${cleanUsername}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      {children}
    </>
  );
}
