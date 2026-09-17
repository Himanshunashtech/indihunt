"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Rocket,
  Tag,
  CheckCircle,
  Monitor,
  Video,
  FileText,
  Share2,
  HelpCircle,
  Plus,
  Trash2
} from "lucide-react";
import {
  supabase,
  getProductById,
  rescheduleProductLaunch,
  getProductShoutoutsGiven,
  getComments,
  Product,
  Comment,
  ProductShoutout,
  getProductSlug,
  deleteProductByUser
} from "@/lib/supabase";
import { Github, Facebook, Linkedin, Twitter } from "@/components/icons";
import DatePickerModal from "@/components/DatePickerModal";
import SuccessScheduledModal from "@/components/SuccessScheduledModal";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";

export default function PreLaunchDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [shoutoutsGiven, setShoutoutsGiven] = useState<ProductShoutout[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState("Calculating...");

  // Modal States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user || null);
      });
    }
  }, []);

  const loadData = async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const prod = await getProductById(productId);
      if (prod) {
        setProduct(prod);
        const shoutouts = await getProductShoutoutsGiven(prod.id);
        setShoutoutsGiven(shoutouts);
        const productComments = await getComments(prod.id);
        setComments(productComments);
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.error("Error loading pre-launch product:", err);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  // Live Countdown logic
  useEffect(() => {
    if (!product) return;

    if (!product.scheduled_for) {
      setTimeLeft("Launched & Live");
      return;
    }

    const updateCountdown = () => {
      const scheduledTime = new Date(product.scheduled_for!).getTime();
      const now = new Date().getTime();
      const diff = scheduledTime - now;

      if (diff <= 0) {
        setTimeLeft("Launched & Live");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours} hours : ${minutes} minutes`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // update every minute
    return () => clearInterval(interval);
  }, [product?.scheduled_for]);

  const handleReschedule = async (date: Date) => {
    setIsDatePickerOpen(false);
    const success = await rescheduleProductLaunch(product?.id || productId, date.toISOString());
    if (success) {
      setIsSuccessOpen(true);
      await loadData();
    }
  };

  const handleCopyLink = (platform: "twitter" | "linkedin") => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/products/${product ? getProductSlug(product.name) : productId}` : "";
    navigator.clipboard.writeText(shareUrl);
    alert(`Link copied for ${platform === "twitter" ? "X (Twitter)" : "LinkedIn"}!`);
  };

  const handleDeleteProduct = async () => {
    if (!product || !user) return;

    const confirmDelete = window.confirm("Are you sure you want to permanently delete this scheduled product launch? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const success = await deleteProductByUser(product.id, user.id);
      if (success) {
        alert("Your product launch has been successfully deleted.");
        router.push("/my-products");
      } else {
        alert("Failed to delete the product launch. Please make sure you are the owner and the product has not launched yet.");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("An error occurred while deleting the product.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <CircularLoader label="Loading Pre-Launch Dashboard..." size="lg" center={false} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center max-w-lg mx-auto space-y-4 pt-24">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto border border-orange-500/20">
            <Rocket className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Launch Not Found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We couldn't locate this product launch. It may have been renamed, removed, or the link may be incomplete.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Explore Products
            </Link>
            <Link
              href="/my-products"
              className="inline-flex items-center gap-2 bg-card hover:bg-muted border border-border text-foreground text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              My Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Pre-Launch checklist helper variables
  const hasShoutouts = shoutoutsGiven.length > 0;
  const hasVideo = !!product.video_url;
  const hasFirstComment = comments.some(c => c.user_id === product.maker_id);
  const hasCategories = false; // Mock or check category logic if present
  const hasAdditionalMakers = product.makers && product.makers.length > 0;
  const isOwner = user && product && (user.id === product.maker_id);
  const isLaunched = !product.scheduled_for || (new Date(product.scheduled_for).getTime() <= Date.now());
  const isBeforeLaunch = !isLaunched;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pb-20 pt-15 sm:pt-30 space-y-6">

        {/* Live Banner if already launched */}
        {isLaunched && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 shadow-sm">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <span>This product is live on IndiHunt! You can view the live page, test embeds, and share across social channels.</span>
            </div>
            <Link
              href={`/products/${getProductSlug(product.name)}`}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-colors flex-shrink-0 shadow-sm"
            >
              <span>View Live Product</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <div className="text-[10px] text-muted-foreground font-semibold tracking-wider flex items-center gap-2 select-none uppercase">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>&gt;</span>
          <Link href={`/products/${getProductSlug(product.name)}`} className="hover:text-foreground">{product.name}</Link>
          <span>&gt;</span>
          <span className="text-foreground">Pre-Launch Dashboard</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">

          {/* Left Columns - Tasks & Action Promoters */}
          <div className="lg:col-span-2 space-y-8">

            {/* Dashboard Title & Product Details Header */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground/90 leading-tight">Pre-Launch Dashboard</h1>
              </div>

              {/* Product Details Header Card */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center font-medium text-lg text-orange-500 border border-orange-500/15 overflow-hidden flex-shrink-0">
                  {product.logo_url ? (
                    <img src={product.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    product.name.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="text-base font-medium text-foreground/90">{product.name}</h2>
                  <p className="text-base text-foreground/80 leading-relaxed mt-0.5">{product.tagline}</p>
                </div>
              </div>
            </div>

            {/* Time until launch */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Time until launch</span>
              <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {timeLeft}
              </div>
            </div>

            {/* Checklist Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Strongly Encouraged */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium text-foreground/90 mb-1">Strongly Encouraged</h3>
                  <p className="text-base text-foreground/80 leading-relaxed">These are critical to give your product launch the most visibility.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                    <CheckCircle className={`w-4.5 h-4.5 ${hasShoutouts ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span>Shoutouts</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                    <CheckCircle className={`w-4.5 h-4.5 ${hasVideo ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span>Video / Loom</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                    <CheckCircle className={`w-4.5 h-4.5 ${hasFirstComment ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span>Write the first comment</span>
                  </div>
                </div>
              </div>

              {/* Add some extra info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium text-foreground/90 mb-1">Add some extra information</h3>
                  <p className="text-base text-foreground/80 leading-relaxed">Go the extra mile and add suggested information. Successful launches usually do.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                    <CheckCircle className={`w-4.5 h-4.5 ${hasCategories ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span>Product categories</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                    <CheckCircle className={`w-4.5 h-4.5 ${hasAdditionalMakers ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span>Additional Makers</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Promote & Community Forums Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border/40">

              {/* Promote on Website */}
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground/90">Promote on your website</h3>
                <p className="text-base text-foreground/80 leading-relaxed">
                  Easily add badges and embeds to your website to drive additional support for your IndiHunt launch.
                </p>
                <button
                  onClick={() => setShowEmbedModal(true)}
                  className="bg-card hover:bg-muted border border-border text-foreground font-medium text-xs sm:text-sm px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Add badge to your website
                </button>
              </div>

              {/* Forum Thread */}
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground/90">Start a forum thread</h3>
                <p className="text-base text-foreground/80 leading-relaxed">
                  Build anticipation by starting discussions in your product forum. Share your vision, gather early feedback, and create buzz before your launch.
                </p>
                <Link
                  href="/new"
                  className="inline-block bg-card hover:bg-muted border border-border text-foreground font-medium text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  Start new thread
                </Link>
              </div>

            </div>

            {/* Leaderboard promo banner */}
            <div className="p-5 bg-orange-500/5 border border-orange-500/10 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-base font-medium text-foreground/90 block">Promote your product</span>
                <p className="text-base text-foreground/80 leading-relaxed max-w-lg">
                  Want additional exposure for {product.name}? Start an ad campaign with as little as $1,199 to promote your product across IndiHunt feeds and leaderboards.
                </p>
              </div>
              <Link
                href={`/ads?product_id=${product.id}`}
                className="bg-[#ff5733] hover:bg-[#e64a19] text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-xl transition-all cursor-pointer flex-shrink-0 block text-center shadow-sm"
              >
                Get started
              </Link>
            </div>

          </div>


          {/* Right Sidebar - Status, Rescheduling & Support */}
          <div className="space-y-6 ">


            {/* Status card */}
            <div className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Launch status</span>
                {isLaunched ? (
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live on IndiHunt
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/15 px-2.5 py-1 rounded-full inline-block uppercase tracking-wider">
                    Scheduled
                  </span>
                )}
              </div>

              {isLaunched ? (
                <Link
                  href={`/my-products/${product?.id || productId}/settings`}
                  className="block w-full bg-card hover:bg-muted border border-border text-foreground font-medium text-xs sm:text-sm py-2.5 rounded-xl transition-all shadow-sm text-center"
                >
                  Manage Launch Settings
                </Link>
              ) : (
                <button
                  onClick={() => setIsDatePickerOpen(true)}
                  className="w-full bg-card hover:bg-muted border border-border text-foreground font-medium text-xs sm:text-sm py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                >
                  Reschedule Launch
                </button>
              )}

              <div className="border-t border-border/40 pt-4 space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Actions</span>
                <div className="space-y-2 text-xs sm:text-sm font-medium text-foreground/80">
                  <Link href={`/products/${product ? getProductSlug(product.name) : productId}`} className="flex items-center gap-2 hover:text-[#ff5733]">
                    <Rocket className="w-3.5 h-3.5" />
                    <span>View launch</span>
                  </Link>
                  <Link href={`/my-products/${product?.id || productId}/settings`} className="flex items-center gap-2 hover:text-[#ff5733]">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>Edit launch</span>
                  </Link>
                  {isOwner && isBeforeLaunch && (
                    <button
                      onClick={handleDeleteProduct}
                      className="flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer w-full text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete launch</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Social Posts Share link card */}
            <div className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-sm">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Prep your social posts</span>
                <p className="text-base text-foreground/80 leading-relaxed">
                  Use the links below when scheduling your social posts to track engagement and votes.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 p-2 bg-muted/20 border border-border rounded-2xl">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                    <Twitter className="w-4 h-4 text-foreground" />
                    <span>𝕏 (Twitter)</span>
                  </div>
                  <button
                    onClick={() => handleCopyLink("twitter")}
                    className="bg-card hover:bg-muted border border-border text-foreground font-medium text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 p-2 bg-muted/20 border border-border rounded-2xl">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                    <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                    <span>LinkedIn</span>
                  </div>
                  <button
                    onClick={() => handleCopyLink("linkedin")}
                    className="bg-card hover:bg-muted border border-border text-foreground font-medium text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>

            {/* Need Help card */}
            <div className="p-5 bg-card border border-border rounded-3xl space-y-2 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Need help?</span>
              <p className="text-base text-foreground/80 leading-relaxed">
                You can reach us at <strong className="text-foreground font-medium">hello@indihunt.com</strong> or using the chat bubble in the bottom right of the screen.
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={handleReschedule}
        currentSelectedDate={product.scheduled_for ? new Date(product.scheduled_for) : undefined}
      />

      {/* Success Scheduled Modal */}
      <SuccessScheduledModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />

      {/* Embed Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <h3 className="text-base font-semibold text-foreground">Product Embed Badge</h3>
            <p className="text-xs text-muted-foreground">Show off your launch on your own website! Copy the HTML snippet below to embed the IndiHunt badge.</p>

            <div className="bg-muted/40 border border-border p-4 rounded-2xl flex justify-center items-center">
              <div className="bg-background border border-orange-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3 select-none">
                <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 border border-border/30 bg-muted flex items-center justify-center">
                  <img src="/logo.webp" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block text-muted-foreground">Featured on</span>
                  <span className="text-xs font-bold text-foreground">INDIHUNT</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">HTML Code</span>
              <div className="relative">
                <textarea
                  readOnly
                  value={`<a href="${typeof window !== 'undefined' ? window.location.origin : ''}/products/${getProductSlug(product.name)}" target="_blank"><img src="${typeof window !== 'undefined' ? window.location.origin : ''}/t/embed?id=${product.id}&style=classic" alt="${product.name} on IndiHunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>`}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[10px] font-mono text-muted-foreground resize-none focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`<a href="${window.location.origin}/products/${getProductSlug(product.name)}" target="_blank"><img src="${window.location.origin}/t/embed?id=${product.id}&style=classic" alt="${product.name} on IndiHunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>`);
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
                onClick={() => setShowEmbedModal(false)}
                className="bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
