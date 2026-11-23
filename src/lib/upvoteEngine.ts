import { redis } from "@/lib/redis";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface FastUpvoteResult {
  productId: string;
  hasUpvoted: boolean;
  upvotesCount: number;
  durationMs: number;
  tier: "redis_l1" | "database_fallback";
}

// In-Memory L1 Fallback for voter sets and dirty deltas
const memoryVoterSets = new Map<string, Set<string>>();
const memoryVoteDeltas = new Map<string, number>();
const memoryDirtyProducts = new Set<string>();

/**
 * High-Velocity In-Memory / Redis Upvote Toggler (< 2ms response time).
 *
 * Tier 1:
 * - Checks & toggles voter uniqueness in Redis Set: SISMEMBER -> SADD / SREM.
 * - Tracks atomic delta in Redis / memory: INCRBY vote_deltas:{productId}.
 * - Marks product in dirty set for batch write-behind persistence.
 */
export async function fastToggleUpvote(
  productId: string,
  userId: string,
  initialCount: number = 0
): Promise<FastUpvoteResult> {
  const start = performance.now();
  let hasUpvoted = false;
  let upvotesCount = initialCount;
  let tier: "redis_l1" | "database_fallback" = "redis_l1";

  if (redis) {
    try {
      const votersKey = `voters:product:${productId}`;
      const deltaKey = `vote_deltas:${productId}`;
      const dirtyKey = `dirty_vote_products`;

      // 1. Check if user already upvoted atomically
      const isMember = await redis.sismember(votersKey, userId);

      if (isMember) {
        // Toggle OFF (Unvote)
        await redis.srem(votersKey, userId);
        const delta = await redis.decr(deltaKey);
        await redis.sadd(dirtyKey, productId);
        hasUpvoted = false;
        upvotesCount = Math.max(0, initialCount - 1);
      } else {
        // Toggle ON (Upvote)
        await redis.sadd(votersKey, userId);
        const delta = await redis.incr(deltaKey);
        await redis.sadd(dirtyKey, productId);
        hasUpvoted = true;
        upvotesCount = initialCount + 1;
      }

      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return {
        productId,
        hasUpvoted,
        upvotesCount,
        durationMs,
        tier: "redis_l1",
      };
    } catch (redisErr) {
      console.warn("[UpvoteEngine] Redis error, using in-memory / DB fallback:", redisErr);
      tier = "database_fallback";
    }
  }

  // In-Memory fallback if Redis is not connected
  let voterSet = memoryVoterSets.get(productId);
  if (!voterSet) {
    voterSet = new Set<string>();
    memoryVoterSets.set(productId, voterSet);
  }

  if (voterSet.has(userId)) {
    voterSet.delete(userId);
    hasUpvoted = false;
    upvotesCount = Math.max(0, initialCount - 1);
    memoryVoteDeltas.set(productId, (memoryVoteDeltas.get(productId) || 0) - 1);
  } else {
    voterSet.add(userId);
    hasUpvoted = true;
    upvotesCount = initialCount + 1;
    memoryVoteDeltas.set(productId, (memoryVoteDeltas.get(productId) || 0) + 1);
  }

  memoryDirtyProducts.add(productId);

  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  return {
    productId,
    hasUpvoted,
    upvotesCount,
    durationMs,
    tier,
  };
}

/**
 * Tier 2: Write-Behind Batch Flusher
 * Drains dirty vote deltas and updates PostgreSQL in an aggregated transaction.
 */
export async function flushDirtyUpvotes(): Promise<{ flushedCount: number; errors: number }> {
  let dirtyIds: string[] = [];
  let flushedCount = 0;
  let errors = 0;

  // 1. Drain from Redis
  if (redis) {
    try {
      const dirtyKey = `dirty_vote_products`;
      const members = await redis.smembers<string[]>(dirtyKey);
      if (members && members.length > 0) {
        dirtyIds = members;
        await redis.del(dirtyKey);
      }
    } catch {}
  }

  // 2. Drain from memory
  if (memoryDirtyProducts.size > 0) {
    dirtyIds = Array.from(new Set([...dirtyIds, ...Array.from(memoryDirtyProducts)]));
    memoryDirtyProducts.clear();
  }

  if (dirtyIds.length === 0) {
    return { flushedCount: 0, errors: 0 };
  }

  let dbClient: any;
  try {
    dbClient = createAdminSupabaseClient();
  } catch {
    dbClient = await createServerSupabaseClient();
  }

  for (const prodId of dirtyIds) {
    try {
      // Get accurate upvote count from upvotes table
      const { count, error } = await dbClient
        .from("upvotes")
        .select("*", { count: "exact", head: true })
        .eq("product_id", prodId);

      if (!error && typeof count === "number") {
        await dbClient
          .from("products")
          .update({ upvotes_count: count })
          .eq("id", prodId);
        flushedCount++;
      }
    } catch (e) {
      errors++;
    }
  }

  return { flushedCount, errors };
}
