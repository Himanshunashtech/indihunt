"use client";

import React, { useTransition } from "react";
import { Play, Pause, Trash2, Loader2 } from "lucide-react";
import { adminToggleAdCampaignStatus, adminDeleteAdCampaign } from "@/app/admin/_actions/admin-actions";
import { updateAdCampaignStatus, deleteAdCampaign } from "@/lib/supabase";
import { useRouter } from "next/navigation";

import { useAdminToast } from "@/app/admin/_components/AdminToastProvider";

interface AdActionButtonsProps {
  campaignId: string;
  status: string;
}

export function AdActionButtons({ campaignId, status }: AdActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useAdminToast();

  const isActive = status === "active";

  const handleToggleStatus = () => {
    const newStatus = isActive ? "paused" : "active";

    startTransition(async () => {
      try {
        // Update via localStorage fallback first for instant local dev UI feedback
        await updateAdCampaignStatus(campaignId, isActive ? "paused_by_admin" : "active");

        // Call Server Action
        await adminToggleAdCampaignStatus(campaignId, newStatus);

        toast.success(`Ad campaign ${isActive ? "paused" : "activated"} successfully!`);
        router.refresh();
      } catch (err: any) {
        toast.error(`Failed to update campaign status: ${err?.message || "Unknown error"}`);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this ad campaign?")) return;

    startTransition(async () => {
      try {
        // Delete from localStorage fallback first
        await deleteAdCampaign(campaignId);

        // Call Server Action
        await adminDeleteAdCampaign(campaignId);

        toast.success("Ad campaign deleted successfully!");
        router.refresh();
      } catch (err: any) {
        toast.error(`Failed to delete campaign: ${err?.message || "Unknown error"}`);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Toggle active/paused button */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggleStatus}
        title={isActive ? "Pause Campaign (Admin)" : "Reactivate Campaign (Admin)"}
        className={`p-1.5 rounded-lg transition-all ${
          isActive
            ? "text-amber-400 hover:bg-amber-500/10"
            : "text-emerald-400 hover:bg-emerald-500/10"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isActive ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Delete button */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        title="Delete campaign"
        className={`p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${
          isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
