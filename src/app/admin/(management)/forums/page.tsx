import { createServerSupabase } from "@/lib/supabase-server";
import { MessageCircle } from "lucide-react";
import { adminUpdateForum } from "@/app/admin/_actions/admin-actions";

export const metadata = { title: "Forums | Admin Console | IndiHunt" };

async function getForums() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("forums")
    .select("id, slug, name, description, icon, is_product_forum, created_at")
    .order("created_at", { ascending: true });
  return data || [];
}

export default async function AdminForumsPage() {
  const forums = await getForums();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <MessageCircle className="w-4.5 h-4.5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Forums</h1>
          <p className="text-base text-slate-500 font-normal mt-0.5">Manage community forum channels</p>
        </div>
      </div>

      <div className="space-y-3">
        {forums.map((forum) => (
          <form
            key={forum.id}
            action={async (formData: FormData) => {
              "use server";
              const name = formData.get("name") as string;
              const description = formData.get("description") as string;
              await adminUpdateForum(forum.id, name, description);
            }}
            className="bg-slate-100/50 border border-slate-200 rounded-2xl p-5 space-y-3 hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{forum.icon || "💬"}</span>
                <div>
                  <div className="font-mono text-xs text-slate-400 mb-0.5">/{forum.slug}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${forum.is_product_forum ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-slate-100 text-slate-400"}`}>
                    {forum.is_product_forum ? "Product Forum" : "Community Forum"}
                  </span>
                </div>
              </div>
              <button type="submit"
                className="px-4 py-1.5 bg-slate-100 hover:bg-orange-500/10 border border-slate-200 hover:border-orange-500/30 text-slate-600 hover:text-orange-400 text-base font-semibold rounded-xl transition-all shrink-0">
                Save Changes
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Name</label>
                <input
                  name="name"
                  defaultValue={forum.name}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-base text-slate-800 placeholder-white/20 focus:outline-none focus:border-orange-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Description</label>
                <input
                  name="description"
                  defaultValue={forum.description || ""}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-base text-slate-800 placeholder-white/20 focus:outline-none focus:border-orange-500/40 transition-colors"
                  placeholder="Forum description..."
                />
              </div>
            </div>
          </form>
        ))}

        {forums.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-base font-normal">No forums found.</div>
        )}
      </div>
    </div>
  );
}
