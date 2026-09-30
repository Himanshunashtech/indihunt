import Image from "next/image";
import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, ThumbsUp, Edit2, Trash2, Flag } from "lucide-react";
import {
  Thread,
  Comment,
  Product,
  getComments,
  addComment,
  toggleCommentUpvote,
  reportComment,
  updateComment,
  deleteComment,
  deleteProductThread,
  createProductThread,
  getProductThreads,
  checkContentViolation
} from "@/lib/supabase";
import { useAppDispatch } from "@/lib/store";
import { setAuthModalOpen } from "@/lib/store";
import { UserHoverCard } from "@/components/UserHoverCard";
import RichCommentEditor from "@/components/RichCommentEditor";

interface ForumsTabProps {
  productId: string;
  product: Product;
  user: any;
  forumThreads: Thread[];
  setForumThreads: (threads: Thread[]) => void;
  setReportModalState: (state: any) => void;
}

export default function ForumsTab({
  productId,
  product,
  user,
  forumThreads,
  setForumThreads,
  setReportModalState
}: ForumsTabProps) {
  const dispatch = useAppDispatch();

  // Thread detail view state
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadComments, setThreadComments] = useState<Comment[]>([]);
  const [newThreadCommentBody, setNewThreadCommentBody] = useState("");
  const [isSubmittingThreadComment, setIsSubmittingThreadComment] = useState(false);
  const [threadCommentsPage, setThreadCommentsPage] = useState(1);

  // Thread form state
  const [showThreadForm, setShowThreadForm] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadBody, setNewThreadBody] = useState("");
  const [newThreadCategory, setNewThreadCategory] = useState("General");
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // Comment edit/reply states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [commentUpvotes, setCommentUpvotes] = useState<Record<string, { count: number; voted: boolean }>>({});
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

  // Validation errors
  const [newThreadTitleError, setNewThreadTitleError] = useState("");
  const [newThreadBodyError, setNewThreadBodyError] = useState("");
  const [newThreadCommentError, setNewThreadCommentError] = useState("");
  const [replyError, setReplyError] = useState("");

  const COMMENTS_PER_PAGE = 10;
  const totalThreadCommentsPages = Math.ceil(threadComments.length / COMMENTS_PER_PAGE);

  const paginatedThreadComments = useMemo(() => {
    const startIndex = (threadCommentsPage - 1) * COMMENTS_PER_PAGE;
    return threadComments.slice(startIndex, startIndex + COMMENTS_PER_PAGE);
  }, [threadComments, threadCommentsPage]);

  const handleSelectThread = async (thr: Thread) => {
    setActiveThread(thr);
    setThreadCommentsPage(1);
    const comms = await getComments(undefined, thr.id);
    setThreadComments(comms || []);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newThreadTitle.trim() || !newThreadBody.trim()) return;

    setNewThreadTitleError("");
    setNewThreadBodyError("");

    const titleViolation = checkContentViolation(newThreadTitle);
    if (titleViolation.hasViolation) {
      setNewThreadTitleError(titleViolation.message || "");
      return;
    }

    const bodyViolation = checkContentViolation(newThreadBody);
    if (bodyViolation.hasViolation) {
      setNewThreadBodyError(bodyViolation.message || "");
      return;
    }

    setIsCreatingThread(true);
    const created = await createProductThread(productId, {
      title: newThreadTitle,
      body: newThreadBody,
      category: newThreadCategory,
      user_id: user.id
    }, user.id);
    if (created) {
      setNewThreadTitle("");
      setNewThreadBody("");
      setNewThreadCategory("General");
      setShowThreadForm(false);
      const thrs = await getProductThreads(productId, user.id);
      setForumThreads(thrs || []);
      alert("Thread created successfully!");
    } else {
      alert("Failed to create discussion thread.");
    }
    setIsCreatingThread(false);
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!user) return;
    const isOwner = user.id === product.maker_id;
    const thread = forumThreads.find(t => t.id === threadId);
    const isCreator = thread && thread.user_id === user.id;

    if (!isOwner && !isCreator) {
      alert("Only the product owner or the thread creator can delete this thread.");
      return;
    }

    if (!confirm("Are you sure you want to delete this thread and all its replies?")) {
      return;
    }

    const success = await deleteProductThread(threadId, productId);
    if (success) {
      alert("Thread deleted successfully!");
      if (activeThread?.id === threadId) {
        setActiveThread(null);
        setThreadComments([]);
      }
      const thrs = await getProductThreads(productId, user.id);
      setForumThreads(thrs || []);
    } else {
      alert("Failed to delete thread.");
    }
  };

  const handleCreateThreadComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeThread || !newThreadCommentBody.trim()) return;

    setNewThreadCommentError("");
    const violation = checkContentViolation(newThreadCommentBody);
    if (violation.hasViolation) {
      setNewThreadCommentError(violation.message || "");
      return;
    }

    setIsSubmittingThreadComment(true);
    const added = await addComment(null, user.id, newThreadCommentBody, null, activeThread.id);
    if (added) {
      setNewThreadCommentBody("");
      const comms = await getComments(undefined, activeThread.id);
      setThreadComments(comms || []);

      const updatedThreads = forumThreads.map(t => {
        if (t.id === activeThread.id) {
          return { ...t, comments_count: t.comments_count + 1 };
        }
        return t;
      });
      setForumThreads(updatedThreads);
      setActiveThread(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null);
    }
    setIsSubmittingThreadComment(false);
  };

  const handleEditCommentSubmit = async (commentId: string) => {
    if (!editingCommentBody.trim() || !user || !activeThread) return;
    const violation = checkContentViolation(editingCommentBody);
    if (violation.hasViolation) {
      alert(violation.message || "Your input violates community guidelines.");
      return;
    }
    const ok = await updateComment(commentId, user.id, editingCommentBody);
    if (ok) {
      setEditingCommentId(null);
      setEditingCommentBody("");
      const comms = await getComments(undefined, activeThread.id);
      setThreadComments(comms || []);
    }
  };

  const handleDeleteCommentSubmit = async (commentId: string) => {
    if (!user || !activeThread) return;
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const ok = await deleteComment(commentId, user.id);
    if (ok) {
      const comms = await getComments(undefined, activeThread.id);
      setThreadComments(comms || []);
    }
  };

  const handleAddComment = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!user || !activeThread || !replyBody.trim()) return;

    setReplyError("");
    const violation = checkContentViolation(replyBody);
    if (violation.hasViolation) {
      setReplyError(violation.message || "");
      return;
    }

    const added = await addComment(null, user.id, replyBody, parentId, activeThread.id);
    if (added) {
      setReplyBody("");
      setReplyToId(null);
      const comms = await getComments(undefined, activeThread.id);
      setThreadComments(comms || []);
    }
  };

  return (
    <div className="space-y-6">
      {activeThread ? (
        /* Thread Detail View */
        <div className="space-y-6">
          {/* Back Button and Actions */}
          <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl">
            <button
              onClick={() => {
                setActiveThread(null);
                setThreadComments([]);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Threads
            </button>

            {user && (user.id === activeThread.user_id || user.id === product.maker_id) && (
              <button
                onClick={() => handleDeleteThread(activeThread.id)}
                className="text-red-500 hover:text-red-600 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Thread
              </button>
            )}
          </div>

          {/* Thread Original Post */}
          <div className="bg-card border border-border p-6 rounded-3xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0 flex items-center justify-center mt-1">
              <Image src={product.logo_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold bg-orange-600/10 text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {activeThread.category}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  posted by @{activeThread.user?.username || "maker"} • {new Date(activeThread.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{activeThread.title}</h3>
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">{activeThread.body}</p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Replies ({threadComments.length})</h4>

            {/* Post Reply Box */}
            {user ? (
              <form onSubmit={handleCreateThreadComment} className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-3">
                <textarea
                  value={newThreadCommentBody}
                  onChange={(e) => {
                    setNewThreadCommentBody(e.target.value);
                    setNewThreadCommentError("");
                  }}
                  placeholder="Add your reply or comment..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500 resize-none"
                  required
                />
                {newThreadCommentError && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{newThreadCommentError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingThreadComment}
                    className="bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isSubmittingThreadComment ? "Posting..." : "Reply"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-card border border-border p-4 rounded-2xl text-center">
                <p className="text-xs text-muted-foreground">Please log in to participate in the discussion.</p>
              </div>
            )}

            {/* Reply list */}
            <div className="space-y-3">
              {paginatedThreadComments.length === 0 ? (
                <div className="bg-card border border-border p-6 rounded-2xl text-center">
                  <p className="text-xs text-muted-foreground italic">No replies yet. Be the first to reply!</p>
                </div>
              ) : (
                paginatedThreadComments.map((comm) => {
                  const commUpvote = commentUpvotes[comm.id] || { count: comm.upvotes_count || 0, voted: comm.has_upvoted || false };

                  return (
                    <div key={comm.id} className="bg-card border border-border p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserHoverCard user={comm.user} userId={comm.user_id}>
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0 flex items-center justify-center font-semibold text-[10px] text-orange-500 cursor-pointer">
                              {comm.user?.avatar_url ? (
                                <Image src={comm.user.avatar_url} alt="Avatar" className="w-6 h-6 object-cover" width={24} height={24} />
                              ) : (
                                comm.user?.full_name?.charAt(0) || "U"
                              )}
                            </div>
                          </UserHoverCard>
                          <div>
                            <UserHoverCard user={comm.user} userId={comm.user_id}>
                              <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer block">@{comm.user?.username || "user"}</span>
                            </UserHoverCard>
                            <span className="text-[9px] text-muted-foreground block">{new Date(comm.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {editingCommentId === comm.id ? (
                        <div className="my-2 space-y-2 pl-8">
                          <textarea
                            value={editingCommentBody}
                            onChange={(e) => setEditingCommentBody(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditCommentSubmit(comm.id)}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-foreground/90 pl-8">{comm.body}</p>
                      )}

                      {/* Action Row: Upvote, Reply, Edit, Delete, Report */}
                      <div className="flex items-center gap-4 pl-8 pt-1">
                        <button
                          onClick={async () => {
                            if (!user) { dispatch(setAuthModalOpen(true)); return; }
                            const res = await toggleCommentUpvote(comm.id, user.id);
                            if (res) {
                              setCommentUpvotes(prev => ({ ...prev, [comm.id]: { count: res.upvotes_count, voted: res.has_upvoted } }));
                            }
                          }}
                          className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${commUpvote.voted ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-400'}`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Upvote{commUpvote.count > 0 ? ` (${commUpvote.count})` : ''}</span>
                        </button>

                        {user && (
                          <button
                            onClick={() => setReplyToId(replyToId === comm.id ? null : comm.id)}
                            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </button>
                        )}

                        {user?.id && user.id === comm.user_id && (
                          <button
                            onClick={() => {
                              setEditingCommentId(comm.id);
                              setEditingCommentBody(comm.body);
                            }}
                            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        {user?.id && user.id === comm.user_id && (
                          <button
                            onClick={() => handleDeleteCommentSubmit(comm.id)}
                            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}

                        {(!user || user.id !== comm.user_id) && (
                          <button
                            onClick={() => {
                              if (!user) {
                                dispatch(setAuthModalOpen(true));
                                return;
                              }
                              setReportModalState({
                                isOpen: true,
                                targetId: comm.id,
                                targetType: "comment",
                                title: "Report Comment",
                              });
                            }}
                            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Report</span>
                          </button>
                        )}
                      </div>

                      {/* Reply Form */}
                      {replyToId === comm.id && (
                        <div className="mt-3 pl-8">
                          <RichCommentEditor
                            value={replyBody}
                            onChange={(val) => { setReplyBody(val); setReplyError(""); }}
                            onSubmit={(e) => handleAddComment(e, comm.id)}
                            onCancel={() => { setReplyToId(null); setReplyError(""); }}
                            placeholder={`Replying to @${comm.user?.username || 'user'}...`}
                            submitLabel="Submit"
                            isReply
                            error={replyError}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Pagination for Thread Replies */}
              {totalThreadCommentsPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    disabled={threadCommentsPage === 1}
                    onClick={() => setThreadCommentsPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 border border-border bg-card rounded-lg text-[10px] font-semibold text-foreground hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="text-[10px] text-muted-foreground font-medium px-2">
                    Page {threadCommentsPage} of {totalThreadCommentsPages}
                  </span>
                  <button
                    disabled={threadCommentsPage === totalThreadCommentsPages}
                    onClick={() => setThreadCommentsPage(prev => Math.min(prev + 1, totalThreadCommentsPages))}
                    className="px-3 py-1.5 border border-border bg-card rounded-lg text-[10px] font-semibold text-foreground hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Thread List View */
        <>
          <div className="flex justify-between items-center bg-card border border-border p-5 rounded-2xl">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Community Forum</h3>
              <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">Ask questions or share ideas about {product.name}</span>
            </div>

            {user ? (
              <button
                onClick={() => setShowThreadForm(!showThreadForm)}
                className="bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors"
              >
                {showThreadForm ? "Cancel" : "New Thread / Ask"}
              </button>
            ) : (
              <span className="text-[10px] text-muted-foreground font-medium bg-muted/40 border border-border px-3 py-1.5 rounded-lg select-none">
                Log in to Ask Question
              </span>
            )}
          </div>

          {/* Create Thread Form */}
          {showThreadForm && (
            <form onSubmit={handleCreateThread} className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Create a New Thread</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newThreadTitle}
                    onChange={(e) => {
                      setNewThreadTitle(e.target.value);
                      setNewThreadTitleError("");
                    }}
                    placeholder="Thread Title / Question"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                    required
                  />
                  {newThreadTitleError && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">{newThreadTitleError}</p>
                  )}
                </div>
                <div>
                  <select
                    value={newThreadCategory}
                    onChange={(e) => setNewThreadCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                  >
                    <option value="General">General</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Ask">Ask</option>
                    <option value="Show">Show</option>
                  </select>
                </div>
              </div>

              <textarea
                value={newThreadBody}
                onChange={(e) => {
                  setNewThreadBody(e.target.value);
                  setNewThreadBodyError("");
                }}
                placeholder="What would you like to ask or discuss? Provide some details..."
                rows={4}
                className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500 resize-none"
                required
              />
              {newThreadBodyError && (
                <p className="text-red-500 text-[11px] mt-1 font-medium">{newThreadBodyError}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingThread}
                  className="bg-foreground text-background font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:bg-foreground/90 transition-colors disabled:opacity-50"
                >
                  {isCreatingThread ? "Creating..." : "Create Thread"}
                </button>
              </div>
            </form>
          )}

          {/* Forum Threads List */}
          <div className="space-y-4">
            {forumThreads.length === 0 ? (
              <div className="bg-card border border-border p-8 rounded-3xl text-center">
                <p className="text-xs text-muted-foreground italic">No discussion threads found. Start the conversation!</p>
              </div>
            ) : (
              forumThreads.map((thr) => (
                <div
                  key={thr.id}
                  onClick={() => handleSelectThread(thr)}
                  className="bg-card border border-border p-5 rounded-2xl hover:border-orange-500/20 hover:shadow-sm transition-all flex items-start gap-4 cursor-pointer relative group"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Image src={product.logo_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
                  </div>
                  <div className="flex-1 space-y-2 pr-8">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold bg-orange-600/10 text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {thr.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        posted by @{thr.user?.username || "maker"}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-orange-500 transition-colors">{thr.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{thr.body}</p>
                  </div>

                  {user && (user.id === thr.user_id || user.id === product.maker_id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteThread(thr.id);
                      }}
                      className="absolute top-5 right-5 text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                      title="Delete Thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
