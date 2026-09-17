"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Star, LayoutGrid, X, ChevronLeft, ChevronRight } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  supabase,
  getProductById,
  getCachedProduct,
  getCachedProducts,
  toggleUpvote,
  clearCache,
  getReviews,
  getAlternatives,
  getProductMembers,
  getProducts,
  getProductFollowers,
  getProductSlug,
  recordView,
  getProductShoutoutsGiven,
  isFollowingProduct,
  getProductThreads,
  getUserCollections,
  addProductToCollection,
  createCollection,
  calculateProductRank,
  Product,
  Review,
  AlternativeProduct,
  Profile,
  ProductShoutout,
  Collection,
} from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";
import {
  useProduct,
  useComments,
  useToggleUpvoteMutation,
} from "@/hooks/useDb";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";
import { ReportModal } from "@/components/ReportModal";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/components/WebSocketProvider";
import ReviewsTab from "./components/ReviewsTab";
import AlternativesTab from "./components/AlternativesTab";
import ForumsTab from "./components/ForumsTab";
import AnalyticsTab from "./components/AnalyticsTab";
import AIInsightsTab from "./components/AIInsightsTab";
import DemoVideoTab from "./components/DemoVideoTab";
import TeamTab from "./components/TeamTab";
import AwardsTab from "./components/AwardsTab";
import SidebarPanel from "./components/SidebarPanel";
import AdminBar from "./components/AdminBar";
import LaunchCelebration from "./components/LaunchCelebration";
import ProductMediaSection from "./components/ProductMediaSection";
import MakersSection from "./components/MakersSection";
import DiscussionSection from "./components/DiscussionSection";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getRefUrl(url: string): string {
  if (!url) return "";
  try {
    let checkUrl = url.trim();
    if (!/^https?:\/\//i.test(checkUrl)) {
      checkUrl = "https://" + checkUrl;
    }
    const parsed = new URL(checkUrl);
    parsed.searchParams.set("ref", "indihunt");
    return parsed.toString();
  } catch {
    const hasQuery = url.includes("?");
    return `${url}${hasQuery ? "&" : "?"}ref=indihunt`;
  }
}

function formatFollowerCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return count.toString();
}

// ============================================================================
// MAIN PRODUCT DETAIL PAGE
// ============================================================================

export default function ProductDetailPage({
  id,
  initialTab,
  initialProduct,
  initialAllProducts = [],
  initialReviews = [],
  initialAlternatives = [],
  initialRank = null,
  initialRankLabel = "Day Rank",
  initialIsTopHunt = false,
  initialPrevProd = null,
  initialNextProd = null,
  initialCohortProducts = []
}: {
  id: string;
  initialTab?: string;
  initialProduct: any;
  initialAllProducts?: Product[];
  initialReviews?: Review[];
  initialAlternatives?: AlternativeProduct[];
  initialRank?: number | null;
  initialRankLabel?: string;
  initialIsTopHunt?: boolean;
  initialPrevProd?: Product | null;
  initialNextProd?: Product | null;
  initialCohortProducts?: Product[];
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex flex-col pt-[72px] sm:pt-[78px]">
        <Navbar />
        <main className="flex-1 w-full min-h-[calc(100vh-84px)] flex items-center justify-center">
          <CircularLoader label="Loading product details..." size="lg" center={false} />
        </main>
      </div>
    }>
      <ProductDetailsContent
        id={id}
        initialTab={initialTab}
        initialProduct={initialProduct}
        initialAllProducts={initialAllProducts}
        initialReviews={initialReviews}
        initialAlternatives={initialAlternatives}
        initialRank={initialRank}
        initialRankLabel={initialRankLabel}
        initialIsTopHunt={initialIsTopHunt}
        initialPrevProd={initialPrevProd}
        initialNextProd={initialNextProd}
        initialCohortProducts={initialCohortProducts}
      />
    </Suspense>
  );
}


