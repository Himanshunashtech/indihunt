"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare,
  ArrowUp,
  Plus,
  Search,
  Eye,
  Flame,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  ArrowLeft,
  Globe,
  Zap,
  HelpCircle,
  Users,
  Megaphone,
  Code2,
  Target,
  Briefcase,
  MessageSquarePlus,
  MoreVertical,
  Pencil,
  Trash2,
  Flag,
} from "lucide-react";
import { ReportModal } from "@/components/ReportModal";
import { secureApiFetch } from "@/lib/api/client";
import {
  supabase,
  getThreads,
  getCachedThreads,
  toggleThreadUpvote,
  createThread,
  updateThread,
  deleteThread,
  reportThread,
  Thread,
  getFollowedForums,
  toggleFollowForum,
  getProductSlug,
} from "@/lib/supabase";
import { useAppDispatch, setAuthModalOpen } from "@/lib/store";
import Navbar from "@/components/Navbar";
import DiscussionsSidebar, { DISCUSSIONS_CATEGORIES } from "@/components/DiscussionsSidebar";
import { CircularLoader } from "@/components/CircularLoader";
import { UserHoverCard } from "@/components/UserHoverCard";

const FORUM_METADATA: Record<string, { title: string; subtitle: string; icon: React.ElementType; isLogo?: boolean }> = {
  all: {
    title: "Connect with the IndiHunt community",
    subtitle: "Start a thread, join a discussion, stay in the loop.",
    icon: Globe,
    isLogo: true,
  },
  general: {
    title: "p/general",
    subtitle: "Share and discuss tech, products, business, startups, or product recommendations",
    icon: Globe,
  },
  vibecoding: {
    title: "p/vibecoding",
    subtitle: "Discuss AI tools, cursor, vibe coding, frameworks, and fast prototyping",
    icon: Zap,
  },
  ask: {
    title: "p/ask",
    subtitle: "Ask questions, get advice from Indian founders, or host an AMA",
    icon: HelpCircle,
  },
  "introduce-yourself": {
    title: "p/introduce-yourself",
    subtitle: "Introduce yourself, share what you're building, and meet other makers",
    icon: Users,
  },
  "self-promotion": {
    title: "p/self-promotion",
    subtitle: "Showcase your products, side projects, landing pages, and launch updates",
    icon: Megaphone,
  },
  faq: {
    title: "p/faq",
    subtitle: "Frequently asked questions about launching, upvoting, awards, and community rules",
    icon: HelpCircle,
  },
  vercel: {
    title: "p/vercel",
    subtitle: "Discussions about Next.js, Vercel deployment, serverless, and React ecosystem",
    icon: Code2,
  },
  indihunt: {
    title: "p/indihunt",
    subtitle: "Feedback, feature requests, platform updates, and ideas for IndiHunt",
    icon: Target,
  },
  linkedin: {
    title: "p/linkedin",
    subtitle: "Growth strategies, networking, personal branding, and career discussions",
    icon: Briefcase,
  },
};

const CATEGORIES = [
  { id: "all",                 label: "All Discussions",   emoji: "🌐" },
  { id: "General",             label: "General",            emoji: "💬" },
  { id: "vibecoding",          label: "Vibe Coding",        emoji: "⚡" },
  { id: "Ask",                 label: "AMA / Ask",          emoji: "🙋" },
  { id: "introduce-yourself",  label: "Introductions",      emoji: "👋" },
  { id: "self-promotion",      label: "Self-Promotion",     emoji: "📣" },
  { id: "faq",                 label: "FAQ / Support",      emoji: "❓" },
  { id: "vercel",              label: "p/vercel",           emoji: "▲" },
  { id: "IndiHunt",            label: "p/IndiHunt",         emoji: "🎯" },
  { id: "linkedin",            label: "p/LinkedIn",         emoji: "💼" },
];

type SortMode = "trending" | "newest" | "top";

