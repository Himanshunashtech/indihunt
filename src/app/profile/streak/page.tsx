"use client";


import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase, Profile, getUserProfile, getStreakLeaderboard, updateUserStreak, toggleFollowUser, isFollowingUser } from "@/lib/supabase";

const ITEMS_PER_PAGE = 20;

export default function StreakPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [streakActive, setStreakActive] = useState<boolean>(false);
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const streakUpdated = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        const prof = await getUserProfile(session.user.id);
        if (prof) {
          setProfile(prof);
          setStreakCount((prof as any).streak_count || 0);
        }
      }

      // Load streak leaderboard (up to 100)
      const data = await getStreakLeaderboard(100);
      setLeaders(data);

      // Load following state
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

  // 1-minute session timer → trigger streak update
  useEffect(() => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      setSessionTime(elapsed);

      if (elapsed >= 60 && !streakUpdated.current && user) {
        streakUpdated.current = true;
        setStreakActive(true);
        // The global providers.tsx handles the actual DB mutation for streak tracking.
        // We just delay slightly and refresh the UI to show the new stats.
        setTimeout(() => {
          getUserProfile(user.id).then((prof) => {
            if (prof) setStreakCount((prof as any).streak_count || 0);
          });
          getStreakLeaderboard(100).then(setLeaders);
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleFollow = async (leaderId: string) => {
    if (!user) return;
    setFollowLoadingMap(prev => ({ ...prev, [leaderId]: true }));
    await toggleFollowUser(user.id, leaderId, !!followingMap[leaderId]);
    setFollowingMap(prev => ({ ...prev, [leaderId]: !prev[leaderId] }));
    setFollowLoadingMap(prev => ({ ...prev, [leaderId]: false }));
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      <Navbar />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-36 sm:pt-42 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Leaderboard Section */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Longest streaks</h1>
            <p className="text-base text-foreground/80 mt-1">The most active community members on IndiHunt.</p>
          </div>

          <div className="border-y border-border/40 divide-y divide-border/40 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-sm font-medium text-muted-foreground italic">Loading…</div>
            ) : leaders.length === 0 ? (
              <div className="p-10 text-center text-sm font-medium text-muted-foreground italic">No streak data yet. Start visiting daily to build yours!</div>
            ) : (
              paginatedLeaders.map((leader, i) => {
                const streak = (leader as any).streak_count ?? 0;
                const globalRank = (validCurrentPage - 1) * ITEMS_PER_PAGE + i + 1;
                const isMe = leader.id === user?.id;
                return (
                  <div
                    key={leader.id}
                    className={`flex items-center justify-between p-4 hover:bg-muted/15 transition-all ${isMe ? 'bg-orange-500/5 border-l-2 border-l-orange-500' : ''}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`text-sm font-semibold w-6 text-center ${globalRank <= 3 ? 'text-[#ff5733]' : 'text-muted-foreground'}`}>
                        {globalRank === 1 ? '🥇' : globalRank === 2 ? '🥈' : globalRank === 3 ? '🥉' : globalRank}
                      </span>
                      <Link href={leader.username ? `/@${leader.username}` : `/profile?id=${leader.id}`} className="w-12 h-12 rounded-full overflow-hidden border border-border bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white text-base font-semibold hover:opacity-90 transition-opacity flex-shrink-0" style={{ width: "48px", height: "48px" }}>
                        {leader.avatar_url ? (
                          <img src={leader.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          leader.full_name?.charAt(0).toUpperCase() || 'M'
                        )}
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={leader.username ? `/@${leader.username}` : `/profile?id=${leader.id}`} className="text-base font-medium text-foreground/90 block hover:text-[#ff5733] transition-colors">{leader.full_name || leader.username}</Link>
                          {isMe && <span className="text-[10px] bg-orange-500/10 text-orange-500 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                        </div>
                        <span className="text-sm font-medium text-orange-500 flex items-center gap-1 mt-0.5">
                          🔥 {streak} day{streak !== 1 ? 's' : ''} streak
                        </span>
                      </div>
                    </div>
                    {user && !isMe && (
                      <button
                        onClick={() => handleFollow(leader.id)}
                        disabled={followLoadingMap[leader.id]}
                        className={`px-4 py-2 border text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs ${
                          followingMap[leader.id]
                            ? 'bg-muted border-border text-muted-foreground'
                            : 'border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        {followLoadingMap[leader.id] ? '…' : followingMap[leader.id] ? 'Following' : 'Follow'}
                      </button>
                    )}
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
        </div>

        {/* Sidebar Streak Status */}
        <div className="space-y-6">
          <div className="py-6  space-y-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">You&apos;re on</span>
            
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold text-foreground tracking-tight">{streakCount} day{streakCount !== 1 ? 's' : ''}</h2>
              <span className="text-2xl">{streakActive ? '🔥' : '🌞'}</span>
            </div>

            {/* Streak dots visualizer — show last 7 days */}
            <div className="flex items-center gap-1.5 pt-2">
              {[...Array(7)].map((_, i) => {
                const checked = i < Math.min(streakCount, 7);
                return (
                  <React.Fragment key={i}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-semibold transition-all ${checked ? "bg-orange-500 border-orange-500 text-white" : "border-border text-muted-foreground bg-transparent"}`}>
                      {checked ? "✓" : ""}
                    </div>
                    {i < 6 && <div className={`flex-1 h-px border-t border-dashed ${checked ? "border-orange-500" : "border-border"}`}></div>}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="h-px bg-border"></div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Today&apos;s Status</span>
              <p className="text-base text-foreground/80 leading-relaxed">
                {streakActive ? (
                  <span className="text-emerald-500 font-semibold">✓ Today&apos;s streak secured! You&apos;ve spent 1+ minute on the app.</span>
                ) : !user ? (
                  <span>Login to track your streak.</span>
                ) : (
                  <span>Spend at least 1 minute browsing the app today to secure your streak. ({sessionTime}s / 60s)</span>
                )}
              </p>
              {sessionTime < 60 && user && (
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${Math.min((sessionTime / 60) * 100, 100)}%` }}></div>
                </div>
              )}
            </div>

            {!user && (
              <Link href="/" className="block w-full text-center py-2.5 bg-[#ff5733] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all">
                Login to track streak
              </Link>
            )}
          </div>

          {/* How streak works */}
          <div className="py-5  space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">How it works</span>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              <li className="flex items-start gap-1.5"><span className="text-orange-500 font-semibold mt-0.5">🔥</span> Open the app once per day</li>
              <li className="flex items-start gap-1.5"><span className="text-orange-500 font-semibold mt-0.5">⏱️</span> Stay for at least 1 minute</li>
              <li className="flex items-start gap-1.5"><span className="text-orange-500 font-semibold mt-0.5">📅</span> Keep visiting on consecutive days</li>
              <li className="flex items-start gap-1.5"><span className="text-red-500 font-semibold mt-0.5">💔</span> Miss a day and your streak resets to 1</li>
            </ul>
          </div>
        </div>

      </main>

    </div>
  );
}
