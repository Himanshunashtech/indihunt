"use client";

import React, { memo } from "react";
import Link from "next/link";
import Favicon from "@/components/Favicon";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  MessageSquare,
  Lock,
  LayoutGrid,
} from "lucide-react";
import { Product, getProductSlug, getCategorySlug } from "@/lib/supabase";

interface ProductItemProps {
  product: Product;
  idx: number;
  onVote: (e: React.MouseEvent, productId: string) => void;
}

const ProductItem = memo(function ProductItem({
  product,
  idx,
  onVote,
}: ProductItemProps) {
  const router = useRouter();
  const slug = getProductSlug(product.name);
  const isScheduled = !!(
    product.status === "scheduled" &&
    product.scheduled_for &&
    new Date(product.scheduled_for) > new Date()
  );

  // Real product tags
  const tagList: string[] = [];
  if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
    product.tags.forEach((t) => {
      if (t && typeof t === "string" && !tagList.includes(t)) {
        tagList.push(t);
      }
    });
  }
  if (product.category && !tagList.includes(product.category)) {
    tagList.push(product.category);
  }
  // If still empty, derive fallback
  if (tagList.length === 0) {
    const text = `${product.name} ${product.tagline}`.toLowerCase();
    if (text.includes("ai") || text.includes("gpt") || text.includes("bot"))
      tagList.push("Artificial Intelligence");
    else if (
      text.includes("dev") ||
      text.includes("code") ||
      text.includes("api")
    )
      tagList.push("Developer Tools");
    else if (text.includes("marketing") || text.includes("seo"))
      tagList.push("Marketing Tools");
    else if (
      text.includes("finance") ||
      text.includes("pay") ||
      text.includes("crypto")
    )
      tagList.push("Finance & FinTech");
    else if (
      text.includes("task") ||
      text.includes("notes") ||
      text.includes("todo")
    )
      tagList.push("Productivity");
    else tagList.push("SaaS");
  }
  const productTags = tagList.slice(0, 3);
  const displayRank = idx + 1;

  const websiteUrl = product.website_url ? (() => {
    try {
      let u = product.website_url.trim();
      if (!/^https?:\/\//i.test(u)) u = "https://" + u;
      const parsed = new URL(u);
      parsed.searchParams.set("ref", "indihunt");
      return parsed.toString();
    } catch {
      return product.website_url.includes("?")
        ? `${product.website_url}&ref=indihunt`
        : `${product.website_url}?ref=indihunt`;
    }
  })() : null;

  const directPromotedUrl = product.is_promoted && websiteUrl ? websiteUrl : null;

  return (
    <section
      id={idx === 0 ? "first-product-card" : undefined}
      onMouseEnter={() => {
        if (!directPromotedUrl) router.prefetch(`/products/${slug}`);
      }}
      onFocus={() => {
        if (!directPromotedUrl) router.prefetch(`/products/${slug}`);
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("a") || target.closest("button")) {
          return;
        }
        if (directPromotedUrl) {
          window.open(directPromotedUrl, "_blank", "noopener,noreferrer");
          return;
        }
        router.push(`/products/${slug}`);
      }}
      className="group relative isolate flex flex-row items-start gap-4 rounded-xl px-0 py-4 transition-all duration-300 ease-out sm:-mx-4 sm:p-4 hover:sm:bg-muted/60 cursor-pointer"
      suppressHydrationWarning
    >
      <Favicon
        src={product.logo_url}
        websiteUrl={product.website_url}
        size={48}
        alt={product.name}
        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
      />

      <div className="flex min-w-0 flex-1 flex-col" suppressHydrationWarning>
        <span suppressHydrationWarning className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-foreground/90 transition-all duration-300 sm:flex-nowrap group-hover:sm:text-[#ff5733]">
          {directPromotedUrl ? (
            <a
              href={directPromotedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline font-semibold"
            >
              {displayRank}. {product.name}
            </a>
          ) : (
            <Link
              href={`/products/${slug}`}
              className="hover:underline font-semibold"
            >
              {displayRank}. {product.name}
            </Link>
          )}
          {product.is_promoted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md transition-colors shadow-2xs">
              Promoted
            </span>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Visit ${product.name}`}
              className="relative hidden cursor-pointer text-muted-foreground transition-all hover:sm:text-[#ff5733] group-hover:sm:inline-block flex-shrink-0 p-0.5"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
          {product.country === "India" && (
            <span className="text-[10px] font-semibold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
              🇮🇳 Built in India
            </span>
          )}
          {isScheduled && (
            <span className="text-xs font-medium bg-gradient-to-r from-[#ff4d79] to-[#ff6a00] text-white px-3 py-1 rounded-full shadow-xs flex items-center justify-center">
              Pre-launch
            </span>
          )}
          {product.featured && (
            <span className="text-base font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ⭐ Featured
            </span>
          )}
          {product.is_open_source && (
            <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              🧑‍💻 Open Source
            </span>
          )}
          {product.is_student_project && (
            <span className="text-[10px] font-semibold bg-purple-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
              🎓 Student
            </span>
          )}
        </span>

        <span className="mt-0.5 block text-base text-foreground/80 line-clamp-1">
          {product.tagline}
        </span>

        <div className="mt-1 hidden sm:flex flex-col items-start gap-2 *:z-10">
          <div className="flex flex-wrap items-center gap-2">
            {productTags.map((tag) => (
              <Link
                key={tag}
                href={`/categories/${getCategorySlug(tag)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline text-base font-medium bg-muted/50 hover:bg-muted px-2 py-0.5 rounded-md transition-colors"
              >
                <LayoutGrid className="w-3 h-3 text-muted-foreground/80" />
                <span>{tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Action Boxes on Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Comment Count Box */}
        <Link
          href={`/products/${getProductSlug(product.name)}`}
          onClick={(e) => e.stopPropagation()}
          className="relative hidden sm:block"
          title="View discussions"
        >
          <div className="group/accessory flex size-12 flex-col items-center justify-center gap-1 rounded-xl bg-muted/65 transition-all duration-300">
            <MessageSquare className="size-3.5 stroke-[#344054] dark:stroke-slate-600 group-hover/accessory:stroke-[#ff5733] transition-colors" />
            <p className="text-base font-medium leading-none text-foreground">
              {product.comments_count || 0}
            </p>
          </div>
        </Link>

        {/* Upvote Button Box */}
        {isScheduled ? (
          <div
            title="Upvoting disabled during pre-launch"
            className="flex size-12 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed flex-shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-base font-medium leading-none text-muted-foreground/60">
              {product.upvotes_count}
            </p>
          </div>
        ) : (
          <button
            id={idx === 0 ? "upvote-first" : undefined}
            onClick={(e) => onVote(e, product.id)}
            type="button"
            data-test="vote-button"
            className="relative"
          >
            <div
              className={`group/accessory flex size-12 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-300 ${
                product.has_upvoted
                  ? "bg-orange-500/10 text-[#ff5733]"
                  : "border border-border bg-card hover:border-[#ff5733]"
              }`}
              data-filled={product.has_upvoted ? "true" : "false"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 16 16"
                className={`size-4 stroke-[1.5px] transition-all duration-300 ${
                  product.has_upvoted
                    ? "fill-[#ff5733] stroke-[#ff5733]"
                    : "fill-white dark:fill-transparent stroke-slate-700 dark:stroke-slate-300 group-hover/accessory:stroke-[#ff5733]"
                }`}
              >
                <path d="M6.579 3.467c.71-1.067 2.132-1.067 2.842 0L12.975 8.8c.878 1.318.043 3.2-1.422 3.2H4.447c-1.464 0-2.3-1.882-1.422-3.2z" />
              </svg>
              <p className="text-base font-medium leading-none text-foreground">
                {product.upvotes_count || 0}
              </p>
            </div>
          </button>
        )}
      </div>
    </section>
  );
});

export default ProductItem;
