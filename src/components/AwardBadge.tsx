"use client";

import React from "react";
import { Trophy, Star, Award, Calendar, Orbit, Sparkles } from "lucide-react";

export interface AwardBadgeData {
  type: string;
  title: string;
  subtitle?: string;
  rank: string;
  date?: string;
  iconType?: string;
  tagline?: string;
}

/**
 * Returns solid background gradient and styling based on award rank/type
 */
export function getAwardSolidTheme(rank: string | number, type?: string) {
  const r = String(rank).replace("#", "").trim();

  if (r === "1" || type?.toLowerCase().includes("gold") || type?.toLowerCase().includes("first")) {
    return {
      badgeBg: "bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/30 border-amber-300/50",
      cardHeaderBg: "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white",
      badgeBorder: "border-amber-400/50",
      accentText: "text-amber-500",
      tagBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      glow: "ring-2 ring-amber-500/30"
    };
  }

  if (r === "2" || type?.toLowerCase().includes("silver") || type?.toLowerCase().includes("second")) {
    return {
      badgeBg: "bg-gradient-to-br from-slate-400 via-slate-500 to-gray-600 text-white shadow-md shadow-slate-500/30 border-slate-300/50",
      cardHeaderBg: "bg-gradient-to-r from-slate-500 via-gray-500 to-slate-600 text-white",
      badgeBorder: "border-slate-300/50",
      accentText: "text-slate-400",
      tagBg: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-400/30",
      glow: "ring-2 ring-slate-400/30"
    };
  }

  if (r === "3" || type?.toLowerCase().includes("bronze") || type?.toLowerCase().includes("third")) {
    return {
      badgeBg: "bg-gradient-to-br from-orange-500 via-amber-700 to-amber-800 text-white shadow-md shadow-orange-600/30 border-orange-400/50",
      cardHeaderBg: "bg-gradient-to-r from-orange-600 via-amber-700 to-amber-800 text-white",
      badgeBorder: "border-orange-400/50",
      accentText: "text-orange-500",
      tagBg: "bg-orange-600/10 text-orange-600 dark:text-orange-400 border-orange-600/30",
      glow: "ring-2 ring-orange-500/30"
    };
  }

  if (type?.toLowerCase().includes("india") || r === "🇮🇳") {
    return {
      badgeBg: "bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 text-white shadow-md shadow-emerald-500/30 border-emerald-300/50",
      cardHeaderBg: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white",
      badgeBorder: "border-emerald-300/50",
      accentText: "text-emerald-500",
      tagBg: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      glow: "ring-2 ring-emerald-500/30"
    };
  }

  if (type?.toLowerCase().includes("quality")) {
    return {
      badgeBg: "bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 text-white shadow-md shadow-violet-500/30 border-violet-300/50",
      cardHeaderBg: "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-700 text-white",
      badgeBorder: "border-violet-300/50",
      accentText: "text-violet-500",
      tagBg: "bg-violet-600/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
      glow: "ring-2 ring-violet-500/30"
    };
  }

  // Default solid vibrant indigo theme (#4, #5, etc.)
  return {
    badgeBg: "bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white shadow-md shadow-indigo-500/30 border-indigo-300/50",
    cardHeaderBg: "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white",
    badgeBorder: "border-indigo-300/50",
    accentText: "text-indigo-500",
    tagBg: "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    glow: "ring-2 ring-indigo-500/30"
  };
}

/**
 * Compact Hexagon Award Badge matching user request & screenshot
 */
export function HexagonAwardBadge({ rank, type, size = "md", title }: { rank: string | number; type?: string; size?: "sm" | "md" | "lg"; title?: string }) {
  const theme = getAwardSolidTheme(rank, type);
  const rankStr = String(rank).replace("#", "").trim();

  const sizeClasses = {
    sm: "w-8 h-9 text-[10px]",
    md: "w-10 h-11 text-xs",
    lg: "w-14 h-16 text-sm"
  }[size];

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-6 h-6"
  }[size];

  return (
    <div
      title={title || `Award Rank #${rankStr}`}
      className={`relative flex flex-col items-center justify-center font-bold text-white transition-all duration-300 hover:scale-110 cursor-pointer ${theme.badgeBg} ${sizeClasses}`}
      style={{
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
    >
      <div className="flex flex-col items-center justify-center -space-y-0.5">
        {rankStr === "1" || rankStr === "2" || rankStr === "3" ? (
          <Trophy className={`${iconSizes} drop-shadow-xs`} />
        ) : rankStr === "🇮🇳" ? (
          <span className="text-xs">🇮🇳</span>
        ) : (
          <Award className={`${iconSizes} drop-shadow-xs`} />
        )}
        <span className="font-extrabold leading-none tracking-tight">{rankStr}</span>
      </div>
    </div>
  );
}
