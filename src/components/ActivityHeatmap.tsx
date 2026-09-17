"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

interface ActivityHeatmapProps {
  userId?: string;
  username?: string;
  streakCount?: number;
  karmaPoints?: number;
  activities?: { date: string; type?: string }[];
  totalContributionsOverride?: number;
  className?: string;
}

interface DayData {
  date: Date;
  dateStr: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface WeekData {
  days: DayData[];
  monthLabel?: string;
}

export default function ActivityHeatmap({
  userId,
  username,
  streakCount = 11,
  karmaPoints = 338,
  activities = [],
  totalContributionsOverride,
  className = "",
}: ActivityHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<{ day: DayData; x: number; y: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Generate 52 weeks of day data ending on the current week
  const { weeks, totalContributions, monthHeaders } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Map real activities to counts per YYYY-MM-DD
    const realActivityMap: Record<string, number> = {};
    if (activities && activities.length > 0) {
      activities.forEach(act => {
        try {
          const d = new Date(act.date);
          const key = d.toISOString().split("T")[0];
          realActivityMap[key] = (realActivityMap[key] || 0) + 1;
        } catch {
          // ignore invalid date
        }
      });
    }

    // Calculate start date: 52 weeks ago starting from Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - (52 * 7 - 1) - today.getDay());
    start.setHours(0, 0, 0, 0);

    const generatedWeeks: WeekData[] = [];
    const monthsMap: { index: number; label: string }[] = [];
    let currentWeek: DayData[] = [];
    let totalCount = 0;
    let lastMonth = -1;

    const cursor = new Date(start);
    let dayIndex = 0;

    // Iterate through all 364/371 days
    while (cursor <= today || currentWeek.length > 0) {
      const dateStr = cursor.toISOString().split("T")[0];
      const dayOfWeek = cursor.getDay();
      const month = cursor.getMonth();

      // Check for month label change at the beginning of a week
      if (dayOfWeek === 0 && month !== lastMonth) {
        lastMonth = month;
        const monthShort = cursor.toLocaleDateString("en-US", { month: "short" });
        monthsMap.push({
          index: generatedWeeks.length,
          label: monthShort,
        });
      }

      // Check if within the current active streak window (past N days up to today)
      const diffTime = today.getTime() - cursor.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const isInActiveStreak = diffDays >= 0 && diffDays < (streakCount || 0);

      // Real contribution count strictly from user actions (+ active streak check-in)
      let count = realActivityMap[dateStr] || 0;
      if (isInActiveStreak && count === 0 && cursor <= today) {
        count = 1; // Real daily streak login check-in
      }

      if (cursor > today) {
        count = 0;
      }

      // Compute intensity level (0 to 4)
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 8) level = 4;
      else if (count >= 5) level = 3;
      else if (count >= 3) level = 2;
      else if (count >= 1) level = 1;

      if (cursor <= today) {
        totalCount += count;
      }

      currentWeek.push({
        date: new Date(cursor),
        dateStr,
        dayOfWeek,
        count: cursor <= today ? count : 0,
        level: cursor <= today ? level : 0,
      });

      if (currentWeek.length === 7) {
        generatedWeeks.push({ days: currentWeek });
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
      dayIndex++;
      if (dayIndex > 380) break; // safety guard
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(cursor),
          dateStr: "",
          dayOfWeek: currentWeek.length,
          count: 0,
          level: 0,
        });
      }
      generatedWeeks.push({ days: currentWeek });
    }

    const finalTotal = totalContributionsOverride !== undefined ? totalContributionsOverride : totalCount;

    return {
      weeks: generatedWeeks,
      totalContributions: finalTotal,
      monthHeaders: monthsMap,
    };
  }, [streakCount, activities, totalContributionsOverride]);

  // Auto-scroll to the end (rightmost / today) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 240;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Cell Color mapping matching the crisp white theme with vivid orange accents
  const getCellColor = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        return "bg-[#ebedf0] dark:bg-slate-800/80 border-[#e1e4e8]/60 dark:border-slate-700/50 hover:border-slate-400";
      case 1:
        return "bg-[#ffedd5] dark:bg-[#7c2d12]/50 border-[#fed7aa] dark:border-orange-900/60 hover:border-orange-300";
      case 2:
        return "bg-[#fed7aa] dark:bg-[#ea580c]/60 border-[#fdba74] dark:border-orange-600/60 hover:border-orange-400";
      case 3:
        return "bg-[#fb923c] dark:bg-[#ea580c] border-[#f97316] dark:border-orange-500 hover:border-orange-600";
      case 4:
        return "bg-[#ea580c] dark:bg-[#c2410c] border-[#c2410c] dark:border-orange-400 hover:border-orange-700";
    }
  };

  return (
    <div className={`w-full bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-xs relative transition-all ${className}`}>
      {/* Title & Info Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-foreground">
            Activity
          </h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowInfo(prev => !prev)}
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full focus:outline-none"
              aria-label="Activity Info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showInfo && (
              <div className="absolute left-0 top-6 z-50 w-64 p-2.5 bg-popover/95 backdrop-blur-md border border-border text-popover-foreground text-[11px] rounded-xl shadow-lg leading-relaxed animate-in fade-in zoom-in-95">
                Displays product launches, comments, upvotes, reviews, discussions, and builder streak milestones across the past year.
              </div>
            )}
          </div>
        </div>

        {/* Scroll Controls (Desktop & Mobile) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="p-1 rounded-lg border border-border bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="p-1 rounded-lg border border-border bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Heatmap Grid Container with Horizontal Scroll */}
      <div
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar pb-2 relative"
      >
        <div className="inline-block min-w-max">
          {/* Months Row */}
          <div className="flex text-[10px] font-medium text-muted-foreground/80 mb-1.5 pl-8 select-none">
            {weeks.map((week, wIdx) => {
              const monthHeader = monthHeaders.find(m => m.index === wIdx);
              return (
                <div key={wIdx} className="w-3.5 mr-1 text-left flex-shrink-0">
                  {monthHeader ? (
                    <span className="whitespace-nowrap font-semibold text-foreground/80">
                      {monthHeader.label}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Grid with Days Labels */}
          <div className="flex items-start">
            {/* Days Column */}
            <div className="flex flex-col justify-between text-[9px] font-medium text-muted-foreground/70 pr-2 select-none h-[105px]">
              <span className="leading-none pt-0.5">Mon</span>
              <span className="leading-none pt-0.5">Wed</span>
              <span className="leading-none pt-0.5">Fri</span>
            </div>

            {/* Week Columns */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.days.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredDay({
                          day,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2.5px] border cursor-pointer transition-all duration-150 ${getCellColor(
                        day.level
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && hoveredDay.day.dateStr && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 px-2.5 py-1.5 bg-popover text-popover-foreground text-[11px] font-medium rounded-lg border border-border shadow-xl backdrop-blur-md whitespace-nowrap animate-in fade-in duration-100"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 6}px`,
          }}
        >
          <div className="text-center font-semibold">
            {hoveredDay.day.count === 0 ? "No" : hoveredDay.day.count}{" "}
            {hoveredDay.day.count === 1 ? "contribution" : "contributions"}
          </div>
          <div className="text-[10px] text-muted-foreground text-center">
            {hoveredDay.day.date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      )}

      {/* Slider Visual Track Bar */}
      <div className="w-full h-1 bg-muted/60 rounded-full my-3 overflow-hidden">
        <div className="h-full bg-orange-500/40 rounded-full w-full" />
      </div>

      {/* Footer Row: Total Contributions + Less/More Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs text-muted-foreground font-normal select-none">
        <div className="font-medium text-foreground">
          <span>{totalContributions} contributions in the last year</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-muted-foreground/80">Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#ebedf0] dark:bg-slate-800/80 border border-[#e1e4e8]/60 dark:border-slate-700" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#ffedd5] dark:bg-[#7c2d12]/50 border border-[#fed7aa]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#fed7aa] dark:bg-[#ea580c]/60 border border-[#fdba74]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#fb923c] dark:bg-[#ea580c] border border-[#f97316]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#ea580c] dark:bg-[#c2410c] border border-[#c2410c]" />
          </div>
          <span className="text-muted-foreground/80">More</span>
        </div>
      </div>
    </div>
  );
}
