import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Products of All Time",
  description: "The highest-rated and most upvoted tech products ever launched on IndiHunt. Discover the best SaaS tools, AI products, developer tools, and startup gems.",
  keywords: ["best tech products", "top startups", "most upvoted products", "best saas", "best ai tools", "top launches", "IndiHunt best products"],
  alternates: { canonical: "https://indihunt.in/best-products" },
  openGraph: {
    title: "Best Products of All Time — IndiHunt",
    description: "The highest-rated and most upvoted tech products ever launched on IndiHunt.",
    url: "https://indihunt.in/best-products",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Best Products" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Products of All Time — IndiHunt",
    description: "The highest-rated and most upvoted tech products ever launched on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function BestProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
