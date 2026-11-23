import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/app/admin/_actions/admin-actions";
import { AdminSearch } from "@/app/admin/_components/AdminSearch";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { Package, ArrowUp, Loader2, Rocket, Calendar, Clock, Eye, Sparkles } from "lucide-react";
import { ProductActionButtons } from "./ProductActionButtons";
import { UpcomingProductActions } from "./UpcomingProductActions";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Products & Upcoming Launches | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    limit?: string;
    q?: string;
    filter?: string;
    sort?: string;
  }>;
}

// ─── Format Relative Countdown ──────────────────────────────────────────
function formatLaunchCountdown(dateStr?: string) {
  if (!dateStr) return { text: "No date set", color: "bg-slate-100 text-slate-500" };
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return { text: "Ready / Past Due", color: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0) {
    return {
      text: diffHours <= 1 ? "In < 1 hour" : `In ${diffHours} hours`,
      color: "bg-orange-500/10 text-orange-600 border border-orange-500/20 font-bold animate-pulse"
    };
  }
  if (diffDays === 1) {
    return { text: "Tomorrow", color: "bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold" };
  }
  return { text: `In ${diffDays} days`, color: "bg-blue-500/10 text-blue-600 border border-blue-500/20" };
}

// ─── Upcoming Launches Table ───────────────────────────────────────────
async function UpcomingProductsTable({
  page,
  limit,
  q,
}: {
  page: number;
  limit: number;
  q: string;
}) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;
  const now = new Date();
  const startOfTomorrowIso = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  let query = supabase
    .from("products")
    .select(
      "id, name, tagline, logo_url, maker_id, status, scheduled_for, created_at, is_deleted, upvotes_count, comments_count, views_count, maker:profiles!maker_id(username, full_name, avatar_url)",
      { count: "exact" }
    )
    .eq("is_deleted", false)
    .eq("status", "scheduled")
    .gte("scheduled_for", startOfTomorrowIso)
    .order("scheduled_for", { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%`);
  }

  const { data: products, count, error } = await query;
  if (error) {
    console.error("[UpcomingProductsTable] Supabase error:", error.message, error.details);
    return (
      <div className="py-16 text-center">
        <p className="text-red-400 text-sm font-semibold">Query Error</p>
        <p className="text-slate-400 text-base mt-1 font-mono">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["Product", "Maker", "Scheduled Launch Date", "Countdown", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(products || []).map((prod) => {
              const maker = prod.maker as any;
              const countdown = formatLaunchCountdown(prod.scheduled_for);
              const launchDate = prod.scheduled_for ? new Date(prod.scheduled_for) : new Date(prod.created_at);

              return (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Image
                        src={prod.logo_url || "/favicon.png"}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                      width={36} height={36} />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate max-w-[180px] flex items-center gap-1.5">
                          {prod.name}
                        </div>
                        <div className="text-slate-500 text-xs truncate max-w-[200px] mt-0.5">{prod.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex items-center gap-2">
                      {maker?.avatar_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <Image src={maker.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" width={20} height={20} />
                      )}
                      <span className="text-sm font-medium">@{maker?.username || "maker"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-800 text-sm font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      {launchDate.toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {launchDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${countdown.color}`}>
                      {countdown.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold">
                      <Rocket className="w-3 h-3" /> Scheduled
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <UpcomingProductActions
                      productId={prod.id}
                      productName={prod.name}
                      scheduledFor={prod.scheduled_for}
                      isDeleted={prod.is_deleted}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!products || products.length === 0) && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">No Upcoming Launches Scheduled</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                When makers schedule products for future dates, they will appear here with instant launch and reschedule controls.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

// ─── Standard Products Table ───────────────────────────────────────────
async function ProductsTable({
  page,
  limit,
  q,
  filter,
  sort,
}: {
  page: number;
  limit: number;
  q: string;
  filter: string;
  sort: string;
}) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;
  const now = new Date();

  const orderCol = sort === "upvotes" ? "upvotes_count" : sort === "comments" ? "comments_count" : "created_at";

  let query = supabase
    .from("products")
    .select(
      "id, name, tagline, logo_url, maker_id, upvotes_count, comments_count, featured, status, scheduled_for, created_at, is_deleted, views_count, maker:profiles!maker_id(username, full_name, avatar_url)",
      { count: "exact" }
    )
    .order(orderCol, { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%`);
  }
  if (filter === "featured") query = query.eq("featured", true);
  else if (filter === "deleted") query = query.eq("is_deleted", true);
  else if (filter === "active") query = query.eq("is_deleted", false);

  const { data: products, count, error } = await query;
  if (error) console.error("[AdminProductsTable] Supabase error:", error.message, error.details, error.hint);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-400 text-sm font-semibold">Query Error</p>
        <p className="text-slate-400 text-base mt-1 font-mono">{error.message}</p>
        {error.hint && <p className="text-slate-300 text-base mt-1">{error.hint}</p>}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["Product", "Maker", "Upvotes", "Comments", "Views", "Status", "Launched / Scheduled", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(products || []).map((prod) => {
              const maker = prod.maker as any;
              const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
              const launchTime = prod.scheduled_for ? new Date(prod.scheduled_for).getTime() : 0;
              const isScheduled = prod.status === "scheduled" && launchTime >= startOfTomorrow;

              return (
                <tr key={prod.id} className={`hover:bg-slate-50/80 transition-colors ${prod.is_deleted ? "opacity-40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Image
                        src={prod.logo_url || "/favicon.png"}
                        alt=""
                        className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                      width={32} height={32} />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate max-w-[150px]">{prod.name}</div>
                        <div className="text-slate-400 truncate max-w-[150px] mt-0.5 text-xs">{prod.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">@{maker?.username || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-orange-500 font-semibold">
                      <ArrowUp className="w-3.5 h-3.5" />
                      {prod.upvotes_count}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{prod.comments_count}</td>
                  <td className="px-4 py-3 text-slate-600">{prod.views_count ?? 0}</td>
                  <td className="px-4 py-3">
                    {prod.is_deleted ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-semibold">Deleted</span>
                    ) : isScheduled ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-semibold flex items-center gap-1 w-fit">
                        <Rocket className="w-3 h-3" /> Scheduled
                      </span>
                    ) : prod.featured ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold">Featured</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold">Live</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-sm">
                    {new Date(prod.scheduled_for || prod.created_at).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <ProductActionButtons productId={prod.id} featured={prod.featured} isDeleted={prod.is_deleted} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!products || products.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">No products match your filters.</div>
        )}
      </div>

      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────
export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab || "all";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "20", 10)));
  const q = params.q || "";
  const filter = params.filter || "all";
  const sort = params.sort || "date";

  const supabase = await createServerSupabase();
  const now = new Date();
  const startOfTomorrowIso = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  // Auto-promote any scheduled products whose launch date has arrived (today or past) using admin service client
  try {
    const adminSupabase = await createAdminSupabase();
    await adminSupabase
      .from("products")
      .update({ status: "live" })
      .eq("status", "scheduled")
      .lt("scheduled_for", startOfTomorrowIso);
  } catch (err) {
    console.error("[AdminProductsPage] Error auto-promoting scheduled products:", err);
  }

  // Fetch counts for tabs
  const [allCountRes, upcomingCountRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_deleted", false),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("status", "scheduled")
      .gte("scheduled_for", startOfTomorrowIso),
  ]);

  const allCount = allCountRes.count ?? 0;
  const upcomingCount = upcomingCountRes.count ?? 0;

  const TABS = [
    { key: "all", label: "All Products", icon: Package, count: allCount },
    { key: "upcoming", label: "Upcoming Launches", icon: Rocket, count: upcomingCount },
  ];

  const FILTERS = ["all", "featured", "active", "deleted"];
  const SORTS = [
    { key: "date", label: "Newest" },
    { key: "upvotes", label: "Most Upvoted" },
    { key: "comments", label: "Most Comments" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Products Management</h1>
            <p className="text-sm text-slate-500 font-normal mt-0.5">
              Review live products, feature top makers, and manage upcoming scheduled launches
            </p>
          </div>
        </div>

        {/* Quick stat callout */}
        {upcomingCount > 0 && tab !== "upcoming" && (
          <Link
            href="?tab=upcoming"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 text-orange-800 text-xs font-semibold hover:border-orange-300 transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>
              <strong className="font-extrabold">{upcomingCount} Upcoming</strong> launch{upcomingCount > 1 ? "es" : ""} scheduled
            </span>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`?tab=${t.key}&page=1${q ? `&q=${q}` : ""}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-slate-400"}`} />
              <span>{t.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AdminSearch
            placeholder={
              tab === "upcoming"
                ? "Search upcoming launches by product name or tagline..."
                : "Search products by name or tagline..."
            }
          />
        </div>

        {tab === "all" && (
          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
              {FILTERS.map((f) => (
                <Link
                  key={f}
                  href={`?tab=all&filter=${f}&sort=${sort}&page=1${q ? `&q=${q}` : ""}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    filter === f ? "bg-orange-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {f}
                </Link>
              ))}
            </div>
            {/* Sort */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
              {SORTS.map((s) => (
                <Link
                  key={s.key}
                  href={`?tab=all&filter=${filter}&sort=${s.key}&page=1${q ? `&q=${q}` : ""}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    sort === s.key ? "bg-white text-slate-900 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <Suspense
          fallback={
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span>Loading {tab === "upcoming" ? "upcoming launches" : "products"}...</span>
            </div>
          }
        >
          {tab === "upcoming" ? (
            <UpcomingProductsTable page={page} limit={limit} q={q} />
          ) : (
            <ProductsTable page={page} limit={limit} q={q} filter={filter} sort={sort} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
