"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";
import {
  supabase,
  getUserProfile,
  getUserProducts,
  updateUserProfile,
  INDIE_PAGE_THEMES,
  INDIE_PAGE_FONTS,
  Profile,
  Product,
  getProductSlug
} from "@/lib/supabase";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle,
  ExternalLink,
  MapPin,
  Rocket,
  Check,
  Share2,
  Eye,
  Settings,
  Type,
  Palette,
  User,
  Globe,
  ArrowUpRight,
  Search
} from "lucide-react";
import { Github, Linkedin, Twitter } from "@/components/icons";

import { useAppDispatch, setAuthModalOpen } from "@/lib/store";

export default function PagesStudioPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Customization state
  const [pageEnabled, setPageEnabled] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState("light");
  const [themeCategory, setThemeCategory] = useState<string>("all");
  const [selectedFontId, setSelectedFontId] = useState("inter");
  const [fontSearch, setFontSearch] = useState("");
  const [fontCategory, setFontCategory] = useState<string>("all");

  // Profile fields state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Tab state for controls: "theme" | "font" | "profile"
  const [activeTab, setActiveTab] = useState<"theme" | "font" | "profile">("theme");

  const currentTheme = INDIE_PAGE_THEMES.find((t) => t.id === selectedThemeId) || INDIE_PAGE_THEMES[0];
  const currentFont = INDIE_PAGE_FONTS.find((f) => f.id === selectedFontId) || INDIE_PAGE_FONTS[0];

  useEffect(() => {
    if (!supabase) return;
    let fetchedUid: string | null = null;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        dispatch(setAuthModalOpen(true));
        router.push("/pages");
      } else if (session.user.id !== fetchedUid) {
        fetchedUid = session.user.id;
        setUser(session.user);
        loadUserData(session.user.id);
      }
    });
  }, [router, dispatch]);

  const loadUserData = async (uid: string) => {
    setIsLoading(true);
    try {
      const prof = await getUserProfile(uid);
      if (prof) {
        setProfile(prof);
        setPageEnabled(prof.indie_page_enabled ?? true);
        setSelectedThemeId(prof.indie_page_theme || "light");
        setSelectedFontId(prof.indie_page_font || "inter");

        setFullName(prof.full_name || "");
        setUsername(prof.username || "");
        setHeadline(prof.headline || "");
        setBio(prof.bio || "");
        setMonthlyRevenue(prof.monthly_revenue || "");
        setLocation(prof.location || "");
        setAvatarUrl(prof.avatar_url || "");
        setTwitterUrl(prof.twitter_url || "");
        setLinkedinUrl(prof.linkedin_url || "");
        setGithubUrl(prof.github_url || "");
        setWebsiteUrl(prof.website || "");
      }

      // Fetch user's launched products
      const ownProducts = await getUserProducts(uid);
      let memberProducts: Product[] = [];

      if (supabase) {
        try {
          const memberResult = await supabase.from("product_members").select("products(*)").eq("user_id", uid);
          memberProducts = (memberResult?.data || [])
            .map((m: any) => m.products)
            .filter((p): p is Product => !!p);
        } catch (e) {}
      }

      const combined = [...ownProducts, ...memberProducts];
      const uniqueProducts = combined.filter(
        (value, index, self) => self.findIndex((p) => p.id === value.id) === index
      );

      uniqueProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProducts(uniqueProducts as Product[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updates = {
        indie_page_enabled: pageEnabled,
        indie_page_theme: selectedThemeId,
        indie_page_font: selectedFontId,
        full_name: fullName,
        username,
        headline,
        bio,
        monthly_revenue: monthlyRevenue,
        location,
        avatar_url: avatarUrl,
        twitter_url: twitterUrl,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        website: websiteUrl,
      };

      const updated = await updateUserProfile(user.id, updates);
      if (updated) {
        setProfile(updated);
      }
      setToastMsg("Changes published successfully!");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-36">
          <CircularLoader label="Loading page studio..." size="lg" center={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white flex flex-col transition-colors duration-300">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-42 sm:pt-44 pb-20 w-full space-y-6">
        {/* Page Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/pages" className="text-muted-foreground hover:text-orange-500 transition-colors text-xs font-semibold flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                <span>Overview</span>
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs font-semibold text-orange-500">IndiHunt Pages Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Customize Your IndiHunt Page
            </h1>
          </div>

          {/* Actions & Status Pill */}
          <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto">
            {username && (
              <Link
                href={`/page/${username}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-base font-semibold text-foreground transition-all shadow-xs"
              >
                <span>indihunt.in/page/{username}</span>
                <ExternalLink className="w-4 h-4 text-orange-500" />
              </Link>
            )}

            {toastMsg && (
              <span className="text-base font-semibold text-emerald-500 bg-emerald-500/10 px-3.5 py-2 rounded-full animate-pulse border border-emerald-500/20">
                ✓ {toastMsg}
              </span>
            )}

            <button
              onClick={handleSaveAndPublish}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-base shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Publish Page</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Studio Layout: Control Panel Left + Real-Time Live Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── LEFT: CONTROLS PANEL ─── */}
          <div className="lg:col-span-5 bg-card/60 border border-border rounded-3xl p-5 sm:p-6 space-y-6 shadow-xs">
            {/* Control Tabs */}
            <div className="flex items-center bg-muted/60 p-1.5 rounded-2xl border border-border/80 gap-1">
              <button
                onClick={() => setActiveTab("theme")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "theme"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Palette className="w-4 h-4 text-orange-500" />
                <span>Theme</span>
              </button>

              <button
                onClick={() => setActiveTab("font")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "font"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Type className="w-4 h-4 text-amber-500" />
                <span>Font</span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-card text-foreground shadow-xs font-bold border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4 text-emerald-500" />
                <span>Profile</span>
              </button>
            </div>

            {/* TAB 1: THEMES PALETTE */}
            {activeTab === "theme" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                      Theme Color Palette
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Select a color scheme matching your personal brand.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                    {currentTheme.name}
                  </span>
                </div>

                {/* Active Theme Badge */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center gap-3">
                  <div
                    className="w-14 h-9 rounded-xl flex items-center justify-center gap-1 p-1 shadow-inner shrink-0"
                    style={{ background: currentTheme.bg }}
                  >
                    <div className="w-3 h-6 rounded-xs" style={{ background: currentTheme.card }} />
                    <div className="w-3 h-6 rounded-xs" style={{ background: currentTheme.sidebar }} />
                    <div className="w-3 h-6 rounded-xs" style={{ background: currentTheme.accent }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground block">{currentTheme.name}</span>
                    <span className="text-[10px] text-muted-foreground block font-medium">Selected Theme Preset</span>
                  </div>
                </div>

                {/* Swatch Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: "all", label: "All Themes" },
                    { id: "solid", label: "🎨 Solid Colors" },
                    { id: "light", label: "☀️ Light" },
                    { id: "dark", label: "🌙 Dark" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setThemeCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                        themeCategory === cat.id
                          ? "bg-orange-500 text-white shadow-xs"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Swatch Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-3 bg-muted/30 rounded-2xl border border-border max-h-[420px] overflow-y-auto no-scrollbar">
                  {INDIE_PAGE_THEMES.filter((t) => {
                    if (themeCategory === "solid") return t.id.startsWith("solid-");
                    if (themeCategory === "light") return t.id.includes("light") || t.id === "cream" || t.id === "pastelmint" || t.id === "rose" || t.id === "sunset" || t.id === "amber" || t.id === "matcha" || t.id === "bubblegum" || t.id === "solarized-light" || t.id === "cherryblossom";
                    if (themeCategory === "dark") return t.id.includes("dark") || t.id === "noir" || t.id === "dracula" || t.id === "cyber-punk" || t.id === "oceanic-deep" || t.id === "forest" || t.id === "synthwave" || t.id === "terminal" || t.id === "coffee" || t.id === "electric" || t.id === "solarized-dark" || t.id === "monokai" || t.id === "catppuccin-mocha" || t.id === "linear-dark";
                    return true;
                  }).map((t) => {
                    const isSelected = selectedThemeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedThemeId(t.id)}
                        className={`group relative rounded-xl p-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-card ring-2 ring-orange-500 border border-orange-500 shadow-xs scale-105"
                            : "bg-card/70 hover:bg-card border border-border/80 hover:border-border"
                        }`}
                        title={t.name}
                      >
                        {/* 3-Color Swatch Pill */}
                        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-background w-full justify-center border border-border/40">
                          <div
                            className="w-3 h-5 rounded-xs shadow-2xs"
                            style={{ background: t.swatch[0] || t.card }}
                          />
                          <div
                            className="w-3 h-5 rounded-xs shadow-2xs"
                            style={{ background: t.swatch[1] || t.sidebar }}
                          />
                          <div
                            className="w-3 h-5 rounded-xs shadow-2xs"
                            style={{ background: t.swatch[2] || t.accent }}
                          />
                        </div>

                        <span
                          className={`text-[9px] font-bold truncate max-w-full text-center ${
                            isSelected ? "text-orange-500 font-extrabold" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {t.name.replace("Solid ", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: FONTS CATALOG */}
            {activeTab === "font" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                      Typography & Google Fonts
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Select font family for your titles, text, and cards.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {currentFont.name}
                  </span>
                </div>

                {/* Active Font Showcase */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-xl font-bold text-foreground shadow-2xs"
                    style={{ fontFamily: currentFont.fontFamily }}
                  >
                    Aa
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground block truncate">{currentFont.name}</span>
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      {currentFont.category} {currentFont.isVariable ? "• Variable" : ""}
                    </span>
                  </div>
                </div>

                {/* Search & Category Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={fontSearch}
                      onChange={(e) => setFontSearch(e.target.value)}
                      placeholder="Search Google fonts..."
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500"
                    />
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  </div>

                  <select
                    value={fontCategory}
                    onChange={(e) => setFontCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Fonts</option>
                    <option value="sans-serif">Sans Serif Fonts</option>
                    <option value="serif">Serif Fonts</option>
                    <option value="monospace">Monospace Fonts</option>
                    <option value="display">Display & Script Fonts</option>
                  </select>
                </div>

                {/* Font Selector Cards Grid */}
                <div className="space-y-2 p-2 bg-muted/30 rounded-2xl border border-border max-h-[380px] overflow-y-auto no-scrollbar">
                  {INDIE_PAGE_FONTS.filter((f) => {
                    const matchesSearch = f.name.toLowerCase().includes(fontSearch.toLowerCase());
                    const matchesCategory =
                      fontCategory === "all" ||
                      f.category === fontCategory ||
                      (fontCategory === "display" && (f.category === "display" || f.category === "handwriting"));
                    return matchesSearch && matchesCategory;
                  }).map((f) => {
                    const isSelected = selectedFontId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFontId(f.id)}
                        className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-card ring-2 ring-orange-500 border border-orange-500 shadow-xs"
                            : "bg-card/70 hover:bg-card border border-border/80 hover:border-border"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span
                            className="text-sm font-bold text-foreground block truncate"
                            style={{ fontFamily: f.fontFamily }}
                          >
                            {f.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {f.category} {f.isVariable ? "• Variable" : ""}
                          </span>
                        </div>

                        <div
                          className="w-8 h-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-sm font-bold text-foreground shrink-0 ml-2"
                          style={{ fontFamily: f.fontFamily }}
                        >
                          Aa
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PROFILE EDITOR */}
            {activeTab === "profile" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider mb-1">
                    Profile Info & Links
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Customize the text displayed on your page.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bengaluru, India 🇮🇳"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Headline Tagline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Building AI tools for indie hackers 🚀"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Monthly Revenue / MRR</label>
                    <input
                      type="text"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(e.target.value)}
                      placeholder="e.g. $2,500 MRR or $5k/mo"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Avatar Image URL</label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="pt-2 space-y-2.5">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Social Profiles
                    </span>
                    <input
                      type="url"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="Twitter / X URL"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="LinkedIn URL"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="GitHub URL"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="Personal Website URL"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-base text-foreground focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT: LIVE PREVIEW CONTAINER ─── */}
          <div className="lg:col-span-7 bg-muted/30 border border-border rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Real-Time Live Preview
              </span>
              <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                Interactive Preview
              </span>
            </div>

            {/* Screen Frame Container */}
            <div className="rounded-2xl overflow-hidden border border-border shadow-md">
              <div
                className="min-h-[580px] p-6 sm:p-8 flex flex-col lg:flex-row transition-all duration-300 gap-6"
                style={{
                  background: currentTheme.bg,
                  color: currentTheme.text,
                  fontFamily: currentFont.fontFamily,
                }}
              >
                {/* Sidebar */}
                <aside
                  className="shrink-0 p-5 rounded-2xl lg:w-[260px] flex flex-col border"
                  style={{
                    background: currentTheme.sidebar,
                    borderColor: currentTheme.border,
                  }}
                >
                  <div className="flex items-start gap-3 lg:flex-col lg:gap-4">
                    <div
                      className="w-16 h-16 lg:w-24 lg:h-24 rounded-full overflow-hidden shadow-md shrink-0"
                      style={{ border: `2px solid ${currentTheme.border}` }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-2xl font-bold"
                          style={{ background: currentTheme.accent, color: "#fff" }}
                        >
                          {fullName?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-extrabold tracking-tight leading-tight" style={{ color: currentTheme.text }}>
                        {fullName || username || "Your Name"}
                      </h2>

                      {location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" style={{ color: currentTheme.accent }} />
                          <span className="text-[11px]" style={{ color: currentTheme.textMuted }}>
                            {location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {headline && (
                    <p className="mt-1.5 text-[11px] font-medium leading-snug opacity-80" style={{ color: currentTheme.textMuted }}>
                      {headline}
                    </p>
                  )}

                  {monthlyRevenue && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold">
                      <span>💰</span> {monthlyRevenue}
                    </div>
                  )}

                  {/* Social icons */}
                  <div className="flex items-center gap-1.5 mt-4">
                    {twitterUrl && (
                      <div className="p-1.5 rounded-md" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                        <Twitter className="w-3.5 h-3.5" style={{ color: currentTheme.text }} />
                      </div>
                    )}
                    {linkedinUrl && (
                      <div className="p-1.5 rounded-md" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                        <Linkedin className="w-3.5 h-3.5" style={{ color: currentTheme.text }} />
                      </div>
                    )}
                    {githubUrl && (
                      <div className="p-1.5 rounded-md" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                        <Github className="w-3.5 h-3.5" style={{ color: currentTheme.text }} />
                      </div>
                    )}
                    {websiteUrl && (
                      <div className="p-1.5 rounded-md" style={{ background: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                        <ExternalLink className="w-3.5 h-3.5" style={{ color: currentTheme.text }} />
                      </div>
                    )}
                  </div>
                </aside>

                {/* Main Product Cards Column */}
                <main className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-60" style={{ color: currentTheme.text }}>
                      Products Showcase
                    </span>
                  </div>

                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                      <span className="text-3xl">🚀</span>
                      <p className="text-xs font-semibold" style={{ color: currentTheme.text }}>
                        No products launched yet
                      </p>
                      <p className="text-[11px]" style={{ color: currentTheme.textMuted }}>
                        Products you launch on IndiHunt will automatically appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl p-3.5 transition-all duration-200"
                          style={{
                            background: currentTheme.card,
                            border: `1px solid ${currentTheme.border}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {p.logo_url ? (
                              <img src={p.logo_url} alt="" className="w-5 h-5 rounded-md object-cover" />
                            ) : (
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ background: currentTheme.accent }}
                              >
                                {p.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-bold text-xs flex-1 truncate" style={{ color: currentTheme.text }}>
                              {p.name}
                            </span>
                            <ArrowUpRight className="w-3 h-3" style={{ color: currentTheme.accent }} />
                          </div>
                          <p className="mt-1 text-[11px] leading-snug line-clamp-2" style={{ color: currentTheme.textMuted }}>
                            {p.tagline}
                          </p>

                          <div className="mt-2.5 flex items-center gap-1">
                            {p.worked_on_launch === false || (p as any).role === 'hunter' ? (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                🎯 Hunter
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                🔨 Maker
                              </span>
                            )}
                            {p.category && (
                              <span
                                className="px-1.5 py-0.5 text-[8px] font-semibold rounded"
                                style={{
                                  background: `${currentTheme.accent}15`,
                                  color: currentTheme.accent,
                                }}
                              >
                                {p.category}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {products.length > 4 && (
                    <p className="mt-3 text-[10px] font-semibold text-center opacity-60" style={{ color: currentTheme.textMuted }}>
                      Showing top 4 of {products.length} products in preview. All {products.length} products will be displayed on your live page.
                    </p>
                  )}
                </main>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
