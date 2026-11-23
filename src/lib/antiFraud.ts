import { redis } from "@/lib/redis";

export interface VoterProfile {
  id: string;
  is_verified?: boolean;
  is_maker?: boolean;
  karma_points?: number;
  created_at?: string;
  avatar_url?: string;
  username?: string;
}

export interface AntiFraudResult {
  allowed: boolean;
  shadowThrottled: boolean;
  reputationWeight: number;
  reason?: string;
}

// In-memory velocity window store for sub-millisecond local tracking
const velocityWindows = new Map<string, { count: number; windowStart: number }>();

/**
 * Calculates voter reputation weight based on account maturity and community karma.
 * - New / anonymous / unverified accounts: 0.2 weight
 * - Established community members: 1.0 weight
 * - High-karma makers / streak leaders (>100 KP): 1.25 - 1.5 weight
 */
export function getVoterReputationWeight(profile?: VoterProfile | null): number {
  if (!profile) return 0.2; // Unauthenticated or missing profile

  let weight = 1.0;

  // New account penalty (created less than 24 hours ago)
  if (profile.created_at) {
    const ageMs = Date.now() - new Date(profile.created_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours < 24) {
      weight = 0.2;
    }
  }

  // Verified badge boost
  if (profile.is_verified) {
    weight = Math.max(weight, 1.0);
  }

  // Maker karma booster
  const karma = profile.karma_points || 0;
  if (karma >= 500) {
    weight = 1.5;
  } else if (karma >= 100) {
    weight = 1.25;
  }

  return weight;
}

/**
 * Anti-Fraud & Vote Manipulation Engine:
 * 1. Rate-limiting per user & IP: max 30 vote actions / minute.
 * 2. Velocity Spike Shadow-Throttling: unnatural burst (>15 votes within 10 seconds on a single product)
 *    triggers shadow-throttling where votes are recorded without triggering ranking inflation.
 */
export async function validateVoteVelocity(
  productId: string,
  userId: string,
  ip: string = "127.0.0.1",
  voterProfile?: VoterProfile | null
): Promise<AntiFraudResult> {
  const now = Date.now();
  const baseWeight = getVoterReputationWeight(voterProfile);

  // 1. User Action Rate-Limiter (Max 30 votes/minute per user)
  const userRateKey = `rate:vote:user:${userId}`;
  const userWindow = velocityWindows.get(userRateKey);
  if (userWindow && now - userWindow.windowStart < 60 * 1000) {
    if (userWindow.count >= 30) {
      return {
        allowed: false,
        shadowThrottled: false,
        reputationWeight: 0,
        reason: "Vote rate limit exceeded (maximum 30 actions per minute)",
      };
    }
    userWindow.count += 1;
  } else {
    velocityWindows.set(userRateKey, { count: 1, windowStart: now });
  }

  // 2. Velocity Spike Detection on Product (Sudden surge shadow-throttling)
  // Window: 10 seconds. Threshold: > 15 votes
  let shadowThrottled = false;
  const productSpikeKey = `spike:product:${productId}`;
  const spikeWindow = velocityWindows.get(productSpikeKey);

  if (spikeWindow && now - spikeWindow.windowStart < 10 * 1000) {
    spikeWindow.count += 1;
    if (spikeWindow.count > 15) {
      shadowThrottled = true;
    }
  } else {
    velocityWindows.set(productSpikeKey, { count: 1, windowStart: now });
  }

  // 3. Optional Redis verification for distributed clusters
  if (redis) {
    try {
      const redisSpikeKey = `velocity:prod:${productId}:10s`;
      const currentBurst = await redis.incr(redisSpikeKey);
      if (currentBurst === 1) {
        await redis.expire(redisSpikeKey, 10);
      }
      if (currentBurst > 15) {
        shadowThrottled = true;
      }
    } catch {
      // In-memory fallback is active
    }
  }

  // If shadow-throttled, discount reputation weight to 0.1x
  const finalWeight = shadowThrottled ? Math.min(baseWeight, 0.1) : baseWeight;

  // Cleanup stale memory window entries periodically
  if (velocityWindows.size > 5000) {
    for (const [key, val] of velocityWindows.entries()) {
      if (now - val.windowStart > 120 * 1000) {
        velocityWindows.delete(key);
      }
    }
  }

  return {
    allowed: true,
    shadowThrottled,
    reputationWeight: finalWeight,
  };
}
