import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Tech & Startup News",
  description: "Stay ahead with daily curated news, funding announcements, AI breakthroughs, and startup stories from the Indian and global tech ecosystem.",
  keywords: ["tech news", "startup news", "AI news", "indie hacker news", "funding updates", "IndiHunt news"],
  alternates: { canonical: "https://indihunt.in/news" },
  openGraph: {
    title: "Daily Tech & Startup News — IndiHunt",
    description: "Stay ahead with daily curated tech and startup news from IndiHunt.",
    url: "https://indihunt.in/news",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Tech News" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Tech & Startup News — IndiHunt",
    description: "Stay ahead with daily curated tech and startup news from IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
