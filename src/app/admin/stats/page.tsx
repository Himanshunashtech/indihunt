import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { BarChart3, TrendingUp, Users, Package, ArrowUp, MessageSquare, Loader2 } from "lucide-react";

export const metadata = { title: "Platform Stats | Admin Console | IndiHunt" };

async function TopProducts() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("products")
    .select("id, name, logo_url, upvotes_count, comments_count")
    .order("upvotes_count", { ascending: false })
    .limit(10);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <ArrowUp className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-slate-900">Top 10 Products by Upvotes</h3>
      </div>
      <div className="space-y-2">
        {(data || []).map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100/50 transition-colors">
            <span className="text-base font-extrabold text-slate-300 w-5 shrink-0">#{i + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.logo_url || "/favicon.png"} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200" />
            <span className="text-base font-medium text-slate-800 flex-1 truncate">{p.name}</span>
            <div className="flex items-center gap-1 text-orange-400 text-base font-semibold shrink-0">
              <ArrowUp className="w-3 h-3" />{p.upvotes_count}
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && <p className="text-base text-slate-400 text-center py-4">No products yet.</p>}
      </div>
    </div>
  );
}

async function TopUsers() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, karma_points, followers_count")
    .order("karma_points", { ascending: false })
    .limit(10);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-900">Top 10 Users by Karma</h3>
      </div>
      <div className="space-y-2">
        {(data || []).map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100/50 transition-colors">
            <span className="text-base font-extrabold text-slate-300 w-5 shrink-0">#{i + 1}</span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-slate-900 font-semibold text-xs shrink-0 overflow-hidden">
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (u.full_name?.charAt(0) || "U").toUpperCase()
              )}
            </div>
            <span className="text-base font-medium text-slate-800 flex-1 truncate">@{u.username}</span>
            <span className="text-base font-semibold text-amber-400 shrink-0">{u.karma_points ?? 0} pts</span>
          </div>
        ))}
        {(!data || data.length === 0) && <p className="text-base text-slate-400 text-center py-4">No users yet.</p>}
      </div>
    </div>
  );
}

async function GrowthStats() {
  const supabase = await createServerSupabase();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: newUsers },
    { count: newProducts },
    { count: newComments },
    { count: totalUpvotes },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("products").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("comments").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("upvotes").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
  ]);

  const stats = [
    { label: "New Users (30d)", value: newUsers ?? 0, icon: Users, color: "text-blue-400" },
    { label: "New Products (30d)", value: newProducts ?? 0, icon: Package, color: "text-orange-400" },
    { label: "New Comments (30d)", value: newComments ?? 0, icon: MessageSquare, color: "text-green-400" },
    { label: "Upvotes Cast (30d)", value: totalUpvotes ?? 0, icon: ArrowUp, color: "text-amber-400" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-900">Growth (Last 30 Days)</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-4 bg-slate-100/50 rounded-xl border border-slate-100">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <div className="text-xl font-extrabold text-slate-900">{s.value.toLocaleString()}</div>
            <div className="text-sm text-slate-500 font-normal mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminStatsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <BarChart3 className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Statistics</h1>
          <p className="text-base text-slate-500 font-normal mt-0.5">Aggregated data and growth trends</p>
        </div>
      </div>

      {/* Growth stats */}
      <Suspense fallback={<div className="h-48 bg-slate-100/50 border border-slate-200 rounded-2xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>}>
        <GrowthStats />
      </Suspense>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-96 bg-slate-100/50 border border-slate-200 rounded-2xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>}>
          <TopProducts />
        </Suspense>
        <Suspense fallback={<div className="h-96 bg-slate-100/50 border border-slate-200 rounded-2xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>}>
          <TopUsers />
        </Suspense>
      </div>
    </div>
  );
}
