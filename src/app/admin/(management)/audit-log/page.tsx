import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminSearch } from "@/app/admin/_components/AdminSearch";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import {
  ScrollText,
  Users,
  Package,
  Shield,
  Flag,
  Star,
  Settings,
  Megaphone,
  Loader2,
} from "lucide-react";

export const metadata = { title: "Audit Log | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; q?: string; action?: string; target?: string }>;
}

const ACTION_COLORS: Record<string, string> = {
  feature_product: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  unfeature_product: "bg-slate-100 text-slate-500 border-slate-200",
  delete_product: "bg-red-500/10 text-red-400 border-red-500/20",
  restore_product: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  set_user_role: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  deactivate_user: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  reactivate_user: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warn_user: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  suspend_user: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  ban_user: "bg-red-500/10 text-red-400 border-red-500/20",
  delete_comment: "bg-red-500/10 text-red-400 border-red-500/20",
  delete_review: "bg-red-500/10 text-red-400 border-red-500/20",
  dismiss_thread_report: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  dismiss_product_report: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  dismiss_comment_report: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  override_leaderboard: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  toggle_feature_flag: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  update_setting: "bg-slate-100 text-slate-500 border-slate-200",
};

const TARGET_ICONS: Record<string, typeof Package> = {
  product: Package,
  user: Users,
  report: Flag,
  comment: Star,
  review: Star,
  ad_campaign: Megaphone,
  platform_setting: Settings,
  feature_flag: Settings,
  leaderboard_override: Shield,
};

async function AuditLogTable({
  page, limit, q, action, target,
}: {
  page: number; limit: number; q: string; action: string; target: string;
}) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("admin_audit_log")
    .select("id, admin_username, action, target_type, target_id, details, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`admin_username.ilike.%${q}%,target_id.ilike.%${q}%,action.ilike.%${q}%`);
  }
  if (action && action !== "all") query = query.eq("action", action);
  if (target && target !== "all") query = query.eq("target_type", target);

  const { data: logs, count } = await query;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {["Time", "Admin", "Action", "Target", "Target ID", "Details"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(logs || []).map((log) => {
              const TargetIcon = TARGET_ICONS[log.target_type] || Flag;
              const actionColor = ACTION_COLORS[log.action] || "bg-slate-100 text-slate-500 border-slate-200";
              const details = log.details as Record<string, unknown>;
              const detailStr = Object.keys(details || {}).length > 0
                ? Object.entries(details).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")
                : "—";

              return (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">@{log.admin_username}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${actionColor}`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <TargetIcon className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500 font-medium capitalize">{log.target_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs truncate max-w-[120px]">
                    {log.target_id ? `${log.target_id.slice(0, 12)}…` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[200px]" title={detailStr}>
                    {detailStr.length > 60 ? detailStr.slice(0, 60) + "…" : detailStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!logs || logs.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-sm">No audit log entries found.</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

export default async function AdminAuditLogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "30", 10)));
  const q = params.q || "";
  const action = params.action || "all";
  const target = params.target || "all";

  const TARGET_FILTERS = ["all", "product", "user", "report", "comment", "review", "ad_campaign"];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center">
          <ScrollText className="w-4.5 h-4.5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Log</h1>
          <p className="text-sm text-slate-500 font-normal mt-0.5">Complete trail of every admin action</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AdminSearch placeholder="Search by admin, action, or target ID..." />
        </div>
        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {TARGET_FILTERS.map((t) => (
            <Link key={t} href={`?target=${t}&action=${action}&page=1${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${target === t ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"}`}>
              {t}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center flex flex-col items-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span className="text-sm">Loading audit log...</span></div>}>
          <AuditLogTable page={page} limit={limit} q={q} action={action} target={target} />
        </Suspense>
      </div>
    </div>
  );
}
