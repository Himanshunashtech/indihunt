"use client";


import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, ExternalLink, Code, Star, Award, MessageSquare, Search, ChevronDown, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase, getProductById, getProducts, getProductSlug, getReviews, calculateProductRank, compareProductsForRanking, Product, Review } from "@/lib/supabase";

interface EmbedStyle {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  params: string;
  category: "award" | "review";
}

export default function EmbedBadgePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dayRank, setDayRank] = useState<number>(1);
  const [weekRank, setWeekRank] = useState<number>(1);
  const [monthRank, setMonthRank] = useState<number>(1);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [activeTab, setActiveTab] = useState<"all" | "award" | "review">("all");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [codeType, setCodeType] = useState<{ [key: string]: "html" | "markdown" }>({});

  // Individual Review Search & Filter States
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<string>("all");
  const [reviewSortOrder, setReviewSortOrder] = useState<"recent" | "rating">("recent");
  const [reviewCodeTypes, setReviewCodeTypes] = useState<Record<string, "html" | "markdown">>({});
  const [previewReviewId, setPreviewReviewId] = useState<string | null>(null);

  useEffect(() => {
    // Load product and compute real ranks & reviews
    if (id) {
      Promise.all([getProductById(id), getProducts()]).then(([p, allProducts]) => {
        if (p) {
          setProduct(p);

          // If accessed with raw UUID, cleanly redirect to product name slug URL
          const slug = getProductSlug(p.name);
          if (slug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
            router.replace(`/products/${slug}/embed`);
          }

          // Fetch reviews to calculate rating & review count
          getReviews(p.id).then((revs) => {
            if (revs && revs.length > 0) {
              setReviews(revs);
              setReviewsCount(revs.length);
              const sum = revs.reduce((acc, r) => acc + (r.rating || 5), 0);
              setAverageRating(Math.round((sum / revs.length) * 10) / 10);
            }
          }).catch(() => {});

          if (allProducts && allProducts.length > 0) {
            const rankDetails = calculateProductRank(p, allProducts);
            if (rankDetails.rank) {
              setDayRank(rankDetails.rank);
            }

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const oneWeekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
            const oneMonthAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

            const pool = allProducts.some(item => item.id === p.id) ? allProducts : [p, ...allProducts];

            // 2. Real Week Rank
            const weekProds = pool.filter(item => {
              const itemDate = item.scheduled_for ? new Date(item.scheduled_for) : new Date(item.created_at);
              return itemDate >= oneWeekAgo && itemDate < startOfToday;
            });
            if (weekProds.length > 0) {
              weekProds.sort(compareProductsForRanking);
              const weekIdx = weekProds.findIndex(item => item.id === p.id);
              if (weekIdx !== -1) setWeekRank(weekIdx + 1);
            }

            // 3. Real Month Rank
            const monthProds = pool.filter(item => {
              const itemDate = item.scheduled_for ? new Date(item.scheduled_for) : new Date(item.created_at);
              return itemDate >= oneMonthAgo && itemDate < startOfToday;
            });
            if (monthProds.length > 0) {
              monthProds.sort(compareProductsForRanking);
              const monthIdx = monthProds.findIndex(item => item.id === p.id);
              if (monthIdx !== -1) setMonthRank(monthIdx + 1);
            }
          }
        }
        setLoading(false);
      });
    }
  }, [id]);

  const embedStyles: EmbedStyle[] = [
    // Review Badges (Target: /products/[slug]/review)
    {
      id: "review-rating",
      name: `Review Rating Badge (${averageRating.toFixed(1)} ★ - ${reviewsCount} reviews)`,
      description: "Official 5-star rating scorecard. Clicking takes visitors directly to your product review page.",
      width: 250,
      height: 110,
      params: `style=review-rating&rating=${averageRating}&reviews=${reviewsCount}`,
      category: "review",
    },
    {
      id: "review-cta",
      name: "Leave a Review on IndiHunt Badge",
      description: "High-conversion CTA badge inviting customers to review your product on IndiHunt.",
      width: 250,
      height: 54,
      params: `style=review-cta`,
      category: "review",
    },
    {
      id: "review-rating-dark",
      name: `Review Rating Badge (Dark Theme)`,
      description: "Dark OLED 5-star rating scorecard badge for dark mode websites and repositories.",
      width: 250,
      height: 110,
      params: `style=review-rating-dark&rating=${averageRating}&reviews=${reviewsCount}`,
      category: "review",
    },
    {
      id: "review-cta-dark",
      name: "Leave a Review Badge (Dark Theme)",
      description: "Dark OLED review CTA badge encouraging your community to share feedback.",
      width: 250,
      height: 54,
      params: `style=review-cta-dark`,
      category: "review",
    },

    // Award & Launch Badges (Target: /products/[slug])
    {
      id: "classic",
      name: `#${dayRank} Product of the Day Award Badge`,
      description: "Signature Product Hunt / IndiHunt winner badge with rank ribbon medal & coral border.",
      width: 250,
      height: 54,
      params: `style=classic&rank=${dayRank}`,
      category: "award",
    },
    {
      id: "award-week",
      name: `#${weekRank} Product of the Week Award Badge`,
      description: "Official Product of the Week award badge with rank ribbon medal & coral border.",
      width: 260,
      height: 54,
      params: `style=award-week&rank=${weekRank}`,
      category: "award",
    },
    {
      id: "award-month",
      name: `#${monthRank} Product of the Month Award Badge`,
      description: "Official Product of the Month award badge with rank ribbon medal & coral border.",
      width: 265,
      height: 54,
      params: `style=award-month&rank=${monthRank}`,
      category: "award",
    },
    {
      id: "dark",
      name: `#${dayRank} Product Award Badge (Dark Theme)`,
      description: "Dark OLED winner award badge with rank ribbon medal & coral border.",
      width: 250,
      height: 54,
      params: `style=dark&rank=${dayRank}`,
      category: "award",
    },
    {
      id: "upvotes",
      name: `Featured Upvotes Counter Badge (${product?.upvotes_count || 0} upvotes)`,
      description: "Clean badge showing live real upvotes tally and IndiHunt branding.",
      width: 220,
      height: 54,
      params: `style=upvotes&upvotes=${product?.upvotes_count || 0}`,
      category: "award",
    },
    {
      id: "mini-pill",
      name: `Mini Award Pill (#${dayRank})`,
      description: "Ultra-compact rounded pill badge for tight navbar or footer spaces.",
      width: 160,
      height: 42,
      params: `style=mini-pill&rank=${dayRank}`,
      category: "award",
    },
    {
      id: "banner-dark",
      name: "Wide Horizontal Banner (Dark)",
      description: "Full-width banner showing logo, product tagline, award badge, and live upvote count.",
      width: 450,
      height: 80,
      params: `style=banner-dark&rank=${dayRank}&upvotes=${product?.upvotes_count || 0}`,
      category: "award",
    },
  ];

  const getEmbedCode = (style: EmbedStyle, type: "html" | "markdown") => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const productSlug = getProductSlug(product?.name || id);
    const badgeUrl = `${origin}/t/embed?id=${productSlug}${style.params ? `&${style.params}` : ""}`;
    
    // For review badges, the click destination MUST open the product review page
    const targetUrl = style.category === "review"
      ? `${origin}/products/${productSlug}/review`
      : `${origin}/products/${productSlug}`;

    const altText = style.category === "review"
      ? `Review ${product?.name || "Product"} on IndiHunt`
      : `${product?.name || "Product"} on IndiHunt`;

    if (type === "html") {
      return `<a href="${targetUrl}" target="_blank"><img src="${badgeUrl}" alt="${altText}" style="width: ${style.width}px; height: ${style.height}px;" width="${style.width}" height="${style.height}" /></a>`;
    } else {
      return `[![${altText}](${badgeUrl})](${targetUrl})`;
    }
  };

  // Filtered individual reviews for embed selection
  const displayedReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        if (reviewSearchQuery.trim()) {
          const q = reviewSearchQuery.toLowerCase();
          const bodyMatch = r.body?.toLowerCase().includes(q);
          const nameMatch = r.user?.full_name?.toLowerCase().includes(q) || r.user?.username?.toLowerCase().includes(q);
          if (!bodyMatch && !nameMatch) return false;
        }
        if (reviewRatingFilter !== "all") {
          if (r.rating !== parseInt(reviewRatingFilter)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (reviewSortOrder === "recent") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return (b.rating || 5) - (a.rating || 5);
      });
  }, [reviews, reviewSearchQuery, reviewRatingFilter, reviewSortOrder]);

  const getIndividualReviewEmbedCode = (rev: Review, type: "html" | "markdown") => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const pSlug = getProductSlug(product?.name || id);
    const badgeUrl = `${origin}/t/embed?id=${pSlug}&style=review-card&reviewId=${rev.id}`;
    const targetUrl = `${origin}/products/${pSlug}/review`;
    const reviewer = rev.user?.full_name || rev.user?.username || "Customer";
    const altText = `Review for ${product?.name || "Product"} by ${reviewer} on IndiHunt`;

    if (type === "html") {
      return `<a href="${targetUrl}" target="_blank"><img src="${badgeUrl}" alt="${altText}" style="width: 500px; height: 200px; max-width: 100%; border-radius: 16px;" width="500" height="200" /></a>`;
    } else {
      return `[![${altText}](${badgeUrl})](${targetUrl})`;
    }
  };

  const handleCopyIndividualReview = (rev: Review, type: "html" | "markdown") => {
    const code = getIndividualReviewEmbedCode(rev, type);
    navigator.clipboard.writeText(code);
    setCopiedId(`single-review-${rev.id}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopy = (style: EmbedStyle, styleCodeType: "html" | "markdown") => {
    const code = getEmbedCode(style, styleCodeType);
    navigator.clipboard.writeText(code);
    setCopiedId(`${style.id}-${styleCodeType}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 pt-28 pb-16">
          <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
          <p className="text-sm font-medium text-muted-foreground">Loading embed configurations...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 pt-28 pb-16">
          <p className="text-lg font-semibold text-red-500">Product not found</p>
          <Link href="/" className="text-orange-500 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  const productSlug = getProductSlug(product.name);
  const filteredStyles = activeTab === "all"
    ? embedStyles
    : embedStyles.filter((s) => s.category === activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white pb-20">
      <Navbar />

        {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-24 sm:pt-28 md:pt-32 space-y-12">
        {/* Breadcrumb Navigation */}
        <div className="text-[10px] text-muted-foreground font-semibold tracking-wider flex items-center gap-2 select-none uppercase">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>&gt;</span>
          <Link href={`/products/${productSlug}`} className="hover:text-foreground">{product.name}</Link>
          <span>&gt;</span>
          <span className="text-foreground">Embed Badges</span>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-semibold tracking-widest text-orange-500 uppercase">
              Marketing Toolkit
            </span>
            <h1 className="text-3xl font-bold tracking-tight">
              Embeddable Badges & Reviews
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Show off your launch, awards, and customer testimonials! Click any badge below to instantly copy its embed code for your website.
            </p>
          </div>

          {/* Quick Action: Invite Users to Review */}
          <Link
            href={`/products/${productSlug}/review`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] self-center md:self-auto flex-shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-white" />
            <span>Invite users to review</span>
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab("all")}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Badges & Reviews
          </button>
          <button
            onClick={() => setActiveTab("award")}
            className={`text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "award"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Awards & Upvotes ({embedStyles.filter((s) => s.category === "award").length})</span>
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "review"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Reviews Embed ({embedStyles.filter((s) => s.category === "review").length + reviews.length})</span>
          </button>
        </div>

        {/* Styles Grid (3 Badges per row) */}
        {filteredStyles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                {activeTab === "award" ? (
                  <>
                    <Award className="w-5 h-5 text-orange-500" />
                    <span>Awards & Upvotes Badges</span>
                  </>
                ) : activeTab === "review" ? (
                  <>
                    <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                    <span>Review Rating & CTA Badges</span>
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 text-orange-500" />
                    <span>Launch Awards & Upvote Badges</span>
                  </>
                )}
              </h2>
              {activeTab === "award" && (
                <button
                  onClick={() => setActiveTab("review")}
                  className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Next: Reviews Embed</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* 3 Badges per row responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
              {filteredStyles.map((style) => {
                const currentType = codeType[style.id] || "html";
                const isCopied = copiedId === `${style.id}-${currentType}`;
                const previewUrl = `/t/embed?id=${productSlug}${style.params ? `&${style.params}` : ""}`;

                return (
                  <div
                    key={style.id}
                    className="bg-card border border-border/80 hover:border-orange-500/40 rounded-3xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between space-y-4 group"
                  >
                    {/* Badge Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {style.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {style.description}
                        </p>
                      </div>
                      <span className="text-[9px] font-semibold text-muted-foreground border border-border px-1.5 py-0.5 rounded-md flex-shrink-0">
                        {style.width}x{style.height}
                      </span>
                    </div>

                    {/* Badge Live Preview Box */}
                    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50/90 dark:bg-slate-900/70 rounded-2xl border border-border/60 min-h-[130px]">
                      <img
                        src={previewUrl}
                        alt={style.name}
                        width={style.width}
                        height={style.height}
                        className="object-contain max-h-[95px] max-w-full drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    {/* Format Toggle & Big White Copy Button */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Format
                        </span>
                        <div className="flex bg-muted p-0.5 rounded-lg text-[10px] font-semibold">
                          <button
                            onClick={() =>
                              setCodeType((prev) => ({ ...prev, [style.id]: "html" }))
                            }
                            className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                              currentType === "html"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            HTML
                          </button>
                          <button
                            onClick={() =>
                              setCodeType((prev) => ({ ...prev, [style.id]: "markdown" }))
                            }
                            className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                              currentType === "markdown"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Markdown
                          </button>
                        </div>
                      </div>

                      {/* Big White Copy Button */}
                      <button
                        onClick={() => handleCopy(style, currentType)}
                        className={`w-full py-3 px-4 rounded-2xl font-bold text-xs tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                          isCopied
                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                            : "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4 text-white" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-700" />
                            <span>Copy Embed Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* If in Awards tab, offer an invitation to check Reviews Embed next */}
        {activeTab === "award" && (
          <div className="p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-red-500/10 border border-orange-500/20 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span>Next: Embed Customer Reviews & Testimonials</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Display verified reviews and testimonial cards from your customers on your website.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("review")}
              className="px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex-shrink-0"
            >
              View Reviews Embed →
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REVIEWS EMBED SECTION (Single Review Testimonial Cards) */}
        {/* ========================================================================= */}
        {(activeTab === "all" || activeTab === "review") && (
          <section id="reviews-embed-section" className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Header with Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                  <span>Reviews Embed & Customer Testimonials</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                  </span>
                </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select and copy individual verified review cards to embed as social proof on your website.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={reviewSortOrder}
                onChange={(e) => setReviewSortOrder(e.target.value as "recent" | "rating")}
                className="bg-muted/60 border border-border/80 text-foreground text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="recent">Most recent</option>
                <option value="rating">Highest rating</option>
              </select>

              <select
                value={reviewRatingFilter}
                onChange={(e) => setReviewRatingFilter(e.target.value)}
                className="bg-muted/60 border border-border/80 text-foreground text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">Any Rating</option>
                <option value="5">5 Stars ★</option>
                <option value="4">4 Stars ★</option>
                <option value="3">3 Stars ★</option>
                <option value="2">2 Stars ★</option>
                <option value="1">1 Star ★</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for reviews..."
              value={reviewSearchQuery}
              onChange={(e) => setReviewSearchQuery(e.target.value)}
              className="w-full bg-muted/40 border border-border/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>

          {/* Reviews List */}
          {displayedReviews.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border/60">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                {reviews.length === 0 ? "No reviews yet for this product" : "No reviews match your filter"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {reviews.length === 0
                  ? "Encourage your users to leave the first review to generate embeddable testimonial cards!"
                  : "Try clearing your search query or choosing 'Any Rating'."}
              </p>
              {reviews.length === 0 && (
                <Link
                  href={`/products/${productSlug}/review`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:underline pt-2"
                >
                  <Star className="w-3.5 h-3.5 fill-orange-500" />
                  <span>Leave or invite a review</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {displayedReviews.map((rev) => {
                const currentType = reviewCodeTypes[rev.id] || "html";
                const isCopied = copiedId === `single-review-${rev.id}-${currentType}`;
                const reviewerName = rev.user?.full_name || rev.user?.username || "Verified Maker";
                const reviewerAvatar = rev.user?.avatar_url;
                const isPreviewOpen = previewReviewId === rev.id;
                const reviewEmbedCode = getIndividualReviewEmbedCode(rev, currentType);
                const reviewCardUrl = `/t/embed?id=${productSlug}&style=review-card&reviewId=${rev.id}`;

                return (
                  <div key={rev.id} className="py-6 space-y-4">
                    {/* Review Item Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: User Avatar & Name & Stars */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-500/10 border border-orange-500/20 flex-shrink-0 flex items-center justify-center">
                          {reviewerAvatar ? (
                            <Image
                              src={reviewerAvatar}
                              alt={reviewerName}
                              className="w-full h-full object-cover"
                            width={48} height={48} />
                          ) : (
                            <span className="text-sm font-bold text-orange-500">
                              {reviewerName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {reviewerName}
                            </span>
                            {rev.user?.username && (
                              <span className="text-xs text-muted-foreground">
                                @{rev.user.username}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < (rev.rating || 5)
                                    ? "fill-orange-500 text-orange-500"
                                    : "fill-muted text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {/* Format Switcher */}
                        <div className="flex bg-muted p-0.5 rounded-lg text-[10px] font-semibold">
                          <button
                            onClick={() =>
                              setReviewCodeTypes((prev) => ({ ...prev, [rev.id]: "html" }))
                            }
                            className={`px-2 py-1 rounded-md transition-all ${
                              currentType === "html"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            HTML
                          </button>
                          <button
                            onClick={() =>
                              setReviewCodeTypes((prev) => ({ ...prev, [rev.id]: "markdown" }))
                            }
                            className={`px-2 py-1 rounded-md transition-all ${
                              currentType === "markdown"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Markdown
                          </button>
                        </div>

                        {/* Preview Toggle */}
                        <button
                          onClick={() => setPreviewReviewId(isPreviewOpen ? null : rev.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          {isPreviewOpen ? "Hide Preview" : "Preview"}
                        </button>

                        {/* Big White Copy Button */}
                        <button
                          onClick={() => handleCopyIndividualReview(rev, currentType)}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer ${
                            isCopied
                              ? "bg-emerald-500 text-white"
                              : "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 shadow-sm"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                              <span>Copy embed code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Review Body Quote (Italicized style matching reference) */}
                    <div className="pl-0 sm:pl-13">
                      <p className="text-xs sm:text-sm text-foreground/80 italic font-serif leading-relaxed">
                        “{rev.body}”
                      </p>
                    </div>

                    {/* Inline Live Preview Card if active */}
                    {isPreviewOpen && (
                      <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-border/80 space-y-3 sm:ml-13">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Live Testimonial Card Preview (500x200px)
                          </span>
                          <button
                            onClick={() => handleCopyIndividualReview(rev, currentType)}
                            className="text-xs text-orange-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {isCopied ? "Copied" : "Copy Embed Code"}
                          </button>
                        </div>
                        <div className="flex justify-center p-2">
                          <img
                            src={reviewCardUrl}
                            alt="Testimonial Card Preview"
                            width={500}
                            height={200}
                            className="max-w-full rounded-2xl drop-shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
      </main>
    </div>
  );
}
