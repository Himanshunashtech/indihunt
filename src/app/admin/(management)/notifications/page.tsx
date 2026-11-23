import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { Bell, Trash2, Loader2 } from "lucide-react";
import { adminDeleteNotifications } from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Notifications | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; type?: string; read?: string }>;
}

const NOTIFICATION_COLORS: Record<string, string> = {
  upvote: "text-orange-400",
  comment: "text-blue-400",
  follow: "text-emerald-400",
  mention: "text-purple-400",
  review: "text-amber-400",
  report: "text-red-400",
};

async function NotificationsTable({
  page, limit, type, read,
}: { page: number; limit: number; type: string; read: string }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("notifications")
    .select(
      "id, type, read, created_at, entity_type, entity_id, user:profiles!user_id(username), actor:profiles!actor_id(username)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && type !== "all") query = query.eq("type", type);
  if (read === "read") query = query.eq("read", true);
  else if (read === "unread") query = query.eq("read", false);

  const { data: notifications, count } = await query;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["User", "Type", "Actor", "Entity", "Status", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(notifications || []).map((n) => {
              const user = n.user as any;
              const actor = n.actor as any;
              return (
                <tr key={n.id} className={`hover:bg-slate-100/50 transition-colors ${!n.read ? "bg-white/[0.01]" : ""}`}>
                  <td className="px-4 py-3 text-slate-700 font-normal">@{user?.username || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold text-xs uppercase ${NOTIFICATION_COLORS[n.type] || "text-slate-500"}`}>
                      {n.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">@{actor?.username || "—"}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {n.entity_type} {n.entity_id ? `· ${n.entity_id.slice(0, 8)}…` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${n.read ? "bg-slate-100 text-slate-400" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                      {n.read ? "Read" : "Unread"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(n.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!notifications || notifications.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">No notifications found.</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "50", 10)));
  const type = params.type || "all";
  const read = params.read || "all";

  const TYPES = ["all", "upvote", "comment", "follow", "mention", "review", "report"];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-base text-slate-500 font-normal mt-0.5">Platform-wide notification inbox viewer</p>
          </div>
        </div>

        {/* Bulk delete read notifications */}
        <form action={async () => {
          "use server";
          await adminDeleteNotifications();
        }}>
          <button type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-base font-semibold rounded-xl transition-all">
            <Trash2 className="w-3.5 h-3.5" />
            Purge Read Notifications
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {TYPES.map((t) => (
            <Link key={t} href={`?type=${t}&read=${read}&page=1`}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${type === t ? "bg-blue-500 text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
              {t}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {["all", "unread", "read"].map((r) => (
            <Link key={r} href={`?type=${type}&read=${r}&page=1`}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${read === r ? "bg-white/10 text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
              {r}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-slate-100/50 border border-slate-200 rounded-2xl overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-base"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span>Loading notifications...</span></div>}>
          <NotificationsTable page={page} limit={limit} type={type} read={read} />
        </Suspense>
      </div>
    </div>
  );
}
