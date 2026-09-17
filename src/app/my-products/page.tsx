"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Rocket,
  Settings,
  ArrowUp,
  MessageSquare,
  Edit,
  Clock,
  FileText,
  ChevronDown,
  HelpCircle,
  BookOpen,
  Plus
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  supabase,
  getProducts,
  getCachedProducts,
  Product,
  getProductSlug
} from "@/lib/supabase";
import { useAppSelector } from "@/lib/store";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";

type FilterCategory = "all" | "in-progress" | "drafts" | "scheduled" | "posted";

export default function MyProductsPage() {
  const router = useRouter();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const [user, setUser] = useState<any>(reduxUser);
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined' && reduxUser?.id) {
      const cached = getCachedProducts();
      return cached.filter(p => p.maker_id === reduxUser.id && !p.is_deleted);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && reduxUser?.id) {
      const cached = getCachedProducts();
      const userProds = cached.filter(p => p.maker_id === reduxUser.id && !p.is_deleted);
      return userProds.length === 0;
    }
    return true;
  });
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !reduxUser) {
        router.push("/");
      } else {
        const currentUser = session?.user || reduxUser;
        if (currentUser) {
          setUser(currentUser);
          const cached = getCachedProducts();
          const userProds = cached.filter(p => p.maker_id === currentUser.id && !p.is_deleted);
          if (userProds.length > 0) {
            setProducts(userProds);
            setIsLoading(false);
          }
          fetchMyProducts(currentUser.id);
        }
      }
    });
  }, [router, reduxUser]);

  const fetchMyProducts = async (uid: string) => {
    if (products.length === 0) {
      setIsLoading(true);
    }
    try {
      const res = await fetch(`/t/products?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.data || data.products;
        if (Array.isArray(list)) {
          setProducts(list.filter((p: any) => p.maker_id === uid && !p.is_deleted));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <CircularLoader label="Loading your launches..." size="lg" center={false} />
      </div>
    );
  }

  // Categories count
  const now = new Date();
  const liveCount = products.filter(p => p.status === "live" || !p.status || (p.status === "scheduled" && p.scheduled_for && new Date(p.scheduled_for) <= now)).length;
  const draftCount = products.filter(p => p.status === "draft").length;
  const scheduledCount = products.filter(p => p.status === "scheduled" && (!p.scheduled_for || new Date(p.scheduled_for) > now)).length;
  const inProgressCount = draftCount; // draft represents in progress
  const allCount = products.length;

  // Filter products based on selected tab
  const getFilteredProducts = () => {
    const today = new Date();
    switch (activeFilter) {
      case "in-progress":
      case "drafts":
        return products.filter(p => p.status === "draft");
      case "scheduled":
        return products.filter(p => p.status === "scheduled" && (!p.scheduled_for || new Date(p.scheduled_for) > today));
      case "posted":
        return products.filter(p => p.status === "live" || !p.status || (p.status === "scheduled" && p.scheduled_for && new Date(p.scheduled_for) <= today));
      case "all":
      default:
        return products;
    }
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#ff5733] selection:text-white transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full  bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <Link
            href="/new"
            className="flex items-center gap-1 px-4 py-2 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch a Product</span>
          </Link>
        </div>
      </header>

      {/* Grid Layout Container */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-8">

          {/* Launches Filter Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-3">Launches</h3>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer ${activeFilter === "all" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
              >
                <span className="flex items-center gap-2">📢 All</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-muted-foreground/10 rounded-full">{allCount}</span>
              </button>

              <button
                onClick={() => setActiveFilter("in-progress")}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer ${activeFilter === "in-progress" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
              >
                <span className="flex items-center gap-2">✍️ In Progress</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-muted-foreground/10 rounded-full">{inProgressCount}</span>
              </button>

              <button
                onClick={() => setActiveFilter("drafts")}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer ${activeFilter === "drafts" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
              >
                <span className="flex items-center gap-2">📝 Drafts</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-muted-foreground/10 rounded-full">{draftCount}</span>
              </button>

              <button
                onClick={() => setActiveFilter("scheduled")}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer ${activeFilter === "scheduled" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
              >
                <span className="flex items-center gap-2">⏰ Scheduled</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-muted-foreground/10 rounded-full">{scheduledCount}</span>
              </button>

              <button
                onClick={() => setActiveFilter("posted")}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer ${activeFilter === "posted" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
              >
                <span className="flex items-center gap-2">🚀 Posted</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-muted-foreground/10 rounded-full">{liveCount}</span>
              </button>
            </nav>
          </div>

          {/* Products Management List */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-3">Products</h3>
            {products.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-3">No products launched yet.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <img
                        src={product.logo_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80"}
                        alt=""
                        className="w-5 h-5 rounded-md object-cover border border-border flex-shrink-0"
                      />
                      <span className="text-base font-medium text-foreground/90 truncate">{product.name || "Untitled"}</span>
                    </div>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="flex items-center gap-0.5 px-2.5 py-1 bg-muted/60 hover:bg-muted text-xs font-medium rounded-lg border border-border transition-colors cursor-pointer">
                          <span>Manage</span>
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          className="z-50 min-w-[140px] overflow-hidden bg-card border border-border p-1.5 rounded-xl shadow-xl space-y-0.5"
                        >
                          <DropdownMenu.Item asChild>
                            <Link
                              href={`/my-products/${getProductSlug(product.name)}/settings`}
                              className="flex items-center w-full px-2.5 py-2 text-xs sm:text-sm font-medium text-foreground/90 hover:bg-muted rounded-lg cursor-pointer focus:outline-none transition-colors"
                            >
                              <Settings className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              <span>Settings</span>
                            </Link>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item asChild>
                            <Link
                              href={`/products/${getProductSlug(product.name)}`}
                              className="flex items-center w-full px-2.5 py-2 text-xs sm:text-sm font-medium text-foreground/90 hover:bg-muted rounded-lg cursor-pointer focus:outline-none transition-colors"
                            >
                              <Rocket className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              <span>View Launch</span>
                            </Link>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="space-y-2 border-t border-border pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-3">Need help?</h3>
            <div className="flex flex-col gap-1">
              <Link
                href="/guide"
                className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-foreground/80 hover:text-foreground hover:bg-muted/40 rounded-xl transition-all font-medium text-left"
              >
                <BookOpen className="w-4 h-4 text-orange-500" />
                <span>Launch Guide</span>
              </Link>
              <Link
                href="/faq"
                className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-foreground/80 hover:text-foreground hover:bg-muted/40 rounded-xl transition-all font-medium text-left"
              >
                <HelpCircle className="w-4 h-4 text-orange-500" />
                <span>FAQ</span>
              </Link>
            </div>
          </div>

        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6">

          <div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground/90 leading-tight">My products & launches</h1>
            <p className="text-base text-foreground/80 leading-relaxed mt-1">Manage and track your products, drafts, and scheduled releases.</p>
          </div>

          {/* List of launches */}
          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-card/25 border border-border/80 border-dashed rounded-3xl text-muted-foreground text-xs italic space-y-2">
                <div>No {activeFilter !== "all" ? activeFilter : "launches"} found.</div>
                <Link href="/new" className="inline-block text-[#ff5733] hover:underline font-medium not-italic">
                  Create a new launch draft now →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredProducts.map(product => {
                  const isDraft = product.status === "draft";
                  const isScheduled = product.status === "scheduled" && (!product.scheduled_for || new Date(product.scheduled_for) > new Date());
                  const isLive = product.status === "live" || !product.status || (product.status === "scheduled" && product.scheduled_for && new Date(product.scheduled_for) <= new Date());

                  return (
                    <div
                      key={product.id}
                      className="bg-card border border-border/80 hover:border-border p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={product.logo_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80"}
                          alt={product.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-border bg-muted flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-medium text-foreground/90">{product.name || "Untitled Draft"}</span>

                            {isLive && (
                              <span className="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Live
                              </span>
                            )}
                            {isScheduled && (
                              <span className="bg-amber-500/10 text-amber-500 text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Scheduled
                              </span>
                            )}
                            {isDraft && (
                              <span className="bg-orange-500/10 text-[#ff5733] text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Draft
                              </span>
                            )}
                          </div>

                          <p className="text-base text-foreground/80 line-clamp-1">{product.tagline || "No tagline added yet"}</p>

                          <div className="text-xs text-muted-foreground font-medium hidden sm:flex items-center gap-3">
                            <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
                            {isLive && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                <span className="flex items-center gap-0.5">
                                  <ArrowUp className="w-3 h-3 text-emerald-500" />
                                  {product.upvotes_count} upvotes
                                </span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                <span className="flex items-center gap-0.5">
                                  <MessageSquare className="w-3 h-3 text-[#ff5733]" />
                                  {product.comments_count} comments
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Launch Actions */}
                      <div className="flex items-center gap-2 sm:self-center self-end">
                        {isDraft ? (
                          <>
                            <Link
                              href={`/my-products/${getProductSlug(product.name)}/settings`}
                              className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer"
                            >
                              Continue editing
                            </Link>
                            <Link
                              href="/help"
                              className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer"
                            >
                              Get help
                            </Link>
                          </>
                        ) : isScheduled ? (
                          <>
                            <Link
                              href={`/products/${getProductSlug(product.name)}/pre-launch`}
                              className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer"
                            >
                              Pre-launch dashboard
                            </Link>
                            <Link
                              href={`/my-products/${getProductSlug(product.name)}/settings`}
                              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer"
                            >
                              Settings
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/my-products/${getProductSlug(product.name)}/settings`}
                              className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer"
                            >
                              Launch dashboard
                            </Link>
                            <Link
                              href={`/products/${getProductSlug(product.name)}`}
                              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer"
                            >
                              View
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>

      </div>

    </div>
  );
}
