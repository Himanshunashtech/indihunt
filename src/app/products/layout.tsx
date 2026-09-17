import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore All Products & Tools",
  description: "Browse the complete directory of tech products, SaaS platforms, AI tools, developer utilities, and mobile apps launched on IndiHunt.",
  keywords: ["all products", "tech directory", "SaaS tools", "AI tools", "indie apps", "IndiHunt products"],
  alternates: { canonical: "https://indihunt.in/products" },
  openGraph: {
    title: "Explore All Products & Tools — IndiHunt",
    description: "Browse the complete directory of tech products and SaaS tools launched on IndiHunt.",
    url: "https://indihunt.in/products",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Products" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore All Products & Tools — IndiHunt",
    description: "Browse the complete directory of tech products and SaaS tools launched on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
