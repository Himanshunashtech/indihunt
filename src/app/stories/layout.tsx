import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maker Stories",
  description: "Read inspiring maker stories on IndiHunt — how indie developers and startup founders built, launched, and grew their products from zero to traction.",
  keywords: ["maker stories", "startup stories", "founder journey", "indie hacker stories", "product launch stories", "build in public", "IndiHunt stories"],
  alternates: { canonical: "https://indihunt.in/stories" },
  openGraph: {
    title: "Maker Stories — IndiHunt",
    description: "Read inspiring maker stories — how indie developers built and launched their products.",
    url: "https://indihunt.in/stories",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Maker Stories" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maker Stories — IndiHunt",
    description: "Read inspiring maker stories from indie developers and startup founders on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
