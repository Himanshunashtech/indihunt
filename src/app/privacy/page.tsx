import React from "react";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Privacy Policy | IndiHunt",
  description: "Read our comprehensive Privacy Policy to understand how IndiHunt collects, uses, protects, and handles your personal information under DPDP, GDPR, and CCPA.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-42 sm:pt-44 pb-16">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Effective Date: August 23, 2026
            </p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground/90 space-y-6 leading-relaxed">
            <p className="text-base text-foreground font-medium">
              We recognize that your privacy is very important and take it seriously. This Privacy & Cookies Policy describes IndiHunt's ("we", "us", or "our") policies and procedures on the collection, use, and disclosure of your information when you use our website at <a href="https://indihunt.in" className="text-orange-500 hover:underline">indihunt.in</a>, products, self-serve ad tools, and mobile applications (collectively, the "Services").
            </p>
            <p>
              This Privacy Policy is designed to meet statutory data protection transparency mandates under the <strong>Digital Personal Data Protection Act (DPDP Act, India)</strong>, the <strong>General Data Protection Regulation (GDPR, EU/UK)</strong>, and the <strong>California Consumer Privacy Act as amended by CPRA (CCPA/CPRA)</strong>.
            </p>

            <hr className="border-border/60" />

            <h2 className="text-xl font-semibold text-foreground pt-4">1. WHO WE ARE AND HOW TO CONTACT US</h2>
            <p>
              <strong>Data Fiduciary / Data Controller:</strong> IndiHunt Launchpad Private Limited is the Data Fiduciary (under Indian DPDP Act) and Data Controller (under GDPR) of your personal data.
            </p>
            <div className="p-4 bg-card border border-border rounded-2xl space-y-1 text-xs">
              <p><strong>IndiHunt Privacy & Operations Team</strong></p>
              <p>Email: <a href="mailto:privacy@indihunt.in" className="text-orange-500 font-semibold hover:underline">privacy@indihunt.in</a> / <a href="mailto:hello@indihunt.in" className="text-orange-500 font-semibold hover:underline">hello@indihunt.in</a></p>
              <p>Address: Bengaluru, Karnataka 560001, India</p>
            </div>

            <h2 className="text-xl font-semibold text-foreground pt-4">2. WHAT PERSONAL DATA WE COLLECT</h2>
            <p>We collect personal data that you voluntarily provide to us when registering, launching products, posting comments, voting, or purchasing ad campaigns. We also automatically collect certain technical diagnostic details.</p>
            
            <div className="overflow-x-auto my-4">
              <table className="w-full text-xs text-left border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/70 text-foreground">
                    <th className="p-2 border border-border">Category</th>
                    <th className="p-2 border border-border">Data Elements Collected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-border font-semibold">Identity & Profile Data</td>
                    <td className="p-2 border border-border">First name, last name, username, profile photo/avatar, bio, maker links, social handles.</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-border font-semibold">Contact Data</td>
                    <td className="p-2 border border-border">Email address, work address, telephone/SMS numbers for verification.</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-border font-semibold">Social Authentication Data</td>
                    <td className="p-2 border border-border">Log-in tokens and public profile metadata from Google, GitHub, or X/Twitter logins.</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-border font-semibold">Content & Activity Data</td>
                    <td className="p-2 border border-border">Product launch details, upvotes, reviews, comments, discussion threads, stories, campaign ads.</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-border font-semibold">Technical & Behavioral Data</td>
                    <td className="p-2 border border-border">IP address, browser type, device identifier, referrer URLs, page views, time zone, DataFast analytics.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-semibold text-foreground pt-4">3. HOW AND WHY WE USE YOUR PERSONAL DATA</h2>
            <p>We process your personal data for the following legitimate operational purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Providing & Maintaining Services:</strong> To register your account, manage product launches, process votes, display maker profiles, and authenticate logins.</li>
              <li><strong>Email Digest & Notifications:</strong> To broadcast daily launch summaries, campaign status alerts, and security notifications (you can opt-out anytime via settings).</li>
              <li><strong>Security & Moderation:</strong> To run automated text content violation checks, prevent fraudulent upvoting, detect malicious bot traffic, and enforce platform rules.</li>
              <li><strong>Self-Serve Ad Campaigns:</strong> To track ad impressions, clicks, budget expenditures, and report anonymized performance stats to campaign owners.</li>
              <li><strong>Compliance with Legal Obligations:</strong> To comply with court orders, regulatory inquiries, and tax reporting laws.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground pt-4">4. YOUR LEGAL DATA RIGHTS</h2>
            <p>Depending on your region (DPDP India, GDPR EU/UK, CCPA/CPRA California), you enjoy the following rights:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Right to Access & Portability:</strong> Request a full copy of the personal data we hold about you in a structured, standard format.</li>
              <li><strong>Right to Correction & Erasure:</strong> Request correction of inaccurate information or complete deletion of your account and personal data.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing emails, newsletter digests, or optional tracking at any time.</li>
              <li><strong>California CCPA Opt-Out (Do Not Sell/Share):</strong> California residents can opt out of third-party data sharing or targeted ad tracking by emailing <a href="mailto:privacy@indihunt.in" className="text-orange-500 font-semibold hover:underline">privacy@indihunt.in</a> or enabling Global Privacy Control (GPC) in their browser.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground pt-4">5. DATA RECIPIENTS & THIRD-PARTY SHARING</h2>
            <p>We do not sell your personal details to data brokers. We share necessary data only with trusted infrastructure service providers under strict confidentiality agreements:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase (PostgreSQL):</strong> Secure database hosting and authentication backends.</li>
              <li><strong>Resend API:</strong> Transactional and daily digest email delivery.</li>
              <li><strong>DataFast & Analytics:</strong> Privacy-focused aggregate traffic measurement.</li>
              <li><strong>Legal Authorities:</strong> When required by binding subpoena, law enforcement warrant, or statutory order.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground pt-4">6. DATA RETENTION & SECURITY</h2>
            <p>
              We retain your information for as long as your account remains active or as needed to provide you with Services. If you request account deletion, we securely purge or anonymize your personal records within 30 days, except where retention is mandated by law.
            </p>
            <p>
              We employ industry-standard SSL/TLS encryption, secure database access control layers, and automated vulnerability scanning to safeguard your data.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">7. CHILDREN'S PRIVACY</h2>
            <p>
              Our Services are strictly intended for individuals 16 years of age and older. We do not knowingly collect personal information from children under 16. If we become aware of a child's registration, we delete the data immediately.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">8. POLICY UPDATES</h2>
            <p>
              We will update this Privacy Policy periodically to reflect legal changes and new platform features. Material changes will be highlighted on our site or notified via email.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

