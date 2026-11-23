// Sliding-Window Rate Limiter Utility

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitStore>();

export interface RateLimitOptions {
  limit?: number; // Max requests
  windowMs?: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Evaluates rate limit for a given key (IP address or User ID)
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit || 60; // Default 60 requests
  const windowMs = options.windowMs || 60 * 1000; // Default 1 minute
  const now = Date.now();

  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired
    const resetTime = now + windowMs;
    memoryStore.set(key, { count: 1, resetTime });

    // Periodic cleanup of stale keys
    if (memoryStore.size > 5000) {
      for (const [k, val] of memoryStore.entries()) {
        if (now > val.resetTime) memoryStore.delete(k);
      }
    }

    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetMs: windowMs
    };
  }

  // Active window
  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs: Math.max(0, record.resetTime - now)
    };
  }

  record.count += 1;
  memoryStore.set(key, record);

  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetMs: Math.max(0, record.resetTime - now)
  };
}
