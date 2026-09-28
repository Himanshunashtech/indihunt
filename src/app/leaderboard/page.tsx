"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  getLeaderboardProducts,
  incrementProductClicks,
  Product,
  CategorySummary,
  LeaderboardActivity,
  getProductSlug
} from "@/lib/supabase";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Grid,
  Bot,
  Search,
  Megaphone,
  Coins,
  Code,
  Share2,
  Briefcase,
  GraduationCap,
  ShoppingBag,
  Wrench,
  Palette,
  FileText,
  FolderGit2,
  Smartphone,
  BarChart2,
  Sparkles,
  Zap,
  Layers,
  ShieldCheck,
  Video,
  Blocks,
  Headphones,
  Glasses,
  Activity,
  Flame,
  X
} from "lucide-react";

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || searchParams?.get("cat") || "All";

  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");
  const [timeFilter] = useState<"all" | "today">("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 20;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [topRanked, setTopRanked] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categoryTotals, setCategoryTotals] = useState<CategorySummary[]>([]);
  const [latestBids, setLatestBids] = useState<LeaderboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState<boolean>(false);

  // Sync categoryFilter if URL search params change
  useEffect(() => {
    const cat = searchParams?.get("category") || searchParams?.get("cat");
    if (cat) {
      setCategoryFilter(cat);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Load Leaderboard Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getLeaderboardProducts(categoryFilter, timeFilter, currentPage, limit);
      setProducts(res.products);
      setTopRanked(res.topRanked);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setCategoryTotals(res.categoryTotals);
      setLatestBids(res.latestBids);
    } catch (err) {
      console.error("Error loading leaderboard products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, timeFilter, currentPage]);

  const handleCategoryChange = (catName: string) => {
    setCategoryFilter(catName);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n === "all") return <Grid className="w-4 h-4 text-orange-500" />;
    if (n.includes("agent") || n.includes("automation")) return <Zap className="w-4 h-4 text-amber-500" />;
    if (n.includes("ai") || n.includes("artific")) return <Bot className="w-4 h-4 text-purple-500" />;
    if (n.includes("developer") || n.includes("code") || n.includes("dev")) return <Code className="w-4 h-4 text-emerald-500" />;
    if (n.includes("api") || n.includes("integration")) return <Layers className="w-4 h-4 text-sky-500" />;
    if (n.includes("open") || n.includes("source")) return <FolderGit2 className="w-4 h-4 text-amber-600" />;
    if (n.includes("saas")) return <Briefcase className="w-4 h-4 text-blue-500" />;
    if (n.includes("market") || n.includes("seo") || n.includes("ad")) return <Megaphone className="w-4 h-4 text-[#ff5733]" />;
    if (n.includes("productiv") || n.includes("work")) return <Wrench className="w-4 h-4 text-teal-500" />;
    if (n.includes("design") || n.includes("creative")) return <Palette className="w-4 h-4 text-violet-500" />;
    if (n.includes("fintech") || n.includes("finance")) return <Coins className="w-4 h-4 text-emerald-500" />;
    if (n.includes("web3") || n.includes("crypto")) return <Flame className="w-4 h-4 text-orange-400" />;
    if (n.includes("e-com") || n.includes("retail") || n.includes("shop")) return <ShoppingBag className="w-4 h-4 text-rose-500" />;
    if (n.includes("analytic") || n.includes("data")) return <BarChart2 className="w-4 h-4 text-indigo-500" />;
    if (n.includes("cyber") || n.includes("security")) return <ShieldCheck className="w-4 h-4 text-red-500" />;
    if (n.includes("educat") || n.includes("edtech") || n.includes("learn")) return <GraduationCap className="w-4 h-4 text-cyan-500" />;
    if (n.includes("health") || n.includes("fit")) return <Activity className="w-4 h-4 text-emerald-400" />;
    if (n.includes("social") || n.includes("commun")) return <Share2 className="w-4 h-4 text-pink-500" />;
    if (n.includes("media") || n.includes("entertain")) return <Video className="w-4 h-4 text-fuchsia-500" />;
    if (n.includes("no-code") || n.includes("low-code")) return <Blocks className="w-4 h-4 text-teal-400" />;
    if (n.includes("support") || n.includes("crm")) return <Headphones className="w-4 h-4 text-rose-400" />;
    if (n.includes("ar/vr") || n.includes("vr") || n.includes("ar")) return <Glasses className="w-4 h-4 text-purple-400" />;
    if (n.includes("mobile") || n.includes("app")) return <Smartphone className="w-4 h-4 text-sky-500" />;
    return <FolderGit2 className="w-4 h-4 text-muted-foreground" />;
  };

  const filteredCategoryTotals = categoryTotals.filter(c =>
    c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "recently";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "recently";
    const diffInSecs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffInSecs < 60) return "just now";
    const mins = Math.floor(diffInSecs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#ff5733]/20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-42 pb-20 space-y-8">

        {/* ── HERO BANNER ───────────────────────── */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-4 pb-2">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Product Leaderboard
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Discover top products built by indie software makers, ranked by community engagement and clicks.
          </p>
        </div>

        {/* ── TOP 3 RANKING HIGHLIGHTS ──────────────────────────── */}
        {topRanked.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground/90 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>AllTime&apos;s top ranking</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topRanked.map((prod, idx) => (
                <Link
                  key={prod.id}
                  href={`/products/${getProductSlug(prod.name)}`}
                  onClick={() => incrementProductClicks(prod.id)}
                  className="p-4 rounded-2xl bg-card border border-border/80 hover:border-orange-500/40 shadow-xs hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-extrabold text-base text-foreground/70 shrink-0">
                        #{idx + 1}
                      </span>
                      <img
                        src={prod.logo_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80"}
                        alt={prod.name}
                        className="w-8 h-8 rounded-xl object-cover border border-border/60 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-base text-foreground group-hover:text-[#ff5733] transition-colors truncate">
                          {prod.name}
                        </h4>
                        <p className="text-base text-muted-foreground truncate">
                          {prod.tagline}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-base text-[#ff5733] shrink-0">
                      {(prod.clicks_count || prod.upvotes_count || 0).toLocaleString()} clicks
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── LATEST ACTIVITY TICKER ────────────────────────────── */}
        {latestBids.length > 0 && (
          <div className="flex items-center gap-3 py-2 px-4 rounded-2xl bg-muted/30 border border-border/40 overflow-x-auto scrollbar-none">
            <span className="text-base font-bold text-rose-500 shrink-0 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Latest activity
            </span>

            <div className="flex items-center gap-3 shrink-0">
              {latestBids.map(act => (
                <div
                  key={act.id}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-card border border-border/60 text-base shadow-2xs shrink-0"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${act.productName}`}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="font-bold text-foreground">{act.productName}</span>
                  <span className="text-muted-foreground">at #{act.rank}</span>
                  <span className="text-[10px] text-muted-foreground">{act.timeAgo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT GRID: Category Sidebar + Products Table ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR: Categories */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 max-h-[80vh] lg:overflow-y-auto pr-1">
            {/* Mobile View */}
            <div className="block lg:hidden mb-4 relative z-50">
              <button
                onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                className="w-full flex items-center justify-between bg-card border border-border/80 text-foreground font-semibold text-base py-3 px-4 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {getCategoryIcon(categoryFilter === 'All' ? 'All' : categoryFilter)}
                  <span className="truncate">{categoryFilter === 'All' ? 'All Categories' : categoryFilter}</span>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${isMobileCategoryOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>

              {isMobileCategoryOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMobileCategoryOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-top-1">
                    <div className="p-1">
                      {categoryTotals.map(cat => {
                        const isSelected = categoryFilter.toLowerCase() === cat.name.toLowerCase() || (cat.name === 'All' && categoryFilter === 'All');
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              handleCategoryChange(cat.name);
                              setIsMobileCategoryOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-base font-semibold transition-all cursor-pointer ${isSelected
                              ? "bg-orange-500/10 text-[#ff5733] font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {getCategoryIcon(cat.name)}
                              <span className="truncate">{cat.name}</span>
                            </div>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#ff5733] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block space-y-2.5">
              <div className="flex items-center justify-between px-3">
                <h4 className="text-base font-bold text-muted-foreground uppercase tracking-wider">
                  Categories ({categoryTotals.length})
                </h4>
                {categoryFilter !== "All" && (
                  <button
                    onClick={() => handleCategoryChange("All")}
                    className="text-xs text-orange-500 hover:underline font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Category Search Input */}
              <div className="relative px-1">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full bg-card border border-border/80 rounded-xl pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                />
                {categorySearchQuery && (
                  <button
                    onClick={() => setCategorySearchQuery("")}
                    className="absolute inset-y-0 right-3.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1 pt-1 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
                {filteredCategoryTotals.length > 0 ? (
                  filteredCategoryTotals.map(cat => {
                    const isSelected = categoryFilter.toLowerCase() === cat.name.toLowerCase() || (cat.name === 'All' && categoryFilter === 'All');
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.name)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base font-semibold transition-all cursor-pointer ${isSelected
                          ? "bg-orange-500/10 text-[#ff5733] border border-orange-500/20 font-bold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {getCategoryIcon(cat.name)}
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${isSelected ? "bg-[#ff5733] text-white" : "bg-muted text-muted-foreground/80"}`}>
                          {cat.count || 0}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No categories found matching &quot;{categorySearchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT MAIN LIST: Paginated Top Leaderboard Products */}
          <div className="lg:col-span-8 space-y-4">

            {isLoading ? (
              <div className="space-y-3 py-10 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#ff5733] border-t-transparent animate-spin mx-auto" />
                <p className="text-base font-semibold text-muted-foreground">Loading leaderboard ranks...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-3">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="font-bold text-base text-foreground">No products in this category yet</h3>
                <p className="text-base text-muted-foreground max-w-sm mx-auto">
                  Be the first to list your product in this category!
                </p>
                <Link
                  href="/new"
                  className="inline-block px-6 py-2.5 rounded-full bg-[#ff5733] text-white text-base font-bold shadow-md cursor-pointer hover:bg-[#e04824] transition-colors"
                >
                  Submit Product
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((prod, idx) => {
                  const globalRank = (currentPage - 1) * limit + idx + 1;
                  const isTopRank = globalRank <= 2;

                  return (
                    <div
                      key={prod.id}
                      className={`relative group rounded-3xl transition-all duration-200 ${isTopRank
                        ? "bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent border-2 border-orange-500/40 hover:border-orange-500 p-5"
                        : "bg-card border border-border/60 hover:border-border p-4 shadow-2xs hover:shadow-xs"
                        }`}
                    >
                      {/* Item Content */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                        {/* Left Info: Rank #, Logo, Title, Tags */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">

                          {/* Rank Badge */}
                          <span
                            className={`font-black text-base shrink-0 ${globalRank === 1
                              ? "px-2.5 py-1 rounded-xl bg-orange-500 text-white shadow-xs"
                              : globalRank === 2
                                ? "px-2.5 py-1 rounded-xl bg-amber-500 text-white shadow-xs"
                                : "text-muted-foreground w-7 text-center"
                              }`}
                          >
                            #{globalRank}
                          </span>

                          {/* Logo */}
                          <img
                            src={prod.logo_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80"}
                            alt={prod.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-border/60 shrink-0 shadow-2xs"
                          />

                          {/* Text Details */}
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/products/${getProductSlug(prod.name)}`}
                                onClick={() => incrementProductClicks(prod.id)}
                                className="font-bold text-base text-foreground hover:text-[#ff5733] transition-colors truncate"
                              >
                                {prod.name}
                              </Link>
                              {prod.website_url && (
                                <a
                                  href={prod.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => incrementProductClicks(prod.id)}
                                  className="text-base text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  {new URL(prod.website_url.startsWith('http') ? prod.website_url : `https://${prod.website_url}`).hostname.replace('www.', '')}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <p className="text-base text-muted-foreground line-clamp-1">
                              {prod.tagline}
                            </p>

                            {/* Tags & Real stats */}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap pt-0.5">
                              {prod.tags && prod.tags.length > 0 ? (
                                prod.tags.slice(0, 3).map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-2 py-0.5 rounded-md bg-muted/80 text-foreground/80 font-medium text-[10px]"
                                  >
                                    {tag}
                                  </span>
                                ))
                              ) : prod.category ? (
                                <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-[#ff5733] font-semibold text-[10px]">
                                  {prod.category}
                                </span>
                              ) : null}

                              <span>•</span>
                              <span>{formatRelativeTime(prod.created_at)}</span>

                              {prod.clicks_count !== undefined && prod.clicks_count > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-foreground/80">
                                    {prod.clicks_count.toLocaleString()} clicks
                                  </span>
                                </>
                              )}

                              <Link
                                href={`/products/${getProductSlug(prod.name)}`}
                                className="hover:underline text-muted-foreground ml-auto sm:ml-0"
                              >
                                see details
                              </Link>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── PAGINATION CONTROLS ───── */}
            {totalPages > 1 && (
              <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{(currentPage - 1) * limit + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * limit, totalCount)}</span> of{" "}
                  <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> products
                </p>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  {/* First Page */}
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((pageNum, idx) => {
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
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`min-w-[36px] h-9 sm:min-w-[40px] sm:h-10 px-2.5 sm:px-3 rounded-xl text-sm sm:text-base font-medium transition-all cursor-pointer ${
                          isActive
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
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => {
                      setCurrentPage(totalPages);
                      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}

export default function ProductLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#ff5733] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
