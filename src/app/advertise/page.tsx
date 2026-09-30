"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Rocket, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  MessageSquare, 
  Users, 
  Megaphone,
  Globe,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  X,
  Clock,
  AlertCircle,
  ExternalLink,
  Flame,
  Star,
  CheckCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { 
  supabase, 
  createAdCampaign, 
  updateAdCampaignStatus, 
  getProductSlug, 
  getBillboardAds, 
  getTopHuntersData, 
  DEFAULT_STORIES,
  Product,
  BillboardAd,
  Hunter
} from "@/lib/supabase";
import { useProducts, usePromotedProducts } from "@/hooks/useDb";
import { useAppDispatch } from "@/lib/store";

export default function AdvertisePage() {
  const dispatch = useAppDispatch();

  // User/profile and products state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Live platform data
  const { data: allProducts = [] } = useProducts();
  const { data: promotedProducts = [] } = usePromotedProducts(allProducts);
  const [billboardAds, setBillboardAds] = useState<BillboardAd[]>([]);
  const [topHunters, setTopHunters] = useState<Hunter[]>([]);
  const [pulseStats, setPulseStats] = useState<{
    activeMakers: number;
    upvotesCount: number;
    categoriesCount: number;
    productsCount: number;
    monthlyVisitors: number;
  }>({
    activeMakers: 1200,
    upvotesCount: 8500,
    categoriesCount: 16,
    productsCount: 350,
    monthlyVisitors: 85000,
  });

  // Campaign Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [campName, setCampName] = useState("");
  const [campTagline, setCampTagline] = useState("");
  const [campUrl, setCampUrl] = useState("");
  const [campProductId, setCampProductId] = useState<string | null>(null);
  const [campGoal, setCampGoal] = useState("");
  const [campBudget, setCampBudget] = useState("$1,199 · Standard Launch Sponsor");
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get("status");
      const campaignId = urlParams.get("campaign_id");
      if (status === "success") {
        setWizardStep(5);
        if (campaignId) {
          updateAdCampaignStatus(campaignId, "active").catch(() => {});
        }
      }
    }

    // Fetch Pulse Stats
    fetch("/t/stats/pulse")
      .then(res => res.json())
      .then(res => {
        if (res?.data) {
          setPulseStats({
            activeMakers: res.data.activeMakers || 1200,
            upvotesCount: res.data.upvotesCount || 8500,
            categoriesCount: res.data.categoriesCount || 16,
            productsCount: res.data.productsCount || 350,
            monthlyVisitors: res.data.monthlyVisitors || 85000,
          });
        }
      })
      .catch(() => {});

    // Fetch Live Billboard Ads & Top Makers
    getBillboardAds().then(ads => setBillboardAds(ads || [])).catch(() => {});
    getTopHuntersData("all_time").then(hunters => setTopHunters(hunters?.slice(0, 10) || [])).catch(() => {});

    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        setIsUserLoading(false);
      }
    });
  }, []);

  const fetchUserData = async (uid: string) => {
    if (!supabase) return;
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();
      if (prof) setProfile(prof);

      const { data: ownProducts } = await supabase
        .from("products")
        .select("*")
        .eq("maker_id", uid);

      const { data: memberProducts } = await supabase
        .from("product_members")
        .select("products(*)")
        .eq("user_id", uid);

      const memberProdsList = (memberProducts || [])
        .map((m: any) => m.products)
        .filter(Boolean);

      const combined = [...(ownProducts || []), ...memberProdsList];
      const uniqueProducts = combined.filter(
        (value, index, self) => self.findIndex(p => p.id === value.id) === index
      );
      setUserProducts(uniqueProducts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUserLoading(false);
    }
  };

  const handleCreateCampaignSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supabase || !user) return;
    setIsSubmittingCampaign(true);
    try {
      const fallbackProductId = userProducts[0]?.id || (allProducts[0]?.id) || "00000000-0000-0000-0000-000000000000";
      const generatedCampaignId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `camp-${Date.now()}`;
      
      const payload = {
        campaignId: generatedCampaignId,
        userId: user.id,
        productId: campProductId || fallbackProductId,
        name: campName,
        userName: user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : ""),
        headline: campTagline.substring(0, 60),
        description: campGoal.substring(0, 120) || "Sponsored Product Listing",
        cta_text: "Visit Product",
        destination_url: campUrl || "",
        amount: 1199,
        daily_limit: 10,
        cpm_rate: 10.0,
        target_impressions: 100000,
        userEmail: user.email,
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem("ih_pending_ad_campaign", JSON.stringify(payload));
        try {
          const cached = localStorage.getItem("indihunt_ad_campaigns") || "[]";
          const list = JSON.parse(cached);
          const campObj = {
            id: generatedCampaignId,
            user_id: user.id,
            product_id: campProductId || fallbackProductId,
            name: payload.name,
            headline: payload.headline,
            description: payload.description,
            cta_text: payload.cta_text,
            destination_url: payload.destination_url,
            status: "active",
            total_budget: payload.amount,
            target_impressions: payload.target_impressions,
            delivered_impressions: 0,
            impressions: 0,
            clicks: 0,
            cpm_rate: payload.cpm_rate,
            daily_limit: payload.daily_limit,
            created_at: new Date().toISOString()
          };
          list.unshift(campObj);
          localStorage.setItem("indihunt_ad_campaigns", JSON.stringify(list));
        } catch { }
      }

      // Pre-save to Supabase
      try {
        await supabase.from("ad_campaigns").insert({
          id: generatedCampaignId,
          user_id: user.id,
          product_id: campProductId || fallbackProductId,
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

      // Trigger Dodo Payments Checkout Session directly
      const checkoutRes = await fetch("/t/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await checkoutRes.text();
      let checkoutData: any = {};
      try {
        checkoutData = JSON.parse(rawText);
      } catch {
        console.error("Non-JSON checkout response:", rawText);
        alert("Server error initiating payment. Please try again.");
        return;
      }

      const redirectUrl = checkoutData.data?.url || checkoutData.url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (checkoutData.error) {
        alert(`Checkout Error: ${checkoutData.error}`);
      } else {
        setWizardStep(5);
      }
    } catch (err) {
      console.error("Error creating campaign checkout:", err);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  // Select representative products for live interactive display
  const showcaseProducts = allProducts.slice(0, 8);
  const sampleProduct = allProducts[0] || {
    id: "sample",
    name: "DocuFlow AI",
    tagline: "Automate document workflows with private local AI models",
    upvotes_count: 48,
    category: "AI & ML",
    maker: { full_name: "Aakash Verma", username: "aakashv" }
  };
  const samplePromoted = promotedProducts[0] || allProducts[1] || sampleProduct;
  const sampleBillboard = billboardAds[0];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      {/* Main Top Navbar */}
      <Navbar />

      <div className="pt-[68px] sm:pt-[76px]">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-4 sm:pt-6 pb-12 lg:pb-16 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium uppercase tracking-wider">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Sponsor & Advertise on IndiHunt</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Reach founders, makers & early adopters across <span className="text-[#C2410C] dark:text-[#EA580C]">India</span>
              </h1>
              
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                Get directly in front of thousands of active tech founders, software builders, product leaders, and venture investors discovering the next generation of SaaS and AI tools.
              </p>

              {/* Real Platform Key Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1 max-w-2xl">
                <div className="bg-card/90 border border-border/80 p-3 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-orange-500/40 cursor-default">
                  <span className="text-lg font-bold text-orange-500 block leading-tight">
                    {pulseStats.activeMakers > 0 ? `${pulseStats.activeMakers.toLocaleString()}+` : "1,200+"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mt-0.5">Active Makers</span>
                </div>
                <div className="bg-card/90 border border-border/80 p-3 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-orange-500/40 cursor-default">
                  <span className="text-lg font-bold text-amber-500 block leading-tight">
                    {pulseStats.productsCount > 0 ? `${pulseStats.productsCount.toLocaleString()}+` : "350+"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mt-0.5">Live Products</span>
                </div>
                <div className="bg-card/90 border border-border/80 p-3 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-orange-500/40 cursor-default">
                  <span className="text-lg font-bold text-emerald-500 block leading-tight">
                    {pulseStats.upvotesCount > 0 ? `${pulseStats.upvotesCount.toLocaleString()}+` : "8,500+"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mt-0.5">Total Upvotes</span>
                </div>
                <div className="bg-card/90 border border-border/80 p-3 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-orange-500/40 cursor-default">
                  <span className="text-lg font-bold text-indigo-500 block leading-tight">
                    {pulseStats.monthlyVisitors > 0 ? `${Math.round(pulseStats.monthlyVisitors / 1000)}k+` : "85k+"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mt-0.5">Monthly Views</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a 
                  href="#campaign-options"
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs shadow-lg shadow-orange-500/20 transition-all text-center flex items-center gap-2"
                >
                  <span>Explore Ad Placements</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <Link
                  href="/ads"
                  className="px-6 py-3 rounded-xl bg-card border border-border hover:border-orange-500/40 text-foreground font-medium text-xs transition-all text-center"
                >
                  Launch Self-Serve Ad
                </Link>
              </div>
            </div>

            {/* Hero Real Community Avatars */}
            <div className="lg:col-span-5 relative flex justify-center items-center h-[380px] w-full">
              <div className="absolute w-80 h-80 bg-gradient-to-tr from-orange-500/10 to-amber-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
              
              <div className="relative w-full h-full max-w-[420px]">
                {(topHunters.length > 0 ? topHunters : [
                  { username: "arjun_dev", name: "Arjun Dev", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" },
                  { username: "priya_sharma", name: "Priya Sharma", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80" },
                  { username: "vikram_singh", name: "Vikram Singh", avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&h=120&q=80" },
                  { username: "neha_tech", name: "Neha Patel", avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80" },
                  { username: "rohit_maker", name: "Rohit Kumar", avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80" },
                  { username: "ananya_ai", name: "Ananya Iyer", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80" },
                  { username: "dev_k", name: "Karan Verma", avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80" },
                ]).slice(0, 7).map((maker: any, idx) => {
                  const positions = [
                    "top-4 left-6 w-16 h-16",
                    "top-8 right-8 w-14 h-14",
                    "top-1/2 left-2 w-16 h-16 -translate-y-1/2",
                    "bottom-6 left-10 w-14 h-14",
                    "bottom-10 right-10 w-16 h-16",
                    "top-1/3 right-1/4 w-12 h-12",
                    "bottom-4 left-1/3 w-14 h-14"
                  ];
                  const pos = positions[idx % positions.length];
                  const displayName = maker.name || maker.full_name || maker.username || "M";
                  const initials = displayName.substring(0, 2).toUpperCase();

                  return (
                    <div key={idx} className={`absolute ${pos} group`}>
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-border shadow-lg transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 bg-muted flex items-center justify-center">
                        {maker.avatar_url ? (
                          <Image src={maker.avatar_url} alt={displayName} className="w-full h-full object-cover" width={48} height={48} />
                        ) : (
                          <span className="font-bold text-xs text-orange-500">{initials}</span>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-[10px] shadow transform group-hover:scale-110 transition-transform">
                        🇮🇳
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* Real Products Launched on IndiHunt */}
        <section className="py-12 bg-card/40 border-y border-border">
          <div className="max-w-7xl mx-auto px-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <div>
                <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest block">Live Ecosystem Showcase</span>
                <h3 className="text-sm font-medium text-muted-foreground mt-0.5">Real products & startups built and launched on IndiHunt</h3>
              </div>
              <Link href="/" className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1">
                <span>View Full Product Feed</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {showcaseProducts.length > 0 ? (
                showcaseProducts.slice(0, 6).map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/products/${getProductSlug(prod.name || prod.id)}`}
                    className="p-3 bg-card border border-border/80 rounded-2xl hover:border-orange-500/40 hover:shadow-sm transition-all group flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 font-bold text-xs flex items-center justify-center flex-shrink-0 overflow-hidden border border-orange-500/20">
                      {prod.logo_url ? (
                        <Image src={prod.logo_url} alt={prod.name} className="w-full h-full object-cover" width={48} height={48} />
                      ) : (
                        (prod.name || "P").substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground truncate group-hover:text-orange-500 transition-colors">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {prod.category || "Indie SaaS"}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                  Discovering live products on IndiHunt...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Target Audience / Stats Section */}
        <section className="py-20 max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Connect with High-Intent Early Adopters</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              IndiHunt visitors are builders, developers, and tech executives looking for modern tools, APIs, infrastructure, and productivity solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { stat: `${pulseStats.activeMakers.toLocaleString()}+`, title: "Makers & Startup Creators", desc: "Founders actively building and shipping tech products" },
              { stat: `${pulseStats.productsCount.toLocaleString()}+`, title: "Products Discovered", desc: "Curated directory of high-quality software tools" },
              { stat: `${pulseStats.upvotesCount.toLocaleString()}+`, title: "Community Upvotes", desc: "Engaged votes and product discovery interactions" },
              { stat: "100% Organic", title: "Targeted Tech Traffic", desc: "Developers, indie hackers, PMs, and early tech adopters" }
            ].map((card, idx) => (
              <div key={idx} className="bg-card border border-border/80 p-6 rounded-3xl space-y-2 shadow-sm hover:border-orange-500/30 transition-all">
                <span className="text-2xl sm:text-3xl font-extrabold text-orange-500 block">{card.stat}</span>
                <span className="text-sm font-semibold text-foreground block">{card.title}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ad Products/Campaign Formats Section */}
        <section id="campaign-options" className="py-20 bg-muted/10 border-y border-border">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Transparent Advertising Formats</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Choose from self-serve feed placements to high-visibility leaderboard banners.
              </p>
            </div>

            <div className="space-y-8">
              
              {/* Format 1: Basic Display / Promoted Feed Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Promoted Feed Listing</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Place your product directly inside the main IndiHunt discovery feed with a prominent Promoted badge. Perfect for driving click-throughs, user trials, and launch day momentum.
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Featured prominently in home & category feeds</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Includes direct website CTA and UTM tracking</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-6 p-4 bg-muted/30 border border-border rounded-2xl">
                  <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm overflow-hidden flex-shrink-0">
                      {sampleProduct.logo_url ? (
                        <Image src={sampleProduct.logo_url} alt={sampleProduct.name} className="w-full h-full object-cover" width={48} height={48} />
                      ) : (
                        (sampleProduct.name || "P").substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{sampleProduct.name}</span>
                        <span className="text-[9px] bg-orange-500/10 text-orange-500 font-bold px-1.5 py-0.5 rounded uppercase border border-orange-500/20">Promoted</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {sampleProduct.tagline || "Discover and scale your software product on IndiHunt."}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-orange-500 flex items-center gap-1 bg-orange-500/10 px-2.5 py-1.5 rounded-lg border border-orange-500/20">
                      <span>▲</span>
                      <span>{sampleProduct.upvotes_count || 1}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Format 2: Momentum Multi-Touch Campaign */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="lg:col-span-6 space-y-4">
                  <h3 className="text-xl font-bold text-foreground">Launch Momentum Package</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Maximize your launch results by running targeted promotions in the days immediately following your launch to retain leaderboard position and capture high-intent users.
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="px-2.5 py-1 bg-muted rounded-lg font-medium">Daily Digest</span>
                    <span>•</span>
                    <span className="px-2.5 py-1 bg-muted rounded-lg font-medium">Feed Pinning</span>
                    <span>•</span>
                    <span className="px-2.5 py-1 bg-muted rounded-lg font-medium">Category Spotlight</span>
                  </div>
                </div>
                <div className="lg:col-span-6 flex justify-center items-center p-6 bg-muted/30 border border-border rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4 text-muted-foreground">
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm flex items-center justify-center">
                      <Mail className="w-5 h-5 text-orange-500" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                    <div className="p-3.5 bg-orange-500 text-white rounded-2xl border border-orange-600 shadow-md font-bold text-sm">
                      IndiHunt
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm flex items-center justify-center">
                      <Globe className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Format 3: Featured Showcase Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="lg:col-span-6 space-y-4">
                  <h3 className="text-xl font-bold text-foreground">Sponsored Showcase Spotlight</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A dedicated high-engagement card highlighting your key features, special founder offers, or product trial perks directly in front of active community members.
                  </p>
                </div>
                <div className="lg:col-span-6 p-4 bg-muted/30 border border-border rounded-2xl space-y-3">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Live Showcase Preview</span>
                  <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                        {samplePromoted.logo_url ? (
                          <Image src={samplePromoted.logo_url} alt={samplePromoted.name} className="w-full h-full object-cover rounded-xl" width={48} height={48} />
                        ) : (
                          (samplePromoted.name || "P").substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">Featured Sponsor</span>
                        <span className="text-sm font-semibold text-foreground truncate block leading-tight">{samplePromoted.name}</span>
                        <p className="text-xs text-muted-foreground truncate">{samplePromoted.tagline || "Discover top Indian indie tech products"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[(samplePromoted.category || "Developer Tools"), "Productivity", "Fast Launch", "Verified"].map((feat) => (
                        <span key={feat} className="text-[9px] font-medium bg-orange-500/10 border border-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full">
                          {feat}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 w-full bg-orange-500 text-white font-medium text-xs px-3 py-2.5 rounded-xl shadow-sm">
                      <span>Explore {samplePromoted.name}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Format 4: Billboard Ads */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="lg:col-span-6 space-y-4">
                  <h3 className="text-xl font-bold text-foreground">Billboard Banner Ads</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Command full visual attention with our high-impact 4:1 banner display placed prominently across the home feed header. Ideal for major product launches and flagship brand awareness.
                  </p>
                  <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl space-y-1 mt-4">
                    <span className="text-xs font-semibold text-orange-500 block">Recommended Specifications</span>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      Billboard banners display at a crisp 4:1 aspect ratio. We recommend uploading assets at <strong>1200x300 pixels</strong> (or at minimum 800x200 pixels) in WebP or PNG format.
                    </p>
                  </div>
                </div>
                <div className="lg:col-span-6 p-4 bg-muted/30 border border-border rounded-2xl">
                  <div className="block relative w-full aspect-[4/1] rounded-xl overflow-hidden border border-border shadow-sm bg-muted/50 group">
                    <Image 
                      src={sampleBillboard?.image_url || "/supabase_ad_banner.webp"} 
                      alt="Billboard Ad Preview" 
                      className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500" 
                    width={48} height={48} />
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20 shadow">
                      Promoted Banner
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Real Builder Voices & Stories */}
        <section className="py-20 bg-card/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Maker Stories & Ecosystem Growth</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Read how Indian indie developers and startup founders build, launch, and grow their reach on IndiHunt.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {DEFAULT_STORIES.slice(0, 2).map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="bg-card border border-border hover:border-orange-500/40 rounded-3xl p-6 sm:p-8 shadow-sm transition-all flex flex-col justify-between group space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        {story.category || "Interview"}
                      </span>
                      <span className="text-xs text-muted-foreground">IndiHunt Maker Story</span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground group-hover:text-orange-500 transition-colors leading-snug">
                      {story.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {story.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
                    <span className="font-medium text-foreground">Read full founder case study</span>
                    <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom CTA Bar */}
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 border border-orange-500/20 rounded-3xl p-8 text-center space-y-4 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-foreground">Ready to promote your product?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Set up your self-serve campaign in seconds or connect with the IndiHunt team to create custom sponsorships for your next major release.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/ads"
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs shadow-lg shadow-orange-500/20 transition-all"
                >
                  Launch Campaign ($1,199)
                </Link>
                <a
                  href="mailto:support@indihunt.in?subject=IndiHunt%20Sponsorship%20Inquiry"
                  className="px-6 py-3 rounded-xl bg-card border border-border hover:border-orange-500/40 text-foreground font-medium text-xs transition-all"
                >
                  Contact Sponsorship Team
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
