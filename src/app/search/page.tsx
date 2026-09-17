"use client";


import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowRight,
  Rocket,
  MessageSquare,
  Users,
  ChevronRight,
  ArrowUp,
  X,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  performVectorSearch,
  MultiEntitySearchResults,
  Product,
  Thread,
  Profile,
  getProductSlug,
} from "@/lib/supabase";

import { CircularLoader } from "@/components/CircularLoader";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "products" | "launches" | "users">("all");

  const [searchResults, setSearchResults] = useState<MultiEntitySearchResults>({
    products: [],
    threads: [],
    users: [],
    all: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let isMounted = true;
    const runSearch = async () => {
      if (!initialQuery.trim()) {
        setSearchResults({ products: [], threads: [], users: [], all: [] });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const results = await performVectorSearch(initialQuery.trim());
        if (isMounted) {
          setSearchResults(results);
        }
      } catch (err) {
        console.error("Error executing vector search:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    runSearch();

    return () => {
      isMounted = false;
    };
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/search`);
    }
  };

  const popularTags = [
    { label: "Artificial Intelligence", href: "/categories/artificial-intelligence" },
    { label: "Productivity", href: "/categories/productivity" },
    { label: "Developer Tools", href: "/categories/developer-tools" },
    { label: "SaaS", href: "/categories/saas" },
    { label: "Open Source", href: "/categories/open-source" },
    { label: "Fintech", href: "/categories/finance-fintech" },
    { label: "AI Coding Agents", href: "/categories/ai-agents-automation" },
  ];

  const categoryGroups = [
    {
      title: "Productivity",
      items: [
        { label: "Note and writing apps", href: "/categories/productivity" },
        { label: "Project management software", href: "/categories/productivity" },
        { label: "Team collaboration software", href: "/categories/productivity" },
        { label: "Writing assistants", href: "/categories/productivity" },
        { label: "Search & Discovery", href: "/categories/productivity" },
      ],
    },
    {
      title: "Engineering & Development",
      items: [
        { label: "Automation tools", href: "/categories/ai-agents-automation" },
        { label: "Website builders", href: "/categories/developer-tools" },
        { label: "Unified API", href: "/categories/apis-integrations" },
        { label: "AI Coding Agents", href: "/categories/ai-agents-automation" },
        { label: "Predictive AI", href: "/categories/artificial-intelligence" },
        { label: "Testing and QA", href: "/categories/developer-tools" },
      ],
    },
    {
      title: "Artificial Intelligence",
      items: [
        { label: "LLM models", href: "/categories/artificial-intelligence" },
        { label: "AI Image Generators", href: "/categories/artificial-intelligence" },
        { label: "Code Assistants", href: "/categories/developer-tools" },
        { label: "AI Search engines", href: "/categories/artificial-intelligence" },
      ],
    },
    {
      title: "Finance & FinTech",
      items: [
        { label: "Billing & Invoicing", href: "/categories/finance-fintech" },
        { label: "Payment gateways", href: "/categories/finance-fintech" },
        { label: "Crypto & Web3", href: "/categories/web3-crypto" },
        { label: "Personal Finance", href: "/categories/finance-fintech" },
      ],
    },
  ];

  const { products, threads, users, all } = searchResults;

  return (
    <div className="min-h-screen bg-background text-foreground pt-10 sm:pt-20 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Header Form with Vector Search Badge */}
        <form onSubmit={handleSearchSubmit} className="relative mb-8 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-orange-500">
              <Sparkles className="w-3.5 h-3.5" /> Dynamic Vector Search Engine
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Instant similarity vector matching across products, discussions & makers
            </span>
          </div>

          <div className="relative flex items-center bg-card border border-border rounded-2xl p-2 shadow-md">
            <Search className="w-5 h-5 text-muted-foreground ml-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, threads, makers using vector search..."
              className="w-full bg-transparent px-4 py-2 text-base text-foreground placeholder-muted-foreground focus:outline-none font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  router.push("/search");
                }}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors mr-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-[#ff5733] hover:bg-[#e64a19] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-all shadow-sm shrink-0"
            >
              <span>Vector Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar Navigation Tabs */}
          <aside className="lg:col-span-3 space-y-2">
            <div className="bg-card border border-border rounded-2xl p-2 space-y-1">
              {[
                { id: "all", label: "All Results", icon: Layers, count: all.length },
                { id: "products", label: "Products", icon: Rocket, count: products.length },
                { id: "launches", label: "Threads", icon: MessageSquare, count: threads.length },
                { id: "users", label: "Users / Makers", icon: Users, count: users.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <span className="flex items-center gap-2.5">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </span>
                  {initialQuery.trim() && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeTab === tab.id
                        ? "bg-background text-muted-foreground"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Right Main Content */}
          <section className="lg:col-span-9">
            {!initialQuery.trim() ? (
              /* Default Overview (Empty Query) */
              <div className="space-y-8">
                {/* Popular Launch Tags */}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Popular Vector Search Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <button
                        key={tag.label}
                        onClick={() => {
                          setQuery(tag.label);
                          router.push(`/search?q=${encodeURIComponent(tag.label)}`);
                        }}
                        className="text-xs font-medium bg-muted hover:bg-muted/80 text-foreground/90 px-3.5 py-2 rounded-xl border border-border/80 transition-colors cursor-pointer"
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/categories"
                      className="text-xs font-medium text-foreground/80 hover:text-foreground hover:underline inline-flex items-center gap-1"
                    >
                      View All Launch tags <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Product Categories */}
                <div className="space-y-4">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Explore Product Categories
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryGroups.map((group) => (
                      <div
                        key={group.title}
                        className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm hover:bg-muted/30 transition-all"
                      >
                        <h4 className="font-medium text-base text-foreground/90">{group.title}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="text-base text-foreground/80 hover:text-foreground transition-colors truncate"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : loading ? (
              <CircularLoader label="Searching products & community..." size="lg" />
            ) : (
              /* Active Vector Search Results */
              <div className="space-y-4">
                <div className="flex items-center justify-between  pb-3">
                  <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">
                    Vector Results for &ldquo;{initialQuery}&rdquo;
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">
                    {activeTab === "all" && `${all.length} matching entities`}
                    {activeTab === "products" && `${products.length} products`}
                    {activeTab === "launches" && `${threads.length} threads`}
                    {activeTab === "users" && `${users.length} makers`}
                  </span>
                </div>

                {/* Combined ALL Tab Results */}
                {activeTab === "all" && (
                  all.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
                      No matching products, threads, or users found for &ldquo;{initialQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {all.map((result, idx) => {
                        if (result.type === "product") {
                          const p = result.item as Product;
                          return (
                            <div
                              key={`all-prod-${p.id}-${idx}`}
                              onClick={() => router.push(`/products/${getProductSlug(p.name)}`)}
                              className="p-4 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <img
                                  src={p.logo_url}
                                  alt={p.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-base text-foreground/90 group-hover:text-foreground transition-colors truncate">
                                      {p.name}
                                    </span>
                                    <span className="text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/25 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <Rocket className="w-2.5 h-2.5" /> Product
                                    </span>
                                    {p.country === "India" && (
                                      <span className="text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                                        🇮🇳 India
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-base text-foreground/80 truncate mt-0.5">{p.tagline}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-xl text-xs font-medium text-foreground/90 shrink-0">
                                <ArrowUp className="w-3.5 h-3.5 text-orange-500" />
                                <span>{p.upvotes_count}</span>
                              </div>
                            </div>
                          );
                        }

                        if (result.type === "thread") {
                          const t = result.item as Thread;
                          return (
                            <div
                              key={`all-thread-${t.id}-${idx}`}
                              onClick={() => router.push(`/threads/${getProductSlug(t.title)}`)}
                              className="p-4 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-medium uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                    {t.category}
                                  </span>
                                  <span className="text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <MessageSquare className="w-2.5 h-2.5" /> Thread
                                  </span>
                                </div>
                                <h3 className="font-medium text-base text-foreground/90 group-hover:text-foreground transition-colors mt-1.5 line-clamp-1">
                                  {t.title}
                                </h3>
                                <p className="text-base text-foreground/80 line-clamp-1 mt-0.5">{t.body}</p>
                              </div>
                              <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-xl text-xs font-medium text-foreground/90 shrink-0">
                                <ArrowUp className="w-3.5 h-3.5 text-orange-500" />
                                <span>{t.upvotes_count}</span>
                              </div>
                            </div>
                          );
                        }

                        if (result.type === "user") {
                          const u = result.item as Profile;
                          return (
                            <Link
                              key={`all-user-${u.id}-${idx}`}
                              href={u.username ? `/@${u.username}` : `/profile?id=${u.id}`}
                              className="p-4 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-all flex items-center justify-between gap-4 group"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <img
                                  src={u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                                  alt={u.full_name || "User"}
                                  className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium text-base text-foreground/90 group-hover:text-foreground transition-colors truncate">
                                      {u.full_name || u.username}
                                    </h4>
                                    <span className="text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/25 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <Users className="w-2.5 h-2.5" /> Maker
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-muted-foreground block truncate">@{u.username}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )
                )}

                {/* Products Tab Results */}
                {activeTab === "products" && (
                  products.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
                      No products found matching &ldquo;{initialQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.map((res) => {
                        const product = res.item;
                        return (
                          <div
                            key={product.id}
                            onClick={() => router.push(`/products/${getProductSlug(product.name)}`)}
                            className="p-4 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img
                                src={product.logo_url}
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm text-foreground group-hover:text-[#ff5733] transition-colors truncate">
                                    {product.name}
                                  </span>
                                  {product.country === "India" && (
                                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                                      🇮🇳 India
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{product.tagline}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground shrink-0">
                              <ArrowUp className="w-3.5 h-3.5 text-[#ff5733]" />
                              <span>{product.upvotes_count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* Launches / Discussions Tab Results */}
                {activeTab === "launches" && (
                  threads.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
                      No discussion threads found matching &ldquo;{initialQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {threads.map((res) => {
                        const thread = res.item;
                        return (
                          <div
                            key={thread.id}
                            onClick={() => router.push(`/threads/${getProductSlug(thread.title)}`)}
                            className="p-4 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-semibold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                  {thread.category}
                                </span>
                              </div>
                              <h3 className="font-medium text-base text-foreground/90 transition-colors mt-1.5 line-clamp-1">
                                {thread.title}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{thread.body}</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground shrink-0">
                              <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{thread.upvotes_count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* Users / Makers Tab Results */}
                {activeTab === "users" && (
                  users.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
                      No makers found matching &ldquo;{initialQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {users.map((res) => {
                        const user = res.item;
                        return (
                          <Link
                            key={user.id}
                            href={user.username ? `/@${user.username}` : `/profile?id=${user.id}`}
                            className="p-4 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                                alt={user.full_name || "User"}
                                className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="font-medium text-base text-foreground/90 transition-colors truncate">
                                  {user.full_name || user.username}
                                </h4>
                                <span className="text-[11px] text-muted-foreground block truncate">@{user.username}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pt-42 text-center text-xs text-muted-foreground">Loading vector search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
