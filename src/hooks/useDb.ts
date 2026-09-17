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
  addComment,
  Product,
  Thread,
  getCachedProducts,
  getCachedThreads,
  getPromotedProducts,
  getCachedPromotedProducts
} from "@/lib/supabase";

// 1. Fetch all products
export function useProducts(currentUserId?: string, initialData?: Product[]) {
  return useQuery({
    queryKey: ["products", currentUserId || "guest"],
    queryFn: () => getProducts(currentUserId || undefined),
    staleTime: currentUserId ? 3 * 60 * 1000 : 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
    staleTime: currentUserId ? 3 * 60 * 1000 : 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: initialData ? initialData : undefined,
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
  return useQuery({
    queryKey: ["threads", currentUserId || "guest"],
    queryFn: () => getThreads(currentUserId || undefined),
    staleTime: currentUserId ? 3 * 60 * 1000 : 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: initialData && initialData.length > 0 ? initialData : undefined,
    placeholderData: (previousData) => previousData,
  });
}

// 4. Fetch a single thread by ID (with instant placeholder cache lookup)
export function useThread(threadId: string) {
  return useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThreadById(threadId),
    enabled: !!threadId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
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
export function useComments(productId?: string, threadId?: string) {
  return useQuery({
    queryKey: ["comments", productId || "", threadId || ""],
    queryFn: () => getComments(productId || undefined, threadId || undefined),
    enabled: !!productId || !!threadId,
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
      await queryClient.cancelQueries({ queryKey: ["product", productId] });

      // Snapshot previous value for rollback
      const previousProducts = queryClient.getQueriesData({ queryKey: ["products"] });
      const previousProduct = queryClient.getQueriesData({ queryKey: ["product", productId] });

      // Optimistic update: toggle has_upvoted and adjust count in all product list caches
      queryClient.setQueriesData({ queryKey: ["products"] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: Product) => {
          if (p.id === productId) {
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

      return { previousProducts, previousProduct };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        context.previousProducts.forEach(([key, data]: [unknown, unknown]) => {
          queryClient.setQueryData(key as string[], data);
        });
      }
      if (context?.previousProduct) {
        context.previousProduct.forEach(([key, data]: [unknown, unknown]) => {
          queryClient.setQueryData(key as string[], data);
        });
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after to reconcile with server truth
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
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
