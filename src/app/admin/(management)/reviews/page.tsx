import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { Star, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { adminDeleteReview } from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Reviews | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; rating?: string }>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-900/15"}`} />
      ))}
    </div>
  );
}

async function ReviewsTable({ page, limit, rating }: { page: number; limit: number; rating: string }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("reviews")
    .select(
      "id, rating, body, created_at, product_id, product:products!product_id(name), user:profiles!user_id(username)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (rating && rating !== "all") query = query.eq("rating", parseInt(rating));

  const { data: reviews, count } = await query;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["Reviewer", "Rating", "Review", "Product", "Date", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(reviews || []).map((r) => {
              const user = r.user as any;
              const product = r.product as any;
              return (
                <tr key={r.id} className="hover:bg-slate-100/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-normal">@{user?.username || "anon"}</td>
                  <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <p className="text-slate-700 line-clamp-2 leading-relaxed">{r.body}</p>
                  </td>
                  <td className="px-4 py-3">
                    {product?.name ? (
                      <a href={`/products/${r.product_id}`} target="_blank"
                        className="text-orange-400 hover:underline flex items-center gap-1 text-sm font-semibold">
                        <ExternalLink className="w-2.5 h-2.5" /> {product.name}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <form action={async () => {
                      "use server";
                      await adminDeleteReview(r.id);
                    }}>
                      <button type="submit" title="Delete review"
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
        {(!reviews || reviews.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">No reviews found.</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} />
      </div>
    </>
  );
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "50", 10)));
  const rating = params.rating || "all";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Star className="w-4.5 h-4.5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Reviews</h1>
          <p className="text-base text-slate-500 font-normal mt-0.5">All product reviews across the platform</p>
        </div>
      </div>

      {/* Rating filter */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {["all", "5", "4", "3", "2", "1"].map((r) => (
          <Link key={r} href={`?rating=${r}&page=1`}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${rating === r ? "bg-amber-500 text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
            {r === "all" ? "All" : <><span>{r}</span><Star className="w-2.5 h-2.5 fill-current" /></>}
          </Link>
        ))}
      </div>

      <div className="bg-slate-100/50 border border-slate-200 rounded-2xl overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-base"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span>Loading reviews...</span></div>}>
          <ReviewsTable page={page} limit={limit} rating={rating} />
        </Suspense>
      </div>
    </div>
  );
}
