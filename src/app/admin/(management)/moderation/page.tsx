import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import {
  Shield,
  AlertTriangle,
  Flag,
  MessageSquare,
  Package,
  MessageCircle,
  CheckCircle,
  UserX,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  adminDismissThreadReport,
  adminDismissProductReport,
  adminDismissCommentReport,
} from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Moderation Center | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; severity?: string }>;
}

// ─── Severity helpers ──────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: "bg-red-500/15 text-red-400 border-red-500/20", dot: "bg-red-500" },
  high: { label: "High", color: "bg-orange-500/15 text-orange-400 border-orange-500/20", dot: "bg-orange-500" },
  medium: { label: "Needs Review", color: "bg-amber-500/15 text-amber-400 border-amber-500/20", dot: "bg-amber-500" },
  low: { label: "Low", color: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

function getSeverity(reason: string): keyof typeof SEVERITY_CONFIG {
  const criticalReasons = ["fraud", "fake_votes", "impersonation", "illegal"];
  const highReasons = ["harassment", "spam", "scam", "hate_speech", "nsfw"];
  const lowReasons = ["broken_link", "duplicate", "off_topic"];
  const lowerReason = reason.toLowerCase();
  if (criticalReasons.some(r => lowerReason.includes(r))) return "critical";
  if (highReasons.some(r => lowerReason.includes(r))) return "high";
  if (lowReasons.some(r => lowerReason.includes(r))) return "low";
  return "medium";
}

// ─── Counts Overview ──────────────────────────────────────────────────────
async function ModerationOverview() {
  const supabase = await createServerSupabase();
  const [{ count: tr }, { count: pr }, { count: cr }, { count: flagged }] = await Promise.all([
    supabase.from("thread_reports").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }),
    supabase.from("comment_reports").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("vote_velocity_flag", true),
  ]);
  const total = (tr ?? 0) + (pr ?? 0) + (cr ?? 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
        <div className="text-2xl font-extrabold text-red-400">{total}</div>
        <div className="text-xs text-slate-400 font-semibold mt-1">Total Pending</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
        <div className="text-2xl font-extrabold text-orange-400">{tr ?? 0}</div>
        <div className="text-xs text-slate-400 font-semibold mt-1">Thread Reports</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
        <div className="text-2xl font-extrabold text-blue-400">{pr ?? 0}</div>
        <div className="text-xs text-slate-400 font-semibold mt-1">Product Reports</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
        <div className="text-2xl font-extrabold text-amber-400">{flagged ?? 0}</div>
        <div className="text-xs text-slate-400 font-semibold mt-1">Fraud Flagged</div>
      </div>
    </div>
  );
}

