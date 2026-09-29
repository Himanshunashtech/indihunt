import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  ThumbsUp,
  Edit2,
  Trash2,
  Flag,
  Share2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Package,
  Check,
  Code,
  Link as LinkIcon
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Facebook, Twitter } from "@/components/icons";
import { useAppDispatch } from "@/lib/store";
import { setAuthModalOpen } from "@/lib/store";
import RichCommentEditor from "@/components/RichCommentEditor";
import { UserHoverCard } from "@/components/UserHoverCard";
import { useQueryClient } from "@tanstack/react-query";
import { useAddCommentMutation } from "@/hooks/useDb";
import { useWebSocket } from "@/components/WebSocketProvider";
import {
  Product,
  Comment,
  checkContentViolation,
  updateComment,
  deleteComment,
  toggleCommentUpvote,
  reportComment,
  getProductSlug
} from "@/lib/supabase";

interface DiscussionSectionProps {
  product: Product;
  comments: Comment[];
  user: any;
  setReportModalState: (state: any) => void;
  isLoading?: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement | null>;
}

const COMMENTS_PER_PAGE = 10;

// Helper functions for immutable tree updates
const addCommentToTree = (tree: Comment[], newComment: Comment): Comment[] => {
  if (!newComment.parent_id) {
    // If it's a top-level comment and not already in list, append it
    if (tree.some(c => c.id === newComment.id)) return tree;
    return [...tree, { ...newComment, replies: [] }];
  }

  return tree.map(c => {
    if (c.id === newComment.parent_id) {
      if (c.replies?.some(r => r.id === newComment.id)) return c;
      return {
        ...c,
        replies: [...(c.replies || []), { ...newComment, replies: [] }]
      };
    }
    if (c.replies && c.replies.length > 0) {
      return {
        ...c,
        replies: addCommentToTree(c.replies, newComment)
      };
    }
    return c;
  });
};

const updateCommentInTree = (tree: Comment[], commentId: string, updater: (c: Comment) => Comment): Comment[] => {
  return tree.map(c => {
    if (c.id === commentId) {
      return updater(c);
    }
    if (c.replies && c.replies.length > 0) {
      return {
        ...c,
        replies: updateCommentInTree(c.replies, commentId, updater)
      };
    }
    return c;
  });
};

const removeCommentFromTree = (tree: Comment[], commentId: string): Comment[] => {
  return tree
    .filter(c => c.id !== commentId)
    .map(c => {
      if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: removeCommentFromTree(c.replies, commentId)
        };
      }
      return c;
    });
};

