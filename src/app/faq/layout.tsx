import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Help Center",
  description: "Find answers to frequently asked questions about IndiHunt — how to launch a product, how upvoting works, who can join, and how to grow your startup on the platform.",
  keywords: ["IndiHunt FAQ", "how to launch product", "how to upvote", "IndiHunt help", "product launch questions", "startup platform help"],
  alternates: { canonical: "https://indihunt.in/faq" },
  openGraph: {
    title: "FAQ — IndiHunt Help Center",
    description: "Find answers to frequently asked questions about IndiHunt — launching products, upvoting, and more.",
    url: "https://indihunt.in/faq",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt FAQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — IndiHunt Help Center",
    description: "Find answers to frequently asked questions about IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
