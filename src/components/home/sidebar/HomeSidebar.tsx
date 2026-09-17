"use client";

import React from "react";
import { Product, Thread, Hunter } from "@/lib/supabase";
import LeaderboardWidget from "./LeaderboardWidget";
import TopHuntersWidget from "./TopHuntersWidget";
import TrendingThreadsWidget from "./TrendingThreadsWidget";
import TechPulseWidget from "./TechPulseWidget";
import CategoryExplorerWidget from "./CategoryExplorerWidget";
import UserStreakWidget from "./UserStreakWidget";

interface HomeSidebarProps {
  mounted: boolean;
  topLeaderboardProducts: Product[];
  topHunters: Hunter[];
  trendingThreads: Thread[];
  pulseActiveMakers: number;
  pulseProductsCount: number;
  pulseUpvotes: number;
  pulseCategoriesCount: number;
  categoryCounts: Record<string, number>;
  currentUser: any;
  profile: any;
  userProducts: Product[];
  onInviteReview: (product: Product) => void;
}

export default function HomeSidebar({
  mounted,
  topLeaderboardProducts,
  topHunters,
  trendingThreads,
  pulseActiveMakers,
  pulseProductsCount,
  pulseUpvotes,
  pulseCategoriesCount,
  categoryCounts,
  currentUser,
  profile,
  userProducts,
  onInviteReview,
}: HomeSidebarProps) {
  return (
    <div className="lg:col-span-3 space-y-7">
      {/* Product Leaderboard Section */}
      <LeaderboardWidget
        products={topLeaderboardProducts}
        mounted={mounted}
      />

      {/* Top Hunters Section */}
      <TopHuntersWidget hunters={topHunters} />

      {/* Trending Forum Threads */}
      <TrendingThreadsWidget
        threads={trendingThreads}
        mounted={mounted}
      />

      {/* Indian Tech Ecosystem Stats */}
      <TechPulseWidget
        activeMakers={pulseActiveMakers}
        productsCount={pulseProductsCount}
        upvotesCount={pulseUpvotes}
        categoriesCount={pulseCategoriesCount}
      />

      {/* Top Categories */}
      <CategoryExplorerWidget categoryCounts={categoryCounts} />

      {/* Logged in User Streak & Products */}
      <UserStreakWidget
        currentUser={currentUser}
        profile={profile}
        userProducts={userProducts}
        onInviteReview={onInviteReview}
      />
    </div>
  );
}
