import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Search, ThumbsUp, Share2, Flag, Eye, Clock } from "lucide-react";
import { Review } from "@/lib/supabase";
import { recordView } from "@/lib/supabase";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppDispatch } from "@/lib/store";
import { setAuthModalOpen } from "@/lib/store";

interface ReviewsTabProps {
  reviews: Review[];
  productId: string;
  user: any;
  setReportModalState: (state: any) => void;
}

export default function ReviewsTab({ reviews, productId, user, setReportModalState }: ReviewsTabProps) {
  const dispatch = useAppDispatch();
  const [reviewsSearchQuery, setReviewsSearchQuery] = useState("");
  const [reviewsSortBy, setReviewsSortBy] = useState<"helpful" | "newest">("helpful");
  const [reviewsLimit, setReviewsLimit] = useState(3);
  const [selectedFilterTag, setSelectedFilterTag] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

  // 1. Calculate frequency of pros and cons across all reviews
  const prosCount: Record<string, number> = {};
  const consCount: Record<string, number> = {};

  reviews.forEach((r) => {
    if (r.pros && Array.isArray(r.pros)) {
      r.pros.forEach((p) => {
        const clean = p.trim().toLowerCase();
        if (clean) {
          prosCount[clean] = (prosCount[clean] || 0) + 1;
        }
      });
    }
    if (r.cons && Array.isArray(r.cons)) {
      r.cons.forEach((c) => {
        const clean = c.trim().toLowerCase();
        if (clean) {
          consCount[clean] = (consCount[clean] || 0) + 1;
        }
      });
    }
  });

  const sortedPros = Object.entries(prosCount).sort((a, b) => b[1] - a[1]);
  const sortedCons = Object.entries(consCount).sort((a, b) => b[1] - a[1]);

  // Helper to format date relative
  const getReviewTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHrs = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays <= 0) {
        if (diffHrs > 0) return `${diffHrs}h ago`;
        if (diffMin > 0) return `${diffMin}m ago`;
        return "just now";
      }
      if (diffDays < 30) return `${diffDays}d ago`;
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) return `${diffMonths}mo ago`;
      const diffYears = Math.floor(diffMonths / 12);
      return `${diffYears}yr ago`;
    } catch (e) {
      return "some time ago";
    }
  };

  // Filter and Sort reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        // Search query
        if (reviewsSearchQuery.trim()) {
          const q = reviewsSearchQuery.toLowerCase();
          const bodyMatch = r.body?.toLowerCase().includes(q);
          const userMatch = r.user?.full_name?.toLowerCase().includes(q) || r.user?.username?.toLowerCase().includes(q);
          const proMatch = r.pros?.some(p => p.toLowerCase().includes(q));
          const conMatch = r.cons?.some(c => c.toLowerCase().includes(q));
          if (!bodyMatch && !userMatch && !proMatch && !conMatch) return false;
        }
        // Selected tag filter
        if (selectedFilterTag) {
          const isPro = r.pros?.some(p => p.trim().toLowerCase() === selectedFilterTag.toLowerCase());
          const isCon = r.cons?.some(c => c.trim().toLowerCase() === selectedFilterTag.toLowerCase());
          if (!isPro && !isCon) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (reviewsSortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return ((b.helpful_votes || 0) + (helpfulVoted[b.id] ? 1 : 0)) - ((a.helpful_votes || 0) + (helpfulVoted[a.id] ? 1 : 0));
      });
  }, [reviews, reviewsSearchQuery, selectedFilterTag, reviewsSortBy, helpfulVoted]);

  // Render reviews list sliced by limit
  const displayedReviews = useMemo(() => {
    return filteredReviews.slice(0, reviewsLimit);
  }, [filteredReviews, reviewsLimit]);

  return (
    <div className="space-y-8">
      {/* Average Rating and Call to Action */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Average Rating</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-foreground">
              {reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                : "0.0"}
            </span>
            <span className="text-sm text-muted-foreground">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => {
              const avg = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
              return (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(avg) ? "fill-amber-500 text-amber-500" : "text-border"}`}
                />
              );
            })}
            <span className="text-xs text-muted-foreground ml-1">({reviews.length} reviews)</span>
          </div>
        </div>

        <div className="w-full md:w-auto text-center md:text-right flex flex-col items-center md:items-end gap-2">
          <span className="text-xs text-muted-foreground font-medium">Share your feedback to support the makers!</span>
          {user ? (
            <Link
              href={`/products/${productId}/review`}
              className="inline-flex items-center gap-1.5 bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              <Star className="w-4 h-4 fill-white text-white" />
              Write a Review
            </Link>
          ) : (
            <button
              onClick={() => dispatch(setAuthModalOpen(true))}
              className="inline-flex items-center gap-1.5 bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              <Star className="w-4 h-4 fill-white text-white" />
              Login to Review
            </button>
          )}
        </div>
      </div>

      {/* Pros and Cons Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros Block */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground tracking-tight">Pros</h3>
          {sortedPros.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sortedPros.slice(0, 10).map(([tag, count]) => {
                const isActive = selectedFilterTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedFilterTag(isActive ? null : tag)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${isActive
                      ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/40 shadow-sm"
                      : "bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#059669] border-[#a7f3d0]"
                      }`}
                  >
                    + {tag} ({count})
                  </button>
                );
              })}
              {sortedPros.length > 10 && (
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-full">
                  +{sortedPros.length - 10} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No pros highlighted yet.</p>
          )}
        </div>

        {/* Cons Block */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground tracking-tight">Cons</h3>
          {sortedCons.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sortedCons.slice(0, 10).map(([tag, count]) => {
                const isActive = selectedFilterTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedFilterTag(isActive ? null : tag)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${isActive
                      ? "bg-rose-500/20 text-rose-600 border-rose-500/40 shadow-sm"
                      : "bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] border-[#fecaca]"
                      }`}
                  >
                    - {tag} ({count})
                  </button>
                );
              })}
              {sortedCons.length > 10 && (
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-full">
                  +{sortedCons.length - 10} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No cons highlighted yet.</p>
          )}
        </div>
      </div>

      {/* Search and Filters Input */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={reviewsSearchQuery}
            onChange={(e) => setReviewsSearchQuery(e.target.value)}
            className="w-full bg-background border border-border/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors shadow-sm"
          />
          {reviewsSearchQuery && (
            <button
              onClick={() => setReviewsSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        {selectedFilterTag && (
          <button
            onClick={() => setSelectedFilterTag(null)}
            className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20"
          >
            Filter: {selectedFilterTag} ✕
          </button>
        )}
      </div>

      {/* Reviews Header row */}
      <div className="flex items-center justify-between  pb-3">
        <h3 className="text-sm font-bold text-foreground tracking-tight">Reviews</h3>
        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex items-center gap-1 cursor-pointer hover:text-foreground outline-none text-[#ff5733]">
              {reviewsSortBy === "helpful" ? "Most Informative" : "Newest First"} ⌵
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="bg-card border border-border rounded-xl p-1.5 shadow-lg space-y-0.5 min-w-[140px] z-50">
                <DropdownMenu.Item
                  onClick={() => setReviewsSortBy("helpful")}
                  className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted outline-none cursor-pointer text-foreground"
                >
                  Most Informative
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => setReviewsSortBy("newest")}
                  className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted outline-none cursor-pointer text-foreground"
                >
                  Newest First
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="bg-card border border-border p-8 rounded-3xl text-center">
            <p className="text-xs text-muted-foreground italic">
              {reviewsSearchQuery || selectedFilterTag ? "No reviews match your filter/search criteria." : "No reviews yet. Be the first to review this product!"}
            </p>
          </div>
        ) : (
          displayedReviews.map((rev) => {
            const isExpanded = expandedReviews[rev.id] || false;
            const hasVotedHelpful = helpfulVoted[rev.id] || false;
            const displayBody = isExpanded || rev.body.length <= 220
              ? rev.body
              : `${rev.body.slice(0, 220)}...`;

            return (
              <div key={rev.id} className="bg-card border border-border p-6 rounded-2xl space-y-4 hover:border-border/80 transition-all text-left">
                {/* Reviewer Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <Link href={rev.user?.username ? `/@${rev.user.username}` : `/profile?id=${rev.user_id}`} className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center font-semibold text-xs text-orange-500 flex-shrink-0 hover:opacity-90 transition-opacity">
                      {rev.user?.avatar_url ? (
                        <Image src={rev.user.avatar_url} alt={rev.user.full_name} className="w-10 h-10 object-cover" width={40} height={40} />
                      ) : (
                        rev.user?.full_name?.charAt(0) || "U"
                      )}
                    </Link>
                    <div>
                      <Link href={rev.user?.username ? `/@${rev.user.username}` : `/profile?id=${rev.user_id}`} className="text-xs font-medium text-foreground block hover:text-orange-500 transition-colors">{rev.user?.full_name}</Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-3 h-3 ${star <= rev.rating ? "fill-amber-500 text-amber-500" : "text-border"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal">• {rev.user?.streak_count || 1} reviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Highlights: Pros / What's Great */}
                {rev.pros && rev.pros.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-foreground">What's great</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {rev.pros.map((pro) => (
                        <span
                          key={pro}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] rounded-full"
                        >
                          + {pro}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Body */}
                <div className="text-base text-foreground/80 leading-relaxed space-y-2 whitespace-pre-line">
                  <p>{displayBody}</p>
                  {rev.body.length > 220 && !isExpanded && (
                    <button
                      onClick={() => setExpandedReviews({ ...expandedReviews, [rev.id]: true })}
                      className="text-[#ff5733] hover:text-[#e64a19] text-xs font-semibold transition-colors block mt-1 cursor-pointer"
                    >
                      Read more
                    </button>
                  )}
                </div>

                {/* Alternatives Comparison */}
                {rev.alternatives_vs && (
                  <div className="bg-muted/30 border border-border/60 p-4 rounded-xl space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-foreground">vs Alternatives</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {rev.alternatives_vs}
                    </p>
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-muted-foreground border-t border-border/40 pt-3.5">
                  <button
                    onClick={() => {
                      setHelpfulVoted({ ...helpfulVoted, [rev.id]: !hasVotedHelpful });
                      if (!hasVotedHelpful) {
                        recordView(rev.id, 'review', user?.id || undefined);
                      }
                    }}
                    className={`flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ${hasVotedHelpful ? "text-[#ff5733]" : ""
                      }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful ({(rev.helpful_votes || 0) + (hasVotedHelpful ? 1 : 0)})
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + `/products/${productId}`);
                      alert("Product link copied to clipboard!");
                    }}
                    className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>

                  <button
                    onClick={() => {
                      if (!user) {
                        dispatch(setAuthModalOpen(true));
                        return;
                      }
                      setReportModalState({
                        isOpen: true,
                        targetId: rev.id,
                        targetType: "comment",
                        title: "Report Review",
                      });
                    }}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report
                  </button>

                  <div className="flex items-center gap-1 ml-auto text-muted-foreground/60 font-normal">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{rev.views || 0} views</span>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground/60 font-normal">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getReviewTimeAgo(rev.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View All Button */}
      {filteredReviews.length > reviewsLimit && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setReviewsLimit(1000)}
            className="w-full max-w-md bg-background border border-border text-foreground font-semibold text-xs py-3 rounded-xl hover:bg-muted transition-colors cursor-pointer text-center"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}
