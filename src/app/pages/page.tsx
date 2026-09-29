"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";
import {
  Rocket,
  Sparkles,
  ArrowRight,
  Palette,
  Type,
  Globe,
  DollarSign,
  Zap,
  ShieldCheck,
  Star,
  Award,
  LayoutGrid,
  ExternalLink,
  Share2
} from "lucide-react";
import { Github, Twitter, Linkedin } from "@/components/icons";
import { INDIE_PAGE_THEMES, INDIE_PAGE_FONTS } from "@/lib/supabase";

// Featured makers list matching user request & screenshot
const HERO_MAKERS = [
  { name: "Damon Chen", username: "damonchen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", startups: 8 },
  { name: "Marc Lou", username: "marclou", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", startups: 40 },
  { name: "Arvid Kahl", username: "arvidkahl", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", startups: 5 },
  { name: "Daniel Nguyen", username: "danielnguyen", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150", startups: 7 },
  { name: "Martin D...", username: "martind", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150", startups: 8 },
  { name: "Lawrence M...", username: "lawrence", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", startups: 6 },
  { name: "Wesley Breu...", username: "wesley", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150", startups: 2 },
  { name: "Nicolas Leco...", username: "nicolas", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", startups: 11 },
  { name: "MaximeB", username: "maximeb", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150", startups: 18 },
  { name: "Jared Rhizor", username: "jared", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150", startups: 1 },
  { name: "Israel Crisanto", username: "israel", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150", startups: 1 },
  { name: "Leo", username: "leo", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", startups: 7 },
  { name: "Egidio Salin...", username: "egidio", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150", startups: 5 },
  { name: "Jesse Peplinski", username: "jesse", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150", startups: 3 },
  { name: "Alex Skiba", username: "alex", avatar: "https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=150", startups: 1 },
  { name: "Himanshu Sharma", username: "himanshusharma", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", startups: 12 },
  { name: "Sonu Sharma", username: "sonuhs9557", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", startups: 15 },
];

export default function PagesLandingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);

  const [claimHandle, setClaimHandle] = useState("");
  const [selectedDemoTheme, setSelectedDemoTheme] = useState(INDIE_PAGE_THEMES[0]);

  const handleClaimPageClick = () => {
    if (reduxUser) {
      router.push("/pages/studio");
    } else {
      dispatch(setAuthModalOpen(true));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white flex flex-col transition-colors duration-300">
      <Navbar />

      {/* Custom Marquee Animations */}
      <style>{`
        @keyframes marqueeLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-left {
          animation: marqueeLeft 38s linear infinite;
        }
        .animate-marquee-right {
          animation: marqueeRight 38s linear infinite;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative pt-42 sm:pt-32 pb-16 px-4 overflow-hidden border-b border-border bg-gradient-to-b from-background via-background to-muted/20">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-orange-500/15 via-amber-500/10 to-rose-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-10 relative z-10">

          {/* Header Content */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">

            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
              Showcase Your Products & Journey with Your Personal Page
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join 1,000+ indie hackers and founders who build, launch, and feature their software products on dedicated IndiHunt Pages.
            </p>

            {/* Interactive Claim Page Handle Bar */}

          </div>

          {/* Real Makers White Card Marquee Section */}
          <div className="space-y-4 pt-2 overflow-hidden">
            <div className="text-center mb-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Real Makers Showcasing Their Products
              </span>
            </div>

            {/* Marquee Row 1: Scrolling Left */}
            <div className="relative flex overflow-hidden py-1">
              <div className="flex items-center gap-3 sm:gap-4 animate-marquee-left hover:[animation-play-state:paused] w-max">
                {[...HERO_MAKERS.slice(0, 9), ...HERO_MAKERS.slice(0, 9)].map((maker, idx) => (
                  <Link
                    key={`row1-${maker.username}-${idx}`}
                    href={`/page/${maker.username}`}
                    className="bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-orange-500/40 p-3 px-4 rounded-2xl flex items-center gap-3 shrink-0 text-slate-900 transition-all hover:-translate-y-0.5 cursor-pointer min-w-[210px]"
                  >
                    <img
                      src={maker.avatar}
                      alt={maker.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-base text-slate-900 truncate leading-tight">
                        {maker.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          🚀 {maker.startups} {maker.startups === 1 ? "startup" : "startups"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Marquee Row 2: Scrolling Right */}
            <div className="relative flex overflow-hidden py-1">
              <div className="flex items-center gap-3 sm:gap-4 animate-marquee-right hover:[animation-play-state:paused] w-max">
                {[...HERO_MAKERS.slice(9), ...HERO_MAKERS.slice(9)].map((maker, idx) => (
                  <Link
                    key={`row2-${maker.username}-${idx}`}
                    href={`/page/${maker.username}`}
                    className="bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-orange-500/40 p-3 px-4 rounded-2xl flex items-center gap-3 shrink-0 text-slate-900 transition-all hover:-translate-y-0.5 cursor-pointer min-w-[210px]"
                  >
                    <img
                      src={maker.avatar}
                      alt={maker.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-base text-slate-900 truncate leading-tight">
                        {maker.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          🚀 {maker.startups} {maker.startups === 1 ? "startup" : "startups"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>


          {/* Hero Demo Page Live Preview Box matching user screenshot */}
          <div className="pt-6 max-w-5xl mx-auto">


            {/* Page Container */}
            <div className="rounded-3xl p-6 sm:p-10 border border-slate-200/80 bg-[#f4f4f6] text-slate-900 shadow-2xl transition-all duration-300 relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Maker Profile (Himanshu Sharma) */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
                      alt="Himanshu Sharma"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
                      Himanshu Sharma
                    </h3>
                    <p className="text-base font-medium text-slate-500 flex items-center gap-1">
                      <span>📍</span>
                      <span>Gr noida</span>
                    </p>
                  </div>

                  <p className="text-base text-slate-600 leading-relaxed">
                    🚀 Software Engineer building AI, open-source, and SaaS products. Passionate about creating tools developers and founders love.
                  </p>

                  {/* Social Icon Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-700 hover:border-slate-400 transition-colors cursor-pointer">
                      <Twitter className="w-4 h-4" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-700 hover:border-slate-400 transition-colors cursor-pointer">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-700 hover:border-slate-400 transition-colors cursor-pointer">
                      <Github className="w-4 h-4" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-700 hover:border-slate-400 transition-colors cursor-pointer">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-700 hover:border-slate-400 transition-colors cursor-pointer">
                      <Share2 className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Built on IndiHunt Badge */}
                  <div className="pt-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18181b] text-white text-base font-extrabold shadow-md cursor-pointer hover:bg-black transition-colors">
                      <Rocket className="w-3.5 h-3.5 text-[#ff5733]" />
                      <span>Built on IndiHunt</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: White Product Cards Grid */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Card 1: Github Pages */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                        <Github className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900">Github Pages</h4>
                      </div>
                    </div>
                    <p className="text-base text-slate-500 leading-relaxed">
                      GitHub Pages documentation - GitHub Docs
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563eb] text-white text-[10px] font-extrabold uppercase tracking-wide">
                        ★ HUNTER
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ▲ 8
                      </span>
                    </div>
                  </div>

                  {/* Card 2: OpenClaw */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold shrink-0 text-base">
                        🦀
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900">OpenClaw</h4>
                      </div>
                    </div>
                    <p className="text-base text-slate-500 leading-relaxed">
                      OpenClaw — Personal AI Assistant
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563eb] text-white text-[10px] font-extrabold uppercase tracking-wide">
                        ★ HUNTER
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ▲ 2
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Unsloth */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 text-base">
                        🦥
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900">Unsloth</h4>
                      </div>
                    </div>
                    <p className="text-base text-slate-500 leading-relaxed">
                      Unsloth — built by an indie maker
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563eb] text-white text-[10px] font-extrabold uppercase tracking-wide">
                        ★ HUNTER
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ▲ 2
                      </span>
                    </div>
                  </div>

                  {/* Card 4: AI Agent Observability & Monitoring */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 text-base">
                        📡
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900 leading-tight">AI Agent Observability & Monitoring</h4>
                      </div>
                    </div>
                    <p className="text-base text-slate-500 leading-relaxed">
                      AI Agent Observability & Monitoring - Latitude
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563eb] text-white text-[10px] font-extrabold uppercase tracking-wide">
                        ★ HUNTER
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ▲ 2
                      </span>
                    </div>
                  </div>

                  {/* Card 5: Daytona */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0 text-base">
                        ⚙️
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900">Daytona</h4>
                      </div>
                    </div>
                    <p className="text-base text-slate-500 leading-relaxed">
                      Open-source dev env that makes you 2x more productive!
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ff5733] text-white text-[10px] font-extrabold uppercase tracking-wide">
                        ★ MAKER
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ▲ 14
                      </span>
                    </div>
                  </div>

                  {/* Card 6: Mistral AI */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 text-base">
                        🤖
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900">Mistral AI</h4>
                      </div>
                    </div>
                    <p className="text-base text-slate-500 leading-relaxed">
                      Open and portable generative AI for devs and businesses
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563eb] text-white text-[10px] font-extrabold uppercase tracking-wide">
                        ★ HUNTER
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ▲ 32
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Why You Need An IndiHunt Page */}
      <section className="py-16 sm:py-24 px-4 max-w-6xl mx-auto w-full space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-base font-extrabold uppercase tracking-widest text-orange-500">
            Why Every Maker Needs A Page
          </h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Stop wasting time building landing pages for every project
          </h3>
          <p className="text-base text-muted-foreground">
            Building indie software is hard enough. Managing 10 different domain names, landing page builders, and social links shouldn&apos;t hold you back.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <div className="p-7 rounded-3xl bg-card border border-border hover:border-orange-500/40 transition-all duration-300 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-foreground">One Single Proof of Work</h4>
            <p className="text-base text-muted-foreground leading-relaxed">
              Showcase your entire portfolio of launched products in a clean, unified grid. Perfect for investors, customers, and Twitter/X bios.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-3xl bg-card border border-border hover:border-amber-500/40 transition-all duration-300 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-foreground">Display MRR & Milestones</h4>
            <p className="text-base text-muted-foreground leading-relaxed">
              Highlight your Monthly Recurring Revenue (MRR) badge to build instant credibility and social proof in the indie hacking community.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-3xl bg-card border border-border hover:border-emerald-500/40 transition-all duration-300 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-foreground">Auto-Sync Launches</h4>
            <p className="text-base text-muted-foreground leading-relaxed">
              Zero maintenance required. Every time you launch a new product on IndiHunt, your page automatically updates with upvotes and badges.
            </p>
          </div>
        </div>
      </section>

      {/* Features Showcase Grid */}
      <section className="py-16 sm:py-24 px-4 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-base font-extrabold uppercase tracking-widest text-amber-500">
              Packed With Power
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Everything you need to showcase your work
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-orange-500" />
                <h4 className="font-bold text-base text-foreground">35+ Curated Themes</h4>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Tweakcn, Neo-Brutalist, Dracula, Soft Light, Dark OLED, Nord, and Cyberpunk. Match your brand style instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-base text-foreground">40+ Google Fonts</h4>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Choose Geist, Inter, Outfit, Poppins, Space Grotesk, Roboto Mono, Fira Code, and Serif fonts with instant search.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-emerald-500" />
                <h4 className="font-bold text-base text-foreground">Custom Favicon</h4>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Your browser tab icon automatically uses your maker avatar picture for a completely custom feel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-rose-500" />
                <h4 className="font-bold text-base text-foreground">Maker & Hunted Badges</h4>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Automatic badges clearly distinguish products you engineered from products you discovered for the community.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <h4 className="font-bold text-base text-foreground">Fast & SEO Optimized</h4>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Built on Next.js 15 App Router with lightning-fast SSR rendering and Open Graph social sharing tags.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-indigo-500" />
                <h4 className="font-bold text-base text-foreground">100% Free Forever</h4>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                No hidden subscriptions or paywalls. Every Indian maker gets a free page with zero limitations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Theme Swatch Showcase */}
      <section className="py-16 sm:py-24 px-4 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-base font-extrabold uppercase tracking-widest text-orange-500">
            Interactive Theme Preview
          </span>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Explore 35+ Stunning Color Palettes
          </h3>
          <p className="text-base text-muted-foreground">
            Click any swatch below to preview how your page will look.
          </p>
        </div>

        {/* Swatches Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
          {INDIE_PAGE_THEMES.slice(0, 18).map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedDemoTheme(theme)}
              className={`p-2 rounded-2xl border text-left transition-all cursor-pointer ${selectedDemoTheme.id === theme.id
                ? "bg-card border-orange-500 ring-2 ring-orange-500/40 shadow-xs"
                : "bg-card/60 border-border hover:border-foreground/30"
                }`}
            >
              <div className="flex items-center justify-center gap-1 p-1.5 rounded-xl mb-1.5" style={{ background: theme.bg }}>
                <div className="w-2.5 h-5 rounded-xs" style={{ background: theme.swatch[0] || theme.card }} />
                <div className="w-2.5 h-5 rounded-xs" style={{ background: theme.swatch[1] || theme.sidebar }} />
                <div className="w-2.5 h-5 rounded-xs" style={{ background: theme.swatch[2] || theme.accent }} />
              </div>
              <span className="text-[10px] font-bold text-foreground truncate block text-center">
                {theme.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 sm:py-20 px-4 bg-muted/40 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-6 bg-card border border-border p-8 sm:p-14 rounded-3xl shadow-sm">
          <h3 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Ready to claim your personal maker page?
          </h3>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Join Indian indie hackers showcasing their products on IndiHunt Pages. Takes less than 60 seconds to set up.
          </p>
          <div className="pt-2">
            <button
              onClick={handleClaimPageClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white font-bold text-base shadow-md shadow-orange-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              <span>Claim Your Page ⚡</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
