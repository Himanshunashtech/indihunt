import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowUp, Sparkles, ExternalLink, MessageSquare, Award, CheckCircle2 } from "lucide-react";
import { getProductById, getProducts, getAlternatives, getProductSlug, Product } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

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
  const [product, allProducts] = await Promise.all([
    getProductById(id),
    getProducts().catch(() => [] as Product[])
  ]);

  if (!product) {
    notFound();
  }

  const slug = getProductSlug(product.name);
  const directAlternatives = await getAlternatives(product.id).catch(() => []);

  // Filter similar products by category & tags
  const cat = (product.category || "").trim().toLowerCase();
  const similarProds = allProducts
    .filter(p => p.id !== product.id)
    .map(p => {
      let score = 0;
      if (cat && (p.category || "").toLowerCase() === cat) score += 5;
      if (product.tags && p.tags) {
        const overlap = product.tags.filter(t => p.tags?.includes(t));
        score += overlap.length * 2;
      }
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score || (b.product.upvotes_count || 0) - (a.product.upvotes_count || 0))
    .slice(0, 8)
    .map(s => s.product);

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
        "name": product.category || "Products",
        "item": product.category ? `${SITE_URL}/categories/${getProductSlug(product.category)}` : `${SITE_URL}/products`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `${SITE_URL}/products/${slug}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Alternatives",
        "item": `${SITE_URL}/products/${slug}/alternatives`
      }
    ]
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Best Alternatives to ${product.name}`,
    "description": `Top ranked alternatives and competitors to ${product.name} in 2026.`,
    "itemListElement": similarProds.map((p, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": p.name,
      "description": p.tagline || p.description,
      "url": `${SITE_URL}/products/${getProductSlug(p.name)}`,
      "image": p.logo_url || `${SITE_URL}/og-image.webp`
    }))
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white pt-[60px] sm:pt-[72px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {product.category && (
            <>
              <Link href={`/categories/${getProductSlug(product.category)}`} className="hover:text-foreground transition-colors">
                {product.category}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <Link href={`/products/${slug}`} className="hover:text-foreground transition-colors">
            {product.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Alternatives</span>
        </nav>

        {/* Hero Banner */}
        <div className="bg-card/40 border border-border/80 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center">
              <img src={product.logo_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Best {product.name} Alternatives in 2026
              </h1>
              <p className="text-sm text-muted-foreground">
                Comparing top tools with similar functionality, features, and community scores.
              </p>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
            Looking for competitors or alternative solutions to <strong>{product.name}</strong>? Whether you are looking for free tools, open-source options, or enterprise-grade features, here is the community-curated list of the best {product.name} alternatives evaluated on IndiHunt.
          </p>
        </div>

        {/* Alternatives Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Top Ranked Alternatives ({similarProds.length})
          </h2>

          {similarProds.length === 0 ? (
            <div className="text-center py-12 bg-card/30 border border-border/60 rounded-2xl text-muted-foreground text-sm">
              No alternatives added yet for {product.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {similarProds.map((alt) => {
                const altSlug = getProductSlug(alt.name);
                return (
                  <div
                    key={alt.id}
                    className="bg-card border border-border/80 rounded-2xl p-5 hover:border-orange-500/40 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
                        <img src={alt.logo_url} alt={alt.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/products/${altSlug}`} className="text-base font-semibold text-foreground hover:text-orange-500 transition-colors truncate">
                            {alt.name}
                          </Link>
                          <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            {alt.upvotes_count || 0}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {alt.tagline || alt.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                      <span className="bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">
                        {alt.category || product.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${altSlug}`}
                          className="text-orange-500 font-semibold hover:underline"
                        >
                          View Reviews →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Why Switch Section */}
        <div className="bg-card/30 border border-border/70 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Why Look for {product.name} Alternatives?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
              <div className="font-semibold text-foreground">1. Pricing & Licensing</div>
              <p>Explore free or lower-cost pricing tiers suited for indie projects and startups.</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
              <div className="font-semibold text-foreground">2. Unique Features</div>
              <p>Find specialised capabilities, lightweight alternatives, or customized workflows.</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
              <div className="font-semibold text-foreground">3. Community Support</div>
              <p>Join thriving maker communities with active updates and fast product development.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