function ProductDetailsContent({
  id,
  initialTab,
  initialProduct,
  initialAllProducts = [],
  initialReviews = [],
  initialAlternatives = [],
  initialRank = null,
  initialRankLabel = "Day Rank",
  initialIsTopHunt = false,
  initialPrevProd = null,
  initialNextProd = null,
  initialCohortProducts = []
}: {
  id: string;
  initialTab?: string;
  initialProduct: any;
  initialAllProducts?: Product[];
  initialReviews?: Review[];
  initialAlternatives?: AlternativeProduct[];
  initialRank?: number | null;
  initialRankLabel?: string;
  initialIsTopHunt?: boolean;
  initialPrevProd?: Product | null;
  initialNextProd?: Product | null;
  initialCohortProducts?: Product[];
}) {
  // ==========================================================================
  // HOOKS & STATE
  // ==========================================================================

  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxProfile = useAppSelector((state) => state.auth.profile);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { subscribe, publish } = useWebSocket();

  const productId = id || (params.id as string);
  const isNewlyLaunched = searchParams?.get("launched") === "true";
  const highlightedCommentId = searchParams?.get("comment");

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!productId) return;
    const unsubscribe = subscribe(`product:${productId}`, "product_upvoted", (data: { productId: string; upvotes_count: number }) => {
      setProduct((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          upvotes_count: data.upvotes_count
        };
      });
    });
    return unsubscribe;
  }, [productId, subscribe]);
  const cachedProd = typeof window !== 'undefined' ? getCachedProduct(productId) : null;

  // TanStack Query Hooks
  const { data: queryProduct, isLoading: isQueryLoading, isPending } = useProduct(productId, user?.id, initialProduct);
  const toggleUpvoteMutation = useToggleUpvoteMutation();

  const [localProduct, setLocalProduct] = useState<any>(initialProduct || null);
  const product = localProduct || queryProduct || initialProduct || cachedProd;
  const isProductLoading = !product && (isQueryLoading || isPending);
  const { data: queryComments = [] } = useComments(product?.id || productId);
  const comments = queryComments;

  // ==========================================================================
  // TAB & UI STATE
  // ==========================================================================

  const initialResolvedTab = useMemo(() => {
    if (initialTab) return initialTab;
    if (typeof window !== "undefined") {
      if (window.location.pathname.endsWith("/alternatives")) return "Alternatives";
      const tabParam = searchParams?.get("tab");
      if (tabParam) {
        const found = ["Overview", "Reviews", "AI Insights", "Demo Video", "Alternatives", "Forum", "Team", "Awards", "Analytics"].find(
          t => t.toLowerCase() === tabParam.toLowerCase()
        );
        if (found) return found;
      }
    }
    return "Overview";
  }, [initialTab, searchParams]);

  const [activeSubTab, setActiveSubTab] = useState<string>(initialResolvedTab);

  const handleTabChange = (tab: string) => {
    setActiveSubTab(tab);
    if (typeof window !== "undefined") {
      const slug = getProductSlug(product?.name || id);
      if (tab === "Alternatives") {
        window.history.pushState(null, "", `/products/${slug}/alternatives`);
      } else if (window.location.pathname.endsWith("/alternatives")) {
        window.history.pushState(null, "", `/products/${slug}`);
      }
    }
  };
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [linkClicksCount, setLinkClicksCount] = useState<number>(0);
  const [showEmbedModal, setShowEmbedModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isShareCopied, setIsShareCopied] = useState<boolean>(false);

  // ==========================================================================
  // DATA STATE
  // ==========================================================================

  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>(initialAlternatives || []);
  const [forumThreads, setForumThreads] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [productFollowers, setProductFollowers] = useState<Profile[]>([]);
  const [shoutoutsGiven, setShoutoutsGiven] = useState<ProductShoutout[]>([]);
  const [allProductsList, setAllProductsList] = useState<Product[]>(() => {
    if (initialAllProducts && initialAllProducts.length > 0) {
      return initialAllProducts.filter((p: Product) => p.id !== productId);
    }
    if (typeof window !== "undefined") {
      const cached = getCachedProducts();
      if (cached && cached.length > 0) {
        return cached.filter((p: Product) => p.id !== productId);
      }
    }
    return [];
  });
  const [similarProducts, setSimilarProducts] = useState<Product[]>(() => {
    const target = initialProduct;
    const pool = initialAllProducts && initialAllProducts.length > 0 ? initialAllProducts : (typeof window !== "undefined" ? getCachedProducts() : []);
    if (!target || !pool || pool.length === 0) return [];
    const targetCategory = (target.category || "").trim().toLowerCase();
    const targetTags = new Set(
      ((target.tags || []) as any[])
        .filter((t: any): t is string => typeof t === "string")
        .map((t: string) => t.trim().toLowerCase())
    );

    const filtered = pool.filter(
      (p: Product) =>
        p &&
        p.id !== target.id &&
        p.id !== "prod-media-1" &&
        p.id !== "prod-media-2" &&
        p.id !== "prod-media-3" &&
        p.name !== "StreamPulse AI" &&
        p.name !== "VoxWave Studio" &&
        p.name !== "OmniPlay Pro" &&
        getProductSlug(p.name) !== getProductSlug(target.name)
    );

    const scored = filtered.map(p => {
      let score = 0;
      const pCat = (p.category || "").trim().toLowerCase();
      if (targetCategory && pCat && pCat === targetCategory) score += 5;
      if (p.tags && Array.isArray(p.tags)) {
        for (const t of p.tags) {
          if (typeof t === "string" && targetTags.has(t.trim().toLowerCase())) {
            score += 2;
          }
        }
      }
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score || (b.product.upvotes_count || 0) - (a.product.upvotes_count || 0));
    return scored.slice(0, 3).map(s => s.product);
  });
  const [recordedReviewViews, setRecordedReviewViews] = useState<Record<string, boolean>>({});

  // ==========================================================================
  // REPORT MODAL STATE
  // ==========================================================================

  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    targetId: string;
    targetType: "thread" | "comment" | "product";
    title?: string;
  }>({
    isOpen: false,
    targetId: "",
    targetType: "comment",
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  useEffect(() => {
    if (isNewlyLaunched) {
      const url = new URL(window.location.href);
      url.searchParams.delete("launched");
      window.history.replaceState({}, "", url.toString());
    }
  }, [isNewlyLaunched]);

  useEffect(() => {
    if (highlightedCommentId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`comment-${highlightedCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightedCommentId, comments]);

  const [userCollections, setUserCollections] = useState<Collection[]>([]);

  useEffect(() => {
    setUser(reduxUser);
    if (reduxUser?.id) {
      getUserCollections(reduxUser.id).then(setUserCollections);
    } else {
      setUserCollections([]);
    }
  }, [reduxUser]);


  useEffect(() => {
    if (product) {
      const key = `indihunt_product_clicks_${product.id}`;
      const stored = localStorage.getItem(key);
      const storedClicks = stored ? parseInt(stored, 10) : 0;
      const baseCalculatedClicks = Math.max(
        storedClicks,
        Math.round((product.upvotes_count || 0) * 1.8 + (product.comments_count || 0) * 1.2 + 5)
      );
      setLinkClicksCount(baseCalculatedClicks);
    }
  }, [product]);

  useEffect(() => {
    if (product && params.id !== getProductSlug(product.name)) {
      router.replace(`/products/${getProductSlug(product.name)}${isNewlyLaunched ? "?launched=true" : ""}`);
    }
  }, [product, params.id, router, isNewlyLaunched]);

  useEffect(() => {
    if (activeSubTab === "Reviews" && reviews.length > 0) {
      reviews.forEach((rev) => {
        if (!recordedReviewViews[rev.id]) {
          recordView(rev.id, 'review', user?.id || undefined);
          setRecordedReviewViews((prev) => ({ ...prev, [rev.id]: true }));
        }
      });
    }
  }, [activeSubTab, reviews, user, recordedReviewViews]);

  // Lazy-load secondary tabs on demand when active tab changes
  useEffect(() => {
    const targetProd = product || initialProduct;
    if (!targetProd) return;

    if (activeSubTab === "Forums" && forumThreads.length === 0) {
      getProductThreads(targetProd.id, user?.id).then(setForumThreads).catch(() => {});
    } else if (activeSubTab === "Team" && teamMembers.length === 0) {
      getProductMembers(targetProd.id).then(setTeamMembers).catch(() => {});
    } else if (activeSubTab === "Followers" && productFollowers.length === 0) {
      getProductFollowers(targetProd.id).then(setProductFollowers).catch(() => {});
    } else if (activeSubTab === "Shoutouts" && shoutoutsGiven.length === 0) {
      getProductShoutoutsGiven(targetProd.id).then(setShoutoutsGiven).catch(() => {});
    }
  }, [activeSubTab, product, initialProduct, user, forumThreads.length, teamMembers.length, productFollowers.length, shoutoutsGiven.length]);

  // Initial client mount: only fetch if initialProduct was not provided by SSR
  useEffect(() => {
    const targetProd = product || initialProduct;
    if (targetProd) {
      // Record view in background without blocking
      recordView(targetProd.id, 'product', user?.id || undefined);
      if (user?.id) {
        isFollowingProduct(targetProd.id, user.id).then(setIsFollowed).catch(() => {});
      }
    } else if (productId) {
      loadData();
    }
  }, [productId, user?.id]);

  // ==========================================================================
  // DATA LOADING (Fallback when SSR initial data is missing)
  // ==========================================================================

  const loadData = async (silent = false) => {
    const existing = queryProduct || initialProduct || cachedProd;
    if (existing && !localProduct) {
      setLocalProduct(existing);
    }

    const prod = await getProductById(productId, user?.id);
    if (!prod) return;
    setProduct({ ...prod });

    recordView(prod.id, 'product', user?.id || undefined);
    if (user?.id) {
      isFollowingProduct(prod.id, user.id).then(setIsFollowed).catch(() => {});
    }

    // Parallel fetch core fallback data
    const [revs, alts, allProds] = await Promise.all([
      getReviews(prod.id).catch(() => []),
      getAlternatives(prod.id, user?.id).catch(() => []),
      initialAllProducts && initialAllProducts.length > 0 ? Promise.resolve(initialAllProducts) : getProducts().catch(() => [])
    ]);

    setReviews(revs);
    setAlternatives(alts);

    if (allProds && allProds.length > 0) {
      const filteredProds = allProds.filter(
        (p: Product) =>
          p &&
          p.id !== prod.id &&
          p.id !== "prod-media-1" &&
          p.id !== "prod-media-2" &&
          p.id !== "prod-media-3" &&
          p.name !== "StreamPulse AI" &&
          p.name !== "VoxWave Studio" &&
          p.name !== "OmniPlay Pro" &&
          getProductSlug(p.name) !== getProductSlug(prod.name)
      );
      setAllProductsList(filteredProds);
    }
  };

  // Derive server-synchronized, reactive rank calculation
  const rankInfo = useMemo(() => {
    const target = product || initialProduct || cachedProd;
    if (!target) {
      return {
        rank: initialRank ?? null,
        rankLabel: initialRankLabel || "Day Rank",
        isTopHunt: !!initialIsTopHunt,
        cohortProducts: initialCohortProducts || [],
        prevProd: initialPrevProd || null,
        nextProd: initialNextProd || null,
      };
    }
    const sourcePool = (allProductsList && allProductsList.length > 0)
      ? allProductsList
      : (initialAllProducts && initialAllProducts.length > 0)
        ? initialAllProducts
        : [];

    const otherProds = sourcePool.filter(p => p.id !== target.id && getProductSlug(p.name) !== getProductSlug(target.name));
    const pool = [target, ...otherProds];

    return calculateProductRank(target, pool);
  }, [product, initialProduct, cachedProd, allProductsList, initialAllProducts, initialRank, initialRankLabel, initialIsTopHunt, initialCohortProducts, initialPrevProd, initialNextProd]);

  const dailyRank = rankInfo.rank;
  const rankLabel = rankInfo.rankLabel;
  const isTodaysTopHunt = rankInfo.isTopHunt;
  const cohortProducts = rankInfo.cohortProducts;
  const prevProd = rankInfo.prevProd;
  const nextProd = rankInfo.nextProd;

  const setProduct = (updatedProduct: any) => {
    setLocalProduct(updatedProduct);
    const activeUserId = user?.id || reduxUser?.id || reduxProfile?.id;
    if (activeUserId) {
      queryClient.setQueryData(["product", productId, activeUserId], updatedProduct);
    }
    queryClient.setQueryData(["product", productId, "guest"], updatedProduct);
    queryClient.setQueryData(["product", productId], updatedProduct);
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleVote = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const activeUser = user || reduxUser || reduxProfile;
    if (!activeUser) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    if (!product) return;

    const isCurrentlyUpvoted = !!product.has_upvoted;
    const newCount = isCurrentlyUpvoted
      ? Math.max(0, (product.upvotes_count || 1) - 1)
      : (product.upvotes_count || 0) + 1;

    // Optimistically update product state in component and Query cache immediately
    const optimisticProduct = {
      ...product,
      has_upvoted: !isCurrentlyUpvoted,
      upvotes_count: newCount,
    };

    setProduct(optimisticProduct);
    clearCache();

    toggleUpvoteMutation.mutate(
      { productId: product.id, userId: activeUser.id },
      {
        onSuccess: (res) => {
          if (res && typeof res.upvotes_count === 'number') {
            setProduct({
              ...optimisticProduct,
              upvotes_count: res.upvotes_count,
            });
            // Publish the upvote event to both global feed and product room
            publish("feed", "product_upvoted", { productId: product.id, upvotes_count: res.upvotes_count });
            publish(`product:${product.id}`, "product_upvoted", { productId: product.id, upvotes_count: res.upvotes_count });
          }
          loadData(true);
        },
        onError: () => {
          // Revert optimistic update on failure
          setProduct(product);
        }
      }
    );
  };

  const handleVisitWebsiteClick = () => {
    if (!product) return;
    const newCount = linkClicksCount + 1;
    setLinkClicksCount(newCount);
    localStorage.setItem(`indihunt_product_clicks_${product.id}`, newCount.toString());
  };

  // ==========================================================================
  // DERIVED VALUES
  // ==========================================================================

  const makerFirstCommentId = useMemo(() => {
    if (!product?.maker_id || comments.length === 0) return null;
    const makerTopLevel = comments
      .filter((c: any) => c.user_id === product.maker_id && !c.parent_id)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return makerTopLevel.length > 0 ? makerTopLevel[0].id : null;
  }, [comments, product?.maker_id]);

  const isLoading = isProductLoading || (!product && (isQueryLoading || isPending));
  const screenshots = product?.screenshots ?? [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=450&q=80"
  ];
  const isScheduled = !!(product?.status === 'scheduled' && product?.scheduled_for && new Date(product.scheduled_for) > new Date());
  const currentUserId = user?.id || reduxUser?.id || reduxProfile?.id;
  const isOwner = !!(currentUserId && product?.maker_id && currentUserId === product.maker_id);

  // Calculate awards
  const productAwards = useMemo(() => {
    const upvotesCount = product?.upvotes_count || 0;
    const awards: any[] = [];

    if (upvotesCount >= 100) {
      awards.push(
        {
          type: "Orbit Awards",
          title: "The People's Champ Award",
          subtitle: product?.name || "Product",
          tagline: product?.tagline || "AI Dictation App",
          date: "Winter 2025",
          rank: "P",
          iconType: "orbit"
        },
        {
          type: "Launch Awards",
          title: "Launch of the Day",
          subtitle: `${product?.name} for Android`,
          date: "February 23rd, 2026",
          rank: "2",
          iconType: "day"
        },
        {
          type: "Launch Awards",
          title: "Launch of the Day",
          subtitle: `${product?.name} for iOS`,
          date: "June 3rd, 2025",
          rank: "2",
          iconType: "day"
        },
        {
          type: "Launch Awards",
          title: "Launch of the Week",
          subtitle: `${product?.name} for Windows`,
          date: "March 12th, 2025",
          rank: "4",
          iconType: "week"
        }
      );
    } else if (upvotesCount >= 50) {
      awards.push(
        {
          type: "Launch Awards",
          title: "Launch of the Day",
          subtitle: `${product?.name} for Android`,
          date: "February 23rd, 2026",
          rank: "3",
          iconType: "day"
        },
        {
          type: "Launch Awards",
          title: "Launch of the Day",
          subtitle: `${product?.name} for iOS`,
          date: "June 3rd, 2025",
          rank: "4",
          iconType: "day"
        }
      );
    } else if (upvotesCount >= 20) {
      awards.push({
        type: "Launch Awards",
        title: "Launch of the Day",
        subtitle: product?.name || "Product",
        date: "September 30th, 2024",
        rank: "5",
        iconType: "day"
      });
    } else if (upvotesCount >= 5) {
      awards.push({
        type: "Launch Awards",
        title: "Launch of the Day",
        subtitle: product?.name || "Product",
        date: "September 30th, 2024",
        rank: "15",
        iconType: "day"
      });
    }

    return awards;
  }, [product]);

  // ==========================================================================
  // META TAGS
  // ==========================================================================

  const firstGalleryImage = product
    ? (product.screenshots?.[0] || product.logo_url || "https://indihunt.in/og-image.webp")
    : "https://indihunt.in/og-image.webp";

  useEffect(() => {
    if (!product) return;
    const title = `${product.name} — ${product.tagline}`;
    const description = product.description || product.tagline;
    const url = `${window.location.origin}/products/${getProductSlug(product.name)}`;

    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", firstGalleryImage);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", firstGalleryImage);
  }, [product, firstGalleryImage]);

  // ==========================================================================
  // LOADING & ERROR STATES
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col pt-[72px] sm:pt-[78px]">
        <Navbar />
        <main className="flex-1 w-full min-h-[calc(100vh-84px)] flex items-center justify-center">
          <CircularLoader label="Loading product details..." size="lg" center={false} />
        </main>
      </div>
    );
  }


  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 pt-[72px] sm:pt-[78px]">
        <Navbar />
        <span className="text-sm font-medium text-muted-foreground">Product not found.</span>
        <Link href="/" className="px-4 py-2 bg-muted rounded-xl text-xs font-semibold">Back to Home</Link>
      </div>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden transition-colors duration-300 pt-[72px] sm:pt-[78px]">
      <Navbar />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://indihunt.in" },
              { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://indihunt.in/best-products" },
              { "@type": "ListItem", "position": 3, "name": product.name, "item": `https://indihunt.in/products/${getProductSlug(product.name)}` }
            ]
          })
        }}
      />

      {/* Admin Bar & Launch Celebration */}
      {isNewlyLaunched && <LaunchCelebration />}
      <AdminBar
        product={product}
        isOwner={isOwner}
        isScheduled={isScheduled}
        setActiveSubTab={setActiveSubTab}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[20px] pb-28 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Left Column */}
          <div className="lg:col-span-9 space-y-4">
            {/* Product Header */}
            <ProductHeader
              product={product}
              isScheduled={isScheduled}
              isTodaysTopHunt={isTodaysTopHunt}
              reviews={reviews}
              productFollowers={productFollowers}
              linkClicksCount={linkClicksCount}
              onVisitWebsite={handleVisitWebsiteClick}
            />

            {/* Pitch / Description */}
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Pitch / Description</h3>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed py-2 font-normal">
                {product.description || "No product pitch details provided."}
              </p>
            </div>

            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeSubTab}
              onTabChange={handleTabChange}
              product={product}
              user={user}
              onReport={() => {
                if (!user) { dispatch(setAuthModalOpen(true)); return; }
                setReportModalState({
                  isOpen: true,
                  targetId: product.id,
                  targetType: "product",
                  title: "Report Product",
                });
              }}
              onShare={() => setShowShareModal(true)}
            />

            {/* Tab Content */}
            {activeSubTab === "Overview" && (
              <div className="space-y-8">
                <ProductMediaSection product={product} screenshots={screenshots} />
                <MakersSection product={product} teamMembers={teamMembers} shoutoutsGiven={shoutoutsGiven} />
                <DiscussionSection
                  product={product}
                  comments={comments}
                  user={user}
                  setReportModalState={setReportModalState}
                />
              </div>
            )}

            {activeSubTab === "Reviews" && (
              <ReviewsTab
                reviews={reviews}
                productId={productId}
                user={user}
                setReportModalState={setReportModalState}
              />
            )}

            {activeSubTab === "AI Insights" && (
              <AIInsightsTab product={product} setProduct={setProduct} />
            )}

            {activeSubTab === "Demo Video" && (
              <DemoVideoTab product={product} />
            )}

            {activeSubTab === "Alternatives" && (
              <AlternativesTab
                alternatives={alternatives}
                setAlternatives={setAlternatives}
                allProductsList={allProductsList}
                productId={productId}
                product={product}
                user={user}
              />
            )}

            {activeSubTab === "Forum" && (
              <ForumsTab
                productId={productId}
                product={product}
                user={user}
                forumThreads={forumThreads}
                setForumThreads={setForumThreads}
                setReportModalState={setReportModalState}
              />
            )}

            {activeSubTab === "Team" && (
              <TeamTab
                product={product}
                user={user}
                teamMembers={teamMembers}
                setTeamMembers={setTeamMembers}
              />
            )}

            {activeSubTab === "Awards" && (
              <AwardsTab product={product} productAwards={productAwards} />
            )}

            {activeSubTab === "Analytics" && (
              <AnalyticsTab
                product={product}
                reviews={reviews}
                comments={comments}
                linkClicksCount={linkClicksCount}
              />
            )}
          </div>

          {/* Sidebar */}
          <SidebarPanel
            product={product}
            dailyRank={dailyRank}
            rankLabel={rankLabel}
            isScheduled={isScheduled}
            handleVote={handleVote}
            user={user}
            isFollowed={isFollowed}
            setIsFollowed={setIsFollowed}
            productFollowers={productFollowers}
            setProductFollowers={setProductFollowers}
            setShowShareModal={setShowShareModal}
            setShowEmbedModal={setShowEmbedModal}
            setActiveSubTab={setActiveSubTab}
            productAwards={productAwards}
            similarProducts={similarProducts}
            userCollections={userCollections}
            onAddToCollection={async (colId: string) => {
              if (!user?.id || !product?.id) return;
              await addProductToCollection(colId, product.id, user.id);
              const updated = await getUserCollections(user.id);
              setUserCollections(updated);
            }}
            onCreateCollectionAndAdd={async (name: string, desc: string) => {
              if (!user?.id || !product?.id) return;
              const newCol = await createCollection(name, desc, user.id);
              if (newCol) {
                await addProductToCollection(newCol.id, product.id, user.id);
                const updated = await getUserCollections(user.id);
                setUserCollections(updated);
              }
            }}
            prevProd={prevProd}
            nextProd={nextProd}
          />
        </div>
      </main>

      {/* Modals */}
      <EmbedModal
        isOpen={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        product={product}
        dailyRank={dailyRank}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        product={product}
        isCopied={isShareCopied}
        onCopy={() => {
          const baseUrl = `${window.location.origin}/products/${getProductSlug(product.name)}`;
          const shareUrl = `${baseUrl}?utm_source=twitter&utm_medium=social`;
          navigator.clipboard.writeText(shareUrl);
          setIsShareCopied(true);
          setTimeout(() => setIsShareCopied(false), 2000);
        }}
      />

      <ReportModal
        isOpen={reportModalState.isOpen}
        onClose={() => setReportModalState(prev => ({ ...prev, isOpen: false }))}
        targetId={reportModalState.targetId}
        targetType={reportModalState.targetType}
        userId={user?.id || null}
        title={reportModalState.title}
      />

      {/* Mobile Fixed Bottom Upvote & Rank Bar (Only visible in Mobile View) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 p-3 shadow-xl sm:hidden animate-in slide-in-from-bottom duration-300">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between items-center px-1">
            <div>
              {dailyRank !== null ? (
                <span className="text-xl font-extrabold text-foreground block tracking-tight">#{dailyRank}</span>
              ) : (
                <div className="h-6 w-10 bg-muted/60 animate-pulse rounded-md my-0.5" />
              )}
              <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">{rankLabel}</span>
            </div>

            {/* Ranking toggle */}
            <div className="flex items-center gap-1 border border-border/80 bg-background/60 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => prevProd && router.push(`/products/${getProductSlug(prevProd.name)}`)}
                disabled={!prevProd}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={prevProd ? `Previous: ${prevProd.name}` : "No previous product"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => nextProd && router.push(`/products/${getProductSlug(nextProd.name)}`)}
                disabled={!nextProd}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={nextProd ? `Next: ${nextProd.name}` : "No next product"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upvote button */}
          <button
            type="button"
            onClick={isScheduled ? undefined : handleVote}
            disabled={isScheduled}
            className={`w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-full font-extrabold text-base transition-all active:scale-[0.98] cursor-pointer shadow-lg ${isScheduled
              ? "bg-muted border border-border text-muted-foreground/60 cursor-not-allowed"
              : product.has_upvoted
                ? "bg-white dark:bg-card border-2 border-[#ff5733] text-[#ff5733] shadow-md shadow-orange-500/10"
                : "bg-[#ff5733] text-white hover:bg-[#e64a19] shadow-orange-500/25"
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 16 16"
              className={`w-4.5 h-4.5 stroke-[2px] transition-all duration-300 ${product.has_upvoted
                ? "fill-[#ff5733] stroke-[#ff5733]"
                : "fill-white dark:fill-transparent stroke-current"
                }`}
            >
              <path d="M6.579 3.467c.71-1.067 2.132-1.067 2.842 0L12.975 8.8c.878 1.318.043 3.2-1.422 3.2H4.447c-1.464 0-2.3-1.882-1.422-3.2z" />
            </svg>
            <span>{isScheduled ? "Upvoting Disabled" : `${product.has_upvoted ? "Upvoted" : "Upvote"} • ${product.upvotes_count} points`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function getLaunchBadgeInfo(product: Product, isScheduled: boolean) {
  if (isScheduled) {
    return {
      text: "Scheduled",
      className: "text-xs font-medium bg-gradient-to-r from-[#ff4d79] to-[#ff6a00] text-white px-3 py-1 rounded-full shadow-xs flex items-center justify-center"
    };
  }

  const now = new Date();
  const launchDate = product.scheduled_for
    ? new Date(product.scheduled_for)
    : new Date(product.created_at || now);

  if (isNaN(launchDate.getTime())) return null;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const badgeClass = "text-xs font-medium bg-gradient-to-r from-[#ff4d79] to-[#ff6a00] text-white px-3 py-1 rounded-full shadow-xs flex items-center justify-center";

  if (launchDate >= startOfToday) {
    return { text: "Launched Today", className: badgeClass };
  } else if (launchDate >= startOfYesterday) {
    return { text: "Launched Yesterday", className: badgeClass };
  } else if (launchDate >= startOfWeek) {
    return { text: "Launched This Week", className: badgeClass };
  } else if (launchDate >= startOfMonth) {
    return { text: "Launched This Month", className: badgeClass };
  } else {
    // Products from previous month or older -> automatically remove tag
    return null;
  }
}

// Product Header Component
function ProductHeader({
  product,
  isScheduled,
  isTodaysTopHunt,
  reviews,
  productFollowers,
  linkClicksCount,
  onVisitWebsite,
}: {
  product: Product;
  isScheduled: boolean;
  isTodaysTopHunt: boolean;
  reviews: Review[];
  productFollowers: Profile[];
  linkClicksCount: number;
  onVisitWebsite: () => void;
}) {
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const launchBadge = getLaunchBadgeInfo(product, isScheduled);

  return (
    <div className={` py-1.5 transition-colors duration-300 ${isTodaysTopHunt
      ? "bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-500/20 dark:via-orange-950/20 dark:to-card/25"
      : "bg-card/10"
      }`}>
      <div className="max-w-6xl mx-auto px-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0 flex items-center justify-center">
              <img src={product.logo_url} alt={product.name} className="w-14 h-14 object-cover" />
            </div>

            <div>
              {/* Title & Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">{product.name}</h1>
                {launchBadge && (
                  <span className={launchBadge.className}>
                    {launchBadge.text}
                  </span>
                )}
                {product.country === "India" && (
                  <span className="text-xs font-semibold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    🇮🇳 Built in India
                  </span>
                )}
              </div>

              {/* Tagline */}
              <p className="text-sm sm:text-base text-foreground/85 mt-1 font-normal leading-relaxed">{product.tagline}</p>

              {/* Stats */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-2 flex-wrap font-normal">
                <div className="flex items-center gap-1 text-amber-500 font-medium">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{averageRating}</span>
                </div>
                <span className="text-muted-foreground/60">•</span>
                <span>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="font-normal text-foreground/90">
                  {formatFollowerCount(productFollowers.length)} followers
                </span>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {product.tags.map((tag, idx) => (
                    <React.Fragment key={tag}>
                      {idx > 0 && <span className="text-muted-foreground/60 text-xs select-none">•</span>}
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/60">
                        <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground/80" />
                        <span>{tag}</span>
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <LayoutGrid className="w-4 h-4 text-muted-foreground/80" />
                  <span>Developer Tools</span>
                  <span className="w-1 h-1 rounded-full bg-border"></span>
                  <span>SaaS</span>
                </div>
              )}
            </div>
          </div>

          {/* Visit Website Button */}
          <a
            href={getRefUrl(product.website_url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onVisitWebsite}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-card hover:bg-muted border border-border text-foreground text-xs sm:text-sm font-medium transition-colors shadow-sm"
          >
            <span>Visit website</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Tab Navigation Component
function TabNavigation({
  activeTab,
  onTabChange,
  product,
  user,
  onReport,
  onShare,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  product: Product;
  user: any;
  onReport: () => void;
  onShare: () => void;
}) {
  const tabs = ["Overview", "Reviews", "AI Insights", "Demo Video", "Alternatives", "Forum", "Team", "Awards", "Analytics"];

  return (
    <div className="flex  py-2 gap-2 overflow-x-auto items-center justify-between no-scrollbar">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${activeTab === tab
              ? "bg-slate-200 dark:bg-slate-800 text-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-foreground"
              }`}
          >
            {tab}
          </button>
        ))}

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 focus:outline-none text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-foreground">
              <span>More</span>
              <span className="text-[10px]">▼</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={5}
              className="z-50 w-40 rounded-xl border border-border bg-card shadow-xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <DropdownMenu.Item asChild>
                <Link
                  href={`/products/${getProductSlug(product.name)}/embed`}
                  className="block w-full text-left px-4 py-2 text-xs font-medium hover:bg-muted text-foreground transition-colors cursor-pointer focus:outline-none"
                >
                  Embeds
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <button
                  onClick={onShare}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-muted text-foreground transition-colors border-t border-border/45 cursor-pointer focus:outline-none"
                >
                  Share
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <button
                  onClick={onReport}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-muted text-red-500 transition-colors border-t border-border/45 cursor-pointer focus:outline-none"
                >
                  Report issue
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

// Embed Modal Component
function EmbedModal({ isOpen, onClose, product, dailyRank }: { isOpen: boolean; onClose: () => void; product: Product; dailyRank?: number | null }) {
  if (!isOpen) return null;

  const productSlug = getProductSlug(product.name);
  const rankQuery = dailyRank ? `&rank=${dailyRank}` : "";
  const embedCode = `<a href="${window.location.origin}/products/${productSlug}" target="_blank"><img src="${window.location.origin}/t/embed?id=${productSlug}${rankQuery}&style=classic" alt="${product.name} on IndiHunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-foreground">Product Embed Badge</h3>
          <Link
            href={`/products/${getProductSlug(product.name)}/embed`}
            className="text-xs text-orange-500 hover:underline flex items-center gap-1 font-medium"
          >
            <span>All badge styles</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">Show off your launch on your own website! Copy the HTML snippet below to embed the #{dailyRank || 1} rank badge.</p>

        <div className="bg-muted/40 border border-border p-4 rounded-2xl flex justify-center items-center">
          <img
            src={`/t/embed?id=${product.id}${rankQuery}`}
            alt={`${product.name} #${dailyRank || 1} Award Badge`}
            width={250}
            height={54}
            className="object-contain max-w-full"
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">HTML Code</span>
          <div className="relative">
            <textarea
              readOnly
              value={embedCode}
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[10px] font-mono text-muted-foreground resize-none focus:outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                alert("HTML badge code copied!");
              }}
              className="absolute right-2 bottom-3 bg-foreground text-background font-semibold text-[9px] px-2 py-1 rounded hover:bg-foreground/80 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/40">
          <button
            onClick={onClose}
            className="bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Share Modal Component
function ShareModal({
  isOpen,
  onClose,
  product,
  isCopied,
  onCopy,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  isCopied: boolean;
  onCopy: () => void;
}) {
  if (!isOpen) return null;

  const baseUrl = `${window.location.origin}/products/${getProductSlug(product.name)}`;
  const shareUrl = `${baseUrl}?utm_source=twitter&utm_medium=social`;
  const postText = `${product.name}: ${product.tagline || 'Check it out on IndiHunt!'} ${shareUrl}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border/80 shadow-md flex items-center justify-center">
            <img src={product.logo_url} alt={product.name} className="w-full h-full object-cover" />
          </div>

          {/* Title */}
          <div className="space-y-1.5 px-2">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
              Share to get upvotes for {product.name}
            </h3>
            <p className="text-xs text-muted-foreground font-normal flex items-center justify-center gap-1">
              <span>Discover. Launch. Grow. Together.</span>
              <span>⭐</span>
            </p>
          </div>

          {/* Social Buttons */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 flex items-center justify-center transition-all border border-sky-500/20 hover:scale-105"
              title="Share on X / Twitter"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${baseUrl}?utm_source=linkedin&utm_medium=social`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 flex items-center justify-center transition-all border border-blue-600/20 hover:scale-105"
              title="Share on LinkedIn"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${product.name}: ${product.tagline || ''}\n${baseUrl}?utm_source=whatsapp&utm_medium=social`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center transition-all border border-emerald-500/20 hover:scale-105"
              title="Share on WhatsApp"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.196 8.196 0 0 1-5.82 2.42c-1.48 0-2.93-.39-4.22-1.12l-.3-.17-3.13.82.83-3.05-.2-.32a8.19 8.19 0 0 1-1.25-4.39c0-4.54 3.7-8.25 8.27-8.25z" />
              </svg>
            </a>
          </div>

          {/* Copy Link */}
          <div className="text-left space-y-1.5 pt-2">
            <label className="text-xs font-medium text-muted-foreground block">or copy link</label>
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={onCopy}
                className="px-4 py-2 bg-card hover:bg-muted border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-xs hover:scale-102 active:scale-98 flex-shrink-0 cursor-pointer"
              >
                {isCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}