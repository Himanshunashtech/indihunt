import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — Product Updates",
  description: "Stay up to date with the latest improvements, new features, and bug fixes on IndiHunt. See what we've shipped recently.",
  keywords: ["IndiHunt changelog", "product updates", "new features", "what's new IndiHunt", "release notes"],
  alternates: { canonical: "https://indihunt.in/changelog" },
  openGraph: {
    title: "Changelog — IndiHunt Updates",
    description: "Stay up to date with the latest improvements and new features on IndiHunt.",
    url: "https://indihunt.in/changelog",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Changelog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog — IndiHunt Updates",
    description: "Latest improvements and new features shipped on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
