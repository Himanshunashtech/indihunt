import type { Metadata } from "next";
import { notFound, redirect, RedirectType } from "next/navigation";
import { getProductById, getProducts, getCachedProducts, calculateProductRank, getProductSlug, getSimilarProducts, getComments, type Product } from "@/lib/supabase";
import { getCachedData as getRedisCache } from "@/lib/redis";
import ProductDetailPageClient from "./ProductDetailPageClient";

export const revalidate = 60; // ISR: Revalidate page data at most every 60 seconds

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Product Not Found | IndiHunt" };

  const slug = getProductSlug(product.name);
  const shouldIndex =
    Boolean(product.description && product.description.length > 40) ||
    Boolean(product.upvotes_count && product.upvotes_count > 0) ||
    Boolean(product.maker_id) ||
    Boolean(product.website_url);

  return {
    title: `${product.name} – ${product.tagline || "Discover & Upvote"} | IndiHunt`,
    description: product.description || product.tagline || `Discover ${product.name} on IndiHunt.`,
    alternates: { canonical: `https://indihunt.in/products/${slug}` },
    robots: {
      index: shouldIndex,
      follow: true,
    },
    openGraph: {
      title: `${product.name} – ${product.tagline || "IndiHunt"}`,
      description: product.tagline || product.description,
      url: `https://indihunt.in/products/${slug}`,
      siteName: "IndiHunt",
      images: product.logo_url ? [{ url: product.logo_url }] : [{ url: "https://indihunt.in/og-image.webp" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} – ${product.tagline || "IndiHunt"}`,
      description: product.tagline || product.description,
      images: product.logo_url ? [product.logo_url] : ["https://indihunt.in/og-image.webp"],
    }
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const slug = getProductSlug(product.name);
  if (slug && id.toLowerCase() !== slug.toLowerCase()) {
    redirect(`/products/${slug}`, RedirectType.replace);
  }

  // Phase 2a PERF: Run Redis cache lookup + getComments in parallel — both are independent.
  // Redis 'public_products' is primed by the home page visit (TTL 5 min).
  // Falls back to in-memory cache then full getProducts() only on cold start.
  const [redisListResult, initialComments] = await Promise.all([
    getRedisCache<Product[]>('public_products'),
    getComments(product.id).catch(() => []),
  ]);

  let allProducts: Product[] = [];
  if (redisListResult && Array.isArray(redisListResult) && redisListResult.length > 0) {
    allProducts = redisListResult;
  } else {
    allProducts = getCachedProducts();
    if (!allProducts || allProducts.length === 0) {
      allProducts = await getProducts().catch(() => []);
    }
  }

  const rankDetails = calculateProductRank(product, allProducts.length > 0 ? allProducts : [product]);
  const similarProducts = getSimilarProducts(product, allProducts, 3);

  return (
    <ProductDetailPageClient
      id={id}
      initialProduct={product}
      initialSimilarProducts={similarProducts}
      initialComments={initialComments}
      initialReviews={[]}
      initialAlternatives={[]}
      initialAllProducts={allProducts}
      initialRank={rankDetails.rank}
      initialRankLabel={rankDetails.rankLabel}
      initialIsTopHunt={rankDetails.isTopHunt}
      initialPrevProd={rankDetails.prevProd}
      initialNextProd={rankDetails.nextProd}
    />
  );
}
