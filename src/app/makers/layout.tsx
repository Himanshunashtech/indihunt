import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IndiHunt Makers",
  description: "Meet the indie makers, developers, and startup founders building on IndiHunt. Discover who's shipping great products and connect with the global builder community.",
  keywords: ["indie makers", "startup founders", "developer directory", "builders", "indie hackers", "maker profiles", "IndiHunt makers"],
  alternates: { canonical: "https://indihunt.in/makers" },
  openGraph: {
    title: "IndiHunt Makers",
    description: "Meet the indie makers, developers, and startup founders building on IndiHunt.",
    url: "https://indihunt.in/makers",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Makers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IndiHunt Makers",
    description: "Meet the indie makers and startup founders building on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function MakersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
