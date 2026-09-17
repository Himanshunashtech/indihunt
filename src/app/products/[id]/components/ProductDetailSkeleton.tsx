"use client";

import React from "react";
import Navbar from "@/components/Navbar";

export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background pt-[72px] sm:pt-[78px]">
      <Navbar />

      <main className="flex-1 w-full min-h-[calc(100vh-84px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[20px] pb-8 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Main Column */}
            <div className="lg:col-span-9 space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row gap-6 rounded-2xl border border-border bg-card p-6">
                <div className="h-24 w-24 rounded-2xl bg-muted animate-pulse shrink-0" />

                <div className="flex-1 space-y-3">
                  <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />

                  <div className="flex gap-3 pt-2">
                    <div className="h-10 w-36 rounded-xl bg-muted animate-pulse" />
                    <div className="h-10 w-28 rounded-xl bg-muted animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Hero Media */}
              <div className="aspect-video rounded-2xl border border-border bg-muted animate-pulse" />

              {/* Description */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
                <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-11/12 rounded bg-muted animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
              </div>

              {/* Comments */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-full rounded bg-muted animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-3 space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-5 space-y-3"
                >
                  <div className="h-5 w-28 rounded bg-muted animate-pulse" />
                  <div className="h-10 w-full rounded-xl bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
