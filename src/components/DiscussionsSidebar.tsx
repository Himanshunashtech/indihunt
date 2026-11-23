"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, TrendingUp, Trophy, ChevronRight } from "lucide-react";
import { getThreads, getTopHuntersData, Hunter } from "@/lib/supabase";

export const DISCUSSIONS_CATEGORIES = [
  { id: "all",                 label: "All Discussions",   emoji: "🌐" },
  { id: "General",             label: "General",            emoji: "💬" },
  { id: "vibecoding",          label: "Vibe Coding",        emoji: "⚡" },
  { id: "Ask",                 label: "AMA / Ask",          emoji: "🙋" },
  { id: "introduce-yourself",  label: "Introductions",      emoji: "👋" },
  { id: "self-promotion",      label: "Self-Promotion",     emoji: "📣" },
  { id: "faq",                 label: "FAQ / Support",      emoji: "❓" },
  { id: "vercel",              label: "p/vercel",           emoji: "▲" },
  { id: "IndiHunt",            label: "p/IndiHunt",         emoji: "🎯" },
  { id: "linkedin",            label: "p/LinkedIn",         emoji: "💼" },
];

interface DiscussionsSidebarProps {
  selectedForum?: string;
  onSelectForum?: (catId: string) => void;
  onOpenNewThread?: () => void;
  catCounts?: Record<string, number>;
  totalThreadsCount?: number;
}

export default function DiscussionsSidebar({
  selectedForum = "all",
  onSelectForum,
  onOpenNewThread,
  catCounts: externalCatCounts,
  totalThreadsCount: externalTotalThreads,
}: DiscussionsSidebarProps) {
  const router = useRouter();
  const [pulseActiveMakers, setPulseActiveMakers] = useState(0);
  const [pulseUpvotes, setPulseUpvotes] = useState(0);
  const [pulseCategoriesCount, setPulseCategoriesCount] = useState(0);
  const [internalCatCounts, setInternalCatCounts] = useState<Record<string, number>>({});
  const [internalTotalThreads, setInternalTotalThreads] = useState(0);

  useEffect(() => {
    fetch('/t/stats/pulse')
      .then(res => res.ok ? res.json() : null)
      .then(resData => {
        const data = resData?.data || resData;
        if (data) {
          if (typeof data.activeMakers === 'number') setPulseActiveMakers(data.activeMakers);
          if (typeof data.upvotesCast === 'number') setPulseUpvotes(data.upvotesCast);
          if (typeof data.categoriesCount === 'number') setPulseCategoriesCount(data.categoriesCount);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (externalCatCounts === undefined || externalTotalThreads === undefined) {
      getThreads().then(list => {
        setInternalTotalThreads(list.length);
        const counts: Record<string, number> = {};
        list.forEach(t => {
          const c = t.category?.toLowerCase() || "general";
          counts[c] = (counts[c] || 0) + 1;
        });
        setInternalCatCounts(counts);
      });
    }
  }, [externalCatCounts, externalTotalThreads]);

  const catCounts = externalCatCounts ?? internalCatCounts;
  const totalCount = externalTotalThreads ?? internalTotalThreads;

  const handleStartThread = () => {
    if (onOpenNewThread) {
      onOpenNewThread();
    } else {
      router.push("/discussions?new=1");
    }
  };

  const handleCategoryClick = (catId: string) => {
    if (onSelectForum) {
      onSelectForum(catId);
    } else {
      if (catId === "all") {
        router.push("/discussions");
      } else {
        router.push(`/discussions?category=${encodeURIComponent(catId)}`);
      }
    }
  };

  const [topHunters, setTopHunters] = useState<Hunter[]>([]);

  useEffect(() => {
    getTopHuntersData().then(data => setTopHunters(data.slice(0, 5)));
  }, []);

  return (
    <aside className="lg:col-span-3 flex flex-col gap-5 sticky top-24 self-start z-10 max-h-[calc(100vh-100px)] overflow-y-auto pr-1">
      {/* Categories (Desktop only, hidden on mobile screens) */}
      <div className="hidden lg:block border-b border-border/40 pb-5 mb-2">
        <h3 className="text-base font-medium text-foreground/80 mb-3">Categories</h3>
        <div className="space-y-0.5">
          {DISCUSSIONS_CATEGORIES.map(cat => {
            const count = cat.id === "all" ? totalCount : (catCounts[cat.id.toLowerCase()] ?? 0);
            const active = selectedForum.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  active ? "bg-muted text-foreground font-semibold border border-border/60" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </span>
                {count > 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    active ? "bg-background text-foreground border border-border/80" : "bg-muted/80 text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Hunters Widget (Desktop only) */}
      <div className="hidden lg:block border-b border-border/40 pb-5 mb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-widest">Top Hunters</span>
          </div>
          <Link
            href="/top-hunters"
            className="text-xs font-semibold text-[#ff5733] hover:underline flex items-center gap-0.5 transition-colors"
          >
            Show all
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-1.5">
          {topHunters.slice(0, 4).map((hunter, idx) => (
            <Link
              key={hunter.id}
              href="/top-hunters"
              className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={hunter.avatar_url}
                    alt={hunter.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(hunter.name || hunter.username || "User")}`;
                    }}
                    className="w-8 h-8 rounded-full object-cover border border-border/60"
                  />
                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${
                    idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-700" : "bg-muted-foreground/40 text-foreground"
                  }`}>
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs sm:text-sm font-medium text-foreground group-hover:text-[#ff5733] transition-colors truncate">
                    {hunter.name}
                  </h5>
                  <p className="text-[11px] text-muted-foreground truncate">
                    @{hunter.username}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-foreground/80 shrink-0">
                {hunter.hunts_count} hunts
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Weekly Spotlight (Desktop only, hidden on mobile screens) */}
      <div className="hidden lg:block bg-gradient-to-br from-orange-600 to-amber-500 text-white p-5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-extrabold uppercase tracking-widest">Weekly Spotlight</span>
          </div>
          <h4 className="font-semibold text-sm sm:text-base mb-2 leading-snug">
            &ldquo;How we scaled to 10k users in 3 months&rdquo;
          </h4>
          <p className="text-xs sm:text-sm opacity-90 mb-4 leading-relaxed">
            Join the live AMA — Indian founders share their growth stories every week.
          </p>
          <button 
            onClick={() => router.push("/discussions")}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer backdrop-blur-sm"
          >
            Set Reminder 🔔
          </button>
        </div>
        <div className="absolute -right-3 -bottom-3 opacity-10 text-[80px] select-none pointer-events-none">✨</div>
      </div>

      {/* Ecosystem Pulse (Desktop only, hidden on mobile screens) */}
      <div className="hidden lg:block border-b border-border/40 pb-5 mb-2">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-widest">Ecosystem Pulse</span>
        </div>
        <div className="space-y-1">
          {[
            { label: "Active Makers",     value: pulseActiveMakers.toLocaleString() },
            { label: "Total Upvotes Cast", value: pulseUpvotes.toLocaleString()      },
            { label: "Forum Categories",   value: `${pulseCategoriesCount} domains`  },
            { label: "Total Threads",      value: totalCount.toString()               },
          ].map(stat => (
            <div key={stat.label} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted transition-colors cursor-default">
              <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
              <span className="text-xs sm:text-sm font-semibold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
