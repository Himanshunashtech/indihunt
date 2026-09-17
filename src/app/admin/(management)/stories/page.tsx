import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminSearch } from "@/app/admin/_components/AdminSearch";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { BookOpen, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { adminDeleteStory } from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Stories | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; q?: string; category?: string }>;
}

const STORY_CATEGORIES = ["all", "Makers", "Funding", "Jobs", "Community", "Tech", "Design"];

async function StoriesTable({
  page, limit, q, category,
}: { page: number; limit: number; q: string; category: string }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("stories")
    .select(
      "id, title, category, published_at, created_at, user:profiles!user_id(username, full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike("title", `%${q}%`);
  if (category && category !== "all") query = query.eq("category", category);

  const { data: stories, count } = await query;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["Author", "Title", "Category", "Published", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(stories || []).map((s) => {
              const user = s.user as any;
              return (
                <tr key={s.id} className="hover:bg-slate-100/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-normal">@{user?.username || "anon"}</td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <span className="text-slate-800 font-medium line-clamp-1">{s.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
                      {s.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(s.published_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <a href={`/stories/${s.id}`} target="_blank"
                        className="p-1.5 rounded-lg text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <form action={async () => {
                        "use server";
                        await adminDeleteStory(s.id);
                      }}>
                        <button type="submit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!stories || stories.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">No stories found.</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} limitOptions={[25, 50, 100]} />
      </div>
    </>
  );
}

export default async function AdminStoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "25", 10)));
  const q = params.q || "";
  const category = params.category || "all";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <BookOpen className="w-4.5 h-4.5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Stories</h1>
          <p className="text-base text-slate-500 font-normal mt-0.5">Manage all published maker stories</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><AdminSearch placeholder="Search stories by title..." /></div>
        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {STORY_CATEGORIES.map((c) => (
            <Link key={c} href={`?category=${c}&page=1${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${category === c ? "bg-purple-500 text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
              {c}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-slate-100/50 border border-slate-200 rounded-2xl overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-base"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span>Loading stories...</span></div>}>
          <StoriesTable page={page} limit={limit} q={q} category={category} />
        </Suspense>
      </div>
    </div>
  );
}
