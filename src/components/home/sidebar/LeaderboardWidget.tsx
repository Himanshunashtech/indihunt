"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import Favicon from "@/components/Favicon";
import { ChevronRight } from "lucide-react";
import { Product, getProductSlug } from "@/lib/supabase";

interface LeaderboardWidgetProps {
  products: Product[];
  mounted: boolean;
}

export default function LeaderboardWidget({
  products,
  mounted,
}: LeaderboardWidgetProps) {
  return (
    <div className="pb-6 border-b border-border/40 space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xl font-medium text-foreground/80">Top Products</h4>
        </div>
        <Link
          href="/best-products"
          className="text-base font-semibold text-[#ff5733] hover:underline flex items-center gap-1 transition-colors"
        >
          Show all
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {products.map((prod, idx) => (
          <Link
              key={prod.id}
              href={`/products/${getProductSlug(prod.name)}`}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-card hover:bg-muted/60 border border-border/60 transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <Favicon
                    src={prod.logo_url}
                    websiteUrl={prod.website_url}
                    size={36}
                    alt={prod.name}
                    className="w-9 h-9 rounded-xl object-cover border border-border/60"
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
                  <h5 className="text-base font-semibold text-foreground group-hover:text-[#ff5733] transition-colors truncate">
                    {prod.name}
                  </h5>
                  <p className="text-base text-muted-foreground truncate">
                    {prod.tagline}
                  </p>
                </div>
              </div>
            </Link>
          ))}
      </div>

      <Link
        href="/best-products"
        className="w-full py-2.5 px-4 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center text-base font-semibold text-foreground/85 hover:text-[#ff5733] transition-all group shadow-2xs"
      >
        <span>Show all Top Products</span>
      </Link>
    </div>
  );
}
