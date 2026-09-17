"use client";

import React from "react";
import { Package } from "lucide-react";

interface FeedHeaderProps {
  activeFeedTab: string;
  setActiveFeedTab: (tab: "all" | "upcoming") => void;
  onTabChangeReset: () => void;
}

export default function FeedHeader({
  activeFeedTab,
  setActiveFeedTab,
  onTabChangeReset,
}: FeedHeaderProps) {
  const tabs = [
    {
      id: "all",
      label: "Products",
      icon: <Package className="w-4 h-4" />,
      desc: "Latest submissions",
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1 mb-2">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveFeedTab(tab.id as any);
              onTabChangeReset();
            }}
            className={`py-1.5 text-base font-medium border-b-2 transition-all cursor-pointer focus:outline-none flex items-center gap-1.5 ${
              activeFeedTab === tab.id
                ? "border-[#ff5733] text-[#ff5733]"
                : "border-transparent text-foreground/80 hover:text-orange-500"
            }`}
            title={tab.desc}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
