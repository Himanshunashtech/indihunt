import React from "react";
import type { Metadata } from "next";
import { getProducts, Product, getProductSlug } from "@/lib/supabase";
import CategoryPageClient from "./CategoryPageClient";

export const revalidate = 60; // ISR: Revalidate page data every 60 seconds

const SITE_URL = "https://indihunt.in";

import { SLUG_TO_NAME, isProductInCategory } from "@/lib/categoryMatcher";

const ALL_CATEGORIES_PANEL = Object.entries(SLUG_TO_NAME).map(([slug, name]) => ({
  slug,
  name
}));

const DEFAULT_LOGOS = [
  { name: "Slack", logo_url: "https://logos.hunter.io/slack.com" },
  { name: "Notion", logo_url: "https://logos.hunter.io/notion.so" },
  { name: "Zoom", logo_url: "https://logos.hunter.io/zoom.us" },
  { name: "Airtable", logo_url: "https://logos.hunter.io/airtable.com" },
  { name: "Salesforce", logo_url: "https://logos.hunter.io/salesforce.com" },
  { name: "Framer", logo_url: "https://logos.hunter.io/framer.com" },
];

const MOCK_COMPANY_LOGOS: Record<string, { name: string; logo_url: string }[]> = {
  "saas": [
    { name: "Slack", logo_url: "https://logos.hunter.io/slack.com" },
    { name: "Notion", logo_url: "https://logos.hunter.io/notion.so" },
    { name: "Zoom", logo_url: "https://logos.hunter.io/zoom.us" },
    { name: "Airtable", logo_url: "https://logos.hunter.io/airtable.com" },
    { name: "Salesforce", logo_url: "https://logos.hunter.io/salesforce.com" },
    { name: "Framer", logo_url: "https://logos.hunter.io/framer.com" },
  ],
  "artificial-intelligence": [
    { name: "OpenAI", logo_url: "https://logos.hunter.io/openai.com" },
    { name: "Anthropic", logo_url: "https://logos.hunter.io/anthropic.com" },
    { name: "Gemini", logo_url: "https://logos.hunter.io/google.com" },
    { name: "Perplexity AI", logo_url: "https://logos.hunter.io/perplexity.ai" },
    { name: "DeepSeek", logo_url: "https://logos.hunter.io/deepseek.com" },
    { name: "Hugging Face", logo_url: "https://logos.hunter.io/huggingface.co" },
  ],
  "productivity": [
    { name: "Notion", logo_url: "https://logos.hunter.io/notion.so" },
    { name: "Linear", logo_url: "https://logos.hunter.io/linear.app" },
    { name: "Asana", logo_url: "https://logos.hunter.io/asana.com" },
    { name: "Trello", logo_url: "https://logos.hunter.io/trello.com" },
    { name: "ClickUp", logo_url: "https://logos.hunter.io/clickup.com" },
    { name: "Calendly", logo_url: "https://logos.hunter.io/calendly.com" },
  ],
  "developer-tools": [
    { name: "Vercel", logo_url: "https://logos.hunter.io/vercel.com" },
    { name: "GitHub", logo_url: "https://logos.hunter.io/github.com" },
    { name: "Docker", logo_url: "https://logos.hunter.io/docker.com" },
    { name: "Kubernetes", logo_url: "https://logos.hunter.io/kubernetes.io" },
    { name: "VS Code", logo_url: "https://logos.hunter.io/visualstudio.com" },
    { name: "Postman", logo_url: "https://logos.hunter.io/postman.com" },
  ],
  "ai-coding-agents": [
    { name: "Cursor", logo_url: "https://logos.hunter.io/cursor.com" },
    { name: "Windsurf", logo_url: "https://logos.hunter.io/codeium.com" },
    { name: "Devin", logo_url: "https://logos.hunter.io/cognition-labs.com" },
    { name: "Sweep", logo_url: "https://logos.hunter.io/sweep.dev" },
    { name: "OpenHands", logo_url: "https://logos.hunter.io/all-hands.dev" },
  ]
};

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const categoryName = SLUG_TO_NAME[slug] || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const canonicalUrl = `${SITE_URL}/categories/${slug}`;

  return {
    title: `Best ${categoryName} in 2026 – Reviews, Top Tools & Leaderboard | IndiHunt`,
    description: `Discover top ${categoryName} tools on IndiHunt. Fully evaluated based on community ratings, maker activities, feature quality scores, and verified user reviews.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Best ${categoryName} in 2026 | IndiHunt`,
      description: `Discover and compare the best ${categoryName} tools and startups on IndiHunt.`,
      url: canonicalUrl,
      siteName: "IndiHunt",
      images: [{ url: `${SITE_URL}/og-image.webp`, width: 1200, height: 630, alt: `${categoryName} on IndiHunt` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Best ${categoryName} in 2026 | IndiHunt`,
      description: `Discover and compare top ${categoryName} products.`,
      images: [`${SITE_URL}/og-image.webp`],
    }
  };
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { category: slug } = await params;
  const categoryName = SLUG_TO_NAME[slug] || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Fetch all live products on the server
  const allProducts = await getProducts().catch(() => [] as Product[]);

  // Server-side filtering
  const categoryProducts = allProducts.filter(p => isProductInCategory(p, slug, categoryName));

  const logosToShow = MOCK_COMPANY_LOGOS[slug] || DEFAULT_LOGOS;

  const faqItems = [
    {
      question: `What are the best ${categoryName} tools launched on IndiHunt?`,
      answer: `The top-rated ${categoryName} tools on IndiHunt are ranked based on real community upvotes, feature quality scores, developer streaks, and authentic user reviews.`
    },
    {
      question: `How can I launch my ${categoryName} tool on IndiHunt?`,
      answer: `You can submit and launch your product for free on IndiHunt by clicking 'Submit Product'. Your launch will be featured on the daily discovery feed and indexed under ${categoryName}.`
    },
    {
      question: `Are products in ${categoryName} free or paid?`,
      answer: `The ${categoryName} directory features a mix of 100% free, freemium, open-source, and paid subscription software products with transparent pricing tags.`
    }
  ];

  // Breadcrumb JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Categories",
        "item": `${SITE_URL}/categories`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryName,
        "item": `${SITE_URL}/categories/${slug}`
      }
    ]
  };

  // ItemList JSON-LD
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Best ${categoryName} in 2026`,
    "description": `Top-ranked ${categoryName} software products and platforms on IndiHunt.`,
    "itemListElement": categoryProducts.slice(0, 20).map((p, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": p.name,
      "description": p.tagline || p.description,
      "url": `${SITE_URL}/products/${getProductSlug(p.name)}`,
      "image": p.logo_url || `${SITE_URL}/og-image.webp`
    }))
  };

  // FAQPage JSON-LD
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Semantic Crawlability Layer for Bots */}
      <div className="sr-only" aria-hidden="true">
        <h1>The best {categoryName} in 2026</h1>
        <p>Discover and select from the leading tools and platforms in {categoryName}. Products count: {categoryProducts.length}.</p>
        <section>
          <h2>Top {categoryName} Products</h2>
          <ul>
            {categoryProducts.map(p => (
              <li key={p.id}>
                <a href={`/products/${getProductSlug(p.name)}`}>{p.name}</a> — {p.tagline} ({p.upvotes_count || 0} upvotes)
              </li>
            ))}
          </ul>
        </section>
      </div>

      <CategoryPageClient
        slug={slug}
        categoryName={categoryName}
        initialProducts={categoryProducts}
        allCategories={ALL_CATEGORIES_PANEL}
        logosToShow={logosToShow}
        faqItems={faqItems}
      />
    </>
  );
}
