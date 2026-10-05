import { notFound, redirect, RedirectType } from "next/navigation";
import {
  supabase,
  getProductSlug,
  getSimilarProducts,
  calculateProductRank,
  getCachedProducts,
  getHomeProductsDirect,
  type Product,
} from "@/lib/supabase";
import { getProductCached } from "@/lib/product-cache";
import ProductDetailPageClient from "./ProductDetailPageClient";

export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

// pre-render top products at build so first visit is instant
export async function generateStaticParams() {
  try {
    let list = await getHomeProductsDirect(50).catch(() => [] as Product[]);
    if (!list.length && supabase) {
      const { data } = await supabase
        .from("products")
        .select("name")
        .order("upvotes_count", { ascending: false })
        .limit(50);
      list = (data as Product[]) || [];
    }
    if (!list.length) {
      list = getCachedProducts() || [];
    }
    return list.slice(0, 50).map((p) => ({ id: getProductSlug(p.name) }));
  } catch {
    return [];
  }
}

const timed = async <T,>(label: string, p: Promise<T>): Promise<T> => {
  const s = performance.now();
  try {
    return await p;
  } finally {
    console.log(`[perf] ${label}: ${Math.round(performance.now() - s)}ms`);
  }
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Direct database querying for both target product and platform products in parallel
  const [product, allProducts] = await Promise.all([
    timed("product", getProductCached(id)),
    timed("allProducts", getHomeProductsDirect(300).catch(() => [] as Product[])),
  ]);

  if (!product) notFound();

  const slug = getProductSlug(product.name);
  if (slug && id.toLowerCase() !== slug.toLowerCase()) {
    redirect(`/products/${slug}`, RedirectType.replace);
  }

  const initialComments: any[] = [];
  const initialReviews: any[] = [];

  const rankDetails = calculateProductRank(
    product,
    allProducts.length > 0 ? allProducts : [product]
  );
  const similarProducts = getSimilarProducts(product, allProducts, 3);

  return (
    <ProductDetailPageClient
      id={id}
      initialProduct={product}
      initialSimilarProducts={similarProducts}
      initialComments={initialComments}
      initialReviews={initialReviews}
      initialAlternatives={[]}
      initialAllProducts={allProducts}
      initialRank={rankDetails.rank}
      initialRankLabel={rankDetails.rankLabel}
      initialIsTopHunt={rankDetails.isTopHunt}
      initialPrevProd={rankDetails.prevProd}
      initialNextProd={rankDetails.nextProd}
      initialCohortProducts={rankDetails.cohortProducts}
    />
  );
}
