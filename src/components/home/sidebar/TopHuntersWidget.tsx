"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Hunter } from "@/lib/supabase";

interface TopHuntersWidgetProps {
  hunters: Hunter[];
}

export default function TopHuntersWidget({ hunters }: TopHuntersWidgetProps) {
  return (
    <div className="pb-6 border-b border-border/40 space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xl font-medium text-foreground/80">Top Hunters</h4>
        </div>
        <Link
          href="/top-hunters"
          className="text-base font-semibold text-[#ff5733] hover:underline flex items-center gap-1 transition-colors"
        >
          Show all
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-1.5">
        {hunters && hunters.length > 0 ? (
          hunters.slice(0, 5).map((hunter, idx) => (
            <Link
              key={hunter.id}
              href="/top-hunters"
              className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <Image
                    src={hunter.avatar_url}
                    alt={hunter.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border border-border/60"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
                      idx === 0
                        ? "bg-amber-500"
                        : idx === 1
                        ? "bg-slate-400"
                        : idx === 2
                        ? "bg-amber-700"
                        : "bg-muted-foreground/40 text-foreground"
                    }`}
                  >
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <h5 className="text-base font-medium text-foreground group-hover:text-[#ff5733] transition-colors truncate">
                    {hunter.name}
                  </h5>
                  <p className="text-base text-muted-foreground truncate">
                    @{hunter.username}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-semibold text-foreground/90 block">
                  {hunter.hunts_count} hunts
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {hunter.upvotes_count >= 1000
                    ? `${(hunter.upvotes_count / 1000).toFixed(1)}k`
                    : hunter.upvotes_count}{" "}
                  upvotes
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-2 text-center">
            No top hunters yet.
          </p>
        )}
      </div>

      <Link
        href="/top-hunters"
        className="w-full py-2.5 px-4 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center text-base font-semibold text-foreground/85 hover:text-[#ff5733] transition-all group shadow-2xs"
      >
        <span>Show all Top Hunters</span>
      </Link>
    </div>
  );
}
