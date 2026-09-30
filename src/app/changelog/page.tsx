"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Sparkles,
  Calendar,
  Rocket,
  Shield,
  ShieldCheck,
  CheckCircle,
  Users,
  BarChart2,
  Trophy,
  Search,
  Bot,
  MessageSquare,
  Zap,
  TrendingUp,
  Database,
  ChevronDown,
  ChevronUp,
  User,
  Megaphone,
  CreditCard,
  Flame,
  LayoutGrid,
} from "lucide-react";

const TAG_STYLES: Record<string, string> = {
  "New Feature": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Improvement": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Performance": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Security": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Design": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Database": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Architecture": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Monetization": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Community": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Launches": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "AI": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Realtime": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Analytics": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Gamification": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Launch": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Profiles": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Ads": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Discussions": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Search": "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  summary: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  tags: string[];
  features: { icon: React.ElementType; text: string }[];
  highlight?: boolean;
}

const CHANGELOG: ChangelogItem[] = [
  {
    version: "v7.0.0",
    date: "September 2026",
    title: "Full-Stack Performance & Architectural Overhaul",
    summary: "Eliminated SSR self-referential loopbacks, parallelized database fetching, added multi-tier Redis L1/L2 caching, and reduced client hydration payload by 90%.",
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "Architecture", "Database"],
    features: [
      { icon: Zap, text: "Direct Supabase Server Queries: Removed loopback roundtrips on homepage SSR, slashing TTFB from 10s to sub-800ms." },
      { icon: Database, text: "Multi-Tier Redis Caching: Cached product feeds, top hunters, and active ads in Redis with instant cache-invalidation." },
      { icon: ShieldCheck, text: "Prop Serialization Optimization: Sliced massive nested product payloads down to essentials, cutting HTML transfer size dramatically." },
      { icon: Shield, text: "Scoped Middleware: Authenticated token verification scoped strictly to protected routes, saving 150ms on public pages." },
    ],
    highlight: true,
  },
  {
    version: "v6.0.0",
    date: "August 2026",
    title: "IST Launch Scheduling & Pre-Launch Window",
    summary: "Introduced dedicated Indian Standard Time (12:01 AM IST) product launch cycles with pre-launch previews and automated countdowns.",
    icon: Calendar,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Launches", "Improvement"],
    features: [
      { icon: Rocket, text: "Scheduled Product Launches: Makers can queue upcoming launches up to 30 days in advance with live subscriber notifications." },
      { icon: Users, text: "Pre-Launch Discovery Hub: Community members can follow upcoming tools and opt-in for launch day alerts." },
      { icon: Sparkles, text: "IST-Calibrated Leaderboards: Daily reset timer strictly synchronized with Indian Standard Time midnight window." },
    ],
    highlight: true,
  },
  {
    version: "v5.0.0",
    date: "July 2026",
    title: "Self-Serve Billboard Ads & Maker Promotion Suite",
    summary: "Complete advertising and promotion infrastructure allowing makers to run targeted billboard ads with real-time attribution and Dodo Payments checkout.",
    icon: Megaphone,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    tags: ["New Feature", "Monetization", "Ads"],
    features: [
      { icon: Megaphone, text: "Self-Serve Campaign Manager: Upload 1200x300 high-resolution banners, set target CPC budgets, and schedule runtimes." },
      { icon: CreditCard, text: "Secure Checkout: Integrated Dodo Payments for instant INR/USD checkout and zero-latency ad activation." },
      { icon: ShieldCheck, text: "Verified Attribution Tracking: Accurate session-based impressions and click-through tracking with bot prevention." },
    ],
    highlight: true,
  },
  {
    version: "v4.0.0",
    date: "June 2026",
    title: "Indie Page Portfolios & Custom Maker Profiles",
    summary: "Redesigned personal profiles into full-featured builder portfolios accessible at /@username, highlighting tech stacks, products, and milestones.",
    icon: User,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    tags: ["New Feature", "Design", "Profiles"],
    features: [
      { icon: User, text: "Custom @username Profiles: Dynamic portfolio pages showcasing launched products, curated collections, and discussions." },
      { icon: LayoutGrid, text: "Tech Stack Showcase: Display frameworks, databases, and APIs used across projects." },
      { icon: Trophy, text: "Revenue & Milestone Badges: Verified revenue metrics, launch achievements, and maker badges." },
    ],
  },
  {
    version: "v3.0.0",
    date: "May 2026",
    title: "Community Discussions, Maker Stories & Editorial Hub",
    summary: "Deep community engagement layer featuring nested discussion threads, maker journey stories, and rich Markdown editor.",
    icon: MessageSquare,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/10",
    tags: ["New Feature", "Community", "Discussions"],
    features: [
      { icon: MessageSquare, text: "Community Discussion Forums: Category-based threaded discussions with upvoting, pinned topics, and moderation." },
      { icon: Sparkles, text: "Long-Form Maker Stories: Builders can publish startup stories, launch lessons, and product roadmaps." },
      { icon: CheckCircle, text: "Rich Markdown Publishing: Support for formatted code blocks, embedded images, and live previews." },
    ],
  },
  {
    version: "v2.5.0",
    date: "April 2026",
    title: "Real-Time Discovery Engine & Instant Global Search",
    summary: "Ultra-fast discovery with live WebSocket-based upvote synchronization and keyboard-accessible Cmd+K modal search.",
    icon: Search,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10",
    tags: ["Improvement", "Realtime", "Search"],
    features: [
      { icon: Zap, text: "WebSocket Upvote Stream: Real-time upvote broadcasting without requiring manual page refreshes." },
      { icon: Search, text: "Global Cmd+K Search: Search products, makers, discussions, and categories with zero typing latency." },
      { icon: CheckCircle, text: "Fuzzy Matching: Tolerant search algorithms find matching tools even with misspelled queries." },
    ],
  },
  {
    version: "v2.0.0",
    date: "March 2026",
    title: "Launch Insights, Analytics & Daily Maker Pulse",
    summary: "Comprehensive analytics dashboard providing hour-by-hour launch metrics, upvote trends, and daily community statistics.",
    icon: BarChart2,
    iconColor: "text-teal-400",
    iconBg: "bg-teal-500/10",
    tags: ["New Feature", "Analytics", "Performance"],
    features: [
      { icon: TrendingUp, text: "Hourly Launch Trajectory: Visual charts showing upvote velocity throughout the 24-hour launch window." },
      { icon: Users, text: "Platform Daily Pulse: Live counts of active makers, total products, community upvotes, and launched categories." },
      { icon: BarChart2, text: "Maker Referral Tracking: Detailed UTM breakdown showing where inbound traffic originates." },
    ],
  },
  {
    version: "v1.5.0",
    date: "February 2026",
    title: "Reputation Engine, Karma Points & Maker Streaks",
    summary: "Community reputation mechanics rewarding consistent makers, quality reviews, and constructive discussions.",
    icon: Flame,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
    tags: ["Improvement", "Gamification", "Community"],
    features: [
      { icon: Trophy, text: "Karma Points System: Earn points for product launches, helpful feedback, and active discussions." },
      { icon: Flame, text: "Builder Streaks: Track consecutive days of shipping and community engagement." },
      { icon: Users, text: "Top Hunters Leaderboard: Weekly and all-time recognition for the most active product scouts in India." },
    ],
  },
  {
    version: "v1.2.0",
    date: "January 2026",
    title: "AI Product Intelligence & Smart Tagging",
    summary: "Integrated Google Gemini AI to analyze product landing pages, extract key value propositions, and suggest taxonomy tags.",
    icon: Bot,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
    tags: ["New Feature", "AI", "Improvement"],
    features: [
      { icon: Bot, text: "AI Value Proposition Summarizer: Automatically generates concise 2-sentence summaries from product descriptions." },
      { icon: Sparkles, text: "Smart Category Classification: Identifies optimal product tags to maximize discovery across categories." },
      { icon: Database, text: "Redis-Cached AI Pipeline: Sub-millisecond retrieval of cached AI insights to preserve API quotas." },
    ],
  },
  {
    version: "v1.0.0",
    date: "December 2025",
    title: "Official Launch of IndiHunt Platform",
    summary: "The premiere launchpad and discovery platform dedicated to Indian makers, software builders, and indie hackers.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Launch"],
    features: [
      { icon: Rocket, text: "Product Hunt for India: Curated daily feeds spotlighting indie software built by Indian founders." },
      { icon: CheckCircle, text: "1-Click Product Submission: Simple, frictionless launch workflow with instant preview and scheduling." },
      { icon: Users, text: "Maker Profiles & Community Upvoting: Transparent community voting and verified maker profiles." },
    ],
  },
];

