import type { Metadata } from "next";
import { getPaginatedProducts } from "@/lib/supabase";
import { resolveBestProductsDate } from "../utils";
import BestProductsClient from "./BestProductsClient";

interface PageProps {
  params: Promise<{
    params?: string[];
  }>;
}

const baseUrl = "https://indihunt.in";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const rawParams = Array.isArray(resolved.params) ? resolved.params : [];
  const { period, displayDate, startDate, endDate, rawDay } = resolveBestProductsDate(rawParams);

  // Check if products exist for this period
  const res = await getPaginatedProducts({
    page: 1,
    limit: 1,
    sort: "upvotes",
    startDate,
    endDate,
  });

  const hasProducts = (res?.totalCount || 0) > 0;

  // IMPORTANT:
  // If a specific daily date is requested (or week sub-slice), or if no products exist for this date:
  // Set robots: { index: false, follow: true } so search engines never index thin/empty archive pages or flag them as Soft 404!
  const isSpecificDaily = period === "daily" && rawDay !== null;
  const isWeeklySubSlice = period === "weekly" && rawDay !== null;
  const shouldNoIndex = !hasProducts || isSpecificDaily || isWeeklySubSlice;

  if (shouldNoIndex) {
    return {
      title: `Best Products of ${displayDate} — IndiHunt`,
      description: `Leaderboard and rankings for ${displayDate} on IndiHunt.`,
      robots: {
        index: false,
        follow: true,
        googleBot: {
          index: false,
          follow: true,
        },
      },
    };
  }

  const title = `Best Products of ${displayDate} — IndiHunt`;
  const description = `The highest-rated and most upvoted tech products for ${displayDate} on IndiHunt. Discover the top SaaS tools, AI products, and developer tools.`;
  const canonicalUrl = `${baseUrl}/best-products/${rawParams.join("/")}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "IndiHunt",
      type: "website",
      images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.webp"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BestProductsPage({ params }: PageProps) {
  const resolved = await params;
  const rawParams = Array.isArray(resolved.params) ? resolved.params : [];
  const { startDate, endDate } = resolveBestProductsDate(rawParams);

  let initialProducts: any[] = [];
  let initialTotalCount = 0;

  try {
    const res = await getPaginatedProducts({
      page: 1,
      limit: 20,
      sort: "upvotes",
      startDate,
      endDate,
    });
    initialProducts = res?.products || [];
    initialTotalCount = res?.totalCount || 0;
  } catch (e) {
    console.error("Failed to fetch initial best products on server:", e);
  }

  return (
    <BestProductsClient
      initialProducts={initialProducts}
      initialTotalCount={initialTotalCount}
    />
  );
}
