"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  User,
  ThumbsUp,
  Share2,
  Trash2,
  Check,
  Link as LinkIcon
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Facebook, Twitter } from "@/components/icons";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";
import RichCommentEditor from "@/components/RichCommentEditor";
import { UserHoverCard } from "@/components/UserHoverCard";
import {
  supabase,
  getStories,
  DEFAULT_STORIES,
  getStoryComments,
  addStoryComment,
  Story,
  StoryComment,
  checkContentViolation,
  getProductSlug
} from "@/lib/supabase";
import { CircularLoader } from "@/components/CircularLoader";

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params?.id as string;

  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxProfile = useAppSelector((state) => state.auth.profile);

  const [story, setStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [newCommentBody, setNewCommentBody] = useState("");
  const [newCommentError, setNewCommentError] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState("");
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);
  const [commentUpvotes, setCommentUpvotes] = useState<Record<string, { count: number; voted: boolean }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const user = reduxUser || currentUser || (reduxProfile ? { id: reduxProfile.id, user_metadata: { avatar_url: reduxProfile.avatar_url, full_name: reduxProfile.full_name } } : null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!storyId) return;

    const loadStoryData = async () => {
      setIsLoading(true);
      try {
        const targetSlug = storyId.toLowerCase();
        const allStories = await getStories();

        let found = allStories.find(
          s => s.id === storyId ||
               getProductSlug(s.title).toLowerCase() === targetSlug ||
               s.title.toLowerCase().includes(targetSlug)
        );

        if (!found) {
          found = DEFAULT_STORIES.find(
            s => s.id === storyId ||
                 getProductSlug(s.title).toLowerCase() === targetSlug ||
                 s.title.toLowerCase().includes(targetSlug)
          );
        }

        if (found) {
          setStory(found);
          const commentsData = await getStoryComments(found.id);
          setComments(commentsData);
        } else {
          console.warn("Story not found:", storyId);
          router.push("/stories");
        }
      } catch (err) {
        console.error("Error loading story details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoryData();
  }, [storyId, router]);

  const handleCommentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    if (!newCommentBody.trim()) return;

    setNewCommentError("");

    const violation = checkContentViolation(newCommentBody);
    if (violation.hasViolation) {
      setNewCommentError(violation.message || "");
      return;
    }

    const userId = user.id;
    try {
      const targetStoryId = story?.id || storyId;
      const newComment = await addStoryComment(targetStoryId, userId, newCommentBody.trim());
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        setNewCommentBody("");
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    if (e) e.preventDefault();
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    if (!replyBody.trim()) return;

    setReplyError("");

    const violation = checkContentViolation(replyBody);
    if (violation.hasViolation) {
      setReplyError(violation.message || "");
      return;
    }

    const userId = user.id;
    try {
      const targetStoryId = story?.id || storyId;
      const newReply = await addStoryComment(targetStoryId, userId, replyBody.trim(), parentId);
      if (newReply) {
        const updatedComments = await getStoryComments(targetStoryId);
        setComments(updatedComments);
        setReplyBody("");
        setReplyToId(null);
      }
    } catch (err) {
      console.error("Error submitting reply:", err);
    }
  };

  const handleToggleStoryCommentUpvote = (commentId: string) => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    setCommentUpvotes(prev => {
      const current = prev[commentId] ?? { count: 0, voted: false };
      const nextVoted = !current.voted;
      const nextCount = nextVoted ? current.count + 1 : Math.max(0, current.count - 1);

      if (typeof window !== 'undefined') {
        try {
          const key = `indihunt_story_comment_upvotes_${user.id || 'guest'}`;
          const stored = JSON.parse(localStorage.getItem(key) || '{}');
          stored[commentId] = nextVoted;
          localStorage.setItem(key, JSON.stringify(stored));
        } catch {}
      }

      return {
        ...prev,
        [commentId]: { count: nextCount, voted: nextVoted }
      };
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setComments(prev => {
      const removeFromTree = (list: StoryComment[]): StoryComment[] => {
        return list
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: c.replies ? removeFromTree(c.replies) : []
          }));
      };
      const updated = removeFromTree(prev);
      if (typeof window !== 'undefined' && story?.id) {
        try {
          localStorage.setItem(`indihunt_story_comments_${story.id}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const getTimeAgo = (dateStr: string) => {
    if (!mounted) return "";
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
        <CircularLoader label="Loading story details..." size="lg" center={false} />
      </div>
    );
  }

  if (!story) return null;

  const totalCommentsCount = comments.reduce((total, c) => total + 1 + (c.replies?.length || 0), 0);

  const renderCommentNode = (node: StoryComment, parentUser?: any, isChild: boolean = false) => {
    const upvoteState = commentUpvotes[node.id] ?? { count: node.upvotes_count ?? 0, voted: node.has_upvoted ?? false };
    const timeAgo = getTimeAgo(node.created_at);

    return (
      <div
        id={`comment-${node.id}`}
        key={node.id}
        suppressHydrationWarning
        className="relative flex gap-3 p-3.5 rounded-2xl transition-all duration-300"
      >
        {/* Branch Curve Connector if child */}
        {isChild && (
          <div className="absolute left-[-22px] sm:left-[-26px] top-[-8px] w-[14px] sm:w-[18px] h-[24px] border-b-2 border-l-2 border-border/60 rounded-bl-xl pointer-events-none" />
        )}

        {/* Avatar */}
        <UserHoverCard user={node.user} userId={node.user_id}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden border border-border cursor-pointer">
            {node.user?.avatar_url ? (
              <Image src={node.user.avatar_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
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
                {node.user?.full_name || node.user?.username || 'Maker'}
              </span>
            </UserHoverCard>
            <UserHoverCard user={node.user} userId={node.user_id}>
              <span className="text-xs text-muted-foreground hover:text-orange-500 transition-colors cursor-pointer">
                @{node.user?.username || 'maker'}
              </span>
            </UserHoverCard>
            <span suppressHydrationWarning className="text-xs text-muted-foreground/60">· {timeAgo}</span>
          </div>

          {/* Comment Body */}
          <p className="text-base text-foreground/90 leading-relaxed mb-2 font-normal">
            {parentUser && (
              <span className="text-[#ff5733] font-medium mr-1">@{parentUser.username || 'maker'}</span>
            )}
            {node.body}
          </p>

          {/* Action Row: Upvote, Reply, Delete, Share */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              onClick={() => handleToggleStoryCommentUpvote(node.id)}
              className={`flex items-center gap-1 text-xs font-normal transition-colors cursor-pointer ${upvoteState.voted ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-400'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Upvote{upvoteState.count > 0 ? ` (${upvoteState.count})` : ''}</span>
            </button>

            <button
              onClick={() => {
                if (!user) {
                  dispatch(setAuthModalOpen(true));
                  return;
                }
                setReplyToId(replyToId === node.id ? null : node.id);
              }}
              className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>

            {mounted && user?.id === node.user_id && (
              <button
                onClick={() => handleDeleteComment(node.id)}
                className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
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
                      const url = `${window.location.origin}${window.location.pathname}#comment-${node.id}`;
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 rounded-xl cursor-pointer focus:outline-none transition-colors"
                  >
                    <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                    <span>Facebook</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}#comment-${node.id}`;
                      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Check out discussion on: ${story.title}`)}`, "_blank");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 rounded-xl cursor-pointer focus:outline-none transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5 text-foreground" />
                    <span>X</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}#comment-${node.id}`;
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

          {/* Inline Reply Form using RichCommentEditor */}
          {replyToId === node.id && (
            <div className="mt-3">
              <RichCommentEditor
                value={replyBody}
                onChange={(val) => { setReplyBody(val); setReplyError(""); }}
                onSubmit={(e) => handleReplySubmit(e, node.id)}
                onCancel={() => { setReplyToId(null); setReplyError(""); }}
                placeholder={`Replying to @${node.user?.username || 'maker'}...`}
                submitLabel="Submit"
                isReply
                error={replyError}
                autoFocus
              />
            </div>
          )}

          {/* Nested Tree Replies */}
          {node.replies && node.replies.length > 0 && (
            <div suppressHydrationWarning className="relative pl-4 sm:pl-6 ml-1 border-l-2 border-border/60 mt-4 space-y-4">
              {node.replies.map((reply) => renderCommentNode(reply, node.user, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/stories" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Stories</span>
          </Link>
          <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">IndiHunt Stories</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Story Metadata */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-md inline-block">
            {story.category}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-tight">
            {story.title}
          </h1>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            {story.excerpt}
          </p>

          <div className="flex items-center gap-3 pt-2 border-t border-border/40 text-xs font-semibold text-muted-foreground">
            <UserHoverCard user={story.user} userId={story.user_id}>
              <Link href={story.user?.username ? `/@${story.user.username}` : (story.user_id ? `/profile?id=${story.user_id}` : `#`)} className="w-7 h-7 rounded-full overflow-hidden bg-muted flex items-center justify-center hover:opacity-90 transition-opacity">
                {story.user?.avatar_url ? (
                  <Image src={story.user.avatar_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Link>
            </UserHoverCard>
            <div>
              <UserHoverCard user={story.user} userId={story.user_id}>
                <Link href={story.user?.username ? `/@${story.user.username}` : (story.user_id ? `/profile?id=${story.user_id}` : `#`)} className="text-foreground block hover:text-orange-500 transition-colors">
                  {story.user?.full_name || "IndiHunt Editorial"}
                </Link>
              </UserHoverCard>
              <UserHoverCard user={story.user} userId={story.user_id}>
                <Link href={story.user?.username ? `/@${story.user.username}` : (story.user_id ? `/profile?id=${story.user_id}` : `#`)} className="text-[10px] font-normal text-muted-foreground block hover:text-orange-500 transition-colors">
                  @{story.user?.username || "editorial"}
                </Link>
              </UserHoverCard>
            </div>
            <div className="h-6 w-px bg-border/60 mx-1"></div>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(story.published_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>

        {/* Cover Image */}
        {story.image_url && (
          <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden bg-muted border border-border shadow-lg">
            <Image
              src={story.image_url}
              alt="Cover"
              className="w-full h-full object-cover"
              width={1200}
              height={514}
              sizes="(max-width: 768px) 100vw, 1200px"
              quality={90}
              priority
            />
          </div>
        )}

        {/* Story Content */}
        <article className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-4 whitespace-pre-wrap pt-4">
          {story.content}
        </article>

        {/* Comments Section (Same Rich Features as Product Discussion) */}
        <section className="pt-8 border-t border-border mt-12 space-y-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
              Discussion ({totalCommentsCount})
            </h3>
          </div>

          {/* Top-Level Comment Form or Login Prompt */}
          {mounted && user ? (
            <div className="flex items-start gap-3 mb-8">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                <Image
                  src={user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                  width={32}
                  height={32}
                />
              </div>
              <div className="flex-1">
                <RichCommentEditor
                  value={newCommentBody}
                  onChange={(val) => { setNewCommentBody(val); setNewCommentError(""); }}
                  onSubmit={(e) => handleCommentSubmit(e)}
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

          {/* Comments List */}
          <div className="space-y-6 pt-2">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic text-center py-6">No discussions yet. Leave a note!</p>
            ) : (
              comments.map(c => renderCommentNode(c))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
