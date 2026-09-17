import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  Users,
  Package,
  MessageSquare,
  Star,
  Flag,
  BookOpen,
  Megaphone,
  Bell,
  TrendingUp,
  ShieldCheck,
  Activity,
  AlertCircle,
  Loader2,
  Rocket,
  ArrowUp,
  AlertTriangle,
  Clock,
  BarChart3,
} from "lucide-react";
import { StatCard, StatCardSkeleton } from "@/app/admin/_components/StatCard";
import Link from "next/link";

export const metadata = {
  title: "Dashboard | Admin Console | IndiHunt",
};

// ── Greeting ──────────────────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning ☀️";
  if (hour < 17) return "Good Afternoon 👋";
  return "Good Evening 🌙";
}

// ── Each stat is its own async Server Component → parallel Suspense ─────────
async function UsersStats() {
  const supabase = await createServerSupabase();
  const [{ count: total }, { count: admins }, { count: makers }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_maker", true),
  ]);
  return (
    <>
      <StatCard label="Total Users" value={total ?? 0} icon={Users} color="blue" sub={`${admins ?? 0} admins · ${makers ?? 0} makers`} />
    </>
  );
}

async function ProductsStats() {
  const supabase = await createServerSupabase();
  const [{ count: total }, { count: featured }, { count: deleted }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("featured", true),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_deleted", true),
  ]);
  return (
    <StatCard label="Total Products" value={total ?? 0} icon={Package} color="orange" sub={`${featured ?? 0} featured · ${deleted ?? 0} deleted`} />
  );
}

async function TodayStats() {
  const supabase = await createServerSupabase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [
    { count: launchesToday },
    { count: upvotesToday },
    { count: commentsToday },
    { count: usersToday },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("upvotes").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("comments").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
  ]);

  return (
    <>
      <StatCard label="Launches Today" value={launchesToday ?? 0} icon={Rocket} color="purple" />
      <StatCard label="Upvotes Today" value={upvotesToday ?? 0} icon={ArrowUp} color="orange" />
      <StatCard label="Comments Today" value={commentsToday ?? 0} icon={MessageSquare} color="green" />
      <StatCard label="New Users Today" value={usersToday ?? 0} icon={Users} color="blue" />
    </>
  );
}

async function ReportsStats() {
  const supabase = await createServerSupabase();
  const [{ count: threadReps }, { count: prodReps }, { count: commentReps }] = await Promise.all([
    supabase.from("thread_reports").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }),
    supabase.from("comment_reports").select("*", { count: "exact", head: true }),
  ]);
  const total = (threadReps ?? 0) + (prodReps ?? 0) + (commentReps ?? 0);
  return (
    <StatCard label="Pending Reports" value={total} icon={Flag} color="red"
      sub={`${threadReps ?? 0} threads · ${prodReps ?? 0} products · ${commentReps ?? 0} comments`} />
  );
}

