"use client";


import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Flame,
  Globe,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import {
  getProducts,
  getCachedProducts,
  toggleUpvote,
  Product,
  supabase,
  getProductSlug
} from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { useAppDispatch, setAuthModalOpen } from "@/lib/store";

// Hierarchy of Topics, Categories & Sub-topics matching Product Hunt / IndiHunt
interface SubCategoryItem {
  name: string;
  slug: string;
}

interface ParentTopicItem {
  name: string;
  slug: string;
  subCategories: SubCategoryItem[];
}

const LAUNCH_TAGS_HIERARCHY: ParentTopicItem[] = [
  { name: "Alpha", slug: "alpha", subCategories: [] },
  { name: "Android", slug: "android", subCategories: [] },
  {
    name: "Apple",
    slug: "apple",
    subCategories: [
      { name: "iOS", slug: "ios" },
      { name: "macOS", slug: "macos" },
      { name: "watchOS", slug: "watchos" },
      { name: "iPadOS", slug: "ipados" },
    ]
  },
  {
    name: "Art",
    slug: "art",
    subCategories: [
      { name: "Coloring", slug: "coloring" },
      { name: "Calligraphy", slug: "calligraphy" },
      { name: "Painting", slug: "painting" },
      { name: "Digital Art", slug: "digital-art" },
      { name: "Modeling", slug: "modeling" },
      { name: "Crafting", slug: "crafting" },
      { name: "Video Art", slug: "video-art" },
      { name: "Illustration", slug: "illustration" },
      { name: "Printing", slug: "printing" },
      { name: "Drawing", slug: "drawing" },
    ]
  },
  {
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    subCategories: [
      { name: "AI Agents", slug: "ai-agents" },
      { name: "AI Coding Agents", slug: "ai-coding-agents" },
      { name: "AI Notetakers", slug: "ai-notetakers" },
      { name: "AI Presentation Software", slug: "presentation-software" },
      { name: "AI Workflow Automation", slug: "workflow-automation" },
      { name: "Chat Models", slug: "chat-models" },
      { name: "Generative AI", slug: "generative-ai" },
      { name: "LLMs", slug: "llms" },
      { name: "LLM", slug: "llm" },
    ]
  },
  {
    name: "Audio",
    slug: "audio",
    subCategories: [
      { name: "Music", slug: "music" },
      { name: "Podcasts", slug: "podcasts" },
      { name: "Sound Effects", slug: "sound-effects" },
    ]
  },
  {
    name: "Beauty & Fashion",
    slug: "beauty-fashion",
    subCategories: [
      { name: "Skincare", slug: "skincare" },
      { name: "Apparel", slug: "apparel" },
    ]
  },
  {
    name: "Books",
    slug: "books",
    subCategories: [
      { name: "E-Books", slug: "e-books" },
      { name: "Audiobooks", slug: "audiobooks" },
    ]
  },
  {
    name: "Browser Extensions",
    slug: "browser-extensions",
    subCategories: [
      { name: "Chrome Extensions", slug: "chrome-extensions" },
      { name: "Firefox Addons", slug: "firefox-addons" },
    ]
  },
  {
    name: "Business & SaaS",
    slug: "business",
    subCategories: [
      { name: "SaaS", slug: "saas" },
      { name: "Ad blockers", slug: "ad-blockers" },
      { name: "App switcher", slug: "app-switcher" },
      { name: "Content Management Systems", slug: "cms" },
      { name: "Calendar apps", slug: "calendar-apps" },
      { name: "Compliance software", slug: "compliance-software" },
      { name: "Customer support tools", slug: "customer-support-crm" },
      { name: "E-signature apps", slug: "e-signature-apps" },
      { name: "Email clients", slug: "email-clients" },
      { name: "File storage and sharing apps", slug: "file-storage" },
      { name: "Hiring software", slug: "hiring-software" },
      { name: "Knowledge base software", slug: "knowledge-base" },
      { name: "Legal services", slug: "legal-services" },
      { name: "Meeting software", slug: "meeting-software" },
      { name: "Note and writing apps", slug: "note-writing-apps" },
      { name: "PDF Editor", slug: "pdf-editor" },
      { name: "Password managers", slug: "password-managers" },
      { name: "Presentation Software", slug: "presentation-software" },
      { name: "Product demo", slug: "product-demo" },
      { name: "Project management software", slug: "project-management" },
      { name: "Resume tools", slug: "resume-tools" },
      { name: "Scheduling software", slug: "scheduling-software" },
      { name: "Screenshots and screen recording apps", slug: "screen-recording" },
      { name: "Search", slug: "search" },
      { name: "Security software", slug: "security-software" },
      { name: "Spreadsheets", slug: "spreadsheets" },
      { name: "Team collaboration software", slug: "team-collaboration" },
      { name: "Time tracking apps", slug: "time-tracking" },
      { name: "Video conferencing", slug: "video-conferencing" },
      { name: "Virtual office platforms", slug: "virtual-office" },
      { name: "Web browsers", slug: "web-browsers" },
      { name: "Writing assistants", slug: "writing-assistants" },
    ]
  },
  {
    name: "Engineering & Development",
    slug: "engineering-development",
    subCategories: [
      { name: "A/B testing tools", slug: "ab-testing" },
      { name: "AI Code Editors", slug: "ai-code-editors" },
      { name: "AI Code Testing", slug: "ai-code-testing" },
      { name: "AI Coding Agents", slug: "ai-coding-agents" },
      { name: "AI Databases", slug: "ai-databases" },
      { name: "Authentication & identity tools", slug: "auth-identity" },
      { name: "Automation tools", slug: "automation-tools" },
      { name: "Browser Automation", slug: "browser-automation" },
      { name: "Cloud Computing Platforms", slug: "cloud-computing" },
      { name: "Code Review Tools", slug: "code-review" },
      { name: "Code editors", slug: "code-editors" },
      { name: "Command line tools", slug: "cli-tools" },
      { name: "Databases and backend frameworks", slug: "databases-backend" },
      { name: "Deployment", slug: "deployment" },
      { name: "Hosting", slug: "hosting" },
      { name: "Git clients", slug: "git-clients" },
      { name: "Headless CMS software", slug: "headless-cms" },
      { name: "Issue tracking software", slug: "issue-tracking" },
      { name: "Membership software", slug: "membership-software" },
      { name: "Observability tools", slug: "observability" },
      { name: "Predictive AI", slug: "predictive-ai" },
      { name: "Real-time collaboration infra", slug: "realtime-infra" },
      { name: "Standup bots", slug: "standup-bots" },
      { name: "Static site generators", slug: "ssg" },
      { name: "Terminals", slug: "terminals" },
      { name: "Testing and QA software", slug: "testing-qa" },
      { name: "Unified API", slug: "unified-api" },
      { name: "VPN client", slug: "vpn-client" },
      { name: "Vibe Coding Tools", slug: "vibe-coding" },
      { name: "Video hosting platforms", slug: "video-hosting" },
      { name: "Web hosting services", slug: "web-hosting" },
      { name: "Website analytics", slug: "website-analytics" },
      { name: "Website builders", slug: "website-builders" },
    ]
  },
  {
    name: "Design & Creative",
    slug: "design-creative",
    subCategories: [
      { name: "3D & Animation", slug: "3d-animation" },
      { name: "AI Characters", slug: "ai-characters" },
      { name: "AI Generative Media", slug: "ai-generative-media" },
      { name: "AI Headshot Generators", slug: "ai-headshots" },
      { name: "Avatar generators", slug: "avatar-generators" },
      { name: "Background removal tools", slug: "bg-removal" },
      { name: "Camera apps", slug: "camera-apps" },
      { name: "Design inspiration websites", slug: "design-inspiration" },
      { name: "Design mockups", slug: "design-mockups" },
      { name: "Design resources", slug: "design-resources" },
      { name: "Digital whiteboards", slug: "digital-whiteboards" },
      { name: "Graphic design tools", slug: "graphic-design" },
      { name: "Icon sets", slug: "icon-sets" },
      { name: "Interface design tools", slug: "interface-design" },
      { name: "Mobile editing apps", slug: "mobile-editing" },
      { name: "Music Generation", slug: "music-generation" },
      { name: "Photo editing", slug: "photo-editing" },
      { name: "Podcasting Tools", slug: "podcasting-tools" },
      { name: "Social audio apps", slug: "social-audio" },
      { name: "Space design apps", slug: "space-design" },
      { name: "Stock photo sites", slug: "stock-photos" },
      { name: "UI frameworks", slug: "ui-frameworks" },
      { name: "User research", slug: "user-research" },
      { name: "Video editing", slug: "video-editing" },
      { name: "Wallpapers", slug: "wallpapers" },
      { name: "Wireframing", slug: "wireframing" },
    ]
  },
  {
    name: "Finance",
    slug: "finance",
    subCategories: [
      { name: "Accounting software", slug: "accounting" },
      { name: "Budgeting apps", slug: "budgeting" },
      { name: "Credit score tools", slug: "credit-score" },
      { name: "Financial planning", slug: "financial-planning" },
      { name: "Fundraising resources", slug: "fundraising" },
      { name: "Investing", slug: "investing" },
      { name: "Invoicing tools", slug: "invoicing" },
      { name: "Money transfer", slug: "money-transfer" },
      { name: "Neobanks", slug: "neobanks" },
      { name: "Online banking", slug: "online-banking" },
      { name: "Payroll software", slug: "payroll" },
      { name: "Remote workforce tools", slug: "remote-workforce" },
      { name: "Retirement planning", slug: "retirement-planning" },
      { name: "Savings apps", slug: "savings-apps" },
      { name: "Startup financial planning", slug: "startup-finance" },
      { name: "Startup incorporation", slug: "startup-incorporation" },
      { name: "Stock trading platforms", slug: "stock-trading" },
      { name: "Tax preparation", slug: "tax-prep" },
      { name: "Treasury management platforms", slug: "treasury-management" },
    ]
  },
  {
    name: "Marketing & Sales",
    slug: "marketing-sales",
    subCategories: [
      { name: "AI sales tools", slug: "ai-sales-tools" },
      { name: "Advertising tools", slug: "advertising-tools" },
      { name: "Affiliate marketing", slug: "affiliate-marketing" },
      { name: "CRM software", slug: "crm-software" },
      { name: "Customer loyalty platforms", slug: "customer-loyalty" },
      { name: "Email marketing", slug: "email-marketing" },
      { name: "GEO Tools", slug: "geo-tools" },
      { name: "Influencer marketing platforms", slug: "influencer-marketing" },
      { name: "Keyword research tools", slug: "keyword-research" },
      { name: "Landing page builders", slug: "landing-page-builders" },
      { name: "Lead generation software", slug: "lead-generation" },
      { name: "Marketing automation platforms", slug: "marketing-automation" },
      { name: "SEO tools", slug: "seo-tools" },
      { name: "Sales enablement", slug: "sales-enablement" },
      { name: "Sales training", slug: "sales-training" },
      { name: "Social media management tools", slug: "social-media-management" },
      { name: "Social media scheduling tools", slug: "social-media-scheduling" },
      { name: "Survey and form builders", slug: "survey-form-builders" },
    ]
  },
  {
    name: "Media & Entertainment",
    slug: "media-entertainment",
    subCategories: [
      { name: "Media & Entertainment", slug: "media-entertainment" },
      { name: "Video Streaming", slug: "video-streaming" },
      { name: "Podcast & Audio", slug: "podcast-audio" },
      { name: "Music & Beats", slug: "music-beats" },
      { name: "Voice Modulators", slug: "voice-modulators" },
      { name: "Media Players", slug: "media-players" },
      { name: "Screen Recording", slug: "screen-recording" },
      { name: "Video Editing", slug: "video-editing" },
      { name: "Animation & Video", slug: "animation-video" },
    ]
  }
];

