import { Product } from "@/lib/supabase";

export const SLUG_TO_NAME: Record<string, string> = {
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

export interface CategoryMeta {
  name: string;
  slug: string;
  aliases: string[];
  keywords: string[];
}

export const CATEGORY_REGISTRY: Record<string, CategoryMeta> = {
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
    keywords: ["productivity", "productive", "workspace", "focus", "planner", "organize", "todo", "task manager", "task"]
  },
  "saas": {
    name: "SaaS",
    slug: "saas",
    aliases: ["saas", "software-as-a-service", "cloud-software", "b2b-saas", "micro-saas", "web-app", "platform", "b2b"],
    keywords: ["saas", "software as a service", "b2b saas", "cloud platform", "subscription software", "multi-tenant", "platform", "b2b", "software"]
  },
  "developer-tools": {
    name: "Developer Tools",
    slug: "developer-tools",
    aliases: ["developer-tools", "devtools", "coding", "git-github", "command-line", "testing-qa", "deployment", "hosting", "sdk", "api"],
    keywords: ["developer tools", "devtools", "code", "compiler", "cli", "debugging", "programming", "software dev", "git", "api", "sdk"]
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
    aliases: ["finance-fintech", "finance", "fintech", "payments", "banking", "monetary", "crypto"],
    keywords: ["finance", "fintech", "payment", "banking", "money", "stripe", "razorpay", "paypal", "billing"]
  },
  "design-tools": {
    name: "Design Tools",
    slug: "design-tools",
    aliases: ["design-tools", "design", "ui-ux", "graphic-design", "figma-plugins", "icons-illustration"],
    keywords: ["design tools", "design", "ui", "ux", "figma", "graphic design", "vector", "canvas", "mockup"]
  },
  "open-source": {
    name: "Open Source",
    slug: "open-source",
    aliases: ["open-source", "opensource", "foss", "oss", "github"],
    keywords: ["open source", "foss", "oss", "github", "source code", "public repo", "mit license", "apache"]
  },
  "mobile-apps": {
    name: "Mobile Apps",
    slug: "mobile-apps",
    aliases: ["mobile-apps", "mobile", "ios", "android", "react-native", "flutter", "apps"],
    keywords: ["mobile", "ios", "android", "app store", "play store", "smartphone", "iphone"]
  },
  "web3-crypto": {
    name: "Web3 & Crypto",
    slug: "web3-crypto",
    aliases: ["web3-crypto", "web3", "crypto", "blockchain", "ethereum", "solana", "bitcoin", "defi", "nft"],
    keywords: ["web3", "crypto", "blockchain", "token", "ethereum", "solana", "smart contracts", "wallet"]
  },
  "social-community": {
    name: "Social & Community",
    slug: "social-community",
    aliases: ["social-community", "social", "community", "forum", "chat", "discord", "slack-community"],
    keywords: ["social", "community", "forum", "chat", "discussions", "networking", "members", "creator"]
  },
  "health-fitness": {
    name: "Health & Fitness",
    slug: "health-fitness",
    aliases: ["health-fitness", "health", "fitness", "wellness", "medical", "workout", "gym"],
    keywords: ["health", "fitness", "workout", "wellness", "nutrition", "diet", "mental health", "meditation"]
  },
  "education-edtech": {
    name: "Education & EdTech",
    slug: "education-edtech",
    aliases: ["education-edtech", "education", "edtech", "learning", "study", "courses", "tutor"],
    keywords: ["education", "edtech", "learning", "course", "study", "students", "teachers", "tutorials", "academy"]
  },
  "e-commerce-retail": {
    name: "E-Commerce & Retail",
    slug: "e-commerce-retail",
    aliases: ["e-commerce-retail", "ecommerce", "e-commerce", "retail", "shop", "store", "shopify"],
    keywords: ["ecommerce", "store", "shop", "cart", "checkout", "retail", "shopify", "woocommerce"]
  },
  "cybersecurity": {
    name: "Cybersecurity",
    slug: "cybersecurity",
    aliases: ["cybersecurity", "security", "auth", "authentication", "privacy", "firewall", "infosec"],
    keywords: ["security", "cybersecurity", "auth", "encryption", "privacy", "infosec", "penetration", "zero trust"]
  },
  "no-code-low-code": {
    name: "No-Code & Low-Code",
    slug: "no-code-low-code",
    aliases: ["no-code-low-code", "no-code", "low-code", "nocode", "lowcode", "visual-builder"],
    keywords: ["no code", "low code", "nocode", "lowcode", "drag and drop", "visual builder", "webflow", "bubble"]
  },
  "accounting": {
    name: "Accounting software",
    slug: "accounting",
    aliases: ["accounting", "bookkeeping", "tax", "ledger", "quickbooks"],
    keywords: ["accounting", "bookkeeping", "ledger", "tax", "cpa", "financial statements"]
  },
  "invoicing": {
    name: "Invoicing tools",
    slug: "invoicing",
    aliases: ["invoicing", "invoice", "billing", "receipts"],
    keywords: ["invoice", "invoicing", "billing", "receipt", "estimates", "get paid"]
  },
  "calendar-apps": {
    name: "Calendar apps",
    slug: "calendar-apps",
    aliases: ["calendar-apps", "calendar", "calendars", "google-calendar"],
    keywords: ["calendar", "agenda", "events", "time slots", "schedule"]
  },
  "scheduling-software": {
    name: "Scheduling software",
    slug: "scheduling-software",
    aliases: ["scheduling-software", "scheduling", "booking", "calendly-alternative"],
    keywords: ["scheduling", "booking", "appointment", "cal", "schedule meetings"]
  },
  "customer-support-crm": {
    name: "Customer support tools",
    slug: "customer-support-crm",
    aliases: ["customer-support-crm", "customer-support", "helpdesk", "ticketing", "zendesk-alternative"],
    keywords: ["customer support", "helpdesk", "ticketing", "live chat", "support desk", "tickets"]
  },
  "crm-software": {
    name: "CRM software",
    slug: "crm-software",
    aliases: ["crm-software", "crm", "sales-crm", "lead-management"],
    keywords: ["crm", "customer relationship", "leads", "sales pipeline", "contacts manager"]
  },
  "project-management": {
    name: "Project management software",
    slug: "project-management",
    aliases: ["project-management", "pm-tools", "kanban", "scrum", "sprints", "jira-alternative"],
    keywords: ["project management", "kanban", "scrum", "sprint", "roadmap", "task tracking", "milestones"]
  },
  "team-collaboration": {
    name: "Team collaboration software",
    slug: "team-collaboration",
    aliases: ["team-collaboration", "collaboration", "teamwork", "remote-work"],
    keywords: ["collaboration", "teamwork", "remote team", "sync", "team workspace", "co-working"]
  },
  "time-tracking": {
    name: "Time tracking apps",
    slug: "time-tracking",
    aliases: ["time-tracking", "timesheet", "time-tracker", "hourly-billing"],
    keywords: ["time tracking", "timesheet", "timer", "billable hours", "clock in", "productivity tracking"]
  },
  "note-writing-apps": {
    name: "Note and writing apps",
    slug: "note-writing-apps",
    aliases: ["note-writing-apps", "notes", "writing", "markdown", "journal", "docs"],
    keywords: ["notes", "note taking", "writing", "markdown", "documents", "journaling", "text editor"]
  },
  "pdf-editor": {
    name: "PDF Editor",
    slug: "pdf-editor",
    aliases: ["pdf-editor", "pdf", "pdf-tools", "document-editor"],
    keywords: ["pdf", "pdf editor", "sign pdf", "merge pdf", "convert pdf", "document editing"]
  },
  "email-clients": {
    name: "Email clients",
    slug: "email-clients",
    aliases: ["email-clients", "email", "inbox", "mail-app", "superhuman-alternative"],
    keywords: ["email", "inbox", "mail client", "newsletters", "email management", "smtp"]
  },
  "file-storage": {
    name: "File storage and sharing apps",
    slug: "file-storage",
    aliases: ["file-storage", "cloud-storage", "drive", "file-sharing", "dropbox-alternative"],
    keywords: ["file storage", "cloud storage", "upload files", "sharing", "drive", "backup"]
  },
  "knowledge-base": {
    name: "Knowledge base software",
    slug: "knowledge-base",
    aliases: ["knowledge-base", "wiki", "docs", "documentation", "help-center"],
    keywords: ["knowledge base", "wiki", "help center", "documentation", "internal docs", "sop"]
  },
  "cms": {
    name: "Content Management Systems",
    slug: "cms",
    aliases: ["cms", "content-management", "blogging", "headless-cms", "wordpress-alternative"],
    keywords: ["cms", "content management", "blog", "headless cms", "publishing", "articles"]
  }
};

