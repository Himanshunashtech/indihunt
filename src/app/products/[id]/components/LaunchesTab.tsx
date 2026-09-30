"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Rocket,
  Calendar,
  ArrowUp,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Award,
  Globe,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import {
  Product,
  getProductSlug,
  extractDomainFromUrl,
  calculateProductRank,
} from "@/lib/supabase";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface LaunchesTabProps {
  currentProduct: Product;
  launches: Product[];
  allProductsList?: Product[];
  user: any;
  onVote?: (e: React.MouseEvent, productId: string) => void;
}

type SortOption = "newest" | "oldest" | "upvotes" | "comments";

export default function LaunchesTab({
  currentProduct,
  launches = [],
  allProductsList = [],
  user,
  onVote,
}: LaunchesTabProps) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Extract company domain name
  const companyDomain = useMemo(() => {
    return extractDomainFromUrl(currentProduct.website_url || "");
  }, [currentProduct.website_url]);

  const companyTitle = useMemo(() => {
    if (companyDomain && companyDomain.includes(".")) {
      return `${companyDomain} launches`;
    }
    return `${currentProduct.name} launches`;
  }, [companyDomain, currentProduct.name]);

  // Sort launches
  const sortedLaunches = useMemo(() => {
    const list = [...launches];
    return list.sort((a, b) => {
      if (sortBy === "upvotes") {
        return (b.upvotes_count || 0) - (a.upvotes_count || 0);
      }
      if (sortBy === "comments") {
        return (b.comments_count || 0) - (a.comments_count || 0);
      }
      const dateA = new Date(a.scheduled_for || a.created_at).getTime();
      const dateB = new Date(b.scheduled_for || b.created_at).getTime();
      if (sortBy === "oldest") {
        return dateA - dateB;
      }
      // default: newest
      return dateB - dateA;
    });
  }, [launches, sortBy]);

  // Format date helper (e.g. "September 29th, 2026")
  const formatLaunchDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      const day = d.getDate();
      const suffix =
        day === 1 || day === 21 || day === 31
          ? "st"
          : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
          ? "rd"
          : "th";
      const month = d.toLocaleDateString("en-US", { month: "long" });
      const year = d.getFullYear();
      return `Launched on ${month} ${day}${suffix}, ${year}`;
    } catch {
      return "Recently";
    }
  };

  const sortLabels: Record<SortOption, string> = {
    newest: "Launch date",
    oldest: "Oldest first",
    upvotes: "Highest votes",
    comments: "Most comments",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar with title and sort filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {companyTitle}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Discover all {launches.length} product releases and version launches
            from{" "}
            <span className="font-semibold text-foreground">
              {companyDomain || currentProduct.name}
            </span>
          </p>
        </div>

        {/* Sort Filter Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto focus:outline-hidden"
            >
              <span className="text-muted-foreground font-normal">Sort:</span>
              <span>{sortLabels[sortBy]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-xl p-1 animate-in fade-in zoom-in-95 duration-150 text-xs"
            >
              {(["newest", "oldest", "upvotes", "comments"] as SortOption[]).map(
                (opt) => (
                  <DropdownMenu.Item
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors focus:outline-hidden ${
                      sortBy === opt
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{sortLabels[opt]}</span>
                    {sortBy === opt && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                    )}
                  </DropdownMenu.Item>
                )
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Launches List */}
      <div className="space-y-3">
        {sortedLaunches.map((item) => {
          const isCurrent = item.id === currentProduct.id;
          const slug = getProductSlug(item.name);
          const launchDateText = formatLaunchDate(
            item.scheduled_for || item.created_at
          );

          // Calculate daily rank if full product pool is provided
          const rankInfo =
            allProductsList.length > 0
              ? calculateProductRank(item, allProductsList)
              : null;

          return (
            <div
              key={item.id}
              className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 bg-card hover:shadow-md ${
                isCurrent
                  ? "border-orange-500/50 bg-orange-500/[0.02] shadow-xs"
                  : "border-border/60 hover:border-border"
              }`}
            >
              {/* Left Column: Logo & Product Details */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                <Link
                  href={`/products/${slug || item.id}`}
                  className="shrink-0 relative focus:outline-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image
                    src={item.logo_url || "/favicon.png"}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover border border-border/60 bg-white dark:bg-slate-900 shadow-2xs group-hover:scale-105 transition-transform"
                  width={48} height={48} />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/products/${slug || item.id}`}
                      className="text-base font-bold text-foreground hover:text-orange-500 transition-colors truncate focus:outline-hidden"
                    >
                      {item.name}
                    </Link>

                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        Current
                      </span>
                    )}

                    {item.featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Featured
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                    {item.tagline || item.description || "No tagline provided"}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {launchDateText}
                    </span>

                    {item.website_url && (
                      <a
                        href={item.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate max-w-[140px]">
                          {extractDomainFromUrl(item.website_url)}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Rank & Upvotes & Comments */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                {/* Rank Badge if in top 5 */}
                {rankInfo?.rank && rankInfo.rank <= 10 && (
                  <div
                    title={`#${rankInfo.rank} ${rankInfo.rankLabel}`}
                    className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                  >
                    #{rankInfo.rank}
                  </div>
                )}

                {/* Comments box */}
                <Link
                  href={`/products/${slug || item.id}?tab=Overview`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted text-foreground text-xs font-semibold transition-all hover:border-border cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{item.comments_count || 0}</span>
                </Link>

                {/* Upvote Box */}
                <button
                  type="button"
                  onClick={(e) => {
                    if (onVote) {
                      onVote(e, item.id);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-bold text-xs transition-all shadow-2xs cursor-pointer active:scale-95 ${
                    item.has_upvoted
                      ? "border-orange-500 bg-orange-500 text-white shadow-orange-500/20"
                      : "border-border/70 bg-card hover:border-orange-500/60 hover:bg-orange-500/5 text-foreground"
                  }`}
                >
                  <ArrowUp
                    className={`w-3.5 h-3.5 ${
                      item.has_upvoted ? "text-white" : "text-orange-500"
                    }`}
                  />
                  <span>{item.upvotes_count || 0}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