async function AdsStats() {
  const supabase = await createServerSupabase();
  const [{ count: active }, { data: budgetData }] = await Promise.all([
    supabase.from("ad_campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("ad_campaigns").select("total_budget"),
  ]);
  const totalSpend = budgetData?.reduce((s, c) => s + (Number(c.total_budget) || 0), 0) ?? 0;
  return (
    <StatCard label="Active Ad Campaigns" value={active ?? 0} icon={Megaphone} color="purple"
      sub={`$${totalSpend.toFixed(2)} total budget allocated`} />
  );
}

// ── Needs Attention ──────────────────────────────────────────────────────
async function NeedsAttention() {
  const supabase = await createServerSupabase();

  const [{ count: pendingReports }, { count: threadReports }, { count: productReports }, { count: commentReports }, { count: flaggedProducts }] = await Promise.all([
    supabase.from("reports").select("*", { count: "exact", head: true }),
    supabase.from("thread_reports").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }),
    supabase.from("comment_reports").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("vote_velocity_flag", true),
  ]);

  const totalReports = (threadReports ?? 0) + (productReports ?? 0) + (commentReports ?? 0);

  const items = [
    { label: "Pending reports", count: totalReports, href: "/admin/reports", color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Fraud-flagged products", count: flaggedProducts ?? 0, href: "/admin/voting", color: "text-amber-400", bg: "bg-amber-500/10" },
  ].filter(item => item.count > 0);

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900">All Clear 🎉</h3>
        </div>
        <p className="text-sm text-slate-400">Nothing needs your immediate attention.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-red-200 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h3 className="text-sm font-semibold text-slate-900">⚠️ Needs Attention</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg ${item.bg} flex items-center justify-center`}>
                <span className={`text-xs font-bold ${item.color}`}>{item.count}</span>
              </div>
              <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900">{item.label}</span>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-orange-400 font-semibold">View →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Live Launches Today ──────────────────────────────────────────────────
async function LiveLaunches() {
  const supabase = await createServerSupabase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, logo_url, upvotes_count, comments_count, created_at")
    .gte("created_at", todayStart.toISOString())
    .eq("is_deleted", false)
    .order("upvotes_count", { ascending: false })
    .limit(10);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <Rocket className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-slate-900">🚀 Live Launches Today</h3>
      </div>
      {(!products || products.length === 0) ? (
        <p className="text-sm text-slate-400 text-center py-6">No launches today yet.</p>
      ) : (
        <div className="space-y-1.5">
          {products.map((p, i) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              target="_blank"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group"
            >
              <span className="text-xs font-extrabold text-slate-300 w-5 shrink-0">#{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.logo_url || "/favicon.png"}
                alt=""
                className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200"
              />
              <span className="text-sm font-medium text-slate-800 flex-1 truncate group-hover:text-orange-500 transition-colors">
                {p.name}
              </span>
              <div className="flex items-center gap-3 shrink-0 text-xs">
                <span className="flex items-center gap-1 text-orange-400 font-semibold">
                  <ArrowUp className="w-3 h-3" />{p.upvotes_count}
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-medium">
                  <MessageSquare className="w-3 h-3" />{p.comments_count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Growth Sparkline (7-day) ──────────────────────────────────────────────
async function GrowthSparkline() {
  const supabase = await createServerSupabase();
  const days: { label: string; users: number; products: number; upvotes: number }[] = [];

  for (let i = 6; i >= 0; i--) {
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
      label: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
      users: users ?? 0,
      products: products ?? 0,
      upvotes: upvotes ?? 0,
    });
  }

  const maxUpvotes = Math.max(...days.map(d => d.upvotes), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-900">📈 7-Day Growth</h3>
      </div>
      <div className="space-y-4">
        {/* Upvotes bar chart */}
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Upvotes per day</div>
          <div className="flex items-end gap-1.5 h-20">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-md transition-all"
                  style={{ height: `${Math.max((d.upvotes / maxUpvotes) * 100, 4)}%`, minHeight: 3 }}
                />
                <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-blue-500/5 rounded-lg">
            <div className="text-lg font-bold text-slate-800">{days.reduce((s, d) => s + d.users, 0)}</div>
            <div className="text-[10px] text-slate-400 font-semibold">New Users</div>
          </div>
          <div className="text-center p-2 bg-orange-500/5 rounded-lg">
            <div className="text-lg font-bold text-slate-800">{days.reduce((s, d) => s + d.products, 0)}</div>
            <div className="text-[10px] text-slate-400 font-semibold">New Products</div>
          </div>
          <div className="text-center p-2 bg-emerald-500/5 rounded-lg">
            <div className="text-lg font-bold text-slate-800">{days.reduce((s, d) => s + d.upvotes, 0)}</div>
            <div className="text-[10px] text-slate-400 font-semibold">Upvotes</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recent Activity Feed ────────────────────────────────────────────────────
async function RecentActivity() {
  const supabase = await createServerSupabase();

  const [{ data: newUsers }, { data: newProducts }, { data: newReports }] = await Promise.all([
    supabase.from("profiles").select("id, username, full_name, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("thread_reports").select("id, reason, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const activities = [
    ...(newUsers || []).map((u) => ({ type: "user", label: `New user: @${u.username}`, time: u.created_at, color: "blue" as const })),
    ...(newProducts || []).map((p) => ({ type: "product", label: `New product: ${p.name}`, time: p.created_at, color: "orange" as const })),
    ...(newReports || []).map((r) => ({ type: "report", label: `Thread report: ${r.reason}`, time: r.created_at, color: "red" as const })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 12);

  const colorMap = { blue: "bg-blue-500", orange: "bg-orange-500", red: "bg-red-500" };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <Activity className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-base text-slate-400 text-center py-4">No recent activity</p>
        ) : (
          activities.map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorMap[a.color]}`} />
              <span className="text-sm text-slate-700 font-normal flex-1 truncate">{a.label}</span>
              <span className="text-xs text-slate-400 shrink-0">
                {new Date(a.time).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { href: "/admin/moderation", label: "Moderation Center", icon: Flag, color: "text-red-400" },
  { href: "/admin/products", label: "Review Products", icon: Package, color: "text-orange-400" },
  { href: "/admin/users", label: "Manage Users", icon: Users, color: "text-blue-400" },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: TrendingUp, color: "text-emerald-400" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, color: "text-purple-400" },
  { href: "/admin/ads", label: "Ad Campaigns", icon: Megaphone, color: "text-amber-400" },
];

// ── Page ────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header with Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{getGreeting()}</h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Here&apos;s what&apos;s happening on IndiHunt today — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">Live</span>
        </div>
      </div>

      {/* Today's KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Suspense fallback={<><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>}>
          <TodayStats />
        </Suspense>
      </div>

      {/* Platform overview row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Suspense fallback={<StatCardSkeleton />}><UsersStats /></Suspense>
        <Suspense fallback={<StatCardSkeleton />}><ProductsStats /></Suspense>
        <Suspense fallback={<StatCardSkeleton />}><ReportsStats /></Suspense>
        <Suspense fallback={<StatCardSkeleton />}><AdsStats /></Suspense>
      </div>

      {/* Main content: 2/3 + 1/3 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Needs Attention */}
          <Suspense fallback={
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            </div>
          }>
            <NeedsAttention />
          </Suspense>

          {/* Live Launches */}
          <Suspense fallback={
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center h-48">
              <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            </div>
          }>
            <LiveLaunches />
          </Suspense>

          {/* Growth Sparkline */}
          <Suspense fallback={
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center h-48">
              <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            </div>
          }>
            <GrowthSparkline />
          </Suspense>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
            </div>
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f2f4f8] transition-all group cursor-pointer"
              >
                <link.icon className={`w-4 h-4 ${link.color} group-hover:text-black transition-colors`} />
                <span className="text-sm font-medium text-slate-700 group-hover:text-black transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-400/70 font-normal leading-relaxed">
                  All admin actions are logged and irreversible. Act with care.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <Suspense fallback={
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          }>
            <RecentActivity />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
