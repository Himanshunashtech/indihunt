import React from "react";
import Link from "next/link";
import { Orbit, Calendar, Award } from "lucide-react";
import { Product } from "@/lib/supabase";
import { HexagonAwardBadge, getAwardSolidTheme } from "@/components/AwardBadge";

export interface AwardItem {
  type: string;
  title: string;
  subtitle: string;
  date: string;
  rank: string;
  iconType: string;
  tagline?: string;
}

interface AwardsTabProps {
  product: Product;
  productAwards: AwardItem[];
}

export default function AwardsTab({ product, productAwards }: AwardsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-card border border-border p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Launch Awards</h3>
          <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">Recognition and leaderboard milestones achieved by {product.name}</span>
        </div>
        <Link
          href="/awards"
          className="px-3.5 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shrink-0 shadow-xs flex items-center justify-center gap-1.5 w-fit"
        >
          <span>View All Awards</span>
          <span>→</span>
        </Link>
      </div>

      {productAwards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {productAwards.map((award, i) => (
            <div
              key={i}
              className="bg-card border border-border/85 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 hover:border-orange-500/30 transition-all shadow-sm relative overflow-hidden"
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${award.iconType === "orbit" ? "text-red-500" : "text-muted-foreground/80"
                }`}>
                {award.type}
              </span>

              <HexagonAwardBadge rank={award.rank} type={award.type} size="lg" title={award.title} />

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block truncate max-w-[180px]">{award.subtitle}</span>
                <h4 className="text-sm font-bold text-foreground leading-tight">{award.title}</h4>
              </div>

              <div className="pt-2 border-t border-border/50 w-full">
                {award.tagline && (
                  <span className="text-[10px] text-muted-foreground font-medium block mb-1">{award.tagline}</span>
                )}
                <span className="text-[10px] text-muted-foreground font-normal block">{award.date}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border p-8 rounded-3xl text-center space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">This product hasn't unlocked any launch awards yet.</p>
          <p className="text-xs text-muted-foreground/80">Support this product by upvoting to help it rank and unlock daily or weekly milestones!</p>
        </div>
      )}
    </div>
  );
}
