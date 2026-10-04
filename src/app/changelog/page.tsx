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
  AlertCircle,
  CheckCircle,
  Users,
  BarChart2,
  Trophy,
  Search,
  Clock,
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
  Bell,
  Settings,
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
  "Bugfix": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
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
    version: "v7.5.3",
    date: "October 2026",
    title: "Launch Archive Date-Wise Daily, Weekly, Monthly & Yearly Aggregation",
    summary: "Implemented date-wise filtering across Daily, Weekly, Monthly, and Yearly periods on the Launch Archive (/best-products), added week-by-week selectors, and increased items per page to 50 with automatic fallback.",
    icon: Rocket,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    tags: ["Launches", "Improvement", "Leaderboard"],
    features: [
      { icon: Calendar, text: "Added dedicated Weekly period filter with interactive week selectors (Weeks 1 to 5) to browse launches by week of the month." },
      { icon: CheckCircle, text: "Implemented precise IST date-range matching for Daily, Weekly, Monthly, and Yearly views." },
      { icon: Rocket, text: "Increased items per page from 20 to 50 to display all launched products without premature pagination cutoffs." },
      { icon: Sparkles, text: "Added auto-fallback to all live products when visiting root archive view if the current month has no new launches yet." },
    ],
    highlight: true,
  },
  {
    version: "v7.5.2",
    date: "October 2026",
    title: "Top Hunters Leaderboard Full Community Members & Cache Isolation Fix",
    summary: "Fixed Supabase profiles table query column mismatches in /t/leaderboard/top-hunters to accurately include all registered community members (60+ users), increased leaderboard limit to 300, and isolated home page top hunters caching to prevent feed truncations.",
    icon: Trophy,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    tags: ["Leaderboard", "Bugfix", "Profiles", "Performance"],
    features: [
      { icon: Users, text: "Fixed profiles select query in /t/leaderboard/top-hunters by requesting valid database columns, ensuring all 60+ registered users and makers are rendered." },
      { icon: Trophy, text: "Isolated Redis cache key between home sidebar widget and the main /top-hunters leaderboard to prevent 20-product truncation." },
      { icon: Zap, text: "Increased top hunters leaderboard API query limit from 100 to 300 members with smooth multi-page pagination." },
      { icon: ShieldCheck, text: "Added client/offline fallback hydration for registered profiles so members are always listed." },
    ],
    highlight: false,
  },
  {
    version: "v7.5.1",
    date: "October 2026",
    title: "Ad Checkout Return Lifecycle & User Campaign Pending Status Fix",
    summary: "Fixed checkout button loading freeze when users return without paying, enabled real-time pending payment campaign visibility in the user's Campaigns tab with 'Pay Now' action, and guaranteed unpaid campaigns never rotate in live public ads.",
    icon: Megaphone,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    tags: ["Ads", "Payments", "Bugfix", "Profiles"],
    features: [
      { icon: Sparkles, text: "Added window pageshow, visibilitychange, and focus listeners on /ads to automatically reset checkout loading state upon navigation back." },
      { icon: AlertCircle, text: "Fixed user profile Campaigns tab hydration to display pending payment campaigns with real-time status badges and direct Pay Now links." },
      { icon: ShieldCheck, text: "Ensured ad campaigns are recorded as pending_payment prior to checkout completion, completely preventing unpaid products from appearing in live ad rotation." },
      { icon: Rocket, text: "Added pending campaign warning indicator in the ad product selection form to prevent unintended duplicate campaign creation." },
    ],
    highlight: false,
  },
  {
    version: "v7.5.0",
    date: "October 2026",
    title: "Server-Side Rendering (SSR) for Profile, Settings & My Products",
    summary: "Transformed Maker Profile (/profile), Account Settings (/profile/settings), and Maker Dashboard (/my-products) into Server Components with prefetching, SEO metadata, BreadcrumbList JSON-LD schemas, and zero-flash client hydration.",
    icon: Sparkles,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "SSR", "Profiles", "SEO"],
    features: [
      { icon: User, text: "Converted /profile into an async Server Component with server-side profile prefetching, canonical metadata, and BreadcrumbList JSON-LD schema." },
      { icon: Trophy, text: "Converted Maker Karma Leaderboard (/profile/leaderboard) into an async Server Component with 60s ISR caching and ItemList schema." },
      { icon: Flame, text: "Converted Maker Streaks (/profile/streak) into an async Server Component with 60s ISR caching and pre-hydrated streak leaders." },
      { icon: MessageSquare, text: "Converted Community Discussions (/discussions) into an async Server Component with 60s ISR caching and ItemList schema." },
      { icon: MessageSquare, text: "Converted Thread Detail (/threads/[id]) into an async Server Component with server pre-hydration of discussion comments and related products." },
      { icon: Settings, text: "Separated /profile/settings into a dynamic Server Component with secure robots exclusion and dedicated ProfileSettingsClient." },
      { icon: Rocket, text: "Converted /my-products into an async Server Component with server-side catalog pre-hydration and clean dashboard performance." },
      { icon: Settings, text: "Converted /my-products/[id]/settings into an async Server Component with dynamic product metadata and initial props pre-hydration." },
    ],
    highlight: true,
  },
  {
    version: "v7.4.0",
    date: "October 2026",
    title: "Server-Side Rendering (SSR) & 60s ISR for Top Hunters & Leaderboard",
    summary: "Converted Top Hunters (/top-hunters) and Product Leaderboard into async Server Components with Incremental Static Regeneration (revalidate = 60), JSON-LD ItemList schemas, and zero-flash client hydration.",
    icon: Trophy,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "SSR", "Leaderboard", "SEO"],
    features: [
      { icon: Trophy, text: "Converted /top-hunters into an async Server Component with server-side hunter data fetching and ItemList structured data." },
      { icon: Sparkles, text: "Converted product discovery into an async Server Component with server-side category ranking queries and 60-second ISR caching." },
      { icon: ShieldCheck, text: "Eliminated client loading skeletons on initial page load by hydrating TopHuntersClient directly with server props." },
    ],
    highlight: false,
  },
  {
    version: "v7.3.9",
    date: "October 2026",
    title: "Static Pre-Rendering & ISR Across All 54 Product Categories",
    summary: "Configured full server-side rendering (SSR) and Incremental Static Regeneration (ISR with revalidate = 60) across all 54 product categories with generateStaticParams for instant page loads and full search engine indexing.",
    icon: Sparkles,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "SSR", "Categories", "SEO"],
    features: [
      { icon: Sparkles, text: "Implemented generateStaticParams in categories/[category]/page.tsx to pre-render all 54 product categories statically at build time." },
      { icon: Database, text: "Enabled 60-second Incremental Static Regeneration (ISR) and dynamicParams fallback for instant initial loads with real-time data freshness." },
      { icon: ShieldCheck, text: "Verified server-rendered HTML payloads with ItemList, BreadcrumbList, and FAQPage JSON-LD schemas across all category pages." },
    ],
    highlight: false,
  },
  {
    version: "v7.3.8",
    date: "October 2026",
    title: "Product Category Matching Engine & Client-Side Hydration",
    summary: "Built a centralized category matching system across all 54 categories supporting safe tag parsing, broad SaaS matching, keyword search, and client-side fallback hydration.",
    icon: Sparkles,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    tags: ["Bugfix", "Architecture", "Categories"],
    features: [
      { icon: Sparkles, text: "Created categoryMatcher.ts with comprehensive keyword, alias, and tag normalization for all 54 product categories." },
      { icon: Database, text: "Added client-side hydration in CategoryPageClient to ensure products load immediately even during cold SSR start or client-side navigation." },
      { icon: ShieldCheck, text: "Fixed JSON/array string tag parsing so products with various tag formats are accurately categorized." },
    ],
    highlight: false,
  },
  {
    version: "v7.3.7",
    date: "October 2026",
    title: "Launch Widget Maker-Only Visibility & Clean Top Hunters Leaderboard",
    summary: "Strictly restricted the scheduled launch drawer widget to the maker who scheduled the product, and removed demo / mock accounts from the homepage Top Hunters widget and leaderboard API.",
    icon: ShieldCheck,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    tags: ["Bugfix", "Launches", "Community"],
    features: [
      { icon: ShieldCheck, text: "Enforced strict maker ownership checks in LaunchScheduleWidget and getUserProducts so only the creator who scheduled a launch sees their pre-launch management widget." },
      { icon: Users, text: "Filtered out demo / mock accounts (john_doe, jane_smith, user-1, user-2) from Top Hunters and removed mock profile fallback injection." },
      { icon: Sparkles, text: "Added graceful empty state to TopHuntersWidget on the home page when no hunters are active." },
    ],
    highlight: false,
  },
  {
    version: "v7.3.6",
    date: "October 2026",
    title: "Favicon 3-Stage Fallback & Storage Egress Reduction",
    summary: "Replaced all direct Next.js Image / ProductLogo usages for product logos with a new reusable Favicon component that tries the stored URL first, then Google Favicons API (zero our-storage egress), then a local placeholder — dramatically reducing Supabase storage bandwidth.",
    icon: Zap,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
    tags: ["Performance", "Architecture", "Improvement"],
    features: [
      { icon: Zap, text: "Created <Favicon> component with 3-stage onError fallback: logo_url (stored) → Google Favicons API (derived from website_url, zero our egress) → /default-favicon.png local placeholder." },
      { icon: Database, text: "Migrated ProductItem (feed), search page, and CategoryPageClient logos from direct <Image> / deleted ProductLogo to <Favicon>." },
      { icon: ShieldCheck, text: "Added website_url to CompanyLogo interface in CategoryPageClient so the Google Favicons fallback can resolve from the product domain." },
      { icon: Rocket, text: "Added /public/default-favicon.png placeholder so the final fallback always renders gracefully without hitting our storage." },
    ],
    highlight: false,
  },
  {
    version: "v7.3.6",
    date: "October 2026",
    title: "Instant Launch Scheduling & Zero-Lag Pre-Launch Dashboard",
    summary: "Eliminated multi-second delays when scheduling launches from the calendar and viewing the pre-launch dashboard through concurrent extra submissions, optimistic cache seeding, route prefetching, and parallel data fetching.",
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "Scheduling", "Pre-Launch", "UX"],
    features: [
      { icon: Zap, text: "Added interactive scheduling state & loading feedback inside DatePickerModal, providing immediate visual confirmation when selecting launch dates." },
      { icon: Rocket, text: "Parallelized auxiliary launch extras (first comment, shoutouts, investor details, notification emails) with Promise.allSettled to speed up creation by over 70%." },
      { icon: Database, text: "Eliminated blocking full-table fetches during submission and enabled synchronous client hydration (stale-while-revalidate) for 0ms Pre-Launch Dashboard loads." },
      { icon: Clock, text: "Prefetched pre-launch dashboard routes in the background while the confirmation modal is open, eliminating transition delay upon closing." }
    ],
    highlight: true,
  },
  {
    version: "v7.3.5",
    date: "October 2026",
    title: "Midnight IST Launch Scheduling & SSR Upcoming Products",
    summary: "Aligned product launch scheduling with exact 12:00 AM Midnight IST rollover and ensured upcoming scheduled launches are included in server-rendered initial data on the home page.",
    icon: Rocket,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    tags: ["Bugfix", "Launches", "SSR"],
    features: [
      { icon: Clock, text: "Fixed DatePickerModal to schedule launches for 12:00:00 AM Midnight IST (00:00:00 IST) instead of 12:00 PM Noon, ensuring products go live at midnight on launch day." },
      { icon: Database, text: "Updated Home page SSR (src/app/page.tsx) to include upcoming scheduled launches in initialVisibleProducts so the upcoming cohort is populated on initial page load." },
      { icon: Zap, text: "Calibrated isIndianPreLaunchWindow to 8:00 PM – 12:00 AM IST (20:00 to 23:59:59 IST) so products preview in Upcoming until midnight and transition smoothly into Today's Top Products." },
    ],
    highlight: false,
  },
  {
    version: "v7.3.4",
    date: "October 2026",
    title: "Maker Profile Persistence & Production Hydration Fix",
    summary: "Fixed an issue in production where user profiles (avatar image, username, full name, and details) would vanish after a page refresh due to schema column mismatch and unhandled mock fallback overwrites.",
    icon: User,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    tags: ["Bugfix", "Profiles", "Database", "Hydration"],
    features: [
      { icon: Database, text: "Corrected PROFILE_COLS query in /t/profiles to target the valid database column 'website' instead of 'website_url', preventing PostgreSQL 42703 column query failures." },
      { icon: ShieldCheck, text: "Eliminated destructive mock profile fallbacks that clobbered real user profiles on refresh when querying /t/profiles with authentic user IDs." },
      { icon: Zap, text: "Implemented background profile hydration in AuthInitializer and synchronized Redux and localStorage across settings updates and profile page loads." },
    ],
    highlight: false,
  },
  {
    version: "v7.3.3",
    date: "October 2026",
    title: "Direct DB Product Resolution & SSR 404 Prevention",
    summary: "Eliminated production 404s on product pages by implementing direct Supabase database querying on the server, dynamic slug resolution, and busting Next.js unstable_cache null poisoning.",
    icon: ShieldCheck,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    tags: ["Bugfix", "SSR", "Database", "Routing"],
    features: [
      { icon: Database, text: "Server-side product resolution now queries Supabase directly during SSR, eliminating flaky network self-fetch roundtrips on serverless hosts." },
      { icon: Zap, text: "Busted stale unstable_cache with product_v3 cache tag and lowered TTL to 60s so cached 404s never persist." },
      { icon: Shield, text: "Enhanced resolveProductId with database fallback and slug normalization for robust matching by slug, ID, or name." },
    ],
    highlight: false,
  },
  {
    version: "v7.3.2",
    date: "October 2026",
    title: "Product Detail Page Hydration Stabilization",
    summary: "Fixed SSR hydration mismatch on the product detail page caused by server vs client similar products calculation differences.",
    icon: Zap,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    tags: ["Bugfix", "SSR", "Hydration"],
    features: [
      { icon: CheckCircle, text: "Server component now calls getProducts() instead of reading cold/empty Redis cache directly, ensuring consistent server-rendered similar products and rank calculations." },
      { icon: Shield, text: "SidebarPanel similar products state in ProductDetailPageClient is now initialized from server-provided initialSimilarProducts and updated post-mount via useEffect to eliminate React hydration mismatch." },
      { icon: Zap, text: "Fixed similar product key attributes in SidebarPanel to use unique product IDs." },
    ],
    highlight: true,
  },
  {
    version: "v7.3.1",
    date: "October 2026",
    title: "SSR Bot-Protection Bypass — Product Pages & Category Pages Fixed",
    summary: "Fixed critical production bug where server-side rendering self-requests were blocked by the bot-detection middleware, causing 404 errors on product detail pages and empty product lists on category pages.",
    icon: ShieldCheck,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10",
    tags: ["Security", "Performance", "Architecture"],
    features: [
      { icon: ShieldCheck, text: "Root cause: Node.js fetch User-Agent matched 'node-fetch' in the bot blocklist, causing middleware to 403-block all SSR self-requests to /t/products endpoints." },
      { icon: Zap, text: "Added X-Internal-SSR bypass header to secureApiFetch for server-side requests, with a clean IndiHunt-SSR/1.0 User-Agent." },
      { icon: Shield, text: "Middleware now skips bot-detection for trusted internal SSR requests while maintaining full protection for external scrapers." },
      { icon: CheckCircle, text: "Product detail pages, category pages, home feed, and all server-rendered product listings now load correctly in production." },
    ],
    highlight: true,
  },
  {
    version: "v7.3.0",
    date: "October 2026",
    title: "Login Pipeline Neutralization, WebSocket Stability & Zero-Egress Reviews",
    summary: "Eliminated duplicate login fetch cascades in DataOrchestrator, stabilized WebSocket callbacks and provider context references, prevented channel leaks on publish, and optimized React Query cache with targeted mutation updates.",
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "Architecture", "Realtime"],
    features: [
      { icon: Zap, text: "DataOrchestrator streamlined to instant COMPLETED transition with zero background fetch cascades." },
      { icon: Rocket, text: "React Query defaults updated to 5m staleTime, 30m gcTime, and disabled window-focus/reconnect refetches." },
      { icon: ShieldCheck, text: "WebSocketProvider memoized with useCallback/useMemo and transient channel cleanup on publish." },
      { icon: Database, text: "Reviews caching optimized with 30m TTL, no mount refetches, and setQueryData mutation cache updates." },
      { icon: CheckCircle, text: "Selective columns and edge caching enabled across threads and profiles API routes." }
    ],
    highlight: true,
  },
  {
    version: "v7.2.0",
    date: "October 2026",
    title: "Edge CDN Caching, Proxy Hardening & Navbar Egress Optimization",
    summary: "Enabled Vercel Edge caching for guest requests, added lightweight head-count notification queries, throttled Supabase proxy behind rate-limits, and optimized review and comment cache keys.",
    icon: ShieldCheck,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    tags: ["Performance", "Security", "Improvement"],
    features: [
      { icon: Zap, text: "Vercel Edge Caching: Enabled public CDN caching with stale-while-revalidate headers on guest GET endpoints for products, comments, and reviews." },
      { icon: ShieldCheck, text: "Proxy Hardening & Rate Limiting: Moved IP rate limiting upstream of the Supabase rewrite proxy and removed blanket API caching." },
      { icon: Bell, text: "Lightweight Head Count Notifications: Added count_only notification head query and React Query caching for instant unread dot badges." },
      { icon: Zap, text: "Zero-Overhead Auth Initialization: Replaced duplicate session fetchers and eager cache wipes with deduplicated onAuthStateChange and single-network-request upvote hydration." },
      { icon: Database, text: "Selective Review Joins: Replaced heavy full-table joins with targeted columns and added Redis eviction on review deletion." },
    ],
    highlight: true,
  },
  {
    version: "v7.1.0",
    date: "October 2026",
    title: "Sub-Second Page Load Optimization & Request Deduplication",
    summary: "Eliminated duplicate product queries via React request caching, chained home page leaderboard queries to reuse in-flight data, and prevented footer link prefetch congestion.",
    icon: Zap,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    tags: ["Performance", "Improvement", "Architecture"],
    features: [
      { icon: Zap, text: "React & Next.js Request + ISR Caching: Unified metadata and layout fetching with unstable_cache and React cache, caching across requests with tag-based invalidation." },
      { icon: CheckCircle, text: "Streaming JSON-LD in Suspense: Offloaded structured schema generation to a non-blocking background Suspense stream with vanilla JSON-LD scripts." },
      { icon: Database, text: "Leaderboard Dataset Sharing: Top hunters calculation now reuses the in-flight home page products promise, eliminating parallel 1000-row table queries." },
      { icon: TrendingUp, text: "Prefetch Throttling: Disabled aggressive viewport link prefetching across 35+ footer links, preventing network saturation when scrolling." },
    ],
    highlight: true,
  },
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
                    className={`absolute left-0 top-4 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center transition-all ${isOpen
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border bg-background"
                      }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${isOpen ? "text-orange-500" : "text-muted-foreground"
                        }`}
                    />
                  </div>

                  {/* Card */}
                  <div
                    className={`bg-card border rounded-2xl shadow-xs transition-all ${item.highlight
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
                                className={`text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${TAG_STYLES[tag] || "bg-muted text-muted-foreground"
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen
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