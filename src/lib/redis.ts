import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client (server-only)
export const redis = (typeof window === 'undefined' && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

function isDynamicServerError(error: any): boolean {
  if (!error) return false;
  const message = String(error?.message || '');
  const digest = String(error?.digest || '');
  const name = String(error?.name || '');
  return (
    digest.includes('DYNAMIC_SERVER_USAGE') ||
    name === 'DynamicServerError' ||
    message.includes('Dynamic server usage') ||
    message.includes('DYNAMIC_SERVER_USAGE') ||
    message.includes("couldn't be rendered statically")
  );
}

// L1 In-Memory Server Cache for sub-millisecond local access
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<any>>();

/**
 * Cache helper utilities with L1 (Memory) and L2 (Redis) tiers
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const now = Date.now();

  // 1. Check L1 memory cache first (< 1ms)
  const mem = memoryStore.get(key);
  if (mem) {
    if (mem.expiresAt > now) {
      return mem.value as T;
    }
    memoryStore.delete(key);
  }

  // 2. Check L2 Redis cache if available
  try {
    if (redis) {
      const data = await redis.get<T>(key);
      if (data !== null && data !== undefined) {
        // Hydrate L1 memory cache with a 30s TTL
        memoryStore.set(key, { value: data, expiresAt: now + 30 * 1000 });
        return data;
      }
    }
  } catch (error) {
    if (!isDynamicServerError(error)) {
      console.warn(`[Redis] Get error for key ${key}:`, error);
    }
  }

  return null;
}

export async function setCachedData<T>(key: string, value: T, expireInSeconds: number = 60): Promise<void> {
  const now = Date.now();
  // Set in L1 memory cache
  memoryStore.set(key, {
    value,
    expiresAt: now + (expireInSeconds * 1000)
  });

  // Set in L2 Redis cache
  try {
    if (redis) {
      if (expireInSeconds) {
        await redis.set(key, value, { ex: expireInSeconds });
      } else {
        await redis.set(key, value);
      }
    }
  } catch (error) {
    if (!isDynamicServerError(error)) {
      console.warn(`[Redis] Set error for key ${key}:`, error);
    }
  }
}

export async function invalidateCache(key: string): Promise<void> {
  memoryStore.delete(key);
  try {
    if (redis) {
      await redis.del(key);
    }
  } catch (error) {
    if (!isDynamicServerError(error)) {
      console.warn(`[Redis] Delete error for key ${key}:`, error);
    }
  }
}

export async function invalidateCachePattern(prefix: string): Promise<void> {
  // Evict matching keys from L1 memory
  for (const k of Array.from(memoryStore.keys())) {
    if (k.startsWith(prefix)) {
      memoryStore.delete(k);
    }
  }

  // Evict from L2 Redis if available
  try {
    if (redis) {
      let cursor = "0";
      const keysToDelete: string[] = [];
      do {
        const [nextCursor, matchedKeys] = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
        cursor = nextCursor;
        if (matchedKeys && matchedKeys.length > 0) {
          keysToDelete.push(...matchedKeys);
        }
      } while (cursor !== "0" && keysToDelete.length < 500);

      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
      }
    }
  } catch (error) {
    if (!isDynamicServerError(error)) {
      console.warn(`[Redis] Pattern delete error for ${prefix}:`, error);
    }
  }
}

