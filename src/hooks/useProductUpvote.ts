"use client";

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toggleUpvote, Product, getProductSlug } from "@/lib/supabase";
import { useAppDispatch, setAuthModalOpen } from "@/lib/store";
import { useWebSocket } from "@/components/WebSocketProvider";

export interface OptimisticUpvoteResult {
  productId: string;
  has_upvoted: boolean;
  upvotes_count: number;
}

/**
 * Production-Grade Product Hunt Upvote Hook
 * - 0ms Optimistic UI updates
 * - In-flight lock preventing rapid click race conditions
 * - Rollback on API failure
 * - Feed Stability: in-place count and color changes without jarring re-sorting
 * - Cross-view Realtime & Custom Event synchronization
 */
export function useProductUpvote(currentUserId?: string | null) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { publish } = useWebSocket();
  const pendingProductIdsRef = useRef<Set<string>>(new Set());

  const handleToggleUpvote = useCallback(
    async (
      e: React.MouseEvent | undefined,
      product: Product,
      onOptimisticUpdate?: (updated: Product) => void
    ) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      // Rule 5: Logged-out click opens login modal without altering counts or color
      if (!currentUserId) {
        dispatch(setAuthModalOpen(true));
        return;
      }

      const targetId = product.id;
      // Rule: In-flight lock to prevent double-click / rapid spamming race conditions
      if (pendingProductIdsRef.current.has(targetId)) {
        return;
      }
      pendingProductIdsRef.current.add(targetId);

      // Snapshot previous state for rollback
      const prevHasUpvoted = Boolean(product.has_upvoted);
      const prevCount = Math.max(0, Number(product.upvotes_count) || 0);

      // 0ms Optimistic Values
      const nextHasUpvoted = !prevHasUpvoted;
      const nextCount = prevHasUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1;

      const optimisticProduct: Product = {
        ...product,
        has_upvoted: nextHasUpvoted,
        upvotes_count: nextCount,
      };

      // Notify caller immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate(optimisticProduct);
      }

      // Matcher for ID or slug
      const matchesTarget = (p: Product) =>
        p.id === targetId ||
        (p.name && getProductSlug(p.name).toLowerCase() === targetId.toLowerCase());

      // Update TanStack query caches in 0ms without re-sorting the list
      const updateListCache = (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: Product) => {
          if (matchesTarget(p)) {
            return {
              ...p,
              has_upvoted: nextHasUpvoted,
              upvotes_count: nextCount,
            };
          }
          return p;
        });
      };

      queryClient.setQueriesData({ queryKey: ["products"] }, updateListCache);
      queryClient.setQueriesData({ queryKey: ["promoted_products"] }, updateListCache);
      queryClient.setQueriesData({ queryKey: ["product", targetId] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return {
          ...(old as Product),
          has_upvoted: nextHasUpvoted,
          upvotes_count: nextCount,
        };
      });

      // Dispatch window event for cross-component sync
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ih_product_upvoted", {
            detail: {
              productId: targetId,
              has_upvoted: nextHasUpvoted,
              upvotes_count: nextCount,
            },
          })
        );
      }

      try {
        const result = await toggleUpvote(targetId, currentUserId);
        if (result && result.success) {
          const serverHasUpvoted = Boolean(result.has_upvoted);
          const serverCount = typeof result.upvotes_count === "number" ? result.upvotes_count : nextCount;

          const reconcile = (p: Product) => {
            if (matchesTarget(p)) {
              return {
                ...p,
                has_upvoted: serverHasUpvoted,
                upvotes_count: serverCount,
              };
            }
            return p;
          };

          queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) =>
            Array.isArray(old) ? old.map(reconcile) : old
          );
          queryClient.setQueriesData({ queryKey: ["promoted_products"] }, (old: unknown) =>
            Array.isArray(old) ? old.map(reconcile) : old
          );
          queryClient.setQueriesData({ queryKey: ["product", targetId] }, (old: unknown) => {
            if (!old || typeof old !== "object") return old;
            return {
              ...(old as Product),
              has_upvoted: serverHasUpvoted,
              upvotes_count: serverCount,
            };
          });

          // Broadcast live to other viewers
          const slug = product.name ? getProductSlug(product.name) : undefined;
          publish("feed", "product_upvoted", {
            productId: targetId,
            upvotes_count: serverCount,
          });
          publish(`product:${targetId}`, "product_upvoted", {
            productId: targetId,
            upvotes_count: serverCount,
          });
          if (slug && slug !== targetId) {
            publish(`product:${slug}`, "product_upvoted", {
              productId: targetId,
              upvotes_count: serverCount,
            });
          }
        } else {
          throw new Error("Failed upvote response");
        }
      } catch (err) {
        console.error("[useProductUpvote] Error toggling upvote, rolling back:", err);
        // Rollback to snapshot on error
        const rollback = (p: Product) => {
          if (matchesTarget(p)) {
            return {
              ...p,
              has_upvoted: prevHasUpvoted,
              upvotes_count: prevCount,
            };
          }
          return p;
        };

        queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) =>
          Array.isArray(old) ? old.map(rollback) : old
        );
        queryClient.setQueriesData({ queryKey: ["promoted_products"] }, (old: unknown) =>
          Array.isArray(old) ? old.map(rollback) : old
        );
        queryClient.setQueriesData({ queryKey: ["product", targetId] }, (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...(old as Product),
            has_upvoted: prevHasUpvoted,
            upvotes_count: prevCount,
          };
        });

        if (onOptimisticUpdate) {
          onOptimisticUpdate({
            ...product,
            has_upvoted: prevHasUpvoted,
            upvotes_count: prevCount,
          });
        }
      } finally {
        pendingProductIdsRef.current.delete(targetId);
      }
    },
    [currentUserId, dispatch, publish, queryClient]
  );

  return {
    handleToggleUpvote,
    isPending: (productId: string) => pendingProductIdsRef.current.has(productId),
  };
}

