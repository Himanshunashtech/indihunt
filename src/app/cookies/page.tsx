import React from "react";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Cookie Policy | IndiHunt",
  description: "Learn how IndiHunt uses cookies, tracking technologies, analytics, and Global Privacy Control (GPC) signals to deliver a secure experience.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-42 sm:pt-44 pb-16">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-2">
              Cookie Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Effective Date: August 23, 2026
            </p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground/90 space-y-6 leading-relaxed">
            <p className="text-base text-foreground font-medium">
              This Cookie Policy explains how IndiHunt Launchpad Private Limited ("IndiHunt", "we", "us", or "our") uses cookies, tracking pixels, local storage, and similar technologies to recognize you when you visit our website at <a href="https://indihunt.in" className="text-orange-500 hover:underline">indihunt.in</a> ("Website").
            </p>

            <hr className="border-border/60" />

            <h2 className="text-xl font-semibold text-foreground pt-4">1. WHAT ARE COOKIES & LOCAL STORAGE?</h2>
            <p>
              Cookies are small data files placed on your computer or mobile device when you visit websites. They are widely used to make websites work efficiently, remember user preferences, authenticate sessions, and provide aggregate analytical insights.
            </p>
            <p>
              In addition to cookies, we use HTML5 `localStorage` to preserve offline state fallbacks, dark mode preferences, draft submissions, and campaign metrics without tracking your personal browsing across unrelated websites.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">2. CATEGORIES OF COOKIES WE USE</h2>
            
            <div className="space-y-4 my-4">
              <div className="p-4 bg-card border border-border rounded-2xl">
                <h3 className="text-base font-semibold text-foreground">1. Essential & Strictly Necessary Cookies</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Required for core site operation, authentication tokens, Supabase security cookies, and CSRF protection. Without these, secure login and submission features cannot function.
                </p>
              </div>

              <div className="p-4 bg-card border border-border rounded-2xl">
                <h3 className="text-base font-semibold text-foreground">2. Functionality & Preference Cookies</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Remember your selected theme (dark/light mode), category filter states, Made in India toggles, and UI preferences across visits.
                </p>
              </div>

              <div className="p-4 bg-card border border-border rounded-2xl">
                <h3 className="text-base font-semibold text-foreground">3. Analytics & Traffic Performance (DataFast Analytics)</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  We use DataFast analytics (`https://datafa.st/js/script.js`) to gather aggregated, privacy-preserving usage metrics such as visitor numbers, page views, and referring sources. DataFast analytics run with `defer` and `afterInteractive` strategies.
                </p>
              </div>

              <div className="p-4 bg-card border border-border rounded-2xl">
                <h3 className="text-base font-semibold text-foreground">4. Advertising & Impression Measurement Cookies</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Used by our self-serve ad platform to tally ad campaign impressions, record valid user clicks, and enforce daily budget limits accurately without selling your data to third-party ad brokers.
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-foreground pt-4">3. GLOBAL PRIVACY CONTROL (GPC) & DO NOT TRACK</h2>
            <p>
              IndiHunt respects <strong>Global Privacy Control (GPC)</strong> signals sent by modern web browsers or privacy extensions. When your browser transmits a GPC signal (`Sec-GPC: 1`), our system automatically opts you out of non-essential third-party analytics and ad impression tracking script loads.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">4. HOW CAN YOU CONTROL OR DISABLE COOKIES?</h2>
            <p>
              You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still navigate IndiHunt, but certain interactive features (like staying logged in or posting comments) may be limited.
            </p>
            <p>
              Visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-semibold">www.allaboutcookies.org</a> for instructions on managing cookies across major web browsers.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">5. CONTACT US</h2>
            <p>
              If you have any questions regarding our use of cookies or tracking technologies, email us at <a href="mailto:privacy@indihunt.in" className="text-orange-500 font-semibold hover:underline">privacy@indihunt.in</a> or <a href="mailto:hello@indihunt.in" className="text-orange-500 font-semibold hover:underline">hello@indihunt.in</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

