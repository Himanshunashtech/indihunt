import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminSearch } from "@/app/admin/_components/AdminSearch";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import {
  Users,
  ShieldCheck,
  Shield,
  UserX,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  adminSetUserRole,
  adminSetUserDeactivation,
} from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Users | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; q?: string; role?: string }>;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/15 text-red-400 border-red-500/20",
  moderator: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  user: "bg-slate-100 text-slate-500 border-slate-200",
};

async function UsersTable({ page, limit, q, role }: { page: number; limit: number; q: string; role: string }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, is_maker, is_deactivated, created_at, karma_points, followers_count", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  if (role && role !== "all") {
    if (role === "deactivated") {
      query = query.eq("is_deactivated", true);
    } else {
      query = query.eq("role", role);
    }
  }

  const { data: users, count } = await query;

  return (
    <>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["User", "Username", "Role", "Type", "Joined", "Karma", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(users || []).map((user) => (
              <tr key={user.id} className={`hover:bg-slate-100/50 transition-colors ${user.is_deactivated ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-slate-900 font-semibold text-base shrink-0 overflow-hidden">
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <Image src={user.avatar_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
                      ) : (
                        (user.full_name?.charAt(0) || "U").toUpperCase()
                      )}
                    </div>
                    <span className="font-medium text-slate-900 truncate max-w-[140px]">
                      {user.full_name || "—"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono">@{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-semibold text-xs uppercase ${ROLE_COLORS[user.role || "user"]}`}>
                    {user.role || "user"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${user.is_maker ? "text-emerald-400" : "text-slate-400"}`}>
                    {user.is_maker ? "Maker" : "User"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "2-digit" })}
                </td>
                <td className="px-4 py-3 text-slate-600 font-semibold">{user.karma_points ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {/* Role cycle button */}
                    <form action={async () => {
                      "use server";
                      const nextRole = user.role === "admin" ? "user" : user.role === "moderator" ? "admin" : "moderator";
                      await adminSetUserRole(user.id, nextRole);
                    }}>
                      <button
                        type="submit"
                        title="Cycle role"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Deactivate/reactivate */}
                    <form action={async () => {
                      "use server";
                      await adminSetUserDeactivation(user.id, !user.is_deactivated);
                    }}>
                      <button
                        type="submit"
                        title={user.is_deactivated ? "Reactivate" : "Deactivate"}
                        className={`p-1.5 rounded-lg transition-all ${user.is_deactivated ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"}`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* View profile */}
                    <a
                      href={`/@${user.username}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!users || users.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">
            No users match your filters.
          </div>
        )}
      </div>

      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "50", 10)));
  const q = params.q || "";
  const role = params.role || "all";

  const ROLE_FILTERS = ["all", "user", "admin", "moderator", "deactivated"];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Users className="w-4.5 h-4.5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Users & Roles</h1>
          <p className="text-base text-slate-500 font-normal mt-0.5">Manage user accounts, roles and access levels</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AdminSearch placeholder="Search by name or username..." />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
          {ROLE_FILTERS.map((r) => (
            <Link
              key={r}
              href={`?role=${r}&page=1${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                role === r
                  ? "bg-orange-500 text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-slate-100/50 border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-base font-semibold text-slate-700">
            {q ? `Searching for "${q}"` : role !== "all" ? `Filtered: ${role}` : "All registered users"}
          </span>
        </div>
        <Suspense fallback={
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-base">
            <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            <span>Loading users...</span>
          </div>
        }>
          <UsersTable page={page} limit={limit} q={q} role={role} />
        </Suspense>
      </div>
    </div>
  );
}
