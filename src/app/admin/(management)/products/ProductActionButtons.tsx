"use client";

import React, { useTransition } from "react";
import { Star, Trash2, ExternalLink, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { adminFeatureProduct, adminDeleteProduct } from "@/app/admin/_actions/admin-actions";
import { useAdminToast } from "@/app/admin/_components/AdminToastProvider";
import { useRouter } from "next/navigation";

import { deleteProduct } from "@/lib/supabase";

interface ProductActionButtonsProps {
  productId: string;
  featured: boolean;
  isDeleted: boolean;
}

export function ProductActionButtons({ productId, featured, isDeleted }: ProductActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useAdminToast();

  const handleToggleFeature = () => {
    const nextFeatured = !featured;

    startTransition(async () => {
      try {
        await adminFeatureProduct(productId, nextFeatured);
        toast.success(`Product ${nextFeatured ? "featured" : "unfeatured"} successfully!`);
        router.refresh();
      } catch (err: any) {
        toast.error(`Failed to feature product: ${err?.message || "Unknown error"}`);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    startTransition(async () => {
      try {
        // Sync local storage fallback first
        await deleteProduct(productId);

        // Call Server Action
        await adminDeleteProduct(productId);
        toast.success("Product deleted successfully!");
        router.refresh();
      } catch (err: any) {
        toast.error(`Failed to delete product: ${err?.message || "Unknown error"}`);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Feature toggle */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggleFeature}
        title={featured ? "Unfeature product" : "Feature product"}
        className={`p-1.5 rounded-lg transition-all ${
          featured ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
      </button>

      {/* Delete button */}
      {!isDeleted && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          title="Delete product"
          className={`p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${
            isPending ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* External Link */}
      <Link
        href={`/products/${productId}`}
        target="_blank"
        className="p-1.5 rounded-lg text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
        title="View Product Page"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>

      {/* Edit Settings Link */}
      <Link
        href={`/my-products/${productId}/settings?from=admin`}
        target="_blank"
        className="p-1.5 rounded-lg text-slate-300 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
        title="Edit Product Settings"
      >
        <Settings className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
