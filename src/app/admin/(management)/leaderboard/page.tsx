import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import {
  Trophy,
  ArrowUp,
  MessageSquare,
  Crown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { adminRemoveOverride } from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Leaderboard | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; period?: string }>;
}

// ─── Leaderboard Table ────────────────────────────────────────────────────
async function LeaderboardTable({ page, limit, period }: { page: number; limit: number; period: string }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  // Calculate date range
  const now = new Date();
  let sinceDate: string | null = null;
  if (period === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    sinceDate = d.toISOString();
  } else if (period === "week") {
    sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (period === "month") {
    sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  let query = supabase
    .from("products")
    .select("id, name, logo_url, tagline, upvotes_count, comments_count, featured, created_at, vote_velocity_flag", { count: "exact" })
    .eq("is_deleted", false)
    .order("upvotes_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (sinceDate) {
    query = query.gte("created_at", sinceDate);
  }

  const { data: products, count } = await query;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {["Rank", "Product", "Upvotes", "Comments", "Points", "Status", "Launched", "View"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(products || []).map((p, i) => {
              const rank = offset + i + 1;
              const points = (p.upvotes_count ?? 0) + (p.comments_count ?? 0);
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {rank <= 3 ? (
                        <Crown className={`w-4 h-4 ${rank === 1 ? "text-amber-400" : rank === 2 ? "text-slate-400" : "text-amber-600"}`} />
                      ) : null}
                      <span className="text-sm font-extrabold text-slate-400">#{rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Image src={p.logo_url || "/favicon.png"} alt="" className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0" width={32} height={32} />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate max-w-[180px]">{p.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[180px]">{p.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-orange-400 font-semibold">
                      <ArrowUp className="w-3 h-3" />{p.upvotes_count}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.comments_count}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-slate-800">{points}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {p.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">⭐ Featured</span>
                      )}
                      {p.vote_velocity_flag && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">⚠️ Flagged</span>
                      )}
                      {!p.featured && !p.vote_velocity_flag && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">Live</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}`} target="_blank" className="text-xs text-blue-400 hover:underline font-semibold">View →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!products || products.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-sm">No products found for this period.</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

// ─── Active Overrides ─────────────────────────────────────────────────────
async function ActiveOverrides() {
  const supabase = await createServerSupabase();
  const { data: overrides } = await supabase
    .from("leaderboard_overrides")
    .select("id, reason, override_type, rank_position, notes, expires_at, created_at, product:products!product_id(name, logo_url), admin:profiles!admin_id(username)")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  if (!overrides || overrides.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Active Overrides</h3>
        <p className="text-sm text-slate-400 text-center py-4">No active overrides</p>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    pin: "bg-blue-500/10 text-blue-400",
    boost: "bg-emerald-500/10 text-emerald-400",
    suppress: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Active Overrides</h3>
      <div className="space-y-3">
        {overrides.map((o) => {
          const product = o.product as any;
          const admin = o.admin as any;
          const expiresIn = Math.max(0, Math.ceil((new Date(o.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)));
          return (
            <div key={o.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image src={product?.logo_url || "/favicon.png"} alt="" className="w-5 h-5 rounded-md border border-slate-200" width={20} height={20} />
                  <span className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{product?.name || "—"}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeColors[o.override_type] || ""}`}>
                  {o.override_type}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                by @{admin?.username || "admin"} · expires in {expiresIn}h
              </div>
              {o.notes && <div className="text-xs text-slate-500 italic">{o.notes}</div>}
              <form action={async () => { "use server"; await adminRemoveOverride(o.id); }}>
                <button type="submit" className="text-xs text-red-400 hover:text-red-500 font-semibold">Remove Override</button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function AdminLeaderboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "20", 10)));
  const period = params.period || "today";

  const PERIODS = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Trophy className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Leaderboard</h1>
            <p className="text-sm text-slate-500 font-normal mt-0.5">Product rankings by upvotes + comments</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-400/70 leading-relaxed">Rankings are algorithmic. Use overrides with accountability.</p>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {PERIODS.map((p) => (
          <Link key={p.key} href={`?period=${p.key}&page=1`}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${period === p.key ? "bg-amber-500/15 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            {p.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table — 3/4 */}
        <div className="lg:col-span-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            <Suspense fallback={<div className="p-8 text-center flex flex-col items-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span className="text-sm text-slate-500">Loading leaderboard...</span></div>}>
              <LeaderboardTable page={page} limit={limit} period={period} />
            </Suspense>
          </div>
        </div>

        {/* Sidebar — 1/4 */}
        <div>
          <Suspense fallback={<div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>}>
            <ActiveOverrides />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