export default function DiscussionSection({
  product,
  comments,
  user,
  setReportModalState,
  isLoading = false,
  sentinelRef
}: DiscussionSectionProps) {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { subscribe, publish } = useWebSocket();

  const [newCommentBody, setNewCommentBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [newCommentError, setNewCommentError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentUpvotes, setCommentUpvotes] = useState<Record<string, { count: number; voted: boolean }>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!product?.id) return;
    const room = `product:${product.id}`;

    // 1. Listen for new comments/replies
    const unsubCommentAdded = subscribe(room, "comment_added", (newComment: Comment) => {
      // Update query cache for both UUID and slug
      const updateTree = (old: Comment[] | undefined) => addCommentToTree(old || [], newComment);
      queryClient.setQueriesData({ queryKey: ["comments"] }, updateTree);

      // Update product comments count
      queryClient.setQueriesData({ queryKey: ["product", product.id] }, (old: any) => {
        if (!old) return old;
        return { ...old, comments_count: (old.comments_count || 0) + 1 };
      });
      queryClient.setQueriesData({ queryKey: ["products"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map(p => p.id === product.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p);
      });
    });

    // 2. Listen for comment upvotes
    const unsubCommentUpvoted = subscribe(room, "comment_upvoted", (data: { commentId: string; upvotes_count: number }) => {
      // Update comments tree cache
      queryClient.setQueryData(["comments", product.id, ""], (old: Comment[] | undefined) => {
        if (!old) return old;
        return updateCommentInTree(old, data.commentId, (c) => ({
          ...c,
          upvotes_count: data.upvotes_count
        }));
      });

      // Also update the local state for commentUpvotes if it exists
      setCommentUpvotes(prev => ({
        ...prev,
        [data.commentId]: {
          count: data.upvotes_count,
          voted: prev[data.commentId]?.voted ?? false
        }
      }));
    });

    // 3. Listen for comment edits
    const unsubCommentEdited = subscribe(room, "comment_edited", (data: { commentId: string; body: string }) => {
      queryClient.setQueryData(["comments", product.id, ""], (old: Comment[] | undefined) => {
        if (!old) return old;
        return updateCommentInTree(old, data.commentId, (c) => ({
          ...c,
          body: data.body
        }));
      });
    });

    // 4. Listen for comment deletions
    const unsubCommentDeleted = subscribe(room, "comment_deleted", (data: { commentId: string }) => {
      queryClient.setQueryData(["comments", product.id, ""], (old: Comment[] | undefined) => {
        if (!old) return old;
        return removeCommentFromTree(old, data.commentId);
      });
      // Decrement product comments count
      queryClient.setQueriesData({ queryKey: ["product", product.id] }, (old: any) => {
        if (!old) return old;
        return { ...old, comments_count: Math.max(0, (old.comments_count || 0) - 1) };
      });
      queryClient.setQueriesData({ queryKey: ["products"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map(p => p.id === product.id ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p);
      });
    });

    return () => {
      unsubCommentAdded();
      unsubCommentUpvoted();
      unsubCommentEdited();
      unsubCommentDeleted();
    };
  }, [product?.id, subscribe, queryClient]);

  const addCommentMutation = useAddCommentMutation();

  // Identify the maker's first top-level comment (launch comment) for pinning
  const makerFirstCommentId = useMemo(() => {
    if (!product?.maker_id || comments.length === 0) return null;
    const makerTopLevel = comments
      .filter((c: any) => c.user_id === product.maker_id && !c.parent_id)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return makerTopLevel.length > 0 ? makerTopLevel[0].id : null;
  }, [comments, product?.maker_id]);

  // Handle highlighted comment from search query parameters
  const highlightedCommentId = searchParams ? searchParams.get("comment") : null;

  useEffect(() => {
    if (highlightedCommentId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`comment-${highlightedCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightedCommentId, comments]);

  // Pagination calculation
  const totalCommentsPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
  const paginatedComments = useMemo(() => {
    const start = (commentsPage - 1) * COMMENTS_PER_PAGE;
    return comments.slice(start, start + COMMENTS_PER_PAGE);
  }, [comments, commentsPage]);

  // Reset pagination if comments count drops/changes drastically
  useEffect(() => {
    if (commentsPage > 1 && commentsPage > totalCommentsPages) {
      setCommentsPage(Math.max(1, totalCommentsPages));
    }
  }, [comments.length, totalCommentsPages, commentsPage]);

  const handleAddComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!user || !product) return;

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

    addCommentMutation.mutate({
      productId: product.id,
      userId: user.id,
      body,
      parentId: parentId || null
    }, {
      onSuccess: (newComment) => {
        if (parentId) {
          setReplyBody("");
          setReplyToId(null);
        } else {
          setNewCommentBody("");
        }
        if (newComment) {
          // Instantly update local comments tree cache for immediate realtime UI display
          const updateTree = (old: Comment[] | undefined) => addCommentToTree(old || [], newComment);
          queryClient.setQueriesData({ queryKey: ["comments"] }, updateTree);
          queryClient.invalidateQueries({ queryKey: ["comments"] });

          publish(`product:${product.id}`, "comment_added", newComment);
          const slug = getProductSlug(product.name);
          if (slug && slug !== product.id) {
            publish(`product:${slug}`, "comment_added", newComment);
          }
        }
      }
    });
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
      queryClient.invalidateQueries({ queryKey: ["comments", product.id] });
      // Publish edit event
      publish(`product:${product.id}`, "comment_edited", { commentId, body: editingCommentBody });
    }
  };

  const handleDeleteCommentSubmit = async (commentId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const ok = await deleteComment(commentId, user.id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["comments", product.id] });
      // Publish delete event
      publish(`product:${product.id}`, "comment_deleted", { commentId });
    }
  };

  return (
    <div ref={sentinelRef} className="pb-8 space-y-6">
      <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-orange-500" />
        <span>Discussion Feed ({product.comments_count})</span>
      </h3>

      {mounted && user ? (
        <div className="flex items-start gap-3 mb-8">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
            <img
              src={user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
          <div className="flex-1">
            <RichCommentEditor
              value={newCommentBody}
              onChange={(val) => { setNewCommentBody(val); setNewCommentError(""); }}
              onSubmit={(e) => handleAddComment(e)}
              onCancel={() => { setNewCommentBody(""); setNewCommentError(""); }}
              placeholder="What do you think? Leave your feedback here..."
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
              <span>Log in to join the conversation and share feedback...</span>
              <span className="bg-[#ff5733] text-white font-semibold text-[10px] px-3 py-1.5 rounded-xl transition-colors">
                Log In
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {mounted && isLoading && comments.length === 0 ? (
          <div className="space-y-4 py-4 animate-pulse">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-muted/60" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-muted/60 rounded w-1/4" />
                <div className="h-2.5 bg-muted/40 rounded w-3/4" />
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-muted/60" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-muted/60 rounded w-1/3" />
                <div className="h-2.5 bg-muted/40 rounded w-1/2" />
              </div>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic text-center py-6">No discussions yet. Leave a note!</p>
        ) : (
          paginatedComments.map((comment, index) => {
            const commentNumber = (commentsPage - 1) * COMMENTS_PER_PAGE + index + 1;
            const renderCommentNode = (node: Comment, parentUser?: any, isChild: boolean = false) => {
              const upvoteState = commentUpvotes[node.id] ?? { count: node.upvotes_count ?? 0, voted: node.has_upvoted ?? false };
              const isHighlighted = highlightedCommentId === node.id || highlightedCommentId === String(commentNumber);
              const timeAgo = (() => {
                if (!mounted) return "";
                const diff = (Date.now() - new Date(node.created_at).getTime()) / 1000;
                if (diff < 60) return `${Math.floor(diff)}s ago`;
                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                return `${Math.floor(diff / 86400)}d ago`;
              })();

              return (
                <div
                  id={`comment-${commentNumber}`}
                  key={node.id}
                  className={`relative flex gap-3 p-3.5 rounded-2xl transition-all duration-500 ${isHighlighted ? "bg-[#fff8f5] dark:bg-orange-950/20 border-2 border-orange-500/50 shadow-md ring-4 ring-orange-500/10" : ""}`}
                >
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
                    <div className="flex flex-wrap items-center gap-1.5 mb-1 relative">
                      <UserHoverCard user={node.user} userId={node.user_id}>
                        <span className="text-xs sm:text-sm font-normal text-foreground hover:text-orange-500 transition-colors cursor-pointer">
                          {node.user?.full_name || node.user?.username || 'User'}
                        </span>
                      </UserHoverCard>
                      <UserHoverCard user={node.user} userId={node.user_id}>
                        <span className="text-xs text-muted-foreground hover:text-orange-500 transition-colors cursor-pointer">
                          @{node.user?.username || 'user'}
                        </span>
                      </UserHoverCard>
                      {product.maker_id === node.user_id ? (
                        product.worked_on_launch === false ? (
                          <span className="bg-[#3B82F6] text-white text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                            <Crosshair className="w-3 h-3" />
                            <span>Hunter</span>
                          </span>
                        ) : (
                          <span className="bg-[#2ecc71] text-white text-[11px] font-medium px-2 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-sm">
                            <Package className="w-3 h-3" />
                            <span>Maker</span>
                          </span>
                        )
                      ) : null}
                      {/* Pin emoji for maker's first (launch) comment */}
                      {makerFirstCommentId === node.id && (
                        <span className="text-sm" title="Pinned launch comment">📌</span>
                      )}
                      <span className="text-xs text-muted-foreground/60">· {timeAgo}</span>
                    </div>

                    {/* Product card for maker comments */}
                    {product.maker_id === node.user_id && (
                      <Link href={`/products/${getProductSlug(product.name)}`} className="flex items-center gap-2 mb-1.5 px-2.5 py-1.5 bg-muted/40 border border-border/60 rounded-xl w-fit hover:bg-muted/70 transition-colors">
                        <div className="w-5 h-5 rounded-md overflow-hidden bg-muted border border-border flex-shrink-0 flex items-center justify-center">
                          {product.logo_url ? (
                            <img src={product.logo_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-medium text-orange-500">{product.name?.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-foreground/80">{product.name}</span>
                      </Link>
                    )}

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
                            className="px-2.5 py-1 text-xs font-normal text-muted-foreground hover:text-foreground"
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
                        {parentUser ? (
                          <span className="text-[#ff5733] font-medium mr-1">@{parentUser.username || 'user'}</span>
                        ) : (
                          <span className="text-[#ff5733] font-medium mr-1">@{product.maker?.username || 'maker'}</span>
                        )}
                        {node.body}
                      </p>
                    )}

                    {/* Action Row: Upvote, Reply, Edit, Delete, Report, Share */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <button
                        onClick={async () => {
                          if (!user) { dispatch(setAuthModalOpen(true)); return; }
                          const res = await toggleCommentUpvote(node.id, user.id);
                          if (res) {
                            setCommentUpvotes(prev => ({ ...prev, [node.id]: { count: res.upvotes_count, voted: res.has_upvoted } }));
                            // Publish upvote event
                            publish(`product:${product.id}`, "comment_upvoted", { commentId: node.id, upvotes_count: res.upvotes_count });
                          }
                        }}
                        className={`flex items-center gap-1 text-xs font-normal transition-colors cursor-pointer ${upvoteState.voted ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-400'}`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Upvote{upvoteState.count > 0 ? ` (${upvoteState.count})` : ''}</span>
                      </button>

                      {user && (
                        <button
                          onClick={() => setReplyToId(replyToId === node.id ? null : node.id)}
                          className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      )}

                      {user?.id && user.id === node.user_id && (
                        <button
                          onClick={() => {
                            setEditingCommentId(node.id);
                            setEditingCommentBody(node.body);
                          }}
                          className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}

                      {user?.id && user.id === node.user_id && (
                        <button
                          onClick={() => handleDeleteCommentSubmit(node.id)}
                          className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}

                      {(!user || user.id !== node.user_id) && (
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
                          className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>
                      )}

                      {/* Share Dropdown */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="flex items-center gap-1 text-xs font-normal text-orange-500 hover:text-orange-600 transition-colors cursor-pointer focus:outline-none">
                            <Share2 className="w-3.5 h-3.5 text-orange-500" />
                            <span>Share</span>
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="start"
                            sideOffset={4}
                            className="z-50 min-w-[140px] bg-card border border-border/80 rounded-2xl p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 space-y-0.5"
                          >
                            <DropdownMenu.Item
                              onClick={() => {
                                const url = `${window.location.origin}${window.location.pathname}?comment=${commentNumber}`;
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 rounded-xl cursor-pointer focus:outline-none transition-colors"
                            >
                              <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                              <span>Facebook</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onClick={() => {
                                const url = `${window.location.origin}${window.location.pathname}?comment=${commentNumber}`;
                                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Check out comment #${commentNumber} on ${product.name}`)}`, "_blank");
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 rounded-xl cursor-pointer focus:outline-none transition-colors"
                            >
                              <Twitter className="w-3.5 h-3.5 text-foreground" />
                              <span>X</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onClick={() => {
                                const url = `${window.location.origin}${window.location.pathname}?comment=${commentNumber}`;
                                navigator.clipboard.writeText(`<iframe src="${url}" width="100%" height="200"></iframe>`);
                                alert("Embed code copied to clipboard!");
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 rounded-xl cursor-pointer focus:outline-none transition-colors"
                            >
                              <Code className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Embed</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onClick={() => {
                                const url = `${window.location.origin}${window.location.pathname}?comment=${commentNumber}`;
                                navigator.clipboard.writeText(url);
                                setCopiedCommentId(node.id);
                                setTimeout(() => setCopiedCommentId(null), 2000);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 rounded-xl cursor-pointer focus:outline-none transition-colors"
                            >
                              {copiedCommentId === node.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500 font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>

                    {/* Report Form */}
                    {reportingCommentId === node.id && (
                      <div className="mt-2 flex items-center gap-2 bg-red-500/5 border border-red-500/20 p-2.5 rounded-xl">
                        <select
                          id={`report-reason-${node.id}`}
                          className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                          defaultValue="spam"
                        >
                          <option value="spam">Spam</option>
                          <option value="harassment">Harassment</option>
                          <option value="misinformation">Misinformation</option>
                          <option value="off-topic">Off-topic</option>
                          <option value="other">Other</option>
                        </select>
                        <button
                          onClick={async () => {
                            const sel = document.getElementById(`report-reason-${node.id}`) as HTMLSelectElement;
                            await reportComment(node.id, user.id, sel?.value ?? 'spam');
                            setReportingCommentId(null);
                          }}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-red-600"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => setReportingCommentId(null)}
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

                    {/* Nested Tree Replies */}
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

      {/* Pagination for Main Comments */}
      {totalCommentsPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            disabled={commentsPage === 1}
            onClick={() => setCommentsPage(prev => Math.max(prev - 1, 1))}
            className="px-3.5 py-2 border border-border bg-card rounded-xl text-xs font-semibold text-foreground hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
          >
            Previous
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalCommentsPages }, (_, idx) => idx + 1).map(page => (
              <button
                key={page}
                onClick={() => setCommentsPage(page)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all border ${commentsPage === page
                  ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            disabled={commentsPage === totalCommentsPages}
            onClick={() => setCommentsPage(prev => Math.min(prev + 1, totalCommentsPages))}
            className="px-3.5 py-2 border border-border bg-card rounded-xl text-xs font-semibold text-foreground hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
