"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft,
  Rocket,
  Users,
  Globe,
  Flame,
  Sparkles,
  Heart,
  Star,
  Target,
  Zap,
  Shield,
  TrendingUp,
  Award,
  MessageSquare,
  Code2,
  Lightbulb,
} from "lucide-react";

const VALUES = [
  {
    icon: Heart,
    title: "Community First",
    desc: "Everything we build starts with what our makers and users need. The community is not just our audience — they are our co-creators.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: Lightbulb,
    title: "Radical Transparency",
    desc: "We share our metrics, our mistakes, and our roadmap publicly. Honesty builds the trust that great communities run on.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Zap,
    title: "Ship Fast, Learn Faster",
    desc: "We deeply believe in the power of shipping. A product in users' hands beats a perfect product stuck in planning forever.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Makers Over Corporations",
    desc: "We champion solo founders, indie makers, and small teams — the people who build with passion, not just for profit.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Globe,
    title: "India to the World",
    desc: "We are proudly made in India and built for the world. We celebrate Indian innovation without limiting our global ambitions.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Target,
    title: "Relentless Improvement",
    desc: "We never settle. Every release makes IndiHunt smarter, faster, and more useful. Continuous improvement is in our DNA.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
];

const MILESTONES = [
  { year: "2026", title: "The Spark", desc: "IndiHunt was born out of a simple frustration: there was no dedicated platform for Indian indie makers to get discovered. Himanshu launched the first version from Bangalore." },
  { year: "2026", title: "Community Takes Root", desc: "Makers joined organically. Products were being upvoted, reviewed, and discussed in ways we never anticipated. The community had spoken — this was needed." },
  { year: "2026", title: "Product Hunt for India", desc: "Media started calling us 'India's Product Hunt.' We shipped Analytics, Pre-Launch pages, the Awards system, and Shoutouts — becoming a comprehensive platform for every stage of a product's journey." },
  { year: "2026", title: "Campus & Ecosystem", desc: "Launched the Campus Program to bring IndiHunt into college communities, empowering thousands of student makers to launch their first products with real users and feedback." },
  { year: "2026", title: "Growing Global", desc: "IndiHunt products started getting discovered globally. Makers from India began landing international customers, investors, and press mentions — all through organic discovery on our platform." },
  { year: "Today", title: "The Journey Continues", desc: "With 50,000+ members, hundreds of launches monthly, and a vision to be the world's go-to launchpad for indie products from India, we are just getting started." },
];

export default function AboutPage() {
  const [pulseData, setPulseData] = useState<{
    productsCount: number;
    activeMakers: number;
    monthlyVisitors: number;
    citiesCount: number;
    isLoaded: boolean;
  }>({
    productsCount: 10000,
    activeMakers: 50000,
    monthlyVisitors: 500000,
    citiesCount: 120,
    isLoaded: false,
  });

  useEffect(() => {
    fetch('/t/stats/pulse')
      .then((res) => res.json())
      .then((resData) => {
        const data = resData.data || resData;
        setPulseData({
          productsCount: data.productsCount || 10000,
          activeMakers: data.activeMakers || 50000,
          monthlyVisitors: data.monthlyVisitors || 500000,
          citiesCount: data.citiesCount || 120,
          isLoaded: true,
        });
      })
      .catch(() => {});
  }, []);

  const formatVisitors = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M+`;
    if (num >= 1000) return `${Math.round(num / 1000)}k+`;
    return `${num.toLocaleString()}+`;
  };

  const dynamicStats = [
    { value: `${pulseData.productsCount.toLocaleString()}+`, label: "Products Tracked & Launched" },
    { value: `${pulseData.activeMakers.toLocaleString()}+`, label: "Community & Network Reach" },
    { value: formatVisitors(pulseData.monthlyVisitors), label: "Monthly Discovery Views" },
    { value: `${pulseData.citiesCount.toLocaleString()}+`, label: "Cities & Tech Hubs" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-44 sm:pt-36 pb-24 lg:pb-32 ">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium uppercase tracking-wider mb-8">
            <Flame className="w-3.5 h-3.5" />
            <span>Our Story</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-foreground/90 leading-tight mb-6">
            Where India's <br />
            <span className="bg-gradient-to-r from-[#ff5733] via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Best Products
            </span>
            <br />Get Discovered
          </h1>

          <p className="text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto mb-10">
            IndiHunt is the premier platform for indie makers, solo founders, and startup teams across India and the world to launch products, gather feedback, find early adopters, and build communities around what they create.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/" className="px-6 py-3 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white font-medium text-xs shadow-lg shadow-orange-500/20 transition-all">
              Explore Products
            </Link>
            <Link href="/new" className="px-6 py-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground font-medium text-xs transition-colors">
              Launch Your Product
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Image Mosaic */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-3 gap-3 rounded-3xl overflow-hidden h-[420px]">
          <div className="col-span-2 rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&h=600&q=80"
              alt="Team collaboration"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            width={48} height={48} />
          </div>
          <div className="grid grid-rows-2 gap-3">
            <div className="rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&h=280&q=80"
                alt="Startup culture"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              width={48} height={48} />
            </div>
            <div className="rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&h=280&q=80"
                alt="Product launch"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              width={48} height={48} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card/20">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time Ecosystem Pulse</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {dynamicStats.map((s, i) => (
              <div key={i} className="text-center space-y-1">
                <span className="text-3xl sm:text-4xl font-bold text-orange-500 block">{s.value}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Origin</span>
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">
            Born from a maker's frustration
          </h2>
          <div className="space-y-5 text-base text-foreground/80 leading-relaxed">
            <p>
              In 2026, Himanshu Sharma sat in Bangalore with a product he had built over six months — a productivity tool he was genuinely proud of. He wanted to share it with the world, get feedback, find early users, and maybe even find co-founders. But there was no obvious place to do that in India.
            </p>
            <p>
              Product Hunt existed, but it was built for a Western audience. Indian founders were launching their products and getting lost in the noise. Local startup communities existed on WhatsApp and Twitter, but they were fragmented, ephemeral, and hard to discover. Something was fundamentally missing from India's startup ecosystem.
            </p>
            <p>
              So Himanshu built what he wished existed. IndiHunt launched with a simple promise: <em className="text-foreground font-medium">a dedicated, beautiful home for the best products built by Indian makers</em>. Products that deserved to be discovered. Stories that deserved to be told.
            </p>
            <p>
              The response was overwhelming. Within weeks, hundreds of makers had signed up. Products were being upvoted, discussed, reviewed, and shared. Makers were finding co-founders, early customers, and communities of fellow builders who understood their journey.
            </p>
            <p>
              What started as one frustrated maker solving his own problem had become a platform for thousands.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-y border-border">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" />
              <span>Our Mission</span>
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">
              Democratizing product discovery for India's makers
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed">
              We believe the next generation of world-changing products will be built by indie makers and small teams — people with more passion than budget, more creativity than connections. Our mission is to give these builders a fair shot at being discovered, celebrated, and supported.
            </p>
            <p className="text-base text-foreground/80 leading-relaxed">
              Every feature we build — from pre-launch pages and analytics dashboards to the awards system and community shoutouts — exists to serve one goal: helping great products find the audience they deserve.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=700&h=500&q=80"
              alt="Mission - empowering makers"
              className="w-full h-full object-cover"
            width={48} height={48} />
          </div>
        </div>
      </section>

      {/* Timeline / Milestones */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Our Journey</span>
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Milestones that define us</h2>
        </div>

        <div className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-[28px] top-0 bottom-0 w-px bg-border" />

          {MILESTONES.map((m, i) => (
            <div key={i} className="relative pl-16 pb-10 group">
              {/* Dot */}
              <div className="absolute left-0 top-1 w-14 h-14 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#ff5733] border-4 border-background shadow-md group-hover:scale-125 transition-transform" />
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-2 hover:border-orange-500/30 transition-all shadow-sm">
                <span className="text-xs font-medium text-orange-500 uppercase tracking-wider block">{m.year}</span>
                <h3 className="text-base font-medium text-foreground/90">{m.title}</h3>
                <p className="text-base text-foreground/80 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card/20 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium uppercase tracking-wider">
              <Star className="w-3.5 h-3.5" />
              <span>What We Believe</span>
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Our core values</h2>
            <p className="text-base text-foreground/80 max-w-xl mx-auto">These aren't slogans on a wall — they're the principles that guide every product decision, every feature, every conversation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <div key={i} className="bg-card border border-border p-6 rounded-3xl space-y-4 hover:border-orange-500/20 transition-all shadow-sm group">
                <div className={`w-10 h-10 rounded-2xl ${v.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <v.icon className={`w-5 h-5 ${v.color}`} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-base text-foreground/90">{v.title}</h3>
                  <p className="text-base text-foreground/80 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* What We've Built Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-y border-border">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium uppercase tracking-wider">
              <Code2 className="w-3.5 h-3.5" />
              <span>The Platform</span>
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">What we've built — and why</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Rocket, title: "Product Launches", desc: "A beautiful, structured launch experience that gives every product its moment. Upvotes, comments, reviews, alternatives — everything a launch needs." },
              { icon: TrendingUp, title: "Analytics Dashboard", desc: "Real-time insights on your product's performance. Views, upvote trends, sentiment analysis, and referrer data — all in one clean dashboard." },
              { icon: MessageSquare, title: "Community Threads", desc: "Discussion forums where makers and users can go deeper. Ask questions, share learnings, and build relationships beyond the launch day." },
              { icon: Users, title: "Maker Profiles", desc: "Every maker gets a rich profile with their products, streak, karma, and story. Because the person behind the product matters as much as the product." },
              { icon: Sparkles, title: "Pre-Launch Pages", desc: "Build anticipation before you launch. Collect emails, share teasers, and build an audience before your product is even live." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-card border border-border rounded-2xl hover:border-orange-500/20 transition-all shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-orange-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-base text-foreground/90">{item.title}</h3>
                  <p className="text-base text-foreground/80 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium uppercase tracking-wider">
          <Globe className="w-3.5 h-3.5" />
          <span>The Future</span>
        </div>
        <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight leading-tight">
          India's products deserve a <span className="bg-gradient-to-r from-[#ff5733] to-amber-400 bg-clip-text text-transparent">global stage</span>
        </h2>
        <div className="space-y-5 text-base text-foreground/80 leading-relaxed text-left">
          <p>
            We are standing at an extraordinary moment in India's startup history. Never before have so many talented, ambitious, technically brilliant people been building products — and never before has the infrastructure existed to help them reach the world.
          </p>
          <p>
            Our vision is simple but ambitious: to make IndiHunt the definitive launchpad for the next generation of great products — not just from India, but eventually from every emerging market in the world. We believe the next Google, the next Notion, the next Stripe could be built by a 22-year-old founder in Hyderabad or a two-person team in Kolkata. We want to be the platform that helps them get there.
          </p>
          <p>
            Over the next few years, we plan to expand our Awards ecosystem, deepen our analytics offering, launch maker grant programs, and build integrations that help products graduate from IndiHunt to the global stage. We are building the infrastructure for a generation of Indian makers to compete on the world's biggest stages — and win.
          </p>
          <p>
            If you are a maker, we invite you to launch your next product on IndiHunt. If you are a supporter, upvote the products that excite you. If you are an investor or brand, reach out — we would love to talk about how you can be part of what we are building.
          </p>
          <p className="font-medium text-foreground">
            This is just the beginning. India is shipping. The world is watching. 🚀
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/30">
            <Flame className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">
            Ready to launch your product?
          </h2>
          <p className="text-base text-foreground/80 leading-relaxed">
            Join 10,000+ products already on IndiHunt. Your next user, co-founder, or investor could be one launch away.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/new" className="px-8 py-4 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white font-medium text-xs shadow-lg shadow-orange-500/20 transition-all">
              Launch Your Product Free
            </Link>
            <Link href="/" className="px-8 py-4 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground font-medium text-xs transition-colors">
              Browse Products
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">No fees. No gatekeeping. Just great products meeting great people.</p>
        </div>
      </section>
    </div>
  );
}