export function normalizeSlug(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cleanText(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

export function isProductInCategory(product: Product, targetSlug: string, targetCategoryName?: string): boolean {
  if (!product || product.status === "draft" || product.is_deleted) return false;

  const normTargetSlug = normalizeSlug(targetSlug);
  const def = CATEGORY_REGISTRY[normTargetSlug];
  const targetName = targetCategoryName || SLUG_TO_NAME[normTargetSlug] || normTargetSlug.replace(/-/g, " ");

  const aliasSet = new Set<string>([
    normTargetSlug,
    normalizeSlug(targetName),
    ...(def?.aliases || []).map(normalizeSlug),
  ]);

  // Check product.category field
  if (product.category) {
    const normCat = normalizeSlug(product.category);
    if (aliasSet.has(normCat)) return true;
    for (const alias of aliasSet) {
      if (alias.length >= 3 && (normCat.includes(alias) || alias.includes(normCat))) {
        return true;
      }
    }
  }

  // Parse product tags safely from array, string, or JSON
  let tags: string[] = [];
  if (Array.isArray(product.tags)) {
    tags = product.tags.filter(Boolean);
  } else if (typeof product.tags === "string") {
    try {
      const parsed = JSON.parse(product.tags);
      if (Array.isArray(parsed)) tags = parsed.filter(Boolean);
      else tags = (product.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean);
    } catch {
      tags = (product.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean);
    }
  }

  // Tag matching
  for (const rawTag of tags) {
    const normTag = normalizeSlug(rawTag);
    if (aliasSet.has(normTag)) return true;
    for (const alias of aliasSet) {
      if (alias.length >= 3 && (normTag.includes(alias) || alias.includes(normTag))) {
        return true;
      }
    }
  }

  // If slug is "saas" and product has any tag or is a software webapp, broad match
  if (normTargetSlug === "saas") {
    const hasAnyTag = tags.length > 0;
    const textLower = `${product.name} ${product.tagline || ""} ${product.description || ""}`.toLowerCase();
    if (hasAnyTag || textLower.includes("app") || textLower.includes("tool") || textLower.includes("platform") || textLower.includes("software") || textLower.includes("ai")) {
      return true;
    }
  }

  // Deep Keyword Text matching
  const combinedText = ` ${cleanText(product.name)} ${cleanText(product.tagline || "")} ${cleanText(product.description || "")} ${tags.map(t => cleanText(t)).join(" ")} `;
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
