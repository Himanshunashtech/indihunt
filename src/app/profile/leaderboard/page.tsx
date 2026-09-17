"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import { supabase, Profile, getUserProfile, getKarmaLeaderboard, toggleFollowUser, isFollowingUser } from "@/lib/supabase";
import { UserHoverCard } from "@/components/UserHoverCard";

export default function LeaderboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>("all");

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

      // Load leaderboard
      const data = await getKarmaLeaderboard(50);
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
                onClick={() => setActiveTab(tab.id)}
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
            leaders.map((leader, i) => {
              const kp = leader.karma_points ?? Math.max(862 - i * 45, 120);
              const { comments, reviews, maker, total } = getPointsBreakdown(kp, i);
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
                              {i + 1}. {leader.full_name}
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

      </main>
    </div>
  );
}