// ─── Unified Queue ────────────────────────────────────────────────────────
async function UnifiedQueue({ page, limit, severity }: { page: number; limit: number; severity: string }) {
  const supabase = await createServerSupabase();

  // Fetch all report types
  const [{ data: threadReports }, { data: productReports }, { data: commentReports }] = await Promise.all([
    supabase.from("thread_reports").select("id, reason, description, created_at, thread_id, user:profiles!user_id(username)").order("created_at", { ascending: false }).limit(50),
    supabase.from("reports").select("id, reason, description, created_at, product_id, user:profiles!user_id(username)").order("created_at", { ascending: false }).limit(50),
    supabase.from("comment_reports").select("id, reason, description, created_at, comment_id, user:profiles!user_id(username)").order("created_at", { ascending: false }).limit(50),
  ]);

  // Normalize into unified items
  type QueueItem = {
    id: string; type: string; reason: string; description: string | null; reporter: string;
    targetId: string; targetType: string; created_at: string; severity: keyof typeof SEVERITY_CONFIG;
    table: "thread_reports" | "reports" | "comment_reports";
  };

  const items: QueueItem[] = [
    ...(threadReports || []).map((r) => ({
      id: r.id, type: "Thread Report", reason: r.reason, description: r.description,
      reporter: (r.user as any)?.username || "anonymous", targetId: r.thread_id, targetType: "thread",
      created_at: r.created_at, severity: getSeverity(r.reason), table: "thread_reports" as const,
    })),
    ...(productReports || []).map((r) => ({
      id: r.id, type: "Product Report", reason: r.reason, description: r.description,
      reporter: (r.user as any)?.username || "anonymous", targetId: r.product_id, targetType: "product",
      created_at: r.created_at, severity: getSeverity(r.reason), table: "reports" as const,
    })),
    ...(commentReports || []).map((r) => ({
      id: r.id, type: "Comment Report", reason: r.reason, description: r.description,
      reporter: (r.user as any)?.username || "anonymous", targetId: r.comment_id, targetType: "comment",
      created_at: r.created_at, severity: getSeverity(r.reason), table: "comment_reports" as const,
    })),
  ];

  // Sort by severity (critical first) then recency
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Filter by severity if specified
  const filtered = severity === "all" ? items : items.filter(i => i.severity === severity);
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  const typeIcon: Record<string, typeof Flag> = {
    "Thread Report": MessageCircle,
    "Product Report": Package,
    "Comment Report": MessageSquare,
  };

  return (
    <>
      <div className="space-y-3 p-4">
        {paginated.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm font-normal">🎉 No items in the moderation queue!</div>
        )}
        {paginated.map((item) => {
          const sev = SEVERITY_CONFIG[item.severity];
          const Icon = typeIcon[item.type] || Flag;
          return (
            <div key={`${item.table}-${item.id}`} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${sev.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-800">{item.type}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${sev.color}`}>{sev.label}</span>
                    </div>
                    <div className="mt-1.5 text-sm text-slate-600">
                      <span className="font-semibold text-red-400 uppercase text-xs">{item.reason}</span>
                      {item.description && <span className="text-slate-400 ml-2">— {item.description}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span>by @{item.reporter}</span>
                      <span>·</span>
                      <span>{new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.targetType === "thread" && (
                    <Link href={`/threads/${item.targetId}`} target="_blank" className="text-xs text-blue-400 hover:underline font-semibold px-2 py-1 bg-blue-500/5 rounded-lg">View</Link>
                  )}
                  {item.targetType === "product" && (
                    <Link href={`/products/${item.targetId}`} target="_blank" className="text-xs text-orange-400 hover:underline font-semibold px-2 py-1 bg-orange-500/5 rounded-lg">View</Link>
                  )}
                  <form action={async () => {
                    "use server";
                    if (item.table === "thread_reports") await adminDismissThreadReport(item.id);
                    else if (item.table === "reports") await adminDismissProductReport(item.id);
                    else await adminDismissCommentReport(item.id);
                  }}>
                    <button type="submit" className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-all text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" /> Dismiss
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={filtered.length} limit={limit} />
      </div>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function AdminModerationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(50, Math.max(10, parseInt(params.limit || "20", 10)));
  const severity = params.severity || "all";

  const SEVERITY_FILTERS = [
    { key: "all", label: "All", color: "" },
    { key: "critical", label: "🔴 Critical", color: "" },
    { key: "high", label: "🟠 High", color: "" },
    { key: "medium", label: "🟡 Review", color: "" },
    { key: "low", label: "🟢 Low", color: "" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Moderation Center</h1>
          <p className="text-sm text-slate-500 font-normal mt-0.5">Unified moderation queue — sorted by severity</p>
        </div>
      </div>

      {/* Overview Cards */}
      <Suspense fallback={<div className="h-24 bg-slate-100/50 rounded-2xl flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>}>
        <ModerationOverview />
      </Suspense>

      {/* Severity Filter */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 w-fit">
        {SEVERITY_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`?severity=${f.key}&page=1`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              severity === f.key
                ? "bg-red-500/15 text-red-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Unified Queue */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-sm"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span>Loading moderation queue...</span></div>}>
          <UnifiedQueue page={page} limit={limit} severity={severity} />
        </Suspense>
      </div>
    </div>
  );
}
