import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  getCachedProduct,
  getProductSlug,
  getThreads,
  getThreadById,
  getComments,
  toggleUpvote,
  toggleThreadUpvote,
  addComment,
  Product,
  Thread,
  getCachedProducts,
  getCachedThreads,
  getPromotedProducts,
  getCachedPromotedProducts
} from "@/lib/supabase";

// 1. Fetch all products
export function useProducts(currentUserId?: string, initialData?: Product[], enabled = true) {
  return useQuery({
    queryKey: ["products", currentUserId || "guest"],
    queryFn: () => getProducts(currentUserId || undefined),
    enabled,
    staleTime: currentUserId ? 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    initialDataUpdatedAt: initialData && initialData.length > 0 ? Date.now() : undefined,
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        if (currentUserId && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`indihunt_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_upvotes');
            const votedSet = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
            return previousData.map((p) => ({
              ...p,
              has_upvoted: votedSet.has(p.id),
            }));
          } catch (e) {}
        }
        return previousData;
      }
      return previousData;
    },
  });
}

// 1b. Fetch promoted products (instant placeholder cache lookup)
export function usePromotedProducts(existingProducts?: Product[], initialData?: Product[]) {
  return useQuery({
    queryKey: ["promoted_products"],
    queryFn: () => getPromotedProducts(existingProducts),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    placeholderData: (previousData) => previousData,
  });
}

// 2. Fetch a single product by ID (with instant placeholder cache lookup)
export function useProduct(productId: string, currentUserId?: string, initialData?: Product | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["product", productId, currentUserId || "guest"],
    queryFn: () => getProductById(productId, currentUserId || undefined),
    enabled: !!productId,
    staleTime: currentUserId ? 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialData
      ? () => {
          if (currentUserId && typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem(`indihunt_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_upvotes');
              const votedSet = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
              return {
                ...initialData,
                has_upvoted: votedSet.has(initialData.id),
              };
            } catch (e) {}
          }
          return initialData;
        }
      : undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    placeholderData: (previousData) => {
      if (previousData) {
        if (currentUserId && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(`indihunt_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_upvotes');
            const votedSet = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
            return {
              ...previousData,
              has_upvoted: votedSet.has(previousData.id),
            };
          } catch (e) {}
        }
        return previousData;
      }
      if (typeof window !== 'undefined' && productId) {
        try {
          const normalized = productId.toLowerCase();
          const existing = queryClient.getQueryData<Product[]>(["products", currentUserId || "guest"]) ||
                           queryClient.getQueryData<Product[]>(["products", "guest"]);
          if (existing && Array.isArray(existing)) {
            const match = existing.find(p => p.id === productId || getProductSlug(p.name) === normalized);
            if (match) {
              const raw = currentUserId ? (localStorage.getItem(`indihunt_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_upvotes')) : null;
              const votedSet = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
              return {
                ...match,
                has_upvoted: currentUserId ? votedSet.has(match.id) : !!match.has_upvoted,
              };
            }
          }
        } catch (e) {}
      }
      return previousData;
    },
  });
}

// 3. Fetch all threads
export function useThreads(currentUserId?: string, initialData?: Thread[]) {
  return useQuery({
    queryKey: ["threads", currentUserId || "guest"],
    queryFn: () => getThreads(currentUserId || undefined),
    staleTime: currentUserId ? 60 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    initialDataUpdatedAt: currentUserId ? 0 : undefined,
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
export function useThread(threadId: string, currentUserId?: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["thread", threadId, currentUserId || "guest"],
    queryFn: () => getThreadById(threadId, currentUserId || undefined),
    enabled: !!threadId,
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
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["thread", variables.threadId] });
    },
  });
}

// Prefetching helpers for hover / navigation
export function prefetchProduct(queryClient: ReturnType<typeof useQueryClient>, productId: string) {
  if (!productId) return;
  queryClient.prefetchQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    staleTime: 5 * 60 * 1000,
  });
}

