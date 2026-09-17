"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  Award,
  ExternalLink
} from "lucide-react";
import {
  getProducts,
  toggleUpvote,
  getProductSlug,
  compareProductsForRanking,
  Product,
  supabase,
} from "@/lib/supabase";
import { useAppDispatch, setAuthModalOpen } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";
import { SponsoredAd } from "@/components/SponsoredAd";

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const YEARS = [2027, 2026];

function getDaysInMonth(monthName: string, year: number) {
  const idx = MONTHS_FULL.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  if (idx === -1) return 30;
  return new Date(year, idx + 1, 0).getDate();
}

type Period = "daily" | "weekly" | "monthly" | "yearly";

export default function BestProductsCatchAllPage() {
  const urlParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Extract path segments: /best-products/[[...params]]
  // Can be: [] | ['daily'] | ['daily', '2026', 'september'] | ['daily', '2026', 'september', '16'] | ['weekly', '2026', 'september'] | ['monthly', '2026', 'august']
  const rawParams = useMemo(() => {
    const p = urlParams?.params;
    if (Array.isArray(p)) return p;
    if (typeof p === "string") return [p];
    return [];
  }, [urlParams]);

  // Current IST defaults
  const istNow = useMemo(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + IST_OFFSET_MS);
  }, []);

  const defaultYear = istNow.getUTCFullYear();
  const defaultMonthIndex = istNow.getUTCMonth();
  const defaultMonthFull = MONTHS_FULL[defaultMonthIndex];
  const defaultDay = istNow.getUTCDate();

  // Resolve period
  const segment0 = (rawParams[0] || "").toLowerCase();
  const tabQuery = (searchParams?.get("tab") || "").toLowerCase();
  const validPeriods: Period[] = ["daily", "weekly", "monthly", "yearly"];

  const period: Period = validPeriods.includes(segment0 as Period)
    ? (segment0 as Period)
    : validPeriods.includes(tabQuery as Period)
    ? (tabQuery as Period)
    : "daily";

  // Resolve year
  const rawYear = rawParams[1] ? parseInt(rawParams[1], 10) : defaultYear;
  const year = isNaN(rawYear) || rawYear < 2000 || rawYear > 2100 ? defaultYear : rawYear;

  // Resolve month
  const rawMonthSegment = (rawParams[2] || "").toLowerCase();
  const monthIdxFromSegment = MONTHS_SHORT.indexOf(rawMonthSegment);
  const monthIndex = monthIdxFromSegment !== -1 ? monthIdxFromSegment : defaultMonthIndex;
  const monthFull = MONTHS_FULL[monthIndex];

  // Resolve day
  const rawDaySegment = rawParams[3] ? parseInt(rawParams[3], 10) : null;
  const rawDay = rawDaySegment !== null && !isNaN(rawDaySegment) && rawDaySegment >= 1 && rawDaySegment <= 31
    ? rawDaySegment
    : (rawParams.length === 0 ? defaultDay : null);

  const [productState, setProductState] = useState<Record<string, { upvotes_count: number; has_upvoted: boolean }>>({});
  const [visibleCount, setVisibleCount] = useState<number>(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [period, year, monthFull, rawDay]);

  const handleVote = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!supabase) return;
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    const currentProd = products.find(p => p.id === productId);
    const currVoted = productState[productId]?.has_upvoted ?? currentProd?.has_upvoted ?? false;
    const currCount = productState[productId]?.upvotes_count ?? currentProd?.upvotes_count ?? 0;

    setProductState(prev => ({
      ...prev,
      [productId]: {
        has_upvoted: !currVoted,
        upvotes_count: currVoted ? Math.max(0, currCount - 1) : currCount + 1
      }
    }));

    const result = await toggleUpvote(productId, authData.user.id);
    if (result && result.success) {
      setProductState(prev => ({
        ...prev,
        [productId]: {
          has_upvoted: !currVoted,
          upvotes_count: result.upvotes_count
        }
      }));
    }
  };

  // Safe navigation helper that never breaks routing
  function navigate(p: Period, y: number, m: string, d: number | null) {
    const mSlug = m.toLowerCase();
    if (p === "daily" && d !== null) {
      router.push(`/best-products/${p}/${y}/${mSlug}/${d}`);
    } else {
      router.push(`/best-products/${p}/${y}/${mSlug}`);
    }
  }

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products-best-catchall", period, year, monthFull, rawDay],
    queryFn: async () => {
      const dataList = await getProducts();
      if (!dataList || dataList.length === 0) return [];

      const now = new Date();
      const filtered = dataList.filter(p => {
        if (p.status === "draft") return false;
        if (p.status === "scheduled" && p.scheduled_for) {
          return new Date(p.scheduled_for) <= now;
        }
        return true;
      });

      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      let dateFiltered: Product[] = [];

      if (rawDay !== null && period === "daily") {
        dateFiltered = filtered.filter(p => {
          const pDate = p.scheduled_for
            ? new Date(p.scheduled_for)
            : p.created_at ? new Date(p.created_at) : null;
          if (!pDate) return false;
          const istPDate = new Date(pDate.getTime() + IST_OFFSET_MS);
          return (
            istPDate.getUTCFullYear() === year &&
            istPDate.getUTCMonth() === monthIndex &&
            istPDate.getUTCDate() === rawDay
          );
        });
      } else if (period === "yearly") {
        dateFiltered = filtered.filter(p => {
          const pDate = p.scheduled_for
            ? new Date(p.scheduled_for)
            : p.created_at ? new Date(p.created_at) : null;
          if (!pDate) return false;
          const istPDate = new Date(pDate.getTime() + IST_OFFSET_MS);
          return istPDate.getUTCFullYear() === year;
        });
      } else {
        // month / week / daily all-days
        dateFiltered = filtered.filter(p => {
          const pDate = p.scheduled_for
            ? new Date(p.scheduled_for)
            : p.created_at ? new Date(p.created_at) : null;
          if (!pDate) return false;
          const istPDate = new Date(pDate.getTime() + IST_OFFSET_MS);
          return istPDate.getUTCFullYear() === year && istPDate.getUTCMonth() === monthIndex;
        });
      }

      return dateFiltered.sort(compareProductsForRanking);
    },
  });

  const displayDate = rawDay && period === "daily"
    ? `${monthFull} ${rawDay}, ${year}`
    : period === "yearly"
      ? `${year}`
      : `${monthFull} ${year}`;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      <Navbar />

      {/* Mini Header */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            IndiHunt Leaderboard
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Main Content */}
          <div className="lg:col-span-9 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40">
              <div className="flex items-center gap-3">
                <h1 suppressHydrationWarning className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
                  Best of IndiHunt{" "}
                  <span suppressHydrationWarning className="text-muted-foreground font-normal text-sm sm:text-base">
                    | {displayDate}
                  </span>
                </h1>
              </div>

              {/* Period Switcher */}
              <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl self-start md:self-auto">
                {(["daily", "weekly", "monthly", "yearly"] as Period[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => navigate(tab, year, monthFull, tab === "daily" ? (rawDay || defaultDay) : null)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${period === tab
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Selector (Shown when in daily view) */}
            {period === "daily" && (
              <div className="bg-card border border-border p-4 rounded-2xl space-y-2">
                <span suppressHydrationWarning className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest block">
                  Select Day of the Month ({monthFull})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => navigate("daily", year, monthFull, null)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${rawDay === null
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground"
                      }`}
                  >
                    All Days
                  </button>
                  {Array.from({ length: getDaysInMonth(monthFull, year) }, (_, i) => i + 1).map(day => (
                    <button
                      key={day}
                      onClick={() => navigate("daily", year, monthFull, day)}
                      className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer border ${rawDay === day
                        ? "bg-orange-500 text-white border-orange-500 scale-105 shadow-md"
                        : "bg-muted text-foreground border-border hover:border-orange-500/35"
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && products.length === 0 ? (
              <CircularLoader label="Loading leaderboard products..." size="lg" />
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-muted/5">
                <Award className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                <span className="font-semibold text-xs text-muted-foreground block">No products found</span>
                <span className="text-[10px] text-muted-foreground">No launches recorded for {displayDate}.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, visibleCount).map((product, idx) => {
                  const isUpvoted = productState[product.id]?.has_upvoted ?? product.has_upvoted;
                  const upvoteCount = productState[product.id]?.upvotes_count ?? product.upvotes_count;

                  return (
                    <React.Fragment key={product.id}>
                      <section
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('a') || target.closest('button')) return;
                          router.push(`/products/${getProductSlug(product.name)}`);
                        }}
                        className="group relative isolate flex flex-row items-start gap-4 rounded-xl px-0 py-4 transition-all duration-300 ease-out sm:-mx-4 sm:p-4 hover:sm:bg-slate-100 dark:hover:sm:bg-slate-800/60 cursor-pointer"
                      >
                        <Image
                          src={product.logo_url}
                          alt={product.name}
                          width={48}
                          height={48}
                          priority={idx < 8}
                          className="rounded-xl object-cover flex-shrink-0"
                          style={{ width: "48px", height: "48px" }}
                        />

                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium text-foreground transition-all duration-300 sm:flex-nowrap group-hover:sm:text-[#ff5733]">
                            <Link href={`/products/${getProductSlug(product.name)}`} className="hover:underline">
                              {idx + 1}. {product.name}
                            </Link>
                            {product.website_url && (
                              <a
                                href={(() => {
                                  try {
                                    let u = product.website_url.trim();
                                    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
                                    const parsed = new URL(u);
                                    parsed.searchParams.set("ref", "indihunt");
                                    return parsed.toString();
                                  } catch {
                                    return product.website_url.includes("?") ? `${product.website_url}&ref=indihunt` : `${product.website_url}?ref=indihunt`;
                                  }
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Visit ${product.name}`}
                                className="relative hidden cursor-pointer text-muted-foreground transition-all hover:sm:text-[#ff5733] group-hover:sm:inline-block flex-shrink-0 p-0.5"
                              >
                                <ExternalLink className="w-5 h-5" />
                              </a>
                            )}
                            {product.country === "India" && (
                              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                🇮🇳 Built in India
                              </span>
                            )}
                            {product.featured && (
                              <span className="text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                ⭐ Featured
                              </span>
                            )}
                          </span>

                          <span className="mt-0.5 block text-base text-foreground/80 line-clamp-1">{product.tagline}</span>

                          <div className="mt-1 flex flex-col items-start gap-2 *:z-10">
                            <div className="flex flex-row items-center gap-2">
                              <Link
                                href={`/categories/${(product.category || "Productivity").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-foreground/80 hover:underline hover:text-[#ff5733] text-sm transition-colors"
                              >
                                {product.category || "Productivity"}
                              </Link>
                            </div>

                            {product.maker && (
                              <div>
                                <div className="flex flex-row items-center gap-1.5">
                                  <img
                                    src={product.maker.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=40&h=40&q=80"}
                                    alt=""
                                    className="w-4 h-4 rounded-full object-cover"
                                    style={{ width: "16px", height: "16px" }}
                                  />
                                  <Link
                                    href={product.maker.username ? `/@${product.maker.username}` : `/profile?id=${product.maker.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="whitespace-nowrap text-sm font-medium text-foreground/80 hover:text-[#ff5733] transition-colors"
                                  >
                                    {product.maker.full_name || product.maker.username}
                                  </Link>
                                  <span className="line-clamp-1 text-sm font-normal text-muted-foreground">
                                    upvoted this product
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Action Boxes */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Comment Count Box (Hidden on mobile) */}
                          <Link
                            href={`/products/${getProductSlug(product.name)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="relative hidden sm:block"
                            title="View discussions"
                          >
                            <div className="group/accessory flex size-12 flex-col items-center justify-center gap-1 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-card hover:border-[#ff5733] transition-all duration-300">
                              <MessageSquare className="size-3.5 stroke-[#344054] dark:stroke-slate-400 group-hover/accessory:stroke-[#ff5733] transition-colors" />
                              <p className="text-sm font-medium leading-none text-foreground">{product.comments_count || 0}</p>
                            </div>
                          </Link>

                          {/* Upvote Button Box */}
                          <button
                            onClick={(e) => handleVote(e, product.id)}
                            type="button"
                            data-test="vote-button"
                            className="relative"
                          >
                            <div
                              className={`group/accessory flex size-12 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${isUpvoted
                                ? "border-2 border-[#ff5733] bg-card text-foreground"
                                : "border border-border bg-card hover:border-[#ff5733]"
                                }`}
                              data-filled={isUpvoted ? "true" : "false"}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 16 16"
                                className={`size-4 stroke-[1.5px] transition-all duration-300 ${isUpvoted
                                  ? "fill-[#ff5733] stroke-[#ff5733]"
                                  : "fill-white dark:fill-transparent stroke-slate-700 dark:stroke-slate-300 group-hover/accessory:stroke-[#ff5733]"
                                  }`}
                              >
                                <path d="M6.579 3.467c.71-1.067 2.132-1.067 2.842 0L12.975 8.8c.878 1.318.043 3.2-1.422 3.2H4.447c-1.464 0-2.3-1.882-1.422-3.2z" />
                              </svg>
                              <p className="text-sm font-medium leading-none text-foreground">
                                {upvoteCount}
                              </p>
                            </div>
                          </button>
                        </div>
                      </section>

                      {(idx === 4 || (products.length < 5 && idx === products.length - 1)) && (
                        <div className="py-2">
                          <SponsoredAd placement="product_pages" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {products.length > visibleCount && (
                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 20)}
                      className="px-6 py-2.5 bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Load 20 More ({products.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar — Launch Archive */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
              <h2 className="font-extrabold text-xs uppercase tracking-wider text-foreground">Launch Archive</h2>
              <div className="space-y-4">
                {YEARS.map(y => (
                  <div key={y} className="space-y-2">
                    <button
                      onClick={() => navigate(period, y, monthFull, null)}
                      className={`text-xs font-extrabold block transition-all cursor-pointer ${year === y ? "text-orange-500" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {y}
                    </button>
                    {year === y && (
                      <div className="pl-3 border-l border-orange-500/30 flex flex-col gap-1.5">
                        {MONTHS_FULL.slice().reverse().map(month => (
                          <button
                            key={month}
                            onClick={() => navigate(period, y, month, null)}
                            className={`text-[10px] font-semibold text-left transition-colors cursor-pointer ${monthFull === month ? "text-orange-500 font-bold" : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            • {month}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
