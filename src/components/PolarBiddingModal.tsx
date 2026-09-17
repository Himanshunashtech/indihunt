"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Trophy,
  Zap,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  Layers,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle2,
  Lock,
  LogIn
} from "lucide-react";
import { placeLeaderboardBid, checkContentViolation, Product, getProducts, ALL_LEADERBOARD_CATEGORIES } from "@/lib/supabase";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";

interface PolarBiddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRank?: number;
  targetBid?: number;
  initialProduct?: Product | null;
  onSuccess?: () => void;
}

export const CATEGORIES_LIST = ALL_LEADERBOARD_CATEGORIES;

export default function PolarBiddingModal({
  isOpen,
  onClose,
  targetRank = 1,
  targetBid = 17005,
  initialProduct = null,
  onSuccess
}: PolarBiddingModalProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentProfile = useAppSelector((state) => state.auth.profile);
  const authLoading = useAppSelector((state) => state.auth.loading);

  const isLoggedIn = Boolean(currentUser || currentProfile);

  const cappedRank = Math.min(10, Math.max(1, targetRank));
  const [productName, setProductName] = useState(initialProduct?.name || "");
  const [productUrl, setProductUrl] = useState(initialProduct?.website_url || "");
  const [tagline, setTagline] = useState(initialProduct?.tagline || "");
  const [category, setCategory] = useState(initialProduct?.category || CATEGORIES_LIST[0]);
  const [bidAmount, setBidAmount] = useState<number>(targetBid);
  const [userEmail, setUserEmail] = useState("");
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProduct?.id || "");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (initialProduct) {
      setProductName(initialProduct.name);
      setProductUrl(initialProduct.website_url || "");
      setTagline(initialProduct.tagline || "");
      setCategory(initialProduct.category || CATEGORIES_LIST[0]);
      setSelectedProductId(initialProduct.id);
    }
  }, [initialProduct]);

  useEffect(() => {
    if (targetBid) {
      setBidAmount(targetBid);
    }
  }, [targetBid]);

  // Load only logged in user's products
  useEffect(() => {
    if (isOpen) {
      const uid = currentUser?.id || currentProfile?.id;
      const uemail = currentUser?.email || currentProfile?.work_email;

      if (uemail && !userEmail) {
        setUserEmail(uemail);
      }

      if (uid || uemail) {
        getProducts().then(list => {
          const myProds = list.filter(p => 
            (uid && p.maker_id === uid) || 
            (uemail && (p.maker_id === uemail || p.maker_id === uid))
          );
          setUserProducts(myProds);
        });
      } else {
        setUserProducts([]);
      }
    }
  }, [isOpen, currentUser, currentProfile]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProductId(p.id);
    setProductName(p.name);
    setProductUrl(p.website_url || "");
    setTagline(p.tagline || "");
    if (p.category) setCategory(p.category);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isLoggedIn) {
      setErrorMsg("You must be logged in to submit a bid.");
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (!bidAmount || bidAmount < 5) {
      setErrorMsg("Minimum bid amount is $5.");
      return;
    }

    if (!productName.trim()) {
      setErrorMsg("Please provide your product title or handle.");
      return;
    }

    // Content moderation check
    const textCheck = `${productName} ${tagline}`;
    const violation = checkContentViolation(textCheck);
    if (violation.hasViolation) {
      setErrorMsg(violation.message || "Text contains prohibited content.");
      alert(violation.message || "Content violation detected.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await placeLeaderboardBid({
        productId: selectedProductId || undefined,
        productName: productName.trim(),
        productUrl: productUrl.trim(),
        tagline: tagline.trim(),
        category,
        bidAmount,
        userEmail: userEmail.trim() || currentUser?.email || undefined
      });

      if (!res.success) {
        setErrorMsg(res.message || "Failed to submit bid.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(res.message || "Bid placed successfully! Redirecting to Polar Checkout...");

      if (onSuccess) onSuccess();

      if (res.checkoutUrl) {
        setTimeout(() => {
          window.open(res.checkoutUrl, "_blank");
          setIsSubmitting(false);
          onClose();
        }, 1200);
      } else {
        setIsSubmitting(false);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An error occurred while processing your bid.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-lg max-h-[90vh] flex flex-col bg-card border border-border/80 text-foreground p-0 overflow-hidden shadow-2xl rounded-3xl focus:outline-hidden animate-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 p-6 border-b border-border/60 relative shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#ff5733] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-foreground">
                  Claim Rank #{cappedRank} Spot
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Top 10 bidding only. Rankings update instantly.
                </Dialog.Description>
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-[#ff5733] text-xs font-semibold border border-orange-500/20">
              <Zap className="w-3.5 h-3.5" />
              Target Bid: ${bidAmount.toLocaleString()}
            </div>
          </div>

          {/* Modal Body */}
          {!isLoggedIn ? (
            <div className="p-8 text-center space-y-5 flex-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-[#ff5733] border border-orange-500/20 flex items-center justify-center shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-lg font-bold text-foreground">Authentication Required</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Only logged-in users can place bids to claim leaderboard rank spots for their products.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  dispatch(setAuthModalOpen(true));
                }}
                className="w-full py-3.5 px-6 rounded-full bg-[#ff5733] hover:bg-[#e04824] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In / Sign Up to Bid</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitBid} className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
              
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {successMsg}
                </div>
              )}

              {/* Quick Select existing product */}
              {userProducts.length > 0 ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    Select your product (or enter details below)
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const p = userProducts.find(item => item.id === e.target.value);
                      if (p) handleSelectProduct(p);
                      else setSelectedProductId("");
                    }}
                    className="w-full max-w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#ff5733]/40 cursor-pointer"
                  >
                    <option value="">-- Choose from your products or enter manually --</option>
                    {userProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category || 'Product'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
                  💡 No launched products found under your account. Enter your product details below to place a bid!
                </div>
              )}

              {/* Product Name / Handle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Product Name or URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. outrank.so or Outrank AI"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#ff5733]/40"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Short Description / Tagline
                </label>
                <input
                  type="text"
                  placeholder="Get traffic and outrank competitors on auto-pilot..."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#ff5733]/40"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full max-w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#ff5733]/40 cursor-pointer"
                >
                  {CATEGORIES_LIST.map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Bid Amount & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Bid Amount ($ USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min={5}
                      required
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm font-bold text-[#ff5733] focus:outline-hidden focus:ring-2 focus:ring-[#ff5733]/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Work / Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="founder@company.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-[#ff5733]/40"
                  />
                </div>
              </div>

              {/* Dodo Payments Info Box */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Instant position lock via Dodo Payments</span>
                </div>
                <span className="font-bold text-amber-700">Dodo Payments</span>
              </div>

              {/* CTA Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Dodo Checkout...</span>
                ) : (
                  <>
                    <span>Outbid Now with Dodo • ${bidAmount.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
