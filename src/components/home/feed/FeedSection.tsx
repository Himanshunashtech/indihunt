"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Product, BillboardAd } from "@/lib/supabase";
import ProductItem from "./ProductItem";
import FeedBillboardAd from "./FeedBillboardAd";

export interface FeedSectionData {
  id: string;
  title: string;
  subtitle?: string;
  hideHeader?: boolean;
  items: Product[];
  emptyMessage: string;
  hasMoreUpcoming?: boolean;
  totalUpcoming?: number;
  totalCount?: number;
  seeAllText?: string;
  seeAllHref?: string;
  isExpanded?: boolean;
}

interface FeedSectionProps {
  section: FeedSectionData;
  selectedBillboardAds: BillboardAd[];
  showBillboardAd?: boolean;
  onVote: (e: React.MouseEvent, productId: string) => void;
  onLoadMoreUpcoming?: () => void;
  onToggleExpand?: (sectionId: string) => void;
}

export default function FeedSection({
  section,
  selectedBillboardAds,
  showBillboardAd = false,
  onVote,
  onLoadMoreUpcoming,
  onToggleExpand,
}: FeedSectionProps) {
  const billboardAd =
    selectedBillboardAds && selectedBillboardAds.length > 0
      ? selectedBillboardAds[0]
      : undefined;

  return (
    <div className="space-y-2">
      {!section.hideHeader && (
        <div className="flex items-center justify-between pb-1 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5733]" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground/90 tracking-tight">
              {section.title}
            </h2>
            <span
              suppressHydrationWarning
              className="text-base font-semibold bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full border border-border/40"
            >
              {section.items.length}
            </span>
          </div>
          {section.seeAllHref && section.id !== "today" ? (
            <Link
              href={section.seeAllHref}
              prefetch={false}
              className="hidden sm:flex group/link text-xs sm:text-sm font-semibold text-muted-foreground hover:text-[#ff5733] transition-colors items-center gap-1 cursor-pointer"
            >
              <span>{section.subtitle || "View archive"}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          ) : section.subtitle ? (
            <span className="text-base text-muted-foreground font-normal hidden sm:inline">
              {section.subtitle}
            </span>
          ) : null}
        </div>
      )}

      {section.items.length === 0 ? (
        <div className="space-y-1">
          <p className="py-1 text-center text-base font-normal text-muted-foreground">
            {section.emptyMessage}
          </p>
          {showBillboardAd && (
            <div className="pt-2 pb-1 sm:pb-2" suppressHydrationWarning>
              <FeedBillboardAd
                ad={billboardAd}
                type="indihunt_fallback"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {section.items.map((p, idx) => (
            <React.Fragment key={`${section.id}-${p.id}-${idx}`}>
              <ProductItem product={p} idx={idx} onVote={onVote} />
              {showBillboardAd &&
                (idx === 4 ||
                  (section.items.length <= 4 &&
                    idx === section.items.length - 1)) && (
                  <div className="pt-2 pb-1 sm:pt-4 sm:pb-2" suppressHydrationWarning>
                    <FeedBillboardAd
                      ad={billboardAd}
                      type="indihunt_fallback"
                    />
                  </div>
                )}
            </React.Fragment>
          ))}
        </div>
      )}

      {section.id === "upcoming" ? (
        section.hasMoreUpcoming ? (
          <div className="pt-2 pb-4">
            <button
              type="button"
              onClick={onLoadMoreUpcoming}
              className="w-full py-3 px-6 rounded-full border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-center gap-2 text-base font-medium text-foreground/85 hover:text-[#ff5733] transition-all group shadow-2xs cursor-pointer"
            >
              <span>Load More</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        ) : section.totalUpcoming && section.totalUpcoming > 0 ? (
          <div className="pt-2 pb-4 text-center text-sm font-medium text-muted-foreground italic">
            All scheduled upcoming launches loaded.
          </div>
        ) : null
      ) : section.id === "today" ? (
        section.totalCount && section.totalCount > 20 && section.seeAllText ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onToggleExpand?.("today")}
              className="w-full py-3 px-6 rounded-full border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-center gap-2 text-base font-medium text-foreground/85 hover:text-[#ff5733] transition-all group shadow-2xs cursor-pointer"
            >
              <span>{section.seeAllText}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  section.isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        ) : null
      ) : (
        section.seeAllText &&
        section.seeAllHref && (
          <div className="pt-2 pb-4">
            <Link
              href={section.seeAllHref}
              prefetch={false}
              className="w-full py-3 px-6 rounded-full border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-center text-base font-medium text-foreground/85 hover:text-[#ff5733] transition-all group shadow-2xs"
            >
              <span>{section.seeAllText}</span>
            </Link>
          </div>
        )
      )}
    </div>
  );
}
