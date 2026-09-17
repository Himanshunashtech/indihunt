import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  Award,
  Star,
  Calendar,
  Crown,
  TrendingUp,
  Loader2,
  Trash2,
} from "lucide-react";
import { adminRemoveFeatured, adminAddFeatured } from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Featured Products | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const FEATURE_TYPES = [
  { key: "todays_featured", label: "Today's Featured", icon: Star, color: "text-amber-400" },
  { key: "weekly_featured", label: "Weekly Featured", icon: Calendar, color: "text-blue-400" },
  { key: "editors_pick", label: "Editor's Pick", icon: Crown, color: "text-purple-400" },
  { key: "staff_pick", label: "Staff Pick", icon: Award, color: "text-emerald-400" },
  { key: "rising", label: "Rising", icon: TrendingUp, color: "text-orange-400" },
];

// ─── Featured List ────────────────────────────────────────────────────────
async function FeaturedList({ featureType }: { featureType: string }) {
  const supabase = await createServerSupabase();

  const { data: features } = await supabase
    .from("editorial_features")
    .select("id, feature_type, start_date, end_date, notes, created_at, product:products!product_id(id, name, logo_url, tagline, upvotes_count), admin:profiles!admin_id(username)")
    .eq("feature_type", featureType)
    .order("start_date", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-3">
      {(features || []).map((f) => {
        const product = f.product as any;
        const admin = f.admin as any;
        return (
          <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product?.logo_url || "/favicon.png"} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
              <div className="min-w-0">
                <Link href={`/products/${product?.id}`} target="_blank" className="text-sm font-semibold text-slate-800 hover:text-orange-500 transition-colors truncate block">
                  {product?.name || "—"}
                </Link>
                <div className="text-xs text-slate-400 truncate">{product?.tagline}</div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>{f.start_date}{f.end_date ? ` → ${f.end_date}` : ""}</span>
                  <span>·</span>
                  <span>by @{admin?.username || "admin"}</span>
                  {f.notes && <><span>·</span><span className="italic">{f.notes}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-orange-400">{product?.upvotes_count ?? 0} ↑</span>
              <form action={async () => { "use server"; await adminRemoveFeatured(f.id); }}>
                <button type="submit" className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        );
      })}
      {(!features || features.length === 0) && (
        <div className="py-12 text-center text-slate-400 text-sm">No featured products in this category.</div>
      )}
    </div>
  );
}

// ─── Quick Add Form ───────────────────────────────────────────────────────
async function QuickAddForm({ featureType }: { featureType: string }) {
  const supabase = await createServerSupabase();
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("is_deleted", false)
    .order("upvotes_count", { ascending: false })
    .limit(50);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Add to Featured</h3>
      <form action={async (formData: FormData) => {
        "use server";
        const productId = formData.get("productId") as string;
        const notes = formData.get("notes") as string;
        if (!productId) return;
        const today = new Date().toISOString().split("T")[0];
        await adminAddFeatured(productId, featureType, today, null, notes || "");
      }} className="space-y-3">
        <div>
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Product</label>
          <select name="productId" required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500/40">
            <option value="">Select a product...</option>
            {(products || []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Notes (optional)</label>
          <input name="notes" placeholder="Why this product?"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500/40" />
        </div>
        <button type="submit" className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all">
          Add to {FEATURE_TYPES.find(t => t.key === featureType)?.label || "Featured"}
        </button>
      </form>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function AdminFeaturedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab || "todays_featured";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Award className="w-4.5 h-4.5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Featured Products</h1>
          <p className="text-sm text-slate-500 font-normal mt-0.5">Editorial curation — separate from algorithmic ranking</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5">
        {FEATURE_TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.key} href={`?tab=${t.key}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-amber-500/15 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List — 2/3 */}
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></div>}>
            <FeaturedList featureType={tab} />
          </Suspense>
        </div>

        {/* Add Form — 1/3 */}
        <div>
          <Suspense fallback={<div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center h-48"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>}>
            <QuickAddForm featureType={tab} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
