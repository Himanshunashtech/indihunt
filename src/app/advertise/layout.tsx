import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise on IndiHunt",
  description: "Reach thousands of startup founders, developers, and tech enthusiasts by advertising on IndiHunt. Get your product in front of the most engaged maker community.",
  keywords: ["advertise on IndiHunt", "startup ads", "tech product advertising", "developer audience ads", "maker community sponsorship"],
  alternates: { canonical: "https://indihunt.in/advertise" },
  openGraph: {
    title: "Advertise on IndiHunt",
    description: "Reach thousands of startup founders and developers by advertising on IndiHunt.",
    url: "https://indihunt.in/advertise",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Advertise on IndiHunt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Advertise on IndiHunt",
    description: "Reach thousands of startup founders and developers by advertising on IndiHunt.",
    images: ["/og-image.webp"],
  },
};

export default function AdvertiseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
