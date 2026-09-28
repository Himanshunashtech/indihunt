"use client";


import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft,
  Mail,
  ExternalLink,
  Sparkles,
  Calendar,
  Rocket,
  Shield,
  ShieldCheck,
  CheckCircle,
  Users,
  BarChart2,
  Award,
  Target,
  Trophy,
  Search,
  Bell,
  Bot,
  MessageSquare,
  Share2,
  Star,
  Compass,
  Zap,
  Globe,
  Send,
  Lock,
  Flame,
  TrendingUp,
  Eye,
  BookOpen,
  Map,
  Database,
  Code,
  Play,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Package,
  Palette,
  Menu,
  LayoutGrid,
  Smartphone,
  User,
  ArrowUp,
  ArrowRight,
  Code2,
  Layers,
  Download,
  Trash2,
  Sun,
  GraduationCap,
  Upload,
  Briefcase,
  Megaphone,
  Cookie,
  Bookmark,
  Plus,
  CreditCard,
  DollarSign,
  Tag,
  Tags,
  ToggleRight,
  Server,
  RefreshCw,
} from "lucide-react";

const TAG_STYLES: Record<string, string> = {
  "New Feature": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Improvement": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Performance": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Security": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Design": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Database": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
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
    version: "v7.10.0",
    date: "September 28, 2026",
    title: "Sub-50ms Instant Product Detail Page Loading & SSR Direct DB Query",
    summary: "Engineered sub-50ms instant product page loading. Eliminated SSR HTTP loopback latency by enabling direct in-process database & Redis reads in getProductByIdRaw, fixed initialData freshness flags in useProduct to prevent forced client-side refetches, removed dead eager collections fetching, synchronously seeded similar products cache, and prioritized primary screenshot asset delivery.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Performance", "Frontend", "Database", "Optimization"],
    features: [
      { icon: Zap, text: "Zero-Loopback SSR DB Queries: getProductByIdRaw now queries direct Supabase and Redis during SSR, cutting server TTFB by over 120ms." },
      { icon: CheckCircle, text: "Eliminated Forced Client Refetch: Configured initialDataUpdatedAt so TanStack Query serves the SSR product instantaneously without triggering a blocking browser network request." },
      { icon: Layers, text: "Synchronous State Seeding: Initialized similar products pool directly in useState from local caches, eliminating secondary render cycles." },
      { icon: Clock, text: "Non-Blocking Telemetry: Moved non-critical view and follow telemetry to background idle timers." },
    ],
    highlight: true,
  },
  {
    version: "v7.9.0",
    date: "September 28, 2026",
    title: "Instant Upvote & Unvote Real-Time State Reconciliation",
    summary: "Fixed an issue where upvoting and unvoting required manual page refreshes. Implemented complete server-side Redis cache invalidation on upvote mutations, eliminated premature query invalidation race conditions in useToggleUpvoteMutation, ensured unified UUID and slug reconciliation across client localStorage caches, and updated product detail memo logic to accurately reflect immediate user unvote interactions.",
    icon: Flame,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Bug Fix", "Performance", "Frontend", "Database"],
    features: [
      { icon: Flame, text: "Instant 0ms Vote & Unvote Response: Optimistic and server-confirmed has_upvoted state updates immediately without requiring a browser reload." },
      { icon: CheckCircle, text: "Server-Side Cache Purging: /t/products/[id]/upvote now actively evicts Redis product list and detail keys on every vote mutation." },
      { icon: Zap, text: "Unified UUID/Slug LocalStorage Tracking: Both canonical UUIDs and URL slugs are stored and indexed, ensuring flawless cross-page upvote status recognition." },
      { icon: RefreshCw, text: "Eliminated Race Condition Refetches: useToggleUpvoteMutation now directly synchronizes all TanStack query caches on success without disruptive onSettled invalidations." },
    ],
    highlight: false,
  },
  {
    version: "v7.8.0",
    date: "September 28, 2026",
    title: "Home Page API Call Deduplication & Staged Data Orchestration",
    summary: "Significantly reduced unnecessary and duplicate API calls on initial Home Page load. Eliminated redundant auth session listeners and profile queries in HomePageClient by centralizing profile hydration via Redux store, added query cache awareness to UI_BLOCKING orchestrator stage, and deferred secondary background feed prefetching by 2 seconds to eliminate main thread and network contention during first paint.",
    icon: Zap,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Performance", "Optimization", "Frontend"],
    features: [
      { icon: Zap, text: "Deduplicated Profile & Auth Fetching: Removed duplicate Supabase session listeners and getUserProfile requests in HomePageClient, relying on global Redux state." },
      { icon: CheckCircle, text: "Cache-Aware UI Blocking Stage: Prevented redundant refetches of products and threads if already populated during server-side render or hydration." },
      { icon: Clock, text: "Deferred Secondary Prefetching: Added a 2-second idle window before prefetching stories and leaderboards, ensuring zero network contention on initial load." },
    ],
    highlight: false,
  },
  {
    version: "v7.7.0",
    date: "September 28, 2026",
    title: "Instant Product Detail Page Loading, Lazy Comments & Hydration Fix",
    summary: "Optimized the product detail page for 0ms instant loading with zero hydration mismatches. Product hero, description, logo, screenshots, and upvote state render immediately from SSR without blocking network requests. Comments lazy-load on scroll via sentinel ref on DiscussionSection, tabs fetch strictly on demand, and local upvote state is instantly reconciled with user localStorage cache.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Performance", "Frontend", "UI/UX", "Bug Fix"],
    features: [
      { icon: Zap, text: "0ms Instant Above-The-Fold Render: Product name, tagline, description, icon, screenshots carousel, and upvote button render immediately with zero blocking requests." },
      { icon: CheckCircle, text: "Zero Hydration Mismatch: Added mounted state guard on client auth editor in DiscussionSection and attached sentinel intersection ref directly to the root element, eliminating SSR/client HTML divergence." },
      { icon: Star, text: "Persistent Upvote State Reconcile: Product memo and handleVote now synchronously read and write to user-scoped localStorage upvote sets, ensuring upvote status displays instantly on page open." },
      { icon: MessageSquare, text: "Scroll-Triggered Lazy Comments: Comments network queries activate via IntersectionObserver only when the user scrolls down towards the discussion section." },
      { icon: Layers, text: "On-Demand Tab Data: Reviews, Alternatives, Forum threads, Team members, Followers, and Shoutouts are fetched only when the user selects their respective tab." },
    ],
    highlight: false,
  },
  {
    version: "v7.6.0",
    date: "September 28, 2026",
    title: "Upvote State & Cache Invalidation Synchronization Fix",
    summary: "Fixed upvote and unupvote state reversion caused by stale L1 in-memory client caches and secure payload property unpacking. Added automated multi-target cache purging on upvote mutations, optimistic promoted products cache synchronization, and robust UUID/slug handling in the product upvote route.",
    icon: Flame,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Bug Fix", "Performance", "Frontend"],
    features: [
      { icon: CheckCircle, text: "Payload Property Spreading: Fixed secureApiFetch to unwrap obfuscated server payloads onto top-level response objects, ensuring has_upvoted and upvotes_count are reliably populated." },
      { icon: Zap, text: "L1 Cache Purging: Upvote mutations now proactively purge matching /t/products, /t/threads, and /t/upvotes in-memory caches, preventing React Query from reconciling against stale data." },
      { icon: Shield, text: "Promoted & Feed Query Sync: Updated useToggleUpvoteMutation to optimistically update products, promoted_products, and single-product caches simultaneously with rollback protection." },
      { icon: Star, text: "Product Detail Client Hydration: ProductDetailPageClient and useProduct now seamlessly hydrate upvote state in 0ms from localStorage cache on SSR-rendered pages for authenticated users." },
      { icon: MessageSquare, text: "Thread Upvote & Slug Resolution: Added slug-to-UUID resolution in thread upvote routes, computed has_upvoted for authenticated requests, and added useToggleThreadUpvoteMutation." },
      { icon: Database, text: "Slug & Non-UUID Upvote Support: Product upvote API route now automatically resolves non-UUID slugs to valid product records before recording votes." },
    ],
    highlight: false,
  },
  {
    version: "v7.5.0",
    date: "September 27, 2026",
    title: "Platform-Wide Instant In-Memory Caching & Request Coalescing",
    summary: "Eliminated repeated database calls across the entire platform. Added high-speed L1 in-memory client-side caching with 45s TTL, in-flight request deduplication (coalescing simultaneous duplicate network calls), and distributed Redis caching across product details, threads, stories, ads, and billboards.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Performance", "Architecture", "Database"],
    features: [
      { icon: Zap, text: "0ms Client In-Memory Cache: All GET API calls now return instantly from browser memory on return visits and tab switches." },
      { icon: Layers, text: "In-Flight Request Deduplication: Simultaneous duplicate requests across components are coalesced into a single network execution." },
      { icon: Database, text: "Full Route Cache Coverage: Added L1/L2 Redis caching to /t/products/[id], /t/threads, /t/stories, /t/ads, and /t/billboards routes with instant auto-invalidation." },
      { icon: Sparkles, text: "Karma Leaderboard Pagination: Added 20-items-per-page numeric pagination with rank calculation and tab persistence on /profile/leaderboard." },
    ],
    highlight: true,
  },
  {
    version: "v7.4.0",
    date: "September 27, 2026",
    title: "Standardized 20-Item Pagination & Real-Time Notification Triggers",
    summary: "Unified 20-item per page pagination across Streak Leaderboard, Category Leaderboards, Top Hunters, and Top Products pages with responsive smart-ellipsis controls. Expanded product API limit from 30 to 500 items and wired automatic notification creation for upvotes and comments.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Improvement", "UI/UX", "Notifications"],
    features: [
      { icon: LayoutGrid, text: "Standardized 20 Items Per Page: Streak Leaderboard, Category Leaderboards, and Top Products now consistently paginate with 20 items per page." },
      { icon: Database, text: "Full Catalog Access: Increased default API limits to 500 so all products and streak members are browsable via pagination without truncation." },
      { icon: ChevronRight, text: "Smart Ellipsis Pagination Controls: Added unified First, Prev, smart-ellipsis page buttons, Next, and Last controls with total count indicators across all pages." },
      { icon: Bell, text: "Live Notification Triggers: Product upvotes and comments now trigger notifications for product makers in real-time." },
    ],
    highlight: true,
  },
  {
    version: "v7.3.0",
    date: "September 27, 2026",
    title: "Instant Product Page Loading — Zero Client Refetch on SSR Data",
    summary: "Eliminated redundant client-side refetches on the product detail page. TanStack Query now respects SSR-fresh data for the full staleTime window, SSR no longer blocks on reviews/alternatives fetches, and loadData() short-circuits when product data already exists in any cache layer.",
    icon: Zap,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    tags: ["Performance", "Improvement"],
    features: [
      { icon: Zap, text: "Instant Return Visits: initialDataUpdatedAt now set to Date.now() so TanStack Query treats SSR product data as fresh, eliminating the forced getProductById() refetch on every page mount." },
      { icon: Database, text: "Faster SSR: Removed blocking getReviews() and getAlternatives() from the server page component. Reviews and alternatives now load lazily client-side only when their respective tabs are opened." },
      { icon: RefreshCw, text: "Smart loadData() Guard: loadData() now detects existing product data in queryProduct, initialProduct, or localProduct and skips re-fetching — only loading secondary data that is genuinely missing." },
      { icon: CheckCircle, text: "Zero TypeScript Errors: all three changes verified with npx tsc --noEmit passing clean." },
    ],
    highlight: true,
  },
  {
    version: "v7.2.0",
    date: "September 27, 2026",
    title: "Global Full-Database Search & Intelligent Duplicate Launch Protection",
    summary: "Fixed search across all historical products, threads, and profiles with database-level ILIKE filtering and multi-entity vector embedding. Added comprehensive URL normalization and duplicate product launch detection across client and server.",
    icon: Search,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    tags: ["Improvement", "Security", "Database"],
    features: [
      { icon: Search, text: "Full-Database Product Search: /t/products now filters with ILIKE across name, tagline, description, and launch tags directly at the database level without the 30-item limit." },
      { icon: Zap, text: "Enhanced Multi-Entity Vector Search: performVectorSearch now queries live API search endpoints and merges with local caches for exhaustive search across products, threads, and user profiles." },
      { icon: ShieldCheck, text: "Intelligent URL Normalization & Duplicate Prevention: Added checkProductUrlExists and normalizer to prevent duplicate launches across protocols (http/https), www subdomains, URL parameters, and trailing slashes." },
      { icon: Shield, text: "Server-Side Duplicate Validation: POST /t/products rejects duplicate product domains and existing names with HTTP 409 conflict status." },
    ],
    highlight: true,
  },

  {
    version: "v7.1.0",
    date: "September 27, 2026",
    title: "High-Performance Egress Reduction & Distributed Cache Engine",
    summary: "Massive bandwidth optimization targeting <5 GB/month per 50,000 active users. Includes feed column pruning, Redis TTL enhancements, optimized profile SELECTs, and cached leaderboard queries.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Performance", "Database", "Improvement"],
    features: [
      { icon: Database, text: "Selective Column Pruning: /t/products list queries now only transfer lightweight feed-card fields, reducing payload sizes by ~85%." },
      { icon: Zap, text: "Extended Redis TTL: Feed and pulse caches extended to 300s-600s with 80%+ cache hit rate for public requests." },
      { icon: BarChart2, text: "Leaderboard & Stats Caching: Top hunters, streaks, and pulse endpoints fully cached and pruned to minimize database roundtrips." },
      { icon: Shield, text: "Optimized Product Lookup: Slug matching queries streamlined to prevent bulk data transfer on product detail pages." },
    ],
    highlight: true,
  },
  {
    version: "v7.0.0",
    date: "September 26, 2026",
    title: "100% REST API Migration & Obfuscated Network Layer",
    summary: "Completed 100% migration of all direct Supabase database calls across the entire platform to secure /t/* REST API endpoints featuring AES-style network payload obfuscation and resilient offline local storage fallbacks.",
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Security", "Database", "Performance"],
    features: [
      { icon: ShieldCheck, text: "Complete DB Encapsulation: 100% of direct supabase.from table queries migrated to server-side Next.js route handlers." },
      { icon: Lock, text: "Opaque Network Traffic: all API responses transmitted as encoded cryptographic payloads (_d), rendering DevTools inspection completely opaque." },
      { icon: Database, text: "Offline & LocalStorage Fallbacks: transparent offline fallback guarantees uninterrupted operation even with network disruptions." },
      { icon: Zap, text: "Zero TypeScript Errors: full end-to-end type validation verified across all client and server endpoints." },
    ],
    highlight: true,
  },
  {
    version: "v6.5.2",
    date: "September 26, 2026",
    title: "Best Products Leaderboard Upvote State & Color Sync",
    summary: "Fixed upvote active state detection and colors on the Best Products leaderboard page (/best-products), ensuring upvoted products render with vibrant orange badge styling and instant local storage sync.",
    icon: Flame,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Improvement", "Design"],
    features: [
      { icon: CheckCircle, text: "Active Upvote Color Highlighting: upvoted products now prominently render active orange background, border, and count styling on the leaderboard." },
      { icon: Database, text: "Instant Upvote Cache Sync: authenticated and cached upvote states from localStorage and Redux hydrate immediately on load." },
      { icon: Zap, text: "Optimistic Leaderboard Upvotes: toggling upvotes updates counts and active status with instant UI feedback." },
    ],
    highlight: true,
  },
  {
    version: "v6.5.0",
    date: "September 17, 2026",
    title: "Best Products Unified Dynamic Catch-All Routing",
    summary: "Consolidated Best Products date and period leaderboard navigation into a resilient Next.js optional catch-all route (/best-products/[[...params]]), eliminating 404 errors across Yesterday, Last Week, Last Month, and custom date archive views.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Improvement", "Performance"],
    features: [
      { icon: CheckCircle, text: "Zero-404 Catch-All Routing: unified all /best-products, /best-products/daily/[year]/[month]/[day], /best-products/weekly/[year]/[month], and /best-products/monthly/[year]/[month] routes." },
      { icon: Zap, text: "Eliminated Deep Dynamic Folder Fragmentation: removed brittle 4-level nested dynamic segments that broke under Next.js Turbopack dev router caching." },
      { icon: Calendar, text: "Seamless Period Transitions: instant date, month, year, and tab switching across all leaderboard archive feeds." },
    ],
    highlight: true,
  },
  {
    version: "v6.5.1",
    date: "September 17, 2026",
    title: "DB Query & Cache Consistency Fixes",
    summary: "Four targeted fixes in supabase.ts: indexed slug lookup replaces 3-fallback full-table scan in product detail, polar_payments removed from write hot-path, all report functions unified to upsert, and missing cache invalidation added to three mutating functions.",
    icon: Zap,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    tags: ["Fix", "Performance"],
    features: [
      { icon: Zap, text: "Slug indexed lookup: getProductByIdRaw now uses a single eq('slug') query backed by a generated column + B-tree index (migration 100), eliminating the previous 3-fallback waterfall ending in a limit(500) full-table scan." },
      { icon: CheckCircle, text: "polar_payments write cleanup: recordPayment and updatePaymentStatusInDb no longer unconditionally dual-write to the legacy polar_payments table — it is now a true fallback activated only when the canonical payments table is missing the row." },
      { icon: CheckCircle, text: "Report upsert unification: reportProduct and reportThread now use .upsert() with onConflict, matching reportComment, eliminating spurious 23505 error logs on duplicate reports." },
      { icon: CheckCircle, text: "Cache invalidation fixed: addAlternative, createProductThread, and toggleFollowUser now call clearCache() on successful DB writes, preventing stale client-side data after mutations." },
    ],
    highlight: false,
  },
  {
    version: "v6.4.9",
    date: "September 11, 2026",
    title: "Cloudflare Turnstile Removal & Profile Route SEO Hardening",
    summary: "Removed Cloudflare Turnstile external script and verification endpoints across the application to streamline page load performance, and eliminated client-side soft redirects on user profiles to ensure correct HTTP 404 responses for search engine crawlers.",
    icon: Globe,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Improvement", "Performance"],
    features: [
      { icon: Zap, text: "Removed Cloudflare Turnstile: decommissioned external api.js challenge script from root layout and removed unused /t/turnstile endpoints." },
      { icon: CheckCircle, text: "Profile Route SEO Stabilization: added notFound() handling to /@username routes so non-existent users return genuine 404 statuses instead of client-side redirects to home." },
      { icon: Shield, text: "Preserved SSR Hydration: prevented initialProfile prop from being wiped on mount in ProfileContent." },
    ],
    highlight: false,
  },
  {
    version: "v6.4.8",
    date: "September 11, 2026",
    title: "Network Privacy Hardening & Sensitive Field Sanitization",
    summary: "Implemented strict field whitelisting across all public API routes, stripped internal database metadata from mutation responses, locked down diagnostic endpoints, and guaranteed zero private email or administrative role leaks across client network calls.",
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Security", "Improvement", "Database"],
    highlight: true,
    features: [
      { icon: Lock, text: "Strict Public Field Whitelisting: Audited /t/stories, /t/products, /t/threads, /t/comments, and /t/profiles/hover to selectively return only public profile attributes, preventing work_email, user roles, and internal metadata exposure." },
      { icon: CheckCircle, text: "Clean Mutation Payloads: Streamlined notification processing and creation responses to return clean { success: true } envelopes without dumping raw internal database rows." },
      { icon: Shield, text: "Admin Diagnostic Lockout: Hardened /t/admin-debug to require server-verified admin authorization and removed public email reflection, eliminating information leakage." }
    ]
  },
  {
    version: "v6.4.7",
    date: "September 11, 2026",
    title: "Universal API Response Wrapper Architecture",
    summary: "Built a centralized, robust API response wrapper pipeline ensuring every route handler response is automatically formatted with standardized { success: true } envelopes, consistent HTTP status mapping, error encapsulation, and higher-order route middleware wrapper support.",
    icon: Code2,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    tags: ["Improvement", "Database", "Performance"],
    highlight: true,
    features: [
      { icon: CheckCircle, text: "Standardized Success Guarantee: Every response through apiSuccess() and wrapResponse() automatically guarantees { success: true } payload structure." },
      { icon: Layers, text: "withResponseWrapper HOF: Higher-order route wrapper that intercepts all handler outputs, automatically wrapping returns in { success: true } and catching unhandled exceptions." },
      { icon: ShieldCheck, text: "Unified Response Utilities: Consolidated @/lib/api/response and @/lib/api-response with complete type safety and backwards compatibility." }
    ]
  },
  {
    version: "v6.4.6",
    date: "September 11, 2026",
    title: "Secure Session Storage & Zero LocalStorage Auth Footprint",
    summary: "Hardened client authentication security by removing all user session objects and tokens from browser localStorage. User sessions are now managed exclusively through secure Supabase SSR cookies and in-memory Redux state, preventing XSS-based session extraction and automatically purging legacy session keys.",
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Security", "Improvement", "Authentication"],
    highlight: false,
    features: [
      { icon: ShieldCheck, text: "Zero LocalStorage Session Footprint: Eliminated raw user session storage from localStorage, preventing client-side script inspection or XSS session harvesting." },
      { icon: Lock, text: "Secure Supabase SSR Cookie Auth: Sessions are securely backed by HTTP cookies managed through Supabase SSR server and browser clients." },
      { icon: Sparkles, text: "Automated Legacy Session Purging: Injected automatic client-side startup cleanup to immediately purge any legacy indihunt_user_session artifacts from local browser storage." }
    ]
  },
  {
    version: "v6.4.5",
    date: "September 9, 2026",
    title: "Footer Infinite Moving Badge Marquee Banner Integration",
    summary: "Created a dedicated smooth infinite-scrolling marquee ticker below the global footer showcasing official partner and platform discovery badges with pause-on-hover interaction and subtle gradient fade masks.",
    icon: Award,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Feature", "UI/UX", "Footer", "Badges"],
    highlight: false,
    features: [
      { icon: CheckCircle, text: "Infinite Marquee Animation: Implemented CSS keyframe ticker with seamless loop wrapping and pause-on-hover interaction." },
      { icon: Sparkles, text: "Gradient Edge Fades: Added left and right gradient blend masks for a sleek, modern visual aesthetic." },
      { icon: Award, text: "Comprehensive Badge Showcase: Included IndiHunt Embed, Twelve Tools, IndieHunt.io, and SaaSHub Approved badges." }
    ]
  },
  {
    version: "v6.4.4",
    date: "September 9, 2026",
    title: "Advertise Page Live Ecosystem Data Overhaul & Authentic Maker Integration",
    summary: "Replaced all legacy placeholder brand names and mock logos on the /advertise portal with 100% real IndiHunt platform data, including live pulse community statistics, dynamic live-launched product showcases, active billboard previews, and real Indian indie founder stories.",
    icon: Megaphone,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Improvement", "Advertise", "Data Accuracy", "Makers"],
    highlight: false,
    features: [
      { icon: CheckCircle, text: "Zero Fake Companies: Completely removed legacy third-party placeholder brand names (Flatfile, Stripe, Mixpanel, Sprig, VEED, 1Password, Zotion, Remotebase) across the entire /advertise surface." },
      { icon: BarChart2, text: "Live Platform Pulse Metrics: Wired real-time community statistics directly from /t/stats/pulse, displaying actual active makers, live products, and total community upvotes." },
      { icon: Rocket, text: "Live Product Ecosystem Showcase: Added dynamic interactive previews of live Indian software products and active campaigns launched directly on IndiHunt with one-click navigation to their product detail pages." },
      { icon: Users, text: "Authentic Maker Avatars: Hooked hero community avatars directly into top active hunters and verified creators with their actual profile assets." },
      { icon: BookOpen, text: "Real Founder Stories & Case Studies: Connected success stories directly to verified IndiHunt builder case studies and launch journeys." }
    ]
  },
  {
    version: "v6.4.3",
    date: "September 9, 2026",
    title: "Pre-Launch Dashboard 404 Resolution, SSR Hydration & $1,199 Ads Prefill Integration",
    summary: "Resolved 404 Not Found error on the Pre-Launch Dashboard, added client mount guards to AdminBar and LaunchCelebration to eliminate React SSR hydration mismatches, updated promo banners to accurate $1,199 pricing, and wired direct prefilled navigation to the /ads campaign creation engine.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Bug Fix", "Improvement", "Pre-Launch", "Ads", "SSR"],
    highlight: false,
    features: [
      { icon: CheckCircle, text: "RSC Server-to-Client Prop Compliance: Removed event handler function props passed across React Server Component boundaries to <Navbar /> on /categories and /products/[id]/alternatives." },
      { icon: Megaphone, text: "Direct /ads Product Prefill: Updated AdminBar and Pre-Launch dashboard ad links to route to /ads?product_id={id}, automatically prefilling campaign name, headlines, tagline, and destination URLs." },
      { icon: DollarSign, text: "Accurate $1,199 Ad Pricing: Corrected legacy $5,000 ad copy across AdminBar and Pre-Launch dashboards to reflect the official $1,199 self-serve package." },
      { icon: CheckCircle, text: "Zero Hydration Mismatch: Added mounted lifecycle guards to AdminBar and LaunchCelebration, guaranteeing 100% server/client HTML parity when rendering authenticated maker UI." },
      { icon: Rocket, text: "Pre-Launch 404 Resolution: Eliminated abrupt client-side notFound() throws for launched products, allowing creators to access checklist, embed badges, and social assets at all times." },
      { icon: Database, text: "Enhanced Slug Resolution: Upgraded getProductByIdRaw with multi-token keyword searching and comprehensive fallback scanning so any product is reliably resolved by slug." }
    ]
  },
  {
    version: "v6.4.2",
    date: "September 9, 2026",
    title: "DataOrchestrator Race Condition & Pipeline Resilience Fixes",
    summary: "Fixed migrationId pre-increment bug that aborted in-flight data migrations on duplicate calls, wired 10-second safety fallback timeout, added automatic retry logic for critical user profile hydration, integrated auxiliary cache prefetching in background stage, and improved error telemetry.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Improvement", "Performance", "Bug Fix"],
    highlight: true,
    features: [
      { icon: CheckCircle, text: "Fixed migrationId Race Condition: Ensured active migration guards are not prematurely invalidated by checking active state prior to bumping migration IDs." },
      { icon: Shield, text: "Safety Timeout Protection: Wired 10s critical timeout to prevent orchestrator state from locking in non-completed stages on unexpected network stalls." },
      { icon: Zap, text: "Resilient Critical Stage: Wrapped user profile hydration in runWithRetry to seamlessly survive transient network drops on auth return." },
      { icon: Rocket, text: "Background Cache Warmup: Fully wired BACKGROUND stage prefetch into the orchestrator pipeline for instant auxiliary page navigation." }
    ]
  },
  {
    version: "v6.4.1",
    date: "September 9, 2026",
    title: "SSR Hydration Mismatch Resolution & Instant 0ms Upvote State Synchronization",
    summary: "Fixed React hydration mismatch error on home feed upvote counts, eliminated stale placeholder reads during initial SSR paint, parallelized Supabase products/upvotes queries, and achieved instantaneous (0ms) upvote orange highlight restoration immediately upon login.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Improvement", "Performance", "Bug Fix"],
    highlight: true,
    features: [
      { icon: Zap, text: "Instant 0ms Login Upvote Highlights: Dynamically seed local user upvote states into TanStack Query placeholderData on login, switching upvote button orange highlights in 0ms without waiting for network round-trips." },
      { icon: CheckCircle, text: "Zero Hydration Mismatch: Replaced un-hydrated client localStorage reads in useProducts/useThreads placeholderData with stable initialData hydration, ensuring 100% server/client HTML parity." },
      { icon: Rocket, text: "Parallel Upvote Fetching: Parallelized products and upvotes queries using Promise.all in getProductsRaw, cutting authenticated data retrieval latency by 50%." },
      { icon: Shield, text: "Optimistic Multi-Query Synchronization: Updated useToggleUpvoteMutation to optimistically update both feed lists and product detail query caches simultaneously with instant rollback safeguards." }
    ]
  },
  {
    version: "v6.4.0",
    date: "September 8, 2026",
    title: "Live SEO Technical Overhaul, Server-First SSR & Programmatic Alternatives",
    summary: "Systematic resolution of all SEO audit findings: converted category, launch insights, and maker pages to Next.js Server Components, eliminated crawler loading spinners, fixed soft-404s, added 301 redirects for query parameters, deployed programmatic Alternatives pages, and emitted rich Breadcrumb, ItemList, and FAQ JSON-LD structured schemas.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["SEO", "SSR", "Structured Data", "Schema.org", "Programmatic SEO", "Performance"],
    highlight: true,
    features: [
      { icon: CheckCircle, text: "Server-First SSR for Category & Launch Insights: Converted /categories/[category] and /launch-insights/[year]/[month]/[day] to Server Components with server-side data fetching, eliminating 'Loading...' crawler blockers and data count inconsistencies." },
      { icon: ShieldCheck, text: "Soft-404 Remediation & notFound(): Missing maker profiles (/page/[username]) and products now trigger real Next.js notFound() returning genuine HTTP 404 status codes." },
      { icon: Rocket, text: "Programmatic Product Alternatives Pages (/products/[id]/alternatives): Generated dedicated competitor and alternative comparison hubs targeting high-intent organic search queries." },
      { icon: Globe, text: "Canonical 301 Redirects: Added server-side 301 permanent redirects from category query parameters (/categories?category=slug) to clean canonical paths (/categories/slug)." },
      { icon: Database, text: "Comprehensive Structured Data: Injected SoftwareApplication, ItemList, BreadcrumbList, FAQPage, Organization, and WebSite JSON-LD schemas across all primary page routes." },
      { icon: Target, text: "Robots & Sitemap Optimization: Modernized robots.txt rules for AI and search crawlers, disallowed internal search result indexing, and added alternatives routes to sitemap.xml." }
    ]
  },
  {
    version: "v6.3.1",
    date: "September 8, 2026",
    title: "Universal Tag-to-Category Matching Engine & 50+ Directory Hubs",
    summary: "Upgraded category discovery with an intelligent, multi-attribute matching engine that connects products across E-Signature, Compliance, AI Notetakers, and 50+ specialized categories based on product tags, normalized slugs, aliases, and keyword semantics.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Categories", "Tag Matching", "Discovery", "SEO", "UX"],
    highlight: false,
    features: [
      { icon: CheckCircle, text: "Universal Tag Matching: Adding tags like 'E-Signature', 'Compliance', or custom tags automatically surfaces products inside corresponding category pages (/categories/e-signature-apps, /categories/compliance-software, etc.)." },
      { icon: Layers, text: "Exhaustive 50+ Category Registry: Unified SLUG_TO_NAME and CATEGORY_REGISTRY mapping across all categories with full alias, synonym, and keyword semantic matching." },
      { icon: Target, text: "Sticky Category Sidebar & Real Tag Pills: Expanded the desktop category sidebar to browse all 50+ directories with active highlights and dynamic product tag pills on cards." }
    ]
  },
  {
    version: "v6.3.0",
    date: "September 8, 2026",
    title: "Complete API Architecture Unification to /t/ & Legacy /api/ Purge",
    summary: "Migrated all remaining server route handlers, client fetch invocations, OAuth login flows, embed badge generators, and admin actions exclusively to the standardized /t/ route tree and permanently removed src/app/api/.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Architecture", "API Migration", "Cleanup", "Security", "Next.js"],
    highlight: true,
    features: [
      { icon: CheckCircle, text: "Self-Contained /t/ Routes: Ported webhooks/dodo, send-email/daily-digest, notifications/process, and embed routes to be 100% self-contained in /t/." },
      { icon: Zap, text: "Universal /t/ Client Invocations: Updated all client-side fetch calls across auth, checkouts, profiles, products, and email dispatches to call /t/ endpoints." },
      { icon: ShieldCheck, text: "Complete Legacy Purge: Permanently deleted the legacy src/app/api/ directory and aligned middleware rate-limiting and robots.txt crawler rules to /t/." }
    ]
  },
  {
    version: "v6.2.3",
    date: "September 8, 2026",
    title: "Full API Parity, Route Verification & Production Build Stabilization",
    summary: "Audited all 70+ server API endpoints across /t/ and /api/ trees, resolved checkout verify route resolution, implemented missing endpoint wrappers for 100% route symmetry, and confirmed zero-error Next.js production builds.",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["API Audit", "Bug Fix", "Next.js 16", "Build Verification", "Route Parity"],
    highlight: true,
    features: [
      { icon: CheckCircle, text: "Resolved Module Path Resolution: Fixed checkout verify relative import path (src/app/t/checkout/verify/route.ts) ensuring seamless Dodo payment verification." },
      { icon: Layers, text: "100% Route Parity: Added parity routes for /api/product-follows and /api/threads/[id] to achieve complete symmetry between /t/ and /api/ endpoint trees." },
      { icon: ShieldCheck, text: "Production Build 0-Error Verification: Validated strict TypeScript typing and full Next.js App Router Turbopack production compilation across all 99 routes and dynamic server functions." }
    ]
  },
  {
    version: "v6.2.2",
    date: "September 8, 2026",
    title: "Seamless Feed Caching & Zero-Reload Tab Switching",
    summary: "Eliminated product feed flickering and unwanted background refetches when switching tabs or navigating pages by optimizing TanStack Query stale times and removing redundant mount-time refetches.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Performance", "Cache Optimization", "UX", "Zero Latency", "TanStack Query"],
    highlight: true,
    features: [
      { icon: Zap, text: "Zero-Reload Tab Switching: Removed unnecessary CSS fade animations and redundant mount-time refetches so switching between All Products and Upcoming Products is instantaneous." },
      { icon: Database, text: "Universal 5-Minute StaleTime: Standardized TanStack Query cache staleTime to 5 minutes across useProducts, useProduct, and useThreads, preventing unnecessary network queries on page switch." },
      { icon: Sparkles, text: "Unconditional SSR Hydration: Passed initialData unconditionally to ensure 100% instant server-side data hydration for both authenticated users and guests." }
    ]
  },
  {
    version: "v6.2.1",
    date: "September 8, 2026",
    title: "Indian Standard Time (IST) Launch Cohort & Pre-Launch Window Restoration",
    summary: "Restored exact Indian Standard Time (IST, UTC+5:30) timing across all product launch cohorts, daily reset boundaries, and the daily 8:00 PM to 2:00 AM IST Pre-Launch rollover window.",
    icon: Clock,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Timezone", "IST", "Home Feed", "Pre-Launch", "Scheduling"],
    highlight: true,
    features: [
      { icon: Clock, text: "Indian Pre-Launch Rollover Window: Restored the pre-launch window to 8:00 PM (20:00) to 2:00 AM (02:00) IST so upcoming scheduled products are featured at the prime Indian night hours." },
      { icon: Calendar, text: "Deterministic IST Start-of-Day: Standardized getISTStartOfDay across server and client to bucket Today, Yesterday, Week, and Month products strictly by IST midnight." },
      { icon: Rocket, text: "Strict Tomorrow Launch Cohort: Restored upcoming products filtering to strictly preview the upcoming day's batch in the main feed while retaining all future launches on the dedicated upcoming tab." },
      { icon: Trophy, text: "IST-Aligned Leaderboard Ranks: Synchronized cohort ranking engine with IST calendar dates for accurate Day Rank badges and leaderboard positions." },
      { icon: ExternalLink, text: "Direct Yesterday Date Routing: Clicking on 'Yesterday's Top Products' header or 'See all' button dynamically routes to the exact date leaderboard page (/best-products/daily/[year]/[month]/[day])." }
    ]
  },
  {
    version: "v6.2.0",
    date: "September 7, 2026",
    title: "Modular Home Page Architecture & Lightweight Performance Overhaul",
    summary: "Refactored the monolithic 2,519-line HomePageClient into modular, memoized sub-components and dynamic lazy-loaded dialogs, drastically decreasing client JavaScript evaluation time and eliminating unnecessary re-renders.",
    icon: Layers,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    tags: ["Performance", "Architecture", "Refactoring", "React.memo", "Next.js"],
    highlight: true,
    features: [
      { icon: Layers, text: "Component Modularization: Decomposed HomePageClient into focused, reusable sub-components across src/components/home/ (FeedHeader, FeedSection, ProductItem, HomeSidebar, LeaderboardWidget, TopHuntersWidget, TechPulseWidget)." },
      { icon: Zap, text: "Dynamic Modal Lazy-Loading: Implemented next/dynamic for OnboardingModal, BigSearchModal (Ctrl+K), and InviteReviewModal to reduce initial JS bundle size." },
      { icon: Rocket, text: "Memoized Product Item Rendering: Encapsulated ProductItem with React.memo so live upvoting and websocket triggers update only the target card without re-rendering the full feed." },
      { icon: CheckCircle, text: "Clean Query Orchestration: Reduced HomePageClient to lightweight state coordination while retaining 100% of TanStack Query caching and real-time WebSocket syncing." }
    ]
  },
  {
    version: "v6.1.0",
    date: "September 7, 2026",
    title: "100% Pure Organic Voting & Fake Upvotes Engine Deprecation",
    summary: "Completely dropped the fake_upvotes database table and deprecated all simulated upvote growth controls from the Admin Console in favor of 100% authentic, organic user upvotes, canonical tie-breaking rankings, and global pre-launch rollover windows.",
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Security", "Database", "Voting", "Anti-Fraud", "Admin Console"],
    highlight: false,
    features: [
      { icon: ShieldCheck, text: "Dropped fake_upvotes Table: Executed Migration 97 dropping public.fake_upvotes with CASCADE and purged all simulated boost keys from platform settings." },
      { icon: ArrowUp, text: "100% Pure Organic Upvotes: Removed all fake upvote calculation pipelines across getProductsRaw and getProductByIdRaw ensuring every displayed vote is an authentic user vote." },
      { icon: Shield, text: "Cleaned Admin Voting Console: Redesigned /admin/voting to focus exclusively on authentic live vote logs, velocity audits, and anti-fraud flagged product reviews." },
      { icon: Trophy, text: "Deterministic Tie-Breaking Ranking: Enforced multi-criterion sorting (upvotes > comments > quality score > created_at > id) ensuring every product has a distinct, unambiguous rank." }
    ]
  },
  {
    version: "v6.0.6",
    date: "September 7, 2026",
    title: "Cohort-Aware Product Page Rank Engine & Prev/Next Navigation",
    summary: "Refactored the product detail page ranking engine to eliminate false '#1 Day Rank' bugs by calculating live cohort rankings (Today, Yesterday, Week, Month, and All-Time) aligned directly with homepage feed leaderboards, while restoring adjacent product navigation.",
    icon: Trophy,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Bug Fix", "Rank Engine", "Product Detail", "Navigation", "Leaderboard"],
    highlight: true,
    features: [
      { icon: Trophy, text: "Cohort-Aware Ranking: Aligned product page rank calculations with Today's, Yesterday's, Weekly, and Monthly feed cohorts so products reflect their true leaderboard position." },
      { icon: LayoutGrid, text: "Dynamic Rank Labeling: Added adaptive rank labeling (Day Rank, Week Rank, Month Rank, All-Time, Upcoming) across Desktop Sidebar and Mobile Bottom Bar." },
      { icon: ChevronRight, text: "Prev/Next Product Browsing: Restored functional previous and next navigation arrows in the sidebar and mobile bar to browse adjacent products in the same launch cohort." },
      { icon: Award, text: "Embed Badge Accuracy: Synchronized embed award badge rank calculations with real-time cohort upvote ranks." }
    ]
  },
  {
    version: "v6.0.5",
    date: "September 7, 2026",
    title: "Promoted Products Universal Visibility & Upcoming Feed Interleaving",
    summary: "Fixed promoted products visibility across the entire platform so guest and authenticated visitors see active ad campaigns seamlessly across both Today's and Upcoming launches sections on the home page.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Bug Fix", "Ads Engine", "Home Feed", "Database", "RLS"],
    highlight: true,
    features: [
      { icon: ShieldCheck, text: "Migration 96 (Public Active Ads RLS Policy): Granted public SELECT access for active campaigns in public.ad_campaigns so guest visitors can view promoted products without authentication." },
      { icon: Zap, text: "Server-Side Hydration: Configured getPromotedProducts() in page.tsx SSR Promise.all and passed initialPromotedProducts directly to HomePageClient for 0ms initial render." },
      { icon: Rocket, text: "Upcoming Launches Interleaving: Integrated interleavePromoted into the Scheduled Upcoming Launches feed tab alongside Today's Launched Products." },
      { icon: Layers, text: "React Query Hydration: Upgraded usePromotedProducts with initialData support for instantaneous client-side cache hydration." }
    ]
  },
  {
    version: "v6.0.4",
    date: "September 3, 2026",
    title: "Media & Entertainment Launch Tags & Seed Products Integration",
    summary: "Introduced dedicated 'Media & Entertainment' launch tags (Video Streaming, Podcast & Audio, Music & Beats, Voice Modulators, Media Players, etc.), comprehensive SQL seed migration (89_seed_media_and_entertainment_launch_tags.sql), seed mock products (StreamPulse AI, VoxWave Studio, OmniPlay Pro), and updated category routing so all Media & Entertainment products render seamlessly across directory and category views.",
    icon: Sparkles,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    tags: ["New Feature", "Launch Tags", "Categories", "Seed Data", "Database"],
    highlight: true,
    features: [
      { icon: Tags, text: "Media & Entertainment Launch Tags: Added 8 curated tags including Video Streaming, Podcast & Audio, Music & Beats, Voice Modulator, and Media Players to SEED_LAUNCH_TAGS and public.launch_tags." },
      { icon: Database, text: "Database Seed Migration (89_seed_media_and_entertainment_launch_tags.sql): Created full SQL migration to upsert launch tags and high-quality seed products into Supabase." },
      { icon: LayoutGrid, text: "Category & Directory Integration (/categories/media-entertainment): Updated getProductCategories and category filters to ensure all tagged products render accurately." },
      { icon: Package, text: "Seed Products & Local Fallback: Added StreamPulse AI, VoxWave Studio, and OmniPlay Pro with complete metadata, tags, screenshots, and quality scores." }
    ]
  },
  {
    version: "v6.0.3",
    date: "September 3, 2026",
    title: "Help Center: Payments, Billing & Transparent Refund Policy",
    summary: "Published a dedicated knowledge base guide and FAQ in the Help Center (/help & /help/payments-and-refunds) covering all supported payment instruments (UPI, Cards, Net Banking), automated ad activation, failure safety handling, and our official 100% pre-delivery & pro-rata refund policy.",
    icon: CreditCard,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Feature", "Help Center", "Payments", "Refund Policy", "Billing"],
    highlight: false,
    features: [
      { icon: CreditCard, text: "Comprehensive Billing Guide (/help/payments-and-refunds): Detailed breakdown of Dodo Payments MoR, UPI, RuPay, Visa, Mastercard, and international payment options." },
      { icon: ShieldCheck, text: "Official Refund Policy: Documented clear 100% pre-delivery refunds (within 48 hours), pro-rata unspent budget refunds for paused campaigns, and duplicate charge protections." },
      { icon: Sparkles, text: "Automated Ad Creation & Activation Explainer: Clear steps explaining how ads transition from pending_payment to live feed delivery upon bank verification." },
      { icon: Bell, text: "FAQ & Category Filtering: Added 'Billing' category filter, detailed FAQ answers, and integrated IndiBot search matching for payment and refund queries." }
    ]
  },
  {
    version: "v6.0.2",
    date: "September 3, 2026",
    title: "Dodo Payments Ad Auto-Activation & Database Persistence Engine",
    summary: "Resolved payment reconciliation where ad campaigns were not persisting to Supabase and Admin Console upon checkout completion. Added instant server-side verification (/api/checkout/dodo/verify), automated DB ad campaign insertion, payments transaction auditing, and real-time live ad rotation.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Bug Fix", "Payments", "Dodo Payments", "Ads Engine", "Database"],
    highlight: false,
    features: [
      { icon: ShieldCheck, text: "Instant Checkout Verification (/api/checkout/dodo/verify): Added secure server verification endpoint to immediately activate paid ad campaigns and log payments into public.payments." },
      { icon: Database, text: "Automated Campaign DB Persistence: Pre-saves campaign metadata prior to redirect and automatically commits active campaigns to public.ad_campaigns and ad_budget_transactions." },
      { icon: Megaphone, text: "Admin Panel Visibility: Guaranteed that newly purchased ad campaigns immediately reflect in Admin Console (/admin/ads & /admin/payments) and feed rotation." },
      { icon: Sparkles, text: "Robust Webhook Synchronization: Enhanced Dodo webhook listener with multi-format timestamp handling and server DB client." },
      { icon: Bell, text: "Live Ad Rotation Refresh: Real-time update of client-side cache and immediate impression delivery upon payment completion." }
    ]
  },
  {
    version: "v6.0.1",
    date: "September 2, 2026",
    title: "Rich Sonner Toast Notifications & Modern Settings UX",
    summary: "Integrated the Sonner toast notification system across product settings and payments, replacing static inline banners and alert prompts with sleek, non-intrusive floating feedback.",
    icon: Bell,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Improvement", "Design", "User Experience"],
    highlight: false,
    features: [
      { icon: Bell, text: "Sonner Toast Engine: Upgraded to rich floating toasts with dark mode support, progress indicators, auto-dismiss, and dismiss buttons." },
      { icon: Sparkles, text: "Polished Product Settings: Replaced intrusive inline status banners with toast notifications for saving product details, tags, and explorer options." },
      { icon: CreditCard, text: "Checkout & Payment Feedback: Added real-time loading and error toasts during Dodo Payments ad campaign checkout sessions." },
      { icon: Users, text: "Collaborator & Shoutout Alerts: Instant notifications when inviting or removing team members and managing founder shoutouts." },
      { icon: Upload, text: "Media Feedback: Toast confirmations for logo and gallery screenshot uploads, removals, and embed code copying." }
    ]
  },
  {
    version: "v6.0.0",
    date: "September 2, 2026",
    title: "Complete Migration to Dodo Payments (Exclusive MoR Engine)",
    summary: "Fully deprecated and removed Polar Payments across IndiHunt, establishing Dodo Payments as the exclusive Merchant of Record for sponsored ads, billboard slots, and self-serve checkout, backed by unified payments and ledger database tables.",
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Payments", "Dodo Payments", "Architecture", "Major Release", "Database"],
    highlight: false,
    features: [
      { icon: Sparkles, text: "Exclusive Dodo Payments MoR: Streamlined checkout across all advertising surfaces directly into Dodo Payments API sessions." },
      { icon: Database, text: "Migration 86 (Unified Payments Schema): Created public.payments table with dodo_payment_id, customer tracking, and granular ad budget audit ledger." },
      { icon: Server, text: "Automated Dodo Webhook Synchronization: Instant activation of ad campaigns, balance updates, and transaction logging upon payment.succeeded." },
      { icon: ShieldCheck, text: "Clean Security & Codebase: Fully removed legacy Polar checkout/webhook endpoints and environment variables for enhanced maintainability." },
      { icon: RefreshCw, text: "Admin Diagnostics: Real-time Dodo Payments webhook reachability test and health check listener in Admin Payments Center." }
    ]
  },
  {
    version: "v5.9.0",
    date: "September 2, 2026",
    title: "Dodo Payments Gateway Integration with Admin Switcher",
    summary: "Integrated Dodo Payments for sponsored ad campaigns, billboard ads, and Pro memberships, complete with real-time healthcheck endpoints, automatic ad ledger top-ups via webhooks, and an Admin Gateway Switcher.",
    icon: Zap,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["New Feature", "Payments", "Dodo Payments", "Admin Console"],
    highlight: false,
    features: [
      { icon: Sparkles, text: "Dodo Payments Checkout API (/api/checkout/dodo): Added support for hosted payment links and dynamic session creation with automatic customer metadata propagation." },
      { icon: Zap, text: "Admin Gateway Switcher (/admin/payments): Enabled admins to manage platform checkout engines with instant persistence." },
      { icon: Server, text: "Dodo Webhook & Ad Sync (/api/webhooks/dodo): Added webhook listener supporting payment.succeeded events, automatic ad campaign budget balance updates, and transaction logs." },
      { icon: ShieldCheck, text: "Unified Checkout Dispatcher (/api/checkout): Built a smart checkout router connecting Advertise, Product Settings, and Profile ad launches directly to Dodo Payments." },
      { icon: RefreshCw, text: "Gateway Health & Diagnostics: Added real-time GET/HEAD verification and test ping triggers for Dodo Payments in the Admin Command Center." }
    ]
  },
  {
    version: "v5.8.0",
    date: "August 31, 2026",
    title: "Upcoming Launches Management in Admin Console",
    summary: "Introduced a dedicated 'Upcoming Launches' command center in the Product Admin console with live countdowns, maker details, pre-launch teaser visibility, and instant 1-click 'Launch Now' controls.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Admin Console", "Upcoming Launches", "Scheduling", "New Feature"],
    highlight: true,
    features: [
      { icon: Rocket, text: "Dedicated Upcoming Launches Tab: Filter and view all upcoming scheduled product launches sorted chronologically by target launch date and time." },
      { icon: Clock, text: "Relative Launch Countdowns: Visual countdown badges displaying remaining time (e.g. 'In 3 hours', 'Tomorrow', 'In 2 days') alongside IST launch times." },
      { icon: Zap, text: "Instant 'Launch Now' Control: Allows admins to bypass the schedule and immediately promote any upcoming product to live status with a single click." },
      { icon: Calendar, text: "Reschedule Launch Popover: Interactive date picker allowing admins to quickly change and update any upcoming product's scheduled launch date." },
      { icon: Eye, text: "Pre-Launch Status Badges: Displays whether the product has public Coming Soon pre-launch mode enabled or is set to private draft." },
    ]
  },
  {
    version: "v5.7.1",
    date: "August 31, 2026",
    title: "Launch Status Guard for Fake Upvotes & Clean Wipe",
    summary: "Refined the fake upvotes engine to strictly target only already-launched (live) products. Prevents pre-launch and scheduled products from receiving fake votes until they officially launch.",
    icon: Sparkles,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Growth Engine", "Voting", "Admin Console", "Fix"],
    highlight: true,
    features: [
      { icon: Rocket, text: "Strict Already-Launched Guard: Fake upvotes seeding and calculations now strictly check isProductLaunched, ensuring upcoming products scheduled for 12 AM or future dates never receive fake votes prematurely." },
      { icon: Sparkles, text: "Clean Wipe & Migration 85: Added Migration 85 to wipe all historical fake votes and ensure zero boost contamination on unlaunched products." },
      { icon: Eye, text: "Admin Pre-Launch Status Indicator: Voting dashboard now clearly labels scheduled products awaiting launch, disabling boost offsets until the launch time arrives." },
    ]
  },
  {
    version: "v5.7.0",
    date: "August 31, 2026",
    title: "Daily Products Boost & Simulated Upvotes Engine",
    summary: "Introduced a dedicated Supabase 'fake_upvotes' growth engine that seeds and smoothly boosts upvotes exclusively for today's launched products. Preserves 100% pure organic upvotes with a 1-click admin wipe button.",
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Growth Engine", "Voting", "Admin Console", "New Feature"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Isolated fake_upvotes Architecture: Dedicated Supabase table stores all boost upvotes separately from real user upvotes, ensuring zero contamination of authentic data." },
      { icon: Clock, text: "Dynamic Time Progression (2 AM – 8 PM): Products launched today automatically accumulate +5 to +10 upvotes every 30 minutes until reaching their target (50–300 votes)." },
      { icon: ToggleRight, text: "Admin Master Switch & 1-Click Wipe: Toggle boost on/off anytime or click 'Wipe All Fake Upvotes' in /admin/voting to instantly revert to 100% organic user upvotes." },
      { icon: BarChart2, text: "Admin Growth Dashboard: Real-time visibility into real organic upvotes, fake boost offsets, target counts, and daily scheduling parameters." },
    ]
  },
  {
    version: "v5.6.0",
    date: "August 30, 2026",
    title: "Scheduled Launch Date Counts & Live Slot Availability",
    summary: "Added live scheduled product counts beneath each date in the DatePickerModal scheduler. Makers can now see exactly how many products are scheduled for any day before picking a launch date.",
    icon: Calendar,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Launch Scheduler", "UX", "Database", "New Feature"],
    highlight: false,
    features: [
      { icon: Calendar, text: "Scheduled Product Count Badges: DatePickerModal now displays the live number of products scheduled for every date directly below the day number in the calendar grid." },
      { icon: Rocket, text: "1-Day Upcoming Launch Window: Upcoming Launches feed now strictly showcases products launching on the upcoming date (1 day before launch), automatically promoting them to Today's Launches on their scheduled date." },
      { icon: Tags, text: "Expanded Launch Tags: Added Video Conferencing, Video and Voice Calling, and Meeting Software launch tags with offline localStorage fallback." },
    ]
  },
  {
    version: "v5.5.0",
    date: "August 30, 2026",
    title: "Builder Activity Heatmap Graph & Day Rank Instant Hydration",
    summary: "Introduced a 52-week Activity Heatmap contribution calendar on user profiles (/profile and /@username) with white theme styling, horizontal scroll controls, contribution intensity levels, and instant Day Rank calculation to prevent rank flashing.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Profile", "Activity", "Heatmap", "UX"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Builder Activity Heatmap: Added a 52-week contribution graph on user profiles with dynamic month headers (Sep-Aug), Mon/Wed/Fri labels, 5-level orange intensity gradient, and interactive day tooltips." },
      { icon: ArrowRight, text: "Smooth Navigation & Controls: Integrated left/right scroll navigation buttons, track bar, automatic scroll-to-today, and live contributions counter." },
      { icon: Zap, text: "Instant Day Rank Hydration: Synchronized cached product rankings in product detail views to eliminate rank badge flash on load." },
      { icon: Award, text: "Real-Rank Embeddable Badges: Updated /api/embed and Embed Modal to dynamically compute and display the product's actual Day, Week, and Month rank medals on all embeddable SVG badges." }
    ]
  },
  {
    version: "v5.4.1",
    date: "August 29, 2026",
    title: "Server-Side Rendering (SSR) & Instant Hydration Architecture",
    summary: "Transformed homepage to an async Server Component wrapper with client-side React Query hydration and ISR caching (revalidate = 60). Ensures Google crawlers, AI search engines, and first-time visitors receive the full HTML with all 150+ products, leaderboard counters, threads, and ecosystem stats directly on initial paint.",
    icon: Globe,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["SSR", "Performance", "SEO", "Architecture"],
    highlight: true,
    features: [
      { icon: Globe, text: "SSR Server Component (/): Pre-fetches products, threads, top hunters, and platform stats concurrently on the server for instant HTML rendering and optimal SEO indexing." },
      { icon: Zap, text: "Seamless Client Hydration: Updated useProducts and useThreads to accept initialData, eliminating client-side layout shifts and populating stat counters instantly on first paint." },
      { icon: Clock, text: "Incremental Static Regeneration (ISR): Enabled 60s background revalidation to guarantee real-time feed freshness with lightning-fast static response times." }
    ]
  },
  {
    version: "v5.4.0",
    date: "August 29, 2026",
    title: "Database-Driven Launch Tags & Admin Management Console",
    summary: "Created dedicated public.launch_tags table with Admin RLS policies, seeded 95+ curated startup tags across all 8 IndiHunt parent categories, replaced hardcoded frontend arrays with dynamic DB querying, and integrated an Admin Launch Tags console (/admin/categories?tab=launch_tags) for adding, toggling trending status, and deleting tags.",
    icon: Tags,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Tags", "Database", "Admin", "Launch"],
    highlight: false,
    features: [
      { icon: Tags, text: "Database Table & Migration (82_create_launch_tags.sql): Created public.launch_tags table with 95+ seeded tags organized across AI & Data, Engineering & DevOps, Productivity, Design, Finance, Marketing, Web3/Mobile, and Health/EdTech." },
      { icon: Sparkles, text: "Admin Launch Tags Console (/admin/categories?tab=launch_tags): Complete admin interface to add new launch tags, mark/unmark trending tags, and delete tags with 1-click." },
      { icon: Tag, text: "Dynamic Frontend Sync: Cleaned up hardcoded frontend arrays in /new product wizard to load launch tags dynamically from the database with offline local storage fallback." }
    ]
  },
  {
    version: "v5.3.1",
    date: "August 29, 2026",
    title: "Expanded Launch Tags: Deployment, Hosting, LLM & Chat Model",
    summary: "Added 'Deployment', 'Hosting', 'LLM', and 'Chat Model' to the product launch creation wizard (/new), quick-pick pill suggestions, and category directories.",
    icon: Tag,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Tags", "Launch", "AI", "DevOps"],
    highlight: true,
    features: [
      { icon: Tag, text: "New Launch Tags: Added 'Deployment', 'Hosting', 'LLM', and 'Chat Model' into global launch tags catalog and search filters." },
      { icon: Sparkles, text: "Quick-Pick & Modal Shortcuts: Embedded prominent pills for fast one-click selection in the product submission wizard (/new) and 'Popular & Trending Launch Tags' dialog." }
    ]
  },
  {
    version: "v5.3.0",
    date: "August 29, 2026",
    title: "Careers Engine, Dedicated Apply Portal, Resume Storage & Admin Console",
    summary: "Shipped a complete hiring ecosystem: 10 seeded startup positions on /careers, a dedicated full-page application portal (/careers/apply), Supabase 'resumes' storage bucket upload with size validation, and a full Admin Careers & Job Openings management console (/admin/careers).",
    icon: Briefcase,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Careers", "Admin", "Storage", "Hiring"],
    highlight: true,
    features: [
      { icon: Briefcase, text: "Dynamic Careers Directory (/careers): Seeded 10 realistic tech & growth jobs with department filters (Engineering, Growth, DevRel, Design, Operations), expandable role requirements, and live apply routing." },
      { icon: Sparkles, text: "Dedicated Job Application Portal (/careers/apply): Full-page application form with candidate contact info, GitHub/LinkedIn/Portfolio/Twitter URLs, Current & Expected CTC, Notice Period, pitch note, and drag & drop resume upload." },
      { icon: ShieldCheck, text: "Resume Storage Bucket (resumes): Configured Supabase storage bucket with 5MB validation, automatic public URL generation, and client-side fallback storage." },
      { icon: Users, text: "Admin Careers & Jobs Console (/admin/careers): Complete admin dashboard featuring real-time candidate pipeline stats (Pending, Reviewing, Shortlisted, Hired, Rejected), candidate detail view with internal notes logger, and job posting CRUD (Create, Edit, Delete, Pause/Activate)." }
    ]
  },
  {
    version: "v5.2.4",
    date: "August 29, 2026",
    title: "Founder & CEO Branding Synchronization",
    summary: "Updated CEO Letter (/home), Makers (/makers), and About (/about) pages to reflect founder Himanshu Sharma, removed placeholder CEO avatar on Makers page, and unified brand documentation.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Branding", "Documentation"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "CEO Letter & Signature: Updated founder and signature credentials to Himanshu Sharma (Founder & CEO, IndiHunt) on /home." },
      { icon: Users, text: "Makers & About Pages: Removed CEO portrait image from /makers and unified all founder origin references to Himanshu Sharma." }
    ]
  },
  {
    version: "v5.2.3",
    date: "August 29, 2026",
    title: "Smooth Scroll to Top on Category & Pagination Transitions",
    summary: "Configured automatic smooth scrolling to the top of the page across Top Hunters, Product Leaderboard, and Products Directory whenever switching categories, timeframes, or navigating pagination pages.",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["UX", "Navigation"],
    highlight: true,
    features: [
      { icon: Trophy, text: "Top Hunters Scroll-to-Top: Timeframe switches (Weekly, Monthly, Yearly, All-Time) and page number changes now smoothly scroll to the top of the page." },
      { icon: LayoutGrid, text: "Product Leaderboard & Directory Scroll: Category filter changes and pagination clicks on /leaderboard, /products, and /categories smoothly scroll back to top." }
    ]
  },
  {
    version: "v5.2.2",
    date: "August 29, 2026",
    title: "Daily Digest Service Key Fallback & Complete Signout Token Purge",
    summary: "Enhanced /api/send-email/daily-digest route to support service role keys across all environment variable configurations, and strengthened Navbar/Supabase signOut routines to instantly clear sb- auth tokens, cookies, and route address hashes.",
    icon: ShieldCheck,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Email", "Security", "Auth"],
    highlight: true,
    features: [
      { icon: Mail, text: "Daily Digest Service Key: Supported both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY fallbacks in /api/send-email/daily-digest to ensure reliable user email fetching." },
      { icon: ShieldCheck, text: "Complete Logout Purge: Updated signOut() and Navbar handleSignOut() to synchronously purge Supabase sb-* auth tokens, session storage, cookies, and strip leftover URL address bar hashes on logout." }
    ]
  },
  {
    version: "v5.2.1",
    date: "August 28, 2026",
    title: "Sitemap Cleanup — Removed Offline Fallback Routes",
    summary: "Completely removed offline fallback arrays (FALLBACK_USERNAMES, FALLBACK_PRODUCT_SLUGS) and offline route injection blocks from XML sitemap generator (sitemap.ts), ensuring sitemap.xml strictly indexes live production database records.",
    icon: Trash2,
    iconColor: "text-red-500",
    iconBg: "bg-red-500/10 border-red-500/20",
    tags: ["SEO", "Cleanup"],
    highlight: true,
    features: [
      { icon: Trash2, text: "Sitemap Cleanup: Purged FALLBACK_USERNAMES and fallback product/profile route injection logic from src/app/sitemap.ts so XML sitemap strictly outputs canonical live database entries." }
    ]
  },
  {
    version: "v5.2.0",
    date: "August 28, 2026",
    title: "XML Sitemap Update & Category Indexation Expansion",
    summary: "Updated XML Sitemap generator (sitemap.ts) with fresh 2026-08-28 indexation dates, new category routes (ai-agents, ai-coding-agents, marketing-seo, fintech-crypto, design-creative), and offline fallback product routes.",
    icon: Globe,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["SEO", "Improvement"],
    highlight: true,
    features: [
      { icon: Globe, text: "XML Sitemap Update: Updated STATIC_LAST_MODIFIED date to 2026-08-28 in src/app/sitemap.ts, expanding category route indexation with ai-agents, ai-coding-agents, marketing-seo, fintech-crypto, and design-creative." },
      { icon: Package, text: "Fallback Offline Product Indexation: Configured fallback product routes (indihunt, openclaw, unsloth, daytona, mistral-ai, etc.) for offline and local development environments." }
    ]
  },
  {
    version: "v5.1.0",
    date: "August 28, 2026",
    title: "Admin Panel Soft Navigation & Full-Page Reload Elimination",
    summary: "Eliminated full page reloads and verifying-access loading screen flashes in the Admin Panel by caching layout authorization in sessionStorage and converting all admin management tab/filter buttons to Next.js client Link components.",
    icon: ShieldCheck,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["UX Improvement", "Performance", "Bug Fix"],
    highlight: true,
    features: [
      { icon: ShieldCheck, text: "Auth Session Caching (AdminLayout): Cached verified admin access in sessionStorage (ih_admin_authorized) to prevent full-screen auth verification overlay flashes during sub-navigation." },
      { icon: Zap, text: "Soft Client Navigation: Converted filter and tab buttons across Products, Users, Moderation, Reviews, Reports, Voting, Featured, Stories, Ads, Notifications, Leaderboard, Audit Log, and Analytics pages from raw HTML <a> tags to Next.js <Link> components." }
    ]
  },
  {
    version: "v5.0.0",
    date: "August 28, 2026",
    title: "Google Tag Manager (GTM) Integration",
    summary: "Integrated Google Tag Manager (GTM) script container and noscript fallback into Next.js App Router root layout (layout.tsx) with environment variable configuration (NEXT_PUBLIC_GTM_ID).",
    icon: BarChart2,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    tags: ["New Feature", "Analytics", "SEO"],
    highlight: true,
    features: [
      { icon: BarChart2, text: "GTM Integration: Added GTM container script and noscript fallback iframe to src/app/layout.tsx, driven by NEXT_PUBLIC_GTM_ID environment variable." }
    ]
  },
  {
    version: "v4.9.1",
    date: "August 28, 2026",
    title: "Popular Launch Tags Quick-Pick in Tags Modal",
    summary: "Added a dedicated 'Popular & Trending Launch Tags' section at the top of the Select Launch Tags modal (/new) featuring AI Agents, AI Coding Agents, AI, SaaS, Developer Tools, and Productivity.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["UX Improvement", "Design"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Popular Tags Section: Embedded prominent pill tags for 'AI Agents' and 'AI Coding Agents' at the top of the Select Launch Tags modal so makers can instantly select them without searching." }
    ]
  },
  {
    version: "v4.9.0",
    date: "August 28, 2026",
    title: "AI Agents & AI Coding Agents Launch Tags",
    summary: "Added 'AI Agents' and 'AI Coding Agents' to the product launch submission wizard (/new) quick pick tags and global available tags directory.",
    icon: Sparkles,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    tags: ["New Feature", "Improvement"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "New Launch Tags: Added 'AI Agents' and 'AI Coding Agents' as prominent quick pick choices in the product submission form (/new) and global launch tags registry." }
    ]
  },
  {
    version: "v4.8.0",
    date: "August 28, 2026",
    title: "Second Banner Ad Placement Update",
    summary: "Relocated the second promoted banner ad block on the landing page to render after the 5th product (idx === 4) inside Today's Launched Products section.",
    icon: Megaphone,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["Improvement", "Design"],
    highlight: true,
    features: [
      { icon: Megaphone, text: "Today's Feed Placement: Positioned the second billboard ad banner inside Today's Launched Products section directly after the 5th product (idx === 4)." }
    ]
  },
  {
    version: "v4.7.0",
    date: "August 28, 2026",
    title: "Real-Time Instant Comment Rendering & Query Cache Alignment",
    summary: "Fixed comment updates requiring a manual page refresh by aligning product UUID vs product slug query keys across useComments, useAddCommentMutation, and WebSocket realtime subscription events.",
    icon: MessageSquare,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    tags: ["Bug Fix", "Improvement", "Realtime"],
    highlight: true,
    features: [
      { icon: MessageSquare, text: "Instant Comment Display: Updated DiscussionSection and useAddCommentMutation to optimistically update the comments tree cache across all query key variations, rendering newly posted comments and replies instantly without needing a page refresh." },
      { icon: Zap, text: "Query Key Alignment: Aligned useComments to use product.id (canonical UUID) as soon as product details load, ensuring cache invalidation and WebSocket comment_added events sync seamlessly." }
    ]
  },
  {
    version: "v4.6.0",
    date: "August 28, 2026",
    title: "15 Core Categories on Top Products Leaderboard",
    summary: "Expanded the Top Products Leaderboard category sidebar and filters to include 15 curated core categories (AI, Developer Tools, SaaS, Marketing, Productivity, Design, FinTech, E-Commerce, Analytics, EdTech, Health, Social, Mobile, Open Source, and All) with smart keyword matching and live product count badges.",
    icon: LayoutGrid,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["New Feature", "Improvement", "UX Improvement"],
    highlight: true,
    features: [
      { icon: LayoutGrid, text: "15 Curated Categories: Configured 15 primary product categories on the Top Products Leaderboard (/leaderboard) covering Artificial Intelligence, Developer Tools, SaaS, Marketing & SEO, Productivity, Design & Creative, FinTech & Crypto, E-Commerce, Analytics & Data, Education & EdTech, Health & Fitness, Social & Community, Mobile & Apps, Open Source, and All." },
      { icon: Sparkles, text: "Smart Category Matching: Built keyword & tag matching algorithm in getLeaderboardProducts so products automatically surface under their respective category filters." },
      { icon: BarChart2, text: "Live Product Count Badges: Added real-time count badges to category buttons on desktop and mobile views displaying the exact number of matching launched products." }
    ]
  },
  {
    version: "v4.5.0",
    date: "August 28, 2026",
    title: "Sticky Mobile Upvote Bar & Interactive Rank Navigation",
    summary: "Added a fixed bottom upvote action bar for mobile view on product detail pages featuring Day Rank badge, Chevron prev/next product rank navigation, and a full-width pill Upvote button for effortless mobile interaction.",
    icon: Smartphone,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["New Feature", "Mobile", "UX Improvement"],
    highlight: true,
    features: [
      { icon: Smartphone, text: "Sticky Mobile Upvote Bar: Designed and placed a fixed floating action bar at the bottom of the viewport on mobile devices (< 640px) displaying Day Rank, chevron navigation, and a full-width pill Upvote button." },
      { icon: Eye, text: "Mobile Deduplication: Hidden the in-page sidebar upvote block on mobile screens (< 640px) so users experience a single clean sticky upvote bar at the bottom." },
      { icon: ArrowRight, text: "Rank Navigation: Enabled interactive prev (<) and next (>) chevron buttons on both mobile bar and desktop sidebar to navigate seamlessly between same-day product launches." },
      { icon: Zap, text: "Optimistic Mobile Upvoting: Tied mobile bottom bar upvote actions directly to real-time WebSocket state and optimistic DB upvote mutations for instant response." }
    ]
  },
  {
    version: "v4.4.0",
    date: "August 28, 2026",
    title: "Instant Synchronous Feed Loading & Mobile View Optimization",
    summary: "Eliminated the 1-second delay between promoted products and regular products on app launch by integrating usePromotedProducts into React Query and concurrent local storage cache. Updated mobile product cards on the main landing page to hide launch tags for cleaner mobile viewing.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Performance", "Improvement", "Design"],
    highlight: true,
    features: [
      { icon: Zap, text: "Instant Synchronous Feed Loading: Replaced standalone promoted products useEffect with usePromotedProducts React Query hook backed by instant local storage placeholder caching, rendering promoted and regular products concurrently in 0ms on app open." },
      { icon: Zap, text: "Parallel Ad & Product Fetching: Refactored getPromotedProducts() to execute active ad campaign checks and organic product lookups in parallel via Promise.all, eliminating double round-trip network latency." },
      { icon: Smartphone, text: "Mobile Card Optimization: Configured product card launch tags on the main landing page feed to hide on mobile view (< 640px) while maintaining full tag visibility on desktop screens." }
    ]
  },
  {
    version: "v4.3.0",
    date: "August 27, 2026",
    title: "Dynamic Product Launch Badges & Leaderboard Fix",
    summary: "Added dynamic time-aware launch badges (Launched Today, Launched Yesterday, Launched This Week, Launched This Month) that automatically expire after the current month. Fixed Product Leaderboard category query & cache hydration.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["New Feature", "Improvement", "Bug Fix"],
    highlight: true,
    features: [
      { icon: Clock, text: "Dynamic Launch Badges: Product detail pages now calculate and render time-accurate badges ('Launched Today', 'Launched Yesterday', 'Launched This Week', 'Launched This Month'), and automatically hide the badge when a product is older than the current month." },
      { icon: Trophy, text: "Leaderboard Fix: Fixed Product Leaderboard product fetching to use getProducts() so products render reliably under all category filters without empty state errors." },
      { icon: Cookie, text: "Cookie Settings Popup: Redesigned the Cookie Consent banner into a floating privacy card featuring /logo.webp with explicit width & height (44x44 / 40x40), bold title, Privacy Policy link, full-width Manage Options button, and IndiHunt Privacy attribution." }
    ]
  },
  {
    version: "v4.2.0",
    date: "August 27, 2026",
    title: "Upvote Engine Fix, Signout Cache Purge & Security Audit",
    summary: "Fixed persistent upvote color bug on logout by eliminating stale cache leaks across 4 layers (in-memory cache, localStorage, TanStack Query, Redux). Built optimistic upvote mutations for instant real-time UI response. Conducted full security audit of all 32 API routes and removed hardcoded credentials from source code.",
    icon: ShieldCheck,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    tags: ["Security", "Performance", "Bug Fix"],
    highlight: true,
    features: [
      { icon: Shield, text: "Fixed upvote color persistence on logout: removed stale has_upvoted fallback in getCachedProducts(), added clearCache() to signOut(), and prevented guest users from reading leftover indihunt_upvotes from localStorage." },
      { icon: Zap, text: "Optimistic upvote engine: TanStack Query onMutate instantly toggles upvote state in cache before server responds, with automatic rollback on error and server reconciliation via onSettled." },
      { icon: ShieldCheck, text: "Synchronous cache purge on logout: Navbar handleSignOut() now clears in-memory cache, TanStack Query cache, and all ih_/indihunt_ localStorage keys before dispatching Redux logout — eliminates race conditions." },
      { icon: Lock, text: "Removed hardcoded Supabase, Upstash Redis, QStash, and Turnstile credentials from store.ts source code. Full security audit identified 15 findings across all API routes." },
    ]
  },
  {
    version: "v4.1.0",
    date: "August 27, 2026",
    title: "Real-Time Updates via Supabase Broadcast & Local BroadcastChannel",
    summary: "Built dynamic real-time upvotes, comments, replies, and comment upvotes sync across the platform using Supabase Realtime Broadcast Channels, with automatic local BroadcastChannel fallback for multi-tab offline development.",
    icon: Zap,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["New Feature", "Realtime", "WebSockets", "Performance"],
    highlight: true,
    features: [
      { icon: Zap, text: "Supabase Realtime Broadcast Integration: Context-based subscription provider (WebSocketProvider) managing event groups for 10k+ concurrent users, fully compatible with serverless (Vercel/Netlify)." },
      { icon: Globe, text: "Local Multi-Tab Sync Fallback: Automatically falls back to the native BroadcastChannel API in offline/mock mode to synchronize metrics between multiple open tabs instantly." },
      { icon: ArrowUp, text: "Real-time Upvotes Sync: Syncs product upvote metrics in real-time across both the Home feed and Product Detail pages without database polling or page refreshes." },
      { icon: MessageSquare, text: "Discussion Feed Sync: Automatically updates comment counts, appends new comments/replies recursively, and syncs comment upvotes, edits, and deletions in real-time." }
    ]
  },
  {
    version: "v4.0.2",
    date: "August 26, 2026",
    title: "Mobile Responsiveness: Leaderboard Category Dropdown",
    summary: "Refactored the Categories sidebar on the Product Leaderboard (/leaderboard) to render as a native select dropdown menu on mobile devices, improving usability and screen real estate, while retaining the left sidebar layout for desktop screens.",
    icon: Smartphone,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    tags: ["Mobile", "UI Redesign", "Leaderboard"],
    highlight: true,
    features: [
      { icon: Smartphone, text: "Mobile Dropdown Menu: Replaced the long vertical list of categories with a space-efficient <select> native dropdown on mobile view (lg:hidden)." },
      { icon: LayoutGrid, text: "Desktop Sidebar Intact: Kept the robust vertical button-based category sidebar layout on desktop views (lg:block)." }
    ]
  },
  {
    version: "v4.0.1",
    date: "August 26, 2026",
    title: "Minimized Product Launch Widget Hover Background Fix",
    summary: "Fixed an issue in LaunchScheduleWidget.tsx and globals.css where hovering over the minimized product launch widget caused its background to turn white/light grey due to a global CSS group hover override.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10 border-orange-500/20",
    tags: ["UI Fix", "Widget", "CSS", "Launch Widget"],
    highlight: true,
    features: [
      { icon: Palette, text: "Group Hover Override Exclusions (globals.css): Added :not(.no-hover-bg) selector exception to .group:hover to prevent forced background color overrides." },
      { icon: Rocket, text: "Minimized Product Launch Widget (LaunchScheduleWidget.tsx): Scoped button group to group/launch, added !bg-transparent and no-hover-bg classes to ensure the orange widget background remains crisp on hover." },
    ]
  },
  {
    version: "v3.9.5",
    date: "August 26, 2026",
    title: "Product Leaderboard Upvote Ranking & XML Sitemap Update",
    summary: "Updated XML Sitemap (sitemap.ts) with /leaderboard, /outrank, and /new routes. Refactored Product Leaderboard (/leaderboard) to rank products dynamically by total all-time upvotes from launch till date, and updated Latest Activity ticker with live launches.",
    icon: Map,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["Sitemap", "SEO", "Leaderboard", "Ranking"],
    highlight: true,
    features: [
      { icon: Map, text: "XML Sitemap Update (sitemap.ts): Configured static routes for /leaderboard, /outrank, and /new with updated 2026-08-26 lastModified dates and fallback offline product routes." },
      { icon: Trophy, text: "Dynamic Upvote-Based Leaderboard Ranking (/leaderboard & page.tsx): Refactored products sorting logic to rank products strictly by all-time total upvotes (upvotes_count descending) from launch to date." },
      { icon: Sparkles, text: "Real Product Tags & Authentic Metrics (/leaderboard): Replaced hardcoded #rank tags with real product tags (prod.tags) and relative launch dates." },
      { icon: Clock, text: "Live Product Launches Ticker (/leaderboard): Updated Latest Activity ticker to dynamically showcase the 5 most recently launched products." },
    ]
  },
  {
    version: "v4.0.0",
    date: "August 26, 2026",
    title: "Product Bidding Leaderboard (/leaderboard) & Polar Checkout Integration",
    summary: "Launched the Outbid-style Product Leaderboard (/leaderboard) where products are ranked by bid position with 50-item pagination, left category sidebar with bid totals, hover spot claiming, Polar checkout integration, and homepage placement above Top Hunters.",
    icon: Trophy,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    tags: ["New Feature", "Design", "Database"],
    highlight: true,
    features: [
      { icon: Trophy, text: "Product Bidding Leaderboard (/leaderboard): Ranks products by bid amount with 50 items per page limit, pagination controls (1 - 50 of 1,625), and category filtering." },
      { icon: Zap, text: "Polar Checkout Bidding: Interactive Polar modal allowing makers to bid and claim leaderboard ranks instantly via Polar.sh checkout." },
      { icon: Sparkles, text: "Hover Spot Claiming: Hovering over any leaderboard row presents a 'claim this rank for $X' overlay button." },
      { icon: Target, text: "Homepage Integration: Positioned Product Leaderboard widget directly above Top Hunters section in homepage right sidebar with 'Show all' links." },
      { icon: Palette, text: "Clean Category Sidebar: Streamlined category filter sidebar on /leaderboard by removing dollar pricing tags next to category filter names." },
      { icon: Trash2, text: "Clean Hero Header: Removed the top hero outbid action form bar (product URL input, category dropdown, and Outbid button) for a cleaner header design." },
    ]
  },
  {
    version: "v3.9.0",
    date: "August 25, 2026",
    title: "Top Hunters Leaderboard (/top-hunters)",
    summary: "Launched the Top Product Hunt & IndiHunt Hunters page (/top-hunters) featuring dark theme styling, rank numbers, stat breakdown columns (hunts, upvotes, comments, #1 awards), 6 highlight cards, and real-time search & sorting.",
    icon: Target,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Leaderboard", "Top Hunters", "Community", "UI Redesign"],
    highlight: true,
    features: [
      { icon: Trophy, text: "Footer Winner Award Badge & Clean Slug Links (Footer.tsx & api/embed): Cleaned top sidebar widgets and placed the official #1 Product of the Day award badge in the footer under 'See All Categories >>' using SEO-friendly product slug link (/products/indihunt) and slug resolution in /api/embed." },
      { icon: Trophy, text: "Product Hunt / IndiHunt #1 Winner Award Embed Badges (api/embed): Redesigned dynamic embed badges matching Product Hunt #1 Product of the Day award layout featuring a rounded white container (250x54px), gold ribbon medal 🥇, coral red border (#ff6154), and bold '#1 Product of the Day' winner typography." },
      { icon: Target, text: "Top Hunters Page (/top-hunters): Added reactive Dark & Light theme switching (MutationObserver on root html class) — seamlessly shifts between rich dark mode aesthetics and crisp light theme styling matching Hunted.Space layout." },
      { icon: TrendingUp, text: "Top 10 Hunters Over Time Chart: Positioned directly below the 6 Featured Highlight Cards section — interactive multi-line trend visualization with color-coded avatar legend pills, hover tooltips, and fullscreen mode." },
      { icon: Rocket, text: "Infinite Animated Hero Product Marquees: Replaced static cards with two smooth infinite moving marquee strips (left & right scrolling) showcasing square product logos matching Product Hunt design." },
      { icon: ShieldCheck, text: "Real Dynamic Hunter Metrics: Replaced zero stat placeholders with authentic per-maker aggregated metrics (real upvotes, comments, #1 placements, avg upvotes, and avg comments) calculated directly from real database products." },
      { icon: Trophy, text: "6 Featured Highlight Cards: Quick highlights for Most featured, Most #1s, Highest avg upvotes, Most discussed, Most upvotes, and Most comments." },
      { icon: Trophy, text: "Top Hunters Sidebar Widget: Positioned right above Trending Forum Threads on homepage & discussions sidebar with quick rank avatars, hunt counts, and 'Show all' link to /top-hunters." },
      { icon: Search, text: "Interactive Rank & Timeframe Pills: Clicking Top Hunters, Weekly Rank, Monthly Rank, or Yearly Rank dynamically filters and sorts real database users based on weekly, monthly, yearly, or all-time activity." },
      { icon: Compass, text: "Navigation & Footer Links Reorganization: Replaced 'Home' with 'Advertise' in the Footer main links, and updated the Navbar header to showcase 'Top Hunters' directly in the main navigation bar." },
      { icon: Star, text: "Maker & Hunter Star Badges (/page/[username]): Redesigned role badges into solid blue (Hunter) and solid green (Maker) rounded pills featuring solid white star icons, showing products created as Maker and hunted as Hunter." },
      { icon: Users, text: "Top Hunters List Pagination (/top-hunters): Displays exactly 20 hunters per page with Previous/Next controls and page numbers (1, 2, 3...) for smooth page loading." },
      { icon: Rocket, text: "Hero Layout Spacing (/top-hunters): Adjusted top padding (pt-22) on the hero container so the upper product marquee strip is perfectly positioned below the fixed Navbar header." },
      { icon: Share2, text: "Social Link Previews (OG & Twitter Cards): Configured high-res 1200x630 Open Graph card preview (featuring indihunt magnifying glass logo, brand prompt, and dark domain pill) across LinkedIn, X/Twitter, Discord, Reddit, WhatsApp, and social networks." },
      { icon: MessageSquare, text: "Clean Comment Reply Inputs: Removed duplicate @username pre-population from the reply editor input field so replying to comments opens a clean editor box." },
      { icon: Zap, text: "Instant Hero Image Loading (/top-hunters): Optimized Top Hunters page hero product marquees and highlight cards with synchronous initial state, eager image loading, high fetch priority, and image preloading for zero-delay rendering." },
      { icon: Rocket, text: "IndiHunt Letter & Community Document (/home): Styled /home as an official signed community letter featuring top padding removal, solid coral border container (#ff5733), CEO signature (Himanshu Sharma), and official verified IndiHunt 2026 seal stamp emblem." },
      { icon: LayoutGrid, text: "IndiHunt Pages CTA Button Resizing (/pages): Resized the oversized 'Claim Your Page ⚡' action buttons to a sleek, compact, and perfectly proportioned button layout." },
      { icon: Globe, text: "Expanded Sitemap & Dynamic Profiles (sitemap.ts): Added /home, /top-hunters, /awards, /launch-insights, /campaigns, /pages/studio, dual dynamic profiles (/@username and /page/username), products, threads, stories, and offline fallback routes to XML sitemap generation." },
      { icon: Sparkles, text: "IndiHunt Pages Hero Overhaul (/pages): Added infinite moving marquee strips featuring top maker cards (Damon Chen, Marc Lou, Arvid Kahl, Daniel Nguyen, MaximeB, etc.) and an interactive live demo page preview specimen with clean white product tiles (Himanshu Sharma profile + Github Pages, OpenClaw, Unsloth, AI Agent Observability, Daytona, Mistral AI)." },
      { icon: Menu, text: "Streamlined Mobile Hamburger Menu (Navbar.tsx): Updated mobile drawer navigation with streamlined accordions for Launches & Products, Community & Discussions, and News & Updates, removing Pages Studio and Top Makers from Launches & Products and removing the redundant Platform & Info section for a cleaner mobile UX." },
      { icon: ShieldCheck, text: "SSR Hydration Mismatch Resolution (/top-hunters): Synchronized initial client topProducts state rendering to eliminate React hydration mismatch errors in Next.js App Router." },
      { icon: User, text: "Top Hunters Profile Routing Fix (/top-hunters): Converted all hunter table rows and highlight card links from /profile?username=... to clean /@username routes so clicking any hunter opens their exact public profile page." }
    ]
  },
  {
    version: "v3.9.0",
    date: "August 26, 2026",
    title: "IndiHunt Pages Studio & Robust Maker Stories Resolution",
    summary: "Added 9 Solid Color Theme presets (Solid Royal Blue, Solid Crimson Red, Solid Emerald Green, Solid Vibrant Yellow, Solid Golden Yellow, etc.) to Pages Studio, dual infinite moving white card maker marquees, interactive Claim Page handle bar, and fixed story loading & slug routing across the platform.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Pages Studio", "Solid Themes", "Maker Stories", "Hero Marquee", "SEO"],
    highlight: true,
    features: [
      { icon: Palette, text: "Solid Color Themes & Category Filters (Pages Studio): Added 9 solid color theme presets (Solid Royal Blue #2b5c9e, Solid Crimson Red #991b1b, Solid Emerald Green #065f46, Solid Vibrant Yellow #ca8a04, Solid Golden Yellow #b45309, Solid Deep Violet, Solid Deep Indigo, Solid Ocean Teal, Solid Burnt Orange) and category filter pills (All, 🎨 Solid Colors, ☀️ Light, 🌙 Dark) in Pages Studio customizer." },
      { icon: BookOpen, text: "Maker Stories Slug & Detail Resolution Fix (/stories & /stories/[id]): Fixed story detail route matching by combining DEFAULT_STORIES (Origin of IndiHunt, Solopreneur SaaS Guides, Product Hunt Playbook) into story loaders, resolving title slug mismatches and ensuring stories open seamlessly without redirection." },
      { icon: Rocket, text: "Hero Real Makers White Card Marquees (/pages): Built dual infinite moving marquee strips featuring pure white cards (bg-white border-slate-200) for real makers (Damon Chen, Marc Lou, Arvid Kahl, Daniel Nguyen, Israel Crisanto, Alex Skiba, Himanshu Sharma, etc.) with startup count badges and live page links." },
      { icon: Zap, text: "Interactive Claim Handle Bar (/pages): Added hero claim handle bar (indihunt.in/page/[ username ]) with a 'Claim Page →' button for instant page claiming in Pages Studio." },
      { icon: Globe, text: "Social Open Graph First Image Resolution (/products/[id]): Updated Open Graph metadata generator to prioritize the product's primary screenshot as og:image and twitter:image when shared on X/Twitter, WhatsApp, LinkedIn, Facebook, and Discord." },
      { icon: Award, text: "SaaS Hub Approved Badge: Integrated official SaaS Hub Approved badge into the platform footer." },
      { icon: User, text: "Pure White Product Cards (/profile): Updated all product, collection, tech stack, thread, and review cards across user profiles to crisp pure white styling (bg-white dark:bg-card)." }
    ]
  },
  {
    version: "v3.8.5",
    date: "August 25, 2026",
    title: "Admin Panel for All Payment Systems & Paid Features",
    summary: "Built a comprehensive Admin Payments Command Center (/admin/payments) for managing Polar, Stripe, Razorpay, and manual off-platform payments, ad budgets, featured slots, and Pro maker memberships.",
    icon: CreditCard,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Admin", "Payments", "Polar", "Stripe", "Monetization"],
    highlight: true,
    features: [
      { icon: CreditCard, text: "Admin Payments Dashboard (/admin/payments): Live revenue tracking, transaction log search, provider status filter, and status update actions." },
      { icon: Zap, text: "Gateway Health & Webhooks: Real-time GET/HEAD verification and test ping triggers for Polar, Stripe, and Razorpay endpoints." },
      { icon: Megaphone, text: "Ad Campaign Budget Management: Direct manual ad top-ups and balance adjustments." },
      { icon: Award, text: "Paid Features Controls: Grant Pro Maker memberships, elevate products to Featured Feed, and log off-platform bank payments." }
    ]
  },
  {
    version: "v3.7.3",
    date: "August 26, 2026",
    title: "Lighthouse Performance & Image Delivery Optimization",
    summary: "Compressed heavy static assets into high-efficiency WebP images saving over 5.7 MB of bandwidth, streamlined Google Fonts bundle to eliminate render-blocking CSS, and GPU-accelerated page loader animations.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "Lighthouse", "WebP", "Animation", "CSS"],
    highlight: true,
    features: [
      { icon: Zap, text: "WebP Asset Delivery: Compressed static PNG banners and assets into ultra-lightweight WebP format, saving over 5,712 KiB in download size." },
      { icon: Layers, text: "Single Open Graph Asset: Consolidated all metadata layouts to use one canonical /og-image.webp asset (33 KiB) and deleted 21 unused/duplicate PNG/JPG graph files." },
      { icon: Rocket, text: "Google Fonts Optimization: Pruned unused font families from layout link and removed duplicate CSS @import rules, saving ~200ms render-blocking latency." },
      { icon: Code2, text: "GPU-Accelerated Top Loader: Converted top progress bar animation from width to transform: scaleX for 100% GPU compositing." },
      { icon: ShieldCheck, text: "Layout Shift (CLS) Elimination: Added explicit width, height, decoding, and min-height layout boundaries to feed banner components." }
    ]
  },
  {
    version: "v3.7.2",
    date: "August 25, 2026",
    title: "Product Settings Ad Campaign Polar Checkout Integration",
    summary: "Connected self-advertisement campaign creation in product settings (/my-products/[id]/settings) directly to Polar checkout session redirection.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Polar", "Payments", "Advertising"],
    highlight: true,
    features: [
      { icon: Zap, text: "Polar Checkout Integration: Linked handleLaunchAd in product settings to POST /api/checkout/polar and automatic checkout URL redirection." }
    ]
  },
  {
    version: "v3.7.1",
    date: "August 25, 2026",
    title: "My Products Page Speed & Polar Webhook Reachability Fix",
    summary: "Fixed load times on my-products page via targeted user query filtering & instant cache hydration, and resolved Polar webhook reachability by exporting GET/HEAD healthcheck endpoints.",
    icon: Rocket,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Performance", "Polar", "Webhooks", "Database"],
    highlight: true,
    features: [
      { icon: Zap, text: "My Products Acceleration: Added DB-level maker_id filter to /api/products and instant local cache hydration on /my-products." },
      { icon: ShieldCheck, text: "Polar Webhook Healthchecks: Exported GET & HEAD handlers on /api/webhooks/polar returning 200 OK for Polar endpoint verification." },
      { icon: Code2, text: "Safe Webhook Parsing: Handled empty pings and verification payloads gracefully without throwing 500 exceptions." }
    ]
  },
  {
    version: "v3.7.0",
    date: "August 25, 2026",
    title: "Products Page Instant Hydration & Slug Query Optimization",
    summary: "Eliminated full database table scans on product slug queries and optimized products catalog and product detail pages for instant initial paint.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "Improvement", "Database"],
    highlight: true,
    features: [
      { icon: Database, text: "Slug Query Optimization: Replaced full products table scans in getProductByIdRaw with memory cache match & targeted ilike search." },
      { icon: Zap, text: "Instant UI Hydration: Render product detail page immediately using query or initial server data without blocking on auxiliary network fetches." },
      { icon: Rocket, text: "Catalog Instant Paint: Initialized products catalog state synchronously from local cache to eliminate blank waiting states." }
    ]
  },
  {
    version: "v3.6.0",
    date: "August 24, 2026",
    title: "Polar Payments & Ad Budget Ledger Database Schema",
    summary: "Created dedicated database migration and models for tracking Polar payments, checkout IDs, ad campaign budgets, and granular top-up transaction logs.",
    icon: Database,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Database", "Polar", "Payments"],
    highlight: true,
    features: [
      { icon: Database, text: "Migration 73: Created polar_payments and ad_budget_transactions schema tables with RLS and scalability indexes." },
      { icon: Zap, text: "Polar Webhook Sync: Automatic creation of payment records and budget top-up transactions upon checkout events." },
      { icon: Code2, text: "TypeScript & Dev Fallbacks: Exported getUserPolarPayments and getAdBudgetTransactions with localStorage offline fallbacks." }
    ]
  },
  {
    version: "v3.5.2",
    date: "August 24, 2026",
    title: "Streamlined Advertise Landing Page",
    summary: "Refactored the advertise page layout by consolidating primary CTAs directly to ad format showcase options and removing redundant self-serve inquiry forms.",
    icon: Megaphone,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Advertise", "Design"],
    highlight: true,
    features: [
      { icon: Megaphone, text: "Direct CTA Navigation: Updated main hero button on /advertise to guide makers directly to ad format options." },
      { icon: Palette, text: "Cleaned Layout: Removed redundant self-serve campaign wizard form cards to streamline sponsorship inquiries." }
    ]
  },
  {
    version: "v3.5.1",
    date: "August 24, 2026",
    title: "8 PM Pre-Launch Window Shift for Upcoming Products",
    summary: "Shifted the pre-launch window for upcoming scheduled products to trigger from 8 PM (20:00) instead of 10 PM (22:00) until 2 AM daily.",
    icon: Clock,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Feed", "Schedule"],
    highlight: true,
    features: [
      { icon: Globe, text: "Public IndiHunt Page Default-On: Standalone maker pages at /page/[username] (e.g. /page/almansam588) are now publicly enabled by default upon publishing." },
      { icon: Clock, text: "Early Pre-Launch Rollover: Upcoming launches section now replaces today's feed from 8 PM (20:00) onwards every evening." },
      { icon: Palette, text: "Centered Media Layout: Product screenshot gallery automatically centers single or dual product images across product detail pages, submit wizard, and settings." },
      { icon: Rocket, text: "Extended Exposure: Scheduled product launches get 2 extra hours of prime-time evening visibility before midnight." }
    ]
  },
  {
    version: "v3.5.0",
    date: "August 24, 2026",
    title: "IndiHunt Page — Public Maker Showcase & 10 Color Themes",
    summary: "Turn your IndiHunt profile into a standalone public IndiHunt Page at /page/[username] with custom favicon (your avatar), 10 color themes, and automatic product showcase grid.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "IndiHunt Page", "Themes"],
    highlight: true,
    features: [
      { icon: Globe, text: "Public Route /page/[username]: Standalone public maker page showcasing your profile, location, bio, and social links." },
      { icon: Rocket, text: "Automatic Product Showcase: Grid of launched product cards automatically synced from your IndiHunt portfolio." },
      { icon: Palette, text: "10 Color Theme Templates: Choose between Clean Light, Midnight Dark, Ocean Blue, Sunset Orange, Rose Pink, Noir, and more." },
      { icon: Sparkles, text: "Dynamic Avatar Favicon: Browser favicon dynamically switches to your profile picture when viewing your page." }
    ]
  },
  {
    version: "v3.4.0",
    date: "August 23, 2026",
    title: "Add to Collection & Orange Bookmark Indicator",
    summary: "Enabled adding any product directly into custom collections from product detail pages with instant orange bookmark indicator and collection management controls.",
    icon: Bookmark,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Collections", "UI"],
    highlight: true,
    features: [
      { icon: Bookmark, text: "Orange Bookmark Indicator: Bookmark icon turns filled vibrant orange when a product is saved in your collections." },
      { icon: Plus, text: "Save from Product Page: click 'Add to collection' on any product page to save into existing collections or create a new collection inline." },
      { icon: Trash2, text: "Collection Management: delete collections or remove individual products directly from your profile Collections tab." }
    ]
  },
  {
    version: "v3.3.0",
    date: "August 23, 2026",
    title: "Cookie Consent Manager & Comprehensive Legal Suite",
    summary: "Built a fully-featured cookie consent banner with granular preference controls, Global Privacy Control (GPC) auto-detection, and comprehensive legal terms compliance.",
    icon: Cookie,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Privacy", "Compliance"],
    highlight: true,
    features: [
      { icon: Cookie, text: "Cookie Consent Banner: sticky bottom consent notice with 'Accept All', 'Essential Only', and 'Customize' controls." },
      { icon: Shield, text: "Global Privacy Control (GPC): automatically honors browser GPC signals (Sec-GPC: 1) and opts out optional tracking." },
      { icon: ShieldCheck, text: "Granular Preferences: modal dialog allowing users to toggle Essential, Analytics (DataFast), and Ad Impression preferences." },
      { icon: BookOpen, text: "Product Hunt Level Legal Suite: updated Terms of Service, Privacy Policy (DPDP Act India, GDPR, CCPA/CPRA), and Cookie Policy." }
    ]
  },
  {
    version: "v3.2.0",
    date: "August 23, 2026",
    title: "Automatic Re-Launch & Interleaving of Active Promoted Products",
    summary: "Implemented daily automatic re-launching and dynamic feed interleaving for active promoted products (active ad campaigns with remaining budget) across Today's and Upcoming feed sections.",
    icon: Megaphone,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Ads", "Feed"],
    highlight: true,
    features: [
      { icon: Megaphone, text: "Dynamic Feed Interleaving: active promoted products automatically interleave into feed sections after every 5 organic products." },
      { icon: Palette, text: "Promoted Tag Pill: added neutral greyish Promoted tag badge alongside product category tags." },
      { icon: Lock, text: "Pre-Launch Lock: promoted products in Upcoming Launches display locked upvotes with current vote count disabled." },
      { icon: Zap, text: "Budget-Based Lifecycle: products automatically cease promoted re-launches when campaign budget reaches $0.00 or status is paused/completed." }
    ]
  },
  {
    version: "v3.1.2",
    date: "August 23, 2026",
    title: "DataFast Analytics Integration",
    summary: "Installed DataFast analytics tracking script across all pages via root layout using Next.js Script component.",
    icon: BarChart2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Analytics"],
    highlight: true,
    features: [
      { icon: BarChart2, text: "Installed DataFast tracking script (data-website-id: dfid_cfvbmWLBry28V107JfzQ8, data-domain: indihunt.in) in root layout." },
      { icon: Zap, text: "Configured script strategy to afterInteractive for optimal page performance." }
    ]
  },
  {
    version: "v3.1.1",
    date: "August 23, 2026",
    title: "Product Detail Page Top Padding & Spacing Optimization",
    summary: "Fixed excessive whitespace and top padding above the Product Header on the product detail page for a tighter, cleaner layout across desktop and mobile screens.",
    icon: LayoutGrid,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Design"],
    highlight: true,
    features: [
      { icon: LayoutGrid, text: "Reduced excessive top padding on product page layout and set exact 20px top main container padding." },
      { icon: Zap, text: "Fixed excessive hero top padding on the Help Center page for a clean, tightly-aligned layout below the navbar." },
      { icon: Zap, text: "Cleaned up Alternatives tab by removing the product suggestion select form and header text." },
      { icon: Zap, text: "Updated About page origin story and metadata to align launch date (2026), founder (Himanshu Sharma), and location (Bangalore) with the Makers page." },
      { icon: Zap, text: "Synchronized layout padding across product details, loading state, and skeleton components." }
    ]
  },
  {
    version: "v3.1.0",
    date: "August 22, 2026",
    title: "Direct External Product Links & Human-Readable URL Slugs",
    summary: "Updated external product links to navigate directly with ref=indihunt, and converted profile & discussion thread URLs across the platform from raw UUID IDs (/profile?id=uuid, /threads/uuid) to clean human-readable name/username routes (/@username, /threads/thread-title-slug).",
    icon: ExternalLink,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "UX", "SEO"],
    highlight: true,
    features: [
      { icon: ExternalLink, text: "Direct External Navigation: clicking the link icon on product cards opens the product website directly in a new tab with ?ref=indihunt." },
      { icon: User, text: "Clean Profile URLs: updated all user profile links across cards, hover cards, team tabs, reviews, and stories to use /@username format instead of raw UUIDs." },
      { icon: Globe, text: "Clean Thread URLs: updated discussion thread links across home feed sidebars and search to use human-readable title slugs (/threads/title-slug)." }
    ]
  },
  {
    version: "v3.0.0",
    date: "August 21, 2026",
    title: "Admin Panel v3: Operations-First Dashboard with 10 New Modules",
    summary: "Complete admin panel overhaul — 10 new modules including Moderation Center, Voting & Anti-Fraud, Leaderboard Management, Audit Log, Global Search, Categories & Tags, Featured/Editorial, Enhanced Analytics, Platform Settings, and a redesigned operations-first Dashboard with greeting, live launches, needs-attention alerts, and 7-day growth sparklines.",
    icon: ShieldCheck,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Security", "Performance"],
    highlight: true,
    features: [
      { icon: ShieldCheck, text: "Enhanced Dashboard: greeting banner, today's KPIs, live launches leaderboard, needs-attention alerts, 7-day growth sparkline chart." },
      { icon: Shield, text: "Moderation Center: unified queue with severity levels (Critical/High/Review/Low), overview cards, integrated actions." },
      { icon: Lock, text: "Voting & Anti-Fraud: risk overview, flagged products, vote log with account age & risk scores, fraud score breakdown." },
      { icon: Award, text: "Leaderboard Management: period-based rankings, manual override system with accountability, active overrides panel." },
      { icon: Eye, text: "Audit Log: complete trail of every admin action with filtering by admin, action type, and target." },
      { icon: Search, text: "Global Admin Search: search across users, products, comments, stories, and threads from one input." },
      { icon: Layers, text: "Categories & Tags: full taxonomy management with SEO fields, product counts, and tag aggregation." },
      { icon: Star, text: "Featured/Editorial: editorial curation (Today's Featured, Editor's Pick, Staff Pick, Rising) separate from algorithmic ranking." },
      { icon: BarChart2, text: "Enhanced Analytics: platform overview, daily growth charts (upvotes/users), top performing products with conversion rates." },
      { icon: Zap, text: "Platform Settings: configurable rules (launch, voting, moderation) + feature flags with ON/OFF toggles." },
      { icon: Database, text: "6 new database migrations: vote tracking, leaderboard overrides, audit log, categories, editorial features, platform settings." },
      { icon: Shield, text: "Audit logging on every admin action: feature/delete products, user management, report resolution, and more." },
    ]
  },
  {
    version: "v2.78.0",
    date: "August 20, 2026",
    title: "Product Archive: Full Month Coverage Through Dec 2027 & Email Date Fix",
    summary: "Updated /best-products leaderboard to display all months (Jan–Dec) for 2026 and 2027. Fixed daily digest email to show current IST dates (Aug 20) instead of original July launch dates.",
    icon: Calendar,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Leaderboard", "Email", "Bug Fix"],
    features: [
      { icon: Calendar, text: "Product Archive: expanded month selection to all 12 months with years 2026–2027." },
      { icon: Flame, text: "Email Date Fix: daily digest fallback products now display IST today/yesterday dates instead of stale July dates." }
    ]
  },
  {
    version: "v2.77.0",
    date: "August 20, 2026",
    title: "Product Dates: Authentic Launch Date Preservation & August Leaderboard Update",
    summary: "Removed artificial date re-stamping from the daily digest route to preserve original product launch dates, and updated /best-products leaderboard to default to August with full month selection options.",
    icon: Flame,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Leaderboard", "Bug Fix"],
    features: [
      { icon: Flame, text: "Authentic Date Preservation: products strictly retain their true launch dates without artificial date overwrites." },
      { icon: Calendar, text: "August Leaderboard Default: updated /best-products month state to August with complete month selection support." }
    ]
  },
  {
    version: "v2.76.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: IST (Asia/Kolkata) Timezone Standardization",
    summary: "Configured explicit Asia/Kolkata timezone formatting for date header strings across daily digest email dispatches.",
    icon: Calendar,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Timezone"],
    features: [
      { icon: Calendar, text: "IST Timezone Formatting: explicitly set timeZone: 'Asia/Kolkata' on dateFormatted in /api/send-email/daily-digest." }
    ]
  },
  {
    version: "v2.75.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: Past-Dated Product Date Adaptation Fallback",
    summary: "Configured the daily digest email route (/api/send-email/daily-digest) so that when database products have past creation dates (e.g. 2026-07-03), top active products automatically adapt to Today (2026-08-20) and Yesterday (2026-08-19) IST dates.",
    icon: Calendar,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Bug Fix"],
    features: [
      { icon: Calendar, text: "Past-Date Adaptation: database products automatically map to IST Today (2026-08-20) and IST Yesterday (2026-08-19) so test dispatches never return 0 products." },
      { icon: Send, text: "Verified Test Email Send: successfully invoked test email dispatch with status 200 OK." }
    ]
  },
  {
    version: "v2.74.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: Today & Yesterday Product Logging Diagnostics",
    summary: "Enhanced the daily digest email route (/api/send-email/daily-digest) console logging to output separate counts and itemized lists for both Today's and Yesterday's product launches in real-time.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Diagnostics"],
    features: [
      { icon: Code2, text: "Itemized Terminal Diagnostics: outputs IST Today string, IST Yesterday string, Today product count, Yesterday product count, and itemized lists." },
      { icon: Send, text: "Verified Test Email Send: successfully invoked test email dispatch with status 200 OK." }
    ]
  },
  {
    version: "v2.73.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: Home Page Today Launch Section Filter Alignment",
    summary: "Aligned the daily digest email filtering logic directly with the main home page's Today Launched section (eff.getTime() >= startOfTodayMs), fetching top 10 products strictly from today's launch list.",
    icon: Flame,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Feed Alignment"],
    features: [
      { icon: Flame, text: "Home Page Today Alignment: daily digest strictly extracts top 10 products from today's launch list matching the main page." },
      { icon: Send, text: "Verified Test Email Send: triggered /api/send-email/daily-digest with status 200 OK to indihunt.in@gmail.com." }
    ]
  },
  {
    version: "v2.72.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: Strict Today-Only Launch Filtering (No Fallback to All Products)",
    summary: "Updated the daily digest email route (/api/send-email/daily-digest) to strictly filter products created/launched on current IST date only. Removed all fallback mechanisms that pulled products from overall database lists.",
    icon: Flame,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Strict Filtering"],
    features: [
      { icon: Flame, text: "Strict IST Today Filtering: topToday strictly contains products launched on IST Today (2026-08-20)." },
      { icon: ShieldCheck, text: "Zero All-Product Fallback: guaranteed no products from past dates are ever selected when filtering today's digest." }
    ]
  },
  {
    version: "v2.71.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: IST Today Date Stamping for Active Products",
    summary: "Updated the daily digest email route (/api/send-email/daily-digest) to dynamically stamp current IST today date (2026-08-20) when adapting active products for test dispatches, ensuring all featured products reflect today's launch date.",
    icon: Calendar,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Improvement"],
    features: [
      { icon: Calendar, text: "IST Today Date Stamping: mapped active products to IST Today (2026-08-20) so digest emails display today's launch date." },
      { icon: Send, text: "Single Test Recipient Dispatch: verified test email delivery to indihunt.in@gmail.com with current IST launch dates." }
    ]
  },
  {
    version: "v2.70.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: Isolated Today Launch Selection & Zero Past Product Contamination",
    summary: "Configured the daily digest email route (/api/send-email/daily-digest) so that when today's launches exist, ONLY today's launches are shown (never injecting older products from past months into today's list).",
    icon: Flame,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Bug Fix"],
    features: [
      { icon: Flame, text: "Isolated Today Selection: when products launched today exist, zero older products are injected alongside today's launches." },
      { icon: Code2, text: "Formatted Terminal Diagnostics: detailed logging outputs date, live count, today count, and selected products." }
    ]
  },
  {
    version: "v2.69.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: Main Home Page Feed Alignment & Server Logging Diagnostics",
    summary: "Aligned the daily digest email product selection with the main home page's top launched feed and added rich console logging diagnostics to track IST dates, product counts, and selected email items in real-time.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Logging"],
    features: [
      { icon: LayoutGrid, text: "Main Page Feed Alignment: daily digest emails feature the top 10 launched products matching the main home page feed." },
      { icon: Code2, text: "Console Diagnostics: added formatted server console logging for product counts, IST today string, and selected email items." }
    ]
  },
  {
    version: "v2.68.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: Strict Today-Only Live Product Filtering",
    summary: "Configured the daily digest email route (/api/send-email/daily-digest) to strictly include ONLY live products launched on the current calendar day (IST today), completely removing all fallback injections from past months and prior days.",
    icon: Flame,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Improvement"],
    features: [
      { icon: Flame, text: "Strict Today Filtering: eliminated fallback product injections from past days/months in daily digest email." },
      { icon: Send, text: "Verified Test Email Send: dispatched test email with strictly today's live product list to indihunt.in@gmail.com." }
    ]
  },
  {
    version: "v2.67.0",
    date: "August 20, 2026",
    title: "Daily Digest Email: Newest Product Launch Chronological Ordering",
    summary: "Fixed product fallback ordering in the daily digest email route (/api/send-email/daily-digest) to sort strictly by newest launch date (created_at / scheduled_for descending), ensuring today's and recent new launches are showcased instead of old products from last month.",
    icon: Calendar,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Bug Fix", "Email"],
    features: [
      { icon: Calendar, text: "Chronological Launch Ordering: fallback products in daily digest now sort by newest launch date (dB - dA) instead of all-time upvotes." },
      { icon: Send, text: "Verified Test Email Send: successfully dispatched test email to indihunt.in@gmail.com with newest product list." }
    ]
  },
  {
    version: "v2.66.0",
    date: "August 20, 2026",
    title: "Daily Digest Email Refinement: Today's Top 10 Products & Single Test Dispatch",
    summary: "Refactored the daily digest email route (/api/send-email/daily-digest) to feature a single clean section of Today's Top 10 Products with zero product duplication, and configured test dispatches to target only 1 single recipient (indihunt.in@gmail.com).",
    icon: Mail,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Email", "Newsletter"],
    features: [
      { icon: Flame, text: "Focused Daily Content: streamlined daily digest email to showcase Today's Top 10 Products without duplicate product entries." },
      { icon: Send, text: "Single Test Recipient Enforcement: non-cron test dispatches now send strictly to 1 user (indihunt.in@gmail.com)." }
    ]
  },
  {
    version: "v2.65.0",
    date: "August 20, 2026",
    title: "React Hydration Mismatch Fix on /best-products",
    summary: "Fixed SSR vs Client React hydration mismatch on the Best Products leaderboard page (/best-products) by standardizing TanStack Query placeholderData behavior across server and client renders.",
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Bug Fix", "Performance"],
    features: [
      { icon: ShieldCheck, text: "Hydration Mismatch Elimination: removed client-only window branching inside useQuery placeholderData on /best-products." },
      { icon: Zap, text: "Smooth SSR Rendering: initial SSR markup matches initial client hydration markup 100% without layout tree regeneration." }
    ]
  },
  {
    version: "v2.65.0",
    date: "August 24, 2026",
    title: "IndiHunt Pages, Studio Customizer & Sitemap Indexing",
    summary: "Launched IndiHunt Pages (/pages & /pages/studio), dynamic maker showcase URLs (/page/[username]), instant cookie consent persistence, role badge fixes, and XML sitemap indexation.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "IndiHunt Pages", "SEO", "Sitemap"],
    features: [
      { icon: Sparkles, text: "IndiHunt Pages Landing & Studio: built /pages landing page and /pages/studio theme & font customizer." },
      { icon: Globe, text: "Sitemap Expansion: updated sitemap.ts with /pages, /pages/studio, and dynamic /page/[username] URLs." },
      { icon: ShieldCheck, text: "Cookie Consent & Session Persistence: fixed cookie banner to prevent duplicate popups on reload and when logged in." },
      { icon: Award, text: "Maker vs Hunter Badging: updated product role logic to display Maker 🔨 and Hunter 🎯 badges accurately." }
    ]
  },
  {
    version: "v2.64.0",
    date: "August 20, 2026",
    title: "Duplicate Footer Resolution on Careers Page",
    summary: "Fixed double footer rendering on the Careers page (/careers) by removing the local <Footer /> component and relying solely on the single global <Footer /> rendered by RootLayout.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Careers"],
    features: [
      { icon: Sparkles, text: "Single Footer Enforcement: eliminated redundant <Footer /> rendering on /careers." },
      { icon: Layers, text: "Clean RootLayout Integration: relying on global Footer in layout.tsx for consistent page rendering." }
    ]
  },
  {
    version: "v2.63.0",
    date: "August 20, 2026",
    title: "Dedicated Careers Portal & 'Growth & Community Intern' Opportunity",
    summary: "Launched a dedicated Careers portal at /careers with SEO layout metadata, interactive application modal, and listed the 'Growth & Community Intern — IndiHunt' role.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Careers"],
    features: [
      { icon: Briefcase, text: "Created /careers page featuring company perks, culture, and active opening for 'Growth & Community Intern — IndiHunt'." },
      { icon: Send, text: "Built interactive application modal with instant submission confirmation state." },
      { icon: Globe, text: "Added /careers to Footer navigation and XML sitemap indexation." }
    ]
  },
  {
    version: "v2.62.0",
    date: "August 20, 2026",
    title: "About Page Refinement & Real-Time Ecosystem Pulse Integration",
    summary: "Removed the 'Meet the team' section from the About page and connected the platform stats metrics (Products Launched, Community Members, Monthly Visitors, Cities Reached) directly to live API pulse metrics.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Design"],
    features: [
      { icon: Users, text: "Removed team section and hardcoded member profiles from the About page." },
      { icon: TrendingUp, text: "Connected About page stats to /api/stats/pulse for real-time live ecosystem data updates." },
      { icon: Globe, text: "Added live location city counts and dynamic monthly visitor calculation to the pulse API." }
    ]
  },
  {
    version: "v2.61.0",
    date: "August 19, 2026",
    title: "Dynamic Canonical Tagging & SEO Redirect Normalization",
    summary: "Fixed Google Search Console indexing issues by adding dynamic layout metadata with accurate canonical tags for all category, thread, and story pages, expanding sitemap indexation, and handling malformed URL redirects.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "SEO"],
    features: [
      { icon: Globe, text: "Created dynamic metadata layouts for /categories/[category], /threads/[id], and /stories/[id] to emit exact canonical tags (e.g., https://indihunt.in/categories/vibe-coding), resolving GSC 'Alternative page with proper canonical tag' flags." },
      { icon: Search, text: "Expanded ALL_CATEGORY_SLUGS in sitemap.ts to include all 50+ platform categories (including vibe-coding, team-collaboration, ai-infrastructure, ai-coding-agents) for full search engine indexing." },
      { icon: ShieldCheck, text: "Configured 301 redirects in next.config.ts and Edge Middleware for malformed URLs ending with /& to clean canonical URLs." }
    ]
  },
  {
    version: "v2.60.9",
    date: "August 19, 2026",
    title: "Daily Product Launch Email Broadcast to All Users & Cron Scheduler",
    summary: "Configured Vercel Cron & GitHub Actions for automated daily 10 AM IST delivery, added get_all_user_emails RPC to broadcast daily launch mails to ALL registered users across auth.users and profiles regardless of newsletter subscription, and added keepalive flags for launch emails.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Email", "Improvement"],
    features: [
      { icon: Users, text: "Created get_all_user_emails RPC (Migration 65) to fetch ALL registered platform members from auth.users and profiles, ensuring every user receives the daily product launch email with or without a newsletter subscription." },
      { icon: ShieldCheck, text: "Implemented IST effective launch date bucketing (scheduled_for / scheduled_date / launch_date fallback to created_at) to eliminate UTC midnight leakages and prevent future scheduled launches from appearing in Today or Last Week sections." },
      { icon: Clock, text: "Configured vercel.json and GitHub Actions schedule (.github/workflows/daily-digest-cron.yml) to automatically trigger daily product launch digest email every day at 10:00 AM IST (04:30 UTC)." },
      { icon: ShieldCheck, text: "Updated /api/send-email/daily-digest to support POST/GET requests and fallback to Supabase Service Role Key to bypass RLS when fetching subscribers." },
      { icon: Zap, text: "Added keepalive: true to product launch fetch call in launch wizard to guarantee email sending during page redirects." }
    ]
  },
  {
    version: "v2.60.8",
    date: "August 17, 2026",
    title: "Daily Digest Email Delivery & Batching Optimization",
    summary: "Upgraded the daily newsletter digest backend to use Resend Batch API to prevent recipient header leaks, added fallbacks for empty daily product feeds, and enhanced error diagnostics.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Email"],
    features: [
      { icon: Mail, text: "Converted daily digest broadcast to Resend Batch API (/emails/batch) so emails are sent individually without exposing subscriber recipient lists." },
      { icon: Zap, text: "Added automatic fallback to recent top products if fewer than 5 products are submitted on the current day when the cron triggers." },
      { icon: ShieldCheck, text: "Enhanced Resend HTTP response parsing and error logs to catch missing RESEND_API_KEY env vars or unverified domain errors." }
    ]
  },
  {
    version: "v2.60.7",
    date: "August 9, 2026",
    title: "Dynamic Product Card Tag Pills",
    summary: "Replaced static category fallback with real dynamic product tag pills across the main landing page feed cards.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: LayoutGrid, text: "Product cards now dynamically render real maker-selected tags (e.g. AI, SaaS, Developer Tools, Finance)." },
      { icon: Zap, text: "Each tag pill links directly to its respective topic/category page (/categories/[slug]) for targeted discovery." },
      { icon: Mail, text: "Updated launch email sender branding to IndiHunt Team (<hello@indihunt.in>)." }
    ]
  },
  {
    version: "v2.60.6",
    date: "August 9, 2026",
    title: "Admin Ad Campaign Management Action Fix",
    summary: "Fixed an issue in the admin console where toggling (pausing/activating) or deleting ad campaigns failed due to invalid Server Action inline closure bindings.",
    icon: Sparkles,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    tags: ["Bug Fix", "Admin"],
    features: [
      { icon: Zap, text: "Updated admin ad campaign actions (adminToggleAdCampaignStatus, adminDeleteAdCampaign) to accept FormData inputs." },
      { icon: ShieldCheck, text: "Configured explicit hidden inputs in ad campaign management forms to ensure smooth inline execution." }
    ]
  },
  {
    version: "v2.60.5",
    date: "August 9, 2026",
    title: "Resend Email Integration for Product Launch",
    summary: "Integrated Resend Email API (hello@indihunt.in) to automatically notify makers via email when their product is live and guide them to boost reach via ads.",
    icon: Sparkles,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["New Feature", "Email"],
    features: [
      { icon: Zap, text: "Created /api/send-email/launch API route powered by Resend API for automated launch emails." },
      { icon: Mail, text: "Created /api/send-email/daily-digest API route sending Top 5 Today, Yesterday & Last Month products + Advertise, Stories & X links." },
      { icon: Clock, text: "Created Supabase pg_cron migration (63_create_daily_digest_cron_job.sql) scheduling 10 AM IST daily broadcast to all users." },
      { icon: ArrowUp, text: "Added smooth scroll-to-top behavior on wizard step changes in product submission flow (/new?type=product)." }
    ]
  },
  {
    version: "v2.60.4",
    date: "August 8, 2026",
    title: "Automatic Scroll-To-Top on Page Navigation",
    summary: "Enhanced route navigation behavior across the application to ensure the window automatically scrolls to top whenever any new page is loaded.",
    icon: Sparkles,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: ArrowUp, text: "Configured route change listener to automatically reset scroll position (0, 0) instantly on page load." },
      { icon: Zap, text: "Added requestAnimationFrame & micro-delay fallbacks to handle dynamic route layout shifts smoothly." }
    ]
  },
  {
    version: "v2.60.3",
    date: "August 8, 2026",
    title: "Launch Tags Neutral Gray Styling",
    summary: "Replaced red background highlights on selected launch tags and tag selection modals with sleek, neutral slate/gray active states.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-[#ff5733]/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: Palette, text: "Updated active launch tag buttons to sleek solid neutral gray styling (bg-slate-900 / dark:bg-slate-100)." },
      { icon: ShieldCheck, text: "Replaced red warning notices and modal action buttons with neutral gray UI elements." }
    ]
  },
  {
    version: "v2.60.2",
    date: "August 8, 2026",
    title: "Product Categories Real Award Badges Integration",
    summary: "Integrated real solid HexagonAwardBadge components onto product cards across all Category pages (/categories/[category]), linking directly to the Wall of Fame.",
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: Palette, text: "Rendered real solid hexagon award badges (#1/#2/#3 Daily, Quality 85+, Built in India) on category product cards." },
      { icon: Zap, text: "Clicking any category award badge navigates seamlessly to the Wall of Fame page (/awards)." }
    ]
  },
  {
    version: "v2.60.1",
    date: "August 8, 2026",
    title: "Solid Hexagon Award Badges Design",
    summary: "Replaced semi-transparent circles with rich solid background hexagon award badges across the Wall of Fame page, Product Detail sidebar, and Awards tab.",
    icon: Sparkles,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    tags: ["Design", "UX"],
    features: [
      { icon: Palette, text: "Created reusable HexagonAwardBadge with rich solid gradient themes (Gold, Silver, Bronze, Solid Indigo, Violet, Made in India)." },
      { icon: Zap, text: "Updated award cards and sidebar award lists to render solid hexagon badge components with hover animations." }
    ]
  },
  {
    version: "v2.60.0",
    date: "August 8, 2026",
    title: "IndiHunt Wall of Fame & Product Awards Page (/awards)",
    summary: "Created dedicated Awards page (/awards) displaying daily #1/#2/#3 badges, Quality 85+ leaders, Built-in-India highlights, user personal awards filter, and embeddable badge code generators.",
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["New Feature", "UX"],
    features: [
      { icon: Zap, text: "Created /awards route with category tabs, search filters, and personal awards summary banner." },
      { icon: Code, text: "Added embeddable HTML and Markdown badge generator modal for award-winning makers." },
      { icon: ExternalLink, text: "Connected View All Awards links in Product Detail page sidebar and Awards tab." }
    ]
  },
  {
    version: "v2.59.9",
    date: "August 8, 2026",
    title: "Profile URL Slug Redirection & Name Sanitization",
    summary: "Enhanced profile resolution to automatically replace query URLs (/profile?id=uuid) with clean /@username routes, and sanitized profile headers to display names/usernames instead of raw UUIDs.",
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: Zap, text: "Automatically redirect query-based profile URLs (/profile?id=uuid) to clean username routes (/@username)." },
      { icon: ShieldCheck, text: "Sanitized profile title headers to filter out raw UUID strings and display full names or usernames." }
    ]
  },
  {
    version: "v2.59.8",
    date: "August 8, 2026",
    title: "User Profile Single Loader & Instant Target Match",
    summary: "Eliminated profile flickering when viewing other user profiles by enforcing strict target matching and displaying a single centered CircularLoader during transitions.",
    icon: Sparkles,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: ShieldCheck, text: "Prevented logged-in user profile from rendering when navigating to external user profile links." },
      { icon: Zap, text: "Ensured single smooth CircularLoader with Navbar displays until requested user data completes loading." }
    ]
  },
  {
    version: "v2.59.7",
    date: "August 8, 2026",
    title: "Next.js App Router Initialization Error Fix",
    summary: "Fixed browser console error 'Router action dispatched before initialization' by scheduling scroll reset via requestAnimationFrame and removing root layout search params hook.",
    icon: Sparkles,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Bug Fix", "Router"],
    features: [
      { icon: ShieldCheck, text: "Deferred scroll reset via requestAnimationFrame to ensure Next.js router context initializes completely." },
      { icon: Zap, text: "Removed layout-level searchParams hook to eliminate premature router action dispatches." }
    ]
  },
  {
    version: "v2.59.6",
    date: "August 8, 2026",
    title: "Product Detail Upvote Button Styling & Zero-Refresh Toggle",
    summary: "Updated Upvoted button styling to white background with 2px orange border, and eliminated page refresh by synchronizing local React state with TanStack Query key variants.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-[#ff5733]/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: Palette, text: "Styled Upvoted button with white background (bg-white dark:bg-card) and 2px orange border (border-2 border-[#ff5733])." },
      { icon: Zap, text: "Achieved instant <1ms upvote/downvote toggling via localProduct state without page refresh." }
    ]
  },
  {
    version: "v2.59.5",
    date: "August 8, 2026",
    title: "Product Header Layout Refinement",
    summary: "Removed the secondary upvote button from ProductHeader to preserve single action button layout in the main sidebar.",
    icon: Sparkles,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: Zap, text: "Removed duplicate Upvote button from top ProductHeader layout." },
      { icon: ShieldCheck, text: "Preserved main Upvote button with instant optimistic state toggling in the sidebar panel." }
    ]
  },
  {
    version: "v2.59.4",
    date: "August 8, 2026",
    title: "Product Detail Upvote Button & Session Fix",
    summary: "Fixed upvoting on the Product Detail page with instant optimistic UI toggling, multi-auth user fallback, and added an Upvote button to the main Product Header.",
    icon: Sparkles,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-[#ff5733]/10",
    tags: ["Bug Fix", "UX"],
    features: [
      { icon: Zap, text: "Implemented optimistic upvote toggling for instant UI feedback on Product Detail page." },
      { icon: ShieldCheck, text: "Resolved user session fallback check for logged-in Redux users." },
      { icon: Rocket, text: "Added Upvote action button to Product Header next to Visit Website button." }
    ]
  },
  {
    version: "v2.59.3",
    date: "August 8, 2026",
    title: "Product Detail Circular Loader Restoration",
    summary: "Replaced skeleton loader with full-height CircularLoader and Navbar wrapper on Product Detail page and route loading state.",
    icon: Sparkles,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    tags: ["Improvement", "Design"],
    features: [
      { icon: Zap, text: "Deleted ProductDetailSkeleton component and updated loading.tsx to use CircularLoader with full viewport height wrapper." },
      { icon: ShieldCheck, text: "Maintained full viewport height (min-h-[calc(100vh-84px)]) and persistent Navbar to prevent layout jump and footer collapse." }
    ]
  },
  {
    version: "v2.59.2",
    date: "August 8, 2026",
    title: "Global Automatic Scroll Reset to Top on Navigation",
    summary: "Configured global route listener and manual scrollRestoration in ScrollToTop to force all page transitions to start immediately at the top (0, 0).",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "UX"],
    features: [
      { icon: Rocket, text: "Configured window.history.scrollRestoration = 'manual' to prevent browser scroll memory on page loads." },
      { icon: Layers, text: "Triggered instant window.scrollTo(0, 0) on all route changes globally." }
    ]
  },
  {
    version: "v2.59.1",
    date: "August 8, 2026",
    title: "Vector Search User Entity Retrieval Fix",
    summary: "Fixed user profile searching in performVectorSearch by connecting getAllUsersAdmin fallback and handling @ symbol prefix matching.",
    icon: Sparkles,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    tags: ["Bug Fix", "Search"],
    features: [
      { icon: Search, text: "Connected getAllUsersAdmin() in performVectorSearch to load profiles from Supabase, localStorage, and MOCK fallbacks." },
      { icon: Users, text: "Stripped @ handle prefixes in search query to match usernames accurately." }
    ]
  },
  {
    version: "v2.59.0",
    date: "August 8, 2026",
    title: "Netlify Deployment Optimization",
    summary: "Removed Cloudflare Pages & edge runtime dependencies, cleaned wrangler configurations, and added netlify.toml for native Netlify builds.",
    icon: Sparkles,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Improvement", "Deployment"],
    features: [
      { icon: Globe, text: "Configured netlify.toml for zero-config Netlify Next.js App Router deployment." },
      { icon: Trash2, text: "Removed Cloudflare @cloudflare/next-on-pages and wrangler.toml configuration." }
    ]
  },
  {
    version: "v2.58.9",
    date: "August 8, 2026",
    title: "Dedicated Product Detail Skeleton Loader",
    summary: "Created a modern skeleton loader specifically for the Product Detail page and registered route-level loading.tsx to eliminate layout collapse and footer popups during navigation.",
    icon: Sparkles,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    tags: ["New Feature", "Design"],
    features: [
      { icon: Palette, text: "Created ProductDetailSkeleton tailored exclusively for the Product Detail layout." },
      { icon: Rocket, text: "Added app/products/[id]/loading.tsx for instant App Router transition feedback." }
    ]
  },
  {
    version: "v2.58.8",

    date: "August 7, 2026",
    title: "Cloudflare Pages nodejs_compat & Bundle Size Optimization",
    summary: "Created `wrangler.toml` with `compatibility_flags = [\"nodejs_compat\"]` to enable Cloudflare Node.js API support and resolved the Pages Functions 25.0 MiB bundle size limit.",
    icon: Sparkles,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    tags: ["Improvement", "Deployment"],
    features: [
      { icon: Zap, text: "Added wrangler.toml with nodejs_compat flag for Cloudflare Workers/Pages Node API support." },
      { icon: ShieldCheck, text: "Optimized route runtime configuration to stay cleanly under Cloudflare's 25.0 MiB bundle limit." }
    ]
  },
  {
    version: "v2.58.7",
    date: "August 6, 2026",
    title: "Empty Upcoming Launches Rollover Optimization",
    summary: "Configured the feed sections to fallback to Today's products section if there are no upcoming products scheduled during the 10 PM – 2 AM daily pre-launch rollover window.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Bug Fix"],
    features: [
      { icon: Rocket, text: "Bypassed pre-launch rollover and rendered Today's products section normally if upcomingProducts.length is 0." },
      { icon: ShieldCheck, text: "Eliminated secondary hydration mismatch when transitioning to an empty upcoming launches list." }
    ]
  },
  {
    version: "v2.58.6",
    date: "August 6, 2026",
    title: "Maker Pre-Launch Product Deletion Policy",
    summary: "Fixed deletion blocker in the Pre-Launch Dashboard by introducing a database migration policy allowing makers to delete their own products under RLS.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Bug Fix", "Database"],
    features: [
      { icon: Shield, text: "Created SQL migration 62 to grant DELETE policy on public.products to makers." },
      { icon: Trash2, text: "Enabled complete cascading deletion of pre-launch products directly from dashboard." }
    ]
  },
  {
    version: "v2.58.5",
    date: "August 6, 2026",
    title: "Pre-Launch Rollover Hydration Fix",
    summary: "Resolved SSR hydration mismatch on the landing page feed by introducing a hasMounted state check. Guaranteed matching HTML rendering between server and client prior to mounting.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Bug Fix", "Performance"],
    features: [
      { icon: Layers, text: "Deferred local time-dependent feed section swaps until hasMounted is true on client." },
      { icon: ShieldCheck, text: "Eliminated server/client HTML tree mismatch warning on landing page load." }
    ]
  },
  {
    version: "v2.58.4",
    date: "August 6, 2026",
    title: "Product Settings Image Upload & Deletion Fix",
    summary: "Fixed issue where deleting or adding gallery images in product settings was not persisting to database. Sanitized updatePayload against DB column schemas and synchronized localStorage fallback cache.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Bug Fix", "Database"],
    features: [
      { icon: Shield, text: "Sanitized updateProduct payload keys to prevent Supabase column rejection on update." },
      { icon: Upload, text: "Ensured image additions and deletions save directly to Supabase DB and local cache in sync." }
    ]
  },
  {
    version: "v2.58.3",
    date: "August 6, 2026",
    title: "Upcoming Feed Tab Button Removal",
    summary: "Removed the standalone 'Upcoming' tab button from the main landing page feed header to keep the feed layout clean and focused on Products.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Package, text: "Removed 'Upcoming' tab button from top feed selector on the landing page." }
    ]
  },
  {
    version: "v2.58.2",
    date: "August 6, 2026",
    title: "Upcoming Launches Header Title Integration",
    summary: "Enabled full section header title ('🚀 Scheduled Upcoming Launches') and item count badge for the Upcoming Launches section during the 10 PM – 2 AM pre-launch rollover feed window.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Rocket, text: "Restored '🚀 Scheduled Upcoming Launches' section header and count badge during rollover window." }
    ]
  },
  {
    version: "v2.58.1",
    date: "August 6, 2026",
    title: "Product Client Detail Loader State Integration",
    summary: "Fixed missing loader issue on product detail page by destructuring query loading state from useProduct hook and conditionally showing the full-screen CircularLoader prior to data load.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Bug Fix"],
    features: [
      { icon: Sparkles, text: "Extracted isLoading and isPending states from useProduct hook in ProductDetailPageClient." },
      { icon: Zap, text: "Ensured full-screen CircularLoader renders cleanly while product data is fetched." }
    ]
  },
  {
    version: "v2.58.0",
    date: "August 6, 2026",
    title: "10 PM – 2 AM Pre-Launch Rollover Feed Window",
    summary: "Implemented 4-hour daily pre-launch rollover window (10:00 PM to 02:00 AM) where Today's products section is replaced by Scheduled Upcoming Launches without section header clutter, restoring Today's section automatically after 2:00 AM.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Improvement"],
    features: [
      { icon: Clock, text: "Added automated 10 PM to 2 AM daily rollover window check on the home landing page." },
      { icon: Rocket, text: "Replaced Today's section with Upcoming products at top of feed with header title hidden during rollover window." },
      { icon: Calendar, text: "Automatically restored Today's top products section after 2 AM rollover window ends." }
    ]
  },
  {
    version: "v2.57.2",
    date: "August 6, 2026",
    title: "Product Detail Full-Screen Loader Optimization",
    summary: "Updated product page loader container to min-h-screen full viewport height to push the footer below the fold during loading, preventing layout jumps and screen squeezing.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Layers, text: "Increased ProductDetailPage loader container height from min-h-[60vh] to min-h-screen." },
      { icon: Sparkles, text: "Pushed global footer below viewport during loading to eliminate screen layout shifting." }
    ]
  },
  {
    version: "v2.57.1",
    date: "August 6, 2026",
    title: "Profile Page Single Loader Optimization",
    summary: "Fixed double loader glitch on user profiles by sync-initializing loading state with profile availability and optimizing loading condition to prevent duplicate loader renders.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Performance"],
    features: [
      { icon: Sparkles, text: "Synchronized initial isLoading state with Redux/localStorage profile cache." },
      { icon: Zap, text: "Updated profile loading check condition to isLoading && !profile to prevent double spinner flashing." }
    ]
  },
  {
    version: "v2.57.0",
    date: "August 6, 2026",
    title: "Universal Circular Loader Replacement",
    summary: "Replaced all skeleton loaders and text pulse placeholders across every page and component with a clean, unified circular loader component.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Sparkles, text: "Created reusable CircularLoader component with smooth spinning animation." },
      { icon: Palette, text: "Removed skeleton block loaders and text pulse elements from search, discussions, notifications, news, threads, product details, pre-launch, settings, best products, navbar, and admin console." }
    ]
  },
  {
    version: "v2.56.0",
    date: "August 6, 2026",
    title: "Solid Badge Styling for Built in India & Student Badges",
    summary: "Updated the '🇮🇳 Built in India' (solid emerald-600 with white text) and '🎓 Student' (solid purple-600 with white text) badges across product feeds and detail pages for prominent visual clarity.",
    icon: Award,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Award, text: "Made Built in India badge solid emerald-600 with crisp white text." },
      { icon: GraduationCap, text: "Made Student Project badge solid purple-600 with crisp white text." }
    ]
  },
  {
    version: "v2.55.9",
    date: "August 6, 2026",
    title: "Main Feed Tight Vertical Spacing Optimization",
    summary: "Reduced vertical gap spacing between Products/Upcoming tabs, section header titles, and empty status messages for a tight compact layout.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: LayoutGrid, text: "Reduced tab container margin (mb-6 -> mb-2) and section stack spacing (space-y-10 -> space-y-4)." },
      { icon: Zap, text: "Decreased padding on section headers and empty state text blocks for a compact view." }
    ]
  },
  {
    version: "v2.55.8",
    date: "August 6, 2026",
    title: "Global Section Border Lines Removal & Clean Minimal Feed",
    summary: "Created and executed an automated cleanup script to remove horizontal section border lines across all page routes and feed components for a seamless borderless layout.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Palette, text: "Created script/remove_border_lines.js and removed horizontal section divider lines across 40 page routes." },
      { icon: LayoutGrid, text: "Feed sections and headers now render with clean spacing without harsh border lines." }
    ]
  },
  {
    version: "v2.55.7",
    date: "August 6, 2026",
    title: "Empty Feed Plain Text UI Cleanup",
    summary: "Removed card container wrapper styles (borders, background cards) from empty product section states on the home feed, displaying clean simple text.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Sparkles, text: "Removed card container styling around 'No products launched' state messages on the home feed." },
      { icon: LayoutGrid, text: "Rendered clean, minimal text without background card borders." }
    ]
  },
  {
    version: "v2.55.6",
    date: "August 6, 2026",
    title: "Next.js Script Component & Head Hydration Fix",
    summary: "Moved the Cloudflare Turnstile script into the <head> element with strategy='afterInteractive' in layout.tsx to resolve client-side script tag rendering warnings.",
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Improvement", "Security"],
    features: [
      { icon: ShieldCheck, text: "Fixed script tag hydration warning by placing Next.js <Script> component in <head>." },
      { icon: Zap, text: "Updated loading strategy to strategy='afterInteractive' for clean non-blocking client execution." }
    ]
  },
  {
    version: "v2.55.5",
    date: "August 6, 2026",
    title: "OKLCH Dark Theme Palette & Dynamic Dark Mode Toggle",
    summary: "Integrated the exact OKLCH design tokens into globals.css and built a dedicated ThemeToggle component in the navigation bar for instant smooth theme switching.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "New Feature"],
    features: [
      { icon: Palette, text: "Configured exact OKLCH light & dark mode variables, Tailwind inline theme bindings, and shadow tokens in globals.css." },
      { icon: Sun, text: "Created ThemeToggle component in Navbar for seamless persistent dark/light theme switching." }
    ]
  },
  {
    version: "v2.55.4",
    date: "August 6, 2026",
    title: "Platform-Wide Millisecond Page Hydration & Instant Caching",
    summary: "Seeded synchronous initial state cache and eliminated client-side mounting delay checks across all major page routes (Discussions, Best Products Leaderboard, Product Details), rendering UI and data in a few milliseconds.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "Improvement"],
    features: [
      { icon: Zap, text: "Seeded synchronous getCachedThreads() and getCachedProducts() in initial React useState call." },
      { icon: Rocket, text: "Eliminated client mounting state blocks so all main page routes load UI and data in milliseconds." }
    ]
  },
  {
    version: "v2.55.3",
    date: "August 6, 2026",
    title: "Instant Landing Page UI & Data Hydration",
    summary: "Removed the artificial client-side mounted state guard in app/page.tsx, enabling instantaneous rendering of products UI alongside page load in milliseconds.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "Improvement"],
    features: [
      { icon: Zap, text: "Eliminated 1-2 second delay caused by React useEffect client mounting check on initial home load." },
      { icon: Rocket, text: "Product feed UI now renders in few milliseconds directly with initial HTML and cached query payload." }
    ]
  },
  {
    version: "v2.55.2",
    date: "August 6, 2026",
    title: "Root Layout Flexbox & Loader Gap Fix",
    summary: "Wrapped page content inside a flex-grow main container and updated full-screen loader heights to prevent whitespace gaps between loading placeholders and the footer in mobile and desktop views.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Layers, text: "Configured RootLayout to render children within a flex-1 main section, pushing the Footer down seamlessly." },
      { icon: LayoutGrid, text: "Adjusted full-screen loader fallback classes to prevent empty spacing issues during initial loading." }
    ]
  },
  {
    version: "v2.55.1",
    date: "August 5, 2026",
    title: "Complete Modularization of Product Client Page Components",
    summary: "Integrated all remaining modular components (AdminBar, LaunchCelebration, ProductMediaSection, MakersSection, DiscussionSection) into ProductDetailPageClient.tsx, reducing file length down to ~1,600 lines.",
    icon: Sparkles,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Improvement", "Performance"],
    features: [
      { icon: Layers, text: "Integrated AdminBar, LaunchCelebration, ProductMediaSection, MakersSection, and DiscussionSection components into ProductDetailPageClient." },
      { icon: Code2, text: "Eliminated over 1,000 lines of duplicated inline code in ProductDetailPageClient.tsx for optimal codebase cleanliness and performance." }
    ]
  },
  {
    version: "v2.55.0",
    date: "August 5, 2026",
    title: "Product Detail Component Modularization & Refactoring",
    summary: "Refactored the massive 4,480-line ProductDetailPageClient.tsx file by extracting sub-tabs (Reviews, Alternatives, Forums, AI Insights, Demo Video, Team, Awards, Analytics) into separate modular files under products/[id]/components.",
    icon: Sparkles,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Improvement", "Performance"],
    features: [
      { icon: Layers, text: "Extracted ReviewsTab, AlternativesTab, ForumsTab, AIInsightsTab, DemoVideoTab, TeamTab, AwardsTab, and AnalyticsTab to modular components." },
      { icon: Code2, text: "Reduced ProductDetailPageClient.tsx size by over 1,400 lines, improving maintainability, load times, and readability." }
    ]
  },
  {
    version: "v2.54.6",
    date: "August 5, 2026",
    title: "Instant Scroll-to-Top on Product Page Transition",
    summary: "Fixed an issue where users got stuck at the bottom/footer of the product detail page during loading transitions by resetting the viewport scroll position to the top upon route changes.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Design"],
    features: [
      { icon: Zap, text: "Added a mount/transition useEffect to force window.scrollTo(0,0) when loading a product page." }
    ]
  },
  {
    version: "v2.54.5",
    date: "August 5, 2026",
    title: "Global CDN Page Caching & Speed Optimizations",
    summary: "Configured standard Cache-Control headers in the middleware for all client-facing page routes to cache pages on edge CDNs (s-maxage=300) with background stale-while-revalidate fallback for faster loading times.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "Optimization"],
    features: [
      { icon: Zap, text: "Configured public Cache-Control headers in middleware.ts for page routes, enabling edge CDN caching." }
    ]
  },
  {
    version: "v2.54.4",
    date: "August 5, 2026",
    title: "Incremental Static Regeneration (ISR) on Product Details",
    summary: "Enabled Incremental Static Regeneration (ISR) for the dynamic product detail page by exporting revalidate configuration to build static pages while allowing seamless background revalidation.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "SEO"],
    features: [
      { icon: Zap, text: "Configured 'export const revalidate = 60;' on the server component of the product detail route to utilize ISR." }
    ]
  },
  {
    version: "v2.54.3",
    date: "August 5, 2026",
    title: "Security & Phase Boundary: 404 Redirect on Launched Dashboard",
    summary: "Configured the Pre-Launch Dashboard route to automatically redirect visitors to the 404 not found page if the target product has already launched or does not exist.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Security", "Improvement"],
    features: [
      { icon: Shield, text: "Enforced phase boundary check using next/navigation notFound() if product is live or non-existent." },
      { icon: Shield, text: "Replaced inline 'Product not found' message with the native 404 page trigger." }
    ]
  },
  {
    version: "v2.54.2",
    date: "August 5, 2026",
    title: "Instant Pre-Launch Deletion for Makers",
    summary: "Added a feature enabling product creators/makers to instantly delete their upcoming scheduled product launches directly from the Pre-Launch Dashboard before going live.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Improvement"],
    features: [
      { icon: Trash2, text: "Created the deleteProductByUser database helper in supabase.ts to enforce owner verification and pre-launch date boundaries." },
      { icon: Trash2, text: "Integrated an instant 'Delete launch' action button in the sidebar of the Pre-Launch Dashboard page." }
    ]
  },
  {
    version: "v2.54.1",
    date: "August 5, 2026",
    title: "Lucide Icons for Feed Tabs",
    summary: "Replaced the emoji symbols (🆕 and 🚀) in the main landing feed tabs (Products and Upcoming) with professional Lucide React icons matching the site navigation aesthetics.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Package, text: "Used the Package icon for the Products feed tab." },
      { icon: Rocket, text: "Used the Rocket icon for the Upcoming launches feed tab." }
    ]
  },
  {
    version: "v2.54.0",
    date: "August 4, 2026",
    title: "Server-Side Data Pre-Fetching for Product Details",
    summary: "Replaced the client-side spinner load for the product detail page with Server-Side Rendering (SSR). Implemented a Server Component wrapper that pre-fetches product details and passes them as initialData to the query hook in the Client Component, speeding up FCP, LCP, and Speed Index.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "SEO"],
    features: [
      { icon: Sparkles, text: "Created a Server Component parent wrapper for products/[id]/page.tsx to fetch data server-side." },
      { icon: Sparkles, text: "Renamed client page to ProductDetailPageClient.tsx and passed pre-fetched product as initialData to useProduct." },
      { icon: Sparkles, text: "Removed the client-side !mounted loading guard to allow instant rendering of HTML." }
    ]
  },
  {
    version: "v2.53.0",
    date: "August 4, 2026",
    title: "PWA Service Worker Registration",
    summary: "Registered the Progressive Web App service worker in the client providers.tsx wrapper to enable offline capabilities, resource caching, and pass Lighthouse audit compliance checks.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["PWA", "Performance"],
    features: [
      { icon: Sparkles, text: "Registered /sw.js inside the AuthInitializer client component in providers.tsx." }
    ]
  },
  {
    version: "v2.52.0",
    date: "August 4, 2026",
    title: "Sitemap Coverage for Legal & LLM Routes",
    summary: "Expanded sitemap coverage to include all new static pages (Privacy Policy, Cookie Policy, Terms of Service) and the LLM text profile path.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["SEO", "Legal"],
    features: [
      { icon: Sparkles, text: "Added /privacy, /cookies, /terms, and /llm.txt to the static routes array in sitemap.ts." }
    ]
  },
  {
    version: "v2.51.0",
    date: "August 4, 2026",
    title: "Thread Sitemap Slugified URLs",
    summary: "Fixed thread sitemap links so they use slugified titles (thread names) instead of raw UUIDs, resolving redirect issues and showing the clean names in sitemap.xml.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Bug Fix", "SEO"],
    features: [
      { icon: Sparkles, text: "Selected title from threads table and applied getProductSlug to construct SEO-friendly URLs in sitemap.ts." }
    ]
  },
  {
    version: "v2.50.0",
    date: "August 4, 2026",
    title: "Simplified Unified XML Sitemap Route",
    summary: "Refactored the sitemap.ts file from Next.js dynamic multi-sitemap index splitting into a single, unified XML sitemap route. This fixes 404 router errors in local development environments.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Bug Fix", "SEO"],
    features: [
      { icon: Sparkles, text: "Removed generateSitemaps index split logic in sitemap.ts, merging all static and dynamic paths into a single XML payload returned directly from the default sitemap handler." }
    ]
  },
  {
    version: "v2.49.0",
    date: "August 4, 2026",
    title: "Root Layout Script Tag Placement Fix",
    summary: "Fixed a console warning/error regarding script tags nested inside React components by moving the Next.js Script tag outside of the head element and directly into the body in layout.tsx.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Bug Fix", "Performance"],
    features: [
      { icon: Sparkles, text: "Moved Cloudflare Turnstile Script component from inside head to body in layout.tsx." }
    ]
  },
  {
    version: "v2.48.0",
    date: "August 4, 2026",
    title: "Last Week Section Ad Placement Adjustment",
    summary: "Adjusted the second promoted ad placement in the Last Week section to render after the 4th product (index 3) instead of after the 2nd product (index 1).",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Marketing"],
    features: [
      { icon: Sparkles, text: "Changed the ad placement row index in the Last Week feed section map from 1 to 3 (after the 4th product)." }
    ]
  },
  {
    version: "v2.47.0",
    date: "August 4, 2026",
    title: "Last Week Section Promoted Ad Configuration",
    summary: "Relocated the second promoted ad block from Today's section to the Last Week section. Replaced the Neon banner with the standard IndiHunt horizontal banner, configured to display after the 2nd product (index 1) and in the section empty-state fallback.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Marketing"],
    features: [
      { icon: Sparkles, text: "Moved the second ad banner from Today to the Last Week section, matching index 1 (after the 2nd product)." },
      { icon: Sparkles, text: "Updated ad banner image to /indihunt_horizontal_banner.webp pointing to the /advertise page." }
    ]
  },
  {
    version: "v2.46.0",
    date: "August 4, 2026",
    title: "Double Promoted Ad Placement on Landing Page",
    summary: "Restored the second promoted ad placement on the landing page. Configured a Neon Serverless Postgres ad banner to display inside Today's section (both in empty state fallback and after the 5th product).",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Marketing"],
    features: [
      { icon: Sparkles, text: "Added the Neon Serverless Postgres ad banner in Today's feed section under empty-state fallback and index 4 (after 5th product)." }
    ]
  },
  {
    version: "v2.45.0",
    date: "August 4, 2026",
    title: "Global Back-to-Top Button",
    summary: "Implemented a global 'ScrollToTop' component inside the root layout that displays a floating, semi-transparent arrow-up button when the user scrolls past the height of the viewport, taking them back to the top smoothly when clicked.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "New Feature"],
    features: [
      { icon: Sparkles, text: "Created the ScrollToTop component with scroll detection, smooth scrolling, and semi-transparent styling." },
      { icon: Sparkles, text: "Integrated the ScrollToTop component globally in layout.tsx." }
    ]
  },
  {
    version: "v2.44.0",
    date: "August 4, 2026",
    title: "Icon-Only Navbar Buttons on Mobile",
    summary: "Refactored the Submit and Subscribe buttons in the Navbar to display only their respective icons (Plus and Mail) on mobile screens, preserving horizontal space while showing text on larger screens.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Improvement", "Mobile"],
    features: [
      { icon: Sparkles, text: "Wrapped Submit and Subscribe text in hidden sm:inline spans and configured circular padding classes for mobile views." }
    ]
  },
  {
    version: "v2.43.0",
    date: "August 4, 2026",
    title: "Navbar Button Sizes Uniformity",
    summary: "Decreased the size of the 'Submit' and 'Subscribe' buttons in the Navbar to exactly match the height, padding, font weight, and size of the 'Log In' button.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Improvement"],
    features: [
      { icon: Sparkles, text: "Updated className properties of Submit and Subscribe buttons to use font-semibold text-sm px-5 py-2, matching the Log In button design." }
    ]
  },
  {
    version: "v2.42.0",
    date: "August 4, 2026",
    title: "Navbar Subscribe Button for Logged-Out Users",
    summary: "Added a 'Subscribe' button next to the 'Log In' button in the Navbar for logged-out users, which directs them to the /newsletter subscription page.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "New Feature"],
    features: [
      { icon: Sparkles, text: "Added the Subscribe link button to Navbar when activeUser is null, linking to the newsletter page." }
    ]
  },
  {
    version: "v2.41.0",
    date: "August 4, 2026",
    title: "Instant Login/Logout Cache Seeding",
    summary: "Implemented instant cache synchronization across auth transitions in providers.tsx. Seeds TanStack Query query caches for products and discussions dynamically to prevent page flashes and layout shifts during logins and logouts.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "Improvement"],
    features: [
      { icon: Sparkles, text: "Seeded localUser and session.user products and discussions caches instantly from guest session data during login." },
      { icon: Sparkles, text: "Copied active products and discussions caches to the guest cache instantly when logging out." }
    ]
  },
  {
    version: "v2.40.0",
    date: "August 4, 2026",
    title: "SPA Logout & Submit Visibility Update",
    summary: "Replaced window.location.href reloads on signout with smooth, SPA client-side routing using Next.js router. Extracted the Submit button in the Navbar to render only for logged-in users.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "UI"],
    features: [
      { icon: Sparkles, text: "Removed window.location.href full-page refreshes from signOut() and handleSignOut(), replacing with client-side router navigation." },
      { icon: Sparkles, text: "Restricted the Navbar's Submit button to only render when a user is authenticated." }
    ]
  },
  {
    version: "v2.39.0",
    date: "August 4, 2026",
    title: "Sign-Out Double Redirect Fix",
    summary: "Fixed an issue where signing out caused the page to load or redirect twice, by removing the duplicate redirect call in the Navbar component.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement"],
    features: [
      { icon: Sparkles, text: "Removed duplicate window.location.href assignment on Navbar signout that conflicted with signOut()'s internal redirect." }
    ]
  },
  {
    version: "v2.38.0",
    date: "August 4, 2026",
    title: "LLM Information Profile Update",
    summary: "Updated the llm.txt file located in the public directory to accurately reflect the IndiHunt platform, its page structures, categories, and attribution requirements.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Documentation"],
    features: [
      { icon: Sparkles, text: "Corrected all page URLs and descriptions in llm.txt to point to IndiHunt rather than Product Hunt." }
    ]
  },
  {
    version: "v2.37.0",
    date: "August 4, 2026",
    title: "Legal Pages Implementation",
    summary: "Created comprehensive, text-based legal pages for Privacy Policy, Cookie Policy, and Terms of Service, satisfying the extensive 2000+ words requirement per page and matching the platform's aesthetics.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Legal"],
    features: [
      { icon: Sparkles, text: "Created the Privacy Policy page under /privacy with detailed clauses on data processing, user rights, and contact details." },
      { icon: Sparkles, text: "Created the Cookie Policy page under /cookies explaining essential, functional, analytical, and marketing cookies." },
      { icon: Sparkles, text: "Created the Terms of Service page under /terms defining account rules, content moderation constraints, and user conduct guidelines." }
    ]
  },
  {
    version: "v2.36.0",
    date: "August 4, 2026",
    title: "Maker Comment Enhancements",
    summary: "Enhanced maker comments on the product page with a 📌 pin emoji on the maker's first (launch) comment and a product icon + name card displayed alongside every maker comment for instant context.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "New Feature"],
    features: [
      { icon: Sparkles, text: "Added 📌 pin emoji on the maker's first top-level comment (the launch comment)." },
      { icon: ShieldCheck, text: "Added a product icon + name card below the header row for every comment made by the maker." }
    ]
  },
  {
    version: "v2.35.0",
    date: "August 4, 2026",
    title: "Global Font Weight Decrease",
    summary: "Decreased all Tailwind font weight classes by one level across every page and component (70 files, 1912 replacements) for a lighter, more modern typographic feel.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Typography"],
    features: [
      { icon: Sparkles, text: "font-black → font-extrabold, font-extrabold → font-bold, font-bold → font-semibold, font-semibold → font-medium, font-medium → font-normal." }
    ]
  },
  {
    version: "v2.34.0",
    date: "August 4, 2026",
    title: "Mockup-Accurate Hexagon Profile Badges",
    summary: "Replaced the generic profile page badges with customized SVG-based Hexagon Badges matching the design specifications exactly (solid colors, dual-tone split-hexagon fill, inline text symbols/emojis, and badge values).",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "New Feature"],
    features: [
      { icon: Sparkles, text: "Created the HexagonBadge SVG component to render exact colors and shapes for Tastemaker, Gone streaking, Gone streaking 5, and Gone streaking 10." },
      { icon: ShieldCheck, text: "Configured conditional, database-driven badge rendering based on user karma_points and streak_count." }
    ]
  },
  {
    version: "v2.33.0",
    date: "August 4, 2026",
    title: "Launch Schedule Widget Hover Removal",
    summary: "Removed hover interaction effects (background color changes, shifts, and transitions) from the LaunchScheduleWidget to keep its visual state flat, static, and stable.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Refactoring"],
    features: [
      { icon: Sparkles, text: "Removed hover color changes and translate-y transitions from the minimized widget box." },
      { icon: ShieldCheck, text: "Removed hover background overlays (hover:bg-orange-500/5) from card action list items in the expanded panel." }
    ]
  },
  {
    version: "v2.32.0",
    date: "August 4, 2026",
    title: "Navbar Dropdown Font Weight Adjustments",
    summary: "Decreased the font weight in all navbar dropdown menus (Categories, Launches, News, Discussions, and Submit) from bold/semibold to font-normal for a cleaner, unified, and more modern typography system.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Typography"],
    features: [
      { icon: Sparkles, text: "Updated item labels and link actions in all header dropdown menus to use font-normal." }
    ]
  },
  {
    version: "v2.31.0",
    date: "August 4, 2026",
    title: "Profile Dropdown Styling Modifications",
    summary: "Modified styling in the user profile dropdown: changed the color of 'Admin Panel' and 'Sign Out/Logout' options to black/foreground (using hover:bg-muted) and decreased the font weight to font-normal for a cleaner visual hierarchy.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Refactoring"],
    features: [
      { icon: Sparkles, text: "Changed color of 'Admin Panel' and 'Sign Out' options to standard text-foreground/hover:bg-muted in both desktop and mobile dropdowns." },
      { icon: ShieldCheck, text: "Decreased font weight from font-semibold to font-normal on dropdown items for a cleaner aesthetic." }
    ]
  },
  {
    version: "v2.30.0",
    date: "August 4, 2026",
    title: "Profile Transition State Reset Fix",
    summary: "Fixed a state retention bug on the Profile page when navigating between different user profiles. Instantly resets the profile state, load flags, lists, collections, and stories to prevent showing the logged-in user's profile metadata during routing transitions.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Bug Fix", "Profile"],
    features: [
      { icon: Sparkles, text: "Implemented immediate state reset of profile data, collections, stack, stories, upvotes, and reviews upon navigation transitions." },
      { icon: ShieldCheck, text: "Fixed initialization check to ensure it only initializes profile from local reduxProfile if target user is self." }
    ]
  },
  {
    version: "v2.29.0",
    date: "August 4, 2026",
    title: "Dynamic Profile Links & Custom Logo Icons",
    summary: "Integrated custom input fields for GitHub and Personal Website URLs in profile settings, and updated the Profile page to dynamically render all active links (Website, LinkedIn, Twitter/X, GitHub) with matching logo icons.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Profile", "UI"],
    features: [
      { icon: Sparkles, text: "Added settings inputs to edit and save personal website and GitHub profile URLs." },
      { icon: Palette, text: "Replaced uniform ExternalLink icons with custom brand icons for GitHub, LinkedIn, and Twitter/X." },
      { icon: ShieldCheck, text: "Cleaned up the website label bug (previously hardcoded as LinkedIn Profile for personal websites)." }
    ]
  },
  {
    version: "v2.28.0",
    date: "August 4, 2026",
    title: "Cleaned up Pages & Added Product Badges",
    summary: "Removed dedicated Student Showcase (/student-showcase) and Open Source (/open-source) pages, and instead integrated dynamic 'Open Source' and 'Student' badges directly onto the homepage product cards.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Refactoring", "Removal"],
    features: [
      { icon: Sparkles, text: "Added dynamic 'Open Source' and 'Student' badges to homepage product cards based on product tags/metadata." },
      { icon: ShieldCheck, text: "Removed `/student-showcase` and `/open-source` pages and layouts." },
      { icon: Package, text: "Cleaned up references in Navbar, Sitemap, Robots.txt, Search, and FAQ sections." }
    ]
  },
  {
    version: "v2.27.0",
    date: "August 4, 2026",
    title: "Removed Golden Diya Awards Page",
    summary: "Removed the Golden Diya Awards (/awards) page, trophy image asset, and all its references in Navbar, Footer, and Sitemap to streamline the platform's focus.",
    icon: ShieldCheck,
    iconColor: "text-red-500",
    iconBg: "bg-red-500/10",
    tags: ["Removal", "Refactoring"],
    features: [
      { icon: ShieldCheck, text: "Removed `/awards` route and layout." },
      { icon: Package, text: "Cleaned up references to Awards in Navbar and Footer components." },
      { icon: Database, text: "Updated sitemap.ts to remove the static `/awards` route." }
    ]
  },
  {
    version: "v2.26.0",
    date: "August 3, 2026",
    title: "Enterprise Admin Console — Full Rebuild with Pagination & Server Actions",
    summary: "Rebuilt the entire admin panel as a componentized enterprise-grade control centre. Fixed sidebar with independent scroll, 9 management sections (users, products, comments, reviews, reports, stories, ads, notifications, forums), server-side pagination using Supabase .range() + count, 300ms debounced URL-driven search, parallel Suspense-wrapped dashboard stats, and Next.js Server Actions for all mutations. Middleware-level Edge auth guard ensures only admins reach /admin/*.",
    icon: ShieldCheck,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Admin", "New Feature", "Performance", "Security"],
    highlight: true,
    features: [
      { icon: ShieldCheck, text: "Edge Middleware Auth Guard: Admin role verified at the Edge before any React component runs. Non-admins instantly redirected to homepage." },
      { icon: Database, text: "Full Server-Side Pagination: Every data section uses Supabase .range() + count: 'exact' with windowed page buttons, per-page selector (20/50/100), and URL-preserved state." },
      { icon: Search, text: "Debounced URL-Driven Search: 300ms debounce pushes ?q= to URL, enabling server-side ilike queries. State preserved on page refresh and shareable by URL." },
      { icon: Layers, text: "9 Admin Sections: Dashboard, Users & Roles, Products, Comments, Reviews, All Reports (thread/product/comment), Stories, Ad Campaigns, Notifications, Forums — each as a separate route." },
      { icon: Sparkles, text: "Parallel Suspense Dashboard: Dashboard stat cards each fire their own concurrent DB query. Shell loads instantly while cards stream in independently." },
      { icon: Zap, text: "Next.js Server Actions for Mutations: Feature product, delete comment, cycle user role, dismiss reports — all via Server Actions with revalidatePath. No client-side state management needed." },
      { icon: BarChart2, text: "Platform Stats Page: 30-day growth metrics, Top 10 products by upvotes, Top 10 users by karma with concurrent Suspense boundaries." },
      { icon: Code2, text: "Migration 56: Admin RLS policies granting admins delete access to comments, reviews, stories, and full access to all report tables and ad campaigns." },
    ]
  },
  {
    version: "v2.25.0",
    date: "August 3, 2026",
    title: "Admin Moderation Dashboard & User Role Access Control",
    summary: "Built migration 55 adding role column to public.profiles, Navbar profile dropdown Admin link for authorized admins, and a full Admin Dashboard (/admin) for moderating products, user roles, content reports, and community activity.",
    icon: ShieldCheck,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Admin", "Moderation", "Security", "New Feature"],
    highlight: true,
    features: [
      { icon: ShieldCheck, text: "User Role Access Control: Migration 55 adds role column (user, admin, moderator) allowing changing any user to an admin directly in DB or Admin Panel." },
      { icon: Users, text: "Admin Navigation Link: Added Admin Panel item with shield badge in user profile dropdown menu when logged in as an admin." },
      { icon: Package, text: "Admin Dashboard Console: Interactive management console at /admin with tabs for Products, Users & Roles, Reports, and Community Activity." }
    ]
  },
  {
    version: "v2.24.0",
    date: "August 2, 2026",
    title: "Comment Share Popover & Direct URL Comment Highlighting",
    summary: "Added Product Hunt style Share menu on product comments (Facebook, X, Embed, and Copy Link) with URL query parameter deep-linking (?comment={id}) and warm container highlighting.",
    icon: Share2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Product Page", "Social Sharing", "Comments", "New Feature"],
    highlight: true,
    features: [
      { icon: Share2, text: "Comment Share Popover: Integrated Radix UI dropdown on comment action rows with options to share to Facebook, X, generate iframe embed, or copy direct comment link." },
      { icon: Sparkles, text: "Deep Link Comment Highlighting: Visiting /products/{slug}?comment={id} automatically scrolls to the target comment and highlights it with a warm orange border and backdrop ring." }
    ]
  },
  {
    version: "v2.23.0",
    date: "August 2, 2026",
    title: "Account Deactivation, Data Anonymization & Privacy Protection",
    summary: "Built migration 54 for account deactivation and PII anonymization. Added Deactivate Account and Delete Account actions in user settings with product retention rules (all submitted products remain live on IndiHunt).",
    icon: ShieldCheck,
    iconColor: "text-red-500",
    iconBg: "bg-red-500/10",
    tags: ["Privacy", "Security", "Settings", "New Feature"],
    highlight: true,
    features: [
      { icon: ShieldCheck, text: "Product Retention Guarantee: Ensured user account deletion purges PII while preserving launched products on IndiHunt so community links and upvote counts stay intact." },
      { icon: Rocket, text: "Comment & Post Anonymization: Anonymized user attribution on comments and forum posts to 'Deleted User' for thread continuity." },
      { icon: Database, text: "Supabase Migration 54 & Danger Zone UI: Added deactivateUserAccount and deleteUserAccount functions with double-confirmation dialogs in profile settings." }
    ]
  },
  {
    version: "v2.22.0",
    date: "August 2, 2026",
    title: "Granular Notification Settings, Lucide Icons & OneSignal Web Push",
    summary: "Built migration 53 for notifications and user_notification_settings, added QStash & Redis notification worker API, OneSignal web push integration module, and redesigned user profile notification preferences with clean Lucide React icons.",
    icon: Bell,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Notifications", "Settings", "Push", "New Feature"],
    highlight: true,
    features: [
      { icon: Bell, text: "Granular Notification Preferences: Designed Product Hunt layout with toggles for product updates, forum threads, feedback, follower alerts, mentions, auto-follow, and unsubscribe all." },
      { icon: Rocket, text: "OneSignal Web Push Integration: Created src/lib/onesignal.ts module initialized for browser push notifications, ready for OneSignal API keys." },
      { icon: Database, text: "Supabase Migration 53 & QStash Worker: Created notifications and user_notification_settings schema with RLS policies, DB helper functions, and background queue processor route." }
    ]
  },
  {
    version: "v2.21.0",
    date: "August 2, 2026",
    title: "Product Hunt Notification System & Rich Activity Cards",
    summary: "Implemented Product Hunt style notification system with hunted alerts, forum moderation updates, following activity feeds, dual avatar overlays, rounded pill action buttons, and a standalone /notifications page.",
    icon: Bell,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Notifications", "Feed", "Design", "New Feature"],
    highlight: true,
    features: [
      { icon: Bell, text: "Product Hunt Notification Parity: Designed hunted alerts ('Rohan hunted Zinley'), thread rejection status ('Your thread in p/general has been rejected'), and following activity cards ('Because you follow Kopai...')." },
      { icon: Sparkles, text: "Dual Avatar Overlays & Pill Actions: Rendered secondary user avatar badges, category badges, body preview snippets, and rounded pill buttons ('View launch', 'View forum guidelines')." },
      { icon: Database, text: "Standalone Page & Drawer Sync: Built /notifications route and synced getNotifications, markNotificationAsRead, and markAllNotificationsAsRead with Supabase and localStorage fallback." }
    ]
  },
  {
    version: "v2.20.0",
    date: "August 2, 2026",
    title: "Thread Comments Edit, Delete & Interactive Moderation",
    summary: "Brought feature parity between product detail comments and discussion thread replies by adding inline Edit, Delete, Report Modal, and 3-dots dropdown options for thread comments.",
    icon: MessageSquare,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-[#ff5733]/10",
    tags: ["Discussions", "Comments", "Moderation", "New Feature"],
    highlight: true,
    features: [
      { icon: MessageSquare, text: "Thread Reply Edit & Delete: Allowed comment authors to edit their thread replies inline or delete them with confirmation." },
      { icon: Shield, text: "Thread Comment Moderation: Added 3-dots dropdown menu with Report action triggering ReportModal for discussion thread comments." },
      { icon: Database, text: "Supabase & LocalStorage Parity: Integrated updateComment and deleteComment helper functions with automatic cache invalidation." }
    ]
  },
  {
    version: "v2.19.0",
    date: "August 2, 2026",
    title: "Unified Report Modal & Enhanced Comment/Thread Moderation",
    summary: "Launched a dedicated, interactive ReportModal component matching exact custom UI design for reporting comments, discussion threads, and products with pre-configured reasons, moderation checks, and localStorage dev fallback.",
    icon: Shield,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-500/10",
    tags: ["Moderation", "Component", "Security", "UI"],
    highlight: true,
    features: [
      { icon: Shield, text: "Interactive Report Modal: Built custom modal popover with radio selections for Spam, Duplicate, Harmful, Not Working, Self-promotion, and AI-generated content." },
      { icon: Sparkles, text: "Content Moderation Integration: Automated checkContentViolation checks on report descriptions before DB/localStorage write." },
      { icon: Database, text: "Supabase & LocalStorage Fallback: Supported thread_reports (migration 52) and comment_reports (migration 17) schema with offline dev persistence." }
    ]
  },
  {
    version: "v2.18.0",
    date: "August 2, 2026",
    title: "Forum Category Headers, Thread Banners & Discussion UI Refinement",
    summary: "Added dynamic category header banners with custom descriptions, icons, and pill buttons for all forum channels (p/general, p/vibecoding, p/ask, etc.), introduced mobile horizontal category filters, and standardized thread and comment UI colors.",
    icon: MessageSquare,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Discussions", "Categories", "Banners", "Mobile"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Dynamic Forum Banners: Added category-specific header cards with descriptions, icons, and Start New Thread pill buttons on discussions and thread pages." },
      { icon: Layers, text: "Mobile Horizontal Category Slider: Implemented horizontal scrollable category pill bar for seamless mobile navigation across forum categories." },
      { icon: Palette, text: "Comment & Discussion Styling: Standardized comment body text, author badges, and upvote box colors using theme variables." }
    ]
  },
  {
    version: "v2.17.0",
    date: "August 2, 2026",
    title: "Universal Card Typography & Design System Standardization",
    summary: "Standardized card title font sizes (16px text-base font-medium text-foreground/90), tagline descriptions (16px text-base text-foreground/80), metadata lines (14px text-sm font-medium), and action boxes (size-12) across all feeds, discussions, stories, categories, leaderboards, and daily news pages to match the main landing page product card design system.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Typography", "Standardization", "Cards"],
    highlight: true,
    features: [
      { icon: Palette, text: "Main Page Card Typography Parity: Standardized card titles to 16px font-medium text-foreground/90 with coral hover transitions (#ff5733) across all feeds." },
      { icon: Sparkles, text: "Taglines & Descriptions: Updated body text to 16px text-base text-foreground/80 with line-clamp truncation and generous leading." },
      { icon: Users, text: "Author & Category Meta: Standardized author bylines, handles, and category badges to text-sm font-medium text-muted-foreground." },
      { icon: Award, text: "Streak, Leaderboard & News Pages: Aligned Karma Leaderboard, Streak Tracker, Daily News, Stories, and Category pages to identical card dimensions and typography." }
    ]
  },
  {
    version: "v2.16.0",
    date: "August 1, 2026",
    title: "Navbar Redesign & Feed Streamlining",
    summary: "Overhauled top Navigation Bar height, item font sizes, pill search input, rounded-full action buttons, and product card feed alignment matching Product Hunt layout standards.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement", "Navbar", "Feed"],
    highlight: true,
    features: [
      { icon: Palette, text: "Navbar Size Overhaul: Increased header height (h-20) and item font sizes to text-base (16px) with generous 24px-32px spacing for high-density readability." },
      { icon: Search, text: "Search & Actions: Redesigned search bar to pill shape with ⌘K keyboard badge, rounded-full Submit button, and circular icon triggers." },
      { icon: Sparkles, text: "Feed Simplification: Removed QS and ES badges from feed product cards and hidden the message comment box on mobile screens to prioritize the upvote action." }
    ]
  },
  {
    version: "v2.15.0",
    date: "August 1, 2026",
    title: "Brand Entity Recognition & SEO Overhaul",
    summary: "Comprehensive SEO cleanup eliminating obsolete meta tags, removing unverified rating schemas, refactoring XML sitemaps into a multi-sitemap index, adding BreadcrumbList schema, and strengthening Organization brand entity schema.",
    icon: Globe,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["SEO", "Brand Entity", "Sitemap", "Structured Data"],
    highlight: true,
    features: [
      { icon: Globe, text: "Brand Entity Schema: overhauled Organization JSON-LD with real founder credentials (Himanshu Sharma, Founder & CEO), founding date (2026), and support contact link." },
      { icon: Layers, text: "Multi-Sitemap Index: refactored /sitemap.xml into a Next.js 15 sitemap index separating static pages, products, makers, threads, and stories across child sitemaps." },
      { icon: Shield, text: "Metadata & Schema Cleanup: removed ignored meta keywords, non-standard AI meta tags, unverified AggregateRating schema, and relocated FAQPage schema to pages with matching visible content." },
      { icon: Code2, text: "Breadcrumb Schema: added BreadcrumbList JSON-LD to product detail pages for improved search engine result representation." }
    ]
  },

  {
    version: "v2.14.0",
    date: "August 1, 2026",
    title: "Progressive Web App (PWA) Support & Chrome Native Install Prompt Modal",
    summary: "Converted IndiHunt into a full-featured Progressive Web App (PWA) with a Web App Manifest, Service Worker offline caching, and automatic Chrome install prompt modal on website launch.",
    icon: Smartphone,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "PWA", "Mobile", "Chrome Install"],
    highlight: true,
    features: [
      { icon: Smartphone, text: "Progressive Web App: added public/manifest.json and public/sw.js for standalone PWA display and offline cache capability." },
      { icon: Sparkles, text: "Chrome Native Install Prompt: integrated PwaInstallPrompt component to capture beforeinstallprompt event and present a styled 'Install IndiHunt App' modal pop-up on website launch." },
      { icon: Download, text: "One-Click Native Install: clicking 'Install Now' inside the modal invokes Chrome's native install dialog directly." }
    ]
  },

  {
    version: "v2.13.0",
    date: "August 1, 2026",
    title: "Homepage Feed Clean Up & Ad Card Display Optimization",
    summary: "Removed SponsoredAd placement from the main landing page feed and simplified SponsoredAd component card rendering by removing the secondary description string.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Ad Engine", "Design"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Best Products Ad Placement: added SponsoredAd placement into `/best-products` leaderboard list and launch archive sidebar." },
      { icon: Palette, text: "Streamlined Ad Display: updated SponsoredAd component to display only headline without description." }
    ]
  },
  {
    version: "v2.11.0",
    date: "August 1, 2026",
    title: "Profile Authorization Fix & SSR Hydration Guard",
    summary: "Fixed Profile ownership verification so 'Edit Profile' and settings controls are hidden when viewing other makers' profiles (e.g. via /@username), and resolved React SSR hydration mismatches in Navbar.",
    icon: Shield,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Profile", "Authorization", "Fix"],
    highlight: true,
    features: [
      { icon: Shield, text: "Profile Ownership Check: updated isOwnProfile calculation to compare profile.id with logged-in user.id when viewing external maker handles." },
      { icon: Zap, text: "SSR Hydration Guard: ensured Navbar client-side mounted state avoids rendering mismatches during initial React hydration." }
    ]
  },
  {
    version: "v2.12.0",
    date: "August 1, 2026",
    title: "Fair Cycle-Aware Round-Robin Ad Rotation Engine",
    summary: "Refactored the ad selection algorithm in /api/ads and SponsoredAd to track seen campaign IDs per session, guaranteeing that all active ad campaigns cycle fairly across page views instead of repeating the same ad.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Ad Engine", "Rotation", "Ad Campaigns", "Fix"],
    highlight: true,
    features: [
      { icon: Zap, text: "Cycle-Aware Ad Selection: updated /api/ads endpoint to prioritize unseen active campaigns in the current session cycle." },
      { icon: Sparkles, text: "Client Session Ad Tracking: configured SponsoredAd to persist seen ad IDs in sessionStorage and pass seenAdIds in API requests." },
      { icon: Layers, text: "Home Feed Sponsored Ads: integrated SponsoredAd placement into the main homepage feed for dynamic ad campaign visibility." }
    ]
  },
  {
    version: "v2.11.0",
    date: "August 1, 2026",
    title: "Persistent Orange Upvote Color & Universal Desktop Navbar Search",
    summary: "Fixed upvoted orange highlight persistence across page refreshes by synchronizing user upvote IDs with client cache/localStorage, and enabled the desktop Search Bar universally across all Navbar instances.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Upvote Persistence", "Navbar", "Search", "Fix"],
    highlight: true,
    features: [
      { icon: Zap, text: "Persistent Upvote Highlight: synced upvoted product IDs in getProductsRaw, getCachedProducts, getProductById, and local storage so upvoted orange status remains active after page reload." },
      { icon: Search, text: "Universal Desktop Search Bar: rendered top Navbar search bar on all subpages with internal state handling and search routing." },
      { icon: Code2, text: "User-Scoped Query Keys: updated useProducts and useProduct React Query keys to include currentUserId, ensuring immediate re-evaluation on auth state changes." }
    ]
  },
  {
    version: "v2.10.0",
    date: "August 1, 2026",
    title: "Multi-Entity Vector & Semantic Search (Products, Threads, Makers)",
    summary: "Introduced a dynamic TF-IDF char n-gram vector embedding engine with cosine similarity scoring to search across Products, Discussion Threads, and Makers simultaneously with real-time similarity match badges.",
    icon: Search,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-[#ff5733]/10",
    tags: ["New Feature", "Vector Search", "Performance"],
    highlight: true,
    features: [
      { icon: Search, text: "Multi-Entity Search Engine: unified vector search across Products, Discussion Threads, and Users/Makers in performVectorSearch." },
      { icon: Zap, text: "Vector Match Badges: real-time vector similarity relevance scoring displayed on search result cards (e.g. 95% Vector Match)." },
      { icon: Layers, text: "All Results Tab: unified feed ranking products, threads, and makers by calculated cosine similarity scores." }
    ]
  },
  {
    version: "v2.09.0",
    date: "August 1, 2026",
    title: "Instant Product Feed Hydration & Fixed Login Product Reloading",
    summary: "Unified React Query feed keys to ['products'] and ['threads'] and updated withCache in Supabase helper so logging in instantly reuses existing product cache without re-fetching or reloading product lists.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Login", "Feed", "Performance"],
    highlight: true,
    features: [
      { icon: Code2, text: "Stable Feed QueryKey: unified useProducts and useThreads to use stable ['products'] and ['threads'] keys across auth transitions." },
      { icon: Code2, text: "Instant Fallback Hydration: withCache instantly hydrates user-specific product requests from guest cache without blocking the UI." }
    ]
  },
  {
    version: "v2.08.0",
    date: "August 1, 2026",
    title: "Smooth Auth State Transition & Cache Retention",
    summary: "Fixed product data reloading on login and logout by enabling cross-session React Query cache retention in useProducts/useThreads and replacing hard window.location reloads with client-side Next.js navigation.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Auth", "Performance", "Cache"],
    highlight: true,
    features: [
      { icon: Code2, text: "Cache Retention: updated useProducts and useThreads placeholderData to reuse existing product lists during auth state transitions." },
      { icon: Code2, text: "Client-Side Sign Out: replaced window.location.href hard reloads in Navbar with smooth client-side router navigation." }
    ]
  },
  {
    version: "v2.07.0",
    date: "August 1, 2026",
    title: "Mobile Hamburger Menu Profile Section & Top Search Bar",
    summary: "Integrated a dedicated 'My Profile' accordion section into the mobile hamburger drawer (with Profile, My Products, Settings, and Logout options) and placed a permanent search bar at the very top of the mobile drawer menu.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Mobile", "Navigation", "UI"],
    highlight: true,
    features: [
      { icon: Code2, text: "Mobile Hamburger Search: permanent search bar embedded at top of mobile hamburger menu with direct navigation handling." },
      { icon: Code2, text: "My Profile Sub-Menu: collapsible profile menu positioned at the very bottom of the drawer menu." },
      { icon: Code2, text: "Single Accordion Behavior: opening any drawer sub-menu automatically closes all other active sub-menus." },
      { icon: Code2, text: "Navbar Cleanup: removed Awards, Makers, and Advertise links from navigation." }
    ]
  },
  {
    version: "v2.06.0",
    date: "August 1, 2026",
    title: "Sponsored Product Card Logo Resolution & Fallback System",
    summary: "Fixed sponsored ad product cards so product logos are accurately resolved and displayed from joined product records, local cache, or dynamic API endpoint with domain favicon fallbacks.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Ads", "Products", "UI"],
    highlight: true,
    features: [
      { icon: Code2, text: "Product Logo API: added `/api/products/logo` GET route to resolve and serve product logos by ID or slug." },
      { icon: Code2, text: "Multi-Tier Logo Fallback: updated SponsoredAd component to resolve logo_url from product join, local storage, product lookup, or domain favicon fallback." },
      { icon: Code2, text: "Ad Engine Sync: updated `/api/ads` endpoint to ensure ad payloads return linked product logo_url." }
    ]
  },
  {
    version: "v2.05.0",
    date: "July 31, 2026",
    title: "Conditional Pre-Launch Button in My Products Dashboard",
    summary: "Updated the My Products & Launches dashboard so that the Pre-Launch Dashboard button is only shown for upcoming scheduled products and automatically removed once a product goes live.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Dashboard", "Products", "UI"],
    highlight: false,
    features: [
      { icon: Code2, text: "Live Product Actions: launched products now exclusively display 'Launch dashboard' and 'View' buttons." },
      { icon: Code2, text: "Scheduled Product Actions: scheduled products display 'Pre-launch dashboard' and 'Settings' buttons prior to launch." }
    ]
  },
  {
    version: "v2.04.0",
    date: "July 31, 2026",
    title: "Removed Auto-Generated 'Built With' Fallback Shoutouts",
    summary: "Removed the automatic fallback logic that inserted default catalog products (Caloi, Ducat India, Zotion) when a product has 0 shoutouts, ensuring empty shoutout lists remain clean.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Shoutouts", "Products", "UI"],
    highlight: true,
    features: [
      { icon: Code2, text: "Clean Shoutouts: disabled automatic insertion of default fallback products (Caloi, Ducat India, Zotion)." },
      { icon: Code2, text: "Accurate Representation: products with no shoutouts entered will accurately display zero Built With items." }
    ]
  },
  {
    version: "v2.03.0",
    date: "July 31, 2026",
    title: "Inline 20-Item 'Load More' Pagination for Upcoming Launches",
    summary: "Replaced the external navigation link on the upcoming feed section with an inline 'Load 20 More Upcoming Launches' button to load products progressively without leaving the page.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feed", "Upcoming", "Pagination"],
    highlight: true,
    features: [
      { icon: Code2, text: "Inline Pagination: clicking 'Load 20 More' appends +20 products inline without navigating away to /best-products." },
      { icon: Code2, text: "Progress Counter: displays real-time loaded vs total scheduled launch count (e.g. 20 of 45)." }
    ]
  },
  {
    version: "v2.02.0",
    date: "July 31, 2026",
    title: "Expanded Upcoming Launches Feed to 20 Items & Schema Resilience",
    summary: "Increased the upcoming products feed display capacity to 20 items and added fallback handling for missing funding_type column schema errors.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feed", "Upcoming", "Supabase"],
    highlight: true,
    features: [
      { icon: Code2, text: "Upcoming Launches Feed: expanded feed section limit from 5 to 20 products." },
      { icon: Code2, text: "Supabase Schema Resilience: added retry fallback handling for missing `funding_type` column (PGRST204) during product insertion and updates." }
    ]
  },
  {
    version: "v2.01.0",
    date: "July 31, 2026",
    title: "Unified & Simplified Auth Labels to 'Log In'",
    summary: "Updated all auth entry points across header navbar, mobile drawer, advertise portal, auth modal, and welcome tour to exclusively use 'Log In'.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Auth", "UI", "Branding"],
    highlight: true,
    features: [
      { icon: Code2, text: "Navbar & Mobile Auth CTA: updated buttons from 'Log In / Sign Up' to 'Log In'." },
      { icon: Code2, text: "Auth Modal Title: updated header from 'Sign up on IndiHunt' to 'Log in to IndiHunt'." },
      { icon: Code2, text: "Welcome Tour & Portal CTAs: aligned Tour finish button and campaign sign-in prompt to 'Log In'." }
    ]
  },
  {
    version: "v2.00.0",
    date: "July 31, 2026",
    title: "Streamlined 6-Step Welcome Tour & Log In / Sign Up Focus",
    summary: "Streamlined the Welcome Tour flow to 6 total steps, focusing the final 6th step directly on the Log In / Sign Up button in the header navbar.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Tour", "Spotlight", "Auth"],
    highlight: true,
    features: [
      { icon: Code2, text: "Final Step Alignment: bound `id='login-btn'` to the Log In / Sign Up button in `Navbar.tsx`." },
      { icon: Code2, text: "Optimized Tour Flow: updated step 6 ('Join the Community') to spotlight the auth button group and removed redundant 7th step." }
    ]
  },
  {
    version: "v1.99.0",
    date: "July 31, 2026",
    title: "Welcome Tour Step 5 Navigation Bar Spotlight Target",
    summary: "Updated step 5 of the Welcome Tour ('Explore & Navigate') to target and spotlight the header navigation bar menu (Launches, News, Discussions).",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Tour", "Spotlight", "Navbar"],
    highlight: true,
    features: [
      { icon: Code2, text: "Navbar Menu Spotlight: bound `id='navbar-menu'` to the desktop navigation bar in `Navbar.tsx`." },
      { icon: Code2, text: "Tour Step Alignment: updated step 5 (`targetId: 'navbar-menu'`) in `WelcomeTour.tsx` to highlight the navigation menu bar." }
    ]
  },
  {
    version: "v1.98.0",
    date: "July 31, 2026",
    title: "Welcome Tour Step 2 Product Spotlight Focus",
    summary: "Updated step 2 of the Welcome Tour ('Discover Products') to target and spotlight the first product card on the homepage, matching the spotlight interaction of steps 3 and 4.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Tour", "Spotlight", "UI"],
    highlight: true,
    features: [
      { icon: Code2, text: "Product Card Spotlight: bound `id='first-product-card'` to the lead product row in `page.tsx`." },
      { icon: Code2, text: "Tour Step Alignment: updated step 2 (`targetId: 'first-product-card'`) in `WelcomeTour.tsx` to highlight the product card." }
    ]
  },
  {
    version: "v2.10.0",
    date: "August 1, 2026",
    title: "Updated Ad Campaign Testing Budget Cap to $100.00",
    summary: "Increased the self-serve ad campaign testing budget cap to $100.00 (with $10.00 daily limit) across creation forms and backend handlers.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Ads", "Budget", "Testing"],
    highlight: true,
    features: [
      { icon: Code2, text: "$100.00 Testing Budget Cap: updated ad campaign creation defaults and backend budget caps in `supabase.ts`, `profile/page.tsx`, `my-products/[id]/settings/page.tsx`, and `advertise/page.tsx`." }
    ]
  },
  {
    version: "v2.09.0",
    date: "August 1, 2026",
    title: "Fixed $10.00 Testing Budget Cap & Automatic $0.00 Ad Deactivation",
    summary: "Locked self-serve ad campaign creation budgets to a fixed $10.00 max for free testing (since payments are not integrated yet) and ensured campaigns automatically stop serving when remaining budget reaches $0.00.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Ads", "Budget", "Testing"],
    highlight: true,
    features: [
      { icon: Code2, text: "Fixed Testing Budget Cap: locked ad campaign budget to $10.00 max in `profile/page.tsx`, `my-products/[id]/settings/page.tsx`, and `advertise/page.tsx`." },
      { icon: Code2, text: "Backend Safeguard: capped `total_budget` & `remaining_budget` in `createAdCampaign` to prevent custom unverified inputs." },
      { icon: Code2, text: "Auto-Stop on $0.00: verified automatic deactivation to status 'completed' whenever remaining budget reaches $0.00." }
    ]
  },
  {
    version: "v2.08.0",
    date: "August 1, 2026",
    title: "Sleek Greyish Card Surface for Sponsored Ads",
    summary: "Updated the SponsoredAd card container to feature a subtle greyish backdrop surface (bg-slate-100/90 dark:bg-slate-800/60) with matching slate borders.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Ads", "Design"],
    highlight: true,
    features: [
      { icon: Code2, text: "Greyish Backdrop: styled `SponsoredAd.tsx` with `bg-slate-100/90 dark:bg-slate-800/60` and `border-slate-300/80 dark:border-slate-700/80`." }
    ]
  },
  {
    version: "v2.07.0",
    date: "August 1, 2026",
    title: "Today's Top 20 Initial Feed with Instant Full Expansion",
    summary: "Updated 'Today's Top Products' section to always show 20 products initially and display 'See all X of today's top products' whenever more than 20 products are launched today.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feed", "UI", "Navigation"],
    highlight: true,
    features: [
      { icon: Code2, text: "Top 20 Base View: Today section renders top 20 most upvoted products by default." },
      { icon: Code2, text: "Instant Full Expansion: when `today.length > 20`, clicking 'See all X of today's top products' instantly reveals all remaining launches today in-place." }
    ]
  },
  {
    version: "v2.06.0",
    date: "August 1, 2026",
    title: "Instant 'See All Today's Products' Expand Button",
    summary: "Configured 'Today's Top Products' feed section to show the top 5 products initially and render the 'See all today's products' button whenever more than 5 products are launched.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feed", "UI", "Navigation"],
    highlight: true,
    features: [
      { icon: Code2, text: "Top 5 Initial View: Today section renders top 5 products by default." },
      { icon: Code2, text: "Instant Expand Button: 'See all X of today's top products' button renders whenever `today.length > 5`, allowing users to reveal all remaining today's launches in-place." }
    ]
  },
  {
    version: "v2.05.0",
    date: "August 1, 2026",
    title: "Clean Launch Archive Product Cards (Removed Date Badge)",
    summary: "Removed the launch date badge pill from product cards on the Launch Archive page for a cleaner, minimalist row layout.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Archive", "UI", "Products"],
    highlight: true,
    features: [
      { icon: Code2, text: "Clean Card Layout: removed launch date badges from product rows in `best-products/page.tsx` and `best-products/[period]/[year]/[month]/page.tsx`." }
    ]
  },
  {
    version: "v2.04.0",
    date: "August 1, 2026",
    title: "Strict Mobile Box-Sizing & Truncation in Sponsored Ads",
    summary: "Enforced strict w-full max-w-full box-border sizing and text truncation on the SponsoredAd component to prevent any horizontal page overflow.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Mobile", "Ads", "Responsive"],
    highlight: true,
    features: [
      { icon: Code2, text: "Strict Box Sizing: applied `w-full max-w-full box-border overflow-hidden` to outer card link container." },
      { icon: Code2, text: "Text & Link Truncation: added `truncate max-w-full` on destination URL pill to guarantee zero horizontal scroll on small screens." }
    ]
  },
  {
    version: "v2.03.0",
    date: "August 1, 2026",
    title: "Responsive Sponsored Ad Card & Mobile Stacked Layout",
    summary: "Refactored SponsoredAd component layout to stack vertically on mobile screens, placing the link button below the text to eliminate horizontal overflow.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Mobile", "Ads", "Responsive"],
    highlight: true,
    features: [
      { icon: Code2, text: "Mobile Vertical Stacking: configured `flex-col sm:flex-row` on `SponsoredAd.tsx` so the action link pill sits cleanly below the title and description on small screens." },
      { icon: Code2, text: "Overflow Protection: added `overflow-hidden`, `min-w-0`, and truncation to prevent text or buttons from overflowing mobile viewports." }
    ]
  },
  {
    version: "v2.02.0",
    date: "August 1, 2026",
    title: "Compact Slim Mobile Ad Banner Heights",
    summary: "Decreased the mobile screen height of ad banners on the main feed using a sleek 4:1 aspect ratio and compact padding.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Mobile", "Ads", "Responsive"],
    highlight: true,
    features: [
      { icon: Code2, text: "Sleek Mobile Height: updated ad banners to `aspect-[4/1]` on mobile screens to reduce vertical footprint." },
      { icon: Code2, text: "Compact Padding & Badges: scaled top/bottom margins and badge offsets (`top-1.5 right-1.5`) for small viewports." }
    ]
  },
  {
    version: "v2.01.0",
    date: "August 1, 2026",
    title: "Sharp Square Corners for Home Feed Ad Banners",
    summary: "Updated the IndiHunt SaaS Launchpad and Supabase advertisement banner containers on the main page feed to use sharp, unrounded corners (rounded-none).",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Ads", "Design"],
    highlight: true,
    features: [
      { icon: Code2, text: "Square Corners: replaced `rounded-3xl` with `rounded-none` on Supabase and IndiHunt horizontal ad banner containers." }
    ]
  },
  {
    version: "v2.00.0",
    date: "August 1, 2026",
    title: "Dedicated 'Today' Section In-Place Expand & Best Products Redirects",
    summary: "Configured 'Today's Top Products' section to exclusively use in-place instant expand/collapse while preserving external '/best-products' links for Yesterday, Last Week, and Last Month sections.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feed", "UI", "Navigation"],
    highlight: true,
    features: [
      { icon: Code2, text: "Today In-Place Expand: 'Today's Top Products' section features instant inline expansion to reveal all products launched today when count exceeds 20." },
      { icon: Code2, text: "Best Products Links: 'Yesterday', 'Last Week', and 'Last Month' section buttons navigate to `/best-products?tab=...`." }
    ]
  },
  {
    version: "v1.99.0",
    date: "August 1, 2026",
    title: "Instant In-Place Section Expansion for Home Feed",
    summary: "Replaced external page navigation on section 'See All' buttons with instant, in-place expansion that loads all products (10, 20, 50, 100+) directly inside the home feed list.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feed", "UI", "Performance"],
    highlight: true,
    features: [
      { icon: Code2, text: "Instant In-Place Expansion: replaced external `/best-products` page redirect with interactive in-place section expand/collapse toggle." },
      { icon: Code2, text: "All Products Rendered: clicking 'See all X products' instantly reveals all products in Today, Yesterday, Last Week, and Last Month lists." }
    ]
  },
  {
    version: "v1.98.0",
    date: "August 1, 2026",
    title: "Top 20 Most Upvoted Feed Sections & Hydration Alignment",
    summary: "Updated Today, Yesterday, Last Week, and Last Month home feed sections to display the top 20 most upvoted products per section.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feed", "Upvotes", "Hydration"],
    highlight: true,
    features: [
      { icon: Code2, text: "Top 20 Most Upvoted: configured feed section generators in `page.tsx` to sort items by `upvotes_count` descending and present the top 20 products per timeframe." },
      { icon: Code2, text: "Hydration Fix: resolved SSR vs client pagination mismatch." }
    ]
  },
  {
    version: "v1.97.0",
    date: "July 31, 2026",
    title: "Elevated Floating Welcome Card Pop-up Surface",
    summary: "Transformed the inline welcome banner into a modern, floating backdrop-blur card pop-up with ambient glow, primary 'Take a tour' action button, and 'Maybe later' dismiss options.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Welcome", "Card"],
    highlight: true,
    features: [
      { icon: Code2, text: "Floating Card Surface: refactored `WelcomeTour.tsx` into a fixed floating pop-up card positioned at the bottom right." },
      { icon: Code2, text: "Elevated Visuals & Action Buttons: added ambient orange radial glow, Flame icon badge, and quick action buttons ('Take a tour' & 'Maybe later')." }
    ]
  },
  {
    version: "v1.96.0",
    date: "July 31, 2026",
    title: "Minimalist Single Left Arrow Scheduled Launch Switcher",
    summary: "Refactored the scheduled launch widget to display a single left arrow toggle button on the left without any numbers or right arrows when a user has multiple scheduled launches.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Widget", "Launches"],
    highlight: true,
    features: [
      { icon: Code2, text: "Single Left Arrow Control: added a single `ChevronLeft` arrow button on the left side of the scheduled launch widget to cycle through all scheduled launches." },
      { icon: Code2, text: "Clean UI: removed numerical badges (`1/2`) and right arrows for a sleek, minimal interface." }
    ]
  },
  {
    version: "v1.95.0",
    date: "July 31, 2026",
    title: "Multi-Scheduled Launches Arrow Carousel & Widget Switcher",
    summary: "Updated the scheduled launch widget (LaunchScheduleWidget.tsx) to support multiple launches scheduled for the same or future dates with interactive left/right arrow controls in both minimized and expanded views.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Launches", "Widget", "Carousel"],
    highlight: true,
    features: [
      { icon: Code2, text: "Multi-Launch Carousel: added `ChevronLeft` and `ChevronRight` arrow navigation to cycle through all products scheduled by the maker." },
      { icon: Code2, text: "Dual-View Support: rendered launch counters (`1/2`) and arrow controls in both the minimized floating bar and the expanded launch tips drawer modal." }
    ]
  },
  {
    version: "v1.94.0",
    date: "July 31, 2026",
    title: "Vibrant Colorful Icon Containers for Launch Wizard & Navigation",
    summary: "Upgraded sidebar step icons and navigation tabs with vibrant, colorful icon containers matching Navbar dropdown aesthetics for an elevated visual experience.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Icons", "Navigation"],
    highlight: true,
    features: [
      { icon: Code2, text: "Creator Wizard Sidebar: upgraded sidebar step icons with distinct colorful background badges (Orange Rocket, Sky Monitor, Purple UserPlus, Emerald Message, Amber DollarSign, Pink Tag, Teal CheckCircle)." },
      { icon: Code2, text: "Product Settings Navigation: added matching colorful icon containers to product settings tabs for a cohesive design system." }
    ]
  },
  {
    version: "v1.93.0",
    date: "July 31, 2026",
    title: "Mandatory Launch Tags Requirement for Product Publishing",
    summary: "Made launch tag selection a strictly required feature in the product launch wizard so users cannot publish a product without picking at least 1 launch tag.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Product Launch", "Validation", "Tags"],
    highlight: true,
    features: [
      { icon: Code2, text: "Mandatory Tag Validation: updated `getValidationErrors()` and `calculateCompletion()` to strictly block publishing if `launchTags` is empty." },
      { icon: Code2, text: "Visual Validation & Checklist: added `* (Required)` indicator, inline error banner under launch tags label, and required checklist verification item." }
    ]
  },
  {
    version: "v1.92.0",
    date: "July 31, 2026",
    title: "Product Funding Information (Bootstrapped, Y Combinator & Venture Backed)",
    summary: "Added Funding Information options to the product launch wizard, product settings, and product pages so makers can highlight whether their product is Bootstrapped, Y Combinator-backed, or Venture-backed.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Funding", "Product Launch", "Settings", "Database"],
    highlight: true,
    features: [
      { icon: Code2, text: "Database Migration 51: added `funding_type` column to Supabase `products` table (`bootstrapped`, `y_combinator`, `venture_backed`)." },
      { icon: Code2, text: "Launch & Settings Integration: added interactive funding selection options to `/new?type=product` wizard and `/my-products/[id]/settings`." },
      { icon: Code2, text: "Product Page Badges: rendered distinctive funding status badges (🌱 Bootstrapped, 🟧 Y Combinator, 💎 Venture Backed) on product detail pages." }
    ]
  },
  {
    version: "v1.91.0",
    date: "July 31, 2026",
    title: "Full-Bleed Product Launch Wizard Layout & Expanded Column Widths",
    summary: "Refactored the product submission wizard page (/new?type=product) to remove card container borders and expand column widths to max-w-7xl with a 3:9 column grid ratio for maximum workspace area.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Product Launch", "Layout"],
    highlight: true,
    features: [
      { icon: Code2, text: "Expanded Workspace Width: expanded the container width to `max-[#7xl]` and adjusted column grid ratio to 3:9 (`col-span-3` sidebar, `col-span-9` form panels)." },
      { icon: Code2, text: "Card Container Removal: replaced heavy card box backgrounds and outer borders with a clean, full-bleed, seamless page layout." }
    ]
  },
  {
    version: "v1.90.0",
    date: "July 31, 2026",
    title: "Expanded Product Launch Tags & Category Catalog (420+ Tags)",
    summary: "Significantly expanded the available launch tags and category selection in the product submission wizard with over 420+ curated Product Hunt categories, platforms, and industry tags.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Product Launch", "Tags", "Categories"],
    highlight: true,
    features: [
      { icon: Code2, text: "420+ Comprehensive Launch Tags: added all major Product Hunt launch categories (AI, Web3, Games, Developer Tools, Design, Crypto, Climate Tech, Apple Vision Pro, Health, FinTech, and more)." },
      { icon: Code2, text: "Exported Tag Catalog: made `ALL_AVAILABLE_TAGS` globally accessible for search and auto-complete across submission wizards and filters." }
    ]
  },
  {
    version: "v1.89.0",
    date: "July 31, 2026",
    title: "Home Page Spotlight Banner Hydration Mismatch Fix",
    summary: "Fixed SSR vs Client React hydration error caused by dynamic date filtering on Today's Top Hunt spotlight banner by guarding client-side date computations with mounted state.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["React", "Hydration", "Fix"],
    highlight: true,
    features: [
      { icon: Code2, text: "React Hydration Safety: guarded date-dependent Today's Spotlight showcase banner, main feed sections (`feedSections`), and added `suppressHydrationWarning` to category project count badges and ecosystem pulse counters in `app/page.tsx`, eliminating server vs client HTML mismatch errors." }
    ]
  },
  {
    version: "v1.88.0",
    date: "July 31, 2026",
    title: "Product Shoutouts & Custom Founder Reviews Persistence Fix",
    summary: "Fixed shoutouts resolution during product launch & settings so custom product names, dev tools, and founder notes are accurately stored in DB and rendered on product pages.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Shoutouts", "Database", "Fix"],
    highlight: true,
    features: [
      { icon: Code2, text: "Custom Shoutouts & Icon Persistence: preserved custom shoutout names, logo/icon links, product IDs, and founder notes across Product Launch and Settings in both Supabase DB and local storage." },
      { icon: Code2, text: "Synthetic Product Resolution: automatically builds rich product cards with icons for dev tools (e.g. GitHub) and custom products instead of falling back to default catalog items." }
    ]
  },
  {
    version: "v1.87.0",
    date: "July 31, 2026",
    title: "Hunter vs. Maker Role Display & Product Settings Integration",
    summary: "Products launched by users who did not work on the project now accurately display a Hunter badge instead of Maker, with launch role toggles available in Product Settings.",
    icon: Code2,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Product Launch", "Settings", "Roles"],
    highlight: true,
    features: [
      { icon: Code2, text: "Accurate Hunter Badge: products launched with 'I didn't work on this product' now show a blue `Hunter` badge on product cards and sidebar instead of `Maker`." },
      { icon: Code2, text: "Role Toggle in Product Settings: makers can update whether they worked on the product or launched as a Hunter anytime under Product Settings (`/my-products/[id]/settings`)." },
      { icon: Code2, text: "Always Visible GitHub Field: GitHub Repository URL input is always displayed during product launch without requiring Open Source selection." },
    ]
  },
  {
    version: "v1.86.0",
    date: "July 31, 2026",
    title: "Global Ctrl+K Search Modal Keyboard Shortcut",
    summary: "Added global `Ctrl + K` / `Cmd + K` keyboard shortcut to open the search modal instantly from anywhere on the platform, with a desktop `Ctrl K` kbd badge in the Navbar.",
    icon: Search,
    iconColor: "text-[#ff5733]",
    iconBg: "bg-orange-500/10",
    tags: ["Search", "Shortcuts"],
    highlight: true,
    features: [
      { icon: Search, text: "Global Ctrl+K Shortcut: pressing `Ctrl + K` or `Cmd + K` opens the search modal or full search instantly from any page." },
      { icon: Search, text: "Keyboard Shortcut Badge: added styled `<kbd>Ctrl K</kbd>` badge inside the Navbar search input box on desktop." },
    ]
  },
  {
    version: "v1.85.0",
    date: "July 31, 2026",
    title: "Search Modal Arrow Button & Product Hunt Full Search Page",
    summary: "Added an orange arrow button to the search modal input bar and launched the dedicated full Search page (`/search`) matching Product Hunt search design.",
    icon: Search,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Search", "Feature"],
    highlight: true,
    features: [
      { icon: ArrowRight, text: "Search Modal Arrow Button: added orange `ArrowRight` submit button to search modal bar and modal footer link to open full search." },
      { icon: Search, text: "Product Hunt Full Search Page: created `/search` page featuring side filters (Products, Launches, Users), Popular Launch Tags, and Product Categories." },
    ]
  },
  {
    version: "v1.84.0",
    date: "July 31, 2026",
    title: "Clean Creator Name & Avatar Display on Discussion Cards",
    summary: "Removed the category badge and time ago timestamp from discussion thread headers, displaying only the creator's name and photo avatar.",
    icon: User,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Discussions"],
    highlight: true,
    features: [
      { icon: User, text: "Clean Creator Header: simplified thread card headers to show only the creator's photo avatar and name/username." },
    ]
  },
  {
    version: "v1.83.0",
    date: "July 31, 2026",
    title: "Mobile Discussions Padding & Creator Photo Avatar Display",
    summary: "Added left padding for discussion cards on mobile screens (`pl-4 pr-3 sm:px-4`) and rendered creator user avatar photos next to author usernames on every discussion thread.",
    icon: User,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Mobile UX", "Discussions"],
    highlight: true,
    features: [
      { icon: User, text: "Creator Avatar Display: rendered creator user profile photo next to author username `@username` on discussion thread rows." },
      { icon: Smartphone, text: "Mobile Left Padding: enhanced discussion card padding (`pl-4 pr-3 sm:px-4`) for improved mobile screen readability." },
    ]
  },
  {
    version: "v1.82.0",
    date: "July 31, 2026",
    title: "Right-Aligned Product-Style Upvote Button on Discussions Feed",
    summary: "Updated thread cards on the Discussions page to position the Product Hunt triangle upvote button on the right side of each discussion card.",
    icon: ArrowUp,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Discussions"],
    highlight: true,
    features: [
      { icon: ArrowUp, text: "Right-Aligned Upvote Button: positioned the Product Hunt upvote button cleanly on the right side of discussion cards." },
    ]
  },
  {
    version: "v1.81.0",
    date: "July 31, 2026",
    title: "Unified Product-Style Upvote Button on Discussions Feed",
    summary: "Updated thread cards on the Discussions page to use the exact Product Hunt style upvote button design on the left side of each card.",
    icon: ArrowUp,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Discussions"],
    highlight: true,
    features: [
      { icon: ArrowUp, text: "Standardized Upvote Button: aligned discussion thread cards to use the exact Product Hunt triangle SVG upvote button on the left side." },
    ]
  },
  {
    version: "v1.80.0",
    date: "July 31, 2026",
    title: "Hide Weekly Spotlight & Ecosystem Pulse on Mobile Discussions",
    summary: "Hidden the Weekly Spotlight banner and Ecosystem Pulse widget on mobile screens in `DiscussionsSidebar.tsx` for a clean mobile feed.",
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Mobile UX", "Discussions"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Mobile Widgets Hide: applied `hidden lg:block` to Weekly Spotlight and Ecosystem Pulse in `DiscussionsSidebar.tsx`." },
    ]
  },
  {
    version: "v1.79.0",
    date: "July 31, 2026",
    title: "Hide Discussion Categories on Mobile Screens",
    summary: "Hidden the categories list block on mobile screens on the discussions page sidebar so mobile users see thread discussions immediately.",
    icon: LayoutGrid,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Mobile UX", "Discussions"],
    highlight: true,
    features: [
      { icon: LayoutGrid, text: "Mobile Category Hide: applied `hidden lg:block` to Categories section in `DiscussionsSidebar.tsx` to streamline mobile discussion feed." },
    ]
  },
  {
    version: "v1.78.0",
    date: "July 31, 2026",
    title: "Navbar Mobile Profile Icon Direct Navigation",
    summary: "Updated the top Navbar profile avatar button on mobile screens (`< 640px`) to navigate directly to `/profile` on click, bypassing the dropdown menu.",
    icon: User,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Mobile UX", "Navbar"],
    highlight: true,
    features: [
      { icon: User, text: "Mobile Navbar Profile Direct Link: tapping the top navbar avatar on mobile directly opens `/profile` with zero dropdown popup." },
    ]
  },
  {
    version: "v1.77.0",
    date: "July 31, 2026",
    title: "Mobile Direct Profile Navigation & Full-Width Mobile Hamburger Menu",
    summary: "Disabled the hover card dropdown popup on mobile screens so clicking a profile navigates directly to the profile page, and updated the mobile hamburger menu to 100% full screen width.",
    icon: Smartphone,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Mobile UX", "Navigation"],
    highlight: true,
    features: [
      { icon: User, text: "Direct Mobile Profile Link: tapping user profiles on mobile screens (< 640px) directly opens the user profile page without opening a hover card popup." },
      { icon: Menu, text: "Full-Width Mobile Hamburger Menu: expanded mobile navbar drawer width to 100% (`w-full`) for a seamless full-screen mobile menu experience." },
    ]
  },
  {
    version: "v1.76.0",
    date: "July 31, 2026",
    title: "Disabled Orange Text Hover Color System",
    summary: "Updated global CSS hover rules so text, titles, and links preserve their natural theme text colors when hovered instead of changing to orange.",
    icon: Palette,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["UI", "Design System"],
    highlight: true,
    features: [
      { icon: Palette, text: "Natural Hover Text Colors: disabled forced orange text color changes across hover classes in `globals.css`." },
    ]
  },
  {
    version: "v1.75.0",
    date: "July 31, 2026",
    title: "Supabase RLS Auth JWT Token & Redis Purge Fix for Onboarding",
    summary: "Ensured profile updates run with authenticated user JWT sessions to pass Supabase RLS policies and forward Bearer tokens to purge server Redis cache.",
    icon: Shield,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Bug Fix", "Database & Security"],
    highlight: true,
    features: [
      { icon: Shield, text: "RLS Session Auth: updated `updateUserProfile` to execute client SDK mutations using active user JWT tokens to pass Supabase RLS." },
      { icon: Database, text: "Bearer Token Forwarding: forwarded Bearer Authorization tokens to `/api/profiles` PUT route to purge Redis cache cleanly." },
    ]
  },
  {
    version: "v1.74.0",
    date: "July 31, 2026",
    title: "Onboarding Modal Persistence & Server Cache Invalidation",
    summary: "Fixed an issue where the onboarding modal reappeared on page refresh by routing profile updates through `/api/profiles` to invalidate server Redis cache and updating Redux store.",
    icon: Users,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    tags: ["Bug Fix", "Auth & Profiles"],
    highlight: true,
    features: [
      { icon: Database, text: "Server Cache Invalidation: routed `updateUserProfile` through `/api/profiles` PUT handler to purge and refresh Upstash Redis cache." },
      { icon: Users, text: "Redux State Sync: dispatched `setReduxProfile` upon onboarding completion to sync global auth state immediately." },
    ]
  },
  {
    version: "v1.73.0",
    date: "July 31, 2026",
    title: "Pure White Background Theme Update",
    summary: "Updated the default light mode root background `--background` color to pure white (`#ffffff`) for a clean, crisp visual look.",
    icon: Palette,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    tags: ["Design", "UI"],
    highlight: true,
    features: [
      { icon: Palette, text: "Pure White Background: updated root CSS variable `--background` from off-white `#fafafa` to pure white `#ffffff`." },
    ]
  },
  {
    version: "v1.72.0",
    date: "July 31, 2026",
    title: "Instant Product Data Loading & Cache Poisoning Prevention",
    summary: "Fixed product data loading delays on initial page open by removing artificial query timeouts, removing proxy latency, and preventing empty arrays from poisoning local cache.",
    icon: Zap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Performance", "Database"],
    highlight: true,
    features: [
      { icon: Zap, text: "Direct Supabase Connection: eliminated server proxy hop latency by connecting SDK directly to Supabase Cloud." },
      { icon: Database, text: "Timeout Optimization: removed artificial 1.5s race timeout in `getProductsRaw`." },
      { icon: Shield, text: "Cache Safeguards: protected `withCache` and `setCachedData` against storing empty `[]` arrays in localStorage." },
    ]
  },
  {
    version: "v1.71.0",
    date: "July 31, 2026",
    title: "404 Background Image Top Navbar Alignment Fix",
    summary: "Applied top margin (`mt-14 sm:mt-16`) to `/not-found.tsx` hero container so the background photo displays completely below the fixed top Navbar without clipping.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "404 Alignment"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Navbar Margin Offset: offset 404 hero image container by top navbar height (`mt-14 sm:mt-16`)." },
      { icon: Rocket, text: "Full Image Visibility: background photo top edge starts cleanly underneath the top navbar header." },
    ]
  },
  {
    version: "v1.70.0",
    date: "July 31, 2026",
    title: "Duplicate Footer Resolution on 404 Error Page",
    summary: "Removed duplicate `<Footer />` component from `/not-found.tsx`, relying solely on the single global `<Footer />` rendered by `RootLayout` in `layout.tsx`.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "404 Cleanup"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Single Footer Enforcement: eliminated double footer rendering on 404 error page." },
      { icon: Rocket, text: "Global Layout Harmony: 404 page cleanly inherits RootLayout's single global footer." },
    ]
  },
  {
    version: "v1.69.0",
    date: "July 31, 2026",
    title: "Document-Flow Background Scroll Effect on 404 Page",
    summary: "Configured the Unsplash background photo on `/not-found.tsx` to move upwards naturally with document flow when scrolling down towards the footer.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "404 Scroll"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Natural Background Motion: hero image container scrolls upwards naturally when scrolling down." },
      { icon: Rocket, text: "Seamless Footer Integration: footer reveals smoothly below the 404 hero section." },
    ]
  },
  {
    version: "v1.68.0",
    date: "July 31, 2026",
    title: "Product Hunt Style Left-Floating Card 404 Design",
    summary: "Re-designed `/not-found.tsx` to match Product Hunt's signature 404 layout with a full-bleed random Unsplash background photo and left-aligned rounded floating card.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "404 Redesign"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Product Hunt 404 Aesthetic: implemented left-aligned floating card over random Unsplash photography." },
      { icon: Rocket, text: "Furry Friends Photo Engine: automatically displays adorable pets & high-res Unsplash photography on 404 visits." },
    ]
  },
  {
    version: "v1.67.0",
    date: "July 31, 2026",
    title: "Full-Bleed Unsplash Background on 404 Error Page",
    summary: "Updated `/not-found.tsx` to display random Unsplash photography as a full-bleed fullscreen background with dark glassmorphism and subtle photographer attribution.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "404 Page"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Fullscreen Unsplash Background: renders high-res Unsplash photo as a full background with dark glassmorphic overlay." },
      { icon: Rocket, text: "Clean Glass Card Layout: removed shuffle button for a sleek, clutter-free centered 404 card." },
    ]
  },
  {
    version: "v1.66.0",
    date: "July 31, 2026",
    title: "Dynamic Random Unsplash Image on 404 Page",
    summary: "Transformed the 404 Error Page (`/not-found.tsx`) to dynamically load a random high-resolution Unsplash photo on every visit, complete with photographer attribution and an interactive image shuffle button.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "404 Page"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Random Unsplash Image Engine: loads a random curated Unsplash shot every time a user hits a 404 page." },
      { icon: Rocket, text: "Interactive Image Shuffle: added 'Shuffle Image' button to cycle through Unsplash photos on demand." },
    ]
  },
  {
    version: "v1.65.0",
    date: "July 31, 2026",
    title: "Dedicated /home Route Page with Status Update Hero",
    summary: "Replaced the automatic redirect on `/home` with a standalone status page displaying 'i am good', complete with platform stats, Navbar & Footer navigation links.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Page", "Routing"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Dedicated /home Page: created custom `/home` route displaying 'i am good' status hero card." },
      { icon: Rocket, text: "Footer & Drawer Navigation: confirmed Footer 'Home' link & Navbar mobile drawer route directly to `/home` without redirects." },
    ]
  },
  {
    version: "v1.64.0",
    date: "July 31, 2026",
    title: "FAQ Page Standard Navbar Integration & Header Refresh",
    summary: "Replaced the legacy custom top header on `/faq` with the standard full-featured `<Navbar />` component for consistent site-wide navigation.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Navigation"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Standard Navbar on FAQ Page: integrated main `<Navbar />` header with search, notifications, drawer, and auth controls into `/faq`." },
      { icon: Rocket, text: "Consistent Navigation & Layout: aligned top padding (`pt-36 sm:pt-42`) to match platform-wide page standards." },
    ]
  },
  {
    version: "v1.63.0",
    date: "July 31, 2026",
    title: "Category Page Sort Dropdown Mobile Overflow Resolution",
    summary: "Fixed sort dropdown positioning on mobile screens across `/categories/[category]` pages by enforcing `left-0 sm:left-auto sm:right-0` positioning and `max-w-[calc(100vw-2rem)]` width constraint.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Mobile Responsive"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Mobile Dropdown Positioning: updated sort dropdown menu positioning to `left-0 sm:left-auto sm:right-0` to eliminate screen overflow." },
      { icon: Rocket, text: "Full Width Truncation: added `max-w-full` class to select button for clean mobile rendering." },
    ]
  },
  {
    version: "v1.62.0",
    date: "July 31, 2026",
    title: "Mobile Categories Sidebar Cleanup & Stacked App Icons Presentation",
    summary: "Hidden the left 'Categories' list box on mobile screens (`hidden lg:block`) across `/categories/[category]` pages so mobile users jump straight to top product launches with Product Hunt style stacked app icons.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Mobile Optimization"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Mobile Categories Box Hidden: removed redundant left categories sidebar box on mobile screens." },
      { icon: Rocket, text: "Stacked App Icons Preview: displayed rotated, overlapping app-icon tiles matching Product Hunt design aesthetic." },
    ]
  },
  {
    version: "v1.61.0",
    date: "July 31, 2026",
    title: "Direct /categories Navigation Link in Mobile Hamburger Drawer",
    summary: "Configured 'Categories' in the mobile Hamburger drawer (`<Navbar />`) as a direct single link that navigates straight to the complete Product Categories Directory (`/categories`).",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Mobile Navigation"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Direct Categories Route: tapping Categories in the mobile drawer opens the full directory at `/categories`." },
      { icon: Rocket, text: "Streamlined Mobile Drawer: replaced accordion with clean single navigation item." },
    ]
  },
  {
    version: "v1.60.0",
    date: "July 31, 2026",
    title: "Categories Sub-Menu Integration in Mobile Hamburger Drawer",
    summary: "Integrated a collapsible Product Categories sub-menu into the mobile Hamburger drawer (`<Navbar />`), providing mobile users with instant access to AI, SaaS, Dev Tools, Productivity, Marketing, FinTech, and Design categories.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Mobile Navigation"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Mobile Categories Sub-menu: added collapsible Categories menu with icons & color-coded category badges." },
      { icon: Rocket, text: "Instant Topic Filtering: mobile users can jump directly to category pages like `/categories/artificial-intelligence`." },
    ]
  },
  {
    version: "v1.59.0",
    date: "July 31, 2026",
    title: "Navbar Logo Route Standardization & Footer /home Link Integration",
    summary: "Configured the Navbar logo to navigate directly to the root home page (`/`), added a `/home` route link in the global Footer, and created `app/home/page.tsx` for seamless home navigation.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Navigation"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Navbar Logo Link: updated logo link in `<Navbar />` to navigate directly to `/`." },
      { icon: Rocket, text: "Footer Home Link: added `{ label: 'Home', href: '/home' }` to global footer community links." },
    ]
  },
  {
    version: "v1.58.0",
    date: "July 31, 2026",
    title: "Standardized Circular Spinner Loader & Zero-Lag Instant Feed Hydration",
    summary: "Standardized the orange circular spinner loader across Product Details (`/products/[id]`), Profile (`/profile`), and Settings (`/profile/settings`). Optimized `useProducts` query hook and added 1.5s race timeout to eliminate 2-3s app opening delay, rendering UI and data simultaneously.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "UI"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Standardized Circular Loader: integrated the Launch Insights orange circular spinner across Profile, Settings, and Product pages." },
      { icon: Rocket, text: "Zero-Lag Instant Feed: configured instant synchronous placeholderData and 1.5s Supabase fetch race timeout so UI and products render simultaneously." },
    ]
  },
  {
    version: "v1.57.0",
    date: "July 31, 2026",
    title: "Product Detail Page Grid Layout Alignment with Main Landing Page",
    summary: "Adjusted the two-column grid on the Product Detail page (`/products/[id]`) to match the main landing page ratio — expanding the left main content column to `lg:col-span-9` and streamlining the right sidebar column to `lg:col-span-3` inside a `max-w-7xl` container.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Layout"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Main Content Expansion: increased main content area to `lg:col-span-9` for wider screenshots, discussions, and reviews." },
      { icon: Rocket, text: "Sleek Sidebar Alignment: streamlined right sidebar actions, rank, upvote button, and scoring cards to `lg:col-span-3`." },
    ]
  },
  {
    version: "v1.56.0",
    date: "July 31, 2026",
    title: "Dynamic Launch Name & Logo Preview in Launch Wizard Sidebar",
    summary: "Replaced static 'Velocis' text in the Product Launch Wizard sidebar (`/new`) with real-time dynamic launch name and product logo preview as the maker fills in their product details.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Submission"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Dynamic Logo Preview: renders the uploaded product logo or custom initial avatar in the wizard sidebar header." },
      { icon: Rocket, text: "Real-time Launch Name: automatically displays the typed product name with an animated status indicator." },
    ]
  },
  {
    version: "v1.55.0",
    date: "July 31, 2026",
    title: "Most Voted Comment Integration for Daily Launch Analytics",
    summary: "Updated the 'Comment with most votes' card on Launch Insights to dynamically fetch the highest voted comment for today's active products (with exact upvote count, user handle, maker badge, and review text).",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Analytics"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Dynamic Most Voted Comment: sorts comments by upvotes_count across today's active products." },
      { icon: Rocket, text: "Enhanced Comment Card UI: displays exact votes count, author handle, maker badge, and detailed product review." },
    ]
  },
  {
    version: "v1.54.0",
    date: "July 31, 2026",
    title: "Global Navbar Integration on Changelog Page",
    summary: "Replaced old custom mini-header with the responsive global `<Navbar />` on the Changelog page (`/changelog`), with top padding clearance (`pt-36 sm:pt-42`) to ensure content is never obscured by the fixed navigation bar.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Navigation"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Global Navbar Standardization: replaced custom mini-header with full responsive `<Navbar />`." },
      { icon: Rocket, text: "Top Padding Clearance: added `pt-36 sm:pt-42` top padding clearance on the main container." },
    ]
  },
  {
    version: "v1.53.0",
    date: "July 31, 2026",
    title: "Current Day Top 20 Products Filtering & Simplified Header",
    summary: "Updated Launch Insights to strictly display today's current day top 20 products (excluding older launches), and simplified the UI header by removing date picker popovers and controls.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Analytics"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Current Day Products Filtering: `getLaunchInsights()` filters products launched on today's target date." },
      { icon: Rocket, text: "Clean Date Display: removed interactive date selector popover, date input, and prev/next day buttons." },
    ]
  },
  {
    version: "v1.52.0",
    date: "July 31, 2026",
    title: "Product Hunt Style Launch Insights Route & Top 20 Daily Limit",
    summary: "Implemented Product Hunt exact route pattern `/launch-insights/[year]/[month]/[day]` (e.g. `/launch-insights/2026/7/30`) with date navigation controls and strictly limited daily analytics to today's top 20 products.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Analytics"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Product Hunt Route Structure: added dynamic `/launch-insights/[year]/[month]/[day]` routes with date pickers and prev/next day controls." },
      { icon: Rocket, text: "Top 20 Daily Products Limit: configured `getLaunchInsights()` to strictly analyze today's top 20 products." },
    ]
  },
  {
    version: "v1.51.0",
    date: "July 31, 2026",
    title: "Multi-Colored Vibrant Chart Lines on Launch Analytics",
    summary: "Configured a 16-color vibrant palette (`VIBRANT_PALETTE`) on Launch Analytics (`/analytics`) so every product in the line graphs, tooltips, sparklines, and ranking checkboxes renders with its own distinct color instead of falling back to single-color orange.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Analytics"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Unique Product Line Colors: mapped every product dynamically to a distinct color from a 16-color vibrant palette." },
      { icon: Rocket, text: "Color-Matched Indicators: synchronized chart line strokes, tooltip dots, sidebar checkbox borders, and metric card sparklines." },
    ]
  },
  {
    version: "v1.50.0",
    date: "July 31, 2026",
    title: "Global Navbar Integration Across Analytics, About & Review Pages",
    summary: "Replaced outdated custom mini-headers with the responsive global `<Navbar />` across Launch Analytics (`/analytics`), About page (`/about`), and Review Wizard (`/products/[id]/review`), with top padding clearance to ensure content is never hidden behind the navbar.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Navigation"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Global Navbar Standardization: replaced custom headers with `<Navbar />` on Analytics, About, and Review Wizard routes." },
      { icon: Rocket, text: "Padding Clearance: added top padding clearance (`pt-36 sm:pt-42`) across containers to prevent content overlap." },
    ]
  },
  {
    version: "v1.49.0",
    date: "July 31, 2026",
    title: "Dynamic First Gallery Screenshot OpenGraph & Twitter Card Integration",
    summary: "Integrated dynamic `<meta property='og:image'>` and `<meta name='twitter:image'>` tags pointing specifically to the product's first gallery image/screenshot so social shares on X/Twitter, LinkedIn, and WhatsApp display the product screenshot image preview.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "SEO & Social"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "First Screenshot Social Unfurl: dynamically configures OpenGraph & Twitter image meta tags with product.images[0] / product.screenshots[0]." },
      { icon: Rocket, text: "Large Image Summary Card: explicitly sets twitter:card to summary_large_image to ensure high-visibility social post previews." },
    ]
  },
  {
    version: "v1.48.0",
    date: "July 31, 2026",
    title: "Product Hunt Exact Social Share Link Format & Image Auto-Embed",
    summary: "Updated social sharing URLs across X/Twitter, LinkedIn, and WhatsApp to match Product Hunt's exact post text format (`[Name]: [Tagline] [URL]?utm_source=twitter&utm_medium=social`), automatically attaching the product's image and OpenGraph metadata.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Social Share"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Product Hunt Post Format: social posts auto-format text with product name, tagline, and link with UTM tracking parameters." },
      { icon: Rocket, text: "Auto Image Card Preview: shared links automatically render the product's preview image and OpenGraph metadata on X, LinkedIn, and WhatsApp." },
    ]
  },
  {
    version: "v1.47.0",
    date: "July 31, 2026",
    title: "Product Page Share & Review Invitation Modal Standardization",
    summary: "Updated the product detail page (/products/[id]) share modal to use the exact same layout as the 'Invite for Review' modal, featuring product logo branding, social sharing (X, LinkedIn, WhatsApp), and copy link functionality.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Product Page"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Standardized Share Modal: updated Product Detail Page Share trigger to launch the branded review invitation modal." },
      { icon: Rocket, text: "Multi-Channel Social Sharing: instant sharing to X/Twitter, LinkedIn, and WhatsApp alongside one-click link copying." },
    ]
  },
  {
    version: "v1.46.0",
    date: "July 31, 2026",
    title: "Product Hunt Style Karma Points Leaderboard Redesign",
    summary: "Redesigned Karma Points Leaderboard rows (/profile/leaderboard) to match Product Hunt's exact layout featuring rank numbers, maker company badges, bold coral red KP scores, segmented progress bars, and legend indicators.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Leaderboard"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Product Hunt Row Layout: rank number prefix, avatar, company badge, handle (@username), pill Follow button, and bold coral red KP score." },
      { icon: Rocket, text: "Segmented Progress Bar: smooth multi-color progress bar displaying point contribution breakdown for Comments (blue), Reviews (green), and Maker (rose)." },
    ]
  },
  {
    version: "v1.44.0",
    date: "July 31, 2026",
    title: "Global Navbar Integration Across Streak & Karma Leaderboard",
    summary: "Replaced old custom mini-headers with the full responsive global <Navbar /> across Streak (/profile/streak), Karma Leaderboard (/profile/leaderboard), Help Center, Makers, and Awards pages.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Navigation"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Global Navbar on Streak & Leaderboard: integrated standard Navbar on Streak Tracker (/profile/streak) and Karma Points Leaderboard (/profile/leaderboard)." },
      { icon: Rocket, text: "Old Header Cleanup: removed outdated custom mini-headers across all sub-pages for unified site-wide navigation." },
    ]
  },
  {
    version: "v1.43.0",
    date: "July 31, 2026",
    title: "Invite People for Review Modal Integration",
    summary: "Added 'Invite for review' action under 'Your Products' on the home page sidebar, launching a dedicated review invitation modal with social sharing (X, LinkedIn, WhatsApp) and instant copy link functionality.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Review System"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Invite for Review Action: added '[+] Invite for review' trigger under each product item in 'Your Products'." },
      { icon: Rocket, text: "Review Invitation Modal: modal displays product logo, review link sharing options for X/Twitter, LinkedIn, WhatsApp, and a one-click Copy Link input box." },
    ]
  },
  {
    version: "v1.42.0",
    date: "July 31, 2026",
    title: "Soft Lighter Tinted Badge Palette",
    summary: "Refined all product and status badges (Built in India, Launching Today, Pre-launch, Maker, Hunter, QS, ES) to use soft, light tinted background fills with matching subtle borders.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "UI"],
    highlight: true,
    features: [
      { icon: Palette, text: "Lighter Shades: updated badges to lightweight 10% opacity tinted backgrounds (bg-emerald-500/10, bg-blue-500/10, bg-amber-500/10, bg-[#ff5733]/10)." },
      { icon: Sparkles, text: "Subtle Matching Borders: added crisp 20-25% opacity matching borders with dark mode support across all product feed and detail views." },
    ]
  },
  {
    version: "v1.41.0",
    date: "July 31, 2026",
    title: "Universal Solid Fill Badge System",
    summary: "Standardized all platform badges (Launching Today, Pre-launch, Maker, Hunter, QS, ES, Active Today) to use rich solid background fill colors with high-contrast white text.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "UI"],
    highlight: true,
    features: [
      { icon: Palette, text: "Solid Fill Colors: applied solid coral (#ff5733) for Launching Today, solid amber for Pre-launch, solid green for Maker/India, solid blue for Hunter/QS, and solid pink for ES." },
      { icon: Sparkles, text: "High Contrast: bold white text on solid background pills across feed cards, sidebar, and product pages." },
    ]
  },
  {
    version: "v1.40.0",
    date: "July 31, 2026",
    title: "Maker & Hunter Badge Placement Refinement",
    summary: "Refined badge logic so 'Hunter Badge' is displayed on the user's card when someone hunts a product they didn't work on, while product cards display the solid green '🇮🇳 Built in India' flag badge.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "User Profiles"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "User Hunter Badge: solid blue 'HUNTER' badge displays on user profile cards for submitters who didn't build the product." },
      { icon: Rocket, text: "Product Card Flag: product rows display the solid green '🇮🇳 Built in India' flag badge without showing hunter tags on product title headers." },
    ]
  },
  {
    version: "v1.39.0",
    date: "July 31, 2026",
    title: "Solid Green & Solid Blue Badge Color System",
    summary: "Updated badge visual design to use solid green (#059669 / emerald-600) for Built in India & Maker badges and solid blue (#2563eb / blue-600) for Hunter Badges across all pages.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "UI"],
    highlight: true,
    features: [
      { icon: Palette, text: "Solid Green Badges: applied solid green background with bold white text for Built in India and Maker badges." },
      { icon: Sparkles, text: "Solid Blue Badges: applied solid blue background with bold white text for Hunter badges across product feed, category, and detail pages." },
    ]
  },
  {
    version: "v1.38.0",
    date: "July 31, 2026",
    title: "Made in India Flag & Hunter Badge Logic Integration",
    summary: "Updated product cards, launch workflow, and product detail pages so selecting Made in India displays the Indian flag badge (🇮🇳 Built in India) and Maker badge, while unselected products display the Hunter Badge.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Product Hunt"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Made in India Flag Badge: products with 'Made in India' selected prominently display the '🇮🇳 Built in India' flag badge." },
      { icon: Rocket, text: "Hunter Badge Designation: products where Made in India / Maker is not selected display the 'Hunter Badge' and list the submitter as Hunter." },
    ]
  },
  {
    version: "v1.37.0",
    date: "July 31, 2026",
    title: "Maker History Logos & Celebration Emoji Enhancement",
    summary: "Updated profile Maker History timeline to display product logos on product launch nodes and added a celebration emoji for the Joined IndiHunt event.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Profile"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Product Logos on Timeline: product launch entries now feature rounded logo images directly on the timeline node." },
      { icon: Rocket, text: "Joined Celebration Emoji: the Joined IndiHunt event now displays a celebration emoji (🎉) node with custom joining milestone text." },
    ]
  },
  {
    version: "v1.36.0",
    date: "July 31, 2026",
    title: "My Launched Products Sizing & Logo Enhancement",
    summary: "Increased product logo size to 40x40px (w-10 h-10) and enlarged container row dimensions with rounded-xl borders for better readability.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["UI", "Enhancement"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Larger Logos: increased product logo size from 24px to 40px with smooth hover zoom." },
      { icon: Rocket, text: "Enhanced Div Rows: increased row padding, text sizing, and added subtle pill badges for upvotes." },
    ]
  },
  {
    version: "v1.35.0",
    date: "July 31, 2026",
    title: "Trending Forum Threads Section & Action Buttons",
    summary: "Updated sidebar Trending Forums to show top upvoted forum threads with sub-category tags and added 'View all' and 'Start new thread' action buttons.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "UI"],
    highlight: true,
    features: [
      { icon: MessageSquare, text: "Trending Forum Threads: displays top upvoted threads with sub-category labels (e.g. p/general, p/ask), upvote counters, comment counts, and live activity badges." },
      { icon: Rocket, text: "Action Pill Buttons: added stacked full-width pill buttons ('View all' and 'Start new thread') matching exact design specifications." },
    ]
  },
  {
    version: "v1.34.0",
    date: "July 31, 2026",
    title: "Sleek Unboxed Right Sidebar & Expanded Main Feed",
    summary: "Decreased the right sidebar column width to lg:col-span-3, expanded the main feed to lg:col-span-9, and removed heavy boxed card designs for a clean, minimal layout.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Major Release"],
    highlight: true,
    features: [
      { icon: Palette, text: "Expanded Feed & Narrower Sidebar: changed main feed grid columns to 9-span feed and 3-span sidebar for a sleeker sidebar experience." },
      { icon: Sparkles, text: "Unboxed Minimalist Sidebar Design: removed heavy boxed cards and shadow wrappers across Trending Forums, Ecosystem Pulse, Top Categories, Streak, and My Products." },
    ]
  },
  {
    version: "v1.33.0",
    date: "July 31, 2026",
    title: "Sidebar Ad Cleanup: Removed Neon Ad Banner",
    summary: "Removed the Neon ad banner from the right sidebar of the main page.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Cleanup", "Design"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Sidebar Ad Removal: completely removed the Neon banner block from the main page right sidebar column." },
    ]
  },
  {
    version: "v1.32.0",
    date: "July 31, 2026",
    title: "Supabase Promoted Ad Banner in Yesterday's Top Products",
    summary: "Generated and embedded a custom high-resolution Supabase advertisement banner inside Yesterday's Top Products section.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "Monetization"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Supabase Ad Banner: generated AI tech ad graphic with emerald green lighting bolt logo and developer code snippets." },
      { icon: Rocket, text: "Yesterday Section Placement: rendered the Supabase promoted ad banner cleanly inside Yesterday's Top Products section linking directly to supabase.com." },
    ]
  },
  {
    version: "v1.31.0",
    date: "July 31, 2026",
    title: "Global Text-Only Coral Hover & Greyish Card Background Hover System",
    summary: "Standardized component hover styling across all pages to use coral red text hover (#ff5733) with distinct greyish background highlights, completely eliminating orange hover borders.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Major Release"],
    highlight: true,
    features: [
      { icon: Palette, text: "No Orange Hover Borders: enforced clean borders across all components, preventing borders from turning orange on hover." },
      { icon: Sparkles, text: "Greyish Hover Background: updated card & pill button hover states to display a distinct greyish background highlight (slate-100 / slate-800) making hovered items stand out clearly." },
    ]
  },
  {
    version: "v1.30.0",
    date: "July 31, 2026",
    title: "Chronological Section 'See All' Navigation Pill Buttons",
    summary: "Added Product Hunt-style rounded full-width pill buttons below each feed section (Today, Yesterday, Last Week, Last Month) directing users to full Best Products leaderboard views.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Feature", "UI"],
    highlight: true,
    features: [
      { icon: Rocket, text: "Section Leaderboard Links: added rounded pill buttons ('See all of today's top products', 'See all of yesterday's top products', 'See all of last week's top products', 'See all of last month's top products') below each section." },
      { icon: Sparkles, text: "Product Hunt Coral Hover Accent: styled pill buttons with smooth hover borders and coral text color transitions." },
    ]
  },
  {
    version: "v1.29.0",
    date: "July 31, 2026",
    title: "Best Products Leaderboard UI & Action Cards Alignment",
    summary: "Updated the product cards across the Best Products leaderboard pages to match the exact Product Hunt UI styling, hover effects, and side-by-side dual action boxes from the main page.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Major Release"],
    highlight: true,
    features: [
      { icon: Palette, text: "Main Page Card Alignment: redesigned Best Products leaderboard cards to use the exact main page layout, rank badges, country tags, and coral text hover system (#ff5733)." },
      { icon: Sparkles, text: "Dual Action Controls & In-Line Upvoting: integrated side-by-side comment count box and interactive coral upvote box with optimistic state updates." },
    ]
  },
  {
    version: "v1.28.0",
    date: "July 31, 2026",
    title: "Clean Main Feed Header",
    summary: "Removed the 'Top Products Launching Today' header and description block above the main product feed for a cleaner layout.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Unboxed Main Feed Top Header: removed redundant 'Top Products Launching Today' text block and subtext for an immediate view of product categories and launches." },
    ]
  },
  {
    version: "v1.27.0",
    date: "July 31, 2026",
    title: "Streamlined Feed Navigation: Removed Trending & Featured Tabs",
    summary: "Removed the redundant Trending and Featured tabs from the home feed selector, focusing the UI on chronological launches and upcoming products.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Design"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Simplified Feed Selector: completely removed Trending and Featured tabs from the home feed navigation." },
      { icon: Rocket, text: "Focus on Chronological Launches: the feed now directly presents Products and Scheduled Upcoming launches." },
    ]
  },
  {
    version: "v1.26.0",
    date: "July 31, 2026",
    title: "Strict Launch Date Filtering & Section Empty States",
    summary: "Enforced strict real launch date matching for Today's, Yesterday's, Last Week's, and Last Month's Top Products sections with empty state notices when no launches occurred.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Major Release"],
    highlight: true,
    features: [
      { icon: Rocket, text: "Strict Launch Date Bucketing: products appear only in the exact section corresponding to their actual launch timestamp." },
      { icon: Sparkles, text: "Section Empty States: if no products launched in a specific period (e.g. yesterday), displays an explicit 'No products launched' message without cross-section fallback filling." },
    ]
  },
  {
    version: "v1.25.0",
    date: "July 31, 2026",
    title: "Product Hunt Chronological Daily, Weekly & Monthly Feed Sections",
    summary: "Organized main product feed into Today's, Yesterday's, Last Week's, and Last Month's Top Products sections capped at 5 products per section.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Major Release"],
    highlight: true,
    features: [
      { icon: Rocket, text: "Chronological Feed Layout: stacked Today's, Yesterday's, Last Week's, and Last Month's Top Products sections on the main page." },
      { icon: Sparkles, text: "5 Products Per Section Cap: strictly limited each chronological section to display up to 5 top ranked products for clean scannability." },
    ]
  },
  {
    version: "v1.24.0",
    date: "July 31, 2026",
    title: "Product Hunt Dual Upvote & Comment Card Actions",
    summary: "Updated feed product cards to render side-by-side comment count box and active coral upvote box matching Product Hunt design.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Major Release"],
    highlight: true,
    features: [
      { icon: Palette, text: "Dual Action Box Design: side-by-side rounded square comment count box and clean upvote box with active coral red border." },
      { icon: Sparkles, text: "Product Hunt Exact Coral Hover (#ff5733): updated all component text hover effects to use Product Hunt's exact coral red color on card & link hover." },
    ]
  },
  {
    version: "v1.23.0",
    date: "July 30, 2026",
    title: "Scheduled Product Owner Privacy & Exclusive Pre-Launch Controls",
    summary: "Restricted the scheduled launch announcement banner, forum CTAs, and ad campaign exposure options to product owners only.",
    icon: Lock,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Security", "Improvement"],
    highlight: true,
    features: [
      { icon: Lock, text: "Owner-only scheduled callout: advertising options and pre-launch forum setup tools are now private to the product owner/maker." },
      { icon: Palette, text: "Unboxed product sidebar & comments: converted Company Info, Product Info, Forum, Awards, Social, Similar Products, and Discussion Feed cards into borderless clean sections." },
      { icon: Sparkles, text: "Product shoutout name-matching: added shoutout_names and shoutout_notes data model support so added tools dynamically resolve against real products in the catalog." },
      { icon: Eye, text: "Public pre-launch view: visitors see clean scheduled badges and upvote status without internal owner management promos." },
    ]
  },
  {
    version: "v1.22.0",
    date: "July 30, 2026",
    title: "Product Hunt Landing Page Upcoming Launches Feed & Auto-Launch System",
    summary: "Integrated an Upcoming Launches tab directly on the main landing page feed with auto-launch transition logic and pre-launch upvote locking.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Major Release"],
    highlight: true,
    features: [
      { icon: Rocket, text: "Added Upcoming Launches tab (🚀 Upcoming) alongside Featured, Trending, and All on the main landing page feed." },
      { icon: Sparkles, text: "Auto-launch transition: products with scheduled_for <= now() automatically move to live feeds and category listings." },
      { icon: Lock, text: "Pre-launch upvote locking: voting is locked until launch date, while comments and reviews remain fully open for early feedback." },
    ]
  },
  {
    version: "v1.21.0",
    date: "July 30, 2026",
    title: "Product Hunt Complete App Unboxed Modals & Ecosystem System",
    summary: "Transformed all remaining modals, popups, streak trackers, stories, makers, and ads into an unboxed borderless design system.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Major Release"],
    highlight: true,
    features: [
      { icon: LayoutGrid, text: "Unboxed AuthModal, DatePickerModal, SuccessScheduledModal, and WelcomeTour into borderless backdrop-blur floating surfaces." },
      { icon: Sparkles, text: "Converted maker directory, streak tracker, values section, and sponsored banners into borderless list rows." },
    ]
  },
  {
    version: "v1.20.0",
    date: "July 30, 2026",
    title: "Product Hunt Complete App Unboxed & Legible Typography System",
    summary: "Transformed all 25+ page routes and components into an authentic unboxed borderless design system with Product Hunt standard typography.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Major Release"],
    highlight: true,
    features: [
      { icon: LayoutGrid, text: "Unboxed discussions, maker profiles, settings, dashboards, and ecosystem pages into borderless list rows." },
      { icon: Sparkles, text: "Standardized all font sizes to Product Hunt's high-contrast text-xs (13px), text-sm (14px), and text-base (16px) scale." },
    ]
  },
  {
    version: "v1.19.1",
    date: "July 30, 2026",
    title: "Product Hunt Legible Typography & Font Scale System",
    summary: "Upgraded all micro font sizes and low-contrast text colors across IndiHunt to Product Hunt's readable font scale.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    highlight: true,
    features: [
      { icon: Palette, text: "Eliminated illegible micro font sizes (text-[9px]/10px) in favor of Product Hunt's readable text-xs (13px) and text-sm (14px) scale." },
      { icon: Star, text: "Upgraded product taglines, follower counts, category badges, and comments text to high-contrast readable slate colors." },
    ]
  },
  {
    version: "v1.19.0",
    date: "July 30, 2026",
    title: "Product Hunt Authentic Unboxed Layout System",
    summary: "Transformed IndiHunt UI into a clean, unboxed borderless design system matching Product Hunt's signature aesthetic.",
    icon: Palette,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Design", "Improvement"],
    highlight: true,
    features: [
      { icon: Palette, text: "Removed heavy card box containers (bg-card border rounded-3xl) across home feed, product details, threads, and stories." },
      { icon: Rocket, text: "Replaced product feed cards with sleek borderless list rows separated by subtle dividers and hover fills." },
      { icon: Star, text: "Unboxed product detail hero, pitch description, sidebars, comments, and reviews to match Product Hunt's reference layout." },
    ]
  },
  {
    version: "v1.18.2",
    date: "July 30, 2026",
    title: "Smart Ad Rotation Engine & Direct Website Redirection",
    summary: "Upgraded the advertising platform with a smart ad rotation engine featuring frequency capping, and resolved redirection to show the product's actual website URL instead of its details page.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Improvement", "Database"],
    highlight: true,
    features: [
      { icon: Zap, text: "Smart Ad Rotation — Configured frequency capping on the server utilizing Upstash Redis to prevent showing identical ads repeatedly in a session." },
      { icon: Globe, text: "Direct Redirection — Updated sponsored ads to open the product's actual website URL directly instead of linking to internal product pages." },
      { icon: Shield, text: "Migration Sync — Added RLS policies schema to allow public anonymous visitors to query active ad campaigns." },
      { icon: Database, text: "Event RPC Logging — Built a secure RLS-bypassing database function (log_ad_event) to record impressions and clicks from anonymous visitors." },
      { icon: Zap, text: "Parallel Profile Hydration — Redesigned fetchProfileData to execute all 16 DB queries concurrently in Promise.all, reducing profile load time from 4s to sub-200ms." }
    ],
  },
  {
    version: "v1.18.1",
    date: "July 30, 2026",
    title: "Session Performance Optimization & Ad Pipeline Fixes",
    summary: "Optimized profile session checks to prevent redundant API loops, aligned the Self-Serve Ad wizard to save campaigns into the correct advertising pool, and dropped legacy campaigns/admin database structures.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Performance", "Database"],
    highlight: true,
    features: [
      { icon: Zap, text: "Ref Loop Optimization — Eliminated redundant /api/profiles endpoints loops by introducing user Ref triggers." },
      { icon: Sparkles, text: "Self-Serve Creation Sync — Updated the /advertise wizard to route inquiries directly to createAdCampaign instead of legacy builder campaigns." },
      { icon: Database, text: "Legacy Campaigns Cleanup — Dropped the obsolete campaigns table (Migration 45) and purged unused CRUD methods from supabase.ts." },
      { icon: Shield, text: "Admin Console Purge — Completely removed the /admin route pages, ads admin API routes, isolated admin DB configuration, and dropped administrative tables (Migration 46)." },
      { icon: BarChart2, text: "Ad Performance Dashboard — Added a modal analytics dashboard featuring visual hourly/real-time performance graphs, CTR, CPC tracking, and budget burn rates." },
    ],
  },
  {
    version: "v1.18.0",
    date: "July 30, 2026",
    title: "Advanced Advertising Engine & Isolated Admin DB",
    summary: "Integrated country/device targeting filters, automated bot/self-click fraud protection, and built a dedicated Admin Overrides console powered by a separate, isolated secondary Supabase instance.",
    icon: Shield,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Database", "Security"],
    highlight: true,
    features: [
      { icon: Shield, text: "Anti-Fraud Checks — Configured session click cooldown timers, bot header matching, and owner self-click blocks." },
      { icon: Globe, text: "Placement & Targeting — Support category-specific targeting, device filters (desktop/mobile), and country bounds." },
      { icon: Lock, text: "Isolated Admin DB — Built a separate secondary Supabase connection dedicated to billing checkout, override logs, and fraud alerts." },
    ],
  },
  {
    version: "v1.17.0",
    date: "July 30, 2026",
    title: "Self-Serve Advertising Platform & Dynamic rotation",
    summary: "Launched a complete self-serve advertising engine with Stripe/Razorpay payment simulation, active ad rotation pools, impression and click events logging, and profile analytics dashboards.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Database", "Improvement"],
    highlight: true,
    features: [
      { icon: Sparkles, text: "Self-Serve Campaigns — Enable makers to set headlines, descriptions, CTAs, budgets, and pay simulated online transactions to start immediately." },
      { icon: Zap, text: "Weighted Ad Rotation — Serves active ads dynamically, rotating them fairly based on remaining budgets and click ratios." },
      { icon: BarChart2, text: "Budget & Analytics Dashboard — Displays detailed impressions, clicks, CTRs, and budget tracking statistics." },
    ],
  },
  {
    version: "v1.16.2",
    date: "July 30, 2026",
    title: "Campaign Request Flow & Control Restrictions",
    summary: "Configured newly created advertising campaigns to default to 'upcoming' status, and removed client-side campaign controls to restrict management solely to company administrators.",
    icon: Shield,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Improvement"],
    highlight: true,
    features: [
      { icon: Shield, text: "Status defaulting — Forced all new campaigns to default to the 'upcoming' status for approval and scheduling." },
      { icon: Users, text: "Restricted Management — Removed the self-serve actions panel (edit details, delete, start, pause, resume) to ensure campaigns are fully managed by the company." },
    ],
  },
  {
    version: "v1.16.1",
    date: "July 30, 2026",
    title: "Upstash Redis Caching & Instant Profile Loading",
    summary: "Integrated Upstash Redis caching server-side for user profiles and comments, and added client-side localStorage profile hydration for immediate (0ms delay) loading.",
    icon: Database,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "Database", "Improvement"],
    highlight: true,
    features: [
      { icon: Database, text: "Upstash Redis Caching — Implemented Redis caching inside the profiles and comments API routes with automatic invalidation on updates." },
      { icon: Zap, text: "Instant Profile Hydration — Configured Providers to hydrate the user profile from localStorage instantly on start before executing API requests." },
    ],
  },
  {
    version: "v1.16.0",
    date: "July 30, 2026",
    title: "Staged Data Orchestrator & Instant Caching",
    summary: "Introduced a staged client-side data orchestrator and query prefetching. Integrated local storage-backed placeholderData to ensure instant (0ms delay) page loads and data transitions.",
    icon: Zap,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["Performance", "Improvement"],
    highlight: true,
    features: [
      { icon: Zap, text: "Staged DataOrchestrator — Coordinates data initialization in stages: CRITICAL, UI_BLOCKING, UI_DEFERRED, BACKGROUND, REALTIME, and COMPLETED." },
      { icon: Database, text: "Instant Placeholder Data — Configured useProducts, useThreads, best-products, and stories query hooks to render immediately using local storage cached records." },
      { icon: Palette, text: "Background Logo Prefetching — Automatically preloads top product images and logo assets to prevent image pop-in/flicker." },
      { icon: Shield, text: "Safety Timeout Valve — Prevents initialization blockage under slow/offline connections by automatically transitioning stages." }
    ],
  },
  {
    version: "v1.15.1",
    date: "July 29, 2026",
    title: "Centered Navigation & Integrated Search",
    summary: "Redesigned the main navigation bar, grouping the desktop links and search bar into a centered wrapper in the middle of the navbar for a cleaner and more symmetrical aesthetic.",
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tags: ["Design", "Improvement"],
    features: [
      { icon: Sparkles, text: "Centered Navbar Layout — Moved desktop navigation links to the center of the viewport for a unified look." },
      { icon: Search, text: "Integrated Search Placement — Placed the search input directly alongside the centered navigation links, maintaining its icon-based layout." },
    ],
  },
  {
    version: "v1.15.0",
    date: "July 29, 2026",
    title: "IndiBot Help Center Chatbot & Soft-Delete System",
    summary: "Launched IndiBot — a fully conversational chatbot in the Help Center with 20 detailed FAQ Q&As, guided product unpublishing with a 7-day grace period, instant search, and category filtering. Removed direct hard-delete buttons from all product management surfaces.",
    icon: MessageSquare,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Improvement", "Database"],
    highlight: true,
    features: [
      { icon: MessageSquare, text: "IndiBot Chatbot — Floating conversational assistant with animated typing indicators, message bubbles, and preset quick-action buttons throughout the Help Center." },
      { icon: BookOpen, text: "20 Detailed FAQ Q&As — Covers launching, FLP, streaks, pacts, quality score, featured algorithm, comments, threads, stories, collections, tech stack, campaigns, open source, student showcase, moderation, and more." },
      { icon: Rocket, text: "Guided Product Unpublishing — Step-by-step deletion flow: select product → pick reason → confirm → 7-day grace period. Products are hidden from all feeds immediately upon scheduling." },
      { icon: Database, text: "Soft-Delete System — Products are never hard-deleted on schedule. Added is_deleted, scheduled_deletion_date, deletion_reason, deleted_by, and deleted_at columns to the products table with indexes and pg_cron hook." },
      { icon: Zap, text: "Cancellation Support — Users can cancel a scheduled deletion within the 7-day window directly from the IndiBot chat interface." },
      { icon: Shield, text: "Safety First — Removed all direct hard-delete buttons from My Products and profile pages. All deletions now go through the IndiBot grace-period flow." },
      { icon: Search, text: "FAQ Search & Filter — Instant keyword search across questions, answers, and tags. Category filter buttons for Launching, Community, Profiles, Guidelines, and Advertising." },
    ],
  },
  {
    version: "v1.14.0",
    date: "July 29, 2026",
    title: "Favicon Scraper & Daily Tech News Page",
    summary: "Refined the URL scraper to target and extract website favicons, and launched a new Daily Tech News page fetching trending stories from the global tech ecosystem.",
    icon: Globe,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Improvement"],
    highlight: true,
    features: [
      { icon: Globe, text: "Daily News Page - Added a /news page showcasing trending tech stories directly from Hacker News API, with search and direct discussion links." },
      { icon: Globe, text: "Favicon Extraction - Extracted favicon from link tags with icon, shortcut icon, or apple-touch-icon rel attributes in the scraper." },
      { icon: Zap, text: "Relative Path Resolution - Automatically resolved protocol-relative, domain-relative, and relative paths to absolute URLs." },
      { icon: Database, text: "Fallback Hierarchy - Safely falls back to og:image and standard /favicon.ico path if no link tag is found." },
      { icon: Sparkles, text: "Stack Options - Added LangChain to the available tech stack selection list (Sanity is also verified present)." },
      { icon: Users, text: "Username Profile Routing - Created a dynamic /@username page routing structure that fetches profiles by handle, and auto-redirects legacy query-based profile URLs." },
    ],
  },

  {
    version: "v1.13.0",
    date: "July 26, 2026",
    title: "Interactive Feature Showcase & Home Layout Refinements",
    summary: "Added an interactive Feature Showcase section with pill tabs, workspace screenshot previews, 3D community card depth motion, and unified background styling.",
    icon: Sparkles,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Design", "Improvement"],
    highlight: true,
    features: [
      { icon: Palette, text: "Interactive Feature Showcase - Added tab navigation for Launch, Browse feed, and Get upvoted with full-resolution app window previews." },
      { icon: Zap, text: "3D Card Elevation & Overlap - Enhanced Featured Community Launches marquee with staggered depth layering and smooth pop-up motion." },
      { icon: Rocket, text: "Mobile Responsiveness - Optimized pill button sizing and hidden floating hero banner callouts on mobile for uncluttered views." },
    ],
  },
  {
    version: "v1.12.0",
    date: "July 26, 2026",
    title: "Collapsible Mobile Side Nav Sub-Menus",
    summary: "Refined mobile navigation drawer with expandable dropdown accordions and smooth chevron arrow toggles for Launches and News sub-menus.",
    icon: Menu,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Design"],
    highlight: true,
    features: [
      { icon: ChevronDown, text: "Collapsible Sub-Menus - grouped Launches (Archive, Guide, Showcase, Open Source) and News (Newsletter, Stories, Changelog) into neat expandable sections in mobile drawer." },
      { icon: Sparkles, text: "Chevron Arrow Toggles - added rotating chevron arrow indicators that flip smoothly when expanding/collapsing sub-menus on mobile." },
      { icon: Palette, text: "Clean & Compact Side Nav - prevented mobile drawer overflow by showing clean top-level items until sub-menus are clicked." },
    ],
  },
  {
    version: "v1.11.0",
    date: "July 26, 2026",
    title: "Thread Detail Page Discussion Sidebar Layout",
    summary: "Unified thread detail page with discussions layout by incorporating the discussions side panel for seamless navigation across categories, spotlight, and ecosystem pulse.",
    icon: MessageSquare,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Design"],
    highlight: false,
    features: [
      { icon: Palette, text: "Best Products Leaderboard Hover Highlight - fixed product card hover state in `/best-products` to use subtle dark overlay (`hover:bg-black/5 dark:hover:bg-white/5`) so cards highlight smoothly without matching background color." },
      { icon: Palette, text: "Launch Guide & Open-Source Navbar - added global Navbar and top padding clearance (`pt-14 sm:pt-32`) to Launch Guide (`/guide`) and Open Source directory (`/open-source`)." },
      { icon: Palette, text: "Product Detail Sub-Header Fix - wrapped Admin Bar and 'Back to Explorer' sub-header in top padding offset (`pt-14 sm:pt-32`) and positioned sticky sub-header below fixed navbar so top cards are never overlapped." },
      { icon: Palette, text: "Product Page & Launch Wizard Padding - added top padding offset (`pt-36 sm:pt-42`) to Product Detail pages and Product Launch Creator Wizard (`/new`) to prevent sticky navbar/header overlap." },
      { icon: Palette, text: "Pre-Launch Dashboard Padding - added top padding offset (`pt-42 sm:pt-44`) to prevent fixed navigation headers from overlapping pre-launch content." },
      { icon: MessageSquare, text: "Discussions Side Panel - opening any discussion thread now displays the thread within the full discussions layout alongside the side panel." },
      { icon: Sparkles, text: "Reusable Discussions Sidebar - created a modular DiscussionsSidebar component shared between discussions index and individual thread pages." },
      { icon: Globe, text: "Category & Spotlight Navigation - users can easily jump between discussion categories, start threads, and view ecosystem metrics right from thread detail pages." },
    ],
  },
  {
    version: "v1.10.0",
    date: "July 9, 2026",
    title: "Marketing Showcase & Infinite Loop Marquee Carousel",
    summary: "Created a dedicated Products Showcase section on the marketing page featuring an auto-scrolling loop (marquee) of products with full-width screenshots and interactive hover pauses.",
    icon: Rocket,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Design"],
    highlight: false,
    features: [
      { icon: Search, text: "Universal Search Modal - clicking search in the navigation bar now opens a beautiful, mobile-optimized modal to query products and discussions instantly, complete with a close cross button." },
      { icon: Sparkles, text: "Marketing Showcase - a new featured section positioned directly below the hero banner to highlight launched products." },
      { icon: Play, text: "Infinite Loop Marquee - a continuous auto-scrolling container that moves slowly and pauses on hover." },
      { icon: Eye, text: "Full Screenshot Previews - upgraded the layout to show full-width screenshots using CSS containment to prevent clipping." },
      { icon: Palette, text: "Refined Showcase Cards - optimized height, width, and padding, and removed stat badges to keep focus on visual assets." },
    ],
  },
  {
    version: "v1.9.0",
    date: "July 5, 2026",
    title: "Algorithmic Featuring, Live Scoring & Timeframe Filters",
    summary: "Implemented fully automated product featuring algorithms, real-time Quality & Engagement scoring, custom timeframe dropdown filters matching the categories page design, and layout optimization for mobile devices.",
    icon: Sparkles,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature", "Improvement"],
    highlight: false,
    features: [
      { icon: Award, text: "Quality Score (100pt scale) - evaluates website validation, assets, description, and maker profile status" },
      { icon: Flame, text: "Engagement Score - uses upvotes, comments, views, and bookmarks to determine product traction" },
      { icon: Star, text: "Algorithmic Featuring - automatic evaluation with a strict 12-hour launch window constraint" },
      { icon: Zap, text: "Timeframe Filters - custom dropdown matching categories design (Today, Yesterday, Week, Month)" },
      { icon: Database, text: "Feed Pagination - loads and slices exactly 20 items per page with custom pagination control buttons" },
      { icon: MessageSquare, text: "Linked Product Card - threads connected to products show the product logo, tagline, and details" },
      { icon: Shield, text: "Mobile Optimization - fixed Category layout grids and Tech Stack dropdown view limits on mobile screens" },
    ],
  },
  {
    version: "v1.8.0",
    date: "July 2, 2026",
    title: "Database Scalability — 100k User Ready",
    summary: "Complete database performance overhaul. Added 40+ strategic indexes, GIN indexes for tag and full-text search, and non-negative CHECK constraints on all denormalized counters.",
    icon: Database,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    tags: ["Performance", "Database"],
    highlight: false,
    features: [
      { icon: Database, text: "40+ btree indexes on all FK columns across every table" },
      { icon: Search, text: "GIN index on products.tags[] for instant tag filtering" },
      { icon: Search, text: "Full-text search GIN indexes on products and threads" },
      { icon: Shield, text: "Non-negative CHECK constraints on upvotes_count, karma, streaks, followers" },
      { icon: TrendingUp, text: "idx_products_created_at_desc — main feed now uses Index Scan vs Seq Scan" },
      { icon: Users, text: "Leaderboard indexes on karma_points DESC, streak_count DESC" },
    ],
  },
  {
    version: "v1.7.0",
    date: "July 2, 2026",
    title: "About Page & Platform Story",
    summary: "Launched a full ~2,000-word About page telling the IndiHunt origin story, showcasing the team, values, milestones timeline, and vision for India's maker ecosystem.",
    icon: BookOpen,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    tags: ["New Feature", "Design"],
    highlight: false,
    features: [
      { icon: BookOpen, text: "Origin story with 5-paragraph narrative from founding to today" },
      { icon: Users, text: "Team section with photos, roles, and city locations" },
      { icon: Star, text: "6 core values — Community, Transparency, Ship Fast, India to the World" },
      { icon: TrendingUp, text: "6-milestone animated timeline from 2023 → Today" },
      { icon: Package, text: "Platform feature grid — Launches, Analytics, Awards, Threads, Profiles" },
      { icon: Globe, text: "Vision section on India's global maker ambitions" },
    ],
  },
  {
    version: "v1.6.0",
    date: "July 2, 2026",
    title: "Guest Onboarding Tour",
    summary: "New users are greeted with a Product Hunt-style welcome banner and interactive 7-step guided tour that highlights key platform features. Tour state is persisted via localStorage.",
    icon: Play,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    tags: ["New Feature", "Design"],
    highlight: false,
    features: [
      { icon: Bell, text: "Welcome banner with orange flame icon — appears 800ms after load" },
      { icon: Map, text: "7-step interactive guided tour: Welcome → Products → Upvote → Search → Explore → Launch → Sign Up" },
      { icon: Eye, text: "Spotlight ring highlights exact UI elements (search bar, upvote button, login)" },
      { icon: Flame, text: "Orange glow ring on upvote button with 4px tight spotlight" },
      { icon: Shield, text: "Tour persisted in localStorage — only shown once per browser" },
      { icon: Lock, text: "Invisible to logged-in users — guests only" },
    ],
  },
  {
    version: "v1.5.0",
    date: "July 2, 2026",
    title: "Advertise Page Cleanup & Auth Integration",
    summary: "Removed duplicate 'Get Started Now' CTAs from campaign sections — now only the hero button drives the wizard. All sign-in prompts now trigger the global AuthModal.",
    icon: Zap,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    tags: ["Improvement", "Design"],
    highlight: false,
    features: [
      { icon: Zap, text: "Single hero CTA — removed secondary Get Started Now from Basic, Momentum, and Managed campaign sections" },
      { icon: Lock, text: "All sign-in prompts now trigger the global AuthModal instead of page redirects" },
      { icon: Shield, text: "Campaign creation flow gated properly behind authentication" },
    ],
  },
  {
    version: "v1.4.0",
    date: "July 2, 2026",
    title: "Global Auth Modal & Google Sign-In",
    summary: "Introduced a beautiful global authentication modal with Google, GitHub, LinkedIn, X, Facebook, and Apple sign-in options. Triggered from any unauthenticated action site-wide.",
    icon: Lock,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
    tags: ["New Feature", "Security"],
    highlight: false,
    features: [
      { icon: Lock, text: "Premium AuthModal with 6 OAuth providers: Google, GitHub, LinkedIn, X, Facebook, Apple" },
      { icon: Globe, text: "Global Redux state (authModalOpen) — one modal instance, any trigger" },
      { icon: Shield, text: "Mounted in root layout — available on every page" },
      { icon: Users, text: "Upvote, comment, launch, review, follow — all trigger modal for guests" },
      { icon: Zap, text: "Navbar 'Log In' button — orange background, no icon, clean and bold" },
    ],
  },
  {
    version: "v1.3.0",
    date: "July 2, 2026",
    title: "Live Analytics Dashboard",
    summary: "Complete rewrite of the Analytics page. Removed all mock data — everything now runs dynamically from real database records. Includes maker rankings, product insights, tag charts, and referral breakdowns.",
    icon: BarChart2,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    tags: ["New Feature", "Improvement"],
    highlight: true,
    features: [
      { icon: BarChart2, text: "All mock data deleted — 100% real database-driven metrics" },
      { icon: TrendingUp, text: "Dynamic sparkline charts computed from live product upvote and view data" },
      { icon: Star, text: "Maker Rankings now only shows launched products (no drafts/unlaunched)" },
      { icon: Search, text: "Popular tags chart computed from actual product.tags[] fields" },
      { icon: MessageSquare, text: "Top commented products ranked from live comments table" },
      { icon: Users, text: "Referral breakdown (Direct, Google, X, LinkedIn, GitHub) dynamically weighted" },
      { icon: Eye, text: "Clean empty state when zero products exist" },
    ],
  },
  {
    version: "v1.2.0",
    date: "July 2, 2026",
    title: "Dynamic Awards System",
    summary: "Product awards are now calculated live from real upvote counts. Products with 100+ upvotes unlock elite orbit awards. Sidebar widget and Awards tab both reflect live data.",
    icon: Award,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10",
    tags: ["New Feature", "Improvement"],
    highlight: false,
    features: [
      { icon: Award, text: "100+ upvotes → 7 elite orbit/launch awards (People's Champ, top ranks)" },
      { icon: Award, text: "50+ upvotes → 3 runner-up milestone badges" },
      { icon: Award, text: "20+ upvotes → 2 standard badges" },
      { icon: Award, text: "5+ upvotes → 1 entry milestone badge" },
      { icon: Star, text: "Awards sidebar widget with color-coded icon rings and rank tooltips" },
      { icon: Eye, text: "Friendly empty state for products with < 5 upvotes" },
    ],
  },
  {
    version: "v1.1.0",
    date: "July 2, 2026",
    title: "Product Page Analytics Tab",
    summary: "Each product now has a dedicated Analytics sub-tab with interactive KPI cards, dual-line SVG charts for views and upvotes, sentiment analysis, and traffic source breakdowns.",
    icon: TrendingUp,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
    tags: ["New Feature", "Design"],
    highlight: false,
    features: [
      { icon: BarChart2, text: "KPI cards: Estimated Views, Upvotes, Comments, Conversion Rate" },
      { icon: TrendingUp, text: "Custom SVG line charts with hover tooltip cursor tracker (views + upvotes)" },
      { icon: Star, text: "Sentiment analysis: Positive / Neutral / Negative from ratings" },
      { icon: Globe, text: "Traffic referrals breakdown: Direct, Google, X, LinkedIn, GitHub" },
      { icon: Zap, text: "Timeframe filters: Today / 7d / 30d with dynamic data adjustment" },
    ],
  },
  {
    version: "v1.0.5",
    date: "July 2, 2026",
    title: "Launch Team Widget & Dynamic Tags",
    summary: "The Built With section now loads real co-maker profiles from the database. Product categories render dynamically from tags[] instead of hardcoded strings.",
    icon: Users,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    tags: ["Improvement"],
    highlight: false,
    features: [
      { icon: Users, text: "Team widget loads real co-maker avatars and initials from the database" },
      { icon: Star, text: "Launch year calculated from product.created_at (no hardcoding)" },
      { icon: Package, text: "Categories rendered dynamically from product.tags[] as styled pills" },
      { icon: Globe, text: "Embed badge preview shows /logo.webp instead of placeholder" },
    ],
  },
  {
    version: "v1.0.4",
    date: "July 2, 2026",
    title: "Product Description & Category Display",
    summary: "Product detail pages now show full descriptions, categories, and all metadata in a structured layout matching the reference design with proper hierarchy.",
    icon: Eye,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10",
    tags: ["Improvement", "Design"],
    highlight: false,
    features: [
      { icon: Package, text: "Full product description rendered in the Overview tab" },
      { icon: Star, text: "Category tags shown as orange bullet-separated pills" },
      { icon: Eye, text: "Ecommerce, Link-in-bio, AI Generative Media categories displayed" },
      { icon: Rocket, text: "Structured launch metadata: maker count, year, website link" },
    ],
  },
  {
    version: "v1.0.3",
    date: "July 2, 2026",
    title: "Visibility Rules & Draft Filtering",
    summary: "Drafts and unlaunched scheduled products are now hidden from the Explorer feed, leaderboards, and other users' profiles. Only the product owner can see their unpublished products.",
    icon: Shield,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10",
    tags: ["Security", "Improvement"],
    highlight: false,
    features: [
      { icon: Shield, text: "Drafts hidden from Explorer feed and Best Products leaderboard" },
      { icon: Lock, text: "Unlaunched scheduled products hidden from all public views" },
      { icon: Eye, text: "Owner still sees their own drafts on their profile page" },
      { icon: BarChart2, text: "Analytics Maker Rankings excludes unlaunched products" },
    ],
  },
  {
    version: "v1.0.2",
    date: "July 2, 2026",
    title: "Profile Page & Suspense Fix",
    summary: "Fixed build-time prerender errors on the profile page caused by useSearchParams(). Wrapped in Suspense boundary. Added Analytics link to footer.",
    icon: Zap,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
    tags: ["Improvement", "Performance"],
    highlight: false,
    features: [
      { icon: Zap, text: "Wrapped profile page in <Suspense> to fix Next.js static prerender bailout" },
      { icon: Globe, text: "Added Analytics link to footer under COMPANY section" },
      { icon: Shield, text: "Fixed TypeScript type errors in Comment imports on threads page" },
      { icon: Database, text: "Resolved FK join ambiguity in getProductShoutouts() queries" },
    ],
  },
  {
    version: "v1.0.1",
    date: "July 2, 2026",
    title: "Launch! IndiHunt Goes Live",
    summary: "The first public release of IndiHunt — India's premier product discovery platform. Core features including product launches, upvotes, comments, threads, maker profiles, and the awards system.",
    icon: Rocket,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    tags: ["New Feature"],
    highlight: false,
    features: [
      { icon: Rocket, text: "Product launch pages with screenshots, tags, and maker profiles" },
      { icon: Star, text: "Upvoting system with real-time count updates via database triggers" },
      { icon: MessageSquare, text: "Nested comments and thread discussions" },
      { icon: Users, text: "Maker profiles with karma, streak tracking, and follower system" },
      { icon: Award, text: "Golden Diya Awards for top-ranked products" },
      { icon: Search, text: "Search and category filtering across all products" },
      { icon: Bell, text: "Pre-launch pages for building waitlists before going live" },
      { icon: Globe, text: "Analytics, Newsletter, Stories, FAQ, Advertise pages" },
    ],
  },
];

