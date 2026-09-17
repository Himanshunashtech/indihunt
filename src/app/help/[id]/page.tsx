"use client";


import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, User, Heart, ThumbsUp, ThumbsDown, Check, CreditCard, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";

interface ArticleDetail {
  id: string;
  title: string;
  category: string;
  readTime: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  content: React.ReactNode;
}

const ARTICLES_DETAILS: Record<string, ArticleDetail> = {
  "get-featured": {
    id: "get-featured",
    title: "How to get featured on the main feed?",
    category: "Launching",
    readTime: "3 min read",
    author: {
      name: "Ram Sh",
      avatar: "https://lh3.googleusercontent.com/a/ACg8ocJ4O_oI-nlEsSGGcY7hW977UjD-tREtQx7qZ2X1LVNSG8TciCQ=s96-c",
      role: "IndiHunt Founder & Admin"
    },
    content: (
      <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <p>
          IndiHunt uses an automated, algorithmic featuring system to ensure that high-quality products built by Indian makers get maximum visibility. Featured products appear directly on the primary feed tab.
        </p>
        <h4 className="font-bold text-sm text-foreground pt-2">Feature Requirements Checklist:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Quality Score = 80:</strong> You must optimize your product launch wizard fields (images, screenshots, detailed descriptions).</li>
          <li><strong>Engagement Target:</strong> Obtain 20+ authentic community upvotes and 5+ distinct comments.</li>
          <li><strong>Timely Launch:</strong> These requirements must be reached within 12 hours of launching.</li>
          <li><strong>No Content Violations:</strong> The product description and initial comments must comply with our community guidelines.</li>
        </ul>
      </div>
    )
  },
  "understanding-scores": {
    id: "understanding-scores",
    title: "Understanding Quality Score & Engagement Score",
    category: "Launching",
    readTime: "4 min read",
    author: {
      name: "Ram Sh",
      avatar: "https://lh3.googleusercontent.com/a/ACg8ocJ4O_oI-nlEsSGGcY7hW977UjD-tREtQx7qZ2X1LVNSG8TciCQ=s96-c",
      role: "IndiHunt Founder & Admin"
    },
    content: (
      <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <p>
          To maintain transparency, IndiHunt calculates two metrics for every submitted product: **Quality Score** (static check on metadata) and **Engagement Score** (real-time user interaction).
        </p>
        <h4 className="font-bold text-sm text-foreground pt-2">Quality Score Weights (Max 100 points):</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Working Website URL: <strong>20 points</strong></li>
          <li>Product Logo: <strong>10 points</strong></li>
          <li>3+ Screenshots Uploaded: <strong>15 points</strong></li>
          <li>Video Demo URL: <strong>10 points</strong></li>
          <li>Detailed Description (200+ chars): <strong>15 points</strong></li>
          <li>Verified Maker Profile linked: <strong>10 points</strong></li>
          <li>Social Links & Category tags: <strong>10 points</strong></li>
          <li>Page Performance Optimization: <strong>10 points</strong></li>
        </ul>
        <h4 className="font-bold text-sm text-foreground pt-2">Engagement Score Formula:</h4>
        <pre className="p-3 bg-muted rounded-xl text-foreground text-xs font-mono font-semibold block">
          Score = (Upvotes × 3) + (Comments × 5) + (Bookmarks × 2) + (Views / 20)
        </pre>
      </div>
    )
  },
  "community-guidelines": {
    id: "community-guidelines",
    title: "Community Guidelines & Content Spam Policy",
    category: "Community",
    readTime: "3 min read",
    author: {
      name: "Ram Sh",
      avatar: "https://lh3.googleusercontent.com/a/ACg8ocJ4O_oI-nlEsSGGcY7hW977UjD-tREtQx7qZ2X1LVNSG8TciCQ=s96-c",
      role: "IndiHunt Founder & Admin"
    },
    content: (
      <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <p>
          Our community aims to support genuine builders. To ensure healthy conversations, we employ an automated real-time moderation system that scans submissions.
        </p>
        <h4 className="font-bold text-sm text-foreground pt-2">Spam Prevention Guidelines:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>No External Redirect Links:</strong> Product comments and thread replies containing external links (e.g. tracking links, unrelated redirects) will be flagged automatically.</li>
          <li><strong>Artificial Upvotes:</strong> Upvotes coming from duplicate IPs, temporary email accounts, or bots are auto-purged. Repeating violations will lock the maker account.</li>
          <li><strong>Civil Discourse:</strong> Harassment or low-effort promotion replies are blocked. Keep feedback constructive and supportive.</li>
        </ul>
      </div>
    )
  },
  "claim-badges": {
    id: "claim-badges",
    title: "How to claim your Maker Profile and badges",
    category: "Profiles",
    readTime: "2 min read",
    author: {
      name: "Ram Sh",
      avatar: "https://lh3.googleusercontent.com/a/ACg8ocJ4O_oI-nlEsSGGcY7hW977UjD-tREtQx7qZ2X1LVNSG8TciCQ=s96-c",
      role: "IndiHunt Founder & Admin"
    },
    content: (
      <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <p>
          Makers on IndiHunt enjoy access to specialized badges, homepage spotlights, and analytics boards. Claiming your account takes just a few steps.
        </p>
        <h4 className="font-bold text-sm text-foreground pt-2">Steps to Get Verified:</h4>
        <ul className="list-decimal pl-5 space-y-2">
          <li>Navigate to your <strong>Profile Settings</strong>.</li>
          <li>Add your professional or business work email (e.g. <code>you@yourstartup.com</code>).</li>
          <li>Verify your account via the verification email sent to your inbox.</li>
          <li>Link your GitHub account to showcase developer repositories and earn the <em>Open Source Builder</em> badge.</li>
        </ul>
      </div>
    )
  },
  "ad-campaigns": {
    id: "ad-campaigns",
    title: "Creating and managing self-serve Ad Campaigns",
    category: "Advertising",
    readTime: "4 min read",
    author: {
      name: "Ram Sh",
      avatar: "https://lh3.googleusercontent.com/a/ACg8ocJ4O_oI-nlEsSGGcY7hW977UjD-tREtQx7qZ2X1LVNSG8TciCQ=s96-c",
      role: "IndiHunt Founder & Admin"
    },
    content: (
      <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <p>
          Increase your product visibility by running native banners on the homepage feed and newsletter digests.
        </p>
        <h4 className="font-bold text-sm text-foreground pt-2">Campaign Categories:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Basic Ad Campaign:</strong> Displays horizontal card banners interspaced within the main feed.</li>
          <li><strong>Momentum Boost:</strong> Direct email feature placement in our weekly maker newsletter sent to 10k+ subscribers.</li>
          <li><strong>Managed Partner Ads:</strong> Custom branding, sidebar sticky widgets, and social media showcase campaigns managed by the core team.</li>
        </ul>
      </div>
    )
  },
  "payments-and-refunds": {
    id: "payments-and-refunds",
    title: "Payments, Billing & Refund Policy",
    category: "Billing & Advertising",
    readTime: "5 min read",
    author: {
      name: "Ram Sh",
      avatar: "https://lh3.googleusercontent.com/a/ACg8ocJ4O_oI-nlEsSGGcY7hW977UjD-tREtQx7qZ2X1LVNSG8TciCQ=s96-c",
      role: "IndiHunt Founder & Admin"
    },
    content: (
      <div className="space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <p>
          IndiHunt provides self-serve advertising, sponsored billboard placements, and newsletter promotions designed to help Indian and global indie makers reach early adopters, customers, and investors. We are committed to complete transparency in our billing and refund processes.
        </p>

        {/* Supported Payment Methods Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <span>Supported Payment Methods</span>
          </div>
          <p className="text-xs text-muted-foreground">
            All payments on IndiHunt are processed securely through our authorized Merchant of Record (MoR), <strong>Dodo Payments</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-muted/60 border border-border/50">
              <strong className="text-foreground block mb-1">UPI (India)</strong>
              <span>Instant payment via Google Pay, PhonePe, Paytm, BHIM, and any UPI ID or QR code.</span>
            </div>
            <div className="grid-cell p-3 rounded-xl bg-muted/60 border border-border/50">
              <strong className="text-foreground block mb-1">Credit & Debit Cards</strong>
              <span>Visa, Mastercard, RuPay, Maestro, and American Express with 3D Secure / OTP verification.</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/60 border border-border/50">
              <strong className="text-foreground block mb-1">Net Banking & Wallets</strong>
              <span>Direct net banking from 50+ major Indian banks and popular digital wallets.</span>
            </div>
            <div className="p-3 rounded-xl bg-muted/60 border border-border/50">
              <strong className="text-foreground block mb-1">International Payments</strong>
              <span>Makers worldwide can pay in USD or their local currency with automatic currency conversion.</span>
            </div>
          </div>
        </div>

        {/* How Ad Creation & Payment Works */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>How Payment & Campaign Creation Works</span>
          </h4>
          <p>
            When you create an ad campaign on the <Link href="/advertise" className="text-orange-500 font-semibold hover:underline">Advertise page</Link>, the process is completely automated:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Configure Your Ad:</strong> Set your product name, headline, destination URL, and select an impression budget (e.g. ₹350, ₹1,000, or custom).
            </li>
            <li>
              <strong>Secure Checkout:</strong> You are redirected to the encrypted Dodo Payments checkout portal to finalize your payment via UPI, Card, or Net Banking.
            </li>
            <li>
              <strong>Instant Campaign Activation:</strong> Once your payment is confirmed by your bank, our server instantly verifies the transaction and sets your ad campaign status to <code>active</code> in real-time.
            </li>
            <li>
              <strong>Live Delivery & Metrics:</strong> Your ad appears on the IndiHunt homepage feed and product discovery slots. Real-time impressions and clicks are tracked on your dashboard.
            </li>
          </ol>
        </div>

        {/* Failed or Cancelled Payments */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span>What happens if a payment fails or is cancelled?</span>
          </div>
          <p className="text-xs leading-relaxed">
            If your transaction is declined by your bank or cancelled at checkout, <strong>you will not be charged</strong>. IndiHunt automatically detects the failed or cancelled state, marks the draft campaign as archived, and provides an immediate retry button on the homepage banner without creating duplicate listings.
          </p>
        </div>

        {/* Official Refund Policy */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>IndiHunt Official Refund Policy</span>
          </h4>
          <p>
            We want every maker to feel confident investing their marketing budget on IndiHunt. Our refund policy is structured as follows:
          </p>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <span className="font-semibold text-foreground text-xs block">1. Full 100% Refund (Pre-Delivery)</span>
              <p className="text-xs">
                If your payment was processed but you decide to cancel before your ad campaign starts delivering impressions (or within 48 hours of purchase), you are eligible for a <strong>100% full refund</strong> with no questions asked.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <span className="font-semibold text-foreground text-xs block">2. Pro-Rata Refund (Active Campaigns)</span>
              <p className="text-xs">
                If your ad campaign has already started running and delivered partial impressions, you can pause the campaign and request a <strong>pro-rata refund</strong> for the unspent remaining ad budget (or convert the balance into platform credits for future launches).
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <span className="font-semibold text-foreground text-xs block">3. Accidental Duplicate Charges</span>
              <p className="text-xs">
                In the rare case your bank double-charges during network lag, any duplicate transaction is identified and refunded in full immediately.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <span className="font-semibold text-foreground text-xs block">4. Non-Refundable Situations</span>
              <p className="text-xs">
                Campaigns that have fully delivered their targeted impression count, or campaigns taken down due to malicious intent, fraudulent schemes, or severe Terms of Service violations are non-refundable.
              </p>
            </div>
          </div>
        </div>

        {/* How to Request a Refund Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-muted/60 border border-border space-y-3">
          <h4 className="font-semibold text-xs sm:text-sm text-foreground">How to Request a Refund or Invoicing Support</h4>
          <p className="text-xs">
            To request a refund, cancellation, or GST invoice receipt, reach out to our core team:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Email: <a href="mailto:support@indihunt.in" className="text-orange-500 font-semibold hover:underline">support@indihunt.in</a> or <a href="mailto:maker@indihunt.in" className="text-orange-500 font-semibold hover:underline">maker@indihunt.in</a></li>
            <li>Include your <strong>Payment ID</strong> (e.g. <code>pay_xxx</code>) or the email associated with your IndiHunt account.</li>
            <li>Refunds are credited back to your original source of payment (Bank / UPI / Card) within <strong>5 to 7 business days</strong>.</li>
          </ul>
        </div>
      </div>
    )
  }
};

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const article = ARTICLES_DETAILS[id];

  const [feedback, setFeedback] = useState<string | null>(null);
  const [likes, setLikes] = useState(12);
  const [dislikes, setDislikes] = useState(0);
  const [loves, setLoves] = useState(8);

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Article not found</p>
        <Link href="/help" className="text-xs font-semibold text-orange-500 hover:underline">
          Go back to Help Center
        </Link>
      </div>
    );
  }

  const handleFeedback = (type: "like" | "dislike" | "love") => {
    if (feedback) return;
    setFeedback(type);
    if (type === "like") setLikes(prev => prev + 1);
    if (type === "dislike") setDislikes(prev => prev + 1);
    if (type === "love") setLoves(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">

      {/* Header */}
      <header className="sticky top-0 z-40 w-full  bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/help" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Help Center</span>
          </Link>
          <span className="font-bold text-sm bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">Article Detail</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">

        {/* Article Header info */}
        <div className="space-y-4">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
            {article.category}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            {article.title}
          </h1>

          {/* Author Owner Row */}
          <div className="flex items-center gap-3 border-y border-border/60 py-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border flex-shrink-0">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground block leading-none">
                {article.author.name}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {article.author.role}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <article className="py-2  pb-8">
          {article.content}
        </article>

        {/* Emojis Feedback Section */}
        <section className="bg-card border border-border p-6 rounded-3xl text-center space-y-4 max-w-md mx-auto shadow-sm">
          <h4 className="font-bold text-xs text-foreground uppercase tracking-widest">
            Was this article helpful?
          </h4>

          <div className="flex items-center justify-center gap-6">
            {/* Like */}
            <button
              onClick={() => handleFeedback("like")}
              disabled={feedback !== null}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer ${feedback === "like"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 scale-105"
                  : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 disabled:opacity-50"
                }`}
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{likes}</span>
            </button>

            {/* Love */}
            <button
              onClick={() => handleFeedback("love")}
              disabled={feedback !== null}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer ${feedback === "love"
                  ? "bg-red-500/10 border-red-500/30 text-red-500 scale-105"
                  : "bg-muted/40 border-border/80 text-muted-foreground hover:text-red-500 hover:scale-105 active:scale-95 disabled:opacity-50"
                }`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{loves}</span>
            </button>

            {/* Dislike */}
            <button
              onClick={() => handleFeedback("dislike")}
              disabled={feedback !== null}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer ${feedback === "dislike"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 scale-105"
                  : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 disabled:opacity-50"
                }`}
            >
              <ThumbsDown className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{dislikes}</span>
            </button>
          </div>

          {feedback && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 font-semibold bg-emerald-500/5 py-2 px-4 rounded-xl border border-emerald-500/10 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Thank you for your feedback!</span>
            </div>
          )}
        </section>

      </main>

    </div>
  );
}
