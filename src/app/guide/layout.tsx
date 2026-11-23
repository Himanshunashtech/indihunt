import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maker's Guide — How to Launch on IndiHunt",
  description: "The complete guide for indie makers and startup founders on how to successfully launch a product on IndiHunt, grow your audience, and get your first users.",
  keywords: ["how to launch product", "maker guide", "startup launch guide", "indie maker tips", "product launch strategy", "IndiHunt guide"],
  alternates: { canonical: "https://indihunt.in/guide" },
  openGraph: {
    title: "Maker's Guide — IndiHunt",
    description: "The complete guide for indie makers on how to successfully launch a product on IndiHunt.",
    url: "https://indihunt.in/guide",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Maker Guide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maker's Guide — IndiHunt",
    description: "How to successfully launch a product on IndiHunt and get your first users.",
    images: ["/og-image.webp"],
  },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
