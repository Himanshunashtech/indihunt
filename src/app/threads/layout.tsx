import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Threads",
  description: "Browse and participate in community threads on IndiHunt — discuss tech products, startup growth, maker life, and connect with builders worldwide.",
  keywords: ["IndiHunt threads", "startup threads", "community forum", "builder discussions", "tech product threads", "maker forum"],
  alternates: { canonical: "https://indihunt.in/threads" },
  openGraph: {
    title: "Community Threads — IndiHunt",
    description: "Browse and participate in community threads on IndiHunt — discuss tech, startups, and maker life.",
    url: "https://indihunt.in/threads",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Threads" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Threads — IndiHunt",
    description: "Browse and participate in community threads on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function ThreadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
