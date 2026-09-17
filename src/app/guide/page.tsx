"use client";


import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Rocket,
  Sparkles,
  CheckCircle,
  Users,
  Award,
  Megaphone,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  BookOpen,
  CheckSquare,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function LaunchGuidePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    tagline: false,
    logo: false,
    screenshots: false,
    video: false,
    makerComment: false,
    categories: false,
    socialShare: false,
    communityReply: false,
    demoLink: false,
  });

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const guideSteps = [
    {
      title: "1. Preparation",
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      tagline: "First impressions are everything. Get your assets ready.",
      content: (
        <div className="space-y-4">
          <p className="text-base text-foreground/80 leading-relaxed">
            Before launching, you need to prepare details that clearly explain your product&apos;s value proposition to the community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-4 bg-white dark:bg-card border border-border/80 rounded-2xl shadow-sm">
              <span className="font-medium text-base text-foreground/90 block mb-1">Clear Tagline</span>
              <span className="text-base text-foreground/80 leading-relaxed">Describe what your product does in under 60 characters. Avoid jargon and be direct.</span>
            </div>
            <div className="p-4 bg-white dark:bg-card border border-border/80 rounded-2xl shadow-sm">
              <span className="font-medium text-base text-foreground/90 block mb-1">Premium Assets</span>
              <span className="text-base text-foreground/80 leading-relaxed">High-quality screenshots, demo videos, and a recognizable square logo/avatar make a big difference.</span>
            </div>
          </div>
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
            <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <span className="font-medium text-xs text-orange-500 uppercase tracking-wider block">Pro Tip</span>
              <span className="text-base text-foreground/80 leading-relaxed">Explain the specific problem you are solving, why it matters, and who it is for.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "2. The Launch Sequence",
      icon: <Rocket className="w-5 h-5 text-orange-500" />,
      tagline: "Set the date, submit details, and go live.",
      content: (
        <div className="space-y-4">
          <p className="text-base text-foreground/80 leading-relaxed">
            Ready to launch? You can submit your product to go live immediately, or schedule it up to a month in advance to build pre-launch hype.
          </p>
          <ul className="space-y-2 text-base text-foreground/80 leading-relaxed pl-4 list-disc">
            <li>Choose standard categories/tags so that users searching for specific domains can easily discover you.</li>
            <li>Define if you are a Maker or Hunter. We recommend makers launching their own products to take full ownership.</li>
            <li>Prepare a comprehensive &quot;Maker Comment&quot; to explain your story, the tech stack, and what features you&apos;re building next.</li>
          </ul>
        </div>
      )
    },
    {
      title: "3. Launch Day Hustle",
      icon: <Megaphone className="w-5 h-5 text-emerald-500" />,
      tagline: "Engage the community, receive feedback, and answer queries.",
      content: (
        <div className="space-y-4">
          <p className="text-base text-foreground/80 leading-relaxed">
            Launch day is all about driving real engagement. Show up in the comments section and build relationships.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="p-4 bg-white dark:bg-card border border-border/80 rounded-2xl text-center shadow-sm">
              <MessageSquare className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <span className="font-medium text-base text-foreground/90 block mb-1">Reply to Everyone</span>
              <span className="text-base text-foreground/80 leading-relaxed">Every feedback is an opportunity to learn. Say thank you and answer queries constructively.</span>
            </div>
            <div className="p-4 bg-white dark:bg-card border border-border/80 rounded-2xl text-center shadow-sm">
              <Users className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <span className="font-medium text-base text-foreground/90 block mb-1">Spread the Word</span>
              <span className="text-base text-foreground/80 leading-relaxed">Share the launch link with your community, newsletter, and social channels.</span>
            </div>
            <div className="p-4 bg-white dark:bg-card border border-border/80 rounded-2xl text-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <span className="font-medium text-base text-foreground/90 block mb-1">Interactive Demo</span>
              <span className="text-base text-foreground/80 leading-relaxed">Ensure your site can handle initial traffic, and have a clear signup funnel or sandbox.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "4. Post-Launch Momentum",
      icon: <Award className="w-5 h-5 text-indigo-500" />,
      tagline: "Leverage features like Collections and Stacks to stay visible.",
      content: (
        <div className="space-y-4">
          <p className="text-base text-foreground/80 leading-relaxed">
            Visibility doesn&apos;t end on launch day. Keep the momentum going to acquire your first batch of power users.
          </p>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-medium text-xs flex-shrink-0">1</div>
              <div>
                <span className="font-medium text-base text-foreground/90 block">Curate Collections</span>
                <span className="text-base text-foreground/80 leading-relaxed block">Add your product to thematic lists and collections to help users find it contextually.</span>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-medium text-xs flex-shrink-0">2</div>
              <div>
                <span className="font-medium text-base text-foreground/90 block">Update your Tech Stack</span>
                <span className="text-base text-foreground/80 leading-relaxed block">Makers can add the products they use to build their tools directly to their profile stacks.</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      <Navbar />

      {/* Main Content Area — Seamlessly Blended */}
      <main className="max-w-5xl mx-auto px-4 pt-36 sm:pt-42 pb-16 space-y-10">
        
        {/* Title Header */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground/90 leading-tight">
              IndiHunt Launch Guide
            </h1>
            <p className="text-base text-foreground/80 max-w-2xl leading-relaxed">
              Interested in sharing something you made? DO IT! <br className="hidden sm:inline" />
              We&apos;ve got everything you need to know about launching on IndiHunt right here.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <a
              href="#interactive-checklist"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#ff5733] hover:bg-[#e04826] text-white font-medium text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              Launch interactive guide
            </a>

            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <span className="text-muted-foreground/70">Links</span>
              <Link
                href="/faq"
                className="flex items-center gap-1 hover:text-orange-500 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-orange-500" />
                <span>FAQ Page</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive Checklist Section */}
        <div id="interactive-checklist" className="bg-white dark:bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 transition-all duration-300 hover:shadow-xl hover:border-orange-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4  pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Complete Launch Checklist</h2>
                <p className="text-base text-foreground/80 leading-relaxed">Tick off items as you get ready for launch day</p>
              </div>
            </div>

            {/* Progress pill */}
            <div className="flex items-center gap-3 bg-muted/40 px-4 py-2 rounded-2xl border border-border/60 shrink-0">
              <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground min-w-[55px] text-right">
                {completedCount}/{totalCount} ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: "tagline", title: "Concise Tagline", sub: "Under 60 characters, direct and value-driven" },
              { id: "logo", title: "High-Res Logo", sub: "Square 1:1 format icon/avatar" },
              { id: "screenshots", title: "Product Screenshots", sub: "At least 3-5 crisp app preview images" },
              { id: "video", title: "Demo Video / GIF", sub: "Short 60s preview showing core workflow" },
              { id: "makerComment", title: "Maker Introduction Comment", sub: "Your story, tech stack, and future roadmap" },
              { id: "categories", title: "Target Categories", sub: "Select relevant tags for easy discovery" },
              { id: "socialShare", title: "Social Promotion Plan", sub: "Ready tweets, posts, and community announcements" },
              { id: "communityReply", title: "Launch Day Engagement", sub: "Set aside time to answer all user feedback" },
              { id: "demoLink", title: "Working Live Link", sub: "Ensure server can handle traffic & onboarding is clear" },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${checklist[item.id]
                  ? "bg-orange-500/5 border-orange-500/40 hover:border-orange-500/60"
                  : "bg-muted/20 border-border/70 hover:border-orange-500/40"
                  }`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checklist[item.id]
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "border-border/80 bg-background"
                  }`}>
                  {checklist[item.id] && <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className={`text-base font-medium block ${checklist[item.id] ? "line-through text-muted-foreground" : "text-foreground/90"}`}>
                    {item.title}
                  </span>
                  <span className="text-base text-foreground/80 block mt-0.5 leading-relaxed">
                    {item.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4-Step Interactive Guide */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 transition-all duration-300 hover:shadow-xl hover:border-orange-500/30">
          <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight  pb-4">
            The 4-Step Guide to Launching
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {guideSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${activeStep === idx
                  ? "bg-orange-500/10 border-orange-500/40 shadow-sm"
                  : "bg-muted/20 border-border/60 hover:bg-muted/30"
                  }`}
              >
                <div className="flex items-center gap-2">
                  {step.icon}
                  <span className="font-medium text-xs sm:text-sm text-foreground/90">{step.title.split(".")[1].trim()}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 bg-muted/20 border border-border/60 rounded-2xl space-y-3 min-h-[200px]">
            <div className="flex items-center gap-3  pb-3">
              {guideSteps[activeStep].icon}
              <div>
                <h3 className="font-medium text-base text-foreground/90">{guideSteps[activeStep].title}</h3>
                <p className="text-base text-foreground/80 leading-relaxed">{guideSteps[activeStep].tagline}</p>
              </div>
            </div>
            <div className="pt-2">
              {guideSteps[activeStep].content}
            </div>
          </div>
        </div>

        {/* Launch CTA */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-3xl p-8 text-center text-white space-y-4 shadow-xl shadow-orange-500/10">
          <h2 className="text-xl sm:text-2xl font-medium">Ready to build and launch?</h2>
          <p className="text-base text-white/90 max-w-md mx-auto leading-relaxed">
            Get your product in front of thousands of makers, investors, and early adopters in Bharat today.
          </p>
          <div className="pt-2">
            <Link
              href="/new"
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-medium text-xs sm:text-sm px-6 py-3 rounded-full hover:shadow-lg transition-all"
            >
              <Rocket className="w-4 h-4" />
              <span>Submit Your Product</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
