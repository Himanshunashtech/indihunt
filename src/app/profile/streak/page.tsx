"use client";


import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase, Profile, getUserProfile, getStreakLeaderboard, updateUserStreak, toggleFollowUser, isFollowingUser } from "@/lib/supabase";

export default function StreakPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [streakActive, setStreakActive] = useState<boolean>(false);
  const [leaders, setLeaders] = useState<Profile[]>([]);
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

      // Load streak leaderboard
      const data = await getStreakLeaderboard(20);
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
          getStreakLeaderboard(20).then(setLeaders);
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
              leaders.map((leader, i) => {
                const streak = (leader as any).streak_count ?? 0;
                const isMe = leader.id === user?.id;
                return (
                  <div
                    key={leader.id}
                    className={`flex items-center justify-between p-4 hover:bg-muted/15 transition-all ${isMe ? 'bg-orange-500/5 border-l-2 border-l-orange-500' : ''}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`text-sm font-semibold w-6 text-center ${i < 3 ? 'text-[#ff5733]' : 'text-muted-foreground'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
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
