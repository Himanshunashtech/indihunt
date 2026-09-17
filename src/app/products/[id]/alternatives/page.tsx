import React from "react";
import type { Metadata } from "next";
import { notFound, redirect, RedirectType } from "next/navigation";
import { getProductById, getProducts, calculateProductRank, getReviews, getAlternatives, getProductSlug } from "@/lib/supabase";
import ProductDetailPageClient from "../ProductDetailPageClient";

export const revalidate = 60;

const SITE_URL = "https://indihunt.in";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Alternatives Not Found | IndiHunt" };

  const slug = getProductSlug(product.name);
  const title = `Top ${product.name} Alternatives & Competitors in 2026 | IndiHunt`;
  const description = `Discover and compare the best alternatives to ${product.name} in 2026. Explore features, pricing, community upvotes, and authentic user reviews.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/products/${slug}/alternatives`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/products/${slug}/alternatives`,
      siteName: "IndiHunt",
      images: product.logo_url ? [{ url: product.logo_url }] : [{ url: `${SITE_URL}/og-image.webp` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.logo_url ? [product.logo_url] : [`${SITE_URL}/og-image.webp`],
    }
  };
}

export default async function ProductAlternativesPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const slug = getProductSlug(product.name);
  if (slug && id.toLowerCase() !== slug.toLowerCase()) {
    redirect(`/products/${slug}/alternatives`, RedirectType.replace);
  }

  const [reviews, alternatives] = await Promise.all([
    getReviews(product.id).catch(() => []),
    getAlternatives(product.id).catch(() => [])
  ]);

  const rankDetails = calculateProductRank(product, [product]);

  return (
    <ProductDetailPageClient
      id={id}
      initialTab="Alternatives"
      initialProduct={product}
      initialAllProducts={[product]}
      initialReviews={reviews}
      initialAlternatives={alternatives}
      initialRank={rankDetails.rank}
      initialRankLabel={rankDetails.rankLabel}
      initialIsTopHunt={rankDetails.isTopHunt}
      initialPrevProd={rankDetails.prevProd}
      initialNextProd={rankDetails.nextProd}
      initialCohortProducts={rankDetails.cohortProducts}
    />
  );
}
