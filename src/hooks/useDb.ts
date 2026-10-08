import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  getProducts,
  getProductById,
  getCachedProduct,
  getProductSlug,
  getThreads,
  getThreadById,
  getComments,
  getReviews,
  toggleUpvote,
  toggleThreadUpvote,
  addComment,
  Product,
  Thread,
  Comment,
  Review,
  getCachedProducts,
  getCachedThreads,
  getPromotedProducts,
  getCachedPromotedProducts,
  getNotifications,
  getUnreadNotificationsCount,
  NotificationItem
} from "@/lib/supabase";

/**
 * Supabase Realtime synchronization hook for products, threads, and upvotes.
 * Keeps React Query cache in sync automatically across tabs and users in real time.
 */
export function useRealtimeSync(currentUserId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("public-db-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload: any) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as Product;
            queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) => {
              if (!Array.isArray(old)) return old;
              return old.map((p: Product) =>
                p.id === updated.id
                  ? { ...p, upvotes_count: updated.upvotes_count, comments_count: updated.comments_count, quality_score: updated.quality_score, featured: updated.featured }
                  : p
              );
            });
            queryClient.setQueriesData({ queryKey: ["product", updated.id] }, (old: unknown) => {
              if (!old || typeof old !== "object") return old;
              return { ...(old as Product), upvotes_count: updated.upvotes_count, comments_count: updated.comments_count };
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "threads" },
        (payload: any) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as Thread;
            queryClient.setQueriesData({ queryKey: ["threads"] }, (old: unknown) => {
              if (!Array.isArray(old)) return old;
              return old.map((t: Thread) =>
                t.id === updated.id
                  ? { ...t, upvotes_count: updated.upvotes_count, comments_count: updated.comments_count }
                  : t
              );
            });
            queryClient.setQueriesData({ queryKey: ["thread", updated.id] }, (old: unknown) => {
              if (!old || typeof old !== "object") return old;
              return { ...(old as Thread), upvotes_count: updated.upvotes_count, comments_count: updated.comments_count };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [queryClient, currentUserId]);
}

// 1. Fetch all products
export function useProducts(currentUserId?: string, initialData?: Product[], enabled = true) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["products", currentUserId || "guest"],
    queryFn: () => getProducts(currentUserId || undefined),
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialData && initialData.length > 0 ? initialData : () => {
      const guestData = queryClient.getQueryData<Product[]>(["products", "guest"]);
      if (guestData && guestData.length > 0) return guestData;
      return undefined;
    },
    initialDataUpdatedAt: 0,
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) return previousData;
      return previousData;
    },
  });
}

// 1b. Fetch promoted products
export function usePromotedProducts(existingProducts?: Product[], initialData?: Product[], currentUserId?: string) {
  return useQuery({
    queryKey: ["promoted_products", currentUserId || "guest"],
    queryFn: () => getPromotedProducts(existingProducts),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    initialDataUpdatedAt: 0,
    placeholderData: (previousData) => previousData || (initialData && initialData.length > 0 ? initialData : undefined),
  });
}

// 2. Fetch a single product by ID
export function useProduct(productId: string, currentUserId?: string, initialData?: Product | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["product", productId, currentUserId || "guest"],
    queryFn: () => getProductById(productId, currentUserId || undefined),
    enabled: !!productId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialData ? initialData : () => {
      const guestProduct = queryClient.getQueryData<Product>(["product", productId, "guest"]);
      if (guestProduct) return guestProduct;
      return undefined;
    },
    initialDataUpdatedAt: 0,
    placeholderData: (previousData) => {
      if (previousData) return previousData;
      if (productId) {
        try {
          const normalized = productId.toLowerCase();
          const existing = queryClient.getQueryData<Product[]>(["products", currentUserId || "guest"]) ||
                           queryClient.getQueryData<Product[]>(["products", "guest"]);
          if (existing && Array.isArray(existing)) {
            const match = existing.find(p => p.id === productId || getProductSlug(p.name).toLowerCase() === normalized);
            if (match) return match;
          }
        } catch (e) {}
      }
      return previousData;
    },
  });
}

