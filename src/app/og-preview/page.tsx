"use client";


import React, { useState } from "react";
import Link from "next/link";
import {
  Share2,
  Copy,
  ExternalLink,
  Check,
  Globe,
  Sparkles,
  MessageCircle,
  Bot,
  Send,
  Code,
  ShieldCheck,
  Layers
} from "lucide-react";

export default function OgPreviewPage() {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<"all" | "whatsapp" | "twitter" | "linkedin" | "facebook" | "discord" | "telegram">("all");
  
  const siteUrl = "https://indihunt.in";
  const title = "IndiHunt — Daily Global Tech Launchpad";
  const description = "Discover, launch, and upvote the best global tech products, software, startups, and open-source masterpieces every day. The ultimate launchpad for builders and makers worldwide.";

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="border-b border-slate-800 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Social OG &amp; GEO Validator
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Social Platform Link Preview
            </h1>
            <p className="text-slate-400 mt-2 text-base max-w-2xl">
              Inspect how IndiHunt links and Open Graph SVG images appear live when shared across WhatsApp, X/Twitter, LinkedIn, Facebook, Discord, and Telegram.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCopyLink(siteUrl)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-normal text-sm transition-all shadow-lg shadow-orange-600/20 active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Link Copied!" : "Copy App Link"}
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-normal text-sm transition-all border border-slate-700"
            >
              <Globe className="w-4 h-4" /> Go to App
            </Link>
          </div>
        </div>

        {/* Feature Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">Pure Typography OG Banner</h3>
              <p className="text-xs text-slate-400 mt-1">1200x630 vector card with crisp typography header, stats pills, and dark mode glassmorphism.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">GEO &amp; Geolocation Meta</h3>
              <p className="text-xs text-slate-400 mt-1">Optimized for AI engines (ChatGPT, Perplexity) with ICBM coordinates &amp; JSON-LD.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">100% Social Scraper Approved</h3>
              <p className="text-xs text-slate-400 mt-1">Explicitly allowed in robots.ts for WhatsApp, Telegram, Discord, and Twitter bots.</p>
            </div>
          </div>
        </div>

        {/* Platform Selector Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <button
            onClick={() => setActivePlatform("all")}
            className={`px-4 py-2 rounded-xl font-normal text-xs sm:text-sm whitespace-nowrap transition-all ${
              activePlatform === "all"
                ? "bg-slate-800 text-orange-400 border border-orange-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            All Social Platforms
          </button>
          <button
            onClick={() => setActivePlatform("whatsapp")}
            className={`px-4 py-2 rounded-xl font-normal text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activePlatform === "whatsapp"
                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp
          </button>
          <button
            onClick={() => setActivePlatform("twitter")}
            className={`px-4 py-2 rounded-xl font-normal text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activePlatform === "twitter"
                ? "bg-sky-950/70 text-sky-400 border border-sky-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span className="font-semibold text-sky-400 text-xs">𝕏</span> Twitter / X
          </button>
          <button
            onClick={() => setActivePlatform("linkedin")}
            className={`px-4 py-2 rounded-xl font-normal text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activePlatform === "linkedin"
                ? "bg-blue-950/70 text-blue-400 border border-blue-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span className="font-semibold text-blue-400 text-xs">in</span> LinkedIn
          </button>
          <button
            onClick={() => setActivePlatform("facebook")}
            className={`px-4 py-2 rounded-xl font-normal text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activePlatform === "facebook"
                ? "bg-indigo-950/70 text-indigo-400 border border-indigo-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span className="font-semibold text-indigo-400 text-xs">fb</span> Facebook
          </button>
          <button
            onClick={() => setActivePlatform("discord")}
            className={`px-4 py-2 rounded-xl font-normal text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activePlatform === "discord"
                ? "bg-purple-950/70 text-purple-400 border border-purple-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" /> Discord
          </button>
          <button
            onClick={() => setActivePlatform("telegram")}
            className={`px-4 py-2 rounded-xl font-normal text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activePlatform === "telegram"
                ? "bg-cyan-950/70 text-cyan-400 border border-cyan-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Send className="w-4 h-4 text-cyan-400" /> Telegram
          </button>
        </div>

        {/* Live Social Previews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* 1. WHATSAPP PREVIEW */}
          {(activePlatform === "all" || activePlatform === "whatsapp") && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-white text-base">WhatsApp Share Card</span>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Rich Link Preview
                </span>
              </div>

              {/* Chat Bubble Mockup */}
              <div className="bg-[#0b141a] p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="bg-[#111b21] rounded-2xl overflow-hidden border border-[#222d34] shadow-md">
                  <div className="aspect-[1200/630] relative overflow-hidden bg-slate-950">
                    <img
                      src="/og-image.webp"
                      alt="IndiHunt OG Card"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-[#182229] space-y-1">
                    <p className="text-xs font-medium text-slate-200 line-clamp-1">{title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{description}</p>
                    <p className="text-[10px] text-emerald-400 font-mono pt-1">indihunt.in</p>
                  </div>
                </div>
                <div className="flex justify-end text-[10px] text-slate-500 pr-1">11:44 AM ✓✓</div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Direct Share URL:</span>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out IndiHunt — Daily Global Tech Launchpad: " + siteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  Test on WhatsApp <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* 2. X / TWITTER PREVIEW */}
          {(activePlatform === "all" || activePlatform === "twitter") && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-semibold text-sm">
                    𝕏
                  </div>
                  <span className="font-medium text-white text-base">X / Twitter Card</span>
                </div>
                <span className="text-xs bg-sky-500/10 text-sky-400 px-2.5 py-1 rounded-full border border-sky-500/20">
                  summary_large_image
                </span>
              </div>

              {/* Twitter Post Card Mockup */}
              <div className="bg-black p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-orange-500 text-sm">
                    IH
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-white text-sm">IndiHunt</span>
                      <span className="text-slate-500 text-xs">@indihunt · 1h</span>
                    </div>
                    <p className="text-xs text-slate-300">Discover, launch, and upvote the top software &amp; AI tools daily! 🚀</p>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  <div className="aspect-[1200/630] relative">
                    <img
                      src="/og-image.webp"
                      alt="Twitter Large Card Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-slate-950 border-t border-slate-900 space-y-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">indihunt.in</p>
                    <p className="text-sm font-semibold text-white line-clamp-1">{title}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Validator Tool:</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out IndiHunt — Daily Global Tech Launchpad! ") + encodeURIComponent(siteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  Share on X <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* 3. LINKEDIN PREVIEW */}
          {(activePlatform === "all" || activePlatform === "linkedin") && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-semibold text-xs">
                    in
                  </div>
                  <span className="font-medium text-white text-base">LinkedIn Share Card</span>
                </div>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                  Article Preview
                </span>
              </div>

              {/* LinkedIn Post Mockup */}
              <div className="bg-[#1b1f23] p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-orange-500 text-sm">
                    IH
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">IndiHunt Launchpad</h4>
                    <p className="text-xs text-slate-400">10,482 followers · Promoted</p>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                  <div className="aspect-[1200/630] relative">
                    <img
                      src="/og-image.webp"
                      alt="LinkedIn Article Card"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-[#282c31] border-t border-slate-700 space-y-1">
                    <h5 className="text-sm font-semibold text-white line-clamp-1">{title}</h5>
                    <p className="text-xs text-slate-400 line-clamp-2">{description}</p>
                    <p className="text-[11px] text-slate-400 font-mono pt-1">indihunt.in</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>LinkedIn Inspector:</span>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Inspect on LinkedIn <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* 4. DISCORD PREVIEW */}
          {(activePlatform === "all" || activePlatform === "discord") && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-white text-base">Discord Embed Card</span>
                </div>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/20">
                  Dark Embed
                </span>
              </div>

              {/* Discord Embed Mockup */}
              <div className="bg-[#2b2d31] p-4 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 font-mono">https://indihunt.in</p>

                <div className="bg-[#2b2d31] border-l-4 border-orange-500 rounded-r-xl p-4 bg-slate-900/80 border border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">IndiHunt</p>
                  <h4 className="text-sm font-semibold text-orange-400 hover:underline cursor-pointer">{title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{description}</p>
                  
                  <div className="rounded-lg overflow-hidden border border-slate-800 aspect-[1200/630]">
                    <img
                      src="/og-image.webp"
                      alt="Discord Card Image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Embed Format:</span>
                <span className="text-purple-400 font-mono">OpenGraph 1200x630 SVG/PNG</span>
              </div>
            </div>
          )}

          {/* 5. TELEGRAM PREVIEW */}
          {(activePlatform === "all" || activePlatform === "telegram") && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-white text-base">Telegram Web Preview</span>
                </div>
                <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/20">
                  Web Page Card
                </span>
              </div>

              {/* Telegram Preview Mockup */}
              <div className="bg-[#18222d] p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="bg-[#212d3b] p-3 rounded-2xl border-l-2 border-cyan-400 space-y-2">
                  <p className="text-xs font-medium text-cyan-400">IndiHunt</p>
                  <p className="text-xs font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-300 line-clamp-2">{description}</p>
                  <div className="aspect-[1200/630] rounded-xl overflow-hidden border border-slate-700">
                    <img
                      src="/og-image.webp"
                      alt="Telegram Web Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Share Link:</span>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                >
                  Send to Telegram <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* 6. FACEBOOK PREVIEW */}
          {(activePlatform === "all" || activePlatform === "facebook") && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-semibold text-xs">
                    fb
                  </div>
                  <span className="font-medium text-white text-base">Facebook Feed Card</span>
                </div>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  og:image 1200x630
                </span>
              </div>

              {/* Facebook Card Mockup */}
              <div className="bg-[#242526] p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-orange-500 text-sm">
                    IH
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">IndiHunt</h4>
                    <p className="text-xs text-slate-400">Just now · 🌍</p>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                  <div className="aspect-[1200/630] relative">
                    <img
                      src="/og-image.webp"
                      alt="Facebook Feed Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-[#3a3b3c] space-y-1">
                    <p className="text-[11px] text-slate-400 uppercase font-mono">INDIHUNT.IN</p>
                    <h5 className="text-sm font-semibold text-white line-clamp-1">{title}</h5>
                    <p className="text-xs text-slate-300 line-clamp-2">{description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>FB Debugger:</span>
                <a
                  href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(siteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  Facebook Sharing Debugger <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
