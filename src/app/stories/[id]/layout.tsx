import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { getProductSlug } from "@/lib/supabase";
import Script from "next/script";

const baseUrl = "https://indihunt.in";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchStoryForSeo(idOrSlug: string) {
  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      // 1. Direct ID lookup
      let { data: story } = await supabase
        .from("stories")
        .select("*, author:profiles!author_id(*)")
        .eq("id", idOrSlug)
        .maybeSingle();

      // 2. Slug lookup if direct ID lookup fails
      if (!story) {
        const { data: allStories } = await supabase
          .from("stories")
          .select("*, author:profiles!author_id(*)");
        if (allStories) {
          story = allStories.find(
            (s: any) => (s.title && getProductSlug(s.title) === idOrSlug.toLowerCase()) || s.id === idOrSlug
          ) || null;
        }
      }

      if (story) return story;
    }
  } catch (e) {
    console.error("Error fetching SEO story:", e);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const story = await fetchStoryForSeo(id);

  if (!story) {
    return {
      title: "Maker Story — IndiHunt",
      description: "Read inspiring maker stories on IndiHunt — how indie developers and startup founders built, launched, and grew their products.",
    };
  }

  const slug = story.title ? getProductSlug(story.title) : story.id;
  const canonicalUrl = `${baseUrl}/stories/${slug}`;
  const title = `${story.title} — Maker Story | IndiHunt`;
  const rawExcerpt = story.excerpt || story.content || "";
  const description = rawExcerpt.length > 160 ? rawExcerpt.slice(0, 157).replace(/\n/g, " ") + "…" : rawExcerpt.replace(/\n/g, " ");

  const authorName = story.author?.full_name || story.author?.username || "Indie Maker";
  const coverImage = story.cover_image || story.author?.avatar_url || `${baseUrl}/og-image.webp`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "IndiHunt",
      type: "article",
      publishedTime: story.published_at || story.created_at,
      authors: [authorName],
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverImage],
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

export default async function StoryDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await fetchStoryForSeo(id);

  if (!story) return <>{children}</>;

  const slug = story.title ? getProductSlug(story.title) : story.id;
  const canonicalUrl = `${baseUrl}/stories/${slug}`;
  const authorName = story.author?.full_name || story.author?.username || "Indie Maker";
  const coverImage = story.cover_image || story.author?.avatar_url || `${baseUrl}/og-image.webp`;

  // Breadcrumbs schema
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Stories", "item": `${baseUrl}/stories` },
      { "@type": "ListItem", "position": 3, "name": story.title, "item": canonicalUrl },
    ],
  };

  // Article schema for Google Search & Discover rich results
  const articleLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": story.title,
    "description": story.excerpt || story.title,
    "image": coverImage,
    "datePublished": story.published_at || story.created_at,
    "dateModified": story.updated_at || story.published_at || story.created_at,
    "url": canonicalUrl,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": story.author?.username ? `${baseUrl}/@${story.author.username}` : canonicalUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "IndiHunt",
      "url": baseUrl,
      "logo": `${baseUrl}/favicon.webp`,
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return (
    <>
      <Script
        id={`jsonld-story-bc-${story.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id={`jsonld-story-art-${story.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      {children}
    </>
  );
}
