import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit & Launch Your Product",
  description: "Launch your product, AI tool, SaaS, or indie project to thousands of makers, early adopters, and investors on IndiHunt.",
  keywords: ["launch product", "submit startup", "indie launchpad", "product launch", "tech directory", "IndiHunt launch"],
  alternates: { canonical: "https://indihunt.in/new" },
  openGraph: {
    title: "Submit & Launch Your Product — IndiHunt",
    description: "Launch your product, AI tool, SaaS, or indie project to thousands of makers, early adopters, and investors on IndiHunt.",
    url: "https://indihunt.in/new",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Launch on IndiHunt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit & Launch Your Product — IndiHunt",
    description: "Launch your product, AI tool, SaaS, or indie project on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function NewProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
