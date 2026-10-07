import { decodePayload } from './obfuscate';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.URL) return process.env.URL.replace(/\/$/, '');
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const port = process.env.PORT || '3000';
  return `http://127.0.0.1:${port}`;
}

// Request Deduplication Map for in-flight requests only
const inFlightRequests = new Map<string, Promise<any>>();

export function clearClientApiCache(_filterPattern?: string) {
  inFlightRequests.clear();
}

export async function secureApiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  const method = (options?.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Request coalescing for identical in-flight GET requests
  if (isGet && typeof window !== 'undefined') {
    if (inFlightRequests.has(url)) {
      return inFlightRequests.get(url)!;
    }
  }

  const fetchPromise = (async () => {
    let fullUrl = url;
    try {
      fullUrl = url.startsWith('/') ? `${getBaseUrl()}${url}` : url;

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
        console.warn(`[secureApiFetch] ${method} ${fullUrl} returned non-JSON / status ${res.status}`);
        return { success: false, error: `Invalid JSON response (status ${res.status})` };
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

      return finalResult;
    } catch (err: any) {
      console.error(`[secureApiFetch Error] ${method} ${fullUrl}:`, err?.message);
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
