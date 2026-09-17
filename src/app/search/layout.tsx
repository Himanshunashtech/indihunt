import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Products, Categories & Makers",
  description: "Quickly find indie startups, AI tools, SaaS products, topics, discussions, and makers on IndiHunt.",
  keywords: ["search products", "find startups", "AI tool search", "maker search", "IndiHunt search"],
  alternates: { canonical: "https://indihunt.in/search" },
  openGraph: {
    title: "Search Products & Makers — IndiHunt",
    description: "Find indie startups, AI tools, discussions, and makers on IndiHunt.",
    url: "https://indihunt.in/search",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Search IndiHunt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Search Products & Makers — IndiHunt",
    description: "Find indie startups, AI tools, discussions, and makers on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
