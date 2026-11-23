"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Award, 
  CheckCircle, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Star,
  Info,
  ShieldCheck,
  Share2
} from "lucide-react";
import Navbar from "@/components/Navbar";

import { getInitialTheme, applyTheme, Theme, DEFAULT_THEME } from "@/lib/theme";

export default function ScoringFeaturingGuidePage() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  // Initialize theme
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      <Navbar theme={theme} onThemeToggle={toggleTheme} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-42 sm:pt-44 pb-12 space-y-12">
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explorer</span>
          </Link>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Scoring & Featuring Algorithm</h1>
            <p className="text-xs text-muted-foreground">How we assess quality, measure community engagement, and feature top tech launches.</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-card border border-border/80 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            IndiHunt values builders who create complete, accessible, and high-quality launches. Our algorithms calculate scores based on two metrics: **Quality Score** (how detailed and complete your listing is) and **Engagement Score** (how the community interacts with your launch). 
          </p>
        </div>

        {/* Quality Score Breakdown */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Quality Score (Max: 100 Points)</h2>
              <p className="text-[11px] text-muted-foreground">Measures launch completeness, clarity, and professionalism.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Working Website URL</span>
                <span className="text-xs font-extrabold text-blue-500">+20 Pts</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Product listing includes a functional primary website link.</p>
            </div>

            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Rich Screenshots & Visuals</span>
                <span className="text-xs font-extrabold text-blue-500">+20 Pts</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Provides 2 or more high-resolution product demo screenshots (+10 pts for 1).</p>
            </div>

            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Detailed Description</span>
                <span className="text-xs font-extrabold text-blue-500">+15 Pts</span>
              </div>
              <p className="text-[11px] text-muted-foreground">In-depth overview explaining features, use cases, and technical details (&gt;100 chars).</p>
            </div>

            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Complete Maker Profile</span>
                <span className="text-xs font-extrabold text-blue-500">+15 Pts</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Maker has filled out their full bio, headline, avatar, and social links.</p>
            </div>

            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Video Demo Link</span>
                <span className="text-xs font-extrabold text-blue-500">+10 Pts</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Includes a YouTube, Loom, or video demonstration link.</p>
            </div>

            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Transparent Pricing</span>
                <span className="text-xs font-extrabold text-blue-500">+10 Pts</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Specifies pricing model (Free, Freemium, Paid, Open Source, etc.).</p>
            </div>

            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2 sm:col-span-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Special Promotion / Offer</span>
                <span className="text-xs font-extrabold text-blue-500">+10 Pts</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Offers an exclusive discount code or special offer for the IndiHunt community.</p>
            </div>
          </div>
        </div>

        {/* Engagement Score Breakdown */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Engagement Score (Unbounded)</h2>
              <p className="text-[11px] text-muted-foreground">Dynamic real-time score based on community support and organic discussion.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Community Upvotes</span>
                <span className="text-xs font-extrabold text-orange-500">1.0 Pt / upvote</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Direct upvotes received from authenticated IndiHunt members.</p>
            </div>

            <div className="bg-card border border-border/80 p-5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-foreground">Discussions & Comments</span>
                <span className="text-xs font-extrabold text-orange-500">2.0 Pts / comment</span>
              </div>
              <p className="text-[11px] text-muted-foreground">High-value feedback, questions, and maker replies on the product page.</p>
            </div>
          </div>
        </div>

        {/* Featuring Threshold */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 p-6 md:p-8 rounded-[2rem] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">How Products Get ⭐ Featured</h2>
          </div>
          
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Products automatically earn the **⭐ Featured** badge and top feed placement when they meet all of the following quality criteria:
          </p>

          <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>**Quality Score &ge; 60 points** (out of 100)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>**Community Upvotes &ge; 5** organic upvotes</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>**Active Discussion &ge; 1** community comment</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>**Maker Bio** is set up and verified</span>
            </li>
          </ul>

          <div className="pt-2">
            <Link 
              href="/guide"
              className="inline-flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              <span>Read complete Maker Launch Checklist</span>
              <Share2 className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