export default function ChangelogPage() {
  const [expanded, setExpanded] = useState<string | null>(CHANGELOG[0].version);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-36 sm:pt-42 pb-16 space-y-12">
        {/* Hero */}
        <div className="relative space-y-4 py-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/8 to-orange-500/5 rounded-3xl blur-3xl -z-10" />
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Release Notes</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground/90 leading-tight">
            Product Changelog
          </h1>
          <p className="text-base text-foreground/80 max-w-2xl leading-relaxed">
            Every major milestone, architectural upgrade, and feature shipped on the IndiHunt platform.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-8 pt-2">
            {[
              { label: "Major Releases", value: CHANGELOG.length.toString() },
              { label: "Key Features", value: `${CHANGELOG.reduce((a, c) => a + c.features.length, 0)}+` },
              { label: "Latest Version", value: CHANGELOG[0].version },
            ].map((s, i) => (
              <div key={i} className="space-y-0.5">
                <span className="text-xl font-bold text-orange-500 block">{s.value}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border/60" />

          <div className="space-y-6">
            {CHANGELOG.map((item, idx) => {
              const isOpen = expanded === item.version;
              const Icon = item.icon;

              return (
                <div key={`${item.version}-${idx}`} className="relative pl-12">
                  {/* Node */}
                  <div
                    className={`absolute left-0 top-4 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center transition-all ${
                      isOpen
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-border bg-background"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isOpen ? "text-orange-500" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Card */}
                  <div
                    className={`bg-card border rounded-2xl shadow-xs transition-all ${
                      item.highlight
                        ? "border-orange-500/30 shadow-orange-500/5"
                        : "border-border/80"
                    }`}
                  >
                    {/* Header — always visible, clickable to expand */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : item.version)}
                      className="w-full text-left p-6 space-y-3 group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-md border border-orange-500/20">
                              {item.version}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {item.date}
                            </span>
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                  TAG_STYLES[tag] || "bg-muted text-muted-foreground"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <h3 className="font-medium text-base sm:text-lg text-foreground/90 group-hover:text-orange-500 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-base text-foreground/80 leading-relaxed">
                            {item.summary}
                          </p>
                        </div>

                        {/* Expand toggle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            isOpen
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded feature list */}
                    {isOpen && (
                      <div className="px-6 pb-6 pt-0 border-t border-border/60 mt-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-4 pb-3">
                          What&apos;s included
                        </p>
                        <div className="space-y-3">
                          {item.features.map((feat, fi) => {
                            const FIcon = feat.icon;
                            return (
                              <div key={fi} className="flex items-start gap-3">
                                <div
                                  className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                                >
                                  <FIcon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                                </div>
                                <span className="text-base text-foreground/80 leading-relaxed">
                                  {feat.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center space-y-4 pt-8 border-t border-border">
          <p className="text-base text-foreground/80">
            We build in public. More updates dropping soon.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/new"
              className="px-5 py-2.5 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white font-medium text-xs shadow-lg shadow-orange-500/15 transition-all"
            >
              Launch Your Product
            </Link>
            <Link
              href="/newsletter"
              className="px-5 py-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground font-medium text-xs transition-colors"
            >
              Subscribe to Newsletter
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}