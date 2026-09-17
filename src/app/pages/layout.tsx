import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IndiPages – Maker Landing Pages",
  description: "Create a beautiful, bio-link portfolio and showcase your startup products, stories, and tech stack in seconds with IndiPages.",
  keywords: ["maker portfolio", "indie pages", "bio link", "developer portfolio", "startup landing page", "IndiPages"],
  alternates: { canonical: "https://indihunt.in/pages" },
  openGraph: {
    title: "IndiPages – Maker Landing Pages — IndiHunt",
    description: "Create a beautiful portfolio and showcase your startup products in seconds with IndiPages.",
    url: "https://indihunt.in/pages",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiPages" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IndiPages – Maker Landing Pages — IndiHunt",
    description: "Create a beautiful portfolio and showcase your startup products in seconds with IndiPages.",
    images: ["/og-image.webp"],
  },
};

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
