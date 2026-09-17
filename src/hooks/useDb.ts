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

function getLocalVotedSet(userId?: string | null): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    let raw = userId ? localStorage.getItem(`indihunt_upvotes_${userId}`) : null;
    if (!raw && userId) {
      raw = localStorage.getItem('indihunt_upvotes');
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {}
  return new Set();
}

// 1. Fetch all products
export function useProducts(currentUserId?: string, initialData?: Product[]) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["products", currentUserId || "guest"],
    queryFn: () => getProducts(currentUserId || undefined),
    staleTime: currentUserId ? 3 * 60 * 1000 : 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: () => {
      const votedSet = getLocalVotedSet(currentUserId);
      // 1. If any products query already exists in the cache, reuse its upvote counts to avoid flashing
      const existingQueries = queryClient.getQueriesData<Product[]>({ queryKey: ["products"] });
      const currentProducts = existingQueries.find(([_, d]) => Array.isArray(d) && d.length > 0)?.[1];
      if (currentProducts && Array.isArray(currentProducts) && currentProducts.length > 0) {
        return currentProducts.map((p) => ({
          ...p,
          has_upvoted: currentUserId ? votedSet.has(p.id) : false,
        }));
      }
      // 2. Initial SSR data fallback
      if (initialData && Array.isArray(initialData) && initialData.length > 0) {
        return initialData.map((p) => ({
          ...p,
          has_upvoted: currentUserId ? votedSet.has(p.id) : false,
        }));
      }
      return undefined;
    },
    placeholderData: (previousData) => {
      const votedSet = getLocalVotedSet(currentUserId);
      if (previousData && Array.isArray(previousData) && previousData.length > 0) {
        return previousData.map((p) => ({
          ...p,
          has_upvoted: currentUserId ? votedSet.has(p.id) : false,
        }));
      }
      const existingQueries = queryClient.getQueriesData<Product[]>({ queryKey: ["products"] });
      const currentProducts = existingQueries.find(([_, d]) => Array.isArray(d) && d.length > 0)?.[1];
      if (currentProducts && Array.isArray(currentProducts) && currentProducts.length > 0) {
        return currentProducts.map((p) => ({
          ...p,
          has_upvoted: currentUserId ? votedSet.has(p.id) : false,
        }));
      }
      if (initialData && Array.isArray(initialData) && initialData.length > 0) {
        return initialData.map((p) => ({
          ...p,
          has_upvoted: currentUserId ? votedSet.has(p.id) : false,
        }));
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
    initialData: () => {
      const votedSet = getLocalVotedSet(currentUserId);
      const existingQueries = queryClient.getQueriesData<Product>({ queryKey: ["product", productId] });
      const existingSingle = existingQueries.find(([_, d]) => d && typeof d === 'object' && d.id)?.[1];
      if (existingSingle) {
        return {
          ...existingSingle,
          has_upvoted: currentUserId ? votedSet.has(existingSingle.id) : false,
        };
      }
      if (productId) {
        const normalized = productId.toLowerCase();
        const existingListQueries = queryClient.getQueriesData<Product[]>({ queryKey: ["products"] });
        const currentProducts = existingListQueries.find(([_, d]) => Array.isArray(d) && d.length > 0)?.[1];
        if (currentProducts && Array.isArray(currentProducts)) {
          const match = currentProducts.find(p => p.id === productId || getProductSlug(p.name) === normalized);
          if (match) {
            return {
              ...match,
              has_upvoted: currentUserId ? votedSet.has(match.id) : false,
            };
          }
        }
      }
      if (initialData) {
        return {
          ...initialData,
          has_upvoted: currentUserId ? votedSet.has(initialData.id) : false,
        };
      }
      return undefined;
    },
    placeholderData: (previousData) => {
      const votedSet = getLocalVotedSet(currentUserId);
      if (previousData) {
        return {
          ...previousData,
          has_upvoted: currentUserId ? votedSet.has(previousData.id) : false,
        };
      }
      if (typeof window !== 'undefined' && productId) {
        try {
          const normalized = productId.toLowerCase();
          const existingListQueries = queryClient.getQueriesData<Product[]>({ queryKey: ["products"] });
          const currentProducts = existingListQueries.find(([_, d]) => Array.isArray(d) && d.length > 0)?.[1];
          if (currentProducts && Array.isArray(currentProducts)) {
            const match = currentProducts.find(p => p.id === productId || getProductSlug(p.name) === normalized);
            if (match) {
              return {
                ...match,
                has_upvoted: currentUserId ? votedSet.has(match.id) : false,
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