export function prefetchThread(queryClient: ReturnType<typeof useQueryClient>, threadId: string) {
  if (!threadId) return;
  queryClient.prefetchQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThreadById(threadId),
    staleTime: 5 * 60 * 1000,
  });
}

// 4. Fetch comments for a product or thread
export function useComments(productId?: string, threadId?: string, enabled = true) {
  return useQuery({
    queryKey: ["comments", productId || "", threadId || ""],
    queryFn: () => getComments(productId || undefined, threadId || undefined),
    enabled: enabled && (!!productId || !!threadId),
    staleTime: 2 * 60 * 1000, // 2 minutes for comments to stay relatively fresh
    refetchOnWindowFocus: false,
  });
}

// 5. Toggle upvote mutation with optimistic updates for instant UI
export function useToggleUpvoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, userId }: { productId: string; userId: string }) =>
      toggleUpvote(productId, userId),
    // Optimistic update: toggle immediately in the cache before server responds
    onMutate: async ({ productId }) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({ queryKey: ["promoted_products"] });
      await queryClient.cancelQueries({ queryKey: ["product", productId] });

      // Snapshot previous value for rollback
      const previousProducts = queryClient.getQueriesData({ queryKey: ["products"] });
      const previousPromoted = queryClient.getQueriesData({ queryKey: ["promoted_products"] });
      const previousProduct = queryClient.getQueriesData({ queryKey: ["product", productId] });

      const matchesTarget = (p: Product) =>
        p.id === productId ||
        getProductSlug(p.name).toLowerCase() === productId.toLowerCase() ||
        ((p as any).slug && (p as any).slug.toLowerCase() === productId.toLowerCase());

      // Optimistic update: toggle has_upvoted and adjust count in all product list caches
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

      queryClient.setQueriesData({ queryKey: ["product", productId] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const p = old as Product;
        const wasUpvoted = !!p.has_upvoted;
        return {
          ...p,
          has_upvoted: !wasUpvoted,
          upvotes_count: wasUpvoted
            ? Math.max(0, (p.upvotes_count || 1) - 1)
            : (p.upvotes_count || 0) + 1,
        };
      });

      return { previousProducts, previousPromoted, previousProduct };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
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
        const resolvedId = data.productId || variables.productId;
        const hasUpvoted = typeof data.has_upvoted === 'boolean' ? data.has_upvoted : undefined;

        const matchesTarget = (p: Product) =>
          p.id === resolvedId ||
          p.id === variables.productId ||
          getProductSlug(p.name).toLowerCase() === variables.productId.toLowerCase() ||
          ((p as any).slug && (p as any).slug.toLowerCase() === variables.productId.toLowerCase());

        queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.map((p: Product) =>
            matchesTarget(p)
              ? {
                  ...p,
                  upvotes_count: data.upvotes_count,
                  ...(hasUpvoted !== undefined ? { has_upvoted: hasUpvoted } : {}),
                }
              : p
          );
        });

        queryClient.setQueriesData({ queryKey: ["promoted_products"] }, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.map((p: Product) =>
            matchesTarget(p)
              ? {
                  ...p,
                  upvotes_count: data.upvotes_count,
                  ...(hasUpvoted !== undefined ? { has_upvoted: hasUpvoted } : {}),
                }
              : p
          );
        });

        const updateSingleProduct = (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...(old as Product),
            upvotes_count: data.upvotes_count,
            ...(hasUpvoted !== undefined ? { has_upvoted: hasUpvoted } : {}),
          };
        };

        queryClient.setQueriesData({ queryKey: ["product", variables.productId] }, updateSingleProduct);
        if (resolvedId && resolvedId !== variables.productId) {
          queryClient.setQueriesData({ queryKey: ["product", resolvedId] }, updateSingleProduct);
        }
      }
    },
  });
}

// 6. Add comment mutation
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (variables.productId) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
      }
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}
