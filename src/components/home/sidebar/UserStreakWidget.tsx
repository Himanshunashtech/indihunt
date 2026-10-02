"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import Favicon from "@/components/Favicon";
import { MessageSquarePlus } from "lucide-react";
import { Product, getProductSlug } from "@/lib/supabase";

interface UserStreakWidgetProps {
  currentUser: any;
  profile: any;
  userProducts: Product[];
  onInviteReview: (product: Product) => void;
}

export default function UserStreakWidget({
  currentUser,
  profile,
  userProducts,
  onInviteReview,
}: UserStreakWidgetProps) {
  if (!currentUser) return null;

  const currentStreak = profile?.streak_count || 0;
  const nodeColors = [
    { completed: "bg-pink-500 border-pink-500", dot: "bg-pink-500" },
    { completed: "bg-indigo-600 border-indigo-600", dot: "bg-indigo-600" },
    { completed: "bg-sky-500 border-sky-500", dot: "bg-sky-500" },
    { completed: "bg-emerald-500 border-emerald-500", dot: "bg-emerald-500" },
    { completed: "bg-lime-500 border-lime-500", dot: "bg-lime-500" },
    { completed: "bg-amber-500 border-amber-500", dot: "bg-amber-500" },
  ];
  const lineGradients = [
    "bg-gradient-to-r from-pink-500 to-indigo-600",
    "bg-gradient-to-r from-indigo-600 to-sky-500",
    "bg-gradient-to-r from-sky-500 to-emerald-500",
    "bg-gradient-to-r from-emerald-500 to-lime-500",
    "bg-gradient-to-r from-lime-500 to-amber-500",
  ];

  return (
    <div className="space-y-5">
      {/* Streak Visual Element */}
      <div className="pb-5 space-y-3">
        <div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            You&apos;re on
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base font-bold text-foreground tracking-tight">
              {currentStreak} day streak
            </span>
            <span className="text-base">☀️</span>
          </div>
        </div>

        {/* Milestone nodes */}
        <div className="flex items-center justify-between relative px-0.5 py-1">
          {[1, 2, 3, 4, 5, 6].map((day, idx) => {
            const isCompleted = day <= currentStreak;
            const c = nodeColors[idx] || nodeColors[0];
            return (
              <React.Fragment key={day}>
                <div
                  className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-white transition-all border-2 ${
                    isCompleted
                      ? c.completed
                      : "bg-background border-muted-foreground/30"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={4.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-40`}
                    />
                  )}
                </div>

                {day < 6 &&
                  (() => {
                    const isLineCompleted = day < currentStreak;
                    const lineClass = isLineCompleted
                      ? lineGradients[idx] || "bg-orange-500"
                      : "border-t-2 border-dashed border-muted-foreground/20";
                    return (
                      <div
                        className={`flex-1 h-[2px] mx-0.5 transition-all ${lineClass}`}
                      />
                    );
                  })()}
              </React.Fragment>
            );
          })}
        </div>

        <Link
          href="/profile/streak"
          className="text-[11px] font-semibold text-[#ff5733] hover:text-[#ff5733] transition-colors block"
        >
          View visit streak ranking
        </Link>
      </div>

      <div className="pb-5 space-y-3">
        <h4 className="font-semibold text-foreground text-base uppercase tracking-wider">
          Your Products
        </h4>
        {userProducts.length === 0 ? (
          <p className="text-base text-muted-foreground leading-relaxed">
            You haven&apos;t launched any products yet.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-56 pr-1">
            {userProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-2xl border border-border/60 bg-card/40 hover:bg-muted transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Link
                    href={`/products/${getProductSlug(p.name)}`}
                    className="w-11 h-11 rounded-2xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center border border-border/80"
                  >
                    <Favicon
                      src={p.logo_url}
                      websiteUrl={p.website_url}
                      size={48}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${getProductSlug(p.name)}`}
                      className="text-base font-semibold text-foreground hover:text-[#ff5733] transition-colors truncate block leading-snug"
                    >
                      {p.name}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInviteReview(p);
                      }}
                      className="flex items-center gap-1.5 text-base font-medium text-muted-foreground hover:text-[#ff5733] transition-colors mt-0.5 cursor-pointer"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                      <span>Invite for review</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