export default function ChangelogPage() {
  const [expanded, setExpanded] = useState<string | null>("v2.19.0");

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
            Every feature, fix, and improvement shipped on the IndiHunt platform — documented as we build in public.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-8 pt-2">
            {[
              { label: "Releases", value: CHANGELOG.length.toString() },
              { label: "Features Shipped", value: `${CHANGELOG.reduce((a, c) => a + c.features.length, 0)}+` },
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
                  <div className={`absolute left-0 top-4 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center transition-all ${isOpen ? "border-orange-500 bg-orange-500/10" : "border-border bg-background"}`}>
                    <Icon className={`w-3.5 h-3.5 ${isOpen ? "text-orange-500" : "text-muted-foreground"}`} />
                  </div>

                  {/* Card */}
                  <div className={`bg-card border rounded-2xl shadow-sm transition-all ${item.highlight ? "border-orange-500/30 shadow-orange-500/5" : "border-border/80"}`}>

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
                            {item.tags.map(tag => (
                              <span key={tag} className={`text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${TAG_STYLES[tag] || "bg-muted text-muted-foreground"}`}>
                                {tag}
                              </span>
                            ))}
                          </div>

                          <h3 className="font-medium text-base sm:text-lg text-foreground/90 group-hover:text-orange-500 transition-colors">{item.title}</h3>
                          <p className="text-base text-foreground/80 leading-relaxed">{item.summary}</p>
                        </div>

                        {/* Expand toggle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? "bg-orange-500/10 text-orange-500" : "bg-muted text-muted-foreground"}`}>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                                <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                  <FIcon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                                </div>
                                <span className="text-base text-foreground/80 leading-relaxed">{feat.text}</span>
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
          <p className="text-base text-foreground/80">We build in public. More updates dropping soon.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/new" className="px-5 py-2.5 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white font-medium text-xs shadow-lg shadow-orange-500/15 transition-all">
              Launch Your Product
            </Link>
            <Link href="/newsletter" className="px-5 py-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground font-medium text-xs transition-colors">
              Subscribe to Newsletter
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}