"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, X, Sparkles, Megaphone, Loader2, Upload, Search, Check, RefreshCw } from "lucide-react";
import { adminCreateSponsoredAd, adminGetAvailableProducts } from "@/app/admin/_actions/admin-actions";
import { createAdCampaign, uploadBillboardImage } from "@/lib/supabase";
import { useAdminToast } from "@/app/admin/_components/AdminToastProvider";

interface ProductOption {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  slug?: string;
}

export function CreateAdModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const toast = useAdminToast();

  // Products pagination state (30 at a time)
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [productPage, setProductPage] = useState<number>(1);
  const [hasMoreProducts, setHasMoreProducts] = useState<boolean>(false);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [productSearch, setProductSearch] = useState<string>("");
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [ctaText, setCtaText] = useState("Visit Product");
  const [logoUrl, setLogoUrl] = useState("");
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [targetImpressions, setTargetImpressions] = useState<number>(50000);
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [targetDevice, setTargetDevice] = useState<"all" | "desktop" | "mobile">("all");

  // Placements
  const [placementProductPages, setPlacementProductPages] = useState(true);
  const [placementFeed, setPlacementFeed] = useState(true);
  const [placementSearch, setPlacementSearch] = useState(true);
  const [placementCategory, setPlacementCategory] = useState(true);
  const [placementForums, setPlacementForums] = useState(true);

  // Fetch 30 products at a time (server action with local fallback)
  const fetchProductsBatch = async (page: number, search: string, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingProducts(true);
    }

    try {
      // 1. Fetch via server action
      const res = await adminGetAvailableProducts(page, 30, search);
      if (res && res.products && res.products.length > 0) {
        if (append) {
          setAvailableProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = res.products.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newOnes];
          });
        } else {
          setAvailableProducts(res.products);
        }
        setTotalProductsCount(res.totalCount);
        setHasMoreProducts(res.hasMore);
        setProductPage(page);
        return;
      }

      // 2. Local fallback if offline or in local dev
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("indihunt_products") || "[]";
        try {
          const allLocal: any[] = JSON.parse(raw);
          const filtered = allLocal.filter((p) => {
            if (p.is_deleted === true) return false;
            if (search.trim()) {
              const q = search.toLowerCase().trim();
              const n = (p.name || "").toLowerCase();
              const t = (p.tagline || "").toLowerCase();
              return n.includes(q) || t.includes(q);
            }
            return true;
          });

          const offset = (page - 1) * 30;
          const slice = filtered.slice(offset, offset + 30);
          const hasMore = offset + slice.length < filtered.length;

          if (append) {
            setAvailableProducts((prev) => [...prev, ...slice]);
          } else {
            setAvailableProducts(slice);
          }
          setTotalProductsCount(filtered.length);
          setHasMoreProducts(hasMore);
          setProductPage(page);
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load products batch:", err);
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingMore(false);
    }
  };

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen && availableProducts.length === 0) {
      fetchProductsBatch(1, "", false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchProductsBatch(1, productSearch, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleLoadMore = () => {
    fetchProductsBatch(productPage + 1, productSearch, true);
  };

  // Auto-fill when a product is selected
  const handleProductSelect = (prod: ProductOption) => {
    setSelectedProductId(prod.id);
    setName(prod.name || "");
    setHeadline(prod.tagline || "");
    setDescription(prod.description ? prod.description.slice(0, 150) : "");
    setDestinationUrl(prod.slug ? `/products/${prod.slug}` : (prod.website_url || `/products/${prod.id}`));
    if (prod.logo_url) setLogoUrl(prod.logo_url);
    toast.success(`Selected "${prod.name}" - details auto-filled!`);
  };

  // Upload image handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadBillboardImage(file);
      if (uploadedUrl) {
        setLogoUrl(uploadedUrl);
        toast.success("Ad image uploaded successfully!");
      } else {
        toast.error("Failed to upload image.");
      }
    } catch (err: any) {
      toast.error(`Image upload failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Budget input
  const handleBudgetChange = (val: number) => {
    setTotalBudget(val);
    if (val > 0) {
      setTargetImpressions(Math.round((val / 10) * 1000));
    }
  };

  const resetForm = () => {
    setSelectedProductId("");
    setName("");
    setHeadline("");
    setDescription("");
    setDestinationUrl("");
    setCtaText("Visit Product");
    setLogoUrl("");
    setTotalBudget(0);
    setTargetImpressions(50000);
    setStatus("active");
    setTargetDevice("all");
    setPlacementProductPages(true);
    setPlacementFeed(true);
    setPlacementSearch(true);
    setPlacementCategory(true);
    setPlacementForums(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a campaign name.");
      return;
    }
    if (!destinationUrl.trim()) {
      toast.error("Please enter a destination URL.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        headline: headline.trim() || name.trim(),
        description: description.trim() || headline.trim() || name.trim(),
        destination_url: destinationUrl.trim(),
        cta_text: ctaText.trim() || "Visit Product",
        logo_url: logoUrl.trim() || undefined,
        product_id: selectedProductId || null,
        total_budget: Number(totalBudget) || 0,
        target_impressions: Number(targetImpressions) || 50000,
        status,
        placement_product_pages: placementProductPages,
        placement_feed: placementFeed,
        placement_search: placementSearch,
        placement_category: placementCategory,
        placement_forums: placementForums,
        target_device: targetDevice,
      };

      // 1. Call Server Action
      const result = await adminCreateSponsoredAd(payload);

      // 2. Save to localStorage fallback on client for offline/local dev support
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("indihunt_ad_campaigns") || "[]";
          const list = JSON.parse(cached);
          const generatedId = result?.data?.id || `ad-${Date.now()}`;
          const newCamp = {
            ...payload,
            id: generatedId,
            user_id: result?.data?.user_id || "admin",
            daily_limit: Math.max(10, payload.total_budget),
            cpm_rate: 10.0,
            delivered_impressions: 0,
            impressions: 0,
            clicks: 0,
            start_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          list.unshift(newCamp);
          localStorage.setItem("indihunt_ad_campaigns", JSON.stringify(list));
        } catch {}
      }

      if (result.success) {
        toast.success(`Sponsored Ad "${name}" created and launched successfully!`);
        resetForm();
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(`Error creating ad: ${result.error || "Unknown server error"}`);
      }
    } catch (err: any) {
      toast.error(`Unexpected error: ${err?.message || "Something went wrong"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview hostname
  const previewHostname = (() => {
    try {
      if (!destinationUrl) return "example.com";
      if (destinationUrl.startsWith("/")) return "indihunt.in";
      return new URL(destinationUrl.startsWith("http") ? destinationUrl : `https://${destinationUrl}`).hostname;
    } catch {
      return "example.com";
    }
  })();

  const previewLogo = logoUrl || (previewHostname !== "example.com" ? `https://www.google.com/s2/favicons?domain=${previewHostname}&sz=128` : "/logo.webp");

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow-purple-500/20 active:scale-95"
      >
        <Plus className="w-4 h-4" />
        Create Sponsored Ad
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <Megaphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create Sponsored Ad</h2>
                  <p className="text-xs text-slate-500">Admin direct creation with custom or ₹0 payment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              {/* Payment Info Banner */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/60 rounded-xl p-3.5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-purple-900 leading-relaxed">
                  <span className="font-bold">Zero Payment Gateway Friction:</span> As admin, you can create sponsored ads with <span className="font-semibold underline">any payment amount</span> (including <span className="font-bold text-purple-700">₹0 Free/Complimentary</span> for platform partners or custom budgets). It will be activated immediately!
                </div>
              </div>

              {/* Product Selection Section: Loads 30 at a time across ALL products */}
              <div className="space-y-2">
                {selectedProductId ? (
                  <div className="bg-purple-50/90 border border-purple-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-purple-200 flex items-center justify-center overflow-hidden flex-shrink-0 p-0.5">
                        <Image
                          src={logoUrl || "/logo.webp"}
                          alt={name || "Product"}
                          width={32}
                          height={32}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-purple-950 truncate flex items-center gap-1.5">
                          <span>Linked: {name}</span>
                          <span className="text-[10px] font-semibold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">Auto-filled</span>
                        </div>
                        <div className="text-[11px] text-purple-700 truncate">{headline || "Product linked to campaign"}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProductId("")}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition-colors whitespace-nowrap"
                    >
                      Change Product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                        Auto-Fill From Available Products ({totalProductsCount > 0 ? `${totalProductsCount} total` : "All Products"})
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Loads 30 at a time
                      </span>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search 400+ products by name or tagline..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                      />
                      {productSearch && (
                        <button
                          type="button"
                          onClick={() => setProductSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Scrollable list of products */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {isLoadingProducts ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          <span>Loading available products...</span>
                        </div>
                      ) : availableProducts.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          No products found matching &ldquo;{productSearch}&rdquo;. You can also enter custom details manually below!
                        </div>
                      ) : (
                        <>
                          {availableProducts.map((p) => {
                            const prodLogo = p.logo_url || (p.website_url ? `https://www.google.com/s2/favicons?domain=${new URL(p.website_url.startsWith("http") ? p.website_url : `https://${p.website_url}`).hostname}&sz=64` : "/logo.webp");
                            return (
                              <div
                                key={p.id}
                                onClick={() => handleProductSelect(p)}
                                className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-purple-50/60 cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden p-0.5">
                                    <Image
                                      src={prodLogo}
                                      alt={p.name}
                                      width={24}
                                      height={24}
                                      unoptimized
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-purple-700">{p.name}</div>
                                    <div className="text-[11px] text-slate-500 truncate">{p.tagline || "Available on platform"}</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="text-[11px] font-semibold text-purple-600 bg-purple-50 group-hover:bg-purple-100 px-2 py-1 rounded-md transition-colors flex-shrink-0"
                                >
                                  Select
                                </button>
                              </div>
                            );
                          })}

                          {/* Load Next 30 Products Button */}
                          {hasMoreProducts && (
                            <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
                              <button
                                type="button"
                                disabled={isLoadingMore}
                                onClick={handleLoadMore}
                                className="w-full py-1.5 px-3 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
                              >
                                {isLoadingMore ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                                    <span>Loading next 30 products...</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Load Next 30 Products (Showing {availableProducts.length} of {totalProductsCount || "400+"})</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ad Title & Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Campaign / Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Supabase Database"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Headline / Tagline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Build in a weekend, scale to millions"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Destination URL & CTA Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Destination URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://supabase.com or /products/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Visit Product, Try Free, Learn More"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Description / Body (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="The open source Firebase alternative with PostgreSQL, Auth, and Edge Functions."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                />
              </div>

              {/* Logo / Image URL & Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Logo / Banner Image URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png or upload below"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors">
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" /> : <Upload className="w-3.5 h-3.5 text-purple-600" />}
                    <span>{isUploading ? "Uploading..." : "Upload"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>

              {/* Payment & Impressions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Payment / Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={totalBudget}
                    onChange={(e) => handleBudgetChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <p className="text-[10px] text-slate-500">₹0 = Free/Partner ad</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Target Impressions
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="1000"
                    value={targetImpressions}
                    onChange={(e) => setTargetImpressions(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <p className="text-[10px] text-slate-500">Cap before auto-complete</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Target Device
                  </label>
                  <select
                    value={targetDevice}
                    onChange={(e) => setTargetDevice(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="all">All Devices</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile Only</option>
                  </select>
                  <p className="text-[10px] text-slate-500">Audience filter</p>
                </div>
              </div>

              {/* Placements */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Ad Placements
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={placementProductPages}
                      onChange={(e) => setPlacementProductPages(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    Product Pages
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={placementFeed}
                      onChange={(e) => setPlacementFeed(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    Home Feed
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={placementSearch}
                      onChange={(e) => setPlacementSearch(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    Search Results
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={placementCategory}
                      onChange={(e) => setPlacementCategory(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    Categories
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={placementForums}
                      onChange={(e) => setPlacementForums(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    Forums & Stories
                  </label>
                </div>
              </div>

              {/* Status Radio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="ad_status"
                      value="active"
                      checked={status === "active"}
                      onChange={() => setStatus("active")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-emerald-600 font-bold">Active (Launch Immediately)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="ad_status"
                      value="paused"
                      checked={status === "paused"}
                      onChange={() => setStatus("paused")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-amber-600 font-bold">Paused (Save as Draft)</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Live Banner Preview
                </div>
                <div className="relative w-full bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden shadow-xs">
                  <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center p-1">
                      <Image
                        src={previewLogo}
                        alt={name || "Ad Preview"}
                        className="w-full h-full object-contain"
                        width={44}
                        height={44}
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900 text-sm block truncate">
                        {name || "Your Sponsored Ad Name"}
                      </span>
                      <span className="text-xs text-slate-500 block truncate mt-0.5">
                        {headline || "Your compelling tagline or proposition goes here"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-start sm:justify-end">
                    <span className="border border-slate-300 bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs">
                      Try {previewHostname}
                    </span>
                  </div>
                  <span className="absolute bottom-0 right-0 bg-orange-500 text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-tl-lg pointer-events-none">
                    Promoted
                  </span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all shadow-sm shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Campaign...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Launch Sponsored Ad</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
