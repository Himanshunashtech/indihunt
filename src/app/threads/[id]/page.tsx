"use client";


import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowLeft,
  ArrowUp,
  MessageSquare,
  Share2,
  Bookmark,
  Eye,
  ThumbsUp,
  Flag,
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
  Edit2,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ReportModal } from "@/components/ReportModal";
import { CircularLoader } from "@/components/CircularLoader";
import {
  supabase,
  getThreadById,
  toggleThreadUpvote,
  getComments,
  addComment,
  toggleCommentUpvote,
  reportComment,
  updateComment,
  deleteComment,
  Comment,
  Thread,
  getProductById,
  Product,
  getProductSlug,
  checkContentViolation
} from "@/lib/supabase";
import { useAppDispatch, setAuthModalOpen } from "@/lib/store";
import { useThread, useComments } from "@/hooks/useDb";
import { UserHoverCard } from "@/components/UserHoverCard";
import Navbar from "@/components/Navbar";
import DiscussionsSidebar from "@/components/DiscussionsSidebar";
import RichCommentEditor from "@/components/RichCommentEditor";

const FORUM_METADATA: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
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

export default function ThreadDetailPage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [newCommentError, setNewCommentError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [commentUpvotes, setCommentUpvotes] = useState<Record<string, { count: number; voted: boolean }>>({});
  const [reportedComments, setReportedComments] = useState<Set<string>>(new Set());
  const [reportDropdownId, setReportDropdownId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [linkedProduct, setLinkedProduct] = useState<Product | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState<string>("");
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    targetId: string;
    targetType: "thread" | "comment" | "product";
    title?: string;
  }>({
    isOpen: false,
    targetId: "",
    targetType: "comment",
  });

  const REPORT_REASONS = [
    { value: 'spam', label: 'Spam' },
    { value: 'duplicate', label: 'Duplicate' },
    { value: 'harmful', label: 'Harmful' },
    { value: 'not_working', label: 'Not Working / Needs Editing' },
    { value: 'self_promo', label: 'Self-promotion' },
    { value: 'ai_generated', label: 'Artificially generated (e.g. ChatGPT)' },
  ];

  const { data: fetchedThread, isLoading: isThreadLoading } = useThread(threadId);
  const { data: fetchedComments = [] } = useComments(undefined, threadId);

  const thread = fetchedThread || null;
  const comments = fetchedComments;

  // Check auth
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Linked product side-effect if product_id exists
  useEffect(() => {
    if (thread?.product_id) {
      getProductById(thread.product_id).then((prod) => setLinkedProduct(prod));
    } else {
      setLinkedProduct(null);
    }
  }, [thread?.product_id]);

  // Redirect to slug if loaded using DB ID
  useEffect(() => {
    if (thread && params.id !== getProductSlug(thread.title)) {
      router.replace(`/threads/${getProductSlug(thread.title)}`);
    }
  }, [thread, params.id, router]);

  const isLoading = isThreadLoading && !thread;

  // Handle thread upvote
  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    if (!thread) return;

    const result = await toggleThreadUpvote(thread.id, user.id);
    if (result.success) {
      queryClient.setQueryData(["thread", threadId], (prev: Thread | undefined) => prev ? {
        ...prev,
        upvotes_count: result.upvotes_count,
        has_upvoted: !prev.has_upvoted
      } : undefined);
    }
  };

  // Add Comment (Reply)
  const handleAddComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!user || !thread) return;

    const body = parentId ? replyBody : newCommentBody;
    if (!body.trim()) return;

    if (parentId) {
      setReplyError("");
    } else {
      setNewCommentError("");
    }

    const violation = checkContentViolation(body);
    if (violation.hasViolation) {
      if (parentId) {
        setReplyError(violation.message || "");
      } else {
        setNewCommentError(violation.message || "");
      }
      return;
    }

    const added = await addComment(null, user.id, body, parentId || null, thread.id);
    if (added) {
      if (parentId) {
        setReplyBody("");
        setReplyToId(null);
      } else {
        setNewCommentBody("");
      }
      queryClient.invalidateQueries({ queryKey: ["comments", undefined, threadId] });
      queryClient.setQueryData(["thread", threadId], (prev: Thread | undefined) => prev ? {
        ...prev,
        comments_count: prev.comments_count + 1
      } : undefined);
    }
  };

  // Handle comment upvote
  const handleCommentUpvote = async (commentId: string) => {
    if (!user) { dispatch(setAuthModalOpen(true)); return; }
    const prev = commentUpvotes[commentId] || { count: 0, voted: false };
    // Optimistic update
    setCommentUpvotes(s => ({
      ...s,
      [commentId]: { count: prev.voted ? prev.count - 1 : prev.count + 1, voted: !prev.voted }
    }));
    const result = await toggleCommentUpvote(commentId, user.id);
    if (result) {
      setCommentUpvotes(s => ({ ...s, [commentId]: { count: result.upvotes_count, voted: result.has_upvoted } }));
    }
  };

  // Handle comment report
  const handleCommentReport = async (commentId: string, reason: string) => {
    if (!user) { dispatch(setAuthModalOpen(true)); return; }
    if (reportedComments.has(commentId)) return;
    setReportDropdownId(null);
    const res = await reportComment(commentId, user.id, reason);
    if (res.success) {
      setReportedComments(s => new Set(s).add(commentId));
    }
  };

  const handleEditCommentSubmit = async (commentId: string) => {
    if (!editingCommentBody.trim() || !user) return;
    const violation = checkContentViolation(editingCommentBody);
    if (violation.hasViolation) {
      alert(violation.message || "Your input violates community guidelines.");
      return;
    }
    const ok = await updateComment(commentId, user.id, editingCommentBody);
    if (ok) {
      setEditingCommentId(null);
      setEditingCommentBody("");
      queryClient.invalidateQueries({ queryKey: ["comments", undefined, threadId] });
    }
  };

  const handleDeleteCommentSubmit = async (commentId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const ok = await deleteComment(commentId, user.id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["comments", undefined, threadId] });
      queryClient.setQueryData(["thread", threadId], (prev: Thread | undefined) => prev ? {
        ...prev,
        comments_count: Math.max(0, prev.comments_count - 1)
      } : undefined);
    }
  };

  // Close report dropdown on outside click
  useEffect(() => {
    if (!reportDropdownId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-report-dropdown="${reportDropdownId}"]`)) {
        setReportDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [reportDropdownId]);

  // Handle comment share
  const handleCommentShare = (commentId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(commentId);
      setTimeout(() => setShareToast(null), 2000);
    });
  };

  // Seed upvote counts from loaded comments
  // Use a stable derived key so we don't re-run on every render (new [] reference)
  const commentsSeedKey = comments.map(c => `${c.id}:${c.upvotes_count}`).join(",");
  useEffect(() => {
    if (!comments.length) return;
    const init: Record<string, { count: number; voted: boolean }> = {};
    const seed = (list: Comment[]) => {
      list.forEach(c => {
        init[c.id] = { count: c.upvotes_count ?? 0, voted: c.has_upvoted ?? false };
        if (c.replies) seed(c.replies);
      });
    };
    seed(comments);
    setCommentUpvotes(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsSeedKey]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300 pt-[76px] sm:pt-[84px]">

      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Side Panel */}
          <DiscussionsSidebar
            selectedForum={thread?.category || "all"}
            onOpenNewThread={() => {
              if (!user) {
                dispatch(setAuthModalOpen(true));
                return;
              }
              router.push("/discussions?new=1");
            }}
          />

          {/* Main Thread Content */}
          <div className="lg:col-span-9 flex flex-col gap-6">

            {isLoading ? (
              <CircularLoader label="Loading thread details..." size="lg" />
            ) : !thread ? (
              <div className="bg-card border border-border p-8 rounded-3xl text-center space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Discussion thread not found.</p>
                <Link href="/discussions" className="inline-block px-4 py-2 bg-[#ff5733] text-white text-xs font-semibold rounded-xl hover:bg-[#e64a19] transition-colors">
                  Back to Discussions
                </Link>
              </div>
            ) : (
              <>

                {/* Category Top Banner (Screenshot #3 Style) */}
                {(() => {
                  const catKey = (thread.category || "general").toLowerCase().replace(/\s+/g, '-');
                  const catMeta = FORUM_METADATA[catKey] || {
                    title: `p/${catKey}`,
                    subtitle: "Share and discuss tech, products, business, startups, or product recommendations",
                    icon: Globe,
                  };
                  const CatIcon = catMeta.icon;

                  return (
                    <div className="relative mb-6 box-border flex w-full flex-col gap-4 rounded-3xl bg-card border border-border/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <Link
                          href="/discussions"
                          className="w-10 h-10 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground transition-all shrink-0 shadow-2xs"
                          title="Back to Discussions"
                        >
                          <ArrowLeft className="w-4 h-4 text-foreground/80" />
                        </Link>
                        <div className="w-11 h-11 shrink-0 rounded-2xl border border-border/80 bg-muted/40 flex items-center justify-center text-muted-foreground shadow-2xs" style={{ width: "44px", height: "44px" }}>
                          <CatIcon className="w-5 h-5 text-foreground/80" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">{catMeta.title}</h2>
                          <p className="text-xs text-muted-foreground font-normal leading-relaxed line-clamp-1">{catMeta.subtitle}</p>
                        </div>
                      </div>
                      <Link
                        href="/discussions?new=true"
                        className="relative w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-[#ff5733] hover:bg-[#e64a19] px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all duration-300 shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        <MessageSquarePlus className="w-4 h-4" />
                        <span>Start new thread</span>
                      </Link>
                    </div>
                  );
                })()}

                {/* Thread Header */}
                <div className="pb-8 mb-8 ">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-muted text-foreground border border-border/80 text-xs font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {thread.category}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>6.1K views</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight mb-4">
                    {thread.title}
                  </h1>

                  {/* Author info */}
                  <div className="flex items-center justify-between gap-4  pb-6 mb-6 flex-wrap">
                    <div className="flex items-center gap-3">
                      <UserHoverCard user={thread.user} userId={thread.user_id}>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                          <Image
                            src={thread.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                            alt="Author Avatar"
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      </UserHoverCard>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <UserHoverCard user={thread.user} userId={thread.user_id}>
                            <span className="text-xs sm:text-sm font-semibold text-foreground hover:text-foreground hover:underline transition-colors cursor-pointer">{thread.user?.full_name}</span>
                          </UserHoverCard>
                          <UserHoverCard user={thread.user} userId={thread.user_id}>
                            <span className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer">@{thread.user?.username}</span>
                          </UserHoverCard>
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5 font-normal">
                          Posted {new Date(thread.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Top widgets */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleVote}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs transition-all cursor-pointer ${thread.has_upvoted
                            ? "border-2 border-[#ff5733] bg-card text-foreground"
                            : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-[#ff5733]/60"
                          }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 16 16"
                          className={`w-3.5 h-3.5 stroke-[1.5px] transition-all duration-300 ${thread.has_upvoted
                              ? "fill-[#ff5733] stroke-[#ff5733]"
                              : "fill-white dark:fill-transparent stroke-foreground/70"
                            }`}
                        >
                          <path d="M6.579 3.467c.71-1.067 2.132-1.067 2.842 0L12.975 8.8c.878 1.318.043 3.2-1.422 3.2H4.447c-1.464 0-2.3-1.882-1.422-3.2z" />
                        </svg>
                        <span>{thread.has_upvoted ? "Upvoted" : "Upvote"}</span>
                        <span className="w-px h-3 bg-border"></span>
                        <span>{thread.upvotes_count}</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Thread link copied!");
                        }}
                        className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Share Thread"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (!user) { dispatch(setAuthModalOpen(true)); return; }
                          setReportModalState({
                            isOpen: true,
                            targetId: thread.id,
                            targetType: "thread",
                            title: "Report Forum thread",
                          });
                        }}
                        className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-red-500 transition-all cursor-pointer flex items-center justify-center"
                        title="Report Thread"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Linked Product Card banner */}
                  {linkedProduct && (
                    <div className="flex items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl mb-6 shadow-xs">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-card border border-border flex-shrink-0 flex items-center justify-center p-0.5" style={{ width: "48px", height: "48px" }}>
                          <Image
                            src={linkedProduct.logo_url}
                            alt={linkedProduct.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-medium text-orange-500">Related Product</span>
                          </div>
                          <h4 className="text-base font-medium text-foreground/90 hover:text-[#ff5733] transition-colors truncate">
                            <Link href={`/products/${getProductSlug(linkedProduct.name)}`}>{linkedProduct.name}</Link>
                          </h4>
                          <p className="mt-0.5 block text-base text-foreground/80 line-clamp-1">{linkedProduct.tagline}</p>
                        </div>
                      </div>

                      <Link
                        href={`/products/${getProductSlug(linkedProduct.name)}`}
                        className="px-4 py-2 bg-[#ff5733] text-white hover:bg-[#e64a19] font-medium text-sm rounded-xl flex items-center gap-1 transition-all flex-shrink-0 shadow-xs"
                      >
                        <span>View Product</span>
                      </Link>
                    </div>
                  )}

                  {/* Details body */}
                  <div className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {thread.body}
                  </div>
                </div>

                {/* Comment block */}
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-500" />
                    <span>Replies ({thread.comments_count})</span>
                  </h3>

                  {user ? (
                    <div className="flex items-start gap-3 mb-8">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                        <Image
                          src={user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                          alt="User Avatar"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <RichCommentEditor
                          value={newCommentBody}
                          onChange={(val) => { setNewCommentBody(val); setNewCommentError(""); }}
                          onSubmit={(e) => handleAddComment(e)}
                          onCancel={() => { setNewCommentBody(""); setNewCommentError(""); }}
                          placeholder="Share your thoughts or answer this question..."
                          submitLabel="Post Comment"
                          error={newCommentError}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 mb-8 cursor-pointer" onClick={() => dispatch(setAuthModalOpen(true))}>
                      <div className="w-8 h-8 rounded-full bg-muted border border-border flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs font-semibold">
                        ?
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-muted/40 hover:bg-muted/65 border border-border/80 rounded-2xl px-4 py-3 text-xs text-muted-foreground/75 transition-all flex items-center justify-between">
                          <span>Log in to reply to this thread...</span>
                          <span className="bg-[#ff5733] text-white font-semibold text-[10px] px-3 py-1.5 rounded-xl transition-colors">
                            Log In
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    {comments.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic text-center py-6">No replies yet. Be the first to reply!</p>
                    ) : (
                      comments.map((comment) => {
                        const renderCommentNode = (node: typeof comment, parentUser?: typeof comment.user, isChild: boolean = false) => {
                          const timeAgo = (() => {
                            const diff = (Date.now() - new Date(node.created_at).getTime()) / 1000;
                            if (diff < 60) return `${Math.floor(diff)}s ago`;
                            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                            return `${Math.floor(diff / 86400)}d ago`;
                          })();

                          return (
                            <div key={node.id} id={`comment-${node.id}`} className="relative flex gap-3">
                              {/* Branch Curve Connector if child */}
                              {isChild && (
                                <div className="absolute left-[-22px] sm:left-[-26px] top-[-8px] w-[14px] sm:w-[18px] h-[24px] border-b-2 border-l-2 border-border/60 rounded-bl-xl pointer-events-none" />
                              )}

                              {/* Avatar */}
                              <UserHoverCard user={node.user} userId={node.user_id}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden border border-border">
                                  {node.user?.avatar_url ? (
                                    <img src={node.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    (node.user?.full_name?.charAt(0) ?? 'U').toUpperCase()
                                  )}
                                </div>
                              </UserHoverCard>

                              <div className="flex-1 min-w-0">
                                {/* Header row */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-1 text-sm font-normal text-muted-foreground">
                                  <UserHoverCard user={node.user} userId={node.user_id}>
                                    <span className="text-xs sm:text-sm font-normal text-foreground/90 hover:text-foreground hover:underline transition-colors cursor-pointer">{node.user?.full_name}</span>
                                  </UserHoverCard>
                                  <UserHoverCard user={node.user} userId={node.user_id}>
                                    <span className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer">@{node.user?.username}</span>
                                  </UserHoverCard>
                                  {thread.user_id === node.user_id && (
                                    <span className="text-[10px] bg-muted border border-border text-foreground font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Author</span>
                                  )}
                                  <span className="text-xs text-muted-foreground/60">· {timeAgo}</span>

                                  </div>

                                {/* Body or Edit Form */}
                                {editingCommentId === node.id ? (
                                  <div className="my-2 space-y-2">
                                    <textarea
                                      value={editingCommentBody}
                                      onChange={(e) => setEditingCommentBody(e.target.value)}
                                      rows={3}
                                      className="w-full bg-background border border-border rounded-xl p-2.5 text-xs sm:text-sm text-foreground focus:outline-none resize-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingCommentId(null)}
                                        className="px-2.5 py-1 text-xs font-normal text-muted-foreground hover:text-foreground cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleEditCommentSubmit(node.id)}
                                        className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg cursor-pointer"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-base text-foreground/90 leading-relaxed mb-2 font-normal">
                                    {parentUser && (
                                      <span className="text-[#ff5733] font-medium mr-1">@{parentUser.username || 'user'}</span>
                                    )}
                                    {node.body}
                                  </p>
                                )}

                                {/* Comment action buttons */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                  {/* Upvote */}
                                  <button
                                    onClick={() => handleCommentUpvote(node.id)}
                                    className={`flex items-center gap-1.5 text-xs font-normal transition-colors cursor-pointer ${commentUpvotes[node.id]?.voted
                                        ? 'text-[#ff5733]'
                                        : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span>Upvote{(commentUpvotes[node.id]?.count ?? 0) > 0 ? ` (${commentUpvotes[node.id]?.count})` : ''}</span>
                                  </button>

                                  {/* Reply */}
                                  {user && (
                                    <button
                                      onClick={() => setReplyToId(replyToId === node.id ? null : node.id)}
                                      className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Reply</span>
                                    </button>
                                  )}

                                  {/* Edit (Author) */}
                                  {user?.id && user.id === node.user_id && (
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(node.id);
                                        setEditingCommentBody(node.body);
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Edit</span>
                                    </button>
                                  )}

                                  {/* Delete (Author) */}
                                  {user?.id && user.id === node.user_id && (
                                    <button
                                      onClick={() => handleDeleteCommentSubmit(node.id)}
                                      className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  )}

                                  {/* Report (Non-Author or Logged Out) */}
                                  {(!user || user.id !== node.user_id) && !reportedComments.has(node.id) && (
                                    <button
                                      onClick={() => {
                                        if (!user) {
                                          dispatch(setAuthModalOpen(true));
                                          return;
                                        }
                                        setReportModalState({
                                          isOpen: true,
                                          targetId: node.id,
                                          targetType: "comment",
                                          title: "Report Comment",
                                        });
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                    >
                                      <Flag className="w-3.5 h-3.5" />
                                      <span>Report</span>
                                    </button>
                                  )}
                                  {reportedComments.has(node.id) && (
                                    <span className="text-xs font-normal text-muted-foreground/50">Reported</span>
                                  )}
                                </div>

                                {/* Reason dropdown */}
                                {reportDropdownId === node.id && (
                                  <div className="mt-2 flex items-center gap-2 bg-red-500/5 border border-red-500/20 p-2.5 rounded-xl max-w-sm">
                                    <select
                                      id={`report-reason-${node.id}`}
                                      className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                                      defaultValue="spam"
                                    >
                                      {REPORT_REASONS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={async () => {
                                        const sel = document.getElementById(`report-reason-${node.id}`) as HTMLSelectElement;
                                        await handleCommentReport(node.id, sel?.value ?? 'spam');
                                      }}
                                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-red-600"
                                    >
                                      Submit
                                    </button>
                                    <button
                                      onClick={() => setReportDropdownId(null)}
                                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}

                                {/* Reply Form */}
                                {replyToId === node.id && (
                                  <div className="mt-3">
                                    <RichCommentEditor
                                      value={replyBody}
                                      onChange={(val) => { setReplyBody(val); setReplyError(""); }}
                                      onSubmit={(e) => handleAddComment(e, node.id)}
                                      onCancel={() => { setReplyToId(null); setReplyError(""); }}
                                      placeholder={`Replying to @${node.user?.username || 'user'}...`}
                                      submitLabel="Submit"
                                      isReply
                                      error={replyError}
                                      autoFocus
                                    />
                                  </div>
                                )}

                                {/* Nested Replies Tree */}
                                {node.replies && node.replies.length > 0 && (
                                  <div className="relative pl-4 sm:pl-6 ml-1 border-l-2 border-border/60 mt-4 space-y-4">
                                    {node.replies.map((reply) => renderCommentNode(reply, node.user, true))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        };

                        return renderCommentNode(comment);
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <ReportModal
        isOpen={reportModalState.isOpen}
        onClose={() => setReportModalState(prev => ({ ...prev, isOpen: false }))}
        targetId={reportModalState.targetId}
        targetType={reportModalState.targetType}
        title={reportModalState.title}
        userId={user?.id}
      />
    </div>
  );
}
