"use client";


import React, { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Search,
  ChevronDown,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Sparkles,
  Flame,
  UserCheck
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "For Makers" | "Karma & Upvotes" | "Guidelines";
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const categories = ["All", "General", "For Makers", "Karma & Upvotes", "Guidelines"];

  const faqData: FAQItem[] = [
    {
      category: "General",
      question: "What is IndiHunt?",
      answer: "IndiHunt is India's daily tech launchpad where makers and developers showcase their products, get feedback from the community, and find their early adopters. It is modeled on helping Indian startups and side-projects find their spotlight."
    },
    {
      category: "General",
      question: "Who can post products on IndiHunt?",
      answer: "Anyone! If you have built an app, browser extension, open-source library, SaaS platform, hardware tool, or even a community project relevant to tech builders, you are welcome to post it."
    },
    {
      category: "For Makers",
      question: "How do I launch my product on IndiHunt?",
      answer: "Simply log in to your account, click the 'Launch' button in the header, and fill out the submission form. You will need a name, tagline, description, category tags, and assets such as a logo and screenshots."
    },
    {
      category: "For Makers",
      question: "Can I schedule my launch in advance?",
      answer: "Yes, when submitting your product, you can select the 'Schedule' option to choose a future launch date up to 30 days in advance. This allows you to build anticipation and coordinate your launch day marketing."
    },
    {
      category: "Karma & Upvotes",
      question: "How does the upvote/ranking algorithm work?",
      answer: "Products are ranked based on the volume of authentic community upvotes they receive, combined with factors like comment engagement and posting velocity. Spam/automated voting is strictly filtered to keep the leaderboard fair."
    },
    {
      category: "Karma & Upvotes",
      question: "What is Karma and how do I earn it?",
      answer: "Karma represents your contribution score to the IndiHunt ecosystem. You earn karma when you launch products, participate in forum discussions, write helpful reviews, or receive upvotes on your comments."
    },
    {
      category: "Guidelines",
      question: "What are the rules regarding self-promotion?",
      answer: "Makers are encouraged to promote their own launches, but we ask that you engage genuinely. Buying upvotes, offering monetary incentives for votes, or spamming unrelated community threads is against our community guidelines and may result in launch suspension."
    },
    {
      category: "Guidelines",
      question: "How can I report spam or abusive behavior?",
      answer: "Every comment and product has options to report content directly to moderators. If you notice suspicious upvote patterns or harassment, please use the report button or contact our support team directly."
    }
  ];

  const filteredFaqs = useMemo(() => {
    return faqData.filter(faq => {
      const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden transition-colors duration-300 pt-[76px] sm:pt-[84px]">
      {/* Navbar */}
      <Navbar />

      {/* FAQPage JSON-LD Schema — matches visible FAQ content on this page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Title */}
        <div className="space-y-3 relative py-4">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-orange-500/5 rounded-3xl blur-3xl -z-10"></div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ Hub</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground/90 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-foreground/80 max-w-2xl leading-relaxed">
            Have questions about voting, launch policies, or building your profile? We have answers to help you make the most of IndiHunt.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search FAQ questions or topics..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setExpandedIndex(null);
              }}
              className="w-full bg-card border border-border rounded-2xl py-3 pl-10 pr-4 text-base font-medium text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setExpandedIndex(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider border transition-all cursor-pointer ${selectedCategory === cat
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-muted/5">
              <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-55" />
              <p className="text-base font-medium text-foreground/90">No matches found</p>
              <p className="text-xs text-muted-foreground mt-1">Try using different keywords or resetting filters.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`bg-card border rounded-2xl transition-all overflow-hidden ${isExpanded ? "border-orange-500/30 shadow-md" : "border-border/80"
                    }`}
                >
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-muted/10 transition-colors cursor-pointer group"
                  >
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                        {faq.category}
                      </span>
                      <h3 className="font-medium text-base text-foreground/90 group-hover:text-orange-500 transition-colors">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${isExpanded ? "rotate-180 text-orange-500" : ""
                        }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-2 border-t border-border/40 bg-muted/5">
                      <p className="text-base text-foreground/80 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact CTA */}
        <div className="p-6 border border-border/80 bg-muted/15 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="font-medium text-base text-foreground/90 block">Still have questions?</span>
            <span className="text-base text-foreground/80">Our team and active makers are happy to support you.</span>
          </div>
          <Link
            href="/help"
            className="px-5 py-2.5 border border-border bg-card hover:bg-muted font-medium text-xs rounded-xl text-foreground transition-colors inline-block"
          >
            Help Center
          </Link>
        </div>

      </main>
    </div>
  );
}
