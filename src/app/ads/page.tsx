"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";
import { 
  supabase, 
  getProductById, 
  getProductSlug, 
  getUserProducts, 
  getCachedProducts, 
  getProducts,
  getAdCampaigns,
  Product 
} from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { 
  ArrowLeft, 
  Rocket, 
  AlertCircle, 
  DollarSign, 
  Megaphone, 
  Sparkles, 
  Eye, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  TrendingUp,
  ShieldCheck,
  MousePointerClick
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CircularLoader } from "@/components/CircularLoader";

function AdsContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const searchParams = useSearchParams();
  const initialProductId = searchParams?.get("product_id") || searchParams?.get("productId") || searchParams?.get("id") || searchParams?.get("product") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  
  const [campProductId, setCampProductId] = useState<string | null>(initialProductId || null);
  const [campName, setCampName] = useState("");
  const [adHeadline, setAdHeadline] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adCta, setAdCta] = useState("Visit Product");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [previewPlacement, setPreviewPlacement] = useState<"feed" | "sidebar">("feed");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState<any[]>([]);

  // Automatically reset submitting state if user navigates back (via browser back button or bfcache)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      setIsSubmitting(false);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIsSubmitting(false);
      }
    };
    const handleFocus = () => {
      setIsSubmitting(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    async function init() {
      try {
        let currentUser: any = reduxUser;

        if (!currentUser && supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              currentUser = session.user;
            }
          } catch (e) {}
        }

        if (!currentUser && typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("indihunt_user");
            if (stored) currentUser = JSON.parse(stored);
          } catch (e) {}
        }

        if (!currentUser) {
          setIsLoading(false);
          return;
        }

        setUserId(currentUser.id);
        setUserEmail(currentUser.email || null);

        // Fetch user's existing campaigns to check pending status
        try {
          const camps = await getAdCampaigns(currentUser.id);
          setUserCampaigns(camps || []);
        } catch (e) {
          console.warn("Error loading user campaigns:", e);
        }

        // Fetch user's products with multiple layers of fallback
        let userProds: any[] = [];
        try {
          userProds = await getUserProducts(currentUser.id);
        } catch (e) {
          console.warn("Error calling getUserProducts:", e);
        }

        // Fallback 1: Filter from all products
        if (!userProds || userProds.length === 0) {
          try {
            const all = await getProducts();
            userProds = all.filter((p: any) => 
              (p.maker_id === currentUser.id || p.maker?.id === currentUser.id || p.created_by === currentUser.id) && !p.is_deleted
            );
          } catch (e) {}
        }

        // Fallback 2: Check localStorage cached products
        if ((!userProds || userProds.length === 0) && typeof window !== "undefined") {
          try {
            const cached = getCachedProducts();
            userProds = cached.filter((p: any) => 
              (p.maker_id === currentUser.id || p.maker?.id === currentUser.id || p.created_by === currentUser.id) && !p.is_deleted
            );
          } catch (e) {}
        }

        if (initialProductId) {
          let targetProd = userProds.find((p: any) => p.id === initialProductId || (p.name && getProductSlug(p.name) === initialProductId.toLowerCase()));
          
          if (!targetProd) {
            try {
              const fetched = await getProductById(initialProductId);
              if (fetched) {
                targetProd = fetched;
                if (!userProds.some((p: any) => p.id === fetched.id)) {
                  userProds = [fetched, ...userProds];
                }
              }
            } catch (e) {
              console.warn("Error fetching target product for ads:", e);
            }
          }

          setProducts(userProds);

          if (targetProd) {
            setCampProductId(targetProd.id);
            setCampName(`${targetProd.name} Campaign`);
            setAdHeadline(targetProd.name);
            setAdDescription(targetProd.tagline || targetProd.description?.substring(0, 100) || "Discover this amazing product on IndiHunt.");
            setDestinationUrl(targetProd.website_url || `https://indihunt.in/products/${getProductSlug(targetProd.name)}`);
          } else if (userProds.length > 0) {
            const prod = userProds[0];
            setCampProductId(prod.id);
            setCampName(`${prod.name} Campaign`);
            setAdHeadline(prod.name);
            setAdDescription(prod.tagline || prod.description?.substring(0, 100) || "Discover this amazing product on IndiHunt.");
            setDestinationUrl(prod.website_url || `https://indihunt.in/products/${getProductSlug(prod.name)}`);
          }
        } else {
          setProducts(userProds);
          if (userProds.length > 0) {
            const prod = userProds[0];
            setCampProductId(prod.id);
            setCampName(`${prod.name} Campaign`);
            setAdHeadline(prod.name);
            setAdDescription(prod.tagline || prod.description?.substring(0, 100) || "Discover this amazing product on IndiHunt.");
            setDestinationUrl(prod.website_url || `https://indihunt.in/products/${getProductSlug(prod.name)}`);
          }
        }
      } catch (err) {
        console.error("Failed to load user products for ads page:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router, initialProductId, reduxUser]);

  const handleProductSelect = (selectedId: string) => {
    setCampProductId(selectedId || null);
    const selected = products.find((p) => p.id === selectedId);
    if (selected) {
      setCampName(`${selected.name} Campaign`);
      setAdHeadline(selected.name);
      setAdDescription(selected.tagline || selected.description?.substring(0, 100) || "Discover this amazing product on IndiHunt.");
      setDestinationUrl(selected.website_url || `https://indihunt.in/products/${getProductSlug(selected.name)}`);
    } else {
      setCampName("");
      setAdHeadline("");
      setAdDescription("");
      setDestinationUrl("");
    }
  };

  const selectedProduct = products.find((p) => p.id === campProductId);
  const selectedProductPendingCamp = userCampaigns.find(
    (c) => c.product_id === campProductId && (c.status === "pending_payment" || c.status === "draft")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campProductId || !campName.trim() || !userId) return;

    setIsSubmitting(true);
    try {
      const generatedCampaignId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `camp-${Date.now()}`;
      const payload = {
        campaignId: generatedCampaignId,
        amount: 1199,
        name: campName.trim(),
        userName: userEmail?.split("@")[0] || "Maker",
        customerName: userEmail?.split("@")[0] || "Maker",
        userEmail: userEmail,
        productId: campProductId,
        userId: userId,
        headline: adHeadline.trim() || selectedProduct?.name || campName.trim(),
        description: adDescription.trim() || selectedProduct?.tagline || "Discover this amazing product on IndiHunt.",
        cta_text: adCta,
        daily_limit: 10,
        cpm_rate: 10.0,
        target_impressions: 119900,
        destination_url: destinationUrl.trim() || selectedProduct?.website_url || `/products/${campProductId}`,
      };

      // Save to sessionStorage and localStorage before redirecting with status: "pending_payment"
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ih_pending_ad_campaign", JSON.stringify(payload));
        
        try {
          const cached = localStorage.getItem("indihunt_ad_campaigns") || "[]";
          const list = JSON.parse(cached);
          const campObj = {
            id: generatedCampaignId,
            user_id: userId,
            product_id: campProductId,
            name: payload.name,
            headline: payload.headline,
            description: payload.description,
            cta_text: payload.cta_text,
            destination_url: payload.destination_url,
            status: "pending_payment",
            total_budget: payload.amount,
            target_impressions: payload.target_impressions,
            delivered_impressions: 0,
            impressions: 0,
            clicks: 0,
            cpm_rate: payload.cpm_rate,
            daily_limit: payload.daily_limit,
            created_at: new Date().toISOString()
          };
          const nextList = [campObj, ...list.filter((c: any) => c.id !== generatedCampaignId)];
          localStorage.setItem("indihunt_ad_campaigns", JSON.stringify(nextList));
          setUserCampaigns(nextList.filter((c: any) => c.user_id === userId));
        } catch { }
      }

      // Pre-save to Supabase if client session active
      if (supabase) {
        try {
          await supabase.from("ad_campaigns").insert({
            id: generatedCampaignId,
            user_id: userId,
            product_id: campProductId,
            name: payload.name,
            headline: payload.headline,
            description: payload.description,
            cta_text: payload.cta_text,
            destination_url: payload.destination_url,
            status: "pending_payment",
            total_budget: payload.amount,
            target_impressions: payload.target_impressions,
            delivered_impressions: 0,
            daily_limit: payload.daily_limit,
            cpm_rate: payload.cpm_rate,
          });
        } catch { }
      }

      const res = await fetch("/t/checkout/dodo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json().catch(() => ({}));
      const redirectUrl = resJson.data?.url || resJson.url || resJson.checkout_url || resJson.payment_link;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        alert(resJson.error || "Failed to initialize checkout. Please try again.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "An error occurred during checkout initialization.");
      setIsSubmitting(false);
    }
  };

  // Preview data calculations
  const displayTitle = adHeadline.trim() || selectedProduct?.name || "Your Product Name";
  const displayDescription = adDescription.trim() || selectedProduct?.tagline || "A powerful indie software tool built for modern makers and creators.";
  const displayLogo = selectedProduct?.logo_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&h=128&q=80";
  const displayHostname = (() => {
    try {
      const url = destinationUrl.trim() || selectedProduct?.website_url || "indihunt.in";
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return "indihunt.in";
    }
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <CircularLoader label="Loading Self-Serve Ads Engine..." size="lg" center={false} />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans pt-24 pb-20">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-2xl shadow-sm">
            <Megaphone className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Launch Sponsored Ad Campaign
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sign in to your IndiHunt account to choose from your products and launch high-visibility ad campaigns across IndiHunt.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => dispatch(setAuthModalOpen(true))}
              className="px-6 py-3 bg-[#ff5733] hover:bg-[#e64a19] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              Sign In to Promote Your Products
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white pt-24 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Self-Serve CPM Ads</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5 mt-2">
              <Megaphone className="w-7 h-7 text-orange-500" />
              Launch Sponsored Ad Campaign
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Showcase your product across high-intent placement zones on IndiHunt: product feeds, discussion threads, and maker profiles.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-muted/40 border border-border/80 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Featured Sponsor</span>
              <span className="text-sm font-extrabold text-foreground">$1,199 Package</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              🚀
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Left (Form) & Right (Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Campaign Configuration Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Product Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">1</span>
                      Select Product
                    </h3>
                    <Link
                      href="/new"
                      className="text-[11px] font-semibold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1"
                    >
                      + Add New Product
                    </Link>
                  </div>

                  {products.length === 0 ? (
                    <div className="p-4 border border-dashed border-border rounded-2xl text-center space-y-2 bg-muted/20">
                      <p className="text-xs text-muted-foreground">You don&apos;t have any products submitted yet.</p>
                      <Link
                        href="/new"
                        className="inline-block px-4 py-2 bg-[#ff5733] text-white text-xs font-semibold rounded-xl"
                      >
                        Submit Your First Product
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                        Product to Promote <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={campProductId || ""}
                        onChange={(e) => handleProductSelect(e.target.value)}
                        required
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.tagline ? `— ${p.tagline.substring(0, 45)}` : ""}
                          </option>
                        ))}
                      </select>

                      {selectedProduct && (
                        <div className="mt-3 p-3 bg-muted/40 border border-border/80 rounded-2xl flex items-center gap-3">
                          <img
                            src={selectedProduct.logo_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&h=128&q=80"}
                            alt={selectedProduct.name}
                            className="w-10 h-10 rounded-xl object-cover border border-border flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-foreground truncate">{selectedProduct.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{selectedProduct.tagline || "Indie Product"}</div>
                          </div>
                          <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full flex-shrink-0">
                            Selected
                          </span>
                        </div>
                      )}

                      {selectedProductPendingCamp && (
                        <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold block">Unpaid Campaign Pending</span>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              This product already has a pending campaign (&quot;{selectedProductPendingCamp.name}&quot;). You can complete checkout below to re-initialize payment, or manage it in your profile campaigns tab.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Ad Creative & Content */}
                <div className="space-y-4">
                  <div className="border-b border-border/40 pb-2">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">2</span>
                      Ad Creative Details
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                        Campaign Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={campName}
                        onChange={(e) => setCampName(e.target.value)}
                        placeholder="e.g. Q3 Launch Discovery Boost"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                        Display Headline / Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={adHeadline}
                        onChange={(e) => setAdHeadline(e.target.value)}
                        placeholder="e.g. Acme Studio"
                        maxLength={50}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                      />
                      <span className="text-[10px] text-muted-foreground block text-right mt-1">
                        {adHeadline.length}/50 characters
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                        Tagline / Ad Copy <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={adDescription}
                        onChange={(e) => setAdDescription(e.target.value)}
                        placeholder="e.g. AI-powered workspace that turns code into deployed apps in seconds."
                        maxLength={100}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                      />
                      <span className="text-[10px] text-muted-foreground block text-right mt-1">
                        {adDescription.length}/100 characters
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                          Call to Action (CTA)
                        </label>
                        <select
                          value={adCta}
                          onChange={(e) => setAdCta(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                        >
                          {["Visit Product", "Try Now", "Learn More", "Get Started", "Install", "Open", "Explore"].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">
                          Destination URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={destinationUrl}
                          onChange={(e) => setDestinationUrl(e.target.value)}
                          placeholder="https://yourproduct.com"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Budget & Package Details */}
                <div className="space-y-4">
                  <div className="border-b border-border/40 pb-2">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">3</span>
                      Campaign Investment
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Total Package</span>
                      <span className="text-2xl font-black text-foreground mt-1 block">$1,199.00</span>
                      <span className="text-[11px] text-muted-foreground">Fixed flat rate sponsor</span>
                    </div>

                    <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Placement</span>
                      <span className="text-2xl font-black text-orange-500 mt-1 block">Featured Sponsor</span>
                      <span className="text-[11px] text-muted-foreground">Feed, discussions &amp; discovery</span>
                    </div>
                  </div>
                </div>

                {/* Submit / Checkout */}
                <div className="pt-4 border-t border-border/40">
                  <button
                    type="submit"
                    disabled={isSubmitting || !campProductId || !campName.trim() || products.length === 0}
                    className="w-full py-4 bg-[#ff5733] hover:bg-[#e64a19] text-white text-sm font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <CircularLoader size="sm" center={false} />
                        <span>Redirecting to Secure Dodo Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        <span>Pay $1,199.00 &amp; Launch Campaign</span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground mt-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Instant activation after checkout powered by Dodo Payments</span>
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT: Live Interactive Ad Preview Demo */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
              
              {/* Preview Header with Pulsing Dot */}
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Live Ad Preview</h3>
                </div>
                
                {/* Placement switcher tabs */}
                <div className="flex items-center bg-muted p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewPlacement("feed")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      previewPlacement === "feed" 
                        ? "bg-background text-foreground shadow-2xs" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Feed Banner
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlacement("sidebar")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      previewPlacement === "sidebar" 
                        ? "bg-background text-foreground shadow-2xs" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sidebar Card
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                This is a live preview of how your sponsored ad looks to Indian founders, developers, and makers on IndiHunt.
              </p>

              {/* RENDERED SPONSORED AD DEMO CARD */}
              <div className="p-3 bg-muted/40 rounded-2xl border border-dashed border-border">
                
                {previewPlacement === "feed" ? (
                  /* Feed Banner Format (Matching SponsoredAd.tsx exactly) */
                  <div className="relative w-full bg-slate-100/90 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:border-orange-500/40 transition-all shadow-2xs overflow-hidden group">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto overflow-hidden">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-background shadow-2xs">
                        <Image
                          src={displayLogo}
                          alt={displayTitle}
                          className="w-full h-full object-cover"
                        width={48} height={48} />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <span className="font-bold text-foreground text-sm block transition-colors truncate">
                          {displayTitle}
                        </span>
                        <span className="text-xs text-muted-foreground block mt-0.5 line-clamp-1">
                          {displayDescription}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-start sm:justify-end w-full sm:w-auto pt-0.5 sm:pt-0 max-w-full overflow-hidden">
                      <span className="border border-slate-300 dark:border-slate-700 bg-card group-hover:border-slate-400 dark:group-hover:border-slate-600 text-foreground px-4 py-1.5 rounded-full text-xs font-semibold transition-all truncate max-w-full inline-flex items-center gap-1.5 shadow-2xs">
                        <span>{adCta}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </span>
                    </div>

                    <span className="absolute bottom-0 right-0 bg-orange-500 text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-tl-lg rounded-br-2xl pointer-events-none shadow-xs">
                      Promoted
                    </span>
                  </div>
                ) : (
                  /* Sidebar Card Format */
                  <div className="relative w-full bg-card border border-border rounded-2xl p-5 space-y-4 hover:border-orange-500/40 transition-all shadow-2xs overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-background shadow-2xs">
                        <Image
                          src={displayLogo}
                          alt={displayTitle}
                          className="w-full h-full object-cover"
                        width={48} height={48} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-foreground text-sm block truncate">
                          {displayTitle}
                        </span>
                        <span className="text-[11px] text-orange-500 font-semibold block mt-0.5">
                          {displayHostname}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {displayDescription}
                    </p>

                    <div className="pt-1">
                      <div className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                        <span>{adCta}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <span className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-bl-lg rounded-tr-2xl pointer-events-none">
                      Sponsored
                    </span>
                  </div>
                )}

              </div>

              {/* Placement Details Card */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                  Why Advertise on IndiHunt?
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span><strong>High Intent Audience:</strong> Reach indie hackers, tech makers, VC scouts, and early adopters.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span><strong>Smart Rotation:</strong> Dynamically inserted on Homepage feeds and product discussion pages.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span><strong>Full Analytics:</strong> Live impressions, CTR, and verified clicks tracked directly on your profile.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function AdsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center pt-20">
          <CircularLoader label="Loading Self-Serve Ads Engine..." size="lg" center={false} />
        </div>
      }
    >
      <AdsContent />
    </Suspense>
  );
}
