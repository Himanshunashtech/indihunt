import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import { AdminPagination } from "@/app/admin/_components/AdminPagination";
import { Megaphone, Loader2 } from "lucide-react";
import { AdActionButtons } from "./AdActionButtons";

export const metadata = { title: "Ad Campaigns | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; status?: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paused_by_admin: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  completed: "bg-slate-100 text-slate-400 border-slate-200",
};

async function AdsTable({ page, limit, status }: { page: number; limit: number; status: string }) {
  const supabase = await createServerSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("ad_campaigns")
    .select(
      "id, name, headline, status, total_budget, target_impressions, delivered_impressions, cpm_rate, impressions, clicks, created_at, user:profiles!user_id(username, full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") query = query.eq("status", status);

  const { data: campaigns, count } = await query;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200">
              {["Advertiser", "Campaign", "Status", "Budget", "Spent", "Impressions", "Clicks", "CTR", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {(campaigns || []).map((c) => {
              const advertiser = c.user as any;
              const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00";
              return (
                <tr key={c.id} className="hover:bg-slate-100/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-normal">@{advertiser?.username || "anon"}</td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <div className="font-semibold text-slate-800 truncate">{c.name}</div>
                    <div className="text-slate-400 truncate mt-0.5">{c.headline}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold uppercase ${STATUS_STYLES[c.status] || STATUS_STYLES.completed}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">₹{c.total_budget?.toFixed(0)}</td>
                  <td className="px-4 py-3 text-orange-400 font-semibold">{c.target_impressions?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{c.impressions?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{c.clicks?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">{ctr}%</td>
                  <td className="px-4 py-3">
                    <AdActionButtons campaignId={c.id} status={c.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!campaigns || campaigns.length === 0) && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">No ad campaigns found.</div>
        )}
      </div>
      <div className="px-4 border-t border-slate-200">
        <AdminPagination page={page} totalCount={count ?? 0} limit={limit} limitOptions={[25, 50, 100]} />
      </div>
    </>
  );
}

export default async function AdminAdsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(params.limit || "25", 10)));
  const status = params.status || "all";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Megaphone className="w-4.5 h-4.5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Ad Campaigns</h1>
          <p className="text-base text-slate-500 font-normal mt-0.5">Manage self-serve ad campaigns and spend</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {["all", "active", "paused", "completed"].map((s) => (
          <Link key={s} href={`?status=${s}&page=1`}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${status === s ? "bg-purple-500 text-slate-900" : "text-slate-500 hover:text-slate-800"}`}>
            {s}
          </Link>
        ))}
      </div>

      <div className="bg-slate-100/50 border border-slate-200 rounded-2xl overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-base"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /><span>Loading campaigns...</span></div>}>
          <AdsTable page={page} limit={limit} status={status} />
        </Suspense>
      </div>
    </div>
  );
}
