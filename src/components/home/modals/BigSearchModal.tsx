"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Rocket, MessageSquare, ArrowUp } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Product, Thread, getProductSlug, getCategorySlug } from "@/lib/supabase";

interface BigSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modalSearchQuery: string;
  setModalSearchQuery: (q: string) => void;
  categoryCounts: Record<string, number>;
  modalSearchResults: {
    products: Product[];
    threads: Thread[];
  };
}

export default function BigSearchModal({
  open,
  onOpenChange,
  modalSearchQuery,
  setModalSearchQuery,
  categoryCounts,
  modalSearchResults,
}: BigSearchModalProps) {
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    router.push(
      `/search${
        modalSearchQuery.trim()
          ? `?q=${encodeURIComponent(modalSearchQuery.trim())}`
          : ""
      }`
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setModalSearchQuery("");
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-all duration-200" />

        <Dialog.Content className="fixed top-[4%] sm:top-[6%] left-1/2 -translate-x-1/2 w-[96vw] sm:w-[92vw] md:w-[88vw] max-w-4xl bg-white dark:bg-card border border-border rounded-2xl overflow-hidden z-50 shadow-2xl focus:outline-none animate-in fade-in slide-in-from-top-4 duration-200 flex flex-col h-[88vh] max-h-[88vh]">
          {/* Search Input Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center px-6 sm:px-8 py-5 sm:py-6 border-b border-border/80 flex-shrink-0"
          >
            <Search className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search for products, launches, or people..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent pl-4 pr-3 text-lg sm:text-xl text-foreground placeholder-muted-foreground/70 focus:outline-none font-normal"
            />
            {modalSearchQuery && (
              <button
                type="button"
                onClick={() => setModalSearchQuery("")}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 mr-1.5 cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {/* Circular arrow button to go to full search page */}
            <button
              type="submit"
              className="flex-shrink-0 w-10 h-10 rounded-full border border-border text-muted-foreground hover:border-[#ff5733] hover:text-[#ff5733] flex items-center justify-center transition-all cursor-pointer ml-1.5"
              title="Go to full search page"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            {/* Close Cross Button */}
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted p-2.5 rounded-full transition-all cursor-pointer ml-1.5"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </form>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-7 space-y-8 scrollbar-thin">
            {!modalSearchQuery.trim() ? (
              <>
                {/* Popular Launch Tags */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-widest">
                      Popular Launch Tags
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      "Artificial Intelligence",
                      "Productivity",
                      "Developer Tools",
                      "GitHub",
                      "Open Source",
                      "Design Tools",
                      "Marketing Tools",
                      "SaaS",
                    ].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setModalSearchQuery(tag)}
                        className="text-sm sm:text-base font-normal bg-secondary hover:bg-muted text-foreground px-4 py-2 rounded-full transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/categories"
                    onClick={() => onOpenChange(false)}
                    className="inline-block text-sm sm:text-base font-medium text-[#ff5733] hover:underline"
                  >
                    View All Launch tags &rarr;
                  </Link>
                </div>

                {/* Product Categories */}
                <div className="space-y-3.5">
                  <h3 className="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-widest">
                    Product Categories
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(categoryCounts).map(([catName, count]) => (
                      <div
                        key={catName}
                        className="p-4 rounded-xl border border-border bg-card/60 hover:bg-secondary/40 transition-colors flex items-center justify-between gap-4"
                      >
                        <button
                          onClick={() => setModalSearchQuery(catName)}
                          className="text-sm sm:text-base font-medium text-foreground hover:text-[#ff5733] transition-colors text-left cursor-pointer truncate"
                        >
                          {catName}
                        </button>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="text-xs sm:text-sm text-muted-foreground font-normal">
                            {count} projects
                          </span>
                          <Link
                            href={`/categories/${getCategorySlug(catName)}`}
                            onClick={() => onOpenChange(false)}
                            className="text-xs sm:text-sm font-medium text-[#ff5733] hover:underline flex-shrink-0"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Matching Products */}
                {modalSearchResults.products.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-base font-semibold text-muted-foreground uppercase tracking-widest">
                      <Rocket className="w-3.5 h-3.5" />
                      <span>
                        Products ({modalSearchResults.products.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {modalSearchResults.products.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            onOpenChange(false);
                            router.push(
                              `/products/${getProductSlug(product.name)}`
                            );
                          }}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/60 hover:bg-secondary cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border p-0.5 flex-shrink-0 flex items-center justify-center">
                              <img
                                src={product.logo_url}
                                alt=""
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-base text-foreground group-hover:text-[#ff5733] transition-colors block">
                                {product.name}
                              </span>
                              <span className="text-base text-muted-foreground truncate block mt-0.5">
                                {product.tagline}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-lg border border-border text-base font-semibold text-muted-foreground group-hover:text-[#ff5733] transition-colors">
                            <ArrowUp className="w-3 h-3" />
                            <span>{product.upvotes_count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Forum Threads */}
                {modalSearchResults.threads.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-base font-semibold text-muted-foreground uppercase tracking-widest">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        Discussions ({modalSearchResults.threads.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {modalSearchResults.threads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => {
                            onOpenChange(false);
                            router.push(`/discussions#thread-${thread.id}`);
                          }}
                          className="p-3 rounded-2xl bg-secondary/60 hover:bg-secondary cursor-pointer transition-all group"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <span className="font-semibold text-base text-foreground group-hover:text-[#ff5733] transition-colors block leading-snug line-clamp-1">
                                {thread.title}
                              </span>
                              <span className="text-base text-muted-foreground line-clamp-1 mt-1 leading-normal">
                                {thread.body}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5">
                              {thread.category || "General"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results Placeholder */}
                {modalSearchResults.products.length === 0 &&
                  modalSearchResults.threads.length === 0 && (
                    <div className="py-12 text-center space-y-3">
                      <p className="text-base font-medium text-foreground">
                        No matches found for &quot;{modalSearchQuery}&quot;
                      </p>
                      <p className="text-base text-muted-foreground max-w-xs mx-auto">
                        Double check spelling or try using simpler keywords.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Footer hints */}
          <div className="border-t border-border px-5 sm:px-6 py-3 flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0">
            <span>Press Esc to close</span>
            <button
              onClick={() => {
                onOpenChange(false);
                router.push(
                  `/search${
                    modalSearchQuery.trim()
                      ? `?q=${encodeURIComponent(modalSearchQuery.trim())}`
                      : ""
                  }`
                );
              }}
              className="text-[#ff5733] hover:underline flex items-center gap-1 cursor-pointer font-bold normal-case text-base"
            >
              <span>View full search page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
