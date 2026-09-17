"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { useParams } from "next/navigation";
import {
  MapPin,
  ExternalLink,
  ArrowUpRight,
  Share2,
  Check,
  Rocket,
  Star
} from "lucide-react";
import {
  getIndiePage,
  INDIE_PAGE_THEMES,
  INDIE_PAGE_FONTS,
  Profile,
  Product,
  getProductSlug
} from "@/lib/supabase";
import { Github, Linkedin, Twitter } from "@/components/icons";

export default function IndiePageView() {
  const params = useParams();
  const username = typeof params?.username === "string" ? params.username : "";

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const profiles: Profile[] = JSON.parse(localStorage.getItem('indihunt_profiles') || '[]');
        const localProf = profiles.find(p => p.username?.toLowerCase() === username.toLowerCase());
        if (localProf) return localProf;
        const currentProf = JSON.parse(localStorage.getItem('indihunt_profile') || 'null');
        if (currentProf && currentProf.username?.toLowerCase() === username.toLowerCase()) return currentProf;
      } catch (e) { }
    }
    if (username.toLowerCase() === "sonu.hs9557" || username.toLowerCase() === "himanshu") {
      return {
        id: "usr-sonu-hs9557",
        username: "sonu.hs9557",
        full_name: "Himanshu Sharma",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
        headline: "Building next-gen indie maker tools • Founder @ IndiHunt",
        bio: "Indie hacker, product builder & hunter based in India.",
        location: "India",
        indie_page_enabled: true,
        indie_page_theme: "light",
        indie_page_font: "inter",
        monthly_revenue: "$1,200 MRR",
        created_at: new Date().toISOString()
      } as any;
    }
    return null;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const allProducts: Product[] = JSON.parse(localStorage.getItem('indihunt_products') || '[]');
        if (allProducts && allProducts.length > 0) {
          const matched = allProducts.filter(p => 
            (p.maker_id === profile?.id || (username.toLowerCase() === "sonu.hs9557" && p.maker_id === "usr-sonu-hs9557")) && 
            p.worked_on_launch !== false && 
            (p as any).role !== 'hunter'
          );
          if (matched.length > 0) return matched;
        }
      } catch (e) { }
    }
    if (username.toLowerCase() === "sonu.hs9557") {
      return [
        {
          id: "prod-sonu-maker-1",
          name: "IndiHunt",
          tagline: "The product discovery platform for Indian indie hackers & builders",
          category: "Productivity",
          upvotes_count: 42,
          worked_on_launch: true,
          maker_id: "usr-sonu-hs9557",
          created_at: new Date().toISOString()
        } as any
      ];
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => !profile);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const theme = INDIE_PAGE_THEMES.find(t => t.id === (profile?.indie_page_theme || "light")) || INDIE_PAGE_THEMES[0];
  const selectedFont = INDIE_PAGE_FONTS.find(f => f.id === (profile?.indie_page_font || "inter")) || INDIE_PAGE_FONTS[0];

  useEffect(() => {
    if (!username) return;
    if (!profile) {
      setIsLoading(true);
    }
    getIndiePage(username).then(result => {
      if (result) {
        setProfile(result.profile);
        // Only keep products created/worked on by the user, excluding hunted items
        const userProducts = (result.products || []).filter(
          p => p.worked_on_launch !== false && (p as any).role !== 'hunter'
        );
        setProducts(userProducts);
        setNotFound(false);
      } else if (!profile) {
        setNotFound(true);
      }
      setIsLoading(false);
    });
  }, [username]);

  // Dynamic favicon from user avatar
  useEffect(() => {
    if (profile?.avatar_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = profile.avatar_url;
    }
    // Dynamic page title
    if (profile?.full_name) {
      document.title = `${profile.full_name} | IndiHunt Page`;
    }
  }, [profile]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f5f5f4" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Loading page...</span>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#f5f5f4" }}
      >
        <div className="text-6xl">🔒</div>
        <h1 className="text-xl font-bold text-gray-800">Page not found</h1>
        <p className="text-sm text-gray-500 max-w-xs text-center">
          This maker page doesn&apos;t exist or hasn&apos;t been enabled yet.
        </p>
        <Link
          href="/"
          className="mt-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-full transition-colors"
        >
          Go to IndiHunt
        </Link>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen flex flex-col lg:flex-row"
        style={{ background: theme.bg, color: theme.text, fontFamily: selectedFont.fontFamily }}
      >
        {/* ─── LEFT SIDEBAR ─── */}
        <aside
          className="shrink-0 p-6 lg:p-12 xl:p-16 lg:sticky lg:top-0 lg:h-screen lg:w-[380px] xl:w-[440px] lg:overflow-y-auto no-scrollbar flex flex-col"
          style={{ background: theme.sidebar }}
        >
          <div className="flex items-start gap-4 lg:flex-col lg:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 lg:w-36 lg:h-36 rounded-full overflow-hidden shadow-lg"
                style={{ border: `3px solid ${theme.border}` }}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-3xl lg:text-5xl font-bold"
                    style={{ background: theme.accent, color: "#fff" }}
                  >
                    {profile.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>

            {/* Name & Location */}
            <div className="flex-1 min-w-0">
              <h1
                className="text-xl lg:text-3xl font-extrabold tracking-tight leading-tight"
                style={{ color: theme.text }}
              >
                {profile.full_name || profile.username}
              </h1>

              {profile.location && (
                <div className="flex items-center gap-1.5 mt-1.5 lg:mt-2">
                  <MapPin className="w-4 h-4" style={{ color: theme.accent }} />
                  <span className="text-sm" style={{ color: theme.textMuted }}>
                    {profile.location}
                  </span>
                </div>
              )}

              {/* Share button (mobile) */}
              <button
                onClick={handleShare}
                className="mt-3 lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  background: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Headline (Subheading) */}
          {profile.headline && (
            <p
              className="mt-1.5 text-xs lg:text-sm font-medium leading-relaxed opacity-80"
              style={{ color: theme.textMuted }}
            >
              {profile.headline}
            </p>
          )}

          {/* Monthly Revenue / MRR Pill */}
          {profile.monthly_revenue && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs lg:text-sm font-bold">
              <span>💰</span> {profile.monthly_revenue}
            </div>
          )}

          {/* Social Links */}
          <div className="hidden lg:flex flex-wrap items-center gap-2 mt-8">
            {profile.twitter_url && (
              <a
                href={profile.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                style={{ background: theme.card, border: `1px solid ${theme.border}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.cardHover;
                  e.currentTarget.style.borderColor = theme.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.card;
                  e.currentTarget.style.borderColor = theme.border;
                }}
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" style={{ color: theme.text }} />
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                style={{ background: theme.card, border: `1px solid ${theme.border}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.cardHover;
                  e.currentTarget.style.borderColor = theme.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.card;
                  e.currentTarget.style.borderColor = theme.border;
                }}
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" style={{ color: theme.text }} />
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                style={{ background: theme.card, border: `1px solid ${theme.border}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.cardHover;
                  e.currentTarget.style.borderColor = theme.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.card;
                  e.currentTarget.style.borderColor = theme.border;
                }}
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" style={{ color: theme.text }} />
              </a>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                style={{ background: theme.card, border: `1px solid ${theme.border}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.cardHover;
                  e.currentTarget.style.borderColor = theme.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.card;
                  e.currentTarget.style.borderColor = theme.border;
                }}
                aria-label="Website"
              >
                <ExternalLink className="w-5 h-5" style={{ color: theme.text }} />
              </a>
            )}

            {/* Share button (desktop) */}
            <button
              onClick={handleShare}
              className="ml-auto p-2.5 rounded-xl transition-all duration-200 hover:scale-110 cursor-pointer"
              style={{ background: theme.card, border: `1px solid ${theme.border}` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.cardHover;
                e.currentTarget.style.borderColor = theme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.card;
                e.currentTarget.style.borderColor = theme.border;
              }}
              aria-label="Share page"
            >
              {copied ? (
                <Check className="w-5 h-5" style={{ color: theme.accent }} />
              ) : (
                <Share2 className="w-5 h-5" style={{ color: theme.text }} />
              )}
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />
        </aside>

        {/* ─── RIGHT CONTENT: Product Cards Grid ─── */}
        <main className="flex-1 w-full lg:max-w-[1100px]">
          {/* Mobile social links */}
          <div className="flex lg:hidden flex-wrap items-center justify-center gap-3 px-6 py-4" style={{ borderTop: `1px solid ${theme.border}` }}>
            {profile.twitter_url && (
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <Twitter className="w-5 h-5" style={{ color: theme.text }} />
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <Linkedin className="w-5 h-5" style={{ color: theme.text }} />
              </a>
            )}
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <Github className="w-5 h-5" style={{ color: theme.text }} />
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-all" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <ExternalLink className="w-5 h-5" style={{ color: theme.text }} />
              </a>
            )}
          </div>

          {/* Product Grid */}
          <div className="p-6 lg:p-12 xl:p-16">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <span className="text-5xl">🚀</span>
                <p className="text-base font-semibold" style={{ color: theme.text }}>
                  No products launched yet
                </p>
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  This maker is cooking something up. Stay tuned!
                </p>
              </div>
            ) : (
              <ul className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${getProductSlug(product.name)}`}
                      className="group indie-page-card block rounded-2xl p-4 lg:p-6 transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        background: theme.card,
                        border: `1px solid ${theme.border}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.cardHover;
                        e.currentTarget.style.borderColor = theme.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme.card;
                        e.currentTarget.style.borderColor = theme.border;
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        {/* Product Logo */}
                        {product.logo_url ? (
                          <img
                            src={product.logo_url}
                            alt={`${product.name} logo`}
                            className="w-6 h-6 lg:w-7 lg:h-7 rounded-lg object-cover drop-shadow-sm transition-transform duration-200 group-hover:rotate-[-6deg] group-hover:scale-110"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-transform duration-200 group-hover:rotate-[-6deg] group-hover:scale-110"
                            style={{ background: theme.accent }}
                          >
                            {product.name?.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Product Name */}
                        <p
                          className="flex-1 font-bold text-base lg:text-lg"
                          style={{ color: theme.text }}
                        >
                          {product.name}
                        </p>

                        {/* Arrow */}
                        <ArrowUpRight
                          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          style={{ color: theme.accent }}
                        />
                      </div>

                      {/* Tagline */}
                      <p
                        className="mt-1.5 text-sm lg:text-base leading-relaxed"
                        style={{ color: theme.textMuted }}
                      >
                        {product.tagline}
                      </p>

                      {/* Tags & Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {/* Role Badge: Maker */}
                        <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 flex items-center gap-1.5 border border-emerald-400/40">
                          <Star className="w-3.5 h-3.5 fill-white text-white shrink-0" />
                          <span>Maker</span>
                        </span>

                        {product.category && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md"
                            style={{
                              background: `${theme.accent}15`,
                              color: theme.accent,
                            }}
                          >
                            {product.category}
                          </span>
                        )}
                        {product.upvotes_count > 0 && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md"
                            style={{
                              background: `${theme.accent}10`,
                              color: theme.textMuted,
                            }}
                          >
                            ▲ {product.upvotes_count}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      {/* ─── "Built on IndiHunt" badge ─── */}
      <div className="fixed bottom-4 left-4 lg:bottom-8 lg:left-8 z-50">
        <Link
          href="/"
          className="indie-page-card group flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-xl transition-all duration-200 hover:scale-105 border border-slate-700/80"
          style={{ backgroundColor: "#18181b", color: "#ffffff" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#27272a";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#18181b";
            e.currentTarget.style.color = "#ffffff";
          }}
        >
          <span className="text-base transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110">🚀</span>
          <span className="text-xs font-semibold text-white !text-white" style={{ color: "#ffffff" }}>
            <span className="hidden sm:inline">Built on</span>
            <span className="sm:hidden">On</span>
            {" "}IndiHunt
          </span>
        </Link>
      </div>
    </>
  );
}
