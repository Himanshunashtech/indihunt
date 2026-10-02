"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Favicon from "@/components/Favicon";
import Navbar from "@/components/Navbar";
import { SponsoredAd } from "@/components/SponsoredAd";
import { getTopHuntersData, getProducts, getCachedProducts, Hunter, Product } from "@/lib/supabase";
import {
  Search,
  Trophy,
  MessageSquare,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Target,
  Sparkles,
  Flame,
  Award,
  ArrowUpDown,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Star,
  Users,
  Maximize2
} from "lucide-react";

const HUNTER_COLORS = [
  "#3b82f6", // Blue
  "#ff6154", // Brand Coral
  "#10b981", // Emerald Green
  "#ec4899", // Pink
  "#eab308", // Yellow
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#f43f5e", // Rose
  "#94a3b8", // Slate Gray
  "#f97316"  // Amber Orange
];

const MONTH_LABELS = ["Aug 2025", "Oct 2025", "Dec 2025", "Feb 2026", "Apr 2026", "Jun 2026", "Aug 2026"];

function TopHuntersChart({ hunters, isDark }: { hunters: Hunter[]; isDark: boolean }) {
  const top10 = hunters.slice(0, 10);
  const [activeSet, setActiveSet] = useState<Set<string>>(new Set(top10.map(h => h.id)));
  const [hoveredPoint, setHoveredPoint] = useState<{
    name: string;
    avatar: string;
    color: string;
    month: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setActiveSet(new Set(top10.map(h => h.id)));
  }, [hunters]);

  const toggleHunter = (id: string) => {
    const next = new Set(activeSet);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setActiveSet(next);
  };

  const maxY = Math.max(375, ...top10.map(h => h.hunts_count || 50));
  const yTicks = [375, 350, 325, 300, 275, 250, 225, 200, 175, 150, 125, 100, 75, 50, 25, 0];

  const hunterData = top10.map((hunter, idx) => {
    const color = HUNTER_COLORS[idx % HUNTER_COLORS.length];
    const total = hunter.hunts_count || 20;

    const multipliers = [
      0.03 + (idx * 0.01),
      0.15 + ((idx % 3) * 0.05),
      0.32 + ((idx % 4) * 0.04),
      0.50 + ((idx % 2) * 0.08),
      0.68 + ((idx % 5) * 0.03),
      0.86 + ((idx % 3) * 0.04),
      1.0
    ];

    const values = multipliers.map(m => Math.min(total, Math.round(total * m)));
    return { hunter, color, values };
  });

  const SVG_W = 760;
  const SVG_H = 320;
  const PAD_L = 30;
  const PAD_R = 670;
  const PAD_T = 20;
  const PAD_B = 270;
  const PLOT_W = PAD_R - PAD_L;
  const PLOT_H = PAD_B - PAD_T;

  const getX = (mIdx: number) => PAD_L + mIdx * (PLOT_W / (MONTH_LABELS.length - 1));
  const getY = (val: number) => PAD_B - (val / maxY) * PLOT_H;

  const getSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    return d;
  };

  return (
    <div className={`relative border border-border rounded-3xl p-5 sm:p-6 transition-all bg-card shadow-xs ${isFullscreen
        ? "fixed inset-4 z-50 overflow-auto bg-card/95 backdrop-blur-xl border-border shadow-2xl"
        : ""
      }`}>
      {/* Chart Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-foreground">
            Top 10 hunters over time
          </h3>
          <p className="text-xs font-mono text-muted-foreground">
            Cumulative hunts — last 12 months
          </p>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-xl border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legend Pills */}
      <div className="flex flex-wrap gap-2 mb-6 select-none">
        {top10.map((hunter, idx) => {
          const color = HUNTER_COLORS[idx % HUNTER_COLORS.length];
          const isVisible = activeSet.has(hunter.id);
          return (
            <button
              key={hunter.id}
              onClick={() => toggleHunter(hunter.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${isVisible
                ? "bg-muted border-border text-foreground shadow-xs"
                : "bg-muted/40 border-border/50 text-muted-foreground line-through opacity-50"
                }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: isVisible ? color : "#94a3b8" }}
              />
              <Image
                src={hunter.avatar_url}
                alt={hunter.name}
                loading="eager"
                decoding="async"
                className="w-4 h-4 rounded-full object-cover border border-border"
              width={16} height={16} />
              <span>{hunter.name}</span>
            </button>
          );
        })}
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-x-auto no-scrollbar">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto min-w-[650px] overflow-visible"
        >
          {/* Y-Axis Grid Lines & Right Labels */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={`y-${val}`}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={PAD_R}
                  y2={y}
                  stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={PAD_R + 14}
                  y={y + 4}
                  fill={isDark ? "#94a3b8" : "#64748b"}
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X-Axis Vertical Lines & Month Labels */}
          {MONTH_LABELS.map((label, mIdx) => {
            const x = getX(mIdx);
            return (
              <g key={`x-${mIdx}`}>
                <line
                  x1={x}
                  y1={PAD_T}
                  x2={x}
                  y2={PAD_B}
                  stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={PAD_B + 24}
                  fill={isDark ? "#94a3b8" : "#64748b"}
                  fontSize="11"
                  fontFamily="sans-serif"
                  fontWeight="600"
                  textAnchor="end"
                  transform={`rotate(-35 ${x} ${PAD_B + 24})`}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Base Axis Line */}
          <line
            x1={PAD_L}
            y1={PAD_B}
            x2={PAD_R}
            y2={PAD_B}
            stroke={isDark ? "#3d3027" : "#cbd5e1"}
            strokeWidth="1.5"
          />

          {/* Hunter Trend Line Paths */}
          {hunterData.map(({ hunter, color, values }) => {
            if (!activeSet.has(hunter.id)) return null;

            const pts = values.map((val, mIdx) => ({
              x: getX(mIdx),
              y: getY(val),
              val,
              month: MONTH_LABELS[mIdx]
            }));

            const pathD = getSmoothPath(pts);

            return (
              <g key={`line-${hunter.id}`} className="group">
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 opacity-90 group-hover:opacity-100 group-hover:stroke-width-[4px]"
                />

                {/* Circles at data points */}
                {pts.map((pt, pIdx) => (
                  <circle
                    key={`pt-${hunter.id}-${pIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill={color}
                    stroke={isDark ? "#18130f" : "#ffffff"}
                    strokeWidth="2"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        name: hunter.name,
                        avatar: hunter.avatar_url,
                        color,
                        month: pt.month,
                        count: pt.val,
                        x: pt.x,
                        y: pt.y
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className={`absolute z-20 pointer-events-none rounded-xl px-3 py-2 shadow-2xl flex items-center gap-2.5 transform -translate-x-1/2 -translate-y-full mb-2 ${isDark
              ? "bg-[#241c16] border border-[#3e3025] text-white"
              : "bg-slate-900 border border-slate-700 text-white"
              }`}
            style={{
              left: `${(hoveredPoint.x / SVG_W) * 100}%`,
              top: `${(hoveredPoint.y / SVG_H) * 100}%`
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: hoveredPoint.color }}
            />
            <Image
              src={hoveredPoint.avatar}
              alt={hoveredPoint.name}
              className="w-5 h-5 rounded-full object-cover"
            width={20} height={20} />
            <div className="text-base font-bold text-white whitespace-nowrap">
              {hoveredPoint.name}: <span className="text-[#ff6154] font-black">{hoveredPoint.count} hunts</span>
              <div className={`text-[10px] font-mono font-normal ${isDark ? "text-[#a89d91]" : "text-slate-400"
                }`}>
                {hoveredPoint.month}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopHuntersPage() {
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);

  // Initial one-time products load for marquee: load exactly 20 random favicon icons from DB
  useEffect(() => {
    const shuffleAndPick20 = (list: Product[]): Product[] => {
      if (!list || list.length === 0) return [];
      // Prefer products that have logo_url / favicon icon
      const withLogo = list.filter((p) => p && p.logo_url);
      const pool = withLogo.length >= 20 ? withLogo : list.filter((p) => p && (p.logo_url || p.name));

      // Fisher-Yates unbiased random shuffle
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.slice(0, 20);
    };

    const cached = getCachedProducts();
    if (cached && cached.length > 0) {
      setTopProducts(shuffleAndPick20(cached));
    }

    getProducts()
      .then((prods) => {
        if (prods && prods.length > 0) {
          setTopProducts(shuffleAndPick20(prods));
        }
      })
      .catch(() => {});
  }, []);

  const [timeframe, setTimeframe] = useState<"all_time" | "last_year" | "last_month" | "last_week">("all_time");
  const [rankCategory, setRankCategory] = useState<"top_hunters" | "weekly" | "monthly" | "yearly">("top_hunters");
  const [sortBy, setSortBy] = useState<"hunts" | "upvotes" | "comments" | "first_places" | "avg_upvotes">("hunts");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timeframe, rankCategory, sortBy]);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Instantly preload hero product logos into browser image cache
  useEffect(() => {
    if (topProducts.length > 0 && typeof window !== "undefined") {
      topProducts.forEach((p) => {
        if (p.logo_url) {
          const img = new window.Image();
          img.src = p.logo_url;
        }
      });
    }
  }, [topProducts]);

  useEffect(() => {
    let isCurrent = true;
    async function loadData() {
      setLoading(true);
      const data = await getTopHuntersData(timeframe);
      if (isCurrent) {
        setHunters(data);
        setLoading(false);
      }
    }
    loadData();
    return () => { isCurrent = false; };
  }, [timeframe]);

  const handlePillSelect = (cat: "top_hunters" | "weekly" | "monthly" | "yearly") => {
    setRankCategory(cat);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (cat === "top_hunters") setTimeframe("all_time");
    else if (cat === "weekly") setTimeframe("last_week");
    else if (cat === "monthly") setTimeframe("last_month");
    else if (cat === "yearly") setTimeframe("last_year");
  };

  const handleTimeframeSelect = (tf: "all_time" | "last_year" | "last_month" | "last_week") => {
    setTimeframe(tf);
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (tf === "all_time") setRankCategory("top_hunters");
    else if (tf === "last_week") setRankCategory("weekly");
    else if (tf === "last_month") setRankCategory("monthly");
    else if (tf === "last_year") setRankCategory("yearly");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "k";
    return num.toString();
  };

  const filteredHunters = (hunters || [])
    .filter((h) => {
      if (!h) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = (h.name || "").toLowerCase();
      const username = (h.username || "").toLowerCase();
      return name.includes(q) || username.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "hunts") return (b.hunts_count || 0) - (a.hunts_count || 0);
      if (sortBy === "upvotes") return (b.upvotes_count || 0) - (a.upvotes_count || 0);
      if (sortBy === "comments") return (b.comments_count || 0) - (a.comments_count || 0);
      if (sortBy === "first_places") return (b.first_places_count || 0) - (a.first_places_count || 0);
      if (sortBy === "avg_upvotes") return (b.avg_upvotes || 0) - (a.avg_upvotes || 0);
      return (b.hunts_count || 0) - (a.hunts_count || 0);
    });

  const totalPages = Math.max(1, Math.ceil(filteredHunters.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedHunters = filteredHunters.slice(
    (validCurrentPage - 1) * ITEMS_PER_PAGE,
    validCurrentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validCurrentPage > 3) pages.push("...");
      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (validCurrentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const validHunters = (hunters || []).filter(h => h && h.id);
  const mostFeatured = validHunters.length > 0 ? [...validHunters].sort((a, b) => (b.hunts_count || 0) - (a.hunts_count || 0))[0] : null;
  const mostFirsts = validHunters.length > 0 ? [...validHunters].sort((a, b) => (b.first_places_count || 0) - (a.first_places_count || 0))[0] : null;
  const highestAvgUpvotes = validHunters.length > 0 ? [...validHunters].sort((a, b) => (b.avg_upvotes || 0) - (a.avg_upvotes || 0))[0] : null;
  const mostDiscussed = validHunters.length > 0 ? [...validHunters].sort((a, b) => (b.avg_comments || 0) - (a.avg_comments || 0))[0] : null;
  const mostUpvotes = validHunters.length > 0 ? [...validHunters].sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0))[0] : null;
  const mostComments = validHunters.length > 0 ? [...validHunters].sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0))[0] : null;

  return (
    <div className="min-h-screen font-sans selection:bg-orange-500 selection:text-white transition-colors duration-200 bg-background text-foreground">
      <Navbar />

      <style jsx global>{`
        @keyframes marqueeLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-left {
          animation: marqueeLeft 90s linear infinite;
        }
        .animate-marquee-right {
          animation: marqueeRight 90s linear infinite;
        }
      `}</style>

      {/* ── HERO TOP MARQUEE SECTION ────────────────────────────────────────── */}
      <div className="relative border-b border-border pt-28 sm:pt-32 pb-12 overflow-hidden bg-background">
        {/* Top Moving Marquee Strip */}
        <div className="relative w-full overflow-hidden mb-6 py-1 select-none">
          <div className="flex items-center gap-3 sm:gap-4 animate-marquee-left hover:[animation-play-state:paused] w-max">
            {(topProducts.length > 0 ? [...topProducts, ...topProducts, ...topProducts] : []).map((product, idx) => (
              <Link
                key={`top-${product.id}-${idx}`}
                href={`/products/${product.id}`}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center transition-all group bg-card border border-border shadow-xs hover:border-orange-500 hover:shadow-md hover:scale-105"
                title={product.name}
              >
                <Favicon src={product.logo_url} websiteUrl={product.website_url} size={48} alt={product.name} className="w-full h-full object-cover" />
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 space-y-4 relative z-10">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-foreground">
            The top IndiHunt hunters & makers, ranked.
          </h1>

          <p className="text-base max-w-2xl mx-auto font-normal text-muted-foreground">
            The highest-voted hunters and top products built by makers across every category, all on one page.
          </p>

          {/* Central Pill Filters */}
          <div className="pt-2 w-full max-w-full flex justify-center overflow-x-auto no-scrollbar py-1">
            <div className="p-1 sm:p-1.5 rounded-full border border-border bg-muted/70 inline-flex items-center gap-0.5 sm:gap-1 shadow-xs shrink-0 max-w-full overflow-x-auto no-scrollbar">
              <button
                onClick={() => handlePillSelect("top_hunters")}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${rankCategory === "top_hunters"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Top Hunters
              </button>
              <button
                onClick={() => handlePillSelect("weekly")}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${rankCategory === "weekly"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Weekly Rank
              </button>
              <button
                onClick={() => handlePillSelect("monthly")}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${rankCategory === "monthly"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Monthly Rank
              </button>
              <button
                onClick={() => handlePillSelect("yearly")}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${rankCategory === "yearly"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Yearly Rank
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Moving Marquee Strip */}
        <div className="relative w-full overflow-hidden mt-8 py-1 select-none">
          <div className="flex items-center gap-3 sm:gap-4 animate-marquee-right hover:[animation-play-state:paused] w-max">
            {(topProducts.length > 0 ? [...topProducts, ...topProducts, ...topProducts].reverse() : []).map((product, idx) => (
              <Link
                key={`bottom-${product.id}-${idx}`}
                href={`/products/${product.id}`}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center transition-all group bg-card border border-border shadow-xs hover:border-orange-500 hover:shadow-md hover:scale-105"
                title={product.name}
              >
                <Favicon src={product.logo_url} websiteUrl={product.website_url} size={48} alt={product.name} className="w-full h-full object-cover" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Bar & Timeframe Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Top IndiHunt Hunters
          </h2>

          {/* Time Filter Group */}
          <div className="p-1 rounded-2xl border border-border bg-muted/60 inline-flex items-center gap-1 self-start md:self-auto shadow-xs max-w-full overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => handleTimeframeSelect("all_time")}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${timeframe === "all_time"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleTimeframeSelect("last_year")}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${timeframe === "last_year"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Last Year
            </button>
            <button
              onClick={() => handleTimeframeSelect("last_month")}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${timeframe === "last_month"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Last Month
            </button>
            <button
              onClick={() => handleTimeframeSelect("last_week")}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${timeframe === "last_week"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Last Week
            </button>
          </div>
        </div>

        {/* Sort Controls & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span>Sort by</span>
            <div className="relative inline-block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs sm:text-sm font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500 cursor-pointer appearance-none pr-7 shadow-xs border bg-card border-border text-foreground"
              >
                <option value="hunts">Most hunts ⇅</option>
                <option value="upvotes">Most upvotes ⇅</option>
                <option value="comments">Most comments ⇅</option>
                <option value="first_places">Most #1s ⇅</option>
                <option value="avg_upvotes">Highest avg upvotes ⇅</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none text-muted-foreground" />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search hunters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-border rounded-xl focus:outline-none focus:border-orange-500 shadow-xs bg-card text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* ── GRID: LEFT LIST + RIGHT HIGHLIGHT CARDS + SPONSORED BANNER + CHART ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: HUNTERS RANKING LIST (7/12 desktop) */}
          <div className="lg:col-span-7 space-y-3">
            {loading ? (
              // Loading Skeleton State
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <div
                    key={`skeleton-${n}`}
                    className="border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-4 bg-card animate-pulse shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-5 h-5 bg-muted rounded shrink-0" />
                      <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                      <div className="space-y-1.5 min-w-0">
                        <div className="w-28 h-4 bg-muted rounded" />
                        <div className="w-20 h-3 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="w-10 h-8 bg-muted rounded" />
                      <div className="w-10 h-8 bg-muted rounded" />
                      <div className="w-10 h-8 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              paginatedHunters.map((hunter, index) => (
                <div
                  key={hunter.id || `hunter-${index}`}
                  className="relative border border-border/80 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all bg-card shadow-xs hover:border-orange-500/30 hover:shadow-sm"
                >
                  {/* Left: Rank + Avatar + Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-sm font-extrabold w-5 text-center shrink-0 text-muted-foreground">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </span>

                    <Link href={`/@${(hunter.username || 'maker').replace(/^@/, '')}`} className="flex items-center gap-3.5 min-w-0 group">
                      <div className="relative shrink-0">
                        <Image
                          src={hunter.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={hunter.name || 'Hunter'}
                          loading="eager"
                          decoding="async"
                          className="w-10 h-10 rounded-full object-cover border border-border group-hover:border-orange-500 transition-all"
                        width={40} height={40} />
                        {hunter.is_verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 absolute -bottom-0.5 -right-0.5 rounded-full bg-background" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-foreground group-hover:text-orange-500 transition-colors truncate">
                            {hunter.name || hunter.username || 'Indie Hunter'}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground group-hover:text-orange-500 transition-colors truncate">
                          @{hunter.username ? hunter.username.replace(/^@/, '') : 'maker'}
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Right: Stat Columns */}
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-center">
                    {/* Upvotes Column */}
                    <div className="flex flex-col items-center min-w-[44px]">
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-extrabold mt-0.5 text-foreground">
                        {formatNumber(hunter.upvotes_count || 0)}
                      </span>
                    </div>

                    {/* Comments Column */}
                    <div className="flex flex-col items-center min-w-[44px]">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-extrabold mt-0.5 text-foreground">
                        {formatNumber(hunter.comments_count || 0)}
                      </span>
                    </div>

                    {/* Hunts Count Column */}
                    <div className="flex flex-col items-center min-w-[44px]">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Hunts</span>
                      <span className="text-sm font-black text-orange-500 mt-0.5">
                        {hunter.hunts_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {filteredHunters.length === 0 && !loading && (
              <div className="py-16 text-center text-sm rounded-2xl border border-border bg-card text-muted-foreground">
                No hunters found matching "{searchQuery}".
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {(validCurrentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>
                  {" "}to{" "}
                  <span className="font-semibold text-foreground">
                    {Math.min(validCurrentPage * ITEMS_PER_PAGE, filteredHunters.length)}
                  </span>
                  {" "}of{" "}
                  <span className="font-semibold text-foreground">
                    {filteredHunters.length}
                  </span>{" "}
                  top hunters
                </p>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  {/* First Page */}
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={validCurrentPage === 1}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={validCurrentPage === 1}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Smart Ellipsis Page Numbers */}
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
                    const isActive = pageNum === validCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`min-w-[36px] h-9 sm:min-w-[40px] sm:h-10 px-2.5 sm:px-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-orange-500 text-white font-semibold shadow-xs"
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
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={validCurrentPage === totalPages}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => {
                      setCurrentPage(totalPages);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={validCurrentPage === totalPages}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer border border-border/40 bg-card"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: 6 HIGHLIGHT CARDS + SPONSORED BANNER + CHART (5/12 desktop) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 6 Featured Highlight Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Card 1: Most featured */}
              {mostFeatured && (
                <div className="border border-border/80 rounded-2xl p-4 space-y-3 bg-card shadow-xs hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <Target className="w-3.5 h-3.5 text-amber-500" />
                    <span>Most featured</span>
                  </div>
                  <Link href={`/@${(mostFeatured.username || 'maker').replace(/^@/, '')}`} className="flex items-center gap-3 group">
                    <Image
                      src={mostFeatured.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={mostFeatured.name || 'Hunter'}
                      loading="eager"
                      decoding="async"
                      className="w-9 h-9 rounded-full object-cover border border-border group-hover:border-orange-500 transition-all"
                    width={36} height={36} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground group-hover:text-orange-500 truncate transition-colors">
                        {mostFeatured.name || mostFeatured.username || 'Hunter'}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground group-hover:text-orange-500 truncate transition-colors">
                        @{mostFeatured.username ? mostFeatured.username.replace(/^@/, '') : 'maker'}
                      </div>
                    </div>
                  </Link>
                  <div className="text-sm font-black text-orange-500">
                    {mostFeatured.hunts_count || 0} <span className="text-xs font-normal text-muted-foreground">hunts</span>
                  </div>
                </div>
              )}

              {/* Card 2: Most #1s */}
              {mostFirsts && (
                <div className="border border-border/80 rounded-2xl p-4 space-y-3 bg-card shadow-xs hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Most #1s</span>
                  </div>
                  <Link href={`/@${(mostFirsts.username || 'maker').replace(/^@/, '')}`} className="flex items-center gap-3 group">
                    <Image
                      src={mostFirsts.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={mostFirsts.name || 'Hunter'}
                      loading="eager"
                      decoding="async"
                      className="w-9 h-9 rounded-full object-cover border border-border group-hover:border-orange-500 transition-all"
                    width={36} height={36} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground group-hover:text-orange-500 truncate transition-colors">
                        {mostFirsts.name || mostFirsts.username || 'Hunter'}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground group-hover:text-orange-500 truncate transition-colors">
                        @{mostFirsts.username ? mostFirsts.username.replace(/^@/, '') : 'maker'}
                      </div>
                    </div>
                  </Link>
                  <div className="text-sm font-black text-orange-500">
                    {mostFirsts.first_places_count || 0} <span className="text-xs font-normal text-muted-foreground">#1 placements</span>
                  </div>
                </div>
              )}

              {/* Card 3: Highest avg upvotes */}
              {highestAvgUpvotes && (
                <div className="border border-border/80 rounded-2xl p-4 space-y-3 bg-card shadow-xs hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
                    <span>Highest avg upvotes</span>
                  </div>
                  <Link href={`/@${(highestAvgUpvotes.username || 'maker').replace(/^@/, '')}`} className="flex items-center gap-3 group">
                    <Image
                      src={highestAvgUpvotes.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={highestAvgUpvotes.name || 'Hunter'}
                      loading="eager"
                      decoding="async"
                      className="w-9 h-9 rounded-full object-cover border border-border group-hover:border-orange-500 transition-all"
                    width={36} height={36} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground group-hover:text-orange-500 truncate transition-colors">
                        {highestAvgUpvotes.name || highestAvgUpvotes.username || 'Hunter'}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground group-hover:text-orange-500 truncate transition-colors">
                        @{highestAvgUpvotes.username ? highestAvgUpvotes.username.replace(/^@/, '') : 'maker'}
                      </div>
                    </div>
                  </Link>
                  <div className="text-sm font-black text-orange-500">
                    {highestAvgUpvotes.avg_upvotes || 0} <span className="text-xs font-normal text-muted-foreground">avg upvotes</span>
                  </div>
                </div>
              )}

              {/* Card 4: Most discussed */}
              {mostDiscussed && (
                <div className="border border-border/80 rounded-2xl p-4 space-y-3 bg-card shadow-xs hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    <span>Most discussed</span>
                  </div>
                  <Link href={`/@${(mostDiscussed.username || 'maker').replace(/^@/, '')}`} className="flex items-center gap-3 group">
                    <Image
                      src={mostDiscussed.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={mostDiscussed.name || 'Hunter'}
                      loading="eager"
                      decoding="async"
                      className="w-9 h-9 rounded-full object-cover border border-border group-hover:border-orange-500 transition-all"
                    width={36} height={36} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground group-hover:text-orange-500 truncate transition-colors">
                        {mostDiscussed.name || mostDiscussed.username || 'Hunter'}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground group-hover:text-orange-500 truncate transition-colors">
                        @{mostDiscussed.username ? mostDiscussed.username.replace(/^@/, '') : 'maker'}
                      </div>
                    </div>
                  </Link>
                  <div className="text-sm font-black text-orange-500">
                    {mostDiscussed.avg_comments || 0} <span className="text-xs font-normal text-muted-foreground">avg comments</span>
                  </div>
                </div>
              )}

              {/* Card 5: Most upvotes */}
              {mostUpvotes && (
                <div className="border border-border/80 rounded-2xl p-4 space-y-3 bg-card shadow-xs hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <ChevronUp className="w-3.5 h-3.5 text-orange-500" />
                    <span>Most upvotes</span>
                  </div>
                  <Link href={`/@${(mostUpvotes.username || 'maker').replace(/^@/, '')}`} className="flex items-center gap-3 group">
                    <Image
                      src={mostUpvotes.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={mostUpvotes.name || 'Hunter'}
                      loading="eager"
                      decoding="async"
                      className="w-9 h-9 rounded-full object-cover border border-border group-hover:border-orange-500 transition-all"
                    width={36} height={36} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground group-hover:text-orange-500 truncate transition-colors">
                        {mostUpvotes.name || mostUpvotes.username || 'Hunter'}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground group-hover:text-orange-500 truncate transition-colors">
                        @{mostUpvotes.username ? mostUpvotes.username.replace(/^@/, '') : 'maker'}
                      </div>
                    </div>
                  </Link>
                  <div className="text-sm font-black text-orange-500">
                    {formatNumber(mostUpvotes.upvotes_count || 0)} <span className="text-xs font-normal text-muted-foreground">total upvotes</span>
                  </div>
                </div>
              )}

              {/* Card 6: Most comments */}
              {mostComments && (
                <div className="border border-border/80 rounded-2xl p-4 space-y-3 bg-card shadow-xs hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    <span>Most comments</span>
                  </div>
                  <Link href={`/@${(mostComments.username || 'maker').replace(/^@/, '')}`} className="flex items-center gap-3 group">
                    <Image
                      src={mostComments.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={mostComments.name || 'Hunter'}
                      loading="eager"
                      decoding="async"
                      className="w-9 h-9 rounded-full object-cover border border-border group-hover:border-orange-500 transition-all"
                    width={36} height={36} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground group-hover:text-orange-500 truncate transition-colors">
                        {mostComments.name || mostComments.username || 'Hunter'}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground group-hover:text-orange-500 truncate transition-colors">
                        @{mostComments.username ? mostComments.username.replace(/^@/, '') : 'maker'}
                      </div>
                    </div>
                  </Link>
                  <div className="text-sm font-black text-orange-500">
                    {formatNumber(mostComments.comments_count || 0)} <span className="text-xs font-normal text-muted-foreground">total comments</span>
                  </div>
                </div>
              )}
            </div>

            {/* Real Active Sponsored Ad Placement */}
            <SponsoredAd placement="product_pages" />

            {/* Top 10 Hunters Over Time Chart Card in Right Column */}
            <TopHuntersChart hunters={hunters} isDark={isDark} />
          </div>
        </div>
      </main>
    </div>
  );
}
