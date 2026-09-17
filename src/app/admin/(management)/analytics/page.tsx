import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  TrendingUp,
  Users,
  Package,
  ArrowUp,
  MessageSquare,
  Eye,
  MousePointer,
  Loader2,
  BarChart3,
} from "lucide-react";

export const metadata = { title: "Analytics | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

// ─── Platform Overview Cards ──────────────────────────────────────────────
async function PlatformOverview({ range }: { range: string }) {
  const supabase = await createServerSupabase();
  const sinceDate = getRangeDate(range);

  const queries = [
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sinceDate),
    supabase.from("products").select("*", { count: "exact", head: true }).gte("created_at", sinceDate),
    supabase.from("upvotes").select("*", { count: "exact", head: true }).gte("created_at", sinceDate),
    supabase.from("comments").select("*", { count: "exact", head: true }).gte("created_at", sinceDate),
    supabase.from("reviews").select("*", { count: "exact", head: true }).gte("created_at", sinceDate),
    supabase.from("product_views").select("*", { count: "exact", head: true }).gte("viewed_at", sinceDate),
  ];

  const results = await Promise.all(queries);
  const [users, products, upvotes, comments, reviews, views] = results.map(r => r.count ?? 0);

  const cards = [
    { label: "New Users", value: users, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "New Products", value: products, icon: Package, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Upvotes", value: upvotes, icon: ArrowUp, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Comments", value: comments, icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Reviews", value: reviews, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Product Views", value: views, icon: Eye, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
            <c.icon className={`w-4 h-4 ${c.color}`} />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{c.value.toLocaleString()}</div>
          <div className="text-xs text-slate-400 font-semibold mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Daily Growth Chart ───────────────────────────────────────────────────
async function DailyGrowthChart({ range }: { range: string }) {
  const supabase = await createServerSupabase();
  const numDays = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 30;
  const days: { label: string; users: number; products: number; upvotes: number }[] = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [{ count: users }, { count: products }, { count: upvotes }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString()).lt("created_at", dayEnd.toISOString()),
      supabase.from("products").select("*", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString()).lt("created_at", dayEnd.toISOString()),
      supabase.from("upvotes").select("*", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString()).lt("created_at", dayEnd.toISOString()),
    ]);

    days.push({
      label: dayStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      users: users ?? 0,
      products: products ?? 0,
      upvotes: upvotes ?? 0,
    });
  }

  const maxUpvotes = Math.max(...days.map(d => d.upvotes), 1);
  const maxUsers = Math.max(...days.map(d => d.users), 1);

  const showEveryNth = numDays > 14 ? Math.ceil(numDays / 14) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upvotes Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUp className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-900">Upvotes per Day</h3>
        </div>
        <div className="flex items-end gap-[2px] h-32">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {d.label}: {d.upvotes}
              </div>
              <div
                className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-sm transition-all hover:opacity-80"
                style={{ height: `${Math.max((d.upvotes / maxUpvotes) * 100, 2)}%`, minHeight: 2 }}
              />
              {i % showEveryNth === 0 && (
                <span className="text-[8px] text-slate-400 font-medium truncate w-full text-center">{d.label.split(" ")[1]}</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-400 text-center">
          Total: <strong className="text-slate-700">{days.reduce((s, d) => s + d.upvotes, 0).toLocaleString()}</strong> upvotes
        </div>
      </div>

      {/* Users Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900">New Users per Day</h3>
        </div>
        <div className="flex items-end gap-[2px] h-32">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {d.label}: {d.users}
              </div>
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-sm transition-all hover:opacity-80"
                style={{ height: `${Math.max((d.users / maxUsers) * 100, 2)}%`, minHeight: 2 }}
              />
              {i % showEveryNth === 0 && (
                <span className="text-[8px] text-slate-400 font-medium truncate w-full text-center">{d.label.split(" ")[1]}</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-400 text-center">
          Total: <strong className="text-slate-700">{days.reduce((s, d) => s + d.users, 0).toLocaleString()}</strong> new users
        </div>
      </div>
    </div>
  );
}

// ─── Top Performing Products ──────────────────────────────────────────────
async function TopPerforming({ range }: { range: string }) {
  const supabase = await createServerSupabase();
  const sinceDate = getRangeDate(range);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, logo_url, upvotes_count, comments_count, views_count")
    .eq("is_deleted", false)
    .gte("created_at", sinceDate)
    .order("upvotes_count", { ascending: false })
    .limit(10);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-900">Top Performing Products</h3>
      </div>
      <div className="space-y-2">
        {(products || []).map((p, i) => {
          const engagement = (p.upvotes_count ?? 0) + (p.comments_count ?? 0);
          const convRate = (p.views_count ?? 0) > 0 ? (((p.upvotes_count ?? 0) / (p.views_count ?? 1)) * 100).toFixed(1) : "0.0";
          return (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <span className="text-xs font-extrabold text-slate-300 w-5 shrink-0">#{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.logo_url || "/favicon.png"} alt="" className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" />
              <span className="text-sm font-medium text-slate-800 flex-1 truncate">{p.name}</span>
              <div className="flex items-center gap-3 shrink-0 text-xs">
                <span className="text-orange-400 font-semibold">{p.upvotes_count} ↑</span>
                <span className="text-slate-400">{p.views_count ?? 0} views</span>
                <span className="text-emerald-400 font-semibold">{convRate}% conv</span>
              </div>
            </div>
          );
        })}
        {(!products || products.length === 0) && (
          <p className="text-sm text-slate-400 text-center py-4">No products in this period.</p>
        )}
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────
function getRangeDate(range: string): string {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "all") return new Date("2020-01-01").toISOString();
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // default 30d
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = params.range || "30d";

  const RANGES = [
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "90d", label: "90 Days" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
            <p className="text-sm text-slate-500 font-normal mt-0.5">Deep platform analytics and growth trends</p>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {RANGES.map((r) => (
            <Link key={r.key} href={`?range=${r.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${range === r.key ? "bg-emerald-500/15 text-emerald-500 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <Suspense fallback={<div className="h-28 bg-slate-100/50 rounded-2xl flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>}>
        <PlatformOverview range={range} />
      </Suspense>

      {/* Charts */}
      <Suspense fallback={<div className="h-48 bg-slate-100/50 rounded-2xl flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>}>
        <DailyGrowthChart range={range} />
      </Suspense>

      {/* Top Performing */}
      <Suspense fallback={<div className="h-48 bg-slate-100/50 rounded-2xl flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>}>
        <TopPerforming range={range} />
      </Suspense>
    </div>
  );
}
