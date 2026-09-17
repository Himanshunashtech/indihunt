import React from "react";
import type { Metadata } from "next";
import { getProducts, Product, getProductSlug } from "@/lib/supabase";
import CategoryPageClient from "./CategoryPageClient";

export const revalidate = 60; // ISR: Revalidate page data every 60 seconds

const SITE_URL = "https://indihunt.in";

const SLUG_TO_NAME: Record<string, string> = {
  "artificial-intelligence": "Artificial Intelligence",
  "ai-notetakers": "AI Notetakers",
  "presentation-software": "AI Presentation Software",
  "workflow-automation": "AI Workflow Automation",
  "ai-agents-automation": "AI Agents & Automation",
  "analytics-data": "Analytics & Data",
  "productivity": "Productivity",
  "saas": "SaaS",
  "ad-blockers": "Ad blockers",
  "app-switcher": "App switcher",
  "cms": "Content Management Systems",
  "calendar-apps": "Calendar apps",
  "compliance-software": "Compliance software",
  "customer-support-crm": "Customer support tools",
  "e-signature-apps": "E-signature apps",
  "email-clients": "Email clients",
  "file-storage": "File storage and sharing apps",
  "hiring-software": "Hiring software",
  "knowledge-base": "Knowledge base software",
  "meeting-software": "Meeting software",
  "note-writing-apps": "Note and writing apps",
  "pdf-editor": "PDF Editor",
  "password-managers": "Password managers",
  "project-management": "Project management software",
  "scheduling-software": "Scheduling software",
  "team-collaboration": "Team collaboration software",
  "time-tracking": "Time tracking apps",
  "developer-tools": "Developer Tools",
  "ai-code-editors": "AI Code Editors",
  "ai-code-testing": "AI Code Testing",
  "ai-coding-agents": "AI Coding Agents",
  "ai-databases": "AI Databases",
  "apis-integrations": "APIs & Integrations",
  "open-source": "Open Source",
  "cybersecurity": "Cybersecurity",
  "no-code-low-code": "No-Code & Low-Code",
  "vibe-coding": "Vibe Coding Tools",
  "design-tools": "Design Tools",
  "3d-animation": "3D & Animation",
  "ai-generative-media": "AI Generative Media",
  "ar-vr": "AR/VR",
  "media-entertainment": "Media & Entertainment",
  "finance-fintech": "Finance & FinTech",
  "accounting": "Accounting software",
  "budgeting": "Budgeting apps",
  "invoicing": "Invoicing tools",
  "legal-services": "Legal services",
  "marketing-tools": "Marketing Tools",
  "ai-sales-tools": "AI sales tools",
  "crm-software": "CRM software",
  "e-commerce-retail": "E-Commerce & Retail",
  "mobile-apps": "Mobile Apps",
  "web3-crypto": "Web3 & Crypto",
  "social-community": "Social & Community",
  "health-fitness": "Health & Fitness",
  "education-edtech": "Education & EdTech",
};

interface CategoryMeta {
  name: string;
  slug: string;
  aliases: string[];
  keywords: string[];
}

