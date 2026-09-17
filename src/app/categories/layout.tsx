import type { Metadata } from "next";
import Script from "next/script";

const baseUrl = "https://indihunt.in";

export const metadata: Metadata = {
  title: "Browse Categories",
  description: "Explore top tech products and startups on IndiHunt by category — AI, SaaS, Developer Tools, Open Source, Design, Finance, and more.",
  keywords: ["categories", "saas", "ai tools", "developer tools", "open source", "design tools", "fintech", "mobile apps", "productivity", "marketing tools", "IndiHunt categories"],
  alternates: { canonical: "https://indihunt.in/categories" },
  openGraph: {
    title: "Browse Categories — IndiHunt",
    description: "Explore top tech products and startups by category — AI, SaaS, Developer Tools, Open Source, and more.",
    url: "https://indihunt.in/categories",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Categories" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Categories — IndiHunt",
    description: "Explore top tech products and startups by category on IndiHunt.",
    images: ["/og-image.webp"],
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

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Categories", "item": `${baseUrl}/categories` },
    ],
  };

  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Browse All Categories — IndiHunt",
    "description": "Explore top tech products and startups by category on IndiHunt.",
    "url": `${baseUrl}/categories`,
    "isPartOf": {
      "@type": "WebSite",
      "name": "IndiHunt",
      "url": baseUrl,
    },
  };

  return (
    <>
      <Script
        id="jsonld-categories-bc"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id="jsonld-categories-col"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
      />
      {children}
    </>
  );
}
