import { Product } from "@/types";

export interface GravityOptions {
  gravity?: number; // Decay exponent G, defaults to 1.8
  referenceTime?: Date; // Defaults to now
  voterReputationMap?: Record<string, number>; // Optional user-specific reputation weights
}

/**
 * Decaying Gravity Ranking Algorithm derived from Hacker News & Product Hunt.
 *
 * Formula:
 * Rank Score = ((U_weighted - 1) + (C * 0.5)) / (T + 2)^G * M
 *
 * - U_weighted: Authenticated upvote count adjusted for voter reputation weights.
 * - C: Valid comment discussions (comments_count).
 * - T: Hours elapsed since launch drop.
 * - G: Gravity decay exponent (~1.8), ensures morning launches don't permanently dominate late afternoon surges.
 * - M: Editorial/Maker multiplier (featured launches receive a 1.25x boost; editor picks receive 1.4x).
 */
export function calculateGravityScore(
  product: Partial<Product>,
  options: GravityOptions = {}
): number {
  const {
    gravity = 1.8,
    referenceTime = new Date(),
  } = options;

  const rawUpvotes = Math.max(0, product.upvotes_count || 0);
  const comments = Math.max(0, product.comments_count || 0);

  // 1. Calculate U_weighted (reputation weighted upvotes)
  // If voter reputation weight is stored on product or quality score, apply baseline
  let uWeighted = rawUpvotes;
  if (product.quality_score && product.quality_score > 0) {
    // Quality factor boost for products with high authenticity (up to 1.15x)
    const qualityFactor = 0.85 + (Math.min(100, product.quality_score) / 100) * 0.3;
    uWeighted = rawUpvotes * qualityFactor;
  }

  // 2. Calculate T (hours elapsed since launch)
  const launchTime = product.scheduled_for
    ? new Date(product.scheduled_for)
    : product.created_at
    ? new Date(product.created_at)
    : referenceTime;

  const diffMs = Math.max(0, referenceTime.getTime() - launchTime.getTime());
  const hoursElapsed = diffMs / (1000 * 60 * 60);

  // 3. Multiplier M: Editorial & Feature multipliers
  let multiplier = 1.0;
  if (product.featured) {
    multiplier *= 1.25; // 1.25x boost for staff-curated featured launches
  }
  if (product.editor_pick) {
    multiplier *= 1.4; // 1.4x boost for editor picks
  }
  if (product.never_feature) {
    multiplier *= 0.2; // Shadow penalty for flagged items
  }

  // 4. Gravity decay calculation
  const numerator = Math.max(0, uWeighted - 1) + (comments * 0.5);
  const denominator = Math.pow(hoursElapsed + 2, gravity);

  const gravityScore = (numerator / denominator) * multiplier;

  return Math.round(gravityScore * 1000) / 1000;
}

/**
 * Canonical gravity-decay ranking comparator.
 * Primary: Gravity Score (descending)
 * Tie-breaker 1: Raw Upvotes (descending)
 * Tie-breaker 2: Comments (descending)
 * Tie-breaker 3: ID alphabetical (deterministic)
 */
export function compareProductsByGravity(a: Product, b: Product): number {
  if (a.id === b.id) return 0;

  const scoreA = typeof a.gravity_score === "number" ? a.gravity_score : calculateGravityScore(a);
  const scoreB = typeof b.gravity_score === "number" ? b.gravity_score : calculateGravityScore(b);

  const diff = scoreB - scoreA;
  if (Math.abs(diff) > 0.0001) return diff;

  // Fallbacks
  const upvotesDiff = (b.upvotes_count || 0) - (a.upvotes_count || 0);
  if (upvotesDiff !== 0) return upvotesDiff;

  const commentsDiff = (b.comments_count || 0) - (a.comments_count || 0);
  if (commentsDiff !== 0) return commentsDiff;

  return (a.id || "").localeCompare(b.id || "");
}
