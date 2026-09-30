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
  Send,
  CornerDownRight
} from "lucide-react";
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

  const [story, setStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commentBody, setCommentBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    setCommentError("");

    const violation = checkContentViolation(commentBody);
    if (violation.hasViolation) {
      setCommentError(violation.message || "");
      return;
    }

    const userId = currentUser?.id || "user-1"; // Fallback to user-1 if guest for local dev/testing
    try {
      const targetStoryId = story?.id || storyId;
      const newComment = await addStoryComment(targetStoryId, userId, commentBody.trim());
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        setCommentBody("");
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setReplyError("");

    const violation = checkContentViolation(replyBody);
    if (violation.hasViolation) {
      setReplyError(violation.message || "");
      return;
    }

    const userId = currentUser?.id || "user-1";
    try {
      const targetStoryId = story?.id || storyId;
      const newReply = await addStoryComment(targetStoryId, userId, replyBody.trim(), parentId);
      if (newReply) {
        // Refresh comments list
        const updatedComments = await getStoryComments(targetStoryId);
        setComments(updatedComments);
        setReplyBody("");
        setReplyToId(null);
      }
    } catch (err) {
      console.error("Error submitting reply:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
        <CircularLoader label="Loading story details..." size="lg" center={false} />
      </div>
    );
  }

  if (!story) return null;

  const renderCommentNode = (c: StoryComment) => {
    return (
      <div key={c.id} className="space-y-3.5 pl-4 border-l-2 border-border/60 ml-2 py-1">
        <div className="flex items-start gap-2.5">
          <Link href={c.user?.username ? `/@${c.user.username}` : (c.user_id ? `/profile?id=${c.user_id}` : `#`)} className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 hover:opacity-90 transition-opacity">
            {c.user?.avatar_url ? (
              <Image src={c.user.avatar_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
            ) : (
              c.user?.full_name?.charAt(0).toUpperCase() || "M"
            )}
          </Link>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <Link href={c.user?.username ? `/@${c.user.username}` : (c.user_id ? `/profile?id=${c.user_id}` : `#`)} className="text-[11px] font-bold text-foreground hover:text-orange-500 transition-colors">
                {c.user?.full_name || "Anonymous Maker"}{" "}
                <span className="font-normal text-muted-foreground/75 ml-1">@{c.user?.username || "maker"}</span>
              </Link>
              <span className="text-[9px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-line">{c.body}</p>
            
            <div className="flex items-center gap-4 pt-1 text-[10px] font-semibold text-muted-foreground">
              <button 
                onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
                className="hover:text-orange-500 flex items-center gap-1 transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Reply
              </button>
            </div>

            {replyToId === c.id && (
              <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="flex flex-col gap-1.5 mt-2 max-w-md">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyBody}
                    onChange={(e) => {
                      setReplyBody(e.target.value);
                      setReplyError("");
                    }}
                    className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-1.5 text-[11px] focus:outline-none focus:border-orange-500"
                    required
                  />
                  <button type="submit" className="p-1.5 bg-[#ff5733] text-white rounded-lg hover:bg-[#e64a19]">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
                {replyError && (
                  <p className="text-red-500 text-[10px] font-medium">{replyError}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {c.replies && c.replies.length > 0 && (
          <div className="space-y-3 pt-2">
            {c.replies.map(r => renderCommentNode(r))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full  bg-background/80 backdrop-blur-md">
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
            <Link href={story.user?.username ? `/@${story.user.username}` : (story.user_id ? `/profile?id=${story.user_id}` : `#`)} className="w-7 h-7 rounded-full overflow-hidden bg-muted flex items-center justify-center hover:opacity-90 transition-opacity">
              {story.user?.avatar_url ? (
                <Image src={story.user.avatar_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
              ) : (
                <User className="w-4 h-4" />
              )}
            </Link>
            <div>
              <Link href={story.user?.username ? `/@${story.user.username}` : (story.user_id ? `/profile?id=${story.user_id}` : `#`)} className="text-foreground block hover:text-orange-500 transition-colors">
                {story.user?.full_name || "IndiHunt Editorial"}
              </Link>
              <Link href={story.user?.username ? `/@${story.user.username}` : (story.user_id ? `/profile?id=${story.user_id}` : `#`)} className="text-[10px] font-normal text-muted-foreground block hover:text-orange-500 transition-colors">
                @{story.user?.username || "editorial"}
              </Link>
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

        {/* Comments Section */}
        <section className="pt-8 border-t border-border mt-12 space-y-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
              Discussion ({comments.length})
            </h3>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              rows={4}
              placeholder="What do you think? Leave a comment..."
              value={commentBody}
              onChange={(e) => {
                setCommentBody(e.target.value);
                setCommentError("");
              }}
              className="w-full bg-card border border-border rounded-2xl p-4 text-xs focus:outline-none focus:border-orange-500 resize-none font-sans"
              required
            />
            {commentError && (
              <p className="text-red-500 text-xs font-medium">{commentError}</p>
            )}
            <div className="flex justify-end">
              <button 
                type="submit" 
                className="px-5 py-2 bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4 pt-4">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground/80 italic text-center py-6">No comments yet. Start the conversation!</p>
            ) : (
              comments.map(c => renderCommentNode(c))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
