"use client";

import React from "react";

interface TechPulseWidgetProps {
  activeMakers: number;
  productsCount: number;
  upvotesCount: number;
  categoriesCount: number;
}

export default function TechPulseWidget({
  activeMakers,
  productsCount,
  upvotesCount,
  categoriesCount,
}: TechPulseWidgetProps) {
  return (
    <div className="pb-5 space-y-2">
      <h4 className="font-semibold text-foreground text-base uppercase tracking-wider mb-2">
        Tech Ecosystem Pulse
      </h4>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted transition-colors cursor-default">
          <span className="text-base text-muted-foreground">Active Makers</span>
          <span
            suppressHydrationWarning
            className="text-base font-semibold text-foreground"
          >
            {activeMakers.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted transition-colors cursor-default">
          <span className="text-base text-muted-foreground">Products Launched</span>
          <span
            suppressHydrationWarning
            className="text-base font-semibold text-foreground"
          >
            {productsCount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted transition-colors cursor-default">
          <span className="text-base text-muted-foreground">Upvotes Cast</span>
          <span
            suppressHydrationWarning
            className="text-base font-semibold text-foreground"
          >
            {upvotesCount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted transition-colors cursor-default">
          <span className="text-base text-muted-foreground">
            Regional Categories
          </span>
          <span
            suppressHydrationWarning
            className="text-base font-semibold text-foreground"
          >
            {categoriesCount} domains
          </span>
        </div>
      </div>
    </div>
  );
}
