import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Providers from "./providers";
import AuthModal from "@/components/AuthModal";
import TopProgressBar from "@/components/TopProgressBar";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsentBanner from "@/components/CookieConsentBanner";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://indihunt.in"),
  referrer: 'no-referrer-when-downgrade',
  title: {
    default: "IndiHunt — Discover & Launch the Best New Products",
    template: "%s | IndiHunt"
  },
  description: "Discover new AI tools, SaaS, developer tools and indie products. Launch your product on IndiHunt, reach early adopters, collect feedback and grow your community.",
  keywords: [
    "IndiHunt",
    "indihunt",
    "IndiHunt.in",
    "indi hunt",
    "indie hunt",
    "product launch platform",
    "discover tech products",
    "startup launchpad",
    "product hunt alternative",
    "indie maker platform",
    "launch startup",
    "upvote products",
    "tech product discovery",
    "AI tools directory",
    "open source projects",
    "SaaS products",
    "developer tools"
  ],
  authors: [{ name: "IndiHunt", url: "https://indihunt.in" }],
  creator: "IndiHunt",
  publisher: "IndiHunt",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: "IGhJCYVj4CCtE25ExpcS3foffUgAxSrLbYma1NLOp4o",
    // Add your Bing Webmaster verification code here once you have it:
    // other: { "msvalidate.01": "YOUR_BING_CODE" },
  },
  alternates: {
    canonical: "https://indihunt.in",
  },
  openGraph: {
    title: "IndiHunt — Discover & Launch the Best Tech Products",
    description: "Explore today's top product launches on IndiHunt. Discover, upvote, and support indie makers building the next big thing.",
    url: "https://indihunt.in",
    siteName: "IndiHunt",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://indihunt.in/og-image.webp",
        width: 1200,
        height: 630,
        alt: "IndiHunt — Discover, launch and upvote the best tech products",
        type: "image/webp"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "IndiHunt — Discover & Launch the Best Tech Products",
    description: "Explore today's top product launches on IndiHunt. Discover, upvote, and support indie makers building the next big thing.",
    images: [
      "https://indihunt.in/og-image.webp"
    ],
    creator: "@SonuHs9557",
    site: "@IndiHuntIn"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: [
      { url: "/favicon.webp", type: "image/webp" },
      { url: "/icons/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { url: "/icons/icon-512.webp", sizes: "512x512", type: "image/webp" }
    ],
    apple: [
      { url: "/apple-touch-icon.webp", sizes: "180x180", type: "image/webp" }
    ],
    shortcut: "/favicon.webp",
  },
  category: "technology",
  other: {
    "classification": "Tech Product Discovery and Startup Launchpad — IndiHunt",
    "coverage": "Worldwide",
    "distribution": "Global",
    "rating": "General"
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Optimize TTFB: Defer auth check to client-side so we do not block SSR on a Supabase API network request
  const user = null;

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PPBNL7KH');`,
          }}
        />
        {/* End Google Tag Manager */}

        {/* PWA Manifest & App Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.webp" type="image/webp" sizes="180x180" />
        <meta name="theme-color" content="#ff5722" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="IndiHunt" />
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="dfid_cfvbmWLBry28V107JfzQ8"
          data-domain="indihunt.in"
          strategy="afterInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{localStorage.removeItem('indihunt_user_session');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PPBNL7KH"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* WebSite Schema (SEO & GEO) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "IndiHunt",
              "url": "https://indihunt.in",
              "description": "Explore today's top product launches on IndiHunt. Discover, upvote, and support indie makers building the next big thing.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://indihunt.in/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* Organization Schema — Brand Entity */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "IndiHunt",
              "alternateName": ["IndiHunt.in", "Indi Hunt", "IndiHunt Launchpad"],
              "url": "https://indihunt.in",
              "logo": {
                "@type": "ImageObject",
                "url": "https://indihunt.in/favicon.webp",
                "width": 512,
                "height": 512
              },
              "image": "https://indihunt.in/og-image.webp",
              "description": "Explore today's top product launches. Discover, upvote, and support indie makers building the next big thing",
              "foundingDate": "2026",
              "foundingLocation": {
                "@type": "Place",
                "name": "Bengaluru, Karnataka, India"
              },
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bengaluru",
                "addressRegion": "Karnataka",
                "addressCountry": "IN"
              },
              "founder": [
                {
                  "@type": "Person",
                  "name": "Aditya",
                  "jobTitle": "CEO & Co-Founder"
                },
                {
                  "@type": "Person",
                  "name": "Himanshu Sharma",
                  "jobTitle": "Co-Founder",
                  "sameAs": [
                    "https://x.com/SonuHs9557",
                    "https://www.linkedin.com/in/himanshu-sharma-799030247"
                  ]
                }
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "url": "https://indihunt.in/help"
              },
              "sameAs": [
                "https://x.com/SonuHs9557",
                "https://www.linkedin.com/company/indihunt/",
                "https://peerlist.io/indihunt"
              ]
            })
          }}
        />
        <Providers initialUser={user}>
          <TopProgressBar />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
          <AuthModal />
          <ScrollToTop />
          <CookieConsentBanner />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}