"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Product,
  Thread,
  supabase,
  signOut,
  getUserProfile,
  updateUserProfile,
  getBillboardAds,
  DEFAULT_BILLBOARDS,
  BillboardAd,
  getTopHuntersData,
  compareProductsForRanking,
  isIndianPreLaunchWindow,
  isGlobalPreLaunchWindow,
  getISTStartOfDay,
  getProductSlug,
  Hunter,
} from "@/lib/supabase";
import {
  useProducts,
  usePromotedProducts,
  useThreads,
  useToggleUpvoteMutation,
} from "@/hooks/useDb";
import {
  useAppDispatch,
  useAppSelector,
  setAuthModalOpen,
  setProfile as setReduxProfile,
} from "@/lib/store";
import Navbar from "@/components/Navbar";
import { queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/components/WebSocketProvider";
import { secureApiFetch } from "@/lib/api/client";

import {
  PaymentBanner,
  PaymentBannerState,
  FeedHeader,
  FeedSection,
  FeedSectionData,
  HomeSidebar,
  OnboardingModal,
  BigSearchModal,
  InviteReviewModal,
} from "@/components/home";

interface HomePageClientProps {
  initialProducts?: Product[];
  initialThreads?: Thread[];
  initialTopHunters?: Hunter[];
  initialBillboardAds?: BillboardAd[];
  initialPromotedProducts?: Product[];
  initialPulseStats?: {
    activeMakers: number;
    upvotesCount: number;
    categoriesCount: number;
    productsCount: number;
    citiesCount?: number;
    monthlyVisitors?: number;
    spotlightMaker?: any;
  };
  initialDateBoundaries?: {
    startOfToday: string;
    startOfYesterday: string;
    oneWeekAgo: string;
    oneMonthAgo: string;
  };
}

export default function HomePageClient({
  initialProducts = [],
  initialThreads = [],
  initialTopHunters = [],
  initialBillboardAds = [],
  initialPromotedProducts = [],
  initialPulseStats,
  initialDateBoundaries,
}: HomePageClientProps) {
  const dispatch = useAppDispatch();
  const { subscribe, publish } = useWebSocket();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currentUserId = currentUser?.id || null;
  const [profile, setProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time upvotes subscription (deferred to keep first paint sub-100ms)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const timer = setTimeout(() => {
      unsubscribe = subscribe(
        "feed",
        "product_upvoted",
        (data: { productId: string; upvotes_count: number }) => {
          queryClient.setQueriesData(
            { queryKey: ["products"] },
            (old: any) => {
              if (!Array.isArray(old)) return old;
              return old.map((p) =>
                p.id === data.productId || (p.name && getProductSlug(p.name).toLowerCase() === data.productId.toLowerCase())
                  ? { ...p, upvotes_count: data.upvotes_count }
                  : p
              );
            }
          );
        }
      );
    }, 400);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe]);

  // Sync auth state & onboarding from global Redux store
  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxProfile = useAppSelector((state) => state.auth.profile);
  const effectiveUserId = reduxUser?.id || currentUser?.id || null;

  useEffect(() => {
    setCurrentUser(reduxUser);
    setProfile(reduxProfile);
    if (reduxProfile) {
      setOnboardName(
        reduxProfile.full_name ||
          reduxUser?.user_metadata?.full_name ||
          reduxUser?.user_metadata?.name ||
          ""
      );
      setOnboardUsername(
        reduxProfile.username ||
          reduxUser?.user_metadata?.username ||
          reduxUser?.user_metadata?.user_name ||
          reduxUser?.email?.split("@")[0] ||
          ""
      );
      setOnboardLinkedIn(reduxProfile.linkedin_url || "");
      setOnboardTwitter(reduxProfile.twitter_url || "");
      setOnboardHeadline(reduxProfile.headline || "");

      if (reduxProfile.onboarding_completed === false) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } else if (!reduxUser) {
      setShowOnboarding(false);
    }
  }, [reduxUser, reduxProfile]);

  // TanStack Query Hooks (Hydrated with server initialData, staleTime: 5 mins)
  const { data: products = initialProducts, refetch: refetchProducts } =
    useProducts(effectiveUserId || undefined, initialProducts);
  const { data: threads = initialThreads, refetch: refetchThreads } =
    useThreads(effectiveUserId || undefined, initialThreads);

  const toggleUpvoteMutation = useToggleUpvoteMutation();

  // Feed & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [activeFeedTab, setActiveFeedTab] = useState<"upcoming" | "all">("all");
  const [upcomingLimit, setUpcomingLimit] = useState<number>(20);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [isPreLaunchWindow, setIsPreLaunchWindow] = useState<boolean>(false);

  const [topHunters, setTopHunters] = useState<Hunter[]>(
    initialTopHunters.slice(0, 5)
  );
  const [selectedBillboardAds, setSelectedBillboardAds] = useState<
    BillboardAd[]
  >(() => {
    if (initialBillboardAds && initialBillboardAds.length > 0) {
      return [...initialBillboardAds];
    }
    return [...DEFAULT_BILLBOARDS];
  });

  // Payment Status Banner state from checkout redirect
  const [paymentBanner, setPaymentBanner] =
    useState<PaymentBannerState | null>(null);

  // Invite Review Modal
  const [inviteReviewProduct, setInviteReviewProduct] =
    useState<Product | null>(null);

  // Tech Pulse State
  const [pulseActiveMakers, setPulseActiveMakers] = useState<number>(() => {
    if (initialPulseStats?.activeMakers) return initialPulseStats.activeMakers;
    if (initialProducts.length > 0)
      return new Set(
        initialProducts.map((p) => p.maker_id || p.maker?.id).filter(Boolean)
      ).size;
    return 0;
  });
  const [pulseUpvotes, setPulseUpvotes] = useState<number>(() => {
    if (initialPulseStats?.upvotesCount) return initialPulseStats.upvotesCount;
    if (initialProducts.length > 0)
      return initialProducts.reduce(
        (sum, p) => sum + (p.upvotes_count || 0),
        0
      );
    return 0;
  });
  const [pulseProductsCount, setPulseProductsCount] = useState<number>(() => {
    if (initialPulseStats?.productsCount) return initialPulseStats.productsCount;
    return initialProducts.length;
  });
  const [pulseCategoriesCount, setPulseCategoriesCount] = useState<number>(
    () => {
      if (initialPulseStats?.categoriesCount)
        return initialPulseStats.categoriesCount;
      return 14;
    }
  );

  // Onboarding Form States
  const [onboardName, setOnboardName] = useState("");
  const [onboardUsername, setOnboardUsername] = useState("");
  const [onboardLinkedIn, setOnboardLinkedIn] = useState("");
  const [onboardTwitter, setOnboardTwitter] = useState("");
  const [onboardHeadline, setOnboardHeadline] = useState("");
  const [onboardNewsletterLeaderboard, setOnboardNewsletterLeaderboard] =
    useState(true);
  const [onboardNewsletterRoundup, setOnboardNewsletterRoundup] = useState(true);
  const [onboardNewsletterFrontier, setOnboardNewsletterFrontier] =
    useState(true);
  const [onboardAgeCheck, setOnboardAgeCheck] = useState(false);

  // Check payment return params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus =
        urlParams.get("payment_status") || urlParams.get("status");
      const isFailed =
        paymentStatus === "failed" ||
        paymentStatus === "cancelled" ||
        paymentStatus === "error";
      const isSuccess =
        paymentStatus === "success" ||
        paymentStatus === "succeeded" ||
        paymentStatus === "paid";

      if (isSuccess) {
        const paymentId =
          urlParams.get("payment_id") ||
          urlParams.get("paymentId") ||
          urlParams.get("id") ||
          `dodo_${Date.now()}`;
        const campaignId =
          urlParams.get("campaign_id") || urlParams.get("campaignId");
        const productId =
          urlParams.get("product_id") || urlParams.get("productId");
        const userId = urlParams.get("user_id") || urlParams.get("userId");
        const rawAmount =
          urlParams.get("amount") || urlParams.get("total_amount");

        let pendingCampaignData: any = {};
        try {
          const stored = sessionStorage.getItem("ih_pending_ad_campaign");
          if (stored) pendingCampaignData = JSON.parse(stored);
        } catch {}

        const verifyPayload = {
          paymentId,
          campaignId: campaignId || pendingCampaignData.campaignId,
          productId: productId || pendingCampaignData.productId,
          userId: userId || pendingCampaignData.userId,
          amount: rawAmount
            ? parseFloat(rawAmount)
            : pendingCampaignData.amount || 1199,
          name: pendingCampaignData.name || "Sponsored Ad Campaign",
          headline: pendingCampaignData.headline || "Featured on IndiHunt",
          description:
            pendingCampaignData.description ||
            "Discover indie software on IndiHunt.",
          cta_text: pendingCampaignData.cta_text || "Visit Product",
          destination_url: pendingCampaignData.destination_url || "",
          userEmail: pendingCampaignData.userEmail,
          cpm_rate: pendingCampaignData.cpm_rate || 10.0,
          daily_limit: pendingCampaignData.daily_limit || 10,
          target_impressions: pendingCampaignData.target_impressions || 119900,
        };

        fetch("/t/checkout/dodo/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(verifyPayload),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success === false || data.status === "payment_failed") {
              sessionStorage.removeItem("ih_pending_ad_campaign");
              setPaymentBanner({
                type: "error",
                title: "Payment Not Successful",
                message:
                  data.message ||
                  "Your payment could not be verified. No ad campaign was created and you have not been charged.",
              });
              return;
            }

            if (data.campaign) {
              try {
                const cached =
                  localStorage.getItem("indihunt_ad_campaigns") || "[]";
                const list = JSON.parse(cached).filter(
                  (c: any) => c.id !== data.campaign.id
                );
                list.unshift(data.campaign);
                localStorage.setItem(
                  "indihunt_ad_campaigns",
                  JSON.stringify(list)
                );
              } catch {}

              if (data.payment) {
                try {
                  const cachedP =
                    localStorage.getItem("indihunt_payments") || "[]";
                  const pList = JSON.parse(cachedP).filter(
                    (p: any) => p.id !== data.payment.id
                  );
                  pList.unshift(data.payment);
                  localStorage.setItem(
                    "indihunt_payments",
                    JSON.stringify(pList)
                  );
                } catch {}
              }

              sessionStorage.removeItem("ih_pending_ad_campaign");

              setPaymentBanner({
                type: "success",
                title: "Payment Successful! 🎉",
                message: `Your advertisement campaign "${
                  data.campaign.name || "Sponsored Campaign"
                }" has been activated and is now saved and rotating live across IndiHunt.`,
              });
            }
          })
          .catch((err) => {
            console.error("Ad payment verification error:", err);
            setPaymentBanner({
              type: "error",
              title: "Verification Error",
              message:
                "Could not verify your payment. Please check your campaign status in your profile or contact support.",
            });
          });

        setPaymentBanner({
          type: "success",
          title: "Processing Payment...",
          message:
            "Verifying your payment with Dodo Payments and activating your campaign. Please wait...",
        });
        window.history.replaceState({}, "", "/");
      } else if (isFailed) {
        setPaymentBanner({
          type: "error",
          title: "Payment Unsuccessful or Cancelled",
          message:
            "No charge was made. Your ad was not created. You can retry launching your campaign anytime.",
        });
        window.history.replaceState({}, "", "/");
      }
    }
  }, []);  // Top hunters & billboards load (deferred to idle time so initial paint is 0ms)
  useEffect(() => {
    if (!initialTopHunters || initialTopHunters.length === 0) {
      getTopHuntersData().then((data) => {
        setTopHunters(data.slice(0, 5));
      });
    }

    const timer = setTimeout(() => {
      let sid = "";
      let lastSeenId = "";
      if (typeof window !== "undefined") {
        sid = sessionStorage.getItem("ih_ad_sid") || "";
        if (!sid) {
          sid = `sid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem("ih_ad_sid", sid);
        }
        lastSeenId = sessionStorage.getItem("ih_last_billboard_id") || "";
      }

      secureApiFetch<any>(`/t/billboards?sessionId=${sid}&lastSeenId=${encodeURIComponent(lastSeenId)}`)
        .then((res) => {
          let adsList: BillboardAd[] = [];
          if (res && res.success && res.data) {
            if (Array.isArray(res.data)) {
              adsList = res.data;
            } else if (Array.isArray((res.data as any).ads)) {
              adsList = (res.data as any).ads;
            }
          }
          const uniqueAds: BillboardAd[] = [];
          for (const ad of adsList) {
            if (!uniqueAds.some((u) => u.id === ad.id || (u.destination_url && u.destination_url === ad.destination_url))) {
              uniqueAds.push(ad);
            }
          }
          if (uniqueAds.length === 0) {
            for (const defAd of DEFAULT_BILLBOARDS) {
              if (!uniqueAds.some((u) => u.id === defAd.id || (u.destination_url && u.destination_url === defAd.destination_url))) {
                uniqueAds.push(defAd);
              }
            }
          }

          if (uniqueAds.length > 0) {
            let rotated = [...uniqueAds];
            if (typeof window !== "undefined") {
              try {
                if (lastSeenId && rotated.length > 1) {
                  const idx = rotated.findIndex((a) => a.id === lastSeenId);
                  if (idx !== -1) {
                    const nextIdx = (idx + 1) % rotated.length;
                    rotated = [...rotated.slice(nextIdx), ...rotated.slice(0, nextIdx)];
                  } else {
                    const unviewed = rotated.filter((a) => a.id !== lastSeenId);
                    if (unviewed.length > 0) {
                      rotated = [...unviewed, ...rotated.filter((a) => a.id === lastSeenId)];
                    }
                  }
                }
                if (rotated[0]) {
                  sessionStorage.setItem("ih_last_billboard_id", rotated[0].id);
                }
              } catch (e) {}
            }

            setSelectedBillboardAds(rotated);

            // Only record impression for the single top visible billboard
            if (rotated[0]) {
              fetch("/t/billboards/event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  billboardId: rotated[0].id,
                  eventType: "impression",
                  sessionId: sid,
                }),
              }).catch(() => {});
            }
          }
        })
        .catch(() => {
          getBillboardAds(false).then((ads) => {
            let list = [...(ads || [])];
            if (list.length === 0) {
              for (const defAd of DEFAULT_BILLBOARDS) {
                if (!list.some((u) => u.id === defAd.id || (u.destination_url && u.destination_url === defAd.destination_url))) {
                  list.push(defAd);
                }
              }
            }
            if (typeof window !== "undefined" && list.length > 1) {
              try {
                if (lastSeenId) {
                  const idx = list.findIndex((a) => a.id === lastSeenId);
                  if (idx !== -1) {
                    const nextIdx = (idx + 1) % list.length;
                    list = [...list.slice(nextIdx), ...list.slice(0, nextIdx)];
                  }
                }
                if (list[0]) {
                  sessionStorage.setItem("ih_last_billboard_id", list[0].id);
                }
              } catch (e) {}
            }
            setSelectedBillboardAds(list);
          });
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [initialTopHunters]);

  useEffect(() => {
    setHasMounted(true);
    const checkTimeWindow = () => {
      setIsPreLaunchWindow(isIndianPreLaunchWindow());
    };
    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000);
    return () => clearInterval(interval);
  }, []);


  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Pulse stats fetch — only fetch if SSR initial stats are not provided
  useEffect(() => {
    if (initialPulseStats) return;
    secureApiFetch("/t/stats/pulse")
      .then((resData) => {
        const data = resData?.data || resData;
        if (data) {
          if (typeof data.activeMakers === "number")
            setPulseActiveMakers(data.activeMakers);
          if (typeof data.upvotesCount === "number")
            setPulseUpvotes(data.upvotesCount);
          if (typeof data.categoriesCount === "number")
            setPulseCategoriesCount(data.categoriesCount);
          if (typeof data.productsCount === "number")
            setPulseProductsCount(data.productsCount);
        }
      })
      .catch(() => {});
  }, [initialPulseStats]);

  // Realtime upvote listener to sync external upvotes into homepage cache
  useEffect(() => {
    const unsub = subscribe("feed", "product_upvoted", (data: { productId: string; upvotes_count: number }) => {
      if (!data?.productId) return;
      queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: Product) =>
          p.id === data.productId || getProductSlug(p.name).toLowerCase() === data.productId.toLowerCase()
            ? { ...p, upvotes_count: data.upvotes_count }
            : p
        );
      });
      queryClient.setQueriesData({ queryKey: ["promoted_products"] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: Product) =>
          p.id === data.productId || getProductSlug(p.name).toLowerCase() === data.productId.toLowerCase()
            ? { ...p, upvotes_count: data.upvotes_count }
            : p
        );
      });
    });
    return unsub;
  }, [subscribe, queryClient]);

  // Upvote Handler
  const handleVote = useCallback(
    async (e: React.MouseEvent, productId: string) => {
      e.stopPropagation();
      const activeUserId = effectiveUserId || currentUserId;
      if (!activeUserId) {
        dispatch(setAuthModalOpen(true));
        return;
      }
      const targetProd = (products || []).find((p: any) => p.id === productId || getProductSlug(p.name).toLowerCase() === productId.toLowerCase());
      const slug = targetProd?.name ? getProductSlug(targetProd.name) : undefined;
      const targetId = targetProd?.id || productId;

      toggleUpvoteMutation.mutate(
        { productId: targetId, userId: activeUserId },
        {
          onSuccess: (result) => {
            if (result && result.success) {
              publish("feed", "product_upvoted", {
                productId: targetId,
                upvotes_count: result.upvotes_count,
              });
              publish(`product:${targetId}`, "product_upvoted", {
                productId: targetId,
                upvotes_count: result.upvotes_count,
              });
              if (slug && slug !== targetId) {
                publish(`product:${slug}`, "product_upvoted", {
                  productId: targetId,
                  upvotes_count: result.upvotes_count,
                });
              }
            }
          },
        }
      );
    },
    [effectiveUserId, currentUserId, dispatch, toggleUpvoteMutation, queryClient, publish, products]
  );

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;

    const updated = await updateUserProfile(currentUserId, {
      full_name: onboardName,
      username: onboardUsername,
      linkedin_url: onboardLinkedIn,
      twitter_url: onboardTwitter,
      headline: onboardHeadline,
      onboarding_completed: true,
    });

    if (updated) {
      dispatch(setReduxProfile(updated));
      setProfile(updated);
      setShowOnboarding(false);
      refetchProducts();
    }
  };

  // Time boundaries (Deterministic from server props with client fallback)
  const startOfToday = useMemo(() => {
    if (initialDateBoundaries?.startOfToday)
      return new Date(initialDateBoundaries.startOfToday);
    return getISTStartOfDay();
  }, [initialDateBoundaries?.startOfToday]);

  const startOfYesterday = useMemo(() => {
    if (initialDateBoundaries?.startOfYesterday)
      return new Date(initialDateBoundaries.startOfYesterday);
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - 1);
    return d;
  }, [initialDateBoundaries?.startOfYesterday, startOfToday]);

  const oneWeekAgo = useMemo(() => {
    if (initialDateBoundaries?.oneWeekAgo)
      return new Date(initialDateBoundaries.oneWeekAgo);
    const d = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d;
  }, [initialDateBoundaries?.oneWeekAgo, startOfToday]);

  const oneMonthAgo = useMemo(() => {
    if (initialDateBoundaries?.oneMonthAgo)
      return new Date(initialDateBoundaries.oneMonthAgo);
    const d = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
    return d;
  }, [initialDateBoundaries?.oneMonthAgo, startOfToday]);

  const endOfTomorrow = useMemo(() => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() + 2); // Start of day after tomorrow in IST (strictly before this is tomorrow)
    return d;
  }, [startOfToday]);

  const currentProducts = mounted ? products : initialProducts;
  const currentThreads = mounted ? threads : initialThreads;

  const { data: promotedProducts = initialPromotedProducts } =
    usePromotedProducts(products, initialPromotedProducts);
  const currentPromotedProducts = mounted ? promotedProducts : initialPromotedProducts;

  const searchedProducts = useMemo(() => {
    return currentProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentProducts, searchQuery]);

  const modalSearchResults = useMemo(() => {
    if (!modalSearchQuery.trim()) return { products: [], threads: [] };
    const query = modalSearchQuery.toLowerCase();

    const matchedProducts = currentProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.tagline.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)))
    );

    const matchedThreads = currentThreads.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.body.toLowerCase().includes(query) ||
        (t.category && t.category.toLowerCase().includes(query))
    );

    return {
      products: matchedProducts.slice(0, 5),
      threads: matchedThreads.slice(0, 5),
    };
  }, [currentProducts, currentThreads, modalSearchQuery]);

  const upcomingProducts = useMemo(() => {
    const now = new Date();
    return searchedProducts
      .filter((p) => {
        if (p.scheduled_for) {
          const launchDate = new Date(p.scheduled_for);
          if (activeFeedTab === "upcoming") {
            return launchDate > now;
          }
          // In main feed, strictly show products scheduled for tomorrow's cohort (between now and end of tomorrow IST)
          return launchDate > now && launchDate < endOfTomorrow;
        }
        return p.status === "scheduled";
      })
      .sort((a, b) => {
        const timeDiff =
          new Date(a.scheduled_for || 0).getTime() -
          new Date(b.scheduled_for || 0).getTime();
        if (timeDiff !== 0) return timeDiff;
        return compareProductsForRanking(a, b);
      });
  }, [searchedProducts, activeFeedTab, endOfTomorrow]);

  const interleavePromoted = useCallback(
    (organicList: Product[], promotedList: Product[]): Product[] => {
      if (!promotedList || promotedList.length === 0) return organicList;

      const hydratedPromotedList = promotedList.map((p) => {
        const freshData =
          currentProducts.find((op) => op.id === p.id) ||
          upcomingProducts.find((up) => up.id === p.id);
        if (freshData) {
          return {
            ...p,
            has_upvoted: freshData.has_upvoted,
            upvotes_count: freshData.upvotes_count,
            is_promoted: true,
          };
        }
        return { ...p, is_promoted: true };
      });

      if (!organicList || organicList.length === 0)
        return hydratedPromotedList;

      const result: Product[] = [];
      const promotedQueue = [...hydratedPromotedList];
      let promotedIndex = 0;

      for (let i = 0; i < organicList.length; i++) {
        if (!result.some((r) => r.id === organicList[i].id)) {
          result.push(organicList[i]);
        }

        if (organicList.length < 3 && promotedIndex === 0 && i === 0) {
          const nextPromoted = promotedQueue[promotedIndex % promotedQueue.length];
          if (!result.some((r) => r.id === nextPromoted.id)) {
            result.push(nextPromoted);
            promotedIndex++;
          }
          continue;
        }

        if ((i + 1) % 3 === 0 && promotedIndex < promotedQueue.length) {
          const nextPromoted = promotedQueue[promotedIndex % promotedQueue.length];
          if (!result.some((r) => r.id === nextPromoted.id)) {
            result.push(nextPromoted);
            promotedIndex++;
          }
        }
      }

      while (promotedIndex < promotedQueue.length) {
        const nextPromoted = promotedQueue[promotedIndex];
        if (!result.some((r) => r.id === nextPromoted.id)) {
          result.push(nextPromoted);
        }
        promotedIndex++;
      }

      return result;
    },
    [currentProducts, upcomingProducts]
  );

  const launchedProducts = useMemo(() => {
    const now = new Date();
    return searchedProducts.filter((p) => {
      if (p.scheduled_for) {
        return new Date(p.scheduled_for) <= now;
      }
      return p.status !== "scheduled";
    });
  }, [searchedProducts]);

  const allProductsFeed = useMemo(() => {
    return [...launchedProducts].sort((a, b) => {
      const timeDiff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return compareProductsForRanking(a, b);
    });
  }, [launchedProducts]);

  const activeProductsList = useMemo(() => {
    if (activeFeedTab === "upcoming") return upcomingProducts;
    return allProductsFeed;
  }, [activeFeedTab, upcomingProducts, allProductsFeed]);

  const { yesterdayHref, lastWeekHref, lastMonthHref } = useMemo(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const MONTHS = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];

    const istYesterday = new Date(startOfYesterday.getTime() + IST_OFFSET_MS);
    const yYear = istYesterday.getUTCFullYear();
    const yMonth = MONTHS[istYesterday.getUTCMonth()];
    const yDay = istYesterday.getUTCDate();

    const istWeek = new Date(oneWeekAgo.getTime() + IST_OFFSET_MS);
    const wYear = istWeek.getUTCFullYear();
    const wMonth = MONTHS[istWeek.getUTCMonth()];

    const istMonth = new Date(oneMonthAgo.getTime() + IST_OFFSET_MS);
    const mYear = istMonth.getUTCFullYear();
    const mMonth = MONTHS[istMonth.getUTCMonth()];

    return {
      yesterdayHref: `/best-products/daily/${yYear}/${yMonth}/${yDay}`,
      lastWeekHref: `/best-products/weekly/${wYear}/${wMonth}`,
      lastMonthHref: `/best-products/monthly/${mYear}/${mMonth}`,
    };
  }, [startOfYesterday, oneWeekAgo, oneMonthAgo]);

  // Feed sections grouped strictly by launch time
  const feedSections: FeedSectionData[] = useMemo(() => {
    if (activeFeedTab === "upcoming") {
      const rawUpcoming = upcomingProducts.slice(0, upcomingLimit);
      const visibleUpcoming = interleavePromoted(rawUpcoming, currentPromotedProducts);
      const hasMore = upcomingProducts.length > upcomingLimit;
      return [
        {
          id: "upcoming",
          title: "🚀 Scheduled Upcoming Launches",
          subtitle: `Showing ${rawUpcoming.length} of ${upcomingProducts.length} scheduled launches`,
          items: visibleUpcoming,
          emptyMessage: "No upcoming launches scheduled.",
          hasMoreUpcoming: hasMore,
          totalUpcoming: upcomingProducts.length,
        },
      ];
    }

    const today: Product[] = [];
    const yesterday: Product[] = [];
    const lastWeek: Product[] = [];
    const lastMonth: Product[] = [];

    activeProductsList.forEach((p) => {
      const launchDate = p.scheduled_for
        ? new Date(p.scheduled_for)
        : new Date(p.created_at);

      if (launchDate >= startOfToday) {
        today.push(p);
      } else if (launchDate >= startOfYesterday && launchDate < startOfToday) {
        yesterday.push(p);
      } else if (launchDate >= oneWeekAgo && launchDate < startOfYesterday) {
        lastWeek.push(p);
      } else if (launchDate >= oneMonthAgo && launchDate < oneWeekAgo) {
        lastMonth.push(p);
      }
    });

    const sortByUpvotes = (list: Product[]) =>
      [...list].sort(compareProductsForRanking);

    const isTodayExpanded = !!expandedSections["today"];
    const sortedToday = interleavePromoted(
      isTodayExpanded
        ? sortByUpvotes(today)
        : sortByUpvotes(today).slice(0, 20),
      currentPromotedProducts
    );
    const sortedYesterday = sortByUpvotes(yesterday).slice(0, 5);
    const sortedLastWeek = sortByUpvotes(lastWeek).slice(0, 5);
    const sortedLastMonth = sortByUpvotes(lastMonth).slice(0, 5);

    const sections: FeedSectionData[] = [];

    // Pre-launch rollover window (8:00 PM to 2:00 AM IST): Feature upcoming launches at top
    if (isPreLaunchWindow && hasMounted && upcomingProducts.length > 0) {
      const rawUpcoming = upcomingProducts.slice(0, 20);
      const visibleUpcoming = interleavePromoted(rawUpcoming, currentPromotedProducts);
      sections.push({
        id: "upcoming-prelaunch",
        title: "🚀 Scheduled Upcoming Launches",
        subtitle: `Scheduled to go live next (${upcomingProducts.length} scheduled launches)`,
        items: visibleUpcoming,
        emptyMessage: "No upcoming launches scheduled.",
        totalUpcoming: upcomingProducts.length,
        seeAllText: "View all scheduled launches",
        seeAllHref: "/?tab=upcoming",
      });
    }

    sections.push(
      {
        id: "today",
        title:
          isPreLaunchWindow && hasMounted && upcomingProducts.length > 0
            ? "Today's Top Products"
            : "Top Products Launching Today",
        subtitle: isTodayExpanded
          ? `Showing all ${today.length} products launched today`
          : `Top launched products today (${today.length} total)`,
        items: sortedToday,
        emptyMessage: "No products launched today.",
        totalCount: today.length,
        isExpanded: isTodayExpanded,
        seeAllText: isTodayExpanded
          ? "Show Top 20 Only"
          : `See all ${today.length} of today's top products`,
      },
      {
        id: "yesterday",
        title: "Yesterday's Top Products",
        subtitle: "Top launched products yesterday",
        items: sortedYesterday,
        emptyMessage: "No products launched yesterday.",
        seeAllText: "See all of yesterday's top products",
        seeAllHref: yesterdayHref,
      },
      {
        id: "last-week",
        title: "Last Week's Top Products",
        subtitle: "Top trending products from past 7 days",
        items: sortedLastWeek,
        emptyMessage: "No products launched last week.",
        seeAllText: "See all of last week's top products",
        seeAllHref: lastWeekHref,
      },
      {
        id: "last-month",
        title: "Last Month's Top Products",
        subtitle: "Top products launched in the past 30 days",
        items: sortedLastMonth,
        emptyMessage: "No products launched last month.",
        seeAllText: "See all of last month's top products",
        seeAllHref: lastMonthHref,
      }
    );

    return sections;
  }, [
    activeProductsList,
    upcomingProducts,
    upcomingLimit,
    activeFeedTab,
    startOfToday,
    startOfYesterday,
    oneWeekAgo,
    oneMonthAgo,
    expandedSections,
    isPreLaunchWindow,
    hasMounted,
    currentPromotedProducts,
    interleavePromoted,
    yesterdayHref,
    lastWeekHref,
    lastMonthHref,
  ]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      SaaS: 0,
      "Artificial Intelligence": 0,
      Productivity: 0,
      "Marketing Tools": 0,
      "Finance & FinTech": 0,
    };

    currentProducts.forEach((p) => {
      const finalTags = new Set<string>();
      const tags = p.tags || [];
      tags.forEach((t) => {
        const lt = t.toLowerCase();
        if (lt === "saas") finalTags.add("SaaS");
        else if (lt === "ai" || lt === "artificial intelligence")
          finalTags.add("Artificial Intelligence");
        else if (lt === "productivity") finalTags.add("Productivity");
        else if (lt === "marketing" || lt === "marketing tools")
          finalTags.add("Marketing Tools");
        else if (
          lt === "finance" ||
          lt === "fintech" ||
          lt === "finance & fintech"
        )
          finalTags.add("Finance & FinTech");
      });

      const text = `${p.name} ${p.tagline} ${
        p.description || ""
      }`.toLowerCase();
      if (
        text.includes("ai") ||
        text.includes("gpt") ||
        text.includes("artificial") ||
        text.includes("intelligence") ||
        text.includes("llm") ||
        text.includes("model") ||
        text.includes("bot") ||
        text.includes("openai")
      ) {
        finalTags.add("Artificial Intelligence");
      }
      if (
        text.includes("saas") ||
        text.includes("b2b") ||
        text.includes("platform") ||
        text.includes("software as a service") ||
        text.includes("cloud")
      ) {
        finalTags.add("SaaS");
      }
      if (
        text.includes("productivity") ||
        text.includes("todo") ||
        text.includes("task") ||
        text.includes("notes") ||
        text.includes("work")
      ) {
        finalTags.add("Productivity");
      }
      if (
        text.includes("marketing") ||
        text.includes("seo") ||
        text.includes("growth") ||
        text.includes("campaign")
      ) {
        finalTags.add("Marketing Tools");
      }
      if (
        text.includes("finance") ||
        text.includes("fintech") ||
        text.includes("money") ||
        text.includes("payment") ||
        text.includes("billing") ||
        text.includes("crypto") ||
        text.includes("blockchain")
      ) {
        finalTags.add("Finance & FinTech");
      }

      if (finalTags.size === 0) {
        finalTags.add("SaaS");
      }

      finalTags.forEach((tag) => {
        if (counts[tag] !== undefined) {
          counts[tag] += 1;
        }
      });
    });

    return counts;
  }, [currentProducts]);

  const trendingThreads = useMemo(() => {
    return [...currentThreads]
      .sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0))
      .slice(0, 4);
  }, [currentThreads]);

  const topLeaderboardProducts = useMemo(() => {
    return [...currentProducts]
      .sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0))
      .slice(0, 5);
  }, [currentProducts]);

  const userProducts = useMemo(() => {
    if (!currentUserId) return [];
    return currentProducts.filter((p) => p.maker_id === currentUserId);
  }, [currentProducts, currentUserId]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden transition-colors duration-300 pt-[60px] sm:pt-[84px]">
      <Navbar
        theme={theme}
        onThemeToggle={toggleTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onForumsClick={() => {
          window.location.href = "/discussions";
        }}
        onSearchClick={() => setIsSearchModalOpen(true)}
      />

      {/* Main Feed Section */}
      <div
        id="daily-feed"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24"
      >
        <PaymentBanner
          banner={paymentBanner}
          onClose={() => setPaymentBanner(null)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed (Left Column) */}
          <div className="lg:col-span-9 space-y-2">
            <FeedHeader
              activeFeedTab={activeFeedTab}
              setActiveFeedTab={setActiveFeedTab}
              onTabChangeReset={() => setUpcomingLimit(20)}
            />

            <div suppressHydrationWarning className="space-y-4">
              {feedSections.length === 0 ? (
                <div className="text-center py-6 bg-card/30 border border-border rounded-3xl text-base text-muted-foreground">
                  No products found matching these filters.
                </div>
              ) : (
                feedSections.map((sec, secIdx) => (
                  <FeedSection
                    key={sec.id}
                    section={sec}
                    showBillboardAd={secIdx === 0}
                    selectedBillboardAds={selectedBillboardAds}
                    onVote={handleVote}
                    onLoadMoreUpcoming={() =>
                      setUpcomingLimit((prev) => prev + 20)
                    }
                    onToggleExpand={(secId) =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        [secId]: !prev[secId],
                      }))
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <HomeSidebar
            mounted={mounted}
            topLeaderboardProducts={topLeaderboardProducts}
            topHunters={topHunters}
            trendingThreads={trendingThreads}
            pulseActiveMakers={pulseActiveMakers}
            pulseProductsCount={pulseProductsCount}
            pulseUpvotes={pulseUpvotes}
            pulseCategoriesCount={pulseCategoriesCount}
            categoryCounts={categoryCounts}
            currentUser={currentUser}
            profile={profile}
            userProducts={userProducts}
            onInviteReview={(product) => setInviteReviewProduct(product)}
          />
        </div>
      </div>

      {/* Dynamic Modals */}
      <OnboardingModal
        open={showOnboarding}
        currentUser={currentUser}
        onboardName={onboardName}
        setOnboardName={setOnboardName}
        onboardUsername={onboardUsername}
        setOnboardUsername={setOnboardUsername}
        onboardLinkedIn={onboardLinkedIn}
        setOnboardLinkedIn={setOnboardLinkedIn}
        onboardTwitter={onboardTwitter}
        setOnboardTwitter={setOnboardTwitter}
        onboardHeadline={onboardHeadline}
        setOnboardHeadline={setOnboardHeadline}
        onboardNewsletterLeaderboard={onboardNewsletterLeaderboard}
        setOnboardNewsletterLeaderboard={setOnboardNewsletterLeaderboard}
        onboardNewsletterRoundup={onboardNewsletterRoundup}
        setOnboardNewsletterRoundup={setOnboardNewsletterRoundup}
        onboardNewsletterFrontier={onboardNewsletterFrontier}
        setOnboardNewsletterFrontier={setOnboardNewsletterFrontier}
        onboardAgeCheck={onboardAgeCheck}
        setOnboardAgeCheck={setOnboardAgeCheck}
        onSubmit={handleOnboardingSubmit}
        onSignOut={signOut}
      />

      <BigSearchModal
        open={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        modalSearchQuery={modalSearchQuery}
        setModalSearchQuery={setModalSearchQuery}
        categoryCounts={categoryCounts}
        modalSearchResults={modalSearchResults}
      />

      <InviteReviewModal
        product={inviteReviewProduct}
        onClose={() => setInviteReviewProduct(null)}
      />
    </div>
  );
}
