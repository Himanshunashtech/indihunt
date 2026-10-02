import { decodePayload } from './obfuscate';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  const port = process.env.PORT || '3000';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://127.0.0.1:${port}`;
}

// Client-side L1 Memory Cache & In-Flight Request Deduplication Map
interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
}

const clientMemoryCache = new Map<string, ClientCacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
const CLIENT_CACHE_TTL_MS = 45 * 1000; // 45 seconds instant cache

export function clearClientApiCache(filterPattern?: string) {
  if (!filterPattern) {
    clientMemoryCache.clear();
    return;
  }
  for (const key of clientMemoryCache.keys()) {
    if (key.includes(filterPattern)) {
      clientMemoryCache.delete(key);
    }
  }
}

export async function secureApiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  const method = (options?.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // If mutation, invalidate matching cache
  if (!isGet) {
    const basePath = url.split('?')[0];
    clearClientApiCache(basePath);
    if (basePath.includes('/upvote')) {
      clearClientApiCache('/t/products');
      clearClientApiCache('/t/threads');
      clearClientApiCache('/t/comments');
      clearClientApiCache('/t/upvotes');
    }
  }

  // Check client memory cache for GET requests in browser
  if (isGet && typeof window !== 'undefined') {
    const cached = clientMemoryCache.get(url);
    if (cached && (Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS)) {
      return cached.data;
    }

    // Request coalescing for in-flight requests
    if (inFlightRequests.has(url)) {
      return inFlightRequests.get(url)!;
    }
  }

  const fetchPromise = (async () => {
    try {
      const fullUrl = url.startsWith('/') ? `${getBaseUrl()}${url}` : url;

      // On the server, add an internal bypass header so the middleware
      // skips bot-detection for SSR self-requests (Node fetch UA triggers the block)
      const isServer = typeof window === 'undefined';
      const internalHeaders: Record<string, string> = isServer
        ? { 'X-Internal-SSR': '1', 'User-Agent': 'IndiHunt-SSR/1.0' }
        : {};

      const controller = new AbortController();
      const timeoutMs = isServer ? 3500 : 9000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(fullUrl, {
        ...options,
        signal: options?.signal || controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...internalHeaders,
          ...(options?.headers || {}),
        },
      }).finally(() => clearTimeout(timeoutId));

      const json = await res.json().catch(() => null);

      if (!json) {
        return { success: false, error: 'Invalid JSON response from server' };
      }

      let finalResult = json;

      // Transparently decode obfuscated payload if present
      if (json._d && typeof json._d === 'string') {
        const decodedData = decodePayload<T>(json._d);
        finalResult = {
          ...json,
          ...(typeof decodedData === 'object' && decodedData !== null && !Array.isArray(decodedData) ? decodedData : {}),
          success: json.success ?? true,
          data: decodedData as T,
        };
      }

      // Store in client memory cache if successful GET
      if (isGet && typeof window !== 'undefined' && finalResult.success !== false) {
        clientMemoryCache.set(url, {
          data: finalResult,
          timestamp: Date.now()
        });
      }

      return finalResult;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network request failed' };
    } finally {
      if (isGet) {
        inFlightRequests.delete(url);
      }
    }
  })();

  if (isGet && typeof window !== 'undefined') {
    inFlightRequests.set(url, fetchPromise);
  }

  return fetchPromise;
}
