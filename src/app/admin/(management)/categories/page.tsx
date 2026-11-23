import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  Tags,
  Plus,
  Trash2,
  Loader2,
  Edit,
  Package,
  Sparkles,
  Star,
  Tag,
  CheckCircle2,
} from "lucide-react";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminUpdateCategory,
  adminCreateLaunchTag,
  adminDeleteLaunchTag,
  adminToggleLaunchTagPopular,
  adminUpdateLaunchTag,
} from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Categories & Launch Tags | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

// ─── Categories List ──────────────────────────────────────────────────────
async function CategoriesList() {
  const supabase = await createServerSupabase();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, icon, seo_title, seo_description, sort_order")
    .order("sort_order", { ascending: true });

  // Get product counts per category
  const { data: categoryCounts } = await supabase
    .from("product_categories")
    .select("category_id");

  const countMap: Record<string, number> = {};
  (categoryCounts || []).forEach((pc) => {
    countMap[pc.category_id] = (countMap[pc.category_id] || 0) + 1;
  });

  return (
    <div className="space-y-3">
      {(categories || []).map((cat) => (
        <form
          key={cat.id}
          action={async (formData: FormData) => {
            "use server";
            const name = formData.get("name") as string;
            const description = formData.get("description") as string;
            const icon = formData.get("icon") as string;
            const seo_title = formData.get("seo_title") as string;
            const seo_description = formData.get("seo_description") as string;
            await adminUpdateCategory(cat.id, { name, description, icon, seo_title, seo_description });
          }}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cat.icon || "📁"}</span>
              <div>
                <div className="text-sm font-semibold text-slate-800">{cat.name}</div>
                <div className="text-xs text-slate-400 font-mono">/{cat.slug}</div>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                <Package className="w-3 h-3 inline mr-1" />{countMap[cat.id] || 0} products
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="px-3 py-1.5 bg-slate-100 hover:bg-orange-500/10 border border-slate-200 hover:border-orange-500/30 text-slate-600 hover:text-orange-400 text-xs font-semibold rounded-xl transition-all">
                Save
              </button>
              <button
                type="submit"
                formAction={async () => {
                  "use server";
                  await adminDeleteCategory(cat.id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Name</label>
              <input name="name" defaultValue={cat.name}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500/40 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Icon</label>
              <input name="icon" defaultValue={cat.icon || ""}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500/40 transition-colors"
                placeholder="Emoji icon" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Description</label>
              <input name="description" defaultValue={cat.description || ""}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500/40 transition-colors"
                placeholder="Category description..." />
            </div>
          </div>

          {/* SEO fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">SEO Title</label>
              <input name="seo_title" defaultValue={cat.seo_title || ""}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500/40 transition-colors"
                placeholder="SEO title..." />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">SEO Description</label>
              <input name="seo_description" defaultValue={cat.seo_description || ""}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500/40 transition-colors"
                placeholder="SEO meta description..." />
            </div>
          </div>
        </form>
      ))}

      {(!categories || categories.length === 0) && (
        <div className="py-16 text-center text-slate-400 text-sm">No categories yet. Create one above.</div>
      )}
    </div>
  );
}

// ─── Launch Tags List ─────────────────────────────────────────────────────
async function LaunchTagsList() {
  const supabase = await createServerSupabase();
  const { data: launchTags } = await supabase
    .from("launch_tags")
    .select("id, name, slug, category, icon, is_popular, is_active, created_at")
    .order("name", { ascending: true });

  const tags = launchTags || [];
  const popularCount = tags.filter(t => t.is_popular).length;

  return (
    <div className="space-y-6">
      {/* Create New Launch Tag Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-orange-500" />
          <span>Add New Launch Tag</span>
        </h3>
        <form
          action={async (formData: FormData) => {
            "use server";
            const name = (formData.get("name") as string || "").trim();
            const category = (formData.get("category") as string || "General").trim();
            const icon = (formData.get("icon") as string || "🏷️").trim();
            const is_popular = formData.get("is_popular") === "on";
            if (!name) return;
            await adminCreateLaunchTag(name, category, icon, is_popular);
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Tag Name</label>
            <input
              name="name"
              placeholder="e.g. LLM, Deployment, Hosting"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Category</label>
            <input
              name="category"
              defaultValue="General"
              placeholder="e.g. AI, DevOps, Business"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Emoji / Icon</label>
            <input
              name="icon"
              defaultValue="🏷️"
              placeholder="e.g. 🚀, 🤖, 🌐"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
              <input type="checkbox" name="is_popular" className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400" />
              <span>Trending ⭐</span>
            </label>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tag
            </button>
          </div>
        </form>
      </div>

      {/* Stats header */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-800 font-bold">{tags.length}</span> launch tags (<span className="text-orange-500 font-bold">{popularCount}</span> trending)
        </div>
      </div>

      {/* Grid of Launch Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-300 transition-all shadow-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0">{tag.icon || "🏷️"}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-800 truncate">{tag.name}</span>
                  {tag.is_popular && (
                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold rounded-full flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-500" /> Trending
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">/{tag.slug} &bull; {tag.category}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Toggle Popular Action */}
              <form
                action={async () => {
                  "use server";
                  await adminToggleLaunchTagPopular(tag.id, !tag.is_popular);
                }}
              >
                <button
                  type="submit"
                  title={tag.is_popular ? "Remove from trending" : "Mark as trending"}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    tag.is_popular
                      ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                      : "bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${tag.is_popular ? "fill-amber-500" : ""}`} />
                </button>
              </form>

              {/* Delete Launch Tag Action */}
              <form
                action={async () => {
                  "use server";
                  await adminDeleteLaunchTag(tag.id);
                }}
              >
                <button
                  type="submit"
                  title="Delete launch tag"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm bg-white border border-slate-200 rounded-2xl">
          No launch tags in database yet. Add one above or run the migration seed.
        </div>
      )}
    </div>
  );
}

// ─── Product Tags List ────────────────────────────────────────────────────
async function ProductTagsList() {
  const supabase = await createServerSupabase();
  const { data: products } = await supabase
    .from("products")
    .select("tags")
    .not("tags", "is", null);

  // Aggregate all tags
  const tagCounts: Record<string, number> = {};
  (products || []).forEach((p) => {
    const tags = p.tags as string[] | null;
    if (tags) {
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Product Tags (auto-detected from products)</h3>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map(([tag, count]) => (
          <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs">
            <span className="font-semibold text-slate-700">{tag}</span>
            <span className="text-slate-400 font-medium">({count})</span>
          </div>
        ))}
        {sortedTags.length === 0 && (
          <p className="text-sm text-slate-400">No tags found on any products.</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab || "categories";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Tags className="w-4.5 h-4.5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Categories & Launch Tags</h1>
            <p className="text-sm text-slate-500 font-normal mt-0.5">Add, edit, and delete launch tags and categories</p>
          </div>
        </div>

        {tab === "categories" && (
          /* Create new category */
          <form action={async (formData: FormData) => {
            "use server";
            const name = formData.get("name") as string;
            if (!name) return;
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            await adminCreateCategory(name, slug, "📁", "");
          }} className="flex items-center gap-2">
            <input name="name" placeholder="New category name..." required
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500/40 w-48" />
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer">
              <Plus className="w-3 h-3" /> Create
            </button>
          </form>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        <a href="?tab=categories" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "categories" ? "bg-purple-500/15 text-purple-500" : "text-slate-500 hover:text-slate-800"}`}>
          Categories
        </a>
        <a href="?tab=launch_tags" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "launch_tags" ? "bg-purple-500/15 text-purple-500" : "text-slate-500 hover:text-slate-800"}`}>
          Launch Tags (Add & Delete)
        </a>
        <a href="?tab=tags" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "tags" ? "bg-purple-500/15 text-purple-500" : "text-slate-500 hover:text-slate-800"}`}>
          Detected Tags
        </a>
      </div>

      {/* Content */}
      <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></div>}>
        {tab === "categories" && <CategoriesList />}
        {tab === "launch_tags" && <LaunchTagsList />}
        {tab === "tags" && <ProductTagsList />}
      </Suspense>
    </div>
  );
}

