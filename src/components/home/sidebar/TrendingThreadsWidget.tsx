"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { Thread, getProductSlug } from "@/lib/supabase";

interface TrendingThreadsWidgetProps {
  threads: Thread[];
  mounted: boolean;
}

export default function TrendingThreadsWidget({
  threads,
  mounted,
}: TrendingThreadsWidgetProps) {
  return (
    <div className="pb-6 space-y-4">
      <h4 className="text-xl font-medium text-foreground/80">
        Trending Forum Threads
      </h4>

      <div className="space-y-2.5">
        {threads.map((thread, idx) => (
          <Link
              key={thread.id}
              href={`/threads/${getProductSlug(thread.title)}`}
              prefetch={false}
              className={`block transition-all group ${
                idx === 0
                  ? "p-4 bg-muted/40 border border-border/60 rounded-2xl hover:bg-muted/80"
                  : "p-2.5 hover:bg-muted/60 rounded-xl"
              }`}
            >
              <span className="text-base font-medium text-muted-foreground group-hover:text-[#ff5733] transition-colors block mb-1">
                p/{thread.category ? thread.category.toLowerCase() : "general"}
              </span>
              <h5 className="text-base font-medium text-foreground group-hover:text-[#ff5733] transition-colors leading-snug line-clamp-2 mb-2">
                {thread.title}
              </h5>

              <div className="flex items-center gap-2.5 text-base text-muted-foreground font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 4.5L3.5 17.5C3.1 18.1 3.5 19 4.3 19H19.7C20.5 19 20.9 18.1 20.5 17.5L12 4.5Z" />
                  </svg>
                  Upvote ({thread.upvotes_count || 0})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {thread.comments_count || 0}
                </span>
                {"isOnline" in thread && Boolean(thread.isOnline) && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-500 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {String(thread.isOnline)}
                    </span>
                  </>
                )}
              </div>
            </Link>
          ))}
      </div>

      {/* Two Stacked Rounded Action Buttons (View all & Start new thread) */}
      <div className="space-y-2.5 pt-2">
        <Link
          href="/discussions"
          prefetch={false}
          className="w-full py-3 px-5 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center text-base font-semibold text-foreground/85 hover:text-[#ff5733] transition-all group shadow-2xs"
        >
          <span>View all</span>
        </Link>
        <Link
          href="/discussions?new=true"
          prefetch={false}
          className="w-full py-3 px-5 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center gap-2 text-base font-semibold text-foreground/85 hover:text-[#ff5733] transition-all group shadow-2xs"
        >
          <MessageSquarePlus className="w-4 h-4 text-foreground/75 group-hover:text-[#ff5733] transition-colors" />
          <span>Start new thread</span>
        </Link>
      </div>
    </div>
  );
}
