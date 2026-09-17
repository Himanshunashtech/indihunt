import React from "react";
import Link from "next/link";
import { redirect, RedirectType } from "next/navigation";
import type { Metadata } from "next";
import {
  ChevronRight,
  Brain,
  Terminal,
  Palette,
  Zap,
  Smartphone,
  Activity,
  Laptop,
  Coins,
  Megaphone,
  Briefcase,
  Layers
} from "lucide-react";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Browse Product Categories — Discover AI Tools & SaaS | IndiHunt",
  description: "Explore tech software categories on IndiHunt. Discover top AI tools, developer platforms, SaaS applications, and indie hacker launches.",
  alternates: {
    canonical: "https://indihunt.in/categories",
  },
  openGraph: {
    title: "Product Categories | IndiHunt",
    description: "Browse curated directories of AI tools, SaaS apps, and indie products.",
    url: "https://indihunt.in/categories",
    siteName: "IndiHunt",
    images: [{ url: "https://indihunt.in/og-image.webp" }],
  }
};

interface SubCategory {
  name: string;
  slug: string;
  description: string;
}

interface ParentCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SubCategory[];
}

const DIRECTORY_CATEGORIES: ParentCategory[] = [
  {
    title: "Artificial Intelligence & Data",
    icon: Brain,
    items: [
      {
        name: "Artificial Intelligence",
        slug: "artificial-intelligence",
        description: "Generative AI systems, conversational search interfaces, LLMs, and chatbot models."
      },
      {
        name: "AI Notetakers",
        slug: "ai-notetakers",
        description: "AI notetakers capture meetings, calls, and voice memos, then transcribe, summarize, and extract tasks across tools."
      },
      {
        name: "AI Presentation Software",
        slug: "presentation-software",
        description: "Apps that use generative AI to create slide decks, pitch decks, and polished presentations faster."
      },
      {
        name: "AI Workflow Automation",
        slug: "workflow-automation",
        description: "AI automation tools help design and run workflows that actually take action and reduce operational load."
      },
      {
        name: "AI Agents & Automation",
        slug: "ai-agents-automation",
        description: "Intelligent autonomous agents, workflow triggers, and custom automation scripts."
      },
      {
        name: "Analytics & Data",
        slug: "analytics-data",
        description: "Data visualization dashboards, pipelines, predictive modeling, and business intelligence."
      }
    ]
  },
  {
    title: "Productivity & Core Software",
    icon: Zap,
    items: [
      {
        name: "Productivity",
        slug: "productivity",
        description: "Centralized workspaces, team document planners, calendars, task managers, and note organization tools."
      },
      {
        name: "SaaS",
        slug: "saas",
        description: "Software-as-a-service platforms, multi-tenant web tools, and cloud solutions."
      },
      {
        name: "Ad blockers",
        slug: "ad-blockers",
        description: "Ad blockers remove ads, trackers, and nags for cleaner, faster browsing across browser tools and DNS filters."
      },
      {
        name: "App switcher",
        slug: "app-switcher",
        description: "App switchers centralize launching, switching, and actions across apps with hotkeys and sidebars."
      },
      {
        name: "Content Management Systems",
        slug: "cms",
        description: "Tools that create, organize, and publish website content from headless APIs to no-code site builders."
      },
      {
        name: "Calendar apps",
        slug: "calendar-apps",
        description: "Calendars that manage time, schedule meetings, and automate booking workflows across teams."
      },
      {
        name: "Compliance software",
        slug: "compliance-software",
        description: "Automate security frameworks like SOC 2, ISO 27001, and HIPAA, and simplify audits with continuous evidence tracking."
      },
      {
        name: "Customer support tools",
        slug: "customer-support-crm",
        description: "Live chat, ticketing platforms, knowledge base sync, and omnichannel customer communication suites."
      },
      {
        name: "E-signature apps",
        slug: "e-signature-apps",
        description: "Send, sign, and manage legally binding digital contracts and approvals with built-in audit trails."
      },
      {
        name: "Email clients",
        slug: "email-clients",
        description: "Fast inboxes with keyboard-first workflows, smart triage, AI writing, and clean layouts."
      },
      {
        name: "File storage and sharing apps",
        slug: "file-storage",
        description: "Secure cloud drives, encrypted sync folders, team buckets, and fast media delivery."
      },
      {
        name: "Hiring software",
        slug: "hiring-software",
        description: "Applicant tracking systems, job boards, sourcing extensions, and team candidate interview schedulers."
      },
      {
        name: "Knowledge base software",
        slug: "knowledge-base",
        description: "Centralized team documentation, customer wikis, internal guides, and searchable standard operating procedures."
      },
      {
        name: "Meeting software",
        slug: "meeting-software",
        description: "High-definition video rooms, screen recording hubs, agenda managers, and live collaborative call notes."
      },
      {
        name: "Note and writing apps",
        slug: "note-writing-apps",
        description: "Distraction-free markdown editors, nested personal knowledge vaults, and collaborative draft pads."
      },
      {
        name: "PDF Editor",
        slug: "pdf-editor",
        description: "Annotate, merge, compress, convert, and edit PDF documents in the browser or on the desktop."
      },
      {
        name: "Password managers",
        slug: "password-managers",
        description: "End-to-end encrypted vaults for credentials, 2FA codes, team logins, and secure notes."
      },
      {
        name: "Project management software",
        slug: "project-management",
        description: "Issue trackers, sprint backlogs, kanban boards, and roadmaps built for modern product development."
      },
      {
        name: "Scheduling software",
        slug: "scheduling-software",
        description: "Shareable booking links, automated timezone conversion, calendar syncing, and round-robin team scheduling."
      },
      {
        name: "Team collaboration software",
        slug: "team-collaboration",
        description: "Real-time whiteboards, shared team workspaces, async check-in feeds, and digital brainstorm boards."
      },
      {
        name: "Time tracking apps",
        slug: "time-tracking",
        description: "Automated work timers, billable client timesheets, pomodoro trackers, and productivity analytics."
      }
    ]
  },
  {
    title: "Engineering & Development",
    icon: Terminal,
    items: [
      {
        name: "Developer Tools",
        slug: "developer-tools",
        description: "Code editors, terminal utilities, CLI scripts, debugger tools, and build optimizations."
      },
      {
        name: "AI Code Editors",
        slug: "ai-code-editors",
        description: "Next-generation IDEs and editor extensions with deep AI context, multi-file edits, and agentic workflows."
      },
      {
        name: "AI Code Testing",
        slug: "ai-code-testing",
        description: "Automated unit test generation, regression scanners, code quality analyzers, and AI PR reviewers."
      },
      {
        name: "AI Coding Agents",
        slug: "ai-coding-agents",
        description: "Autonomous software engineer agents that complete GitHub issues, write features, and resolve bugs."
      },
      {
        name: "AI Databases",
        slug: "ai-databases",
        description: "Vector stores, embeddings databases, and hybrid semantic search indexes for RAG pipelines."
      },
      {
        name: "APIs & Integrations",
        slug: "apis-integrations",
        description: "REST & GraphQL APIs, SDKs, webhook listeners, and third-party SaaS connector hubs."
      },
      {
        name: "Open Source",
        slug: "open-source",
        description: "Public GitHub repositories, MIT-licensed libraries, free frameworks, and self-hosted tools."
      },
      {
        name: "Cybersecurity",
        slug: "cybersecurity",
        description: "Identity management, auth libraries, vulnerability scanners, firewalls, and secrets detection."
      },
      {
        name: "No-Code & Low-Code",
        slug: "no-code-low-code",
        description: "Drag-and-drop builders, visual workflow designers, and rapid internal tool creators."
      },
      {
        name: "Vibe Coding Tools",
        slug: "vibe-coding",
        description: "Prompt-to-app environments, generative frontends, and instant software creation workflows."
      }
    ]
  },
  {
    title: "Design & Creative",
    icon: Palette,
    items: [
      {
        name: "Design Tools",
        slug: "design-tools",
        description: "UI/UX wireframing, vector graphics suites, interactive prototyping tools, and mockup generators."
      },
      {
        name: "3D & Animation",
        slug: "3d-animation",
        description: "3D modeling studios, motion graphics tools, procedural rendering engines, and web interactives."
      },
      {
        name: "AI Generative Media",
        slug: "ai-generative-media",
        description: "AI image generators, text-to-video tools, neural voice synthesizers, and creative media studios."
      },
      {
        name: "AR/VR",
        slug: "ar-vr",
        description: "Augmented reality filters, spatial computing kits, virtual showrooms, and immersive 3D scenes."
      },
      {
        name: "Media & Entertainment",
        slug: "media-entertainment",
        description: "Screen recording suites, video editors, audio mastering apps, and podcast distribution tools."
      }
    ]
  },
  {
    title: "Finance & Operations",
    icon: Coins,
    items: [
      {
        name: "Finance & FinTech",
        slug: "finance-fintech",
        description: "Payment processors, subscription billing platforms, multi-currency wallets, and banking APIs."
      },
      {
        name: "Accounting software",
        slug: "accounting",
        description: "Double-entry bookkeeping, automated bank feeds, financial statement generation, and tax compliance."
      },
      {
        name: "Budgeting apps",
        slug: "budgeting",
        description: "Personal expense tracking, corporate card expense management, and team cashflow projections."
      },
      {
        name: "Invoicing tools",
        slug: "invoicing",
        description: "Client billing portals, recurring invoice automation, payment reminders, and PDF invoice makers."
      },
      {
        name: "Legal services",
        slug: "legal-services",
        description: "Contract lifecycle management, digital NDAs, terms & privacy generators, and incorporation services."
      }
    ]
  },
  {
    title: "Marketing & Sales",
    icon: Megaphone,
    items: [
      {
        name: "Marketing Tools",
        slug: "marketing-tools",
        description: "Search engine optimization dashboards, content marketing planners, and social media schedulers."
      },
      {
        name: "AI sales tools",
        slug: "ai-sales-tools",
        description: "AI lead enrichment, automated cold email sequences, call intelligence, and pipeline outreach."
      },
      {
        name: "CRM software",
        slug: "crm-software",
        description: "Customer relationship pipelines, contact managers, sales stages, and deal forecasting."
      },
      {
        name: "E-Commerce & Retail",
        slug: "e-commerce-retail",
        description: "Digital storefront platforms, checkout optimization, inventory management, and dropshipping hubs."
      }
    ]
  },
  {
    title: "Web3, Mobile & Social",
    icon: Smartphone,
    items: [
      {
        name: "Mobile Apps",
        slug: "mobile-apps",
        description: "Native iOS and Android utilities, cross-platform apps, and mobile widgets."
      },
      {
        name: "Web3 & Crypto",
        slug: "web3-crypto",
        description: "Decentralized applications, crypto wallets, blockchain smart contracts, and NFT discovery."
      },
      {
        name: "Social & Community",
        slug: "social-community",
        description: "Community forums, creator membership clubs, group chats, and interactive discussion feeds."
      }
    ]
  },
  {
    title: "Health, Life & Education",
    icon: Activity,
    items: [
      {
        name: "Health & Fitness",
        slug: "health-fitness",
        description: "Habit trackers, workout logs, mindfulness apps, nutrition guides, and wellness monitors."
      },
      {
        name: "Education & EdTech",
        slug: "education-edtech",
        description: "Online learning platforms, interactive study cards, coding bootcamps, and tutoring tools."
      }
    ]
  }
];

export default async function CategoriesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  // 301 Permanent Redirect query parameter URLs (/categories?category=xyz) to canonical clean path (/categories/xyz)
  if (category && typeof category === "string") {
    redirect(`/categories/${category.trim()}`, RedirectType.replace);
  }

  // Breadcrumb schema for directory
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://indihunt.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Categories",
        "item": "https://indihunt.in/categories"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden transition-colors duration-300 pt-[60px] sm:pt-[72px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground/90">
            Product Categories
          </h1>
          <p className="text-base text-foreground/80 leading-relaxed">
            Browse through our curated directory of launch categories. Click on any category to view full upvote leaderboards, quality scores, and recent additions.
          </p>
        </div>

        {/* Categories Directory Grid */}
        <div className="space-y-12">
          {DIRECTORY_CATEGORIES.map((parent) => (
            <div key={parent.title} className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                <parent.icon className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">
                  {parent.title}
                </h2>
              </div>

              {/* Subcategories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parent.items.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/categories/${sub.slug}`}
                    className="bg-card border border-border/75 p-6 rounded-2xl flex flex-col justify-between hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium text-foreground/90 group-hover:text-orange-500 transition-colors">
                          {sub.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {sub.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
