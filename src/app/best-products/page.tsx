"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  ArrowUp,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Bookmark,
  ExternalLink
} from "lucide-react";
import {
  getProducts,
  getCachedProducts,
  toggleUpvote,
  getProductSlug,
  compareProductsForRanking,
  Product,
  supabase
} from "@/lib/supabase";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";
import { SponsoredAd } from "@/components/SponsoredAd";

export default function BestProductsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const currentUserId = reduxUser?.id || null;
  const [productState, setProductState] = useState<Record<string, { upvotes_count: number; has_upvoted: boolean }>>({});
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [activeFilter, setActiveFilter] = useState<"featured" | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + IST_OFFSET_MS).getUTCFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const monthsFull = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthsFull[new Date(Date.now() + IST_OFFSET_MS).getUTCMonth()];
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    return new Date(Date.now() + IST_OFFSET_MS).getUTCDate();
  });
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVote = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    let userId = currentUserId;
    if (!userId && supabase) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id || null;
    }
    if (!userId) {
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

    const result = await toggleUpvote(productId, userId);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'daily') {
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(Date.now() + IST_OFFSET_MS);
        const yYear = istNow.getUTCFullYear();
        const MONTHS = [
          "january", "february", "march", "april", "may", "june",
          "july", "august", "september", "october", "november", "december"
        ];
        const yMonth = MONTHS[istNow.getUTCMonth()];
        const yDay = istNow.getUTCDate();
        router.replace(`/best-products/daily/${yYear}/${yMonth}/${yDay}`);
        return;
      }
      if (tab === 'weekly' || tab === 'monthly' || tab === 'yearly') {
        setActiveTab(tab);
      }
    }
  }, [router]);

  // Navigate to the shareable dated leaderboard URL
  function navigateToDate(period: string, year: number, month: string, day: number | null) {
    const mSlug = month.toLowerCase();
    if (day) {
      router.push(`/best-products/${period}/${year}/${mSlug}/${day}`);
    } else {
      router.push(`/best-products/${period}/${year}/${mSlug}`);
    }
  }

  const months = [
    "December", "November", "October", "September", "August", "July", "June", "May", "April", "March", "February", "January"
  ];
  const years = [2027, 2026];

  const getDaysInMonth = (monthName: string, year: number) => {
    const monthsFull = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = monthsFull.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex === -1) return 30;
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const [visibleCount, setVisibleCount] = useState<number>(20);

  // Reset pagination count on filter change and scroll to top
  useEffect(() => {
    setVisibleCount(20);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab, activeFilter, selectedYear, selectedMonth, selectedDay]);

  // TanStack Query to fetch products
  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["products-best", currentUserId || "guest", activeTab, activeFilter, selectedYear, selectedMonth, selectedDay],
    queryFn: async () => {
      const dataList = await getProducts(currentUserId || undefined);

      if (!dataList || dataList.length === 0) return [];

      const now = new Date();
      let filtered = dataList.filter(p => {
        if (p.status === 'draft') return false;
        if (p.status === 'scheduled' && p.scheduled_for) {
          return new Date(p.scheduled_for) <= now;
        }
        return true;
      });

      if (activeFilter === "featured") {
        filtered = filtered.filter(p => p.featured);
      }

      const monthsFull = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthIndex = monthsFull.findIndex(m => m.toLowerCase() === selectedMonth.toLowerCase());

      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      let dateFiltered: Product[] = [];

      if (selectedDay !== null) {
        dateFiltered = filtered.filter(p => {
          const pDate = p.scheduled_for ? new Date(p.scheduled_for) : (p.created_at ? new Date(p.created_at) : null);
          if (!pDate) return false;
          const istPDate = new Date(pDate.getTime() + IST_OFFSET_MS);
          return istPDate.getUTCFullYear() === selectedYear &&
            istPDate.getUTCMonth() === monthIndex &&
            istPDate.getUTCDate() === selectedDay;
        });
      } else {
        if (activeTab === "daily" || activeTab === "weekly" || activeTab === "monthly") {
          dateFiltered = filtered.filter(p => {
            const pDate = p.scheduled_for ? new Date(p.scheduled_for) : (p.created_at ? new Date(p.created_at) : null);
            if (!pDate) return false;
            const istPDate = new Date(pDate.getTime() + IST_OFFSET_MS);
            return istPDate.getUTCFullYear() === selectedYear &&
              istPDate.getUTCMonth() === monthIndex;
          });
        } else if (activeTab === "yearly") {
          dateFiltered = filtered.filter(p => {
            const pDate = p.scheduled_for ? new Date(p.scheduled_for) : (p.created_at ? new Date(p.created_at) : null);
            if (!pDate) return false;
            const istPDate = new Date(pDate.getTime() + IST_OFFSET_MS);
            return istPDate.getUTCFullYear() === selectedYear;
          });
        }
      }

      // Sort strictly filtered date data by ranking comparator
      return dateFiltered.sort(compareProductsForRanking);
    },
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0 && currentUserId && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`indihunt_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_upvotes');
          const votedSet = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
          return previousData.map((p) => ({
            ...p,
            has_upvoted: votedSet.has(p.id),
          }));
        } catch (e) {}
      }
      return previousData;
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden transition-colors duration-300 pt-[76px] sm:pt-[84px]">
      <Navbar />

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Main Content: Products List */}
          <div className="lg:col-span-9 space-y-6">

            {/* Header / Date */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4  pb-4">
              <div className="flex items-center gap-3">
                <h1 suppressHydrationWarning className="text-xl sm:text-2xl font-medium text-foreground flex items-center gap-2">
                  Best of IndiHunt{" "}
                  <span suppressHydrationWarning className="text-muted-foreground font-normal text-sm sm:text-base">
                    | {selectedDay ? `${selectedMonth} ${selectedDay},` : `${selectedMonth}`} {selectedYear}
                  </span>
                </h1>
              </div>

              {/* Daily/Weekly/Monthly/Yearly Switcher */}
              <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl self-start md:self-auto">
                {(["daily", "weekly", "monthly", "yearly"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      const newDay = tab !== "daily" ? null : selectedDay;
                      setSelectedDay(newDay);
                      navigateToDate(tab, selectedYear, selectedMonth, newDay);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTab === tab
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Options: Featured / All */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveFilter("featured")}
                  className={`text-xs font-bold pb-1 border-b-2 transition-all cursor-pointer ${activeFilter === "featured"
                    ? "border-orange-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Featured
                </button>
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`text-xs font-bold pb-1 border-b-2 transition-all cursor-pointer ${activeFilter === "all"
                    ? "border-orange-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  All
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Leaderboard updates in real-time</span>
              </span>
            </div>

            {/* Horizontal Day Selector */}
            <div className="bg-card border border-border p-4 rounded-2xl space-y-2">
              <span suppressHydrationWarning className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest block">Select Day of the Month ({selectedMonth})</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <button
                  onClick={() => { setSelectedDay(null); navigateToDate(activeTab, selectedYear, selectedMonth, null); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${selectedDay === null
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                    }`}
                >
                  All Days
                </button>
                {Array.from<unknown, number>({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setActiveTab("daily");
                      navigateToDate("daily", selectedYear, selectedMonth, day);
                    }}
                    className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer border ${selectedDay === day
                      ? "bg-orange-500 text-white border-orange-500 scale-105 shadow-md"
                      : "bg-muted text-foreground border-border hover:border-orange-500/35"
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {isLoading && products.length === 0 ? (
              <CircularLoader label="Loading leaderboard products..." size="lg" />
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-muted/5">
                <Award className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                <span className="font-semibold text-xs text-muted-foreground block">No products found</span>
                <span suppressHydrationWarning className="text-[10px] text-muted-foreground">No launches recorded for {selectedDay ? `${selectedMonth} ${selectedDay}, ${selectedYear}` : `${selectedMonth} ${selectedYear}`}.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, visibleCount).map((product, idx) => {
                  const launchDate = product.scheduled_for ? new Date(product.scheduled_for) : (product.created_at ? new Date(product.created_at) : null);
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
                                  ? "bg-orange-500/10 text-[#ff5733] border border-orange-500/20"
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
                              <p className={`text-sm font-medium leading-none ${isUpvoted ? "text-[#ff5733]" : "text-foreground"}`}>
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

                {/* Load More Button (20 per batch) */}
                {products.length > visibleCount && (
                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 20)}
                      className="px-6 py-2.5 bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Load 20 More Products ({products.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Timeline Selector */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
              <h2 className="font-extrabold text-xs uppercase tracking-wider text-foreground">Launch Archive</h2>

              <div className="space-y-4">
                {years.map(year => (
                  <div key={year} className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedYear(year);
                        setSelectedDay(null);
                        navigateToDate(activeTab, year, selectedMonth, null);
                      }}
                      className={`text-xs font-extrabold block transition-all cursor-pointer ${selectedYear === year ? "text-orange-500" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {year}
                    </button>
                    {selectedYear === year && (
                      <div className="pl-3 border-l border-orange-500/30 flex flex-col gap-1.5">
                        {months.map(month => (
                          <button
                            key={month}
                            onClick={() => {
                              setSelectedMonth(month);
                              setSelectedDay(null);
                              navigateToDate(activeTab, year, month, null);
                            }}
                            className={`text-[10px] font-semibold text-left transition-colors cursor-pointer ${selectedMonth === month ? "text-orange-500 font-bold" : "text-muted-foreground hover:text-foreground"
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
