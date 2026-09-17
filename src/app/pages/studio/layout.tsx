import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IndiPages Studio",
  description: "Customize your personalized maker page, configure custom themes, fonts, banners, and showcase your best products with IndiPages Studio.",
  keywords: ["maker page editor", "indipages studio", "portfolio builder", "theme customizer", "IndiHunt studio"],
  alternates: { canonical: "https://indihunt.in/pages/studio" },
  openGraph: {
    title: "IndiPages Studio — IndiHunt",
    description: "Customize your personalized maker page with IndiPages Studio.",
    url: "https://indihunt.in/pages/studio",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiPages Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IndiPages Studio — IndiHunt",
    description: "Customize your personalized maker page with IndiPages Studio.",
    images: ["/og-image.webp"],
  },
};

export default function PagesStudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
