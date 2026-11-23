"use client";

import React, { useState } from "react";
import {
  Zap,
  Rocket,
  Flame,
  ShieldAlert,
  Clock,
  RotateCw,
  CheckCircle2,
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

export default function BenchmarkDashboardPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<any | null>(null);

  const [isDropping, setIsDropping] = useState(false);
  const [dropResults, setDropResults] = useState<any | null>(null);

  const [isFlushing, setIsFlushing] = useState(false);
  const [flushResults, setFlushResults] = useState<any | null>(null);

  // 1. Simulate 500 Launches
  const handleSimulateLaunches = async () => {
    setIsSimulating(true);
    setSimResults(null);
    try {
      const res = await fetch("/t/benchmark/launch-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 500 }),
      });
      const data = await res.json();
      if (data && data.success) {
        setSimResults(data.data);
      }
    } catch (err: any) {
      alert("Simulation failed: " + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // 2. Trigger 12:01 AM Launch Drop
  const handleTriggerLaunchDrop = async () => {
    setIsDropping(true);
    setDropResults(null);
    try {
      const res = await fetch("/t/cron/launch-drop", { method: "POST" });
      const data = await res.json();
      if (data && data.success) {
        setDropResults(data.data);
      }
    } catch (err: any) {
      alert("Launch drop failed: " + err.message);
    } finally {
      setIsDropping(false);
    }
  };

  // 3. Flush Write-Behind Upvote Buffers
  const handleFlushUpvotes = async () => {
    setIsFlushing(true);
    setFlushResults(null);
    try {
      const res = await fetch("/t/cron/flush-upvotes", { method: "POST" });
      const data = await res.json();
      if (data && data.success) {
        setFlushResults(data.data);
      }
    } catch (err: any) {
      alert("Flush failed: " + err.message);
    } finally {
      setIsFlushing(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-500 mb-1">
            <Zap className="w-4 h-4" />
            <span>High-Velocity Architecture Benchmark</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Product Hunt Core Architecture & Load Benchmark
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sub-millisecond write-behind upvoting, 12:01 AM batch ingestion, decaying gravity ranking, and anti-fraud velocity throttling.
          </p>
        </div>

        <button
          onClick={handleSimulateLaunches}
          disabled={isSimulating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
        >
          <Rocket className="w-4 h-4" />
          <span>{isSimulating ? "Simulating Ingestion..." : "🚀 Simulate 500 Launches Now"}</span>
        </button>
      </div>

      {/* 4 Architectural Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pillar 1 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Pillar 1
            </span>
          </div>
          <h3 className="text-base font-bold text-foreground">12:01 AM Launch Drop</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Transitions 500+ scheduled products to live in daily indexed partitions with automatic Featured vs Community evaluation.
          </p>
          <div className="pt-2">
            <button
              onClick={handleTriggerLaunchDrop}
              disabled={isDropping}
              className="w-full py-2 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isDropping ? "animate-spin" : ""}`} />
              <span>{isDropping ? "Running..." : "Trigger 00:01 Drop"}</span>
            </button>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Pillar 2
            </span>
          </div>
          <h3 className="text-base font-bold text-foreground">Write-Behind Upvoting</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            In-memory voter uniqueness (<span className="text-emerald-500 font-bold">&lt; 1ms</span>) with background write-behind batching into PostgreSQL.
          </p>
          <div className="pt-2">
            <button
              onClick={handleFlushUpvotes}
              disabled={isFlushing}
              className="w-full py-2 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Layers className={`w-3.5 h-3.5 ${isFlushing ? "animate-spin" : ""}`} />
              <span>{isFlushing ? "Flushing..." : "Flush Upvote Buffers"}</span>
            </button>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
              Pillar 3
            </span>
          </div>
          <h3 className="text-base font-bold text-foreground">Decaying Gravity Algorithm</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rank Score = ((U - 1) + 0.5C) / (T + 2)^1.8 * M. Prevents morning launches from stagnating the feed.
          </p>
          <div className="pt-2 text-xs font-semibold text-orange-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active in Trending Tab</span>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
              Pillar 4
            </span>
          </div>
          <h3 className="text-base font-bold text-foreground">Anti-Fraud Engine</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            30 vote/min rate limits, sudden spike detection (&gt;15 votes/10s), and voter karma reputation weighting (0.2x to 1.5x).
          </p>
          <div className="pt-2 text-xs font-semibold text-purple-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live Protection Enabled</span>
          </div>
        </div>
      </div>

      {/* Live Benchmark Execution Results */}
      {simResults && (
        <div className="bg-card border border-orange-500/30 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-foreground">500 Launches Ingestion Benchmark Output</h2>
            </div>
            <span className="text-xs font-mono font-bold bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20">
              {simResults.benchmark.throughputPerSecond.toLocaleString()} launches/sec
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Ingested Launches</div>
              <div className="text-2xl font-extrabold text-foreground mt-1">{simResults.benchmark.simulatedCount}</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Ingestion Time</div>
              <div className="text-2xl font-extrabold text-emerald-500 mt-1">{simResults.benchmark.durationMs} ms</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Average Latency</div>
              <div className="text-2xl font-extrabold text-foreground mt-1">{simResults.benchmark.averageLatencyMs} ms</div>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Top Gravity Score</div>
              <div className="text-2xl font-extrabold text-orange-500 mt-1">{simResults.benchmark.topRankScore}</div>
            </div>
          </div>

          {/* Top Ingested Leaderboard Sample */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Ranked Ingested Cohort</h4>
            <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-background">
              {simResults.topSamples.map((p: any, idx: number) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-muted/30 transition">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-muted-foreground w-5 text-center">#{idx + 1}</span>
                    <div>
                      <span className="font-bold text-foreground">{p.name}</span>
                      <span className="text-muted-foreground ml-2">({p.category})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-muted-foreground">Upvotes: <strong className="text-foreground">{p.upvotes_count}</strong></span>
                    <span className="font-medium text-muted-foreground">Comments: <strong className="text-foreground">{p.comments_count}</strong></span>
                    <span className="font-mono font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                      Gravity: {p.gravity_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drop Results */}
      {dropResults && (
        <div className="bg-card border border-blue-500/30 rounded-2xl p-5 text-xs space-y-2">
          <div className="font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>00:01 Launch Drop Result: {dropResults.message}</span>
          </div>
          <div className="text-muted-foreground">
            Dropped: {dropResults.droppedCount} | Featured: {dropResults.featuredCount} | Community: {dropResults.communityCount} | Duration: {dropResults.durationMs}ms
          </div>
        </div>
      )}

      {/* Flush Results */}
      {flushResults && (
        <div className="bg-card border border-emerald-500/30 rounded-2xl p-5 text-xs space-y-2">
          <div className="font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Write-Behind Upvote Buffer Flushed</span>
          </div>
          <div className="text-muted-foreground">
            Flushed Products: {flushResults.flushedProducts} | Errors: {flushResults.errors} | Duration: {flushResults.durationMs}ms
          </div>
        </div>
      )}
    </div>
  );
}
