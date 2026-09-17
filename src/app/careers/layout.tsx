import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers & Open Positions — IndiHunt",
  description: "Join IndiHunt and help build the launchpad for the next generation of indie makers and software builders.",
  keywords: ["IndiHunt careers", "IndiHunt jobs", "Growth & Community Intern", "startup internships India", "indie hacker jobs"],
  alternates: { canonical: "https://indihunt.in/careers" },
  openGraph: {
    title: "Careers & Open Positions — IndiHunt",
    description: "Join IndiHunt and help build the launchpad for indie makers.",
    url: "https://indihunt.in/careers",
    siteName: "IndiHunt",
    type: "website",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "IndiHunt Careers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers & Open Positions — IndiHunt",
    description: "Join IndiHunt and help build the premier launchpad for indie makers.",
    images: ["/og-image.webp"],
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
