import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { Flag, MessageSquare, Package, MessageCircle, CheckCircle, Trash2, Loader2 } from "lucide-react";
import {
  adminDismissThreadReport,
  adminDismissProductReport,
  adminDismissCommentReport,
} from "@/app/admin/_actions/admin-actions";
import Link from "next/link";

export const metadata = { title: "All Reports | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; tab?: string }>;
}

// ─── Thread Reports ──────────────────────────────────────────────────────────
async function ThreadReportsTable({ page, limit }: { page: number; limit: number }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  const { data: reports, count } = await supabase
    .from("thread_reports")
    .select(
      "id, reason, description, created_at, thread_id, user:profiles!user_id(username, full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["Reporter", "Reason", "Description", "Thread", "Date", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(reports || []).map((r) => {
              const reporter = r.user as any;
              return (
                <tr key={r.id} className="hover:bg-slate-100/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-normal">@{reporter?.username || "anonymous"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold uppercase">
                      {r.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate">{r.description || "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/threads/${r.thread_id}`} target="_blank"
                      className="text-blue-400 hover:underline font-mono text-xs">
                      {r.thread_id?.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <form action={async () => {
                      "use server";
                      await adminDismissThreadReport(r.id);
                    }}>
                      <button type="submit"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 rounded-lg transition-all text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Dismiss
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!reports || reports.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">🎉 No pending thread reports!</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} limitOptions={[10, 20, 50]} />
      </div>
    </>
  );
}

// ─── Product Reports ──────────────────────────────────────────────────────────
async function ProductReportsTable({ page, limit }: { page: number; limit: number }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  const { data: reports, count } = await supabase
    .from("reports")
    .select(
      "id, reason, description, created_at, product_id, user:profiles!user_id(username)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["Reporter", "Reason", "Description", "Product", "Date", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(reports || []).map((r) => {
              const reporter = r.user as any;
              return (
                <tr key={r.id} className="hover:bg-slate-100/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-normal">@{reporter?.username || "anonymous"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold uppercase">
                      {r.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate">{r.description || "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/products/${r.product_id}`} target="_blank"
                      className="text-blue-400 hover:underline font-mono text-xs">
                      {r.product_id?.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <form action={async () => {
                      "use server";
                      await adminDismissProductReport(r.id);
                    }}>
                      <button type="submit"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 rounded-lg transition-all text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Dismiss
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!reports || reports.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">🎉 No pending product reports!</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} limitOptions={[10, 20, 50]} />
      </div>
    </>
  );
}

// ─── Comment Reports ──────────────────────────────────────────────────────────
async function CommentReportsTable({ page, limit }: { page: number; limit: number }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  const { data: reports, count } = await supabase
    .from("comment_reports")
    .select(
      "id, reason, description, created_at, comment_id, user:profiles!user_id(username)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["Reporter", "Reason", "Description", "Comment ID", "Date", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(reports || []).map((r) => {
              const reporter = r.user as any;
              return (
                <tr key={r.id} className="hover:bg-slate-100/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-normal">@{reporter?.username || "anonymous"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold uppercase">
                      {r.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate">{r.description || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.comment_id?.slice(0, 12)}…</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <form action={async () => {
                      "use server";
                      await adminDismissCommentReport(r.id);
                    }}>
                      <button type="submit"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 rounded-lg transition-all text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Dismiss
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!reports || reports.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">🎉 No pending comment reports!</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} limitOptions={[10, 20, 50]} />
      </div>
    </>
  );
}

// ─── Badge counts ──────────────────────────────────────────────────────────
async function getReportCounts() {
  const supabase = await createServerSupabase();
  const [{ count: tr }, { count: pr }, { count: cr }] = await Promise.all([
    supabase.from("thread_reports").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }),
    supabase.from("comment_reports").select("*", { count: "exact", head: true }),
  ]);
  return { threadCount: tr ?? 0, productCount: pr ?? 0, commentCount: cr ?? 0 };
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(50, Math.max(10, parseInt(params.limit || "20", 10)));
  const tab = params.tab || "threads";

  const { threadCount, productCount, commentCount } = await getReportCounts();
  const totalPending = threadCount + productCount + commentCount;

  const TABS = [
    { key: "threads", label: "Thread Reports", icon: MessageCircle, count: threadCount },
    { key: "products", label: "Product Reports", icon: Package, count: productCount },
    { key: "comments", label: "Comment Reports", icon: MessageSquare, count: commentCount },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Flag className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Moderation Queue</h1>
            <p className="text-base text-slate-500 font-normal mt-0.5">All reports from threads, products and comments</p>
          </div>
        </div>

        {totalPending > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-base font-semibold text-red-400">{totalPending} pending</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.key}
              href={`?tab=${t.key}&page=1`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold transition-all ${
                tab === t.key
                  ? "bg-red-500/15 text-red-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-extrabold ${
                  tab === t.key ? "bg-red-500/20 text-red-300" : "bg-slate-200 text-slate-500"
                }`}>
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-slate-100/50 border border-slate-200 rounded-2xl overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-base"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span>Loading reports...</span></div>}>
          {tab === "threads" && <ThreadReportsTable page={page} limit={limit} />}
          {tab === "products" && <ProductReportsTable page={page} limit={limit} />}
          {tab === "comments" && <CommentReportsTable page={page} limit={limit} />}
        </Suspense>
      </div>
    </div>
  );
}
