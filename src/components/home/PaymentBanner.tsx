"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, X } from "lucide-react";

export interface PaymentBannerState {
  type: "success" | "error";
  title: string;
  message: string;
}

interface PaymentBannerProps {
  banner: PaymentBannerState | null;
  onClose: () => void;
}

export default function PaymentBanner({
  banner,
  onClose,
}: PaymentBannerProps) {
  if (!banner) return null;

  return (
    <div
      className={`mb-6 p-4 rounded-2xl border flex items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300 shadow-sm ${
        banner.type === "success"
          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400"
      }`}
    >
      <div className="flex items-start sm:items-center gap-3">
        {banner.type === "success" ? (
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
        ) : (
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold text-xs bg-rose-500/20 rounded-full">
            !
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {banner.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {banner.message}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {banner.type === "error" && (
          <Link
            href="/advertise"
            className="px-3 py-1.5 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl transition-all flex-shrink-0"
          >
            Retry Campaign
          </Link>
        )}
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
