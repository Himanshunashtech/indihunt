import React from "react";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Terms of Service | IndiHunt",
  description: "Read the Terms of Service governing your use of the IndiHunt platform, product launches, self-serve ads, and community services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-42 sm:pt-44 pb-16">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-2">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              Effective Date: August 23, 2026
            </p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground/90 space-y-6 leading-relaxed">
            <p className="text-base text-foreground font-medium">
              Welcome to IndiHunt! Please read these Terms of Service ("Terms") carefully. They constitute a binding legal contract governing your access to and use of the IndiHunt website, products, self-serve advertising tools, API, and related applications (collectively, the "Services").
            </p>
            <p className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-foreground font-medium text-xs">
              PLEASE NOTE THAT YOUR USE OF AND ACCESS TO OUR SERVICES ARE SUBJECT TO THE FOLLOWING TERMS; IF YOU DO NOT AGREE TO ALL OF THE FOLLOWING, YOU MAY NOT USE OR ACCESS THE SERVICES IN ANY MANNER.
            </p>

            <hr className="border-border/60" />

            <h2 className="text-xl font-semibold text-foreground pt-4">1. AGREEMENT TO TERMS & MODIFICATIONS</h2>
            <p>
              These Terms are between you and <strong>INDIHUNT LAUNCHPAD PRIVATE LIMITED</strong> ("IndiHunt", "we", "us", or "our"). By accessing or using the Services in any way, you agree to all of these Terms, which remain in effect while you use the Services. These Terms incorporate our <a href="/privacy" className="text-orange-500 hover:underline font-semibold">Privacy Policy</a> and <a href="/cookies" className="text-orange-500 hover:underline font-semibold">Cookie Policy</a>.
            </p>
            <p>
              We reserve the right to change or modify these Terms at any time. When we make material changes, we will notify you by placing a notice on the platform, sending an email, or updating the effective date above. Continued use of the Services after effective changes constitutes acceptance of the modified Terms.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">2. ELIGIBILITY AND ACCOUNT CREATION</h2>
            <p>
              You represent and warrant that you are at least 16 years of age (or the minimum legal age of digital consent in your jurisdiction). The Children's Online Privacy Protection Act ("COPPA") requires that online service providers obtain parental consent before collecting personally identifiable information online from children under 16. We do not knowingly collect personal data from children under 16. If we learn we have collected data from a child under 16, we will delete it promptly.
            </p>
            <p>
              When creating an account, you agree to provide accurate, complete, and updated registration information. You may not select a username that impersonates another person or entity or use a name you do not have the right to use. You are solely responsible for maintaining the confidentiality of your account credentials and for all activity associated with your account.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">3. USER CONDUCT AND PLATFORM RESTRICTIONS</h2>
            <p>You represent, warrant, and agree that you will not submit any User Submission or use the Services in a manner that:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Infringes or violates the intellectual property, privacy, or proprietary rights of anyone else (including IndiHunt).</li>
              <li>Violates any applicable local, national, or international law or regulation (including IT Act of India and export control laws).</li>
              <li>Is harmful, fraudulent, deceptive, threatening, defamatory, obscene, objectionable, or constitutes vote manipulation, fake upvoting, or spam.</li>
              <li>Jeopardizes the security of your account or anyone else's, or attempts to harvest credentials or private token information.</li>
              <li>Interferes with the proper working of the Services, including running auto-responders, spiders, crawlers, or scrapers without express written authorization.</li>
              <li>Decompiles, reverse engineers, or attempts to obtain source code or underlying architecture of the Services.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground pt-4">4. INTELLECTUAL PROPERTY & CONTENT LICENSES</h2>
            <h3 className="text-lg font-medium text-foreground">Our Content</h3>
            <p>
              The materials displayed or available on the Services—including text, software, graphics, logos, icons, awards, rankings, interactive components, and visual designs ("Content")—are owned by or licensed to IndiHunt and protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-lg font-medium text-foreground">User Submissions & License Grant</h3>
            <p>
              Anything you submit, post, upload, or feature on the Services (including product listings, taglines, logos, screenshots, maker bios, discussion posts, comments, and reviews) is your "User Submission". You retain ownership of your User Submissions.
            </p>
            <p>
              To enable IndiHunt to host, display, distribute, and promote your products and contributions, you hereby grant IndiHunt a worldwide, non-exclusive, royalty-free, perpetual, sublicensable, and transferable license to host, display, perform, reproduce, modify (for technical formatting), adapt, and distribute your User Submissions across the Services, newsletters, mobile apps, social media feeds (e.g. X/Twitter, LinkedIn), and marketing materials.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">5. SELF-SERVE ADVERTISING & SPONSORED CAMPAIGNS</h2>
            <p>
              IndiHunt offers self-serve ad campaign slots and sponsored placements for makers and businesses. By creating or purchasing an ad campaign:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You represent that all promotional copy, landing URLs, images, and offers comply with applicable laws and intellectual property rights.</li>
              <li>Ads are displayed dynamically based on status and budget allocations. We reserve the right to decline, pause, or remove any ad that is deceptive, misleading, malicious, or violates our platform guidelines.</li>
              <li>Ad payments are final and non-refundable once campaign display delivery has commenced, except as required by law.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground pt-4">6. COPYRIGHT AND DMCA POLICY</h2>
            <p>
              IndiHunt respects the intellectual property rights of creators. If you believe that content hosted on IndiHunt infringes your copyright, please send a written takedown notice under the Digital Millennium Copyright Act ("DMCA") or Indian Copyright Rules containing:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing and its location/URL on IndiHunt.</li>
              <li>Your contact details (email address, physical address, and telephone number).</li>
              <li>A statement of good faith belief that the use is not authorized by the copyright owner.</li>
            </ul>
            <p>Send copyright notices to: <span className="text-orange-500 font-semibold">copyright@indihunt.in</span>.</p>

            <h2 className="text-xl font-semibold text-foreground pt-4">7. DISCLAIMER OF WARRANTIES</h2>
            <p className="uppercase text-xs font-mono bg-muted p-3 rounded-xl">
              THE SERVICES AND CONTENT ARE PROVIDED BY INDIHUNT ON AN "AS-IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED SERVICE.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">8. LIMITATION OF LIABILITY</h2>
            <p>
              TO THE FULLEST EXTENT ALLOWED BY LAW, INDIHUNT, ITS OFFICERS, DIRECTORS, EMPLOYEES, AND SUPPLIERS SHALL NOT BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES, LOST PROFITS, LOSS OF GOODWILL, SERVICE INTERRUPTIONS, OR REVENUE LOSSES ARISING FROM OR RELATED TO YOUR USE OF THE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT SHALL INDIHUNT'S AGGREGATE LIABILITY EXCEED THE GREATER OF $100 USD OR THE TOTAL FEES PAID BY YOU TO INDIHUNT IN THE PRECEDING TWELVE (12) MONTHS.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">9. INDEMNIFICATION</h2>
            <p>
              You agree to indemnify, defend, and hold harmless IndiHunt, its affiliates, directors, officers, and employees from and against any third-party claims, liabilities, losses, damages, or expenses (including reasonable attorney fees) arising out of: (a) your use of the Services; (b) your User Submissions; or (c) your violation of these Terms.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">10. GOVERNING LAW & JURISDICTION</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any dispute or claim arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.
            </p>

            <h2 className="text-xl font-semibold text-foreground pt-4">11. CONTACT US</h2>
            <p>
              If you have any questions or feedback regarding these Terms, please reach out to us:
            </p>
            <div className="p-4 bg-card border border-border rounded-2xl space-y-1 text-xs">
              <p><strong>IndiHunt Team</strong></p>
              <p>Email: <a href="mailto:hello@indihunt.in" className="text-orange-500 font-semibold hover:underline">hello@indihunt.in</a> / <a href="mailto:legal@indihunt.in" className="text-orange-500 font-semibold hover:underline">legal@indihunt.in</a></p>
              <p>Address: Bengaluru, Karnataka 560001, India</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

