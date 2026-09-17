"use client";

import React from "react";
import Link from "next/link";

interface CategoryExplorerWidgetProps {
  categoryCounts: Record<string, number>;
}

export default function CategoryExplorerWidget({
  categoryCounts,
}: CategoryExplorerWidgetProps) {
  return (
    <div className="pb-5 space-y-2">
      <div className="flex items-center justify-between pb-2">
        <h4 className="font-semibold text-foreground text-base uppercase tracking-wider">
          Top Categories
        </h4>
        <Link
          href="/categories"
          className="text-base font-semibold text-[#ff5733] hover:text-[#ff5733] transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="space-y-0.5">
        {Object.entries(categoryCounts).map(([catName, count]) => (
          <Link
            key={catName}
            href={`/categories?category=${encodeURIComponent(
              catName.toLowerCase()
            )}`}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
          >
            <span className="text-base font-normal text-muted-foreground group-hover:text-[#ff5733] transition-colors truncate">
              {catName}
            </span>
            <span
              suppressHydrationWarning
              className="text-[10px] font-semibold text-muted-foreground group-hover:text-[#ff5733] transition-colors"
            >
              {count} projects
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
