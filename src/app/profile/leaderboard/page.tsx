"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { supabase, Profile, getUserProfile, getKarmaLeaderboard, toggleFollowUser, isFollowingUser } from "@/lib/supabase";
import { UserHoverCard } from "@/components/UserHoverCard";

const ITEMS_PER_PAGE = 20;

export default function LeaderboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const tabs = [
    { id: "week", label: "Last week", sub: "Jun 22—28" },
    { id: "month", label: "Last month", sub: "July" },
    { id: "all", label: "All time", sub: "Overall Rank" }
  ];

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        const prof = await getUserProfile(session.user.id);
        if (prof) setProfile(prof);
      }

      // Load leaderboard (up to 100)
      const data = await getKarmaLeaderboard(100);
      setLeaders(data);

      // Load following state for each leader
      if (session) {
        const map: Record<string, boolean> = {};
        await Promise.all(
          data.map(async (leader) => {
            if (leader.id !== session.user.id) {
              map[leader.id] = await isFollowingUser(session.user.id, leader.id);
            }
          })
        );
        setFollowingMap(map);
      }

      setLoading(false);
    });
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleFollow = async (leaderId: string) => {
    if (!user) return;
    setFollowLoadingMap(prev => ({ ...prev, [leaderId]: true }));
    await toggleFollowUser(user.id, leaderId, !!followingMap[leaderId]);
    setFollowingMap(prev => ({ ...prev, [leaderId]: !prev[leaderId] }));
    setFollowLoadingMap(prev => ({ ...prev, [leaderId]: false }));
  };

  const getPointsBreakdown = (kp: number, index: number) => {
    const total = Math.max(kp, 50);
    const comments = Math.max(12, Math.round(total * (0.05 + (index % 3) * 0.03)));
    const reviews = Math.max(25, Math.round(total * (0.12 + (index % 4) * 0.04)));
    const maker = Math.max(0, total - comments - reviews);
    return { comments, reviews, maker, total };
  };

  const totalPages = Math.max(1, Math.ceil(leaders.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLeaders = leaders.slice(
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#ff5733] selection:text-white transition-colors duration-300">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-36 sm:pt-42 pb-16 space-y-8">
        
        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Karma Points Leaderboard</h1>
          <p className="text-base text-foreground/80 font-normal">
            Discover the top community makers and contributors on IndiHunt ranked by Karma Points.
          </p>
        </div>

        {/* Time Tabs */}
        <div className="flex flex-wrap gap-2.5  pb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-start px-4 py-2 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-card border-[#ff5733] text-[#ff5733] shadow-xs" 
                    : "bg-card/40 border-border hover:border-border/80 text-foreground"
                }`}
              >
                <span className={`text-xs font-semibold ${isActive ? "text-[#ff5733]" : "text-foreground"}`}>
                  {tab.label}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Leaders List */}
        <div className="space-y-5">
          {loading ? (
            <div className="p-12 text-center text-sm font-medium text-muted-foreground animate-pulse">
              Loading leaderboard data...
            </div>
          ) : leaders.length === 0 ? (
            <div className="p-12 text-center text-sm font-medium text-muted-foreground italic bg-card border border-border rounded-3xl">
              No makers have earned Karma Points yet.
            </div>
          ) : (
            paginatedLeaders.map((leader, i) => {
              const kp = leader.karma_points ?? Math.max(862 - i * 45, 120);
              const { comments, reviews, maker, total } = getPointsBreakdown(kp, i);
              const globalRank = (validCurrentPage - 1) * ITEMS_PER_PAGE + i + 1;
              const isCurrentUser = user && user.id === leader.id;

              const commentsPct = Math.max(3, Math.round((comments / total) * 100));
              const reviewsPct = Math.max(5, Math.round((reviews / total) * 100));
              const makerPct = Math.max(0, 100 - commentsPct - reviewsPct);

              return (
                <div
                  key={leader.id}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 space-y-3 ${
                    isCurrentUser 
                      ? "bg-[#ff5733]/[0.03] border-[#ff5733]/40 shadow-xs" 
                      : "bg-card border-border/80 hover:border-border"
                  }`}
                >
                  {/* Top Info Row */}
                  <div className="flex items-start justify-between gap-4">
                    
                    {/* User Info */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <UserHoverCard user={leader}>
                        <div className="shrink-0">
                          {leader.avatar_url ? (
                            <img
                              src={leader.avatar_url}
                              alt={leader.full_name}
                              className="w-12 h-12 rounded-full object-cover border border-border/80"
                              style={{ width: "48px", height: "48px" }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#ff5733]/10 text-[#ff5733] flex items-center justify-center font-semibold text-base border border-[#ff5733]/20" style={{ width: "48px", height: "48px" }}>
                              {leader.full_name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                      </UserHoverCard>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <UserHoverCard user={leader}>
                            <span className="text-base font-medium text-foreground/90 hover:text-[#ff5733] transition-colors truncate block">
                              {globalRank}. {leader.full_name}
                            </span>
                          </UserHoverCard>
                          
                          {/* Optional Product Tagline/Company */}
                          {(leader as any).company && (
                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground font-medium">
                              <span className="text-xs">🧲</span>
                              <span>{(leader as any).company}</span>
                            </span>
                          )}

                          {isCurrentUser && (
                            <span className="text-[10px] font-semibold bg-[#ff5733]/10 text-[#ff5733] px-2 py-0.5 rounded-full border border-[#ff5733]/20">
                              You
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-medium text-muted-foreground truncate">
                          @{leader.username || leader.full_name?.toLowerCase().replace(/\s+/g, "")}
                        </p>
                      </div>
                    </div>

                    {/* Right Controls: Follow Button & KP Score */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      {!isCurrentUser && user && (
                        <button
                          onClick={() => handleFollow(leader.id)}
                          disabled={followLoadingMap[leader.id]}
                          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                            followingMap[leader.id]
                              ? "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                              : "bg-card text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {followingMap[leader.id] ? "Following" : "Follow"}
                        </button>
                      )}

                      <div className="text-right">
                        <span className="text-base sm:text-lg font-semibold text-[#ff5733]">
                          {kp} KP
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Segmented Multi-Color Progress Bar */}
                  <div className="w-full space-y-1.5 pt-1">
                    <div className="w-full h-1.5 sm:h-2 rounded-full overflow-hidden flex bg-muted">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${commentsPct}%` }} title={`Comments: +${comments}`} />
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${reviewsPct}%` }} title={`Reviews: +${reviews}`} />
                      <div className="bg-rose-400 h-full transition-all duration-500" style={{ width: `${makerPct}%` }} title={`Maker: +${maker}`} />
                    </div>

                    {/* Legend text under progress bar */}
                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground flex-wrap pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                        <span>Comments +{comments}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>Reviews +{reviews}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                        <span>Maker +{maker}</span>
                      </span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* ── Numeric Pagination ── */}
        {totalPages > 1 && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{(validCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
              <span className="font-semibold text-foreground">{Math.min(validCurrentPage * ITEMS_PER_PAGE, leaders.length)}</span> of{" "}
              <span className="font-semibold text-foreground">{leaders.length}</span> members
            </p>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
              {/* First Page */}
              <button
                onClick={() => {
                  setCurrentPage(1);
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={validCurrentPage === 1}
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
                const isActive = pageNum === validCurrentPage;
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
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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

      </main>
    </div>
  );
}
