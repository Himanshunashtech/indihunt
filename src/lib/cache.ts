import { getCachedData, setCachedData } from '@/lib/redis';

// In-process single-flight map: prevents cache stampede on cold starts
// When multiple requests arrive simultaneously for the same cold key,
// only 1 hits the DB — the rest wait for the same Promise.
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  // L1/L2 cache hit
  const hit = await getCachedData<T>(key);
  if (hit !== null && hit !== undefined) return hit;

  // Single-flight: reuse in-progress fetch
  if (inflight.has(key)) return inflight.get(key) as Promise<T>;

  const p = fn()
    .then(async (v) => {
      if (v !== null && v !== undefined) {
        await setCachedData(key, v, ttlSeconds);
      }
      return v;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, p);
  return p;
}

// Versioned feed cache — bump version on product writes to invalidate all feed keys at once
export async function getFeedVersion(): Promise<number> {
  const v = await getCachedData<number>('feed:version');
  return v ?? 1;
}

export async function bumpFeedVersion(): Promise<void> {
  const v = await getFeedVersion();
  await setCachedData('feed:version', v + 1, 86400);
}
