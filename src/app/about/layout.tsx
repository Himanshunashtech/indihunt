import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About IndiHunt — Our Story",
  description: "Learn about IndiHunt — the global tech launchpad built for indie makers, developers, and startup founders to showcase their products and connect with a worldwide community.",
  keywords: ["about IndiHunt", "IndiHunt story", "product hunt alternative", "indie maker platform", "global startup launchpad", "who is IndiHunt"],
  alternates: { canonical: "https://indihunt.in/about" },
  openGraph: {
    title: "About IndiHunt — Our Story",
    description: "Learn about IndiHunt — the global tech launchpad built for indie makers and startup founders.",
    url: "https://indihunt.in/about",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "About IndiHunt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About IndiHunt — Our Story",
    description: "Learn about IndiHunt — the global tech launchpad for indie makers worldwide.",
    images: ["/og-image.webp"],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
