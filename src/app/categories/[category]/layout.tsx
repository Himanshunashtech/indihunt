import type { Metadata } from "next";
import Script from "next/script";

const baseUrl = "https://indihunt.in";

const SLUG_TO_NAME: Record<string, string> = {
  "saas": "SaaS",
  "artificial-intelligence": "Artificial Intelligence",
  "ai-agents-automation": "AI Agents & Automation",
  "productivity": "Productivity",
  "marketing-tools": "Marketing Tools",
  "finance-fintech": "Finance & FinTech",
  "developer-tools": "Developer Tools",
  "apis-integrations": "APIs & Integrations",
  "open-source": "Open Source",
  "design-tools": "Design Tools",
  "mobile-apps": "Mobile Apps",
  "web3-crypto": "Web3 & Crypto",
  "e-commerce-retail": "E-Commerce & Retail",
  "health-fitness": "Health & Fitness",
  "education-edtech": "Education & EdTech",
  "analytics-data": "Analytics & Data",
  "cybersecurity": "Cybersecurity",
  "social-community": "Social & Community",
  "media-entertainment": "Media & Entertainment",
  "no-code-low-code": "No-Code & Low-Code",
  "customer-support-crm": "Customer Support & CRM",
  "ar-vr": "AR/VR",
  "ad-blockers": "Ad blockers",
  "ai-notetakers": "AI notetakers",
  "presentation-software": "AI Presentation Software",
  "workflow-automation": "AI Workflow Automation",
  "app-switcher": "App Switcher",
  "cms": "CMS",
  "calendar-apps": "Calendar Apps",
  "compliance-software": "Compliance Software",
  "e-signature-apps": "E-Signature Apps",
  "email-clients": "Email Clients",
  "file-storage": "File Storage",
  "hiring-software": "Hiring Software",
  "knowledge-base": "Knowledge Base",
  "meeting-software": "Meeting Software",
  "note-writing-apps": "Note & Writing Apps",
  "pdf-editor": "PDF Editor",
  "password-managers": "Password Managers",
  "project-management": "Project Management",
  "scheduling-software": "Scheduling Software",
  "team-collaboration": "Team Collaboration",
  "time-tracking": "Time Tracking",
  "ai-code-editors": "AI Code Editors",
  "ai-code-testing": "AI Code Testing",
  "ai-coding-agents": "AI Coding Agents",
  "ai-databases": "AI Databases",
  "vibe-coding": "Vibe Coding",
  "ai-infrastructure": "AI Infrastructure",
  "accounting": "Accounting",
  "budgeting": "Budgeting",
  "invoicing": "Invoicing",
  "legal-services": "Legal Services",
  "ai-sales-tools": "AI Sales Tools",
  "crm-software": "CRM Software",
  "3d-animation": "3D & Animation",
  "ai-generative-media": "AI Generative Media",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryName =
    SLUG_TO_NAME[category] ||
    category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const canonicalUrl = `${baseUrl}/categories/${category}`;
  const title = `Best ${categoryName} Products (2026) — IndiHunt`;
  const description = `Discover and explore top ${categoryName} software, tools, and startups on IndiHunt. Rated and reviewed by developers and indie builders.`;

  return {
    title,
    description,
    keywords: [
      categoryName,
      `${categoryName} tools`,
      `${categoryName} software`,
      `${categoryName} startups`,
      "IndiHunt categories",
      "indie hackers",
      "tech products",
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "IndiHunt",
      type: "website",
      images: [
        {
          url: `${baseUrl}/og-image.webp`,
          width: 1200,
          height: 630,
          alt: `${categoryName} on IndiHunt`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og-image.webp`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function CategoryDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categoryName =
    SLUG_TO_NAME[category] ||
    category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const canonicalUrl = `${baseUrl}/categories/${category}`;

  // Breadcrumb schema
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Categories", "item": `${baseUrl}/categories` },
      { "@type": "ListItem", "position": 3, "name": categoryName, "item": canonicalUrl },
    ],
  };

  // CollectionPage schema
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Best ${categoryName} Products (2026)`,
    "description": `Discover and explore top ${categoryName} software, tools, and startups on IndiHunt.`,
    "url": canonicalUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "IndiHunt",
      "url": baseUrl,
    },
  };

  return (
    <>
      <Script
        id={`jsonld-cat-bc-${category}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id={`jsonld-cat-col-${category}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
      />
      {children}
    </>
  );
}
