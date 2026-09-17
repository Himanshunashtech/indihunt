import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  Search,
  Users,
  Package,
  MessageSquare,
  BookOpen,
  MessageCircle,
  Flag,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Global Search | Admin Console | IndiHunt" };

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

async function SearchResults({ q }: { q: string }) {
  if (!q || q.length < 2) {
    return (
      <div className="py-20 text-center">
        <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-sm text-slate-400">Type at least 2 characters to search across the platform</p>
      </div>
    );
  }

  const supabase = await createServerSupabase();

  // Search all entity types in parallel
  const [
    { data: users },
    { data: products },
    { data: comments },
    { data: stories },
    { data: threads },
  ] = await Promise.all([
    supabase.from("profiles").select("id, username, full_name, avatar_url, role").or(`username.ilike.%${q}%,full_name.ilike.%${q}%`).limit(10),
    supabase.from("products").select("id, name, tagline, logo_url").or(`name.ilike.%${q}%,tagline.ilike.%${q}%`).limit(10),
    supabase.from("comments").select("id, body, product_id, thread_id, user:profiles!user_id(username)").ilike("body", `%${q}%`).limit(10),
    supabase.from("stories").select("id, title, category, user:profiles!user_id(username)").ilike("title", `%${q}%`).limit(10),
    supabase.from("threads").select("id, title, user:profiles!user_id(username)").ilike("title", `%${q}%`).limit(10),
  ]);

  const sections = [
    {
      label: "Users",
      icon: Users,
      count: users?.length ?? 0,
      items: (users || []).map((u) => ({
        id: u.id,
        title: u.full_name || u.username,
        subtitle: `@${u.username} · ${u.role || "user"}`,
        href: `/admin/users?q=${u.username}`,
        avatar: u.avatar_url,
      })),
    },
    {
      label: "Products",
      icon: Package,
      count: products?.length ?? 0,
      items: (products || []).map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.tagline || "",
        href: `/admin/products?q=${p.name}`,
        logo: p.logo_url,
      })),
    },
    {
      label: "Comments",
      icon: MessageSquare,
      count: comments?.length ?? 0,
      items: (comments || []).map((c) => ({
        id: c.id,
        title: (c.body || "").slice(0, 100) + ((c.body || "").length > 100 ? "…" : ""),
        subtitle: `by @${(c.user as any)?.username || "anon"} · ${c.product_id ? "Product" : "Thread"}`,
        href: c.product_id ? `/products/${c.product_id}` : c.thread_id ? `/threads/${c.thread_id}` : "#",
      })),
    },
    {
      label: "Stories",
      icon: BookOpen,
      count: stories?.length ?? 0,
      items: (stories || []).map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: `by @${(s.user as any)?.username || "anon"} · ${s.category}`,
        href: `/stories/${s.id}`,
      })),
    },
    {
      label: "Forum Threads",
      icon: MessageCircle,
      count: threads?.length ?? 0,
      items: (threads || []).map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: `by @${(t.user as any)?.username || "anon"}`,
        href: `/threads/${t.id}`,
      })),
    },
  ].filter((s) => s.count > 0);

  const totalResults = sections.reduce((s, sec) => s + sec.count, 0);

  if (totalResults === 0) {
    return (
      <div className="py-20 text-center">
        <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-sm text-slate-500">No results for &ldquo;{q}&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-500">Found <strong className="text-slate-800">{totalResults}</strong> results for &ldquo;<strong className="text-orange-400">{q}</strong>&rdquo;</span>
        <span className="text-xs text-slate-400">·</span>
        {sections.map((s) => (
          <span key={s.label} className="text-xs text-slate-400 font-medium">{s.label} ({s.count})</span>
        ))}
      </div>

      {/* Grouped Results */}
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.label} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Icon className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-800">{section.label}</span>
              <span className="text-xs text-slate-400 font-medium">({section.count})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {section.items.map((item: any) => (
                <Link
                  key={item.id}
                  href={item.href}
                  target={item.href.startsWith("/admin") ? undefined : "_blank"}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                  {item.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.logo} alt="" className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" />
                  )}
                  {item.avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 truncate group-hover:text-orange-500 transition-colors">{item.title}</div>
                    <div className="text-xs text-slate-400 truncate">{item.subtitle}</div>
                  </div>
                  <span className="text-xs text-slate-300 group-hover:text-orange-400 font-semibold shrink-0">→</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q || "";

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center">
          <Search className="w-4.5 h-4.5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Global Search</h1>
          <p className="text-sm text-slate-500 font-normal mt-0.5">Search across users, products, comments, stories, and threads</p>
        </div>
      </div>

      {/* Search Input */}
      <form method="GET" className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search users, products, launches, comments, reports..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/40 transition-all"
          autoFocus
        />
      </form>

      {/* Results */}
      <Suspense fallback={
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
          <span className="text-sm text-slate-400">Searching...</span>
        </div>
      }>
        <SearchResults q={q} />
      </Suspense>
    </div>
  );
}
