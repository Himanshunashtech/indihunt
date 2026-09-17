"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Globe, ExternalLink } from "lucide-react";
import { Github, Twitter, Linkedin } from "@/components/icons";
import { Profile, supabase, toggleFollowUser, isFollowingUser } from "@/lib/supabase";
import { useAppDispatch, setAuthModalOpen } from "@/lib/store";

interface UserHoverCardProps {
  user?: Profile | null;
  userId?: string;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}

export function UserHoverCard({ user: propUser, userId, children, align = "left" }: UserHoverCardProps) {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<Profile | null>(propUser || null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize propUser if updated externally
  useEffect(() => {
    if (propUser) {
      setProfile(propUser);
    }
  }, [propUser]);

  // Fetch profile details and follow state via API endpoint when card opens
  useEffect(() => {
    if (!isOpen) return;

    const targetId = propUser?.id || userId;
    if (!targetId) return;

    let isMounted = true;

    async function fetchHoverData() {
      try {
        setLoadingProfile(true);
        let sessUser = currentSessionUser;
        if (!sessUser && supabase) {
          const { data } = await supabase.auth.getSession();
          sessUser = data.session?.user || null;
          if (isMounted) setCurrentSessionUser(sessUser);
        }

        const viewerQuery = sessUser?.id ? `&viewerId=${sessUser.id}` : "";
        const res = await fetch(`/t/profiles/hover?userId=${targetId}${viewerQuery}`);
        
        if (res.ok) {
          const data = await res.json();
          const payload = data.data || data;
          if (isMounted && payload) {
            if (payload.profile) setProfile(payload.profile);
            setIsFollowing(!!payload.isFollowing);
          }
        }
      } catch (err) {
        console.error("Error fetching profile hover API:", err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    }

    fetchHoverData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, propUser?.id, userId]);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200); // 200ms delay to prevent accidental popups on fast pointer hover
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250); // Small grace period so user can move mouse into card
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentSessionUser) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    const targetId = profile?.id || userId;
    if (!targetId || currentSessionUser.id === targetId) return;

    setFollowLoading(true);
    try {
      const success = await toggleFollowUser(currentSessionUser.id, targetId, isFollowing);
      if (success) {
        const nextFollowing = !isFollowing;
        setIsFollowing(nextFollowing);
        setProfile(prev => prev ? {
          ...prev,
          followers_count: (prev.followers_count || 0) + (nextFollowing ? 1 : -1)
        } : prev);
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const targetUserId = profile?.id || userId || "";
  const profileHref = profile?.username ? `/@${profile.username}` : (targetUserId ? `/profile?id=${targetUserId}` : "#");

  // Calculate alignment positioning CSS
  const alignClass = 
    align === "right" 
      ? "right-0" 
      : align === "center" 
        ? "left-1/2 -translate-x-1/2" 
        : "left-0";

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Target Trigger Element */}
      <Link href={profileHref} className="inline-block hover:opacity-95 transition-opacity">
        {children}
      </Link>

      {/* Hover Popup Card (Desktop only, disabled on mobile) */}
      {isOpen && (
        <div 
          className={`hidden sm:block absolute bottom-full mb-2 z-50 w-72 p-4 bg-card text-card-foreground border border-border rounded-2xl shadow-xl transition-all animate-in fade-in zoom-in-95 duration-150 ${alignClass}`}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsOpen(true);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {loadingProfile && !profile ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header: Avatar, Name, Username & Verified Badge */}
              <div className="flex items-start gap-3">
                <Link href={profileHref} className="relative group flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-semibold text-white text-base">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.full_name || "User Avatar"} 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || profile.username || "User")}`;
                        }}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      (profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U").toUpperCase()
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={profileHref} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {profile?.full_name || profile?.username || "Hunter"}
                    </h4>
                    {profile?.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20 flex-shrink-0" />
                    )}
                  </Link>

                  {profile?.username && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{profile.username}
                    </p>
                  )}

                  {profile?.headline ? (
                    <p className="text-[11px] font-normal text-foreground/80 mt-1 line-clamp-1">
                      🏆 {profile.headline}
                    </p>
                  ) : profile?.is_maker ? (
                    <p className="text-[11px] font-normal text-orange-500 mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 inline" /> Verified Product Maker
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Bio summary if available */}
              {profile?.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Social Links Icons */}
              {(profile?.github_url || profile?.twitter_url || profile?.linkedin_url || profile?.website) && (
                <div className="flex items-center gap-2 pt-0.5">
                  {profile?.github_url && (
                    <a
                      href={profile.github_url.startsWith('http') ? profile.github_url : `https://${profile.github_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="GitHub Profile"
                    >
                      <Github className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {profile?.twitter_url && (
                    <a
                      href={profile.twitter_url.startsWith('http') ? profile.twitter_url : `https://${profile.twitter_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-blue-500 hover:bg-muted transition-colors"
                      title="Twitter / X Profile"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {profile?.linkedin_url && (
                    <a
                      href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-blue-600 hover:bg-muted transition-colors"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {profile?.website && (
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-orange-500 hover:bg-muted transition-colors"
                      title="Personal Website"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Kitty / Karma Points summary */}
              <div className="text-xs font-medium text-foreground/90 bg-muted/40 p-2 rounded-xl border border-border/50">
                <span className="font-semibold text-orange-500">Karma Points:</span>{" "}
                {profile?.karma_points || 120} points · Hunter rank
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                {/* Followers count */}
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {(profile?.followers_count || 0).toLocaleString()}
                  </span>{" "}
                  Followers
                </div>

                {/* Follow / Unfollow button */}
                {(!currentSessionUser || currentSessionUser.id !== targetUserId) && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isFollowing
                        ? "bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive border border-border"
                        : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
                    }`}
                  >
                    {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
