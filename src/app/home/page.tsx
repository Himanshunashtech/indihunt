"use client";

import React from "react";
import Link from "next/link";
import { useAppDispatch, setAuthModalOpen } from "@/lib/store";
import {
  Rocket,
  Compass,
  Target,
  ShieldCheck
} from "lucide-react";

export default function HomePage() {
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen font-sans selection:bg-[#ff6154] selection:text-white bg-black text-gray-100">
      {/* Top spacing removed: pt-4 sm:pt-6 */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-12">

        {/* Solid colored border around the letter */}
        <div className="border-2 border-[#ff5733] rounded-3xl p-6 sm:p-12 bg-black shadow-[0_0_50px_rgba(255,87,51,0.15)] space-y-12 sm:space-y-16">

          {/* Section 1: Hero Header */}
          <section className="space-y-6">


            <h1 className="text-3xl sm:text-5xl font-black tracking-tight flex items-center gap-3 text-white">
              <span>🚀</span>
              <span>IndiHunt</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              At <strong className="text-white font-bold">IndiHunt</strong>, we're a passionate and growing community of indie hackers dedicated to creating and shipping products that truly resonate with users. We believe that the current landscape of product launches doesn't fully support the unique needs of indie creators, often overlooking the personal touch and genuine feedback that drive meaningful innovation.
            </p>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              Building software as an independent creator is one of the most rewarding yet challenging endeavors in technology today. Independent builders face unique hurdles: limited marketing budgets, noisier distribution channels, and an overwhelming saturation of automated tools. IndiHunt was established to solve these exact friction points by creating a platform built around the authentic builder journey.
            </p>
          </section>

          <hr className="border-t border-zinc-800" />

          {/* Section 2: Why IndiHunt? */}
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-white">
              <span>Why IndiHunt?</span>
              <span className="text-2xl sm:text-3xl">🧐</span>
            </h2>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              Traditional product launch platforms can feel impersonal and highly competitive, making it challenging for indie developers and entrepreneurs to gain the visibility and support they deserve. <strong className="text-white font-bold">IndiHunt</strong> was created to change that. Here, you can showcase your projects, receive constructive feedback, and connect with like-minded individuals who share your passion for building impactful products.
            </p>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              Unlike generic discovery platforms that prioritize big-budget corporate marketing campaigns or pay-to-win sponsorship slots, IndiHunt puts individual craft and utility at the center of attention. Whether you are a solo developer who coded a browser extension over the weekend, a small team launching a niche SaaS tool, or a designer building open-source templates, IndiHunt levels the playing field so your work gets discovered on merit and genuine community interest.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl border bg-zinc-950 border-zinc-800">
                <h3 className="text-base font-bold mb-2 flex items-center gap-2 text-white">
                  <Target className="w-4 h-4 text-[#ff6154]" />
                  <span>Fair Discovery Algorithm</span>
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  No pay-to-rank schemes or hidden algorithm suppression. Every product submitted receives fair initial impression exposure to active community members.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-zinc-950 border-zinc-800">
                <h3 className="text-base font-bold mb-2 flex items-center gap-2 text-white">
                  <ShieldCheck className="w-4 h-4 text-[#ff6154]" />
                  <span>Verified Feedback Culture</span>
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  Constructive, actionable critiques from fellow makers who have walked in your shoes, ensuring your product improves with every release.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-t border-zinc-800" />

          {/* Section 3: Our Mission & Pillars */}
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Our Mission
            </h2>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              Our mission is to empower indie hackers by providing a supportive environment where ideas can flourish. We aim to streamline the product launch process, making it more accessible and effective for creators at all stages. Whether you're launching your first app, a new gadget, or a creative digital service, <strong className="text-white font-bold">IndiHunt</strong> is here to help you succeed.
            </p>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              We envision an ecosystem where innovation is decentralized, where anyone with a laptop and a vision can build a sustainable business without needing millions in venture capital. By providing distribution, infrastructure, and a supportive network, we turn early prototypes into thriving software ventures.
            </p>

            {/* Bullet Points */}
            <ul className="space-y-5 pt-2">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-2.5 shrink-0 bg-white" />
                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  <strong className="text-white font-bold">Collaboration Opportunities:</strong> Access potential co-founders, collaborators, or testers for your projects, and build meaningful relationships that can propel your ventures forward.
                </p>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-2.5 shrink-0 bg-white" />
                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  <strong className="text-white font-bold">Resources and Tools:</strong> Access a wealth of resources, including tutorials, guides, and tools designed to assist you in every step of your product development and launch journey.
                </p>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-2.5 shrink-0 bg-white" />
                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  <strong className="text-white font-bold">Events and Webinars:</strong> Participate in exclusive events and webinars hosted by industry experts to stay updated on the latest trends and best practices in product development and marketing.
                </p>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-2.5 shrink-0 bg-white" />
                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  <strong className="text-white font-bold">Transparent Quality Scoring:</strong> Benefit from automated quality verification algorithms that highlight products with clear value propositions, clean landing pages, and working live demos.
                </p>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-2.5 shrink-0 bg-white" />
                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  <strong className="text-white font-bold">Global & Regional Visibility:</strong> Showcase your work to an international audience of tech enthusiasts, early adopters, angel investors, and fellow software creators.
                </p>
              </li>
            </ul>
          </section>

          <hr className="border-t border-zinc-800" />

          {/* Section 4: The Indie Hacker Ethos */}
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-white">
              <span>The Indie Hacker Ethos</span>
              <span className="text-2xl sm:text-3xl">💡</span>
            </h2>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              Indie hacking is more than just writing code or shipping side projects; it is a fundamental shift in how value is created in the digital economy. It represents the freedom to build software on your own terms, solve real problems for real people, and maintain complete creative autonomy over your work.
            </p>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              At IndiHunt, we embrace building in public. Sharing behind-the-scenes progress, raw revenue statistics, design mockups, and technical post-mortems creates an atmosphere of authenticity that inspires everyone in the community. When one maker succeeds, they share the playbook so others can follow in their footsteps.
            </p>

            <div className="p-6 rounded-3xl border bg-zinc-950 border-zinc-800">
              <h3 className="text-lg font-extrabold mb-3 text-white">
                What We Stand For
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <div className="text-sm font-bold text-[#ff6154] mb-1">01. Craft & Utility</div>
                  <p className="text-xs leading-relaxed text-gray-400">
                    Great software solves a specific problem exceptionally well without unnecessary complexity.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#ff6154] mb-1">02. Mutual Support</div>
                  <p className="text-xs leading-relaxed text-gray-400">
                    We lift each other up through honest feedback, upvotes, shares, and active collaboration.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#ff6154] mb-1">03. Sustainable Growth</div>
                  <p className="text-xs leading-relaxed text-gray-400">
                    Building profitable, long-term businesses powered by happy, satisfied users.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-t border-zinc-800" />

          {/* Section 5: Join the Community */}
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-white">
              <span>Join the Community</span>
              <span className="text-2xl sm:text-3xl">🤝</span>
            </h2>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              By joining <strong className="text-white font-bold">IndiHunt</strong>, you become part of a vibrant network of innovators who are eager to collaborate, share insights, and celebrate each other's successes. Whether you're a seasoned entrepreneur or just starting out, you'll find a welcoming space to grow and thrive.
            </p>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              Our community brings together software engineers, UI/UX designers, AI researchers, content creators, and growth marketers. Together, we exchange ideas in interactive discussion threads, review new product launches daily, exchange feedback on landing pages, and celebrate product achievements together.
            </p>
          </section>

          <hr className="border-t border-zinc-800" />

          {/* Section 6: Get Started Today */}
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-white">
              <span>Get Started Today</span>
              <span className="text-2xl sm:text-3xl">🛠️</span>
            </h2>

            <p className="text-base sm:text-lg leading-relaxed font-normal text-gray-300">
              Ready to launch your next big idea?{" "}
              <button
                type="button"
                onClick={() => dispatch(setAuthModalOpen(true))}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 cursor-pointer transition-colors"
              >
                Sign up today
              </button>{" "}
              and start building alongside a community that truly understands and supports your entrepreneurial spirit. Together, we can redefine how products are launched and ensure that every great idea finds its audience.
            </p>

            <p className="text-base sm:text-lg leading-relaxed font-bold text-white">
              Jump in and help us create tools and features that make launching products easier and more rewarding for indie hackers like you. Whether you're looking to showcase your latest project, seek feedback, or collaborate with others, <strong className="text-white font-bold">IndiHunt</strong> is the platform where your journey begins.
            </p>

            <div className="p-6 rounded-3xl border bg-zinc-950 border-zinc-800">
              <h3 className="text-xl font-black mb-3 text-white">
                How to Launch on IndiHunt in 3 Simple Steps:
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#ff5733] text-white flex items-center justify-center font-black text-xs shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">Create Your Maker Profile</h4>
                    <p className="text-xs text-gray-400">Sign up with your GitHub or Google account, set your bio, headline, tech stack, and social handles.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#ff5733] text-white flex items-center justify-center font-black text-xs shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">Submit Your Product Details</h4>
                    <p className="text-xs text-gray-400">Provide a logo, tagline, detailed description, live website link, and screenshots or video demo.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#ff5733] text-white flex items-center justify-center font-black text-xs shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">Engage With Your Early Users</h4>
                    <p className="text-xs text-gray-400">Respond to comments, answer user questions in discussion threads, collect feedback, and watch your upvotes grow!</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => dispatch(setAuthModalOpen(true))}
                  className="px-6 py-3.5 bg-[#ff5733] hover:bg-[#e64a19] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#ff5733]/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Join IndiHunt Today</span>
                </button>

                <Link
                  href="/"
                  className="px-6 py-3.5 rounded-2xl font-bold text-sm border transition-all cursor-pointer flex items-center gap-2 bg-zinc-900 border-zinc-800 text-gray-200 hover:bg-zinc-800 hover:text-white"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore All Launches</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Section 7: CEO Signature & Official Verified Stamp / Seal */}
          <section className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff6154]">
                Signed & Certified
              </div>

              {/* CEO Handwritten Signature SVG */}
              <div className="relative py-1">
                <svg className="w-56 h-14 text-white fill-none stroke-current" viewBox="0 0 240 60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10,45 C25,10 35,5 45,35 C50,45 55,20 60,30 C65,40 70,35 75,30 C80,25 85,40 90,30 C95,20 100,45 110,40" stroke="#ff5733" strokeWidth="3" />
                  <path d="M120,40 C130,15 140,10 150,35 C155,45 160,25 165,30 C170,35 175,25 180,40 C190,30 205,20 220,35" stroke="#ff5733" strokeWidth="2.5" />
                  <path d="M15,50 Q110,55 225,48" stroke="#ff6154" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-white tracking-wide">Aditya</h4>
                <p className="text-xs font-semibold text-[#ff6154]">CEO & Co-Founder, IndiHunt</p>
                <p className="text-xs text-gray-400">Co-Founded with <span className="text-white font-medium">Himanshu Sharma</span> (Co-Founder)</p>
                <p className="text-[11px] text-gray-500 font-mono pt-1">Bengaluru, Karnataka, India • 2026</p>
              </div>
            </div>

            {/* Official Round Verified Community Seal Stamp */}
            <div className="relative w-32 h-32 rounded-full border-4 border-[#ff5733] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-1.5 flex items-center justify-center text-center shadow-[0_0_30px_rgba(255,87,51,0.25)] shrink-0 select-none transform hover:rotate-6 transition-transform">
              <div className="w-full h-full rounded-full border-2 border-dashed border-[#ff6154]/70 flex flex-col items-center justify-center p-2">
                <div className="text-[10px] font-black tracking-widest text-[#ff6154] uppercase">INDIHUNT</div>
                <div className="text-[12px] my-0.5">🎖️</div>
                <div className="text-[8px] font-extrabold text-white uppercase tracking-tighter">OFFICIAL SEAL</div>
                <div className="text-[7px] font-mono text-gray-400 mt-0.5">VERIFIED • 2026</div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
