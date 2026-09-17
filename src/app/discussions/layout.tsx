import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Discussions",
  description: "Join the IndiHunt community forum — discuss startups, tech products, maker journeys, SaaS growth tips, and connect with builders worldwide.",
  keywords: ["startup forum", "tech discussions", "maker community", "saas forum", "product builders", "indie hackers forum", "IndiHunt discussions"],
  alternates: { canonical: "https://indihunt.in/discussions" },
  openGraph: {
    title: "Community Discussions — IndiHunt",
    description: "Join the IndiHunt community forum — discuss startups, tech, and connect with builders worldwide.",
    url: "https://indihunt.in/discussions",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Discussions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Discussions — IndiHunt",
    description: "Join the IndiHunt community forum — discuss startups, tech, and connect with global builders.",
    images: ["/og-image.webp"],
  },
};

export default function DiscussionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