// Curated Category Descriptions
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "ai-notetakers": "AI notetakers capture meetings, calls, and voice memos, then transcribe, summarize, and extract tasks for teams, sellers, and learners across tools and languages.",
  "presentation-software": "Presentation Software includes tools for creating structured slide decks—pitch decks, sales presentations, lessons, and team updates. Modern platforms use AI to generate slides from prompts or outlines.",
  "workflow-automation": "AI automation tools help design and run workflows that actually take action, not just suggest what to do next, allowing users to automate workflows efficiently.",
  "ad-blockers": "Ad blockers remove ads, trackers, and nags for cleaner, faster browsing. This category spans browser tools, DNS filters, and APIs for privacy, focus, and family safety.",
  "app-switcher": "App switchers centralize launching, switching, and actions across apps. Expect hotkeys, sidebars, and automation for builders, marketers, and power users.",
  "cms": "Tools that create, organize, and publish website content. From headless APIs to no‑code site builders and docs engines, they serve developers, editors, and teams.",
  "calendar-apps": "Calendar apps help you plan time, track events, and sync reminders. This category gathers tools that auto-schedule, integrate with chat, and support habit and goal planning.",
  "compliance-software": "Compliance software unites tools that secure access, verify identities, manage user data, and enforce policies—helping teams meet risk, infosec, and HR rules.",
  "customer-support-crm": "Customer support software is used by businesses to manage and streamline customer support operations including ticket management, live chat, and CRM integration.",
  "e-signature-apps": "E-signature apps enable secure electronic autographs on documents. Expect tools for signing, sharing, tracking, and PDFs—built for sales, legal, HR, and finance.",
  "email-clients": "Email clients manage sending, receiving, and organizing messages. This category spans inbox apps, deliverability services, AI sorting, and developer tools.",
  "file-storage": "Apps here store, sync, and share files so teams edit, send, and manage content securely. Expect cloud storage, collaboration, and privacy-first transfer.",
  "hiring-software": "Hiring software brings tools that source, vet, and manage candidates, run interviews, and handle onboarding to payroll—ideal for startups, SMBs, and global teams.",
  "knowledge-base": "Knowledge base software stores and surfaces answers from docs, notes, and apps. It centralizes team know‑how, speeds research, and guides builders.",
  "legal-services": "Legal services cover contracts, patents, compliance, IP, and estate planning—tools that draft, review, and manage legal tasks for startups and SMEs.",
  "meeting-software": "Tools to make meetings easier. The best course of action is to have less meetings, but if that's not possible you might as well find a tool that helps you plan and summarize.",
  "note-writing-apps": "Note and writing apps capture ideas, docs, and meetings in one place. They support collaboration, voice-to-text, mind maps, and linked notes.",
  "pdf-editor": "PDF editors allow you to modify, edit, and manipulate PDF files. These tools enable users to make changes to content, add images, and merge files.",
  "password-managers": "Password managers—aka credential vaults—securely store and autofill logins, 2FA, and secrets, helping individuals and teams protect accounts.",
  "product-demo": "Product demo tools turn screens and text into interactive tours, videos, and guides. Teams use them to explain features and onboard faster.",
  "project-management": "Project management software helps teams and individuals plan, organize, and track projects efficiently with centralized tasks, timelines, and communication.",
  "resume-tools": "Resume tools help you craft CVs, audit profiles, gauge pay, and prep interviews. They suit job seekers needing ATS-ready resumes and salary insight.",
  "scheduling-software": "Scheduling software organizes appointments and time slots, syncing calendars, auto-creating events from messages, and coordinating teams.",
  "screen-recording": "Capture what’s on your screen, record walkthroughs, and turn clicks into shareable visuals. Ideal for tutorials, bug reports, and async feedback.",
  "search": "Search tools collect and rank information across apps, websites, and maps. They help you find files, places, and answers fast.",
  "security-software": "Security and privacy tools that protect apps, data, and access. This category spans threat detection, pentesting, and monitoring.",
  "spreadsheets": "Spreadsheets are data grids for organizing, analyzing, and sharing numbers. This category spans tools for planning, reporting, apps, and calculators.",
  "team-collaboration": "Team collaboration software provides a centralized digital workspace for team members to communicate, collaborate, and work together effectively.",
  "time-tracking": "Time tracking apps log work hours, focus, and tool use to reveal where time goes. Great for freelancers and teams to plan, bill, and budget.",
  "video-conferencing": "Video conferencing tools power virtual meetings, interviews, classes, and team syncs—record, transcribe, translate, or build custom live apps.",
  "virtual-office": "Virtual office platforms unite tools for remote teamwork: coworking, meetings, scheduling, desk booking, and knowledge sharing.",
  "web-browsers": "Web browsers let you access and interact with websites and web apps. This category spans general use, privacy-focused, and coding browsers.",
  "writing-assistants": "Writing assistants help you draft, translate, summarize, and refine text. They turn audio into clean copy and boost research workflows.",
  "ai-code-editors": "AI coding tools and agentic IDEs that speed up software creation. These assistants edit multi-file projects, suggest code, and automate CLI tasks.",
  "ai-code-testing": "AI Code Testing tools automatically review, analyze, and validate code for errors or vulnerabilities, improving quality earlier in development.",
  "ai-coding-agents": "AI coding agents automate programming help: suggest code, refactor, debug, and integrate with editors, repos, and APIs for faster builds.",
  "ai-databases": "AI databases store vectors and analytics data for fast search, chat, and reports. They power embeddings and real-time queries for GenAI.",
  "vibe-coding": "Vibe Coding Tools bundle AI-first editors, app builders, proxies, and Python/web stacks to speed building, scraping, and deploying fast.",
  "media-entertainment": "Video renderers, streaming servers, voice modulators, podcast engines, and high-performance media players.",
  "video-streaming": "Live streaming platforms, broadcast infrastructure, and video-on-demand architectures.",
  "podcast-audio": "Tools for recording, mastering, hosting, and distributing high-fidelity podcast audio.",
  "music-beats": "AI music generation, synthesizers, audio mastering plugins, and beat production tools.",
  "voice-modulators": "Real-time AI voice morphing, speech enhancement, spatial audio, and vocal effects engines.",
  "media-players": "Ultra-responsive GPU-accelerated video and music playback applications with universal codec support."
};

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const selectedTopic = searchParams.get("topic") || "";
  const selectedParent = searchParams.get("parentTopic") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [products, setProducts] = useState<Product[]>(() => {
    return typeof window !== 'undefined' ? getCachedProducts() : [];
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    return isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  });
  const ITEMS_PER_PAGE = 20;

  // Sync page from URL if changed externally
  useEffect(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    if (!isNaN(p) && p >= 1 && p !== currentPage) {
      setCurrentPage(p);
    }
  }, [searchParams]);

  // Auth Listener
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Products
  useEffect(() => {
    const fetchProductsList = async () => {
      const list = await getProducts(currentUser?.id || undefined);
      setProducts(list);
    };
    fetchProductsList();
  }, [currentUser]);

  // Reset page and scroll to top when topic or parent changes
  useEffect(() => {
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedTopic, selectedParent]);

  // Dynamic current Month & Year
  const currentMonthYear = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
  }, []);

  // Resolve active display title
  const activeTitle = useMemo(() => {
    if (selectedTopic) {
      // Look up subcategory name
      let subName = "";
      for (const parent of LAUNCH_TAGS_HIERARCHY) {
        const found = parent.subCategories.find(s => s.slug === selectedTopic);
        if (found) {
          subName = found.name;
          break;
        }
      }
      const displayName = subName || (selectedTopic.charAt(0).toUpperCase() + selectedTopic.slice(1).replace(/-/g, " "));
      return `Best ${displayName} products of ${currentMonthYear}`;
    }
    if (selectedParent) {
      const parentObj = LAUNCH_TAGS_HIERARCHY.find(p => p.slug === selectedParent);
      const parentName = parentObj ? parentObj.name : selectedParent.charAt(0).toUpperCase() + selectedParent.slice(1).replace(/-/g, " ");
      return `Best ${parentName} products of ${currentMonthYear}`;
    }
    return `Best Products of ${currentMonthYear}`;
  }, [selectedTopic, selectedParent, currentMonthYear]);

  // Resolve active description
  const activeDescription = useMemo(() => {
    const activeSlug = selectedTopic || selectedParent;
    if (activeSlug && CATEGORY_DESCRIPTIONS[activeSlug]) {
      return CATEGORY_DESCRIPTIONS[activeSlug];
    }
    if (selectedTopic || selectedParent) {
      const topicName = selectedTopic ? (selectedTopic.charAt(0).toUpperCase() + selectedTopic.slice(1).replace(/-/g, " ")) : selectedParent;
      return `Discover the best ${topicName} products of ${currentMonthYear} as chosen by IndiHunt users.`;
    }
    return `Discover the best products of ${currentMonthYear} as chosen by IndiHunt users.`;
  }, [selectedTopic, selectedParent, currentMonthYear]);

  // Filter products by current month & topic / parentTopic
  const filteredProducts = useMemo(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(Date.now() + IST_OFFSET_MS);
    const currentYear = istNow.getUTCFullYear();
    const currentMonth = istNow.getUTCMonth();

    // 1. Filter products launched in the current month
    const currentMonthProducts = products.filter(p => {
      if (p.status === "draft") return false;
      const pDate = p.scheduled_for
        ? new Date(p.scheduled_for)
        : (p.created_at ? new Date(p.created_at) : null);
      if (!pDate) return false;
      const istPDate = new Date(pDate.getTime() + IST_OFFSET_MS);
      return istPDate.getUTCFullYear() === currentYear && istPDate.getUTCMonth() === currentMonth;
    });

    const sourceProducts = currentMonthProducts.length > 0 ? currentMonthProducts : products;

    const activeQuery = (selectedTopic || selectedParent).toLowerCase().replace(/[^a-z0-9]+/g, "");

    if (!activeQuery) return sourceProducts;

    return sourceProducts.filter(p => {
      const tagsMatch = (p.tags || []).some(t => {
        const cleanT = t.toLowerCase().replace(/[^a-z0-9]+/g, "");
        return cleanT.includes(activeQuery) || activeQuery.includes(cleanT);
      });
      const catMatch = p.category ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, "").includes(activeQuery) : false;
      const textMatch = `${p.name} ${p.tagline} ${p.description || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, "").includes(activeQuery);

      return tagsMatch || catMatch || textMatch;
    });
  }, [products, selectedTopic, selectedParent]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(validPage);

    // Sync URL query without full reload
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (validPage === 1) {
        params.delete("page");
      } else {
        params.set("page", validPage.toString());
      }
      const newQuery = params.toString() ? `?${params.toString()}` : "";
      window.history.pushState(null, "", `${window.location.pathname}${newQuery}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push("dots-left");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("dots-right");
    }

    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    const validPage = Math.min(currentPage, totalPages);
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage, totalPages]);

  const handleVote = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser?.id) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    const result = await toggleUpvote(productId, currentUser.id);
    if (result.success) {
      setProducts(prev => prev.map(p => {
        if (p.id === productId || (result.productId && p.id === result.productId)) {
          return {
            ...p,
            upvotes_count: result.upvotes_count,
            has_upvoted: typeof result.has_upvoted === 'boolean' ? result.has_upvoted : !p.has_upvoted
          };
        }
        return p;
      }));
    }
  };

  const selectTag = (topicSlug?: string, parentSlug?: string) => {
    const params = new URLSearchParams();
    if (topicSlug) params.set("topic", topicSlug);
    if (parentSlug) params.set("parentTopic", parentSlug);
    const queryString = params.toString();
    router.push(queryString ? `/products?${queryString}` : "/products");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300 pt-[76px] sm:pt-[84px]">
      <Navbar
        searchQuery=""
        onSearchChange={() => { }}
        onForumsClick={() => { router.push("/discussions"); }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* ── Left Sidebar: Launch Tags & Sub-categories ── */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div className="space-y-4">

                {/* Header Row: Title & Clear Selection */}
                <div className="flex items-center justify-between pb-2 ">
                  <h3 className="text-base font-medium text-foreground/90 tracking-tight">
                    Launch tags
                  </h3>
                  {(selectedTopic || selectedParent) && (
                    <button
                      onClick={() => selectTag(undefined, undefined)}
                      className="text-xs text-muted-foreground hover:text-[#ff5733] transition-colors cursor-pointer"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                {/* Main Tags List with Exact Navbar Font Styling (text-base font-medium) */}
                <div className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                  {LAUNCH_TAGS_HIERARCHY.map((parent) => {
                    const isParentSelected = selectedParent === parent.slug || (!selectedParent && selectedTopic && LAUNCH_TAGS_HIERARCHY.find(p => p.slug === parent.slug)?.subCategories.some(s => s.slug === selectedTopic));

                    return (
                      <div key={parent.slug} className="space-y-1">
                        {/* Parent Tag Item */}
                        <button
                          onClick={() => {
                            if (parent.subCategories.length > 0) {
                              selectTag(parent.subCategories[0].slug, parent.slug);
                            } else {
                              selectTag(parent.slug, undefined);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-base font-medium transition-colors flex items-center justify-between cursor-pointer ${isParentSelected
                            ? "text-[#ff5733]"
                            : "text-foreground/80 hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                          <span>{parent.name}</span>
                        </button>

                        {/* Sub-categories (rendered under selected parent topic) */}
                        {isParentSelected && parent.subCategories.length > 0 && (
                          <div className="pl-3 space-y-0.5 border-l-2 border-border/40 ml-2 my-1">
                            {parent.subCategories.map((sub) => {
                              const isSubSelected = selectedTopic === sub.slug;
                              return (
                                <button
                                  key={sub.slug}
                                  onClick={() => selectTag(sub.slug, parent.slug)}
                                  className={`w-full text-left px-2.5 py-1 rounded-md text-base font-medium transition-colors cursor-pointer block truncate ${isSubSelected
                                    ? "text-[#ff5733]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    }`}
                                >
                                  {sub.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>

          {/* ── Right Content Area: Products List & Headers ── */}
          <div className="lg:col-span-9 space-y-6">

            {/* Title & Description Header */}
            <div className="space-y-2  pb-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-foreground/90">
                {activeTitle}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                {activeDescription}
              </p>

              {/* Product Count indicator */}
              <div className="pt-2 text-base text-muted-foreground font-medium">
                {filteredProducts.length > 0 ? (
                  <span>
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} {selectedTopic || selectedParent || "product"}{filteredProducts.length === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span>0 products found</span>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="space-y-4">
              {paginatedProducts.length === 0 ? (
                <div className="text-center py-16 bg-card/30 border border-border/60 rounded-3xl text-base text-muted-foreground">
                  No products found for this tag yet.
                </div>
              ) : (
                paginatedProducts.map((product, idx) => {
                  const absoluteIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  return (
                    <div
                      key={product.id}
                      onClick={() => router.push(`/products/${getProductSlug(product.name)}`)}
                      className="group relative rounded-2xl bg-card border border-border/80 p-5 sm:p-6 transition-all duration-200 hover:bg-muted/40 hover:border-border cursor-pointer space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          {/* Logo */}
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-muted border border-border/80 flex-shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                            <img
                              src={product.logo_url}
                              alt={product.name}
                              className="object-cover rounded-xl group-hover:scale-105 transition-transform w-full h-full"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-medium text-foreground/90 group-hover:text-[#ff5733] transition-colors truncate">
                                {absoluteIdx}. {product.name}
                              </span>
                              {product.country === "India" && (
                                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                  🇮🇳 Built in India
                                </span>
                              )}
                            </div>

                            <p className="mt-0.5 block text-base text-foreground/80 line-clamp-1">
                              {product.tagline}
                            </p>

                            {/* Rating / Followers Line */}
                            <div className="flex items-center gap-2 text-base text-muted-foreground pt-0.5 flex-wrap">
                              <div className="flex items-center text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <svg key={s} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span>·</span>
                              <span>{Math.max(product.upvotes_count * 3 + 12, 35)} Followers</span>
                              <span>·</span>
                              <Link
                                href={`/products/${getProductSlug(product.name)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-[#ff5733] transition-colors"
                              >
                                Leave a review
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Right Upvote Button */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                          <button
                            onClick={(e) => handleVote(e, product.id)}
                            type="button"
                            data-test="vote-button"
                            className="relative"
                            title="Upvote product"
                          >
                            <div
                              className={`group/accessory flex size-12 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${
                                product.has_upvoted
                                  ? "bg-orange-500/10 text-[#ff5733]"
                                  : "border border-border bg-card hover:border-[#ff5733]"
                              }`}
                              data-filled={product.has_upvoted ? "true" : "false"}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 16 16"
                                className={`size-4 stroke-[1.5px] transition-all duration-300 ${
                                  product.has_upvoted
                                    ? "fill-[#ff5733] stroke-[#ff5733]"
                                    : "fill-white dark:fill-transparent stroke-slate-700 dark:stroke-slate-300 group-hover/accessory:stroke-[#ff5733]"
                                }`}
                              >
                                <path d="M6.579 3.467c.71-1.067 2.132-1.067 2.842 0L12.975 8.8c.878 1.318.043 3.2-1.422 3.2H4.447c-1.464 0-2.3-1.882-1.422-3.2z" />
                              </svg>
                              <span className="text-base font-medium leading-none text-foreground">
                                {product.upvotes_count || 0}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Numeric Pagination ── */}
            {totalPages > 1 && (
              <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of{" "}
                  <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
                </p>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  {/* First Page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  {pageNumbers.map((pageNum, idx) => {
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
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[36px] h-9 sm:min-w-[40px] sm:h-10 px-2.5 sm:px-3 rounded-xl text-sm sm:text-base font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-orange-500 text-white font-semibold shadow-xs"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground border border-border/40 bg-card"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Page */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