const CATEGORY_REGISTRY: Record<string, CategoryMeta> = {
  "artificial-intelligence": {
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    aliases: ["ai", "artificial-intelligence", "llm", "generative-ai", "gpt", "deep-learning", "machine-learning", "chat-model", "chatbots"],
    keywords: ["ai", "artificial intelligence", "gpt", "intelligence", "llm", "deep learning", "machine learning", "neural network", "chatgpt"]
  },
  "ai-notetakers": {
    name: "AI Notetakers",
    slug: "ai-notetakers",
    aliases: ["ai-notetakers", "ai-notetaker", "notetaker", "notetakers", "ai-transcription", "meeting-notes", "voice-notes"],
    keywords: ["ai notetaker", "notetaker", "transcribe", "transcription", "meeting summary", "voice memo", "otter", "fireflies", "fathom", "audio notes"]
  },
  "presentation-software": {
    name: "AI Presentation Software",
    slug: "presentation-software",
    aliases: ["presentation-software", "ai-presentation", "presentation", "presentations", "slides", "pitch-deck", "slide-deck", "slide-decks"],
    keywords: ["presentation", "presentations", "slides", "pitch deck", "slide deck", "gamma", "tome", "deck builder", "slide maker"]
  },
  "workflow-automation": {
    name: "AI Workflow Automation",
    slug: "workflow-automation",
    aliases: ["workflow-automation", "automation", "automation-tools", "zapier", "n8n", "make", "triggers", "workflows"],
    keywords: ["workflow automation", "automate workflow", "triggers", "actions", "automation pipeline", "zapier", "n8n", "webhooks automation"]
  },
  "ai-agents-automation": {
    name: "AI Agents & Automation",
    slug: "ai-agents-automation",
    aliases: ["ai-agents-automation", "ai-agents", "autonomous-agents", "agentic", "ai-agent", "agent"],
    keywords: ["ai agent", "ai agents", "autonomous agent", "agentic", "auto-pilot", "multi-agent", "agent framework"]
  },
  "analytics-data": {
    name: "Analytics & Data",
    slug: "analytics-data",
    aliases: ["analytics-data", "analytics", "data", "bi", "metrics", "data-visualization", "dashboards", "telemetry"],
    keywords: ["analytics", "metrics", "data visualization", "dashboard", "business intelligence", "telemetry", "tracking metrics", "user analytics"]
  },
  "productivity": {
    name: "Productivity",
    slug: "productivity",
    aliases: ["productivity", "workspace", "organizer", "planner", "daily-planner", "task-management", "focus"],
    keywords: ["productivity", "productive", "workspace", "focus", "planner", "organize", "todo", "task manager"]
  },
  "saas": {
    name: "SaaS",
    slug: "saas",
    aliases: ["saas", "software-as-a-service", "cloud-software", "b2b-saas", "micro-saas", "web-app"],
    keywords: ["saas", "software as a service", "b2b saas", "cloud platform", "subscription software", "multi-tenant"]
  },
  "developer-tools": {
    name: "Developer Tools",
    slug: "developer-tools",
    aliases: ["developer-tools", "devtools", "coding", "git-github", "command-line", "testing-qa", "deployment", "hosting"],
    keywords: ["developer tools", "devtools", "code", "compiler", "cli", "debugging", "programming", "software dev", "git"]
  },
  "ai-coding-agents": {
    name: "AI Coding Agents",
    slug: "ai-coding-agents",
    aliases: ["ai-coding-agents", "autonomous-coder", "ai-engineer", "software-agent", "devin"],
    keywords: ["coding agent", "ai engineer", "devin", "sweep", "openhands", "autonomous coding", "software agent", "coding bots"]
  },
  "ai-code-editors": {
    name: "AI Code Editors",
    slug: "ai-code-editors",
    aliases: ["ai-code-editors", "ai-ide", "code-editor", "cursor", "windsurf", "agentic-ide"],
    keywords: ["ai code editor", "cursor", "windsurf", "zed", "vs code", "ai ide", "agentic ide", "code autocomplete", "code editor"]
  },
  "marketing-tools": {
    name: "Marketing Tools",
    slug: "marketing-tools",
    aliases: ["marketing-tools", "marketing", "seo", "growth-hacking", "email-marketing", "content-creation"],
    keywords: ["marketing tools", "marketing", "seo", "growth", "campaign", "social media marketing", "lead gen"]
  },
  "finance-fintech": {
    name: "Finance & FinTech",
    slug: "finance-fintech",
    aliases: ["finance-fintech", "finance", "fintech", "payments", "banking", "monetary"],
    keywords: ["finance", "fintech", "payment", "banking", "money", "stripe", "razorpay", "paypal"]
  },
  "design-tools": {
    name: "Design Tools",
    slug: "design-tools",
    aliases: ["design-tools", "design", "ui-ux", "graphic-design", "figma-plugins", "icons-illustration"],
    keywords: ["design tools", "design", "ui", "ux", "figma", "graphic design", "vector", "canvas", "mockup"]
  }
};

const ALL_CATEGORIES_PANEL = Object.entries(SLUG_TO_NAME).map(([slug, name]) => ({
  slug,
  name
}));

