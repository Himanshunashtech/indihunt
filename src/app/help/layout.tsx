import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Get help with using IndiHunt — account setup, product submissions, upvoting, reviews, community guidelines, and more.",
  keywords: ["IndiHunt help", "how to use IndiHunt", "support", "account help", "product submission help"],
  alternates: { canonical: "https://indihunt.in/help" },
  openGraph: {
    title: "Help Center — IndiHunt",
    description: "Get help with using IndiHunt — account setup, product submissions, and more.",
    url: "https://indihunt.in/help",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Help" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Center — IndiHunt",
    description: "Get help with using IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
