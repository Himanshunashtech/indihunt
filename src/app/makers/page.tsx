"use client";


import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Rocket, Users, Sparkles, Heart, Award, ShieldCheck } from "lucide-react";

export default function MakersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#ff5733] selection:text-white transition-colors duration-300">
      
      <Navbar />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 pt-36 sm:pt-42 pb-12 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/15 text-orange-500 text-xs font-medium uppercase tracking-wider mx-auto">
            <Users className="w-3.5 h-3.5" />
            <span>Meet The Makers</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-foreground/90 leading-tight">
            The builders behind India's <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#ff5733] to-amber-500 bg-clip-text text-transparent">daily tech launchpad</span>
          </h1>
          <p className="text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            We are a team of creators, engineers, and designers obsessed with empowering the next generation of Indian startups, indie hackers, and technology builders.
          </p>
        </section>

        {/* Big Team Image Section */}
        <section className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-border shadow-2xl group">
          <img 
            src="/team/team_office.webp" 
            alt="IndiHunt Team Office" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 sm:p-10">
            <div className="space-y-2">
              <span className="text-xs font-medium text-orange-400 uppercase tracking-wider block">IndiHunt Bangalore Headquarters</span>
              <h3 className="text-xl sm:text-3xl font-medium text-white">Shaping Bharat's tech future together</h3>
            </div>
          </div>
        </section>

        {/* Leadership & Founders section */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground/90">Leadership & Founders</h2>
            <p className="text-sm text-foreground/70">The minds driving IndiHunt's mission to champion Indian builders.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Aditya — CEO & Co-Founder */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-orange-500/10 to-amber-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-medium text-foreground/90">Aditya</h3>
                <span className="text-xs font-medium text-orange-500 uppercase tracking-wider block">CEO & Co-Founder</span>
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed pt-1">
                  "At IndiHunt, we are building more than a platform — we are building the launchpad for Bharat's next generation of category-defining technology startups."
                </p>
              </div>
            </div>

            {/* Himanshu Sharma — Co-Founder */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-orange-500/10 to-amber-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-medium text-foreground/90">Himanshu Sharma</h3>
                <span className="text-xs font-medium text-orange-500 uppercase tracking-wider block">Co-Founder</span>
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed pt-1">
                  "Our mission at IndiHunt is simple: to bring Indian software excellence to the global stage. We want every maker in India, whether in a tier-1 city or a remote town, to have a platform to showcase their creation to the world."
                </p>
              </div>
            </div>
          </div>

          {/* Message from Founders */}
          <div className="bg-muted/30 border border-border/60 rounded-3xl p-6 sm:p-10 space-y-6 text-base text-foreground/80 leading-relaxed">
            <h3 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">A Message from our Founders</h3>
            
            <p>
              When we started IndiHunt, the Indian tech ecosystem was growing rapidly, yet there was a glaring gap: early-stage builders lacked a centralized platform to launch their creations and receive direct community feedback. We saw incredible developers building revolutionary tools in isolation. IndiHunt was born out of a desire to change that narrative. We wanted to build a launchpad that isn't just a directory of products, but a live, breathing community of builders supporting builders.
            </p>
            
            <p>
              Over the past few years, the energy we have seen from Indian makers has been nothing short of extraordinary. From AI-driven local language tools to massive open-source developer databases, the depth of innovation in India is limitless. Our role is to provide the visibility, scaffolding, and community support required to help these projects turn into sustainable companies. We believe that the next decade of global software will be built by creators from India, and we are committed to being the launchpad that makes it possible.
            </p>
            
            <p>
              As founders, our focus is on maintaining the integrity of our platform. We work tirelessly to ensure that our daily leaderboard is fair, transparent, and completely merit-based. We want every product, regardless of marketing budget, to stand on the strength of its execution and value to users. This focus on fairness and builder success is what guides our team every single day.
            </p>
          </div>
        </section>

        {/* Manager Profiles Section */}
        <section className="space-y-8">
          <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight text-center">Meet the Leaders</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Engineering Manager Card */}
            <div className="pb-6  flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-border flex-shrink-0">
                <img 
                  src="/team/manager.webp" 
                  alt="Ananya Roy" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-base font-medium text-foreground/90">Ananya Roy</h3>
                <span className="text-xs font-medium text-orange-500 uppercase tracking-wider block">Engineering Manager</span>
                <p className="text-base text-foreground/80 leading-relaxed">
                  Ananya leads our engineering teams, ensuring the IndiHunt platform remains scalable, secure, and fast. With over a decade of experience building consumer tech, she is passionate about clean code and developer mentoring.
                </p>
              </div>
            </div>

            {/* Product Manager Card */}
            <div className="pb-6  flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-border flex-shrink-0">
                <img 
                  src="/team/pm.webp" 
                  alt="Rohan Verma" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-base font-medium text-foreground/90">Rohan Verma</h3>
                <span className="text-xs font-medium text-orange-500 uppercase tracking-wider block">Product Manager</span>
                <p className="text-base text-foreground/80 leading-relaxed">
                  Rohan shapes the roadmap and user experience of IndiHunt. He works closely with our maker community to design features like the Launch Wizard, Collections, and Forums that help developers engage and grow their audiences.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Office Life & Meeting/Lounge section (1000 world section - Part 2) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-6 text-base text-foreground/80 leading-relaxed">
            <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Our Engineering and Product Culture</h2>
            <p>
              At IndiHunt, we practice what we preach. We are builders at heart, which means we prioritize rapid iteration, user feedback, and transparent communication. Our engineering culture revolves around autonomy. We trust our developers to own their features from ideation to production. We run daily standups, weekly whiteboard brainstorming sessions, and monthly hackathons to keep our innovation engine running.
            </p>
            <p>
              Collaboration is key. We design our workspaces to be open and dynamic. If an engineer has a product idea, they don't have to wait for a roadmap meeting; they can walk up to Rohan, draft a quick wireframe on the whiteboard, and deploy a test version within days. This culture of high trust and fast execution is how we manage to keep our platform constantly updating with new features that support the startup ecosystem.
            </p>
          </div>

          <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-border shadow-lg">
            <img 
              src="/team/meeting.webp" 
              alt="Engineering Meeting" 
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Office Lounge & Recreation (1000 world section - Part 3) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          <div className="order-2 lg:order-1 aspect-[4/3] rounded-3xl overflow-hidden border border-border shadow-lg">
            <img 
              src="/team/lounge.webp" 
              alt="Office Lounge Area" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="order-1 lg:order-2 space-y-6 text-base text-foreground/80 leading-relaxed">
            <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Life at IndiHunt</h2>
            <p>
              We believe that happy minds build great software. That's why we have created an office environment in Bangalore that is both stimulating and relaxing. Our lounge area, complete with beanbags, gaming zones, and a fully stocked coffee bar, serves as a hub for informal ideas and relaxation. Whether it's discussing the latest Next.js updates over tea or playing table tennis after a major launch day release, we value work-life harmony.
            </p>
            <p>
              We are also committed to learning. Every team member gets a dedicated budget for courses, books, and conference travel. We invite industry experts to give tech talks, host community meetups in our office, and sponsor local developer workshops. Building a platform that supports makers means we must continuously grow as makers ourselves.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-8 border-y border-border/40 space-y-8">
          <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight text-center">Our Core Values</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-lg">
                <Rocket className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-base text-foreground/90">Maker First</h3>
              <p className="text-base text-foreground/80 leading-relaxed">
                Everything we build, design, and release must directly serve and benefit the maker community.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-lg">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-base text-foreground/90">Meritocracy</h3>
              <p className="text-base text-foreground/80 leading-relaxed">
                We protect the authenticity of our leaderboard. Excellence in product execution always wins.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-base text-foreground/90">High Trust</h3>
              <p className="text-base text-foreground/80 leading-relaxed">
                We empower our team members with complete ownership. We learn from failures and launch together.
              </p>
            </div>

          </div>
        </section>

        {/* Contact/CTA section */}
        <section className="text-center space-y-6 pt-6 border-t border-border">
          <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Want to build with us?</h2>
          <p className="text-base text-foreground/80 leading-relaxed max-w-md mx-auto">
            We are always looking for passionate builders, designers, and community organizers to join the IndiHunt family.
          </p>
          <a 
            href="mailto:hello@indihunt.in" 
            className="inline-block bg-[#ff5733] hover:bg-[#e64a19] text-white font-medium text-xs sm:text-sm px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/10"
          >
            Say Hello
          </a>
        </section>

      </main>
    </div>
  );
}