// 3. Fetch all threads
export function useThreads(currentUserId?: string, initialData?: Thread[]) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["threads", currentUserId || "guest"],
    queryFn: () => getThreads(currentUserId || undefined),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialData && initialData.length > 0
      ? () => {
          if (currentUserId && typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem(`indihunt_thread_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_thread_upvotes');
              const votedSet = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
              return initialData.map((t) => ({
                ...t,
                has_upvoted: votedSet.has(t.id),
              }));
            } catch (e) {}
          }
          return initialData;
        }
      : () => {
          const guestThreads = queryClient.getQueryData<Thread[]>(["threads", "guest"]);
          if (guestThreads && guestThreads.length > 0) return guestThreads;
          return undefined;
        },
    initialDataUpdatedAt: initialData && initialData.length > 0 ? Date.now() : undefined,
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        if (currentUserId && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`indihunt_thread_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_thread_upvotes');
            const votedSet = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
            return previousData.map((t) => ({
              ...t,
              has_upvoted: votedSet.has(t.id),
            }));
          } catch (e) {}
        }
        return previousData;
      }
      return previousData;
    },
  });
}

// 4. Fetch a single thread by ID (with instant placeholder cache lookup)
export function useThread(threadId: string, currentUserId?: string, initialData?: Thread | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["thread", threadId, currentUserId || "guest"],
    queryFn: () => getThreadById(threadId, currentUserId || undefined),
    enabled: !!threadId,
    initialData: initialData || undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: currentUserId ? 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => {
      if (previousData) {
        if (currentUserId && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`indihunt_thread_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_thread_upvotes');
            const votedSet = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
            return {
              ...previousData,
              has_upvoted: votedSet.has(previousData.id),
            };
          } catch (e) {}
        }
        return previousData;
      }
      if (typeof window !== 'undefined' && threadId) {
        try {
          const normalized = threadId.toLowerCase();
          const existing = queryClient.getQueryData<Thread[]>(["threads", currentUserId || "guest"]) ||
                           queryClient.getQueryData<Thread[]>(["threads", "guest"]);
          if (existing && Array.isArray(existing)) {
            const match = existing.find(t => t.id === threadId || getProductSlug(t.title) === normalized);
            if (match) return match;
          }
        } catch (e) {}
      }
      return previousData;
    },
  });
}

// 4b. Toggle thread upvote mutation with optimistic updates for instant UI
export function useToggleThreadUpvoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, userId }: { threadId: string; userId: string }) =>
      toggleThreadUpvote(threadId, userId),
    onMutate: async ({ threadId }) => {
      await queryClient.cancelQueries({ queryKey: ["threads"] });
      await queryClient.cancelQueries({ queryKey: ["thread", threadId] });

      const previousThreads = queryClient.getQueriesData({ queryKey: ["threads"] });
      const previousThread = queryClient.getQueriesData({ queryKey: ["thread", threadId] });

      queryClient.setQueriesData({ queryKey: ["threads"] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: Thread) => {
          if (t.id === threadId) {
            const wasUpvoted = !!t.has_upvoted;
            return {
              ...t,
              has_upvoted: !wasUpvoted,
              upvotes_count: wasUpvoted
                ? Math.max(0, (t.upvotes_count || 1) - 1)
                : (t.upvotes_count || 0) + 1,
            };
          }
          return t;
        });
      });

      queryClient.setQueriesData({ queryKey: ["thread", threadId] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const t = old as Thread;
        const wasUpvoted = !!t.has_upvoted;
        return {
          ...t,
          has_upvoted: !wasUpvoted,
          upvotes_count: wasUpvoted
            ? Math.max(0, (t.upvotes_count || 1) - 1)
            : (t.upvotes_count || 0) + 1,
        };
      });

      return { previousThreads, previousThread };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousThreads) {
        context.previousThreads.forEach(([key, data]: [unknown, unknown]) => {
          queryClient.setQueryData(key as string[], data);
        });
      }
      if (context?.previousThread) {
        context.previousThread.forEach(([key, data]: [unknown, unknown]) => {
          queryClient.setQueryData(key as string[], data);
        });
      }
    },
    onSuccess: (data, variables) => {
      if (data && typeof data.upvotes_count === 'number') {
        queryClient.setQueriesData({ queryKey: ["threads"] }, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.map((t: Thread) =>
            t.id === variables.threadId ? { ...t, upvotes_count: data.upvotes_count } : t
          );
        });
        queryClient.setQueriesData({ queryKey: ["thread", variables.threadId] }, (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return { ...(old as Thread), upvotes_count: data.upvotes_count };
        });
      }
    },
  });
}

// Prefetching helpers for hover / navigation
export function prefetchProduct(queryClient: ReturnType<typeof useQueryClient>, productId: string) {
  if (!productId) return;
  queryClient.prefetchQuery({
    queryKey: ["product", productId, "guest"],
    queryFn: () => getProductById(productId),
    staleTime: 5 * 60 * 1000,
  });
}

export function prefetchThread(queryClient: ReturnType<typeof useQueryClient>, threadId: string) {
  if (!threadId) return;
  queryClient.prefetchQuery({
    queryKey: ["thread", threadId, "guest"],
    queryFn: () => getThreadById(threadId),
    staleTime: 5 * 60 * 1000,
  });
}

// 4. Fetch comments for a product or thread
export function useComments(productId?: string, threadId?: string, enabled = true, initialData?: Comment[]) {
  return useQuery({
    queryKey: ["comments", productId || "", threadId || ""],
    queryFn: () => getComments(productId || undefined, threadId || undefined),
    enabled: enabled && (!!productId || !!threadId),
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    initialDataUpdatedAt: initialData && initialData.length > 0 ? Date.now() : undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes for comments to stay relatively fresh
    refetchOnWindowFocus: false,
  });
}

// 4b. Fetch reviews for a product (30-min cache, no mount refetch)
export function useReviews(productId?: string, initialData?: Review[]) {
  return useQuery({
    queryKey: ["reviews", productId || ""],
    queryFn: () => getReviews(productId || ""),
    enabled: !!productId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    initialDataUpdatedAt: initialData && initialData.length > 0 ? Date.now() : undefined,
  });
}


// 5. Toggle upvote mutation with optimistic updates for instant UI
export function useToggleUpvoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, userId }: { productId: string; userId: string }) =>
      toggleUpvote(productId, userId),
    onMutate: async ({ productId }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({ queryKey: ["promoted_products"] });
      await queryClient.cancelQueries({ queryKey: ["product"] });

      const previousProducts = queryClient.getQueriesData({ queryKey: ["products"] });
      const previousPromoted = queryClient.getQueriesData({ queryKey: ["promoted_products"] });
      const previousProduct = queryClient.getQueriesData({ queryKey: ["product"] });

      const matchesTarget = (p: Product) =>
        p.id === productId ||
        getProductSlug(p.name).toLowerCase() === productId.toLowerCase();

      queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: Product) => {
          if (matchesTarget(p)) {
            const wasUpvoted = !!p.has_upvoted;
            return {
              ...p,
              has_upvoted: !wasUpvoted,
              upvotes_count: wasUpvoted
                ? Math.max(0, (p.upvotes_count || 1) - 1)
                : (p.upvotes_count || 0) + 1,
            };
          }
          return p;
        });
      });

      queryClient.setQueriesData({ queryKey: ["promoted_products"] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: Product) => {
          if (matchesTarget(p)) {
            const wasUpvoted = !!p.has_upvoted;
            return {
              ...p,
              has_upvoted: !wasUpvoted,
              upvotes_count: wasUpvoted
                ? Math.max(0, (p.upvotes_count || 1) - 1)
                : (p.upvotes_count || 0) + 1,
            };
          }
          return p;
        });
      });

      queryClient.setQueriesData({ queryKey: ["product"] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const p = old as Product;
        if (!matchesTarget(p)) return old;
        const was = !!p.has_upvoted;
        return {
          ...p,
          has_upvoted: !was,
          upvotes_count: was
            ? Math.max(0, (p.upvotes_count || 1) - 1)
            : (p.upvotes_count || 0) + 1,
        };
      });

      return { previousProducts, previousPromoted, previousProduct };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProducts) {
        context.previousProducts.forEach(([key, data]: [unknown, unknown]) => {
          queryClient.setQueryData(key as string[], data);
        });
      }
      if (context?.previousPromoted) {
        context.previousPromoted.forEach(([key, data]: [unknown, unknown]) => {
          queryClient.setQueryData(key as string[], data);
        });
      }
      if (context?.previousProduct) {
        context.previousProduct.forEach(([key, data]: [unknown, unknown]) => {
          queryClient.setQueryData(key as string[], data);
        });
      }
    },
    onSuccess: (data, variables) => {
      if (data && typeof data.upvotes_count === 'number') {
        const targetId = data.productId || variables.productId;
        const matchesTarget = (p: Product) =>
          p.id === targetId ||
          p.id === variables.productId ||
          getProductSlug(p.name).toLowerCase() === variables.productId.toLowerCase() ||
          (!!data.productId && getProductSlug(p.name).toLowerCase() === data.productId.toLowerCase());

        const hasUpvotedOverride = typeof data.has_upvoted === 'boolean' ? { has_upvoted: data.has_upvoted } : {};

        queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.map((p: Product) =>
            matchesTarget(p) ? { ...p, upvotes_count: data.upvotes_count, ...hasUpvotedOverride } : p
          );
        });

        queryClient.setQueriesData({ queryKey: ["promoted_products"] }, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.map((p: Product) =>
            matchesTarget(p) ? { ...p, upvotes_count: data.upvotes_count, ...hasUpvotedOverride } : p
          );
        });

        queryClient.setQueriesData({ queryKey: ["product"] }, (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const p = old as Product;
          if (!matchesTarget(p)) return old;
          return {
            ...p,
            upvotes_count: data.upvotes_count,
            ...hasUpvotedOverride,
          };
        });
      }
    },
  });
}

// 6. Add comment mutation with instant cache update
export function useAddCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      userId,
      body,
      parentId,
      threadId
    }: {
      productId: string | null;
      userId: string;
      body: string;
      parentId?: string | null;
      threadId?: string;
    }) => addComment(productId, userId, body, parentId, threadId),
    onSuccess: (newComment, variables) => {
      if (newComment) {
        // Instantly update the comments cache tree
        const addToTree = (tree: Comment[]): Comment[] => {
          if (!newComment.parent_id) {
            if (tree.some(c => c.id === newComment.id)) return tree;
            return [...tree, { ...newComment, replies: newComment.replies || [] }];
          }
          return tree.map(c => {
            if (c.id === newComment.parent_id) {
              if (c.replies?.some(r => r.id === newComment.id)) return c;
              return {
                ...c,
                replies: [...(c.replies || []), { ...newComment, replies: [] }]
              };
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: addToTree(c.replies)
              };
            }
            return c;
          });
        };

        queryClient.setQueriesData(
          { queryKey: ["comments", variables.productId || "", variables.threadId || ""] },
          (old: unknown) => addToTree(Array.isArray(old) ? (old as Comment[]) : [])
        );

        if (variables.productId) {
          queryClient.setQueriesData({ queryKey: ["product", variables.productId] }, (old: unknown) => {
            if (!old || typeof old !== "object") return old;
            return { ...(old as any), comments_count: ((old as any).comments_count || 0) + 1 };
          });
          queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) => {
            if (!Array.isArray(old)) return old;
            return old.map((p: Product) =>
              p.id === variables.productId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            );
          });
        }
      }
    },
  });
}

// 7. Unread notifications count query (lightweight head count)
export function useUnreadNotificationsCount(userId?: string) {
  return useQuery({
    queryKey: ["unread_notifications_count", userId || "guest"],
    queryFn: () => getUnreadNotificationsCount(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// 8. Notifications list query with caching
export function useNotifications(userId?: string, enabled = false) {
  return useQuery({
    queryKey: ["notifications", userId || "guest"],
    queryFn: () => getNotifications(userId),
    enabled: enabled && !!userId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

