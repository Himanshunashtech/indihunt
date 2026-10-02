"use client";

import React, { useTransition, useState } from "react";
import { Rocket, Trash2, ExternalLink, Loader2, Settings, Calendar } from "lucide-react";
import Link from "next/link";
import { adminLaunchProductNow, adminDeleteProduct, adminRescheduleProduct } from "@/app/admin/_actions/admin-actions";
import { useAdminToast } from "@/app/admin/_components/AdminToastProvider";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/lib/supabase";

interface UpcomingProductActionsProps {
  productId: string;
  productName: string;
  scheduledFor?: string;
  isDeleted?: boolean;
}

export function UpcomingProductActions({
  productId,
  productName,
  scheduledFor,
  isDeleted,
}: UpcomingProductActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState(
    scheduledFor ? new Date(scheduledFor).toISOString().split("T")[0] : ""
  );
  const router = useRouter();
  const toast = useAdminToast();

  const handleLaunchNow = () => {
    if (
      !confirm(
        `Are you sure you want to launch "${productName}" immediately? It will become LIVE right now.`
      )
    )
      return;

    startTransition(async () => {
      try {
        await adminLaunchProductNow(productId);
        toast.success(`🚀 "${productName}" is now LIVE!`);
        router.refresh();
      } catch (err: any) {
        toast.error(`Failed to launch: ${err?.message || "Unknown error"}`);
      }
    });
  };

  const handleReschedule = () => {
    if (!newDate) return;
    const isoDate = new Date(`${newDate}T00:00:00.000Z`).toISOString();

    startTransition(async () => {
      try {
        await adminRescheduleProduct(productId, isoDate);
        toast.success(`Rescheduled "${productName}" for ${newDate}!`);
        setShowReschedule(false);
        router.refresh();
      } catch (err: any) {
        toast.error(`Failed to reschedule: ${err?.message || "Unknown error"}`);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete upcoming product "${productName}"?`)) return;

    startTransition(async () => {
      try {
        await deleteProduct(productId);
        await adminDeleteProduct(productId);
        toast.success("Upcoming product deleted successfully!");
        router.refresh();
      } catch (err: any) {
        toast.error(`Failed to delete: ${err?.message || "Unknown error"}`);
      }
    });
  };

  return (
    <div className="flex items-center gap-1 relative">
      {/* Instant Launch Now Button */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleLaunchNow}
        title="Launch Product Now (Make Live Instantly)"
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-xs transition-all bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 ${
          isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Rocket className="w-3.5 h-3.5" />
        )}
        <span>Launch Now</span>
      </button>

      {/* Reschedule Button & Popover */}
      <div className="relative">
        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowReschedule(!showReschedule)}
          title="Reschedule Launch Date"
          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>

        {showReschedule && (
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              Reschedule Launch Date
            </p>
            <input
              type="date"
              value={newDate}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setShowReschedule(false)}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || !newDate}
                onClick={handleReschedule}
                className="px-2.5 py-1 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Settings */}
      <Link
        href={`/my-products/${productId}/settings?from=admin`}
        target="_blank"
        className="p-1.5 rounded-lg text-slate-500 hover:text-orange-500 hover:bg-orange-500/10 transition-all"
        title="Edit Product Settings / Pre-Launch Details"
      >
        <Settings className="w-3.5 h-3.5" />
      </Link>

      {/* Preview Link */}
      <Link
        href={`/products/${productId}`}
        target="_blank"
        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
        title="Preview Pre-Launch Page"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>

      {/* Delete / Cancel Schedule */}
      {!isDeleted && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          title="Delete / Cancel Scheduled Launch"
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
