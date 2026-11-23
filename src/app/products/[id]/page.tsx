import { notFound, redirect, RedirectType } from "next/navigation";
import {
  getProductSlug,
  getProductRankServerDirect,
  type Product,
} from "@/lib/supabase";
import { getProductCached } from "@/lib/product-cache";
import ProductDetailPageClient from "./ProductDetailPageClient";

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Fetch only the target product
  const product = await getProductCached(id);

  if (!product) notFound();

  const slug = getProductSlug(product.name);
  if (slug && id.toLowerCase() !== slug.toLowerCase()) {
    redirect(`/products/${slug}`, RedirectType.replace);
  }

  // 2. Compute rank & similar products server-side using small targeted cohort query (NO 300 products!)
  const { rankDetails, similarProducts } = await getProductRankServerDirect(product);

  return (
    <ProductDetailPageClient
      id={id}
      initialProduct={product}
      initialSimilarProducts={similarProducts}
      initialComments={[]}
      initialReviews={[]}
      initialAlternatives={[]}
      initialAllProducts={[]}
      initialRank={rankDetails.rank}
      initialRankLabel={rankDetails.rankLabel}
      initialIsTopHunt={rankDetails.isTopHunt}
      initialPrevProd={rankDetails.prevProd}
      initialNextProd={rankDetails.nextProd}
      initialCohortProducts={rankDetails.cohortProducts}
    />
  );
}