interface DiscussionsClientProps {
  initialThreads?: Thread[];
}

export default function DiscussionsClient({
  initialThreads = [],
}: DiscussionsClientProps = {}) {
  const dispatch = useAppDispatch();

  const [currentUser,    setCurrentUser]    = useState<any>(null);
  const [threads,        setThreads]        = useState<Thread[]>(() => {
    if (initialThreads.length > 0) return initialThreads;
    return getCachedThreads();
  });
  const [loading,        setLoading]        = useState(() => initialThreads.length === 0 && getCachedThreads().length === 0);
  const [selectedForum,  setSelectedForum]  = useState("all");
  const [sortMode,       setSortMode]       = useState<SortMode>("trending");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [catCounts,      setCatCounts]      = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    const list = initialThreads.length > 0 ? initialThreads : getCachedThreads();
    list.forEach((t: Thread) => { const c = t.category?.toLowerCase() || "general"; counts[c] = (counts[c] || 0) + 1; });
    return counts;
  });
  const [pulseActiveMakers,    setPulseActiveMakers]    = useState(0);
  const [pulseUpvotes,         setPulseUpvotes]         = useState(0);
  const [pulseCategoriesCount, setPulseCategoriesCount] = useState(0);
  const [isNewThreadOpen,  setIsNewThreadOpen]  = useState(false);
  const [newThreadTitle,   setNewThreadTitle]   = useState("");
  const [newThreadBody,    setNewThreadBody]    = useState("");
  const [newThreadCategory, setNewThreadCategory] = useState("General");
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [followedForums,   setFollowedForums]   = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setCurrentUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // Load followed categories
  useEffect(() => {
    if (currentUser) {
      getFollowedForums(currentUser.id).then(setFollowedForums);
    }
  }, [currentUser]);

  // Load threads
  useEffect(() => {
    const load = async () => {
      if (threads.length === 0) setLoading(true);
      const list = await getThreads(currentUser?.id);
      setThreads(list);
      const counts: Record<string, number> = {};
      list.forEach(t => { const c = t.category?.toLowerCase() || "general"; counts[c] = (counts[c] || 0) + 1; });
      setCatCounts(counts);
      setLoading(false);
    };
    load();
  }, [currentUser?.id]);

  // Pulse stats
  useEffect(() => {
    fetch('/t/stats/pulse')
      .then(res => res.ok ? res.json() : null)
      .then(resData => {
        const data = resData?.data || resData;
        if (data) {
          if (typeof data.activeMakers === 'number') setPulseActiveMakers(data.activeMakers);
          if (typeof data.upvotesCount === 'number') setPulseUpvotes(data.upvotesCount);
          if (typeof data.categoriesCount === 'number') setPulseCategoriesCount(data.categoriesCount);
        }
      })
      .catch(() => {});
  }, []);

  // Sync category for new thread modal
  useEffect(() => {
    setNewThreadCategory(selectedForum !== "all" ? selectedForum : "General");
  }, [selectedForum]);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingThread, setEditingThread] = useState<Thread | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [isUpdating, setIsUpdating] = useState(false);
  const [reportingThreadId, setReportingThreadId] = useState<string | null>(null);
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    targetId: string;
    targetType: "thread" | "comment" | "product";
    title?: string;
  }>({
    isOpen: false,
    targetId: "",
    targetType: "thread",
  });
  const [reportReason, setReportReason] = useState("spam");
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (!activeMenuId) return;
    const clickHandler = () => setActiveMenuId(null);
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [activeMenuId]);

  const handleDeleteThread = async (threadId: string) => {
    if (!currentUser) { dispatch(setAuthModalOpen(true)); return; }
    if (!confirm("Are you sure you want to delete this thread?")) return;
    const ok = await deleteThread(threadId, currentUser.id);
    if (ok) {
      setThreads(prev => prev.filter(t => t.id !== threadId));
      setActiveMenuId(null);
    }
  };

  const handleOpenEditModal = (thread: Thread) => {
    setEditingThread(thread);
    setEditTitle(thread.title);
    setEditBody(thread.body);
    setEditCategory(thread.category || "General");
    setActiveMenuId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread || !currentUser || !editTitle.trim() || !editBody.trim()) return;
    setIsUpdating(true);
    try {
      const ok = await updateThread(editingThread.id, currentUser.id, {
        title: editTitle.trim(),
        body: editBody.trim(),
        category: editCategory,
      });
      if (ok) {
        setThreads(prev => prev.map(t => t.id === editingThread.id ? { ...t, title: editTitle.trim(), body: editBody.trim(), category: editCategory } : t));
        setEditingThread(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVote = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUser) { dispatch(setAuthModalOpen(true)); return; }

    const targetThread = threads.find(t => t.id === threadId);
    const wasUpvoted = !!targetThread?.has_upvoted;
    const optimisticCount = wasUpvoted
      ? Math.max(0, (targetThread?.upvotes_count || 1) - 1)
      : (targetThread?.upvotes_count || 0) + 1;

    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, upvotes_count: optimisticCount, has_upvoted: !wasUpvoted } : t));

    const result = await toggleThreadUpvote(threadId, currentUser.id);
    if (result.success) {
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, upvotes_count: result.upvotes_count } : t));
    } else {
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, upvotes_count: targetThread?.upvotes_count || 0, has_upvoted: wasUpvoted } : t));
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newThreadTitle.trim() || !newThreadBody.trim()) return;
    setIsSubmitting(true);
    try {
      const thread = await createThread({ title: newThreadTitle.trim(), body: newThreadBody.trim(), category: newThreadCategory, user_id: currentUser.id }, currentUser.id);
      if (thread) { setThreads(prev => [thread, ...prev]); setNewThreadTitle(""); setNewThreadBody(""); setIsNewThreadOpen(false); }
    } finally { setIsSubmitting(false); }
  };

  const filtered = threads
    .filter(t => {
      const matchesCat = selectedForum === "all" || t.category?.toLowerCase() === selectedForum.toLowerCase();
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.body.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortMode === "trending") return b.comments_count - a.comments_count;
      if (sortMode === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return b.upvotes_count - a.upvotes_count;
    });

  const totalCount = Object.values(catCounts).reduce((a, b) => a + b, 0);

  const timeAgo = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const openThread = () => {
    if (!currentUser) { dispatch(setAuthModalOpen(true)); return; }
    setIsNewThreadOpen(true);
  };

  const activeCat = CATEGORIES.find(c => c.id === selectedForum);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300 pt-[76px] sm:pt-[84px]">

      <Navbar />

      {/* Mobile search */}
      <div className="md:hidden max-w-7xl mx-auto px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-full py-2.5 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-border transition-colors"
          />
        </div>
      </div>
      <div className="lg:hidden max-w-7xl mx-auto px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 -mx-4 px-4">
          {DISCUSSIONS_CATEGORIES.map(cat => {
            const active = selectedForum.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedForum(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  active
                    ? "bg-muted text-foreground border-border font-semibold shadow-2xs"
                    : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Sidebar */}
          <DiscussionsSidebar
            selectedForum={selectedForum}
            onSelectForum={setSelectedForum}
            onOpenNewThread={openThread}
            catCounts={catCounts}
            totalThreadsCount={threads.length}
          />

          {/* Thread Feed */}
          <div className="lg:col-span-9 flex flex-col gap-4">
            {/* Hero Card Banner (Category & Community Header) */}
            {(() => {
              const forumKey = (selectedForum || "all").toLowerCase();
              const forumMeta = FORUM_METADATA[forumKey] || {
                title: `p/${selectedForum.toLowerCase().replace(/\s+/g, '-')}`,
                subtitle: "Share and discuss tech, products, business, startups, or product recommendations",
                icon: Globe,
              };
              const ForumIcon = forumMeta.icon;

              return (
                <div className="relative mb-4 box-border flex w-full flex-col gap-4 rounded-3xl bg-card border border-border/80 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    {forumMeta.isLogo ? (
                      <div className="w-12 h-12 shrink-0 rounded-2xl border border-border/80 bg-[#ff5733] text-white flex items-center justify-center font-bold text-xl shadow-sm" style={{ width: "48px", height: "48px" }}>
                        IH
                      </div>
                    ) : (
                      <div className="w-12 h-12 shrink-0 rounded-2xl border border-border/80 bg-muted/40 flex items-center justify-center text-muted-foreground shadow-2xs" style={{ width: "48px", height: "48px" }}>
                        <ForumIcon className="w-6 h-6 text-foreground/80" />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">{forumMeta.title}</h1>
                      <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed">{forumMeta.subtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={openThread}
                    className="relative w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-[#ff5733] hover:bg-[#e64a19] px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Start new thread</span>
                  </button>
                </div>
              );
            })()}

            {/* Feed header + sort tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                  {selectedForum === "all" ? "All Discussions" : `${activeCat?.emoji ?? "💬"} ${activeCat?.label ?? selectedForum}`}
                  <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal text-xs">
                    ({filtered.length})
                  </span>
                </h2>
                {selectedForum !== "all" && (
                  <button
                    onClick={async () => {
                      if (!currentUser) { dispatch(setAuthModalOpen(true)); return; }
                      const res = await toggleFollowForum(selectedForum, currentUser.id);
                      if (res.success) {
                        setFollowedForums(prev =>
                          res.followed ? [...prev, selectedForum] : prev.filter(f => f !== selectedForum)
                        );
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                      followedForums.includes(selectedForum)
                        ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-500 hover:bg-emerald-500/20"
                        : "bg-muted border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    {followedForums.includes(selectedForum) ? "✓ Following" : "+ Follow Forum"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
                {([
                  { id: "trending" as SortMode, label: "Trending", Icon: Flame  },
                  { id: "newest"   as SortMode, label: "Newest",   Icon: Clock  },
                  { id: "top"      as SortMode, label: "Top",      Icon: ArrowUp },
                ]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSortMode(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      sortMode === tab.id ? "bg-muted text-foreground border border-border/80 shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Forum Banner */}
            {selectedForum === "faq" && (
              <div className="w-full relative rounded-2xl overflow-hidden border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-card to-background p-6 sm:p-8 shadow-md mb-4 border-l-4 border-l-orange-500 flex flex-col justify-center space-y-2">
                <span className="inline-flex items-center gap-1 bg-[#ff5733] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider w-max">
                  Official Guide
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
                  Frequently Asked Questions
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm sm:max-w-md leading-relaxed">
                  Welcome to the IndiHunt FAQ forum. Find answers to common questions about launching, voting, awards, streaks, and community rules.
                </p>
              </div>
            )}

            {/* Inline Create Thread Form */}
            {isNewThreadOpen && (
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Start a Discussion 💬</h3>
                  <button onClick={() => setIsNewThreadOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Share ideas, ask questions, or spark a conversation with the community.</p>
                <form onSubmit={handleCreateThread} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Forum Category</label>
                    <select value={newThreadCategory} onChange={e => setNewThreadCategory(e.target.value)} className="w-full max-w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500">
                      <option value="General">p/general</option>
                      <option value="vibecoding">p/vibecoding</option>
                      <option value="Ask">p/ama</option>
                      <option value="introduce-yourself">p/introduce-yourself</option>
                      <option value="self-promotion">p/self-promotion</option>
                      <option value="faq">p/faq</option>
                      <option value="vercel">p/vercel</option>
                      <option value="IndiHunt">p/IndiHunt</option>
                      <option value="linkedin">p/linkedin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Thread Title</label>
                    <input type="text" required placeholder="What's on your mind?" value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Discussion Content</label>
                    <textarea required rows={5} placeholder="Explain your idea or question in detail..." value={newThreadBody} onChange={e => setNewThreadBody(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500 resize-none" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setIsNewThreadOpen(false)} className="px-4 py-2 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl cursor-pointer transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting || !newThreadTitle.trim() || !newThreadBody.trim()} className="px-6 py-2 bg-[#ff5733] text-white text-xs font-semibold rounded-xl hover:bg-[#e64a19] disabled:opacity-50 transition-all cursor-pointer">
                      {isSubmitting ? "Posting…" : "Post Thread"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Inline Edit Thread Form */}
            {editingThread && (
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Edit Thread ✏️</h3>
                  <button onClick={() => setEditingThread(null)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Update your discussion thread details below.</p>
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Forum Category</label>
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full max-w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500">
                      <option value="General">p/general</option>
                      <option value="vibecoding">p/vibecoding</option>
                      <option value="Ask">p/ama</option>
                      <option value="introduce-yourself">p/introduce-yourself</option>
                      <option value="self-promotion">p/self-promotion</option>
                      <option value="faq">p/faq</option>
                      <option value="vercel">p/vercel</option>
                      <option value="IndiHunt">p/IndiHunt</option>
                      <option value="linkedin">p/linkedin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Thread Title</label>
                    <input type="text" required placeholder="What's on your mind?" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Discussion Content</label>
                    <textarea required rows={5} placeholder="Explain your idea or question in detail..." value={editBody} onChange={e => setEditBody(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500 resize-none" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setEditingThread(null)} className="px-4 py-2 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl cursor-pointer transition-colors">Cancel</button>
                    <button type="submit" disabled={isUpdating || !editTitle.trim() || !editBody.trim()} className="px-6 py-2 bg-[#ff5733] text-white text-xs font-semibold rounded-xl hover:bg-[#e64a19] disabled:opacity-50 transition-all cursor-pointer">
                      {isUpdating ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Threads */}
            {loading ? (
              <CircularLoader label="Loading discussions..." size="lg" />
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-card/30 border-2 border-dashed border-border rounded-2xl">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No discussions yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Be the first to start one!</p>
                <button
                  onClick={openThread}
                  className="inline-flex items-center gap-2 bg-[#ff5733] text-white text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer hover:bg-[#e64a19] transition-all"
                >
                  <Plus className="w-4 h-4" /> Start a Discussion
                </button>
              </div>
            ) : (
              <>
                {filtered.map(thread => (
                  <div
                    key={thread.id}
                    className="group relative flex flex-col sm:flex-row items-start justify-between gap-4 rounded-xl p-4 transition-all duration-200 border border-transparent hover:bg-muted/50 dark:hover:bg-muted/30 hover:border-border/80"
                  >
                    {/* Main thread info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Category & User metadata line */}
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
                        <span className="font-medium text-muted-foreground flex items-center gap-1">
                          <span>p/{thread.category ? thread.category.toLowerCase().replace(/\s+/g, '-') : 'general'}</span>
                        </span>
                        <span>by</span>
                        <UserHoverCard user={thread.user} userId={thread.user_id}>
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground hover:underline transition-colors cursor-pointer">
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-muted border border-border/80 flex-shrink-0" style={{ width: "16px", height: "16px" }}>
                              {thread.user?.avatar_url ? (
                                <Image
                                  src={thread.user.avatar_url}
                                  alt={thread.user.full_name || thread.user.username || "User"}
                                  className="w-full h-full object-cover"
                                width={48} height={48} />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-[8px] font-semibold text-white uppercase">
                                  {(thread.user?.full_name?.charAt(0) || thread.user?.username?.charAt(0) || "M")}
                                </div>
                              )}
                            </div>
                            <span>{thread.user?.full_name || `@${thread.user?.username}` || "Maker"}</span>
                          </span>
                        </UserHoverCard>
                        <span className="opacity-40">•</span>
                        <span className="font-normal">{timeAgo(thread.created_at)}</span>

                        {/* Three Dots Menu Options */}
                        <div className="relative inline-block ml-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === thread.id ? null : thread.id);
                            }}
                            className="p-1 rounded-lg border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Thread options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuId === thread.id && (
                            <div
                              className="absolute left-0 sm:left-auto sm:right-0 top-6 z-30 w-44 rounded-xl border border-border bg-card shadow-lg p-1 space-y-0.5"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              {(currentUser && (currentUser.id === thread.user_id || !thread.user_id)) && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditModal(thread)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Edit Thread</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteThread(thread.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    <span>Delete Thread</span>
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!currentUser) { dispatch(setAuthModalOpen(true)); return; }
                                  setReportModalState({
                                    isOpen: true,
                                    targetId: thread.id,
                                    targetType: "thread",
                                    title: "Report Forum thread",
                                  });
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                              >
                                <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Report Thread</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <Link href={`/threads/${getProductSlug(thread.title)}`}>
                        <h3 className="text-base font-medium text-foreground/90 transition-all duration-300 group-hover:underline cursor-pointer line-clamp-2">
                          {thread.title}
                        </h3>
                      </Link>

                      {/* Body snippet */}
                      <p className="mt-0.5 block text-base text-foreground/80 line-clamp-2 leading-relaxed">
                        {thread.body}
                      </p>
                    </div>

                    {/* Right side side-by-side action boxes (Comment Count & Upvote Button) */}
                    <div className="flex flex-row items-center gap-3 flex-shrink-0 self-end sm:self-center">
                      {/* Comment Count Box */}
                      <Link 
                        href={`/threads/${getProductSlug(thread.title)}`}
                        className="group/btn flex size-12 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card hover:border-orange-500/60 transition-all cursor-pointer"
                        title="View replies"
                      >
                        <MessageSquare className="size-3.5 stroke-[#344054] dark:stroke-slate-400 group-hover/btn:stroke-[#ff5733] transition-colors" />
                        <span className="text-sm font-medium leading-none text-foreground">{thread.comments_count}</span>
                      </Link>

                      {/* Upvote Box */}
                      <button
                        onClick={e => handleVote(e, thread.id)}
                        className={`group/upvote flex size-12 flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
                          thread.has_upvoted
                            ? "border-2 border-[#ff5733] bg-card text-foreground"
                            : "border border-border bg-card hover:border-[#ff5733]/60 text-foreground"
                        }`}
                        title="Upvote thread"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 16 16"
                          className={`size-4 stroke-[1.5px] transition-all duration-300 ${
                            thread.has_upvoted
                              ? "fill-[#ff5733] stroke-[#ff5733]"
                              : "fill-white dark:fill-transparent stroke-slate-700 dark:stroke-slate-300 group-hover/upvote:stroke-[#ff5733]"
                          }`}
                        >
                          <path d="M6.579 3.467c.71-1.067 2.132-1.067 2.842 0L12.975 8.8c.878 1.318.043 3.2-1.422 3.2H4.447c-1.464 0-2.3-1.882-1.422-3.2z" />
                        </svg>
                        <span className="text-sm font-medium leading-none text-foreground">
                          {thread.upvotes_count}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}

                <button className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground text-xs font-semibold hover:bg-muted/30 hover:border-[#ff5733]/30 hover:text-[#ff5733] transition-all cursor-pointer">
                  Load more discussions
                </button>
              </>
            )}
          </div>
        </div>
      </main>
      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalState.isOpen}
        onClose={() => setReportModalState(prev => ({ ...prev, isOpen: false }))}
        targetId={reportModalState.targetId}
        targetType={reportModalState.targetType}
        userId={currentUser?.id}
        title={reportModalState.title}
      />
    </div>
  );
}
