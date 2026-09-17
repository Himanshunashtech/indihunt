"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Trophy,
  Star,
  Sparkles,
  Search,
  Filter,
  Share2,
  Code,
  ExternalLink,
  ChevronRight,
  User,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  LayoutGrid,
  Zap,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";
import { getProducts, Product, Profile } from "@/lib/supabase";
import { useAppSelector } from "@/lib/store";
import { HexagonAwardBadge, getAwardSolidTheme } from "@/components/AwardBadge";

export interface AwardBadge {
  id: string;
  productId: string;
  productName: string;
  productTagline: string;
  productLogo: string;
  websiteUrl: string;
  makerName: string;
  makerAvatar: string;
  makerId: string;
  type: "gold_day" | "silver_day" | "bronze_day" | "week_champ" | "quality_leader" | "built_in_india" | "community_choice";
  title: string;
  subtitle: string;
  rankText: string;
  badgeLabel: string;
  iconType: string;
  dateStr: string;
  upvotesCount: number;
  qualityScore: number;
}

export default function AwardsPage() {
  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxProfile = useAppSelector((state) => state.auth.profile);
  const currentUserId = reduxUser?.id || reduxProfile?.id || null;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showMyAwardsOnly, setShowMyAwardsOnly] = useState<boolean>(false);

  // Embed Modal State
  const [selectedEmbedBadge, setSelectedEmbedBadge] = useState<AwardBadge | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [embedType, setEmbedType] = useState<"html" | "markdown">("html");

  // Share Modal State
  const [selectedShareBadge, setSelectedShareBadge] = useState<AwardBadge | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const prods = await getProducts();
        setProducts(prods || []);
      } catch (err) {
        console.error("Failed to load products for awards:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate Award Badges from Products dataset
  const awardsList = useMemo(() => {
    if (!products || products.length === 0) return [];

    const badges: AwardBadge[] = [];

    // Group products by launch date
    const dateGroups: Record<string, Product[]> = {};
    products.forEach((p) => {
      if (p.status === "scheduled" && p.scheduled_for && new Date(p.scheduled_for) > new Date()) {
        return;
      }
      const launchDate = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
      const dateKey = launchDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      if (!dateGroups[dateKey]) dateGroups[dateKey] = [];
      dateGroups[dateKey].push(p);
    });

    // Evaluate daily ranks per date group
    Object.entries(dateGroups).forEach(([dateStr, groupProds]) => {
      const sorted = [...groupProds].sort((a, b) => b.upvotes_count - a.upvotes_count);

      sorted.forEach((p, index) => {
        const makerName = p.maker?.full_name || p.maker?.username || "Indie Maker";
        const makerAvatar = p.maker?.avatar_url || "";
        const makerId = p.maker_id || "";

        if (index === 0) {
          badges.push({
            id: `${p.id}-gold`,
            productId: p.id,
            productName: p.name,
            productTagline: p.tagline,
            productLogo: p.logo_url,
            websiteUrl: p.website_url,
            makerName,
            makerAvatar,
            makerId,
            type: "gold_day",
            title: "#1 Product of the Day",
            subtitle: `Top hunted product on ${dateStr}`,
            rankText: "#1",
            badgeLabel: "Product of the Day",
            iconType: "gold",
            dateStr,
            upvotesCount: p.upvotes_count,
            qualityScore: p.quality_score || 0,
          });
        } else if (index === 1) {
          badges.push({
            id: `${p.id}-silver`,
            productId: p.id,
            productName: p.name,
            productTagline: p.tagline,
            productLogo: p.logo_url,
            websiteUrl: p.website_url,
            makerName,
            makerAvatar,
            makerId,
            type: "silver_day",
            title: "#2 Product of the Day",
            subtitle: `Second rank product on ${dateStr}`,
            rankText: "#2",
            badgeLabel: "Daily Runner Up",
            iconType: "silver",
            dateStr,
            upvotesCount: p.upvotes_count,
            qualityScore: p.quality_score || 0,
          });
        } else if (index === 2) {
          badges.push({
            id: `${p.id}-bronze`,
            productId: p.id,
            productName: p.name,
            productTagline: p.tagline,
            productLogo: p.logo_url,
            websiteUrl: p.website_url,
            makerName,
            makerAvatar,
            makerId,
            type: "bronze_day",
            title: "#3 Product of the Day",
            subtitle: `Third rank product on ${dateStr}`,
            rankText: "#3",
            badgeLabel: "Top 3 Hunted",
            iconType: "bronze",
            dateStr,
            upvotesCount: p.upvotes_count,
            qualityScore: p.quality_score || 0,
          });
        }

        // Quality Leaders (Quality Score >= 85)
        if ((p.quality_score || 0) >= 85) {
          badges.push({
            id: `${p.id}-quality`,
            productId: p.id,
            productName: p.name,
            productTagline: p.tagline,
            productLogo: p.logo_url,
            websiteUrl: p.website_url,
            makerName,
            makerAvatar,
            makerId,
            type: "quality_leader",
            title: `High Quality Score (${p.quality_score}/100)`,
            subtitle: `Verified build standard milestone`,
            rankText: `${p.quality_score}`,
            badgeLabel: "Quality Leader",
            iconType: "quality",
            dateStr,
            upvotesCount: p.upvotes_count,
            qualityScore: p.quality_score || 0,
          });
        }

        // Built in India Spotlight
        if (p.country === "India") {
          badges.push({
            id: `${p.id}-india`,
            productId: p.id,
            productName: p.name,
            productTagline: p.tagline,
            productLogo: p.logo_url,
            websiteUrl: p.website_url,
            makerName,
            makerAvatar,
            makerId,
            type: "built_in_india",
            title: "Built in India Spotlight",
            subtitle: `Proudly launched from India`,
            rankText: "🇮🇳",
            badgeLabel: "Made in India",
            iconType: "india",
            dateStr,
            upvotesCount: p.upvotes_count,
            qualityScore: p.quality_score || 0,
          });
        }
      });
    });

    return badges;
  }, [products]);

  // Filtered Awards
  const filteredAwards = useMemo(() => {
    return awardsList.filter((award) => {
      // Filter by My Awards
      if (showMyAwardsOnly && currentUserId && award.makerId !== currentUserId) {
        return false;
      }

      // Filter by Category Tab
      if (activeTab === "gold" && award.type !== "gold_day") return false;
      if (activeTab === "top3" && !["gold_day", "silver_day", "bronze_day"].includes(award.type)) return false;
      if (activeTab === "quality" && award.type !== "quality_leader") return false;
      if (activeTab === "india" && award.type !== "built_in_india") return false;

      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = award.productName.toLowerCase().includes(query);
        const matchesTagline = award.productTagline.toLowerCase().includes(query);
        const matchesMaker = award.makerName.toLowerCase().includes(query);
        const matchesTitle = award.title.toLowerCase().includes(query);
        return matchesName || matchesTagline || matchesMaker || matchesTitle;
      }

      return true;
    });
  }, [awardsList, activeTab, searchQuery, showMyAwardsOnly, currentUserId]);

  // User's Own Awards Count
  const myAwardsCount = useMemo(() => {
    if (!currentUserId) return 0;
    return awardsList.filter((a) => a.makerId === currentUserId).length;
  }, [awardsList, currentUserId]);

  // Embed HTML / Markdown Snippets
  const getEmbedCode = (badge: AwardBadge, type: "html" | "markdown") => {
    const badgeUrl = `https://indihunt.in/products/${badge.productId}`;
    const imageUrl = `https://indihunt.in/t/embed?id=${badge.productId}&style=award`;
    if (type === "markdown") {
      return `[![IndiHunt Award](${imageUrl})](${badgeUrl})`;
    }
    return `<a href="${badgeUrl}" target="_blank" rel="noopener noreferrer"><img src="${imageUrl}" alt="${badge.title} on IndiHunt" style="height:54px;" /></a>`;
  };

  const handleCopyEmbed = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareLink = (badge: AwardBadge) => {
    const url = `${window.location.origin}/products/${badge.productId}?award=${badge.type}`;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-orange-500 selection:text-white pt-[76px] sm:pt-[84px]">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-background border-b border-border/60 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-orange-500" />
            <span>IndiHunt Hall of Fame & Awards</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight max-w-3xl mx-auto leading-tight">
            Celebrating Top Products & Award-Winning Makers 🏆
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
            Discover products that earned Product of the Day #1 badges, High Quality standards, and Made-in-India milestones on IndiHunt.
          </p>

          {/* User Awards Summary Banner */}
          {currentUserId && (
            <div className="pt-2">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-card border border-border shadow-xs">
                <Award className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  You have won <strong className="text-orange-500 font-bold">{myAwardsCount}</strong> awards across your launched products!
                </span>
                <button
                  onClick={() => setShowMyAwardsOnly(!showMyAwardsOnly)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    showMyAwardsOnly
                      ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                      : "bg-muted hover:bg-muted/80 text-foreground border-border"
                  }`}
                >
                  {showMyAwardsOnly ? "Show All Awards" : "View My Awards"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card border border-border/80 p-3 sm:p-4 rounded-2xl shadow-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => { setActiveTab("all"); setShowMyAwardsOnly(false); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "all" && !showMyAwardsOnly
                  ? "bg-orange-500 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              All Awards ({awardsList.length})
            </button>
            <button
              onClick={() => { setActiveTab("gold"); setShowMyAwardsOnly(false); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "gold"
                  ? "bg-amber-500 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              🥇 Product #1 Day
            </button>
            <button
              onClick={() => { setActiveTab("top3"); setShowMyAwardsOnly(false); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "top3"
                  ? "bg-orange-500 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              🏆 Top 3 Daily
            </button>
            <button
              onClick={() => { setActiveTab("quality"); setShowMyAwardsOnly(false); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "quality"
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              ⭐ Quality 85+
            </button>
            <button
              onClick={() => { setActiveTab("india"); setShowMyAwardsOnly(false); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "india"
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              🇮🇳 Made in India
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, maker, or award..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Awards Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <CircularLoader label="Loading product awards..." size="lg" center={false} />
          </div>
        ) : filteredAwards.length === 0 ? (
          <div className="bg-card border border-border p-10 sm:p-14 rounded-3xl text-center space-y-3 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">No awards found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {showMyAwardsOnly
                ? "You haven't earned any product awards yet. Launch your product on IndiHunt to earn #1 Product of the Day and Quality badges!"
                : "No award badges match your search or filter selection."}
            </p>
            {showMyAwardsOnly && (
              <div className="pt-2">
                <Link
                  href="/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                >
                  <span>Launch Product Now</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAwards.map((award) => {
              const theme = getAwardSolidTheme(award.rankText, award.type);

              return (
                <div
                  key={award.id}
                  className={`bg-card border rounded-3xl p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden group border-border hover:${theme.glow}`}
                >
                  {/* Badge Header Banner */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.tagBg}`}
                    >
                      {award.badgeLabel}
                    </span>

                    <span className="text-[11px] text-muted-foreground font-medium">
                      {award.dateStr}
                    </span>
                  </div>

                  {/* Center Award Trophy / Hexagon Icon */}
                  <div className="flex flex-col items-center text-center space-y-3 py-2">
                    <HexagonAwardBadge rank={award.rankText} type={award.type} size="lg" title={award.title} />

                    <div className="space-y-1 max-w-full">
                      <h3 className="text-base font-bold text-foreground truncate">{award.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{award.subtitle}</p>
                    </div>
                  </div>

                  {/* Product Details Card Footer */}
                  <div className="pt-4 border-t border-border/60 space-y-3">
                    <Link
                      href={`/products/${award.productId}`}
                      className="flex items-center gap-3 group/link p-2 rounded-xl hover:bg-muted/60 transition-colors"
                    >
                      <img
                        src={award.productLogo}
                        alt={award.productName}
                        className="w-10 h-10 rounded-xl object-cover border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground truncate group-hover/link:text-orange-500 transition-colors">
                            {award.productName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{award.productTagline}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>

                    {/* Stats & Actions Row */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-1">
                      <div className="flex items-center gap-3 text-muted-foreground font-medium">
                        <span>▲ {award.upvotesCount} votes</span>
                        <span>•</span>
                        <span>Score: {award.qualityScore}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedEmbedBadge(award)}
                          title="Embed Award Badge code on your website"
                          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedShareBadge(award)}
                          title="Share Award"
                          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Embed Badge Code Modal */}
      {selectedEmbedBadge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-foreground">Embed Award Badge</h3>
              </div>
              <button
                onClick={() => setSelectedEmbedBadge(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Copy and paste this badge code onto your website or GitHub README to showcase your <strong>{selectedEmbedBadge.title}</strong> award on IndiHunt!
              </p>

              {/* Format selector */}
              <div className="flex items-center gap-2 border border-border p-1 rounded-xl w-fit">
                <button
                  onClick={() => setEmbedType("html")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    embedType === "html" ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  HTML Snippet
                </button>
                <button
                  onClick={() => setEmbedType("markdown")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    embedType === "markdown" ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Markdown
                </button>
              </div>

              {/* Code Box */}
              <div className="relative bg-muted/80 border border-border p-3.5 rounded-2xl font-mono text-xs text-foreground overflow-x-auto break-all">
                {getEmbedCode(selectedEmbedBadge, embedType)}
              </div>

              <button
                onClick={() => handleCopyEmbed(getEmbedCode(selectedEmbedBadge, embedType))}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                {copiedCode ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Copied to Clipboard!" : "Copy Embed Code"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Award Modal */}
      {selectedShareBadge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-foreground">Share Award</h3>
              </div>
              <button
                onClick={() => setSelectedShareBadge(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{selectedShareBadge.productName}</h4>
                <p className="text-xs text-muted-foreground">{selectedShareBadge.title}</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `🚀 ${selectedShareBadge.productName} won ${selectedShareBadge.title} on @IndiHunt! Check out our launch award on IndiHunt:\n`
                  )}&url=${encodeURIComponent(`https://indihunt.in/products/${selectedShareBadge.productId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1DA1F2] hover:bg-[#1a91da] text-white text-xs font-semibold transition-colors"
                >
                  <span>Share on X (Twitter)</span>
                </a>

                <button
                  onClick={() => handleCopyShareLink(selectedShareBadge)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors border border-border cursor-pointer"
                >
                  {copiedShareLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedShareLink ? "Link Copied!" : "Copy Award Link"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
