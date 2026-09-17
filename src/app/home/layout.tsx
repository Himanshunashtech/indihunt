import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IndiHunt Manifesto — Why We Built IndiHunt",
  description: "Read the founding story and community manifesto of IndiHunt — an authentic launchpad and ecosystem for indie makers and tech creators.",
  alternates: { canonical: "https://indihunt.in/home" },
  openGraph: {
    title: "IndiHunt Manifesto — Why We Built IndiHunt",
    description: "Read the founding story and community manifesto of IndiHunt — an authentic launchpad and ecosystem for indie makers.",
    url: "https://indihunt.in/home",
    siteName: "IndiHunt",
    type: "article",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Manifesto" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IndiHunt Manifesto — Why We Built IndiHunt",
    description: "Read the founding story and community manifesto of IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function HomeManifestoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
