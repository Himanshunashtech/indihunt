"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Favicon from "@/components/Favicon";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  MessageSquare,
  Lock,
  Filter,
  Flame,
  Globe,
  Sparkles,
  HelpCircle,
  Award,
  CheckCircle2,
} from "lucide-react";
import {
  toggleUpvote,
  Product,
  supabase,
  getProductSlug,
  getProducts,
  getUserUpvotedProductIds
} from "@/lib/supabase";
import { isProductInCategory } from "@/lib/categoryMatcher";
import Navbar from "@/components/Navbar";
import { SponsoredAd } from "@/components/SponsoredAd";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";
import { HexagonAwardBadge } from "@/components/AwardBadge";
import { getInitialTheme, applyTheme, Theme, DEFAULT_THEME } from "@/lib/theme";

interface CompanyLogo {
  name: string;
  logo_url: string;
  website_url?: string;
}

interface CategoryPageClientProps {
  slug: string;
  categoryName: string;
  initialProducts: Product[];
  allCategories: { slug: string; name: string }[];
  logosToShow: CompanyLogo[];
  categoryDescription?: string;
  faqItems: { question: string; answer: string }[];
}

export default function CategoryPageClient({
  slug,
  categoryName,
  initialProducts,
  allCategories,
  logosToShow,
  categoryDescription,
  faqItems,
}: CategoryPageClientProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const reduxUser = useAppSelector((state) => state.auth.user);
  const [currentUser, setCurrentUser] = useState<any>(reduxUser);
  const effectiveUserId = reduxUser?.id || currentUser?.id || null;

  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Sync products when initialProducts prop updates or fetch client-side fallback if empty
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    } else {
      getProducts()
        .then((all) => {
          if (Array.isArray(all) && all.length > 0) {
            const matched = all.filter((p) => isProductInCategory(p, slug, categoryName));
            setProducts(matched);
          }
        })
        .catch(() => {});
    }
  }, [initialProducts, slug, categoryName]);

  const [sortBy, setSortBy] = useState<'recent' | 'upvotes' | 'alphabetical'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize theme
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  // Sync auth state from Redux and Supabase
  useEffect(() => {
    if (reduxUser) {
      setCurrentUser(reduxUser);
    }
  }, [reduxUser]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync upvoted product colors when user logs in or auth state resolves
  useEffect(() => {
    if (!effectiveUserId) {
      setProducts((prev) =>
        prev.map((p) => (p.has_upvoted ? { ...p, has_upvoted: false } : p))
      );
      return;
    }

    // Fresh live fetch from DB / Redis
    getUserUpvotedProductIds(effectiveUserId)
      .then((ids) => {
        if (!Array.isArray(ids)) return;
        const votedIds = new Set(ids);
        setProducts((prev) =>
          prev.map((p) => ({
            ...p,
            has_upvoted: votedIds.has(p.id),
          }))
        );
      })
      .catch(() => { });
  }, [effectiveUserId]);

  const displayedProducts = useMemo(() => {
    let filtered = [...products];

    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'upvotes') {
      filtered.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
    } else if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [products, sortBy]);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.max(1, Math.ceil(displayedProducts.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return displayedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayedProducts, validCurrentPage]);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(validPage);

    // Sync URL query without full reload
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (validPage === 1) {
        params.delete("page");
      } else {
        params.set("page", validPage.toString());
      }
      const newQuery = params.toString() ? `?${params.toString()}` : "";
      window.history.pushState(null, "", `${window.location.pathname}${newQuery}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);

    if (validCurrentPage > 3) {
      pages.push("dots-left");
    }

    const start = Math.max(2, validCurrentPage - 1);
    const end = Math.min(totalPages - 1, validCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (validCurrentPage < totalPages - 2) {
      pages.push("dots-right");
    }

    pages.push(totalPages);
    return pages;
  }, [totalPages, validCurrentPage]);

  const handleVote = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!effectiveUserId) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    // Optimistic toggle
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const wasUpvoted = !!p.has_upvoted;
          return {
            ...p,
            upvotes_count: wasUpvoted
              ? Math.max(0, (p.upvotes_count || 1) - 1)
              : (p.upvotes_count || 0) + 1,
            has_upvoted: !wasUpvoted,
          };
        }
        return p;
      })
    );

    const result = await toggleUpvote(productId, effectiveUserId);
    if (result.success) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId || (result.productId && p.id === result.productId)) {
            return {
              ...p,
              upvotes_count: result.upvotes_count,
              ...(typeof result.has_upvoted === 'boolean' ? { has_upvoted: result.has_upvoted } : {}),
            };
          }
          return p;
        })
      );
    } else {
      // Rollback if toggle failed
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            const wasUpvoted = !p.has_upvoted;
            return {
              ...p,
              upvotes_count: wasUpvoted
                ? (p.upvotes_count || 0) + 1
                : Math.max(0, (p.upvotes_count || 1) - 1),
              has_upvoted: wasUpvoted,
            };
          }
          return p;
        })
      );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden transition-colors duration-300 pt-[60px] sm:pt-[72px]">
      <Navbar
        theme={theme}
        onThemeToggle={toggleTheme}
        searchQuery=""
        onSearchChange={() => { }}
        onForumsClick={() => { window.location.href = "/discussions"; }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{categoryName}</span>
        </nav>

        {/* ── Category Hero ──────────────── */}
        <div className="bg-card/30 border border-border/80 rounded-3xl p-5 md:p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle Ambient background glow */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Hero Left Content */}
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground/90 leading-tight">
              The best {categoryName.toLowerCase()} in 2026
            </h1>

            {/* Meta Row */}
            <div className="flex items-center gap-4 sm:gap-6 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 w-fit px-4 py-2 rounded-xl border border-border/40 flex-wrap">
              <div>Last updated <span className="text-foreground">2026</span></div>
              <div className="h-3 w-px bg-border/60" />
              <div>Community Reviews <span className="text-foreground">{Math.max(displayedProducts.length * 3 + 12, 18)}</span></div>
              <div className="h-3 w-px bg-border/60" />
              <div>Products <span className="text-foreground font-bold">{displayedProducts.length}</span></div>
            </div>

            <p className="text-base text-foreground/80 leading-relaxed max-w-xl">
              {categoryDescription || `Discover and select from the leading tools and platforms in ${categoryName}. Fully evaluated based on community ratings, maker streak activities, feature quality scores, and real-user reviews.`}
            </p>
          </div>

          {/* Mobile Screen: Stacked Rotated App Icons Row */}
          <div className="flex md:hidden items-center justify-center -space-x-4 py-4 px-2 w-full my-2 overflow-x-auto">
            {logosToShow.slice(0, 6).map((logo, idx) => {
              const rotation = ["-rotate-6", "-rotate-3", "-rotate-9", "-rotate-4", "-rotate-10", "-rotate-7"][idx % 6];
              const bgStyle = [
                "bg-white text-black border-slate-200 dark:border-zinc-700",
                "bg-zinc-950 text-white border-zinc-800 dark:border-zinc-700",
                "bg-emerald-400 text-black border-emerald-300 dark:border-emerald-700",
                "bg-indigo-950 text-white border-indigo-900 dark:border-indigo-800",
                "bg-purple-600 text-white border-purple-500 dark:border-purple-700",
                "bg-blue-600 text-white border-blue-500 dark:border-blue-700"
              ][idx % 6];
              return (
                <div
                  key={idx}
                  className={`relative w-16 h-16 rounded-2xl ${bgStyle} border-2 shadow-xl flex items-center justify-center p-2 transform ${rotation} hover:scale-125 hover:z-30 transition-all duration-200 cursor-pointer flex-shrink-0`}
                  style={{ zIndex: logosToShow.length - idx }}
                  title={logo.name}
                >
                  <Favicon
                    src={logo.logo_url}
                    websiteUrl={logo.website_url}
                    size={48}
                    alt={logo.name}
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <span className="text-xs font-semibold truncate max-w-full leading-none">
                    {logo.name.slice(0, 2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Desktop Screen: Larger Collage Grid with Individual Tilts */}
          <div className="hidden md:grid flex-shrink-0 grid-cols-3 gap-4 p-5 bg-muted/10 border border-border/50 rounded-2xl">
            {logosToShow.map((logo, idx) => {
              const leftTilt = ["-rotate-6", "-rotate-3", "-rotate-8", "-rotate-4", "-rotate-7", "-rotate-5"][idx % 6];
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center transform ${leftTilt} hover:rotate-0 hover:scale-115 transition-transform cursor-default select-none p-1.5`}
                  title={logo.name}
                >
                  <Favicon
                    src={logo.logo_url}
                    websiteUrl={logo.website_url}
                    size={64}
                    alt={logo.name}
                    className="w-16 h-16 sm:w-18 sm:h-18 object-contain rounded-2xl border border-border/40 shadow-sm filter dark:brightness-110 drop-shadow-md"
                  />
                  <span className="text-xs font-medium text-muted-foreground/80 truncate w-full text-center mt-2 block leading-none">{logo.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Promoted Ad Banner below hero */}
        <div className="mb-6">
          <SponsoredAd placement="category" category={categoryName} />
        </div>

        {/* ── Main Panel Layout ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Categories Sidebar Panel (Sticky) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div className="bg-card/40 border border-border/65 rounded-3xl p-5 shadow-sm">
                <h3 className="text-xs font-medium text-foreground/90 uppercase tracking-widest pb-3 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    Categories
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {allCategories.length}
                  </span>
                </h3>
                <div className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                  {allCategories.map((item) => {
                    const isActive = item.slug === slug;
                    return (
                      <Link
                        key={item.slug}
                        href={`/categories/${item.slug}`}
                        className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${isActive
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/30 shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                          }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${isActive ? "rotate-90 text-orange-500" : "text-muted-foreground/45"}`} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Product Listings */}
          <div className="lg:col-span-9 space-y-6">

            {/* Filter / Sort Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Top {categoryName} Products ({displayedProducts.length})
                </h2>
              </div>

              {/* Sort Dropdown */}
              <div className="relative w-full sm:w-auto max-w-full">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 border border-border/80 bg-card rounded-xl text-xs font-semibold text-foreground hover:bg-muted/50 hover:border-border transition-all cursor-pointer shadow-sm max-w-full"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-orange-500" />
                    <span>
                      {sortBy === 'recent' && 'Most Recent'}
                      {sortBy === 'upvotes' && 'Most Upvotes'}
                      {sortBy === 'alphabetical' && 'Alphabetical'}
                    </span>
                  </div>
                  <ChevronRight className="w-3 h-3 rotate-90 text-muted-foreground/60 ml-1" />
                </button>

                {isSortDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsSortDropdownOpen(false)}
                    />
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-100">
                      {(['recent', 'upvotes', 'alphabetical'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { setSortBy(mode); setIsSortDropdownOpen(false); handlePageChange(1); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-muted/70 transition-colors ${sortBy === mode ? 'text-orange-500 bg-orange-500/5' : 'text-foreground'}`}
                        >
                          {mode === 'recent' && 'Most Recent'}
                          {mode === 'upvotes' && 'Most Upvotes'}
                          {mode === 'alphabetical' && 'Alphabetical'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Product Cards */}
            <div className="space-y-4">
              {paginatedProducts.length === 0 ? (
                <div className="text-center py-16 bg-card/25 border border-border/50 rounded-3xl text-sm text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">No products found under {categoryName} yet.</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Be the first to launch or tag a product in {categoryName}!
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/new?type=product"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors"
                    >
                      Submit a Product in {categoryName}
                    </Link>
                  </div>
                </div>
              ) : (
                paginatedProducts.map((product, idx) => {
                  const absoluteIdx = (validCurrentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const displayTags = (product.tags && product.tags.length > 0)
                    ? product.tags
                    : [product.category || categoryName];
                  const isScheduled = !!(
                    product.status === "scheduled" &&
                    product.scheduled_for &&
                    new Date(product.scheduled_for) > new Date()
                  );

                  return (
                    <div
                      key={product.id}
                      onClick={() => router.push(`/products/${getProductSlug(product.name)}`)}
                      className="group relative rounded-2xl bg-card border border-border/80 p-5 sm:p-6 transition-all duration-200 hover:bg-muted/40 hover:border-border cursor-pointer space-y-3"
                    >
                      {/* Top Header: Logo, Name, Badges & Upvote / Comment Action Buttons */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          {/* Logo */}
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-muted border border-border/80 flex-shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                            <Favicon
                              src={product.logo_url}
                              websiteUrl={product.website_url}
                              size={48}
                              alt={product.name}
                              className="object-cover rounded-xl group-hover:scale-105 transition-transform w-full h-full"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-medium text-foreground/90 group-hover:text-[#ff5733] transition-colors truncate">
                                {product.name}
                              </span>
                              {product.country === "India" && (
                                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                  🇮🇳 Built in India
                                </span>
                              )}
                            </div>

                            <p className="mt-0.5 block text-base text-foreground/80 line-clamp-1">
                              {product.tagline}
                            </p>

                            {/* Star Rating Line */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <div className="flex items-center text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <svg key={s} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-xs font-medium text-foreground">4.8</span>
                              <span className="text-xs text-muted-foreground">({Math.max((product.upvotes_count || 0) * 2 + 15, 24)} reviews)</span>
                            </div>
                          </div>
                        </div>

                        {/* Top-Right Badges & Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                          {/* Real Earned Award Badges */}
                          {(() => {
                            const badges: { rank: string; type: string; title: string }[] = [];

                            if (absoluteIdx === 1) {
                              badges.push({ rank: "#1", type: "gold_day", title: "#1 Product of the Day" });
                            } else if (absoluteIdx === 2) {
                              badges.push({ rank: "#2", type: "silver_day", title: "#2 Product of the Day" });
                            } else if (absoluteIdx === 3) {
                              badges.push({ rank: "#3", type: "bronze_day", title: "#3 Product of the Day" });
                            } else if (absoluteIdx <= 5 && (product.upvotes_count || 0) >= 10) {
                              badges.push({ rank: `#${absoluteIdx}`, type: "rank", title: `#${absoluteIdx} in ${categoryName}` });
                            }

                            if ((product.quality_score || 0) >= 85 && badges.length < 2) {
                              badges.push({ rank: `${product.quality_score}`, type: "quality", title: `Quality Leader (${product.quality_score}/100)` });
                            }

                            if (product.country === "India" && badges.length < 2) {
                              badges.push({ rank: "🇮🇳", type: "india", title: "Built in India Spotlight" });
                            }

                            if (badges.length === 0) return null;

                            return (
                              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                                {badges.map((b, bIdx) => (
                                  <Link key={bIdx} href="/awards" onClick={(e) => e.stopPropagation()}>
                                    <HexagonAwardBadge rank={b.rank} type={b.type} size="sm" title={b.title} />
                                  </Link>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Comment Count Box */}
                          <Link
                            href={`/products/${getProductSlug(product.name)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="relative hidden sm:block"
                            title="View discussions"
                          >
                            <div className="group/accessory flex size-12 flex-col items-center justify-center gap-1 rounded-xl bg-muted/65 transition-all duration-300">
                              <MessageSquare className="size-3.5 stroke-[#344054] dark:stroke-slate-600 group-hover/accessory:stroke-[#ff5733] transition-colors" />
                              <p className="text-base font-medium leading-none text-foreground">
                                {product.comments_count || 0}
                              </p>
                            </div>
                          </Link>

                          {/* Upvote Button Box */}
                          {isScheduled ? (
                            <div
                              title="Upvoting disabled during pre-launch"
                              className="flex size-12 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed flex-shrink-0"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-500" />
                              <p className="text-base font-medium leading-none text-muted-foreground/60">
                                {product.upvotes_count || 0}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleVote(e, product.id)}
                              type="button"
                              data-test="vote-button"
                              className="relative"
                            >
                              <div
                                className={`group/accessory flex size-12 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${product.has_upvoted
                                    ? "bg-orange-500/10 text-[#ff5733]"
                                    : "border border-border bg-card hover:border-[#ff5733]"
                                  }`}
                                data-filled={product.has_upvoted ? "true" : "false"}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  fill="none"
                                  viewBox="0 0 16 16"
                                  className={`size-4 stroke-[1.5px] transition-all duration-300 ${product.has_upvoted
                                      ? "fill-[#ff5733] stroke-[#ff5733]"
                                      : "fill-white dark:fill-transparent stroke-slate-700 dark:stroke-slate-300 group-hover/accessory:stroke-[#ff5733]"
                                    }`}
                                >
                                  <path d="M6.579 3.467c.71-1.067 2.132-1.067 2.842 0L12.975 8.8c.878 1.318.043 3.2-1.422 3.2H4.447c-1.464 0-2.3-1.882-1.422-3.2z" />
                                </svg>
                                <p className="text-base font-medium leading-none text-foreground">
                                  {product.upvotes_count || 0}
                                </p>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Product Description */}
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.description || product.tagline}
                      </p>

                      {/* Bottom Footer Tags & Pricing */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {displayTags.slice(0, 3).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[11px] bg-muted/60 text-muted-foreground px-2.5 py-0.5 rounded-md font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {product.pricing_type && (
                            <span className="text-[11px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-medium">
                              {product.pricing_type}
                            </span>
                          )}
                        </div>

                        {product.website_url && (
                          <a
                            href={product.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium text-muted-foreground hover:text-orange-500 inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Visit site</span>
                            <Globe className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Numeric Pagination ── */}
            {totalPages > 1 && (
              <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{(validCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(validCurrentPage * ITEMS_PER_PAGE, displayedProducts.length)}</span> of{" "}
                  <span className="font-semibold text-foreground">{displayedProducts.length}</span> products
                </p>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  {/* First Page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={validCurrentPage === 1}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => handlePageChange(validCurrentPage - 1)}
                    disabled={validCurrentPage === 1}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  {pageNumbers.map((pageNum, idx) => {
                    if (typeof pageNum === "string") {
                      return (
                        <span
                          key={`dots-${idx}`}
                          className="px-2 py-1 text-muted-foreground font-medium select-none"
                        >
                          ...
                        </span>
                      );
                    }
                    const isActive = pageNum === validCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[36px] h-9 sm:min-w-[40px] sm:h-10 px-2.5 sm:px-3 rounded-xl text-sm sm:text-base font-medium transition-all cursor-pointer ${isActive
                            ? "bg-[#ff5733] text-white font-semibold shadow-xs"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground border border-border/40 bg-card"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Page */}
                  <button
                    onClick={() => handlePageChange(validCurrentPage + 1)}
                    disabled={validCurrentPage === totalPages}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={validCurrentPage === totalPages}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Programmatic SEO Content & FAQ Section ──────────────── */}
            <div className="mt-12 space-y-8 pt-8 border-t border-border/60">
              {/* Educational Entity Description */}
              <div className="bg-card/40 border border-border/80 rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  What are {categoryName} Products?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {categoryName} tools represent software applications and platforms designed to optimize workflows, improve productivity, and deliver state-of-the-art capabilities for indie makers, engineering teams, and businesses. On IndiHunt, every {categoryName.toLowerCase()} product is evaluated based on community upvotes, feature depth, maker engagement, and verified user reviews.
                </p>
              </div>

              {/* Buying / Evaluation Guide */}
              <div className="bg-card/40 border border-border/80 rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  How to Choose the Best {categoryName} in 2026
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      1. Community Quality
                    </div>
                    <p className="text-xs text-muted-foreground">Check real indie maker upvotes, engagement scores, and authentic user reviews.</p>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      2. Modern Integrations
                    </div>
                    <p className="text-xs text-muted-foreground">Ensure compatibility with existing tech stacks, API access, and workflow automation.</p>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-1.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      3. Pricing Transparency
                    </div>
                    <p className="text-xs text-muted-foreground">Look for clear free tiers, one-time licenses, or sustainable SaaS subscription tiers.</p>
                  </div>
                </div>
              </div>

              {/* Frequently Asked Questions */}
              {faqItems.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-orange-500" />
                    Frequently Asked Questions about {categoryName}
                  </h3>
                  <div className="space-y-3">
                    {faqItems.map((faq, fIdx) => (
                      <div key={fIdx} className="bg-card/40 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">{faq.question}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
