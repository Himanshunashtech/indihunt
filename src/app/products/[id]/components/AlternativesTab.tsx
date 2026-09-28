import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles, ExternalLink, ChevronRight, Award, Plus } from "lucide-react";
import { AlternativeProduct, Product, addAlternative, getAlternatives, toggleAlternativeVote, getProductSlug, getCachedProducts } from "@/lib/supabase";
import { useAppDispatch, setAuthModalOpen } from "@/lib/store";
import { useProducts } from "@/hooks/useDb";

interface AlternativesTabProps {
  alternatives: AlternativeProduct[];
  setAlternatives: (alts: AlternativeProduct[]) => void;
  allProductsList: Product[];
  productId: string;
  product?: Product;
  user: any;
}

export default function AlternativesTab({
  alternatives,
  setAlternatives,
  allProductsList = [],
  productId,
  product,
  user
}: AlternativesTabProps) {
  const dispatch = useAppDispatch();
  const [selectedAltId, setSelectedAltId] = useState("");
  const [isSubmittingAlt, setIsSubmittingAlt] = useState(false);

  // Hook to fetch latest products from DB if allProductsList is empty
  const { data: dbProducts = [] } = useProducts(user?.id);

  const productName = product?.name || "Product";
  const productSlug = getProductSlug(productName);
  const category = product?.category || "Productivity";

  // Combine products from props, hook, and localStorage cache
  const effectiveAllProducts = useMemo(() => {
    const list: Product[] = [];
    const seen = new Set<string>();

    const addProds = (arr: Product[]) => {
      if (!arr || !Array.isArray(arr)) return;
      for (const p of arr) {
        if (p && p.id && p.id !== productId && !seen.has(p.id)) {
          seen.add(p.id);
          list.push(p);
        }
      }
    };

    addProds(allProductsList);
    addProds(dbProducts);
    return list;
  }, [allProductsList, dbProducts, productId]);

  // Calculate similar products based on category and tags with automatic fallback
  const similarProducts = useMemo(() => {
    if (!product || effectiveAllProducts.length === 0) return [];
    const cat = (product.category || "").trim().toLowerCase();

    const scored = effectiveAllProducts.map(p => {
      let score = 0;
      if (cat && (p.category || "").toLowerCase() === cat) score += 5;
      if (product.tags && p.tags) {
        const overlap = product.tags.filter(t => p.tags?.includes(t));
        score += overlap.length * 2;
      }
      return { product: p, score };
    });

    return scored
      .sort((a, b) => b.score - a.score || (b.product.upvotes_count || 0) - (a.product.upvotes_count || 0))
      .slice(0, 6)
      .map(s => s.product);
  }, [product, effectiveAllProducts]);

  const handleAddAlternative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    if (!productId || !selectedAltId) return;

    setIsSubmittingAlt(true);
    const added = await addAlternative(productId, selectedAltId, user.id);
    if (added) {
      setSelectedAltId("");
      const alts = await getAlternatives(productId, user.id);
      setAlternatives(alts);
      alert("Alternative suggested successfully!");
    } else {
      alert("This alternative has already been added or there was an error.");
    }
    setIsSubmittingAlt(false);
  };

  const handleVoteAlternative = async (altId: string) => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    const result = await toggleAlternativeVote(altId, productId, user.id);
    if (result.success) {
      const alts = await getAlternatives(productId, user.id);
      setAlternatives(alts);
    }
  };

  return (
    <div className="space-y-8">
      {/* Alternatives Header Banner */}
      <div className="bg-card/60 border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center flex-shrink-0">
              {product?.logo_url ? (
                <img src={product.logo_url} alt={productName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-orange-500">{productName.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Best {productName} Alternatives in 2026
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Comparing top tools with similar functionality, features, and community ratings.
              </p>
            </div>
          </div>

          <Link
            href={`/products/${productSlug}/alternatives`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-xl text-xs font-semibold transition-all self-start sm:self-center cursor-pointer"
          >
            <span>Direct Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed max-w-3xl">
          Looking for competitors or alternative solutions to <strong>{productName}</strong>? Whether you are looking for free tools, open-source options, or specific workflows, here are top community-curated alternatives evaluated on IndiHunt.
        </p>
      </div>

      {/* Top Ranked Similar Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Top Ranked Alternatives ({similarProducts.length})
          </h3>
          <span className="text-xs text-muted-foreground font-medium">Category: {category}</span>
        </div>

        {similarProducts.length === 0 ? (
          <div className="text-center py-10 bg-card/30 border border-border/60 rounded-2xl text-muted-foreground text-xs">
            Loading or searching for alternative products...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {similarProducts.map((alt) => {
              const altSlug = getProductSlug(alt.name);
              return (
                <div
                  key={alt.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-orange-500/40 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0 flex items-center justify-center font-bold text-orange-500">
                      {alt.logo_url ? (
                        <img src={alt.logo_url} alt={alt.name} className="w-full h-full object-cover" />
                      ) : (
                        alt.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/products/${altSlug}`} className="text-sm font-semibold text-foreground hover:text-orange-500 transition-colors truncate">
                          {alt.name}
                        </Link>
                        <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                          <ArrowUp className="w-3 h-3" />
                          {alt.upvotes_count || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {alt.tagline || alt.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-xs">
                    <span className="bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium text-[11px]">
                      {alt.category || category}
                    </span>
                    <Link
                      href={`/products/${altSlug}`}
                      className="text-orange-500 font-semibold hover:underline flex items-center gap-1 text-xs"
                    >
                      <span>Explore {alt.name}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Community-Voted Alternatives */}


      {/* Why Look for Alternatives Box */}
      <div className="bg-card/40 border border-border rounded-2xl p-6 space-y-4">
        <h4 className="text-base font-semibold text-foreground">Why Compare {productName} Alternatives?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
            <div className="font-semibold text-foreground">1. Pricing & Plans</div>
            <p>Compare free tiers and cost structures designed for indie founders and startups.</p>
          </div>
          <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
            <div className="font-semibold text-foreground">2. Specialized Features</div>
            <p>Find specialized capabilities, integrations, or tailored workflows that suit your stack.</p>
          </div>
          <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1">
            <div className="font-semibold text-foreground">3. Community Feedback</div>
            <p>Review real developer upvotes, launch discussions, and verified user reviews.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
