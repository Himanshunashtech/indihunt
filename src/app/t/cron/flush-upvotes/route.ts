import { NextRequest } from "next/server";
import { flushDirtyUpvotes } from "@/lib/upvoteEngine";
import { apiSuccessSecure, apiFailure } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/**
 * Pillar 2: Write-Behind Batch Flusher
 * Flushes dirty vote deltas from Redis / memory store into PostgreSQL in single batch transactions.
 */
export async function POST(_request: NextRequest) {
  try {
    const start = performance.now();
    const result = await flushDirtyUpvotes();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    return apiSuccessSecure({
      success: true,
      flushedProducts: result.flushedCount,
      errors: result.errors,
      durationMs,
    });
  } catch (error: any) {
    return apiFailure(error?.message || "Failed to flush dirty upvotes", 500);
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