function normalizeSlug(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

export function isProductInCategory(product: Product, targetSlug: string, targetCategoryName?: string): boolean {
  const normTargetSlug = normalizeSlug(targetSlug);
  const def = CATEGORY_REGISTRY[normTargetSlug];
  const targetName = targetCategoryName || SLUG_TO_NAME[normTargetSlug] || normTargetSlug.replace(/-/g, " ");

  const aliasSet = new Set<string>([
    normTargetSlug,
    normalizeSlug(targetName),
    ...(def?.aliases || []).map(normalizeSlug),
  ]);

  if (product.category) {
    const normCat = normalizeSlug(product.category);
    if (aliasSet.has(normCat)) return true;
    for (const alias of aliasSet) {
      if (alias.length >= 3 && (normCat.includes(alias) || alias.includes(normCat))) {
        return true;
      }
    }
  }

  const tags = product.tags || [];
  for (const rawTag of tags) {
    const normTag = normalizeSlug(rawTag);
    if (aliasSet.has(normTag)) return true;
    for (const alias of aliasSet) {
      if (alias.length >= 3 && (normTag.includes(alias) || alias.includes(normTag))) {
        return true;
      }
    }
  }

  const combinedText = ` ${cleanText(product.name)} ${cleanText(product.tagline || '')} ${cleanText(product.description || '')} ${tags.map(t => cleanText(t)).join(' ')} `;
  const keywords = def?.keywords || [cleanText(targetName)];
  for (const kw of keywords) {
    const cleanKw = cleanText(kw).trim();
    if (!cleanKw) continue;
    if (combinedText.includes(` ${cleanKw} `)) {
      return true;
    }
    if (cleanKw.length >= 4 && combinedText.includes(cleanKw)) {
      return true;
    }
  }

  return false;
}

const DEFAULT_LOGOS = [
  { name: "Slack", logo_url: "https://logos.hunter.io/slack.com" },
  { name: "Notion", logo_url: "https://logos.hunter.io/notion.so" },
  { name: "Zoom", logo_url: "https://logos.hunter.io/zoom.us" },
  { name: "Airtable", logo_url: "https://logos.hunter.io/airtable.com" },
  { name: "Salesforce", logo_url: "https://logos.hunter.io/salesforce.com" },
  { name: "Framer", logo_url: "https://logos.hunter.io/framer.com" },
];

const MOCK_COMPANY_LOGOS: Record<string, { name: string; logo_url: string }[]> = {
  "saas": [
    { name: "Slack", logo_url: "https://logos.hunter.io/slack.com" },
    { name: "Notion", logo_url: "https://logos.hunter.io/notion.so" },
    { name: "Zoom", logo_url: "https://logos.hunter.io/zoom.us" },
    { name: "Airtable", logo_url: "https://logos.hunter.io/airtable.com" },
    { name: "Salesforce", logo_url: "https://logos.hunter.io/salesforce.com" },
    { name: "Framer", logo_url: "https://logos.hunter.io/framer.com" },
  ],
  "artificial-intelligence": [
    { name: "OpenAI", logo_url: "https://logos.hunter.io/openai.com" },
    { name: "Anthropic", logo_url: "https://logos.hunter.io/anthropic.com" },
    { name: "Gemini", logo_url: "https://logos.hunter.io/google.com" },
    { name: "Perplexity AI", logo_url: "https://logos.hunter.io/perplexity.ai" },
    { name: "DeepSeek", logo_url: "https://logos.hunter.io/deepseek.com" },
    { name: "Hugging Face", logo_url: "https://logos.hunter.io/huggingface.co" },
  ],
  "productivity": [
    { name: "Notion", logo_url: "https://logos.hunter.io/notion.so" },
    { name: "Linear", logo_url: "https://logos.hunter.io/linear.app" },
    { name: "Asana", logo_url: "https://logos.hunter.io/asana.com" },
    { name: "Trello", logo_url: "https://logos.hunter.io/trello.com" },
    { name: "ClickUp", logo_url: "https://logos.hunter.io/clickup.com" },
    { name: "Calendly", logo_url: "https://logos.hunter.io/calendly.com" },
  ],
  "developer-tools": [
    { name: "Vercel", logo_url: "https://logos.hunter.io/vercel.com" },
    { name: "GitHub", logo_url: "https://logos.hunter.io/github.com" },
    { name: "Docker", logo_url: "https://logos.hunter.io/docker.com" },
    { name: "Kubernetes", logo_url: "https://logos.hunter.io/kubernetes.io" },
    { name: "VS Code", logo_url: "https://logos.hunter.io/visualstudio.com" },
    { name: "Postman", logo_url: "https://logos.hunter.io/postman.com" },
  ],
  "ai-coding-agents": [
    { name: "Cursor", logo_url: "https://logos.hunter.io/cursor.com" },
    { name: "Windsurf", logo_url: "https://logos.hunter.io/codeium.com" },
    { name: "Devin", logo_url: "https://logos.hunter.io/cognition-labs.com" },
    { name: "Sweep", logo_url: "https://logos.hunter.io/sweep.dev" },
    { name: "OpenHands", logo_url: "https://logos.hunter.io/all-hands.dev" },
  ]
};

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const categoryName = SLUG_TO_NAME[slug] || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const canonicalUrl = `${SITE_URL}/categories/${slug}`;

  return {
    title: `Best ${categoryName} in 2026 – Reviews, Top Tools & Leaderboard | IndiHunt`,
    description: `Discover top ${categoryName} tools on IndiHunt. Fully evaluated based on community ratings, maker activities, feature quality scores, and verified user reviews.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Best ${categoryName} in 2026 | IndiHunt`,
      description: `Discover and compare the best ${categoryName} tools and startups on IndiHunt.`,
      url: canonicalUrl,
      siteName: "IndiHunt",
      images: [{ url: `${SITE_URL}/og-image.webp`, width: 1200, height: 630, alt: `${categoryName} on IndiHunt` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Best ${categoryName} in 2026 | IndiHunt`,
      description: `Discover and compare top ${categoryName} products.`,
      images: [`${SITE_URL}/og-image.webp`],
    }
  };
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { category: slug } = await params;
  const categoryName = SLUG_TO_NAME[slug] || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Fetch all live products on the server
  const allProducts = await getProducts().catch(() => [] as Product[]);

  // Server-side filtering
  const categoryProducts = allProducts.filter(p => isProductInCategory(p, slug, categoryName));

  const logosToShow = MOCK_COMPANY_LOGOS[slug] || DEFAULT_LOGOS;

  const faqItems = [
    {
      question: `What are the best ${categoryName} tools launched on IndiHunt?`,
      answer: `The top-rated ${categoryName} tools on IndiHunt are ranked based on real community upvotes, feature quality scores, developer streaks, and authentic user reviews.`
    },
    {
      question: `How can I launch my ${categoryName} tool on IndiHunt?`,
      answer: `You can submit and launch your product for free on IndiHunt by clicking 'Submit Product'. Your launch will be featured on the daily discovery feed and indexed under ${categoryName}.`
    },
    {
      question: `Are products in ${categoryName} free or paid?`,
      answer: `The ${categoryName} directory features a mix of 100% free, freemium, open-source, and paid subscription software products with transparent pricing tags.`
    }
  ];

  // Breadcrumb JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Categories",
        "item": `${SITE_URL}/categories`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryName,
        "item": `${SITE_URL}/categories/${slug}`
      }
    ]
  };

  // ItemList JSON-LD
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Best ${categoryName} in 2026`,
    "description": `Top-ranked ${categoryName} software products and platforms on IndiHunt.`,
    "itemListElement": categoryProducts.slice(0, 20).map((p, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": p.name,
      "description": p.tagline || p.description,
      "url": `${SITE_URL}/products/${getProductSlug(p.name)}`,
      "image": p.logo_url || `${SITE_URL}/og-image.webp`
    }))
  };

  // FAQPage JSON-LD
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Semantic Crawlability Layer for Bots */}
      <div className="sr-only" aria-hidden="true">
        <h1>The best {categoryName} in 2026</h1>
        <p>Discover and select from the leading tools and platforms in {categoryName}. Products count: {categoryProducts.length}.</p>
        <section>
          <h2>Top {categoryName} Products</h2>
          <ul>
            {categoryProducts.map(p => (
              <li key={p.id}>
                <a href={`/products/${getProductSlug(p.name)}`}>{p.name}</a> — {p.tagline} ({p.upvotes_count || 0} upvotes)
              </li>
            ))}
          </ul>
        </section>
      </div>

      <CategoryPageClient
        slug={slug}
        categoryName={categoryName}
        initialProducts={categoryProducts}
        allCategories={ALL_CATEGORIES_PANEL}
        logosToShow={logosToShow}
        faqItems={faqItems}
      />
    </>
  );
}
