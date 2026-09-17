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

async function fetchThreadForSeo(idOrSlug: string) {
  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      // 1. Direct ID lookup
      let { data: thread } = await supabase
        .from("threads")
        .select("*, user:profiles(*), product:products(*)")
        .eq("id", idOrSlug)
        .maybeSingle();

      // 2. Slug lookup if direct ID lookup fails
      if (!thread) {
        const { data: allThreads } = await supabase
          .from("threads")
          .select("*, user:profiles(*), product:products(*)");
        if (allThreads) {
          thread = allThreads.find(
            (t: any) => (t.title && getProductSlug(t.title) === idOrSlug.toLowerCase()) || t.id === idOrSlug
          ) || null;
        }
      }

      if (thread) return thread;
    }
  } catch (e) {
    console.error("Error fetching SEO thread:", e);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const thread = await fetchThreadForSeo(id);

  if (!thread) {
    return {
      title: "Community Thread — IndiHunt",
      description: "Read and join the discussion on IndiHunt — tech products, founder updates, growth tactics, and builder conversations.",
    };
  }

  const slug = thread.title ? getProductSlug(thread.title) : thread.id;
  const canonicalUrl = `${baseUrl}/threads/${slug}`;
  const title = `${thread.title} — IndiHunt Discussions`;
  const rawBody = thread.body || thread.title || "";
  const description = rawBody.length > 160 ? rawBody.slice(0, 157).replace(/\n/g, " ") + "…" : rawBody.replace(/\n/g, " ");

  const authorName = thread.user?.full_name || thread.user?.username || "Maker";
  const authorAvatar = thread.user?.avatar_url;

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
      images: [
        {
          url: authorAvatar || `${baseUrl}/og-image.webp`,
          width: 1200,
          height: 630,
          alt: thread.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [authorAvatar || `${baseUrl}/og-image.webp`],
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

export default async function ThreadDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await fetchThreadForSeo(id);

  if (!thread) return <>{children}</>;

  const slug = thread.title ? getProductSlug(thread.title) : thread.id;
  const canonicalUrl = `${baseUrl}/threads/${slug}`;
  const forumId = thread.forum_id || "general";

  // Breadcrumbs schema
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Discussions", "item": `${baseUrl}/discussions` },
      { "@type": "ListItem", "position": 3, "name": `p/${forumId}`, "item": `${baseUrl}/discussions?forum=${forumId}` },
      { "@type": "ListItem", "position": 4, "name": thread.title, "item": canonicalUrl },
    ],
  };

  // DiscussionForumPosting schema for Google SERP rich results
  const forumPostingLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": thread.title,
    "articleBody": thread.body,
    "url": canonicalUrl,
    "datePublished": thread.created_at,
    "author": {
      "@type": "Person",
      "name": thread.user?.full_name || thread.user?.username || "Maker",
      "url": thread.user?.username ? `${baseUrl}/@${thread.user.username}` : canonicalUrl,
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": thread.upvotes_count || 0,
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": thread.comments_count || 0,
      },
    ],
    "publisher": {
      "@type": "Organization",
      "name": "IndiHunt",
      "url": baseUrl,
      "logo": `${baseUrl}/favicon.webp`,
    },
  };

  return (
    <>
      <Script
        id={`jsonld-thread-bc-${thread.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id={`jsonld-thread-post-${thread.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(forumPostingLd) }}
      />
      {children}
    </>
  );
}
