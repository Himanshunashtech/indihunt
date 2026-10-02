"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Favicon from "@/components/Favicon";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Star,
  Sparkles,
  HelpCircle,
  Layers,
  ChevronRight,
  Search,
  CheckCircle,
  ThumbsUp,
  AlertCircle
} from "lucide-react";
import {
  supabase,
  getProductById,
  addReview,
  getProducts,
  getCachedProducts,
  Product,
  Profile,
  checkContentViolation
} from "@/lib/supabase";

export default function ReviewWizardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams() as { id: string };

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Steps
  const [activeStep, setActiveStep] = useState<"create" | "ai" | "ratings">("create");

  // Review Form States
  const [overallRating, setOverallRating] = useState<number>(5);
  
  // Pros
  const [selectedPros, setSelectedPros] = useState<string[]>([]);
  const [prosText, setProsText] = useState("");
  const [showCustomProInput, setShowCustomProInput] = useState(false);
  const [customProVal, setCustomProVal] = useState("");

  // Cons
  const [selectedCons, setSelectedCons] = useState<string[]>([]);
  const [consText, setConsText] = useState("");
  const [showCustomConInput, setShowCustomConInput] = useState(false);
  const [customConVal, setCustomConVal] = useState("");

  // Alternatives / AI Questions
  const [compareSearch, setCompareSearch] = useState("");
  const [selectedCompareProduct, setSelectedCompareProduct] = useState<Product | null>(null);
  const [compareText, setCompareText] = useState("");
  const [showCompareDropdown, setShowCompareDropdown] = useState(false);

  // Ratings
  const [ratingEasyToUse, setRatingEasyToUse] = useState<number>(5);
  const [ratingCustomizable, setRatingCustomizable] = useState<number>(5);
  const [ratingReliable, setRatingReliable] = useState<number>(5);
  const [ratingValueForMoney, setRatingValueForMoney] = useState<number>(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Default Tag Options
  const DEFAULT_PRO_TAGS = [
    "simplicity",
    "user friendly interface",
    "marketing email support",
    "transactional email support",
    "fast setup",
    "automation features",
    "developer friendly",
    "clean UX",
    "responsive support",
    "excellent customer service"
  ];

  const DEFAULT_CON_TAGS = [
    "focus on SaaS companies",
    "buggy UI/UX",
    "customer service",
    "lack of undo command",
    "limited features for non-SaaS businesses",
    "no API client packages"
  ];

  useEffect(() => {
    // Auth & Product check
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
        }
      });
    }

    // Load product
    getProductById(id).then((p) => {
      if (p) {
        setProduct(p);
      }
      setLoading(false);
    });

    // Load other products for comparison
    const cachedProds = getCachedProducts();
    if (cachedProds && cachedProds.length > 0) {
      setAllProducts(cachedProds);
    } else {
      getProducts().then((list) => {
        if (list) {
          setAllProducts(list);
        }
      });
    }
  }, [id]);

  const handleProTagToggle = (tag: string) => {
    if (selectedPros.includes(tag)) {
      setSelectedPros(selectedPros.filter(t => t !== tag));
    } else {
      setSelectedPros([...selectedPros, tag]);
    }
  };

  const handleConTagToggle = (tag: string) => {
    if (selectedCons.includes(tag)) {
      setSelectedCons(selectedCons.filter(t => t !== tag));
    } else {
      setSelectedCons([...selectedCons, tag]);
    }
  };

  const addCustomPro = () => {
    if (customProVal.trim() && !selectedPros.includes(customProVal.trim())) {
      setSelectedPros([...selectedPros, customProVal.trim()]);
      setCustomProVal("");
      setShowCustomProInput(false);
    }
  };

  const addCustomCon = () => {
    if (customConVal.trim() && !selectedCons.includes(customConVal.trim())) {
      setSelectedCons([...selectedCons, customConVal.trim()]);
      setCustomConVal("");
      setShowCustomConInput(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setErrorMsg("You must be logged in to submit a review.");
      return;
    }
    if (!product) return;

    const prosViolation = checkContentViolation(prosText);
    if (prosViolation.hasViolation) {
      setErrorMsg("Pros field contains a violation. " + prosViolation.message);
      return;
    }

    const consViolation = checkContentViolation(consText);
    if (consViolation.hasViolation) {
      setErrorMsg("Cons field contains a violation. " + consViolation.message);
      return;
    }

    const compareViolation = checkContentViolation(compareText);
    if (compareViolation.hasViolation) {
      setErrorMsg("Comparison field contains a violation. " + compareViolation.message);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    // Combine pros/cons text with main description to form the main review body
    let finalBody = "";
    if (prosText.trim()) {
      finalBody += `**Why it's fantastic:**\n${prosText.trim()}\n\n`;
    }
    if (consText.trim()) {
      finalBody += `**What can be improved:**\n${consText.trim()}`;
    }
    if (!finalBody.trim()) {
      finalBody = `Reviewed ${product.name} with an overall rating of ${overallRating}/5 stars.`;
    }

    const reviewDetails = {
      easy_to_use: ratingEasyToUse,
      customizable: ratingCustomizable,
      reliable: ratingReliable,
      value_for_money: ratingValueForMoney,
      pros: selectedPros,
      cons: selectedCons,
      alternatives_vs: compareText.trim() ? `Compared with ${selectedCompareProduct?.name || 'alternatives'}: ${compareText.trim()}` : undefined
    };

    try {
      const added = await addReview(
        product.id,
        user.id,
        overallRating,
        finalBody,
        reviewDetails
      );

      if (added) {
        // Optimistically update reviews cache with setQueryData instead of invalidating
        queryClient.setQueryData(["reviews", product.id], (old: any) => {
          if (!Array.isArray(old)) return [added];
          return [added, ...old.filter((r: any) => r.id !== added.id)];
        });

        setSuccess(true);
        setTimeout(() => {
          router.push(`/products/${id}?tab=Reviews`);
        }, 2000);
      } else {
        setErrorMsg("Failed to submit the review. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <h2 className="text-lg font-semibold text-foreground">Product Not Found</h2>
        <Link href="/" className="mt-4 text-xs font-semibold text-orange-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const filteredCompareProducts = allProducts.filter(p =>
    p.id !== product.id &&
    p.name.toLowerCase().includes(compareSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-6 px-6 pt-36 sm:pt-42 pb-12">
        {/* Left Sidebar Product Info */}
        <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl border border-border/80 bg-muted overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                <Favicon src={product.logo_url} websiteUrl={product.website_url} size={48} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-bold text-base tracking-tight text-foreground truncate max-w-[180px]">
                  {product.name}
                </h2>
                <div className="flex items-center gap-1 mt-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {product.upvotes_count ? (4.5 + (product.upvotes_count % 5) * 0.1).toFixed(1) : "5.0"}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {product.tagline}
            </p>
          </div>

          {/* Steps Navigation Sidebar */}
          <nav className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-1.5">
            <button
              onClick={() => setActiveStep("create")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeStep === "create"
                  ? "bg-muted text-foreground font-semibold border border-border/80"
                  : "hover:bg-muted/60 text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className={`w-4 h-4 ${activeStep === "create" ? "fill-foreground text-foreground" : ""}`} />
                <span className="text-base font-medium">Create a review</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveStep("ai")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeStep === "ai"
                  ? "bg-muted text-foreground font-semibold border border-border/80"
                  : "hover:bg-muted/60 text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span className="text-base font-medium">AI Questions</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => setActiveStep("ratings")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeStep === "ratings"
                  ? "bg-muted text-foreground font-semibold border border-border/80"
                  : "hover:bg-muted/60 text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span className="text-base font-medium">Ratings</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          </nav>
        </aside>

        {/* Right Main Wizard Card */}
        <main className="flex-1 bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[500px]">
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle className="w-16 h-16 text-emerald-500 animate-bounce" />
              <h3 className="text-xl font-semibold text-foreground">Review Submitted!</h3>
              <p className="text-xs text-muted-foreground">
                Thank you for reviewing {product.name}. Redirecting back...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Alert */}
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: CREATE A REVIEW */}
              {activeStep === "create" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground">Create a review</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tell the community how you use it, what you like about it, and what can be improved.
                    </p>
                  </div>

                  {/* Overall Rating */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      How would you rate it overall?
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setOverallRating(star)}
                          className="text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-8 h-8 ${star <= overallRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Why it's fantastic (Pros) */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Why is it fantastic?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_PRO_TAGS.map((tag) => {
                        const active = selectedPros.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleProTagToggle(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                              active
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            + {tag}
                          </button>
                        );
                      })}
                      {showCustomProInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customProVal}
                            onChange={(e) => setCustomProVal(e.target.value)}
                            placeholder="Add feature..."
                            className="bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 shadow-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addCustomPro();
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={addCustomPro}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCustomProInput(true)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          + Add features
                        </button>
                      )}
                    </div>
                    <textarea
                      value={prosText}
                      onChange={(e) => setProsText(e.target.value)}
                      placeholder="Tell us why this product is fantastic, what standout features you love, and your day-to-day experience..."
                      rows={6}
                      className="w-full bg-background border border-border rounded-2xl p-5 text-base sm:text-base text-foreground focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 resize-y min-h-[180px] leading-relaxed shadow-xs transition-all"
                    />
                  </div>

                  {/* What can be improved (Cons) */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      What can be improved?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_CON_TAGS.map((tag) => {
                        const active = selectedCons.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleConTagToggle(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                              active
                                ? "bg-red-500/15 text-red-500 border-red-500/30"
                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            - {tag}
                          </button>
                        );
                      })}
                      {showCustomConInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customConVal}
                            onChange={(e) => setCustomConVal(e.target.value)}
                            placeholder="Add improvement..."
                            className="bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500 shadow-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addCustomCon();
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={addCustomCon}
                            className="text-xs font-bold text-red-500 hover:underline px-2 py-1"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCustomConInput(true)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-500 border border-dashed border-red-500/30 hover:bg-red-500/5 cursor-pointer"
                        >
                          + Add improvements
                        </button>
                      )}
                    </div>
                    <textarea
                      value={consText}
                      onChange={(e) => setConsText(e.target.value)}
                      placeholder="Tell us what could be improved, missing functionality, or challenges you encountered..."
                      rows={6}
                      className="w-full bg-background border border-border rounded-2xl p-5 text-base sm:text-base text-foreground focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 resize-y min-h-[180px] leading-relaxed shadow-xs transition-all"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: AI QUESTIONS / COMPARISON */}
              {activeStep === "ai" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" /> What else did you consider?
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tell us why you chose {product.name} over alternative solutions.
                    </p>
                  </div>

                  {/* Product Search & Compare */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                      Search for products to compare
                    </label>
                    {selectedCompareProduct ? (
                      <div className="flex items-center justify-between bg-muted/40 border border-border rounded-2xl px-4 py-3.5 text-sm font-semibold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-border bg-card flex items-center justify-center flex-shrink-0">
                            <Favicon src={selectedCompareProduct.logo_url} websiteUrl={selectedCompareProduct.website_url} size={48} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span>{selectedCompareProduct.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCompareProduct(null)}
                          className="text-xs text-muted-foreground hover:text-foreground font-extrabold cursor-pointer px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <input
                            type="text"
                            placeholder="Type product name (e.g. Supabase, Neon)..."
                            value={compareSearch}
                            onChange={(e) => {
                              setCompareSearch(e.target.value);
                              setShowCompareDropdown(true);
                            }}
                            onFocus={() => setShowCompareDropdown(true)}
                            className="w-full bg-background border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-orange-500 shadow-xs"
                          />
                        </div>
                        {showCompareDropdown && compareSearch && (
                          <div className="absolute left-0 right-0 mt-1.5 bg-card border border-border rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-border/60">
                            {filteredCompareProducts.length > 0 ? (
                              filteredCompareProducts.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCompareProduct(p);
                                    setShowCompareDropdown(false);
                                    setCompareSearch("");
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-muted text-xs font-medium text-foreground flex items-center gap-3 transition-colors cursor-pointer"
                                >
                                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center flex-shrink-0">
                                    <Favicon src={p.logo_url} websiteUrl={p.website_url} size={48} alt={p.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <span className="block font-semibold text-foreground">{p.name}</span>
                                    <span className="block text-[10px] text-muted-foreground truncate max-w-[280px]">
                                      {p.tagline}
                                    </span>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-xs text-muted-foreground italic text-center">
                                No alternative products found.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Compare Explanation */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Why did you choose {product.name} over other alternatives?
                    </label>
                    <textarea
                      value={compareText}
                      onChange={(e) => setCompareText(e.target.value)}
                      placeholder={`Tell us why you chose ${product.name} over ${selectedCompareProduct ? selectedCompareProduct.name : 'other alternatives'}...`}
                      rows={8}
                      className="w-full bg-background border border-border rounded-2xl p-5 text-base sm:text-base text-foreground focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 resize-y min-h-[200px] font-normal leading-relaxed shadow-xs transition-all"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: RATINGS */}
              {activeStep === "ratings" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground">Ratings</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rate different aspects of {product.name} to help others understand your experience.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Easy to use */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/20 border border-border/80 rounded-2xl">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">How easy is it to use?</span>
                        <span className="text-[10px] text-muted-foreground">User friendliness and UI clean layout.</span>
                      </div>
                      <div className="flex gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingEasyToUse(star)}
                            className="hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`w-6 h-6 ${star <= ratingEasyToUse ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customizable */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/20 border border-border/80 rounded-2xl">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">How customizable is it?</span>
                        <span className="text-[10px] text-muted-foreground">Settings, extensions, custom setups.</span>
                      </div>
                      <div className="flex gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingCustomizable(star)}
                            className="hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`w-6 h-6 ${star <= ratingCustomizable ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reliable */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/20 border border-border/80 rounded-2xl">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">How reliable is it?</span>
                        <span className="text-[10px] text-muted-foreground">Uptime, performance speed, bug-free codebase.</span>
                      </div>
                      <div className="flex gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingReliable(star)}
                            className="hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`w-6 h-6 ${star <= ratingReliable ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Value for money */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/20 border border-border/80 rounded-2xl">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">Value for money / time?</span>
                        <span className="text-[10px] text-muted-foreground">Is the return worth the price and integrations?</span>
                      </div>
                      <div className="flex gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingValueForMoney(star)}
                            className="hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`w-6 h-6 ${star <= ratingValueForMoney ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons footer */}
          {!success && (
            <div className="flex justify-between items-center pt-6 border-t border-border/60 mt-8">
              {activeStep === "create" ? (
                <button
                  type="button"
                  onClick={() => router.push(`/products/${id}`)}
                  className="px-4 py-2.5 bg-muted text-foreground text-xs font-semibold rounded-xl cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep === "ratings") setActiveStep("ai");
                    else if (activeStep === "ai") setActiveStep("create");
                  }}
                  className="px-4 py-2.5 bg-muted text-foreground text-xs font-semibold rounded-xl cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  Back
                </button>
              )}

              {activeStep === "create" ? (
                <button
                  type="button"
                  onClick={() => setActiveStep("ai")}
                  className="px-5 py-2.5 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer flex items-center gap-1"
                >
                  Next: AI Questions <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : activeStep === "ai" ? (
                <button
                  type="button"
                  onClick={() => setActiveStep("ratings")}
                  className="px-5 py-2.5 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer flex items-center gap-1"
                >
                  Next: Ratings <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-md shadow-orange-500/10"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
