"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Briefcase,
  Users,
  Sparkles,
  Rocket,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  Heart,
  Zap,
  Award,
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Code,
  Megaphone,
  Palette,
  ShieldCheck,
  Building,
} from "lucide-react";
import { getJobs, JobPosting } from "@/lib/supabase";

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllJobs() {
      setLoading(true);
      const data = await getJobs();
      setJobs(data);
      setLoading(false);
    }
    loadAllJobs();
  }, []);

  const departments = ["All", "Engineering", "Growth & Marketing", "Community & DevRel", "Design", "Operations"];

  const filteredJobs = jobs.filter((job) => {
    const matchDept = selectedDepartment === "All" || job.department.toLowerCase().includes(selectedDepartment.toLowerCase());
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      job.department.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q);
    return matchDept && matchSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedJobId((prev) => (prev === id ? null : id));
  };

  const getDeptIcon = (dept: string) => {
    const d = dept.toLowerCase();
    if (d.includes("eng")) return <Code className="w-3.5 h-3.5 text-blue-500" />;
    if (d.includes("growth") || d.includes("market")) return <Megaphone className="w-3.5 h-3.5 text-orange-500" />;
    if (d.includes("comm") || d.includes("devrel")) return <Users className="w-3.5 h-3.5 text-purple-500" />;
    if (d.includes("design")) return <Palette className="w-3.5 h-3.5 text-pink-500" />;
    if (d.includes("ops") || d.includes("oper")) return <Building className="w-3.5 h-3.5 text-emerald-500" />;
    return <Briefcase className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#ff5733] selection:text-white">
      <Navbar />

      {/* ── HERO SECTION ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-40 sm:pt-42 pb-16 lg:pb-24 border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Careers at IndiHunt</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground/95 leading-tight">
            Build the future of <br />
            <span className="bg-gradient-to-r from-[#ff5733] via-orange-400 to-amber-400 bg-clip-text text-transparent">
              India&apos;s Indie Ecosystem
            </span>
          </h1>

          <p className="text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            We are a team of builders, creators, and community obsessives on a mission to empower Indian makers to launch world-class software products and get discovered globally.
          </p>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-500" />
              <span>100% Remote / Hybrid</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>High Ownership & Speed</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Community First</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY JOIN US ──────────────────────────────────────────────────────────── */}
      <section className="py-16 max-w-6xl mx-auto px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90">Why Work With Us?</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Get your hands dirty with real product growth, scale a passionate maker community, and make an impact on thousands of launches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Rocket,
              title: "Direct Impact",
              desc: "Your work directly helps hundreds of indie founders get their first users, customers, and press coverage."
            },
            {
              icon: Zap,
              title: "Exponential Learning",
              desc: "Ship fast, experiment daily, and analyze growth loops across social, SEO, email digests, and community programs."
            },
            {
              icon: Users,
              title: "Vibrant Community",
              desc: "Work closely with India's top developers, designers, product managers, and indie hackers every single day."
            }
          ].map((perk, i) => (
            <div key={i} className="p-6 bg-card border border-border rounded-2xl space-y-3 shadow-xs hover:border-orange-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <perk.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground/90">{perk.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OPEN POSITIONS SECTION ────────────────────────────────────────────────── */}
      <section id="openings" className="py-16 bg-card/20 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">

          {/* Header + Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Now Hiring</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Open Opportunities
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roles, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {departments.map((dept) => {
              const count = dept === "All" ? jobs.length : jobs.filter(j => j.department.toLowerCase().includes(dept.toLowerCase())).length;
              const isSelected = selectedDepartment === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                      ? "bg-[#ff5733] text-white shadow-md shadow-orange-500/20"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <span>{dept}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Jobs List */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">Loading open positions...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 bg-card border border-border rounded-3xl text-center space-y-4">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No roles found matching your filter</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Don&apos;t the exact role you are looking for? Submit a general application and tell us how you can help!
              </p>
              <Link
                href="/careers/apply?role=General+Application"
                className="inline-block px-5 py-2.5 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Submit General Application
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const isExpanded = expandedJobId === job.id;

                return (
                  <div
                    key={job.id}
                    className="bg-card border border-border/80 hover:border-orange-500/40 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all space-y-5 group"
                  >
                    {/* Top Row: Title, Meta, Apply CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-orange-500 transition-colors">
                            {job.title}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-bold flex items-center gap-1">
                            {getDeptIcon(job.department)}
                            <span>{job.department}</span>
                          </span>
                        </div>

                        {/* Location, Type, Salary Badges */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" /> {job.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" /> {job.type} • {job.experience}
                          </span>
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Award className="w-3.5 h-3.5 text-emerald-500" /> {job.stipend_salary}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => toggleExpand(job.id)}
                          className="px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? "Less Info" : "Role Details"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <Link
                          href={`/careers/apply?role=${job.id}`}
                          className="px-5 py-2 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Apply Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Expanded Detail Accordion */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-border/80 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-foreground/85 leading-relaxed animate-in fade-in duration-200">
                        {/* Responsibilities */}
                        {job.responsibilities && job.responsibilities.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> What You&apos;ll Do
                            </h4>
                            <ul className="space-y-2 text-muted-foreground">
                              {job.responsibilities.map((resp, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{resp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Requirements */}
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> What We&apos;re Looking For
                            </h4>
                            <ul className="space-y-2 text-muted-foreground">
                              {job.requirements.map((req, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Perks */}
                        {job.perks && job.perks.length > 0 && (
                          <div className="md:col-span-2 pt-2 border-t border-border/40">
                            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-emerald-500" /> Perks & Benefits
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                              {job.perks.map((perk, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span>{perk}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── GENERAL APPLICATION CTA ──────────────────────────────────────────────── */}
      <section className="py-16 text-center space-y-4 max-w-xl mx-auto px-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Don&apos;t see a matching position?</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          We are always eager to meet exceptional builders, designers, and community creators. Drop your resume and a short note about what you want to build.
        </p>
        <Link
          href="/careers/apply?role=General+Application"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff5733] hover:bg-[#e64a19] text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
        >
          <span>Send General Application</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
