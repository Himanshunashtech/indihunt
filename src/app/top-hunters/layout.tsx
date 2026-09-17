import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Hunters & Makers Leaderboard",
  description: "Discover the top product hunters, active makers, and most-voted builders in the IndiHunt community.",
  keywords: ["top hunters", "hunter leaderboard", "product hunters", "maker rank", "top indie builders", "IndiHunt hunters"],
  alternates: { canonical: "https://indihunt.in/top-hunters" },
  openGraph: {
    title: "Top Hunters & Makers Leaderboard — IndiHunt",
    description: "Discover the top product hunters, active makers, and most-voted builders on IndiHunt.",
    url: "https://indihunt.in/top-hunters",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Top Hunters" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Hunters & Makers Leaderboard — IndiHunt",
    description: "Discover the top product hunters, active makers, and most-voted builders on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function TopHuntersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
