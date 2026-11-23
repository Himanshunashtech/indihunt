import { NextRequest } from "next/server";
import { apiSuccessSecure } from "@/lib/api/response";
import { calculateGravityScore } from "@/lib/gravityRanking";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Benchmark & Simulation Engine:
 * Simulates high-velocity 500+ launches drop and benchmarks ingestion latency,
 * gravity score calculations, and throughput.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const count = Math.min(1000, Math.max(50, parseInt(body.count || "500", 10)));

  const start = performance.now();

  const mockCategories = ["Developer Tools", "AI", "Productivity", "SaaS", "Design", "Marketing"];
  const simulatedLaunches: Partial<Product>[] = [];

  for (let i = 1; i <= count; i++) {
    const isFeatured = i % 5 === 0;
    const upvotes = Math.floor(Math.random() * 250);
    const comments = Math.floor(Math.random() * 30);
    const qualityScore = Math.floor(50 + Math.random() * 50);

    const product: Partial<Product> = {
      id: `sim-${i}-${Date.now()}`,
      name: `Simulated Product #${i}`,
      tagline: `Next-gen automated platform #${i}`,
      category: mockCategories[i % mockCategories.length],
      upvotes_count: upvotes,
      comments_count: comments,
      quality_score: qualityScore,
      featured: isFeatured,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 8) * 3600 * 1000).toISOString(),
    };

    const gravityScore = calculateGravityScore(product);
    product.gravity_score = gravityScore;
    simulatedLaunches.push(product);
  }

  // Sort by Decaying Gravity Algorithm
  simulatedLaunches.sort((a, b) => (b.gravity_score || 0) - (a.gravity_score || 0));

  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  const throughput = Math.round((count / (durationMs / 1000)));

  return apiSuccessSecure({
    success: true,
    benchmark: {
      simulatedCount: count,
      durationMs,
      throughputPerSecond: throughput,
      topLaunch: simulatedLaunches[0],
      topRankScore: simulatedLaunches[0]?.gravity_score,
      averageLatencyMs: Math.round((durationMs / count) * 1000) / 1000,
    },
    topSamples: simulatedLaunches.slice(0, 5),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
