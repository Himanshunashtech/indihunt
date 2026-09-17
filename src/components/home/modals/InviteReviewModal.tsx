"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Product, getProductSlug } from "@/lib/supabase";

interface InviteReviewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function InviteReviewModal({
  product,
  onClose,
}: InviteReviewModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!product) return null;

  const slug = getProductSlug(product.name);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://indihunt.in";
  const reviewsUrl = `${origin}/products/${slug}/review/`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reviewsUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog.Root
      open={!!product}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 overflow-hidden z-50 shadow-2xl focus:outline-none animate-in fade-in zoom-in-95 duration-200">
          <Dialog.Close
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Dialog.Close>

          <div className="text-center space-y-6">
            {/* Top Product Logo */}
            <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border/80 shadow-md flex items-center justify-center">
              <img
                src={product.logo_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5 px-2">
              <Dialog.Title className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                Invite people to review {product.name}
              </Dialog.Title>
              <Dialog.Description className="text-base text-muted-foreground font-normal flex items-center justify-center gap-1">
                <span>Discover. Launch. Grow. Together.</span>
                <span>⭐</span>
              </Dialog.Description>
            </div>

            {/* Copy Link Input Box */}
            <div className="text-left space-y-1.5 pt-2">
              <label className="text-base font-medium text-muted-foreground block">
                or copy link
              </label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={reviewsUrl}
                  className="flex-1 bg-transparent px-3 py-1.5 text-base text-foreground font-mono focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 bg-card hover:bg-muted border border-border rounded-xl text-base font-semibold text-foreground transition-all shadow-xs hover:scale-102 active:scale-98 flex-shrink-0 cursor-pointer"
                >
                  {isCopied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
