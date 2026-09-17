import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { AdminSearch } from "@/app/admin/_components/AdminSearch";
import {
  Vote,
  AlertTriangle,
  Shield,
  ArrowUp,
  Clock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  adminUnfreezeVoting,
} from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Voting & Anti-Fraud | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; tab?: string; q?: string }>;
}

// ─── Risk Overview ────────────────────────────────────────────────────────
async function RiskOverview() {
  const supabase = await createServerSupabase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: flaggedProducts },
    { count: newAccountVotes },
    { count: totalVotesToday },
    { count: highRiskVotes },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("vote_velocity_flag", true),
    supabase.from("upvotes").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
    supabase.from("upvotes").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    supabase.from("upvotes").select("*", { count: "exact", head: true }).gte("risk_score", 70),
  ]);

  const cards = [
    { label: "Flagged Products", value: flaggedProducts ?? 0, icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Votes Today", value: totalVotesToday ?? 0, icon: ArrowUp, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Votes (24h)", value: newAccountVotes ?? 0, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "High Risk Votes", value: highRiskVotes ?? 0, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{c.value.toLocaleString()}</div>
          <div className="text-xs text-slate-400 font-semibold mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Flagged Products Table ───────────────────────────────────────────────
async function FlaggedProductsTable({ page, limit }: { page: number; limit: number }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  const { data: products, count } = await supabase
    .from("products")
    .select("id, name, logo_url, upvotes_count, comments_count, vote_velocity_flag, created_at", { count: "exact" })
    .eq("vote_velocity_flag", true)
    .order("upvotes_count", { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {["Product", "Upvotes", "Comments", "Status", "Launched", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(products || []).map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.logo_url || "/favicon.png"} alt="" className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" />
                    <span className="font-medium text-slate-800 truncate max-w-[180px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-orange-400 font-semibold">{p.upvotes_count}</td>
                <td className="px-4 py-3 text-slate-600">{p.comments_count}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
                    ⚠️ Flagged
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(p.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <form action={async () => {
                    "use server";
                    await adminUnfreezeVoting(p.id);
                  }}>
                    <button type="submit" className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-semibold transition-all">
                      <ShieldCheck className="w-3 h-3" /> Unfreeze
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!products || products.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-sm">🎉 No flagged products!</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

// ─── Recent Votes Log ─────────────────────────────────────────────────────
async function VoteLog({ page, limit, q }: { page: number; limit: number; q: string }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("upvotes")
    .select(
      "id, created_at, risk_score, product_id, product:products!product_id(name), user:profiles!user_id(username, trust_score, created_at)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // If searching, filter by product name
  if (q) {
    query = query.or(`product.name.ilike.%${q}%`);
  }

  const { data: votes, count } = await query;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {["User", "Product", "Risk Score", "Account Age", "Voted At"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(votes || []).map((v) => {
              const user = v.user as any;
              const product = v.product as any;
              const accountAgeDays = user?.created_at
                ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              const riskLevel = (v.risk_score ?? 0) >= 70 ? "high" : (v.risk_score ?? 0) >= 40 ? "medium" : "low";
              const riskColors = { high: "text-red-400 bg-red-500/10", medium: "text-amber-400 bg-amber-500/10", low: "text-emerald-400 bg-emerald-500/10" };

              return (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">@{user?.username || "anon"}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium truncate max-w-[180px]">{product?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${riskColors[riskLevel]}`}>
                      {v.risk_score ?? 0}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {accountAgeDays < 1 ? (
                      <span className="text-red-400 font-semibold">New today</span>
                    ) : (
                      `${accountAgeDays}d`
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(v.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!votes || votes.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-sm">No votes found.</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

// ─── Fraud Score Explainer ────────────────────────────────────────────────
function FraudScoreExplainer() {
  const factors = [
    { label: "Account Age", weight: "10%", color: "bg-blue-400" },
    { label: "IP Similarity", weight: "20%", color: "bg-orange-400" },
    { label: "Device Similarity", weight: "20%", color: "bg-red-400" },
    { label: "Voting Velocity", weight: "20%", color: "bg-amber-400" },
    { label: "User Reputation", weight: "15%", color: "bg-emerald-400" },
    { label: "Behavior Pattern", weight: "15%", color: "bg-purple-400" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Fraud Score Breakdown</h3>
      </div>
      <div className="space-y-2">
        {factors.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${f.color} shrink-0`} />
            <span className="text-sm text-slate-700 flex-1">{f.label}</span>
            <span className="text-xs font-bold text-slate-500">{f.weight}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
        Scores 70+ trigger fraud review. Algorithm details are internal only.
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function AdminVotingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "30", 10)));
  const tab = params.tab || "votes";
  const q = params.q || "";

  const TABS = [
    { key: "votes", label: "Live Vote Log", icon: ArrowUp },
    { key: "flagged", label: "Flagged Products", icon: ShieldAlert },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Vote className="w-4.5 h-4.5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Voting & Anti-Fraud</h1>
          <p className="text-sm text-slate-500 font-normal mt-0.5">Monitor authentic live votes, detect fraud, and manage flagged products</p>
        </div>
      </div>

      {/* Risk Overview */}
      <Suspense fallback={<div className="h-24 bg-slate-100/50 rounded-2xl flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>}>
        <RiskOverview />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content — 3/4 */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <Link key={t.key} href={`?tab=${t.key}&page=1`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "bg-amber-500/15 text-amber-600" : "text-slate-500 hover:text-slate-800"}`}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </Link>
              );
            })}
          </div>

          {tab === "votes" && <AdminSearch placeholder="Search by product name..." />}

          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            <Suspense fallback={<div className="p-8 text-center flex flex-col items-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span>Loading...</span></div>}>
              {tab === "flagged" && <FlaggedProductsTable page={page} limit={limit} />}
              {tab === "votes" && <VoteLog page={page} limit={limit} q={q} />}
            </Suspense>
          </div>
        </div>

        {/* Sidebar — 1/4 */}
        <div>
          <FraudScoreExplainer />
        </div>
      </div>
    </div>
  );
}


