import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminSearch } from "@/app/admin/_components/AdminSearch";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { MessageSquare, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { adminDeleteComment } from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Comments | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; q?: string }>;
}

async function CommentsTable({ page, limit, q }: { page: number; limit: number; q: string }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("comments")
    .select(
      "id, body, created_at, product_id, thread_id, upvotes_count, user:profiles!user_id(username, avatar_url)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike("body", `%${q}%`);

  const { data: comments, count } = await query;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["User", "Comment", "Context", "Upvotes", "Date", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(comments || []).map((c) => {
              const user = c.user as any;
              return (
                <tr key={c.id} className="hover:bg-slate-100/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-slate-900 font-semibold text-xs shrink-0 overflow-hidden">
                        {user?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (user?.username?.charAt(0) || "U").toUpperCase()
                        )}
                      </div>
                      <span className="text-slate-700 font-normal">@{user?.username || "anon"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="text-slate-700 line-clamp-2 leading-relaxed">{c.body}</p>
                  </td>
                  <td className="px-4 py-3">
                    {c.product_id ? (
                      <a href={`/products/${c.product_id}`} target="_blank"
                        className="text-orange-400 text-xs font-semibold hover:underline flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" /> Product
                      </a>
                    ) : c.thread_id ? (
                      <a href={`/threads/${c.thread_id}`} target="_blank"
                        className="text-blue-400 text-xs font-semibold hover:underline flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" /> Thread
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-orange-400 font-semibold">{c.upvotes_count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <form action={async () => {
                      "use server";
                      await adminDeleteComment(c.id);
                    }}>
                      <button type="submit" title="Delete comment"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!comments || comments.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">No comments found.</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

export default async function AdminCommentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "50", 10)));
  const q = params.q || "";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
          <MessageSquare className="w-4.5 h-4.5 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Comments</h1>
          <p className="text-base text-slate-500 font-normal mt-0.5">All community comments across products and threads</p>
        </div>
      </div>

      <AdminSearch placeholder="Search by comment body..." />

      <div className="bg-slate-100/50 border border-slate-200 rounded-2xl overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-base"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span>Loading comments...</span></div>}>
          <CommentsTable page={page} limit={limit} q={q} />
        </Suspense>
      </div>
    </div>
  );
}
