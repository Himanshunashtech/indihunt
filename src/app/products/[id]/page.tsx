import { notFound, redirect, RedirectType } from "next/navigation";
import {
  supabase,
  getProductSlug,
  getSimilarProducts,
  calculateProductRank,
  getCachedProducts,
  getProducts,
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
    let list = await getProducts().catch(() => [] as Product[]);
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
  const product = await timed("product", getProductCached(id));

  if (!product) notFound();

  const slug = getProductSlug(product.name);
  if (slug && id.toLowerCase() !== slug.toLowerCase()) {
    redirect(`/products/${slug}`, RedirectType.replace);
  }

  const initialComments: any[] = [];
  const initialReviews: any[] = [];

  const allProducts = await timed("allProducts", getProducts().catch(() => [] as Product[]));

  const rankDetails = calculateProductRank(
    product,
    allProducts.length > 0 ? allProducts : [product]
  );
  const similarProducts = getSimilarProducts(product, allProducts, 3);

  const relevantProducts = allProducts.filter(
    (p) =>
      p.id === product.id ||
      (product.maker_id && p.maker_id === product.maker_id) ||
      similarProducts.some((s) => s.id === p.id)
  );

  return (
    <ProductDetailPageClient
      id={id}
      initialProduct={product}
      initialSimilarProducts={similarProducts}
      initialComments={initialComments}
      initialReviews={initialReviews}
      initialAlternatives={[]}
      initialAllProducts={relevantProducts}
      initialRank={rankDetails.rank}
      initialRankLabel={rankDetails.rankLabel}
      initialIsTopHunt={rankDetails.isTopHunt}
      initialPrevProd={rankDetails.prevProd}
      initialNextProd={rankDetails.nextProd}
    />
  );
}
