import React from "react";
import type { Metadata } from "next";
import { getLaunchInsights, getProductSlug } from "@/lib/supabase";
import LaunchInsightsClient from "./LaunchInsightsClient";

export const revalidate = 300; // ISR: Revalidate launch insights every 5 minutes

const SITE_URL = "https://indihunt.in";

interface PageProps {
  params: Promise<{ year: string; month: string; day: string }>;
}

function formatFormattedDate(y: string, m: string, d: string): string {
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  if (isNaN(dateObj.getTime())) return `Thursday, July 30th 2026`;

  const dayNum = dateObj.getDate();
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = dateObj.toLocaleDateString("en-US", { month: "long" });
  return `${dayName}, ${monthName} ${getOrdinal(dayNum)} ${dateObj.getFullYear()}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, month, day } = await params;
  const displayDateText = formatFormattedDate(year, month, day);
  const canonicalUrl = `${SITE_URL}/launch-insights/${year}/${month}/${day}`;

  return {
    title: `Launch Insights — ${displayDateText} | IndiHunt`,
    description: `Detailed daily launch analytics, upvote trajectories, top products, and maker insights for ${displayDateText} on IndiHunt.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Launch Insights — ${displayDateText} | IndiHunt`,
      description: `Daily leaderboard analytics, upvotes, and comments breakdown for ${displayDateText}.`,
      url: canonicalUrl,
      siteName: "IndiHunt",
      images: [{ url: `${SITE_URL}/og-image.webp` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Launch Insights — ${displayDateText} | IndiHunt`,
      description: `Daily launch metrics and top product trajectories for ${displayDateText}.`,
      images: [`${SITE_URL}/og-image.webp`],
    }
  };
}

export default async function LaunchInsightsDatePage({ params }: PageProps) {
  const { year, month, day } = await params;
  const dateFormattedStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const displayDateText = formatFormattedDate(year, month, day);

  const res = await getLaunchInsights(dateFormattedStr);
  const top20Products = res.products.slice(0, 20);
  const data = { ...res, products: top20Products };

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
        "name": "Launch Insights",
        "item": `${SITE_URL}/launch-insights`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": displayDateText,
        "item": `${SITE_URL}/launch-insights/${year}/${month}/${day}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Semantic Crawlability Layer for Search Engines */}
      <div className="sr-only" aria-hidden="true">
        <h1>Launch Insights — {displayDateText}</h1>
        <p>The most popular products launched on IndiHunt for {displayDateText}. Total products tracked: {data.products.length}.</p>

        <section>
          <h2>Top Upvoted Products for {displayDateText}</h2>
          <ul>
            {data.products.map(p => (
              <li key={p.id}>
                <a href={`/products/${getProductSlug(p.name)}`}>{p.name}</a> — {p.tagline} ({p.upvotes_count || 0} upvotes, {p.comments_count || 0} comments)
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Most Points Leader</h2>
          <p>{data.mostPoints?.product?.name} ({data.mostPoints?.points} points)</p>
        </section>

        <section>
          <h2>Most Comments Leader</h2>
          <p>{data.mostComments?.product?.name} ({data.mostComments?.comments} comments)</p>
        </section>
      </div>

      <LaunchInsightsClient
        year={year}
        month={month}
        day={day}
        displayDateText={displayDateText}
        initialData={data}
      />
    </>
  );
}
