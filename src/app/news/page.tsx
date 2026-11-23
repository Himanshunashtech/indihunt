"use client";


import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Globe, 
  MessageSquare,
  Sparkles,
  Search,
  ExternalLink,
  Flame,
  ChevronDown,
  Calendar
} from "lucide-react";
import { fetchNewsByDay, NewsItem } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";

interface DayFeed {
  dateLabel: string;
  date: Date;
  stories: NewsItem[];
  isLoading: boolean;
}

export default function DailyNewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [feeds, setFeeds] = useState<DayFeed[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  const formatDateLabel = (date: Date, offsetDays: number) => {
    if (offsetDays === 0) return "Today";
    if (offsetDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Load a specific day and return its feed
  const loadDayFeed = async (date: Date, offsetDays: number): Promise<DayFeed> => {
    const stories = await fetchNewsByDay(date);
    return {
      dateLabel: formatDateLabel(date, offsetDays),
      date,
      stories,
      isLoading: false,
    };
  };

  // Load initial days (Today & Yesterday)
  const initFeeds = useCallback(async () => {
    loadingRef.current = true;
    const initialFeeds: DayFeed[] = [];
    
    // Load Today
    const today = new Date();
    const todayFeed = await loadDayFeed(today, 0);
    initialFeeds.push(todayFeed);

    // Load Yesterday
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayFeed = await loadDayFeed(yesterday, 1);
    initialFeeds.push(yesterdayFeed);

    setFeeds(initialFeeds);
    loadingRef.current = false;
  }, []);

  useEffect(() => {
    initFeeds();
  }, [initFeeds]);

  // Load next day
  const loadNextDay = async () => {
    if (loadingRef.current || loadingMore) return;
    setLoadingMore(true);
    loadingRef.current = true;

    const lastFeed = feeds[feeds.length - 1];
    if (!lastFeed) {
      setLoadingMore(false);
      loadingRef.current = false;
      return;
    }
    const nextDate = new Date(lastFeed.date);
    nextDate.setDate(lastFeed.date.getDate() - 1);
    const nextOffset = feeds.length;

    const nextFeed = await loadDayFeed(nextDate, nextOffset);
    setFeeds(prev => [...prev, nextFeed]);
    
    setLoadingMore(false);
    loadingRef.current = false;
  };

  // Auto scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300
      ) {
        loadNextDay();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [feeds, loadingMore]);

  const getDomain = (urlStr?: string) => {
    if (!urlStr) return "";
    try {
      const url = new URL(urlStr);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleRefresh = async () => {
    setFeeds([]);
    await initFeeds();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300 pt-32">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        {/* Title / Header */}
        <div className="space-y-4 relative py-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-orange-500/5 rounded-3xl blur-3xl -z-10"></div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>Tech Ecosystem Pulse</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Daily Tech News
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Real-time trending tech updates, developer discussions, and startup announcements curated directly from the global software ecosystem.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search tech news stories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <button 
            onClick={handleRefresh}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            Refresh Feed
          </button>
        </div>

        {/* Stories List */}
        {feeds.length === 0 ? (
          <CircularLoader label="Loading tech news..." size="lg" />
        ) : (
          <div className="space-y-12">
            {feeds.map((feed) => {
              const matchedStories = feed.stories.filter(item => 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.by.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (searchQuery && matchedStories.length === 0) return null;

              return (
                <div key={feed.dateLabel} className="space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center gap-2 pb-2 ">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <h2 className="font-bold text-sm text-foreground tracking-tight uppercase">
                      {feed.dateLabel}
                    </h2>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({matchedStories.length} stories)
                    </span>
                  </div>

                  {/* Stories list for this day */}
                  <div className="space-y-3">
                    {matchedStories.map((item, index) => {
                      const domain = getDomain(item.url);
                      return (
                        <div 
                          key={item.id}
                          className="bg-card border border-border hover:border-orange-500/20 hover:shadow-lg rounded-2xl p-5 transition-all group flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-md">
                                #{index + 1}
                              </span>
                              {domain && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-muted-foreground" />
                                  {domain}
                                </span>
                              )}
                            </div>

                            <a 
                              href={item.url || `https://news.ycombinator.com/item?id=${item.id}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group-hover:text-[#ff5733] text-base font-medium text-foreground/90 transition-colors line-clamp-2 inline-flex items-center gap-1.5"
                            >
                              {item.title}
                              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-orange-500" />
                                <span>{item.score} points</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <a 
                                  href={`https://news.ycombinator.com/item?id=${item.id}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:underline hover:text-foreground"
                                >
                                  {item.descendants || 0} discussions
                                </a>
                              </span>
                              <span>by @{item.by}</span>
                              <span>{formatTimeAgo(item.time)}</span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 justify-end">
                            <a
                              href={item.url || `https://news.ycombinator.com/item?id=${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-initial text-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-colors"
                            >
                              Read
                            </a>
                            <a
                              href={`https://news.ycombinator.com/item?id=${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-initial text-center px-4 py-2 border border-border hover:bg-muted text-foreground rounded-xl text-xs font-semibold transition-colors"
                            >
                              Discuss
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Trigger Button / Loader */}
        <div className="pt-6 flex justify-center">
          <button 
            onClick={loadNextDay}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <ChevronDown className="w-4 h-4 text-orange-500" />
            )}
            Load Previous Day&apos;s News
          </button>
        </div>

      </main>
    </div>
  );
}
