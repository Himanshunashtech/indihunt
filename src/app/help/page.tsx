"use client";


import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Rocket,
  User,
  ShieldAlert,
  ChevronRight,
  Mail,
  MessageCircle,
  Bot,
  Send,
  X,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  ThumbsUp,
  Flag,
  Zap,
  Package,
  Heart,
  Globe,
  Users,
  TrendingUp,
  Award,
  Info,
  CreditCard,
} from "lucide-react";
import { supabase, scheduleProductDeletion, cancelProductDeletion, Product } from "@/lib/supabase";

// ────────────────────────────────────────────
// FAQ DATA — 20 detailed Q&As
// ────────────────────────────────────────────
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ReactNode;
  tags: string[];
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "how-to-launch",
    question: "How do I launch my product on IndiHunt?",
    answer:
      "Click the orange 'Submit' button in the top navigation bar. Fill in your product name, tagline, description, category, and upload a logo plus at least 2 screenshots. You can save as a draft anytime. Once you're happy, choose to publish immediately or schedule for a future date. Products launched between 12:00 AM–11:59 PM IST compete together for that day's rankings.",
    category: "Launching",
    icon: <Rocket className="w-4 h-4 text-orange-500" />,
    tags: ["launch", "submit", "publish", "new product"],
  },
  {
    id: "what-is-flp",
    question: "What is FLP (First Launch Platform)?",
    answer:
      "FLP stands for First Launch Platform — the concept that IndiHunt is the very first place Indian indie makers should announce and list their products. FLP badge is awarded to products that list on IndiHunt before any other platform. It signals to the community that you chose IndiHunt as your first home, which earns extra community goodwill and a visible badge on your product card.",
    category: "Launching",
    icon: <Star className="w-4 h-4 text-amber-500" />,
    tags: ["flp", "first launch", "badge", "platform"],
  },
  {
    id: "how-to-comment",
    question: "How do I comment on a product?",
    answer:
      "Open any product page and scroll down to the 'Discussion' section. Type your comment in the text box. Comments must be at least 5 characters and cannot contain external links (to prevent spam). You can also reply to existing comments. Our automated content moderation checks every comment for violations before it's published.",
    category: "Community",
    icon: <MessageSquare className="w-4 h-4 text-purple-500" />,
    tags: ["comment", "discussion", "reply"],
  },
  {
    id: "what-is-streak",
    question: "What is a Streak and how does it work?",
    answer:
      "A Streak (🔥) counts consecutive days you've visited and engaged with IndiHunt. Every day you upvote, comment, or launch a product, your streak grows. Streaks appear on your profile and product cards. Longer streaks give you higher visibility in the community feed and unlock special maker badges at 7, 30, and 100-day milestones.",
    category: "Profiles",
    icon: <Zap className="w-4 h-4 text-orange-500" />,
    tags: ["streak", "engagement", "badge", "consecutive"],
  },
  {
    id: "featured-algorithm",
    question: "How does the Featured algorithm work?",
    answer:
      "Products are featured based on two combined scores: (1) Quality Score (0–100): based on having a logo, tagline, description, screenshots, demo video, website URL, verified maker profile, GitHub link, and product category. (2) Engagement Score: calculated from upvotes, comments, and time decay. Products scoring 80+ quality AND earning 20+ upvotes within 12 hours are auto-featured. Editors can also manually feature exceptional products.",
    category: "Launching",
    icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
    tags: ["featured", "algorithm", "quality score", "engagement"],
  },
  {
    id: "upvote-rules",
    question: "Can I ask people to upvote my product?",
    answer:
      "Yes, but thoughtfully. You can share your IndiHunt listing with your network, newsletter, and social media. What's not allowed: paying for upvotes, using bots, vote exchanges in DMs, or mass-blasting strangers. Suspicious upvote patterns are detected by our algorithm and may lead to downranking or product removal. Authentic promotion is always welcomed.",
    category: "Community",
    icon: <ThumbsUp className="w-4 h-4 text-emerald-500" />,
    tags: ["upvote", "vote", "promotion", "rules"],
  },
  {
    id: "quality-score",
    question: "How do I improve my Quality Score?",
    answer:
      "Quality Score checks 9 signals: (1) Logo uploaded, (2) Tagline written, (3) Description > 50 chars, (4) At least 2 screenshots, (5) Demo video URL added, (6) Website URL linked, (7) Maker profile verified, (8) GitHub linked, (9) Category selected. Each item adds ~10–15 points. A score of 80+ makes you eligible for featuring. Check your score on your product's detail page sidebar.",
    category: "Launching",
    icon: <Award className="w-4 h-4 text-amber-500" />,
    tags: ["quality score", "improve", "score", "featured"],
  },
  {
    id: "what-is-pact",
    question: "What is a Launch Pact?",
    answer:
      "A Launch Pact is a mutual agreement between two makers to upvote each other's products on launch day. When you upvote someone's product and they upvote yours back, IndiHunt automatically detects the mutual support and creates a Pact record shown on both profiles. It's a way to build meaningful launch partnerships with fellow Indian builders.",
    category: "Community",
    icon: <Heart className="w-4 h-4 text-red-500" />,
    tags: ["pact", "launch pact", "mutual", "partnership"],
  },
  {
    id: "schedule-launch",
    question: "Can I schedule my product for a specific date?",
    answer:
      "Yes! In the product submission wizard, choose 'Schedule for later' and pick any future date. Scheduled products appear on the calendar and can optionally be shown as 'Coming Soon' previews if you enable the pre-launch toggle. Scheduled products are not ranked until their launch date. You can edit or cancel the schedule anytime from your My Products dashboard.",
    category: "Launching",
    icon: <Clock className="w-4 h-4 text-blue-500" />,
    tags: ["schedule", "launch date", "planned", "future"],
  },
  {
    id: "maker-profile",
    question: "How do I set up my Maker Profile?",
    answer:
      "Visit your profile page and click 'Edit Profile'. Add your full name, username (used for your public @handle), bio, location, website, Twitter, GitHub, and LinkedIn links. Upload a profile photo. Linking your GitHub or LinkedIn unlocks the 'Verified Maker' badge, which boosts your product's Quality Score by 15 points.",
    category: "Profiles",
    icon: <User className="w-4 h-4 text-orange-500" />,
    tags: ["profile", "maker", "setup", "verify", "badge"],
  },
  {
    id: "stories",
    question: "What are Stories and how do I create one?",
    answer:
      "Stories are long-form posts from makers — think build logs, lessons learned, or behind-the-scenes updates about your product journey. Go to /stories and click 'Write a Story'. Add a title, content, and optionally a cover image and link to your product. Stories are searchable, commentable, and help you build an audience over time.",
    category: "Community",
    icon: <BookOpen className="w-4 h-4 text-purple-500" />,
    tags: ["stories", "write", "blog", "build log"],
  },
  {
    id: "threads",
    question: "What are Threads? How are they different from comments?",
    answer:
      "Threads are standalone discussion posts not tied to a specific product. You can start a thread to ask the community a question, share an opinion, discuss a topic, or start a debate. Comments are product-specific, while threads live in the community forum at /discussions. Threads support nested replies and can be linked back to a product.",
    category: "Community",
    icon: <MessageCircle className="w-4 h-4 text-purple-500" />,
    tags: ["threads", "forum", "discussion", "difference"],
  },
  {
    id: "ad-campaigns",
    question: "How do I run an ad campaign on IndiHunt?",
    answer:
      "Go to your profile → Campaigns tab → 'Create Campaign'. Choose from Basic (newsletter placement), Momentum (homepage banner), or Managed (full-service). Each tier has different reach and pricing. Campaigns show your product to highly targeted IndiHunt visitors — makers and early adopters actively looking for new tools. All campaigns require a product link and tagline.",
    category: "Advertising",
    icon: <Globe className="w-4 h-4 text-blue-500" />,
    tags: ["campaign", "ad", "promote", "advertising"],
  },
  {
    id: "content-moderation",
    question: "What content is not allowed on IndiHunt?",
    answer:
      "Our automated moderation blocks: external links in comments/replies, profanity and hate speech, spam patterns, all-caps shouting, and promotional DM templates. Violations result in content rejection (not deletion — you can fix and resubmit). Repeated violations may lead to account review. Always keep posts respectful, relevant, and link-free.",
    category: "Guidelines",
    icon: <ShieldAlert className="w-4 h-4 text-red-500" />,
    tags: ["moderation", "spam", "banned", "rules", "links"],
  },
  {
    id: "collections",
    question: "What are Collections and how do I use them?",
    answer:
      "Collections let you curate lists of products around a theme — like 'Best AI Tools 2025' or 'Free Dev Tools I Use'. Visit any product page and click 'Save to Collection'. You can create multiple named collections on your profile. Collections are public, searchable, and help others discover great products through your curation.",
    category: "Profiles",
    icon: <Package className="w-4 h-4 text-orange-500" />,
    tags: ["collections", "save", "curate", "list"],
  },
  {
    id: "tech-stack",
    question: "What is the Tech Stack feature?",
    answer:
      "On your profile, the Tech Stack section lets you list the tools, frameworks, and services you use to build your products — e.g. Next.js, Supabase, Tailwind, Vercel. You can pick from a searchable database of 1000+ tools. Other makers can filter community members by stack, helping you find collaborators who use the same technologies.",
    category: "Profiles",
    icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    tags: ["tech stack", "tools", "technologies", "frameworks"],
  },
  {
    id: "open-source",
    question: "How do I mark my product as Open Source?",
    answer:
      "In the product wizard or settings, check the 'Open Source' toggle and paste your GitHub repository URL. Open source products earn an Open Source badge on their product card. This helps the community discover, fork, and contribute to your work.",
    category: "Launching",
    icon: <Globe className="w-4 h-4 text-emerald-500" />,
    tags: ["open source", "github", "oss", "badge"],
  },
  {
    id: "student-showcase",
    question: "What is the Student Showcase?",
    answer:
      "We highlight student-built products with a Student badge. When submitting your product, check 'Built by a student' to display this badge. It's a safe space for learners to get visibility and constructive feedback.",
    category: "Launching",
    icon: <Users className="w-4 h-4 text-blue-500" />,
    tags: ["student", "showcase", "education", "learning"],
  },
  {
    id: "follow-product",
    question: "How do I follow a product for updates?",
    answer:
      "On any product page, click the 'Follow' button below the product header. You'll receive in-app notifications when the maker posts an update, reaches upvote milestones, or ships a new version. You can manage all your followed products from your profile under the 'Following' tab.",
    category: "Community",
    icon: <Heart className="w-4 h-4 text-pink-500" />,
    tags: ["follow", "notifications", "updates", "subscribe"],
  },
  {
    id: "report-product",
    question: "How do I report a product or comment?",
    answer:
      "On any product page, click the three-dot menu (⋯) and select 'Report'. For comments, hover and click the Flag icon. Describe the issue — spam, plagiarism, misleading content, or community guideline violation. Our moderation team reviews all reports within 24–48 hours. Reporters remain anonymous to the reported user.",
    category: "Guidelines",
    icon: <Flag className="w-4 h-4 text-red-500" />,
    tags: ["report", "flag", "violation", "spam", "abuse"],
  },
  {
    id: "payments-and-refunds-faq",
    question: "What payment methods are supported and what is your refund policy?",
    answer:
      "IndiHunt supports UPI (Google Pay, PhonePe, Paytm, BHIM), Indian & International Cards (Visa, Mastercard, RuPay, Amex), and Net Banking powered securely by Dodo Payments. Ad campaigns are activated automatically upon confirmed payment. If you cancel before impressions are delivered, we offer a 100% refund within 48 hours. For partially run campaigns, unspent ad budget can be refunded pro-rata or converted to platform credits. Contact support@indihunt.in with your Payment ID to initiate a refund.",
    category: "Billing",
    icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
    tags: ["payment", "refund", "upi", "card", "billing", "dodo", "ad campaign", "invoice"],
  },
];

// ────────────────────────────────────────────
// POPULAR ARTICLES
// ────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
}

const POPULAR_ARTICLES: Article[] = [
  {
    id: "payments-and-refunds",
    title: "Payments, Billing & Refund Policy",
    category: "Billing",
    excerpt: "Supported payment methods (UPI, Cards), automated ad activation, failed transaction handling, and refund guidelines.",
  },
  {
    id: "get-featured",
    title: "How to get featured on the main feed?",
    category: "Launching",
    excerpt: "Learn how the IndiHunt featuring algorithm works and how to achieve a Quality Score of 80+.",
  },
  {
    id: "understanding-scores",
    title: "Understanding Quality Score & Engagement Score",
    category: "Launching",
    excerpt: "A breakdown of how quality factors and engagement metrics affect your ranking.",
  },
  {
    id: "community-guidelines",
    title: "Community Guidelines & Content Spam Policy",
    category: "Community",
    excerpt: "Our automated content moderation rules, links policy, and how we protect the ecosystem from spam.",
  },
  {
    id: "claim-badges",
    title: "How to claim your Maker Profile and badges",
    category: "Profiles",
    excerpt: "Verify your work email and link your GitHub or LinkedIn to claim maker badges.",
  },
  {
    id: "ad-campaigns",
    title: "Creating and managing self-serve Ad Campaigns",
    category: "Advertising",
    excerpt: "A guide to launching Basic, Momentum, or Managed ad campaigns on IndiHunt.",
  },
];

// ────────────────────────────────────────────
// CHATBOT TYPES
// ────────────────────────────────────────────
type BotStep =
  | "idle"
  | "menu"
  | "faq_search"
  | "faq_answer"
  | "delete_flow_intro"
  | "delete_flow_products"
  | "delete_flow_reason"
  | "delete_flow_confirm"
  | "delete_flow_success"
  | "delete_flow_cancel_success";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  faqMatch?: FAQItem;
  products?: Product[];
  selectedProduct?: Product;
}

interface ChatAction {
  label: string;
  value: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
}

// ────────────────────────────────────────────
// CHATBOT COMPONENT
// ────────────────────────────────────────────
let _msgCounter = 0;
const uniqueMsgId = () => `msg_${++_msgCounter}_${Date.now()}`;

function IndiBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<BotStep>("menu");
  const [inputText, setInputText] = useState("");
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [faqResults, setFaqResults] = useState<FAQItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    // Load user session
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) {
        setCurrentUser(data.session.user);
      }
    });

    // Show welcome message
    addBotMessage(
      "👋 Hi! I'm **IndiBot**, your IndiHunt assistant.\n\nI can help you with launching products, understanding features, community guidelines, and more.\n\nWhat would you like help with?",
      mainMenuActions()
    );
  }, []);

  const mainMenuActions = (): ChatAction[] => [
    { label: "📚 Browse FAQ", value: "faq", variant: "secondary" },
    { label: "🚀 How to launch", value: "how-to-launch", variant: "secondary" },
    { label: "⭐ FLP & Streak", value: "flp-streak", variant: "secondary" },
    { label: "🗑️ Unpublish a product", value: "delete_flow", variant: "secondary" },
    { label: "📞 Contact Support", value: "contact", variant: "secondary" },
  ];

  const addBotMessage = (content: string, actions?: ChatAction[], extra?: Partial<ChatMessage>) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: uniqueMsgId(),
          role: "bot",
          content,
          timestamp: new Date(),
          actions,
          ...extra,
        },
      ]);
    }, 600);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: uniqueMsgId(),
        role: "user",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const handleAction = async (value: string, label: string) => {
    addUserMessage(label);

    if (value === "menu" || value === "back") {
      setStep("menu");
      addBotMessage("No problem! Here's the main menu:", mainMenuActions());
      return;
    }

    if (value === "contact") {
      addBotMessage(
        "You can reach us at **support@indihunt.co** or ask the community on the discussions page. We typically respond within 24 hours on weekdays.",
        [
          { label: "✉️ Email Support", value: "mailto:support@indihunt.co", variant: "primary" },
          { label: "← Back to Menu", value: "menu", variant: "secondary" },
        ]
      );
      return;
    }

    if (value === "faq") {
      setStep("faq_search");
      addBotMessage(
        "Search any topic or browse categories below. Try: *'how to launch'*, *'quality score'*, *'streak'*, *'FLP'*...",
        [
          { label: "🚀 Launching", value: "search:Launching", variant: "secondary" },
          { label: "🤝 Community", value: "search:Community", variant: "secondary" },
          { label: "👤 Profiles", value: "search:Profiles", variant: "secondary" },
          { label: "🛡️ Guidelines", value: "search:Guidelines", variant: "secondary" },
          { label: "← Back", value: "menu", variant: "secondary" },
        ]
      );
      return;
    }

    if (value.startsWith("search:")) {
      const tag = value.replace("search:", "");
      const results = FAQ_DATA.filter(
        (f) =>
          f.category.toLowerCase() === tag.toLowerCase() ||
          f.tags.some((t) => t.includes(tag.toLowerCase()))
      );
      setFaqResults(results);
      addBotMessage(
        `Here are **${results.length}** articles on **${tag}**:`,
        results.map((f) => ({ label: f.question, value: `faq:${f.id}`, variant: "secondary" as const })).concat([
          { label: "← Back to FAQ", value: "faq", variant: "secondary" },
        ])
      );
      return;
    }

    if (value.startsWith("faq:")) {
      const id = value.replace("faq:", "");
      const item = FAQ_DATA.find((f) => f.id === id);
      if (item) {
        setStep("faq_answer");
        addBotMessage(
          `**${item.question}**\n\n${item.answer}`,
          [
            { label: "🔄 Ask another question", value: "faq", variant: "secondary" },
            { label: "← Main Menu", value: "menu", variant: "secondary" },
          ],
          { faqMatch: item }
        );
      }
      return;
    }

    // Quick answers for common shortcuts
    if (value === "how-to-launch") {
      const item = FAQ_DATA.find((f) => f.id === "how-to-launch")!;
      addBotMessage(`**${item.question}**\n\n${item.answer}`, [
        { label: "🚀 Go to Submit Page", value: "/new", variant: "primary" },
        { label: "← Main Menu", value: "menu", variant: "secondary" },
      ]);
      return;
    }

    if (value === "flp-streak") {
      addBotMessage(
        "I'll answer both:\n\n**🌟 FLP (First Launch Platform):** " +
          FAQ_DATA.find((f) => f.id === "what-is-flp")!.answer +
          "\n\n**🔥 Streak:** " +
          FAQ_DATA.find((f) => f.id === "what-is-streak")!.answer,
        [
          { label: "📚 More FAQ", value: "faq", variant: "secondary" },
          { label: "← Main Menu", value: "menu", variant: "secondary" },
        ]
      );
      return;
    }

    // ── DELETION FLOW ──
    if (value === "delete_flow") {
      if (!currentUser) {
        addBotMessage(
          "⚠️ You need to be **logged in** to use the product unpublishing feature. Please sign in first, then come back here.",
          [
            { label: "🔑 Sign In", value: "/login", variant: "primary" },
            { label: "← Main Menu", value: "menu", variant: "secondary" },
          ]
        );
        return;
      }

      setStep("delete_flow_intro");
      addBotMessage(
        "I can help you **unpublish and schedule removal** of one of your products.\n\n⏳ Products aren't deleted immediately. Instead:\n• Your product is **hidden** from all public feeds instantly\n• After **7 days** it is permanently deleted from the database\n• You can **cancel** anytime within the 7-day window\n\nShall I proceed?",
        [
          { label: "Yes, show my products", value: "delete_load_products", variant: "primary" },
          { label: "← Cancel, go back", value: "menu", variant: "secondary" },
        ]
      );
      return;
    }

    if (value === "delete_load_products") {
      setStep("delete_flow_products");
      setIsTyping(true);

      // Load user's products from Supabase
      // Note: filter is_deleted client-side — column may not exist yet if migration hasn't run
      let prods: Product[] = [];
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("maker_id", currentUser.id)
          .order("created_at", { ascending: false });
        if (error) {
          console.error("[IndiBot] Failed to load products:", error?.message || error?.code);
        }
        // Filter out already-deleted products client-side
        prods = (data || []).filter((p: Product) => !p.is_deleted);
      }

      setUserProducts(prods);
      setIsTyping(false);

      if (prods.length === 0) {
        addBotMessage("You don't have any active products. There's nothing to unpublish.", [
          { label: "← Main Menu", value: "menu", variant: "secondary" },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: uniqueMsgId(),
          role: "bot",
          content: `You have **${prods.length}** product${prods.length > 1 ? "s" : ""}. Which one would you like to unpublish?`,
          timestamp: new Date(),
          products: prods,
        },
      ]);
      return;
    }

    if (value.startsWith("select_product:")) {
      const productId = value.replace("select_product:", "");
      const prod = userProducts.find((p) => p.id === productId) || null;
      setSelectedProduct(prod);
      setStep("delete_flow_reason");
      addBotMessage(
        `You selected **${prod?.name}**.\n\nBefore we proceed, could you tell us why you want to remove this product? This helps us improve IndiHunt.`,
        [
          { label: "🐛 It has too many bugs", value: "reason:bugs", variant: "secondary" },
          { label: "📦 Product is discontinued", value: "reason:discontinued", variant: "secondary" },
          { label: "🔄 Relaunching with updates", value: "reason:relaunch", variant: "secondary" },
          { label: "🔒 Privacy concerns", value: "reason:privacy", variant: "secondary" },
          { label: "💼 Business reasons", value: "reason:business", variant: "secondary" },
          { label: "✍️ Other reason", value: "reason:other", variant: "secondary" },
          { label: "← Choose different product", value: "delete_load_products", variant: "secondary" },
        ],
        { selectedProduct: prod || undefined }
      );
      return;
    }

    if (value.startsWith("reason:")) {
      const reason = value.replace("reason:", "");
      const reasonLabels: Record<string, string> = {
        bugs: "Too many bugs",
        discontinued: "Product discontinued",
        relaunch: "Relaunching with updates",
        privacy: "Privacy concerns",
        business: "Business reasons",
        other: "Other reason",
      };
      const reasonText = reasonLabels[reason] || reason;
      setDeletionReason(reasonText);
      setStep("delete_flow_confirm");

      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7);

      addBotMessage(
        `📋 **Review before confirming:**\n\n• **Product:** ${selectedProduct?.name}\n• **Reason:** ${reasonText}\n• **Scheduled deletion:** ${deletionDate.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n⚠️ The product will be **immediately hidden** from all feeds and permanently deleted after 7 days. You can cancel anytime within this period.\n\nAre you sure?`,
        [
          { label: "✅ Yes, schedule deletion", value: "confirm_delete", variant: "danger" },
          { label: "← No, cancel", value: "menu", variant: "secondary" },
        ]
      );
      return;
    }

    if (value === "confirm_delete") {
      if (!selectedProduct || !currentUser) return;
      setStep("delete_flow_success");
      setIsTyping(true);

      const ok = await scheduleProductDeletion(selectedProduct.id, deletionReason, currentUser.id);
      setIsTyping(false);

      if (ok) {
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 7);
        addBotMessage(
          `✅ **Deletion scheduled!**\n\n**${selectedProduct.name}** is now hidden from all public feeds and will be permanently deleted on **${deletionDate.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}**.\n\nIf you change your mind, you can cancel using the button below or by contacting support before that date.`,
          [
            { label: "↩️ Cancel deletion now", value: "cancel_deletion", variant: "secondary" },
            { label: "← Main Menu", value: "menu", variant: "secondary" },
          ]
        );
      } else {
        addBotMessage(
          "❌ Something went wrong while scheduling the deletion. Please try again or contact support at support@indihunt.co.",
          [{ label: "← Main Menu", value: "menu", variant: "secondary" }]
        );
      }
      return;
    }

    if (value === "cancel_deletion") {
      if (!selectedProduct) return;
      setIsTyping(true);
      const ok = await cancelProductDeletion(selectedProduct.id);
      setIsTyping(false);
      setStep("delete_flow_cancel_success");

      if (ok) {
        addBotMessage(
          `↩️ **Deletion cancelled!**\n\n**${selectedProduct.name}** has been restored. It will reappear on public feeds within a few minutes.`,
          [{ label: "← Main Menu", value: "menu", variant: "secondary" }]
        );
      } else {
        addBotMessage("❌ Couldn't cancel the deletion. Please contact support@indihunt.co", [
          { label: "← Main Menu", value: "menu", variant: "secondary" },
        ]);
      }
      return;
    }

    // Handle external links (starts with /)
    if (value.startsWith("/")) {
      window.location.href = value;
      return;
    }

    if (value.startsWith("mailto:")) {
      window.location.href = value;
      return;
    }
  };

  const handleTextSearch = () => {
    if (!inputText.trim()) return;
    const query = inputText.trim().toLowerCase();
    addUserMessage(inputText.trim());
    setInputText("");

    const matches = FAQ_DATA.filter(
      (f) =>
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query) ||
        f.tags.some((t) => t.includes(query)) ||
        f.category.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      addBotMessage(
        `I couldn't find an exact match for **"${query}"**. Try a different keyword or browse by category.`,
        [
          { label: "📚 Browse FAQ", value: "faq", variant: "secondary" },
          { label: "📞 Contact Support", value: "contact", variant: "secondary" },
          { label: "← Main Menu", value: "menu", variant: "secondary" },
        ]
      );
    } else if (matches.length === 1) {
      setStep("faq_answer");
      addBotMessage(`Found this for **"${query}"**:\n\n**${matches[0].question}**\n\n${matches[0].answer}`, [
        { label: "🔄 Search again", value: "faq", variant: "secondary" },
        { label: "← Main Menu", value: "menu", variant: "secondary" },
      ]);
    } else {
      setStep("faq_search");
      addBotMessage(
        `Found **${matches.length}** results for **"${query}"**. Which one helps you?`,
        matches.map((f) => ({ label: f.question, value: `faq:${f.id}`, variant: "secondary" as const })).concat([
          { label: "← Main Menu", value: "menu", variant: "secondary" },
        ])
      );
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  };

  return (
    <div className="flex flex-col h-[580px] w-full sm:w-[400px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm">IndiBot</p>
          <p className="text-[10px] opacity-80">IndiHunt Assistant · Always online</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-background">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {/* Bubble */}
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-orange-500 text-white rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md border border-border/50"
              }`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />

            {/* Product picker */}
            {msg.products && msg.products.length > 0 && (
              <div className="w-full space-y-2">
                {msg.products.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleAction(`select_product:${prod.id}`, prod.name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted border border-border hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left group"
                  >
                    <img
                      src={prod.logo_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=80&q=80"}
                      alt={prod.name}
                      className="w-9 h-9 rounded-xl object-cover border border-border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{prod.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{prod.tagline || "No tagline"}</p>
                    </div>
                    {prod.scheduled_deletion_date && (
                      <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                        Pending deletion
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-orange-500 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                {msg.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction(action.value, action.label)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                      action.variant === "primary"
                        ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                        : action.variant === "danger"
                        ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                        : "bg-muted text-foreground border-border hover:border-orange-500/30 hover:bg-orange-500/5"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-md px-3.5 py-2.5">
              <div className="flex gap-1 items-center h-3">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-border">
        <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTextSearch()}
            placeholder="Type your question..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleTextSearch}
            disabled={!inputText.trim()}
            className="w-6 h-6 rounded-full bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-orange-600 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// FAQ ACCORDION COMPONENT
// ────────────────────────────────────────────
function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="divide-y divide-border/60 border border-border/60 rounded-2xl overflow-hidden">
      {items.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-base font-medium text-foreground/90 group-hover:text-orange-500 transition-colors">
                {item.question}
              </span>
            </div>
            {openId === item.id ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          {openId === item.id && (
            <div className="px-5 pb-5 pt-2 bg-muted/20">
              <p className="text-base text-foreground/80 leading-relaxed">{item.answer}</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {item.category}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────
export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Launching", "Community", "Profiles", "Guidelines", "Advertising", "Billing"];

  const filteredFAQ = FAQ_DATA.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some((t) => t.includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "All" || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredArticles = POPULAR_ARTICLES.filter(
    (art) =>
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden transition-colors duration-300 pt-[72px] sm:pt-[78px]">
      <Navbar />

      {/* FAQPage JSON-LD Schema — matches visible FAQ_DATA on this page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQ_DATA.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />

      {/* Orange Hero */}
      <section className="relative overflow-hidden pt-3 sm:pt-4 pb-12 sm:pb-16 bg-gradient-to-b from-orange-500 to-orange-600 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/25 text-xs font-medium uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>IndiHunt Support</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight leading-tight">How can we help you?</h1>
          <p className="text-base opacity-90 max-w-xl mx-auto leading-relaxed">
            Search our knowledge base, browse 20+ FAQ topics, or chat with IndiBot for instant answers.
          </p>
          <div className="max-w-lg mx-auto relative pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600/70" />
            <input
              type="text"
              placeholder="Search guides, policies, features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-900 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xl transition-all font-medium"
            />
          </div>

          {/* Chat CTA */}
          <button
            onClick={() => setChatOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 border border-white/30 text-xs sm:text-sm font-medium hover:bg-white/25 transition-all backdrop-blur-sm cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Chat with IndiBot for instant help</span>
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Browse Categories */}
        <section className="space-y-8">
          <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight text-center sm:text-left">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Launching Products", desc: "Wizard guides, schedules, features, score criteria", icon: <Rocket className="w-6 h-6 text-orange-500" />, tag: "Launching" },
              { title: "Community & Forum", desc: "Upvotes, discussions, commenting guidelines", icon: <MessageSquare className="w-6 h-6 text-purple-500" />, tag: "Community" },
              { title: "Makers & Profiles", desc: "Badges, tech stacks, verification, profiles", icon: <User className="w-6 h-6 text-orange-500" />, tag: "Profiles" },
              { title: "Guidelines & Rules", desc: "Violations, spam filters, reputation systems", icon: <ShieldAlert className="w-6 h-6 text-purple-500" />, tag: "Guidelines" },
            ].map((cat, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveCategory(cat.tag); document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" }); }}
                className="bg-card border border-border/80 p-6 rounded-3xl text-left space-y-4 hover:border-orange-500/20 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:scale-105 transition-all">
                  {cat.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-base text-foreground/90">{cat.title}</h3>
                  <p className="text-base text-foreground/80 leading-relaxed">{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Popular Articles */}
        {!searchQuery && (
          <section className="space-y-8">
            <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Popular Help Guides</h2>
            <div className="divide-y divide-border/60 border-t ">
              {filteredArticles.map((art, idx) => (
                <Link
                  href={`/help/${art.id}`}
                  key={idx}
                  className="py-6 flex flex-col md:flex-row md:items-start justify-between gap-4 group cursor-pointer"
                >
                  <div className="space-y-2 max-w-3xl">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {art.category}
                    </span>
                    <h3 className="font-medium text-base text-foreground/90 group-hover:text-orange-500 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-base text-foreground/80 leading-relaxed">{art.excerpt}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-orange-500 group-hover:text-orange-600 transition-colors mt-2 md:mt-0 flex-shrink-0">
                    <span>Read Article</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section id="faq-section" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">
              {searchQuery ? `Search Results (${filteredFAQ.length})` : "Frequently Asked Questions"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all border cursor-pointer ${
                    activeCategory === cat
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-muted text-muted-foreground border-border hover:border-orange-500/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredFAQ.length > 0 ? (
            <FAQAccordion items={filteredFAQ} />
          ) : (
            <div className="py-16 text-center text-muted-foreground bg-card border border-dashed border-border rounded-3xl">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-35" />
              <p className="text-base font-medium text-foreground/90">No results for "{searchQuery}"</p>
              <button
                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                className="mt-2 text-xs font-medium text-orange-500 hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Unpublish CTA */}
        <section className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/20 p-8 sm:p-10 rounded-3xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Want to remove a product?</h2>
              <p className="text-base text-foreground/80 leading-relaxed max-w-lg">
                Use our guided chatbot to safely unpublish and schedule deletion of any of your products. Products are hidden immediately and permanently deleted after a 7-day grace period — giving you time to change your mind.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setChatOpen(true); }}
            className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium text-xs transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            Open IndiBot to unpublish
          </button>
        </section>

        {/* Contact Block */}
        <section className="bg-card border border-border p-8 sm:p-12 rounded-3xl text-center space-y-6 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl" />
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-lg sm:text-xl font-medium text-foreground/90 tracking-tight">Still need help?</h2>
            <p className="text-base text-foreground/80 leading-relaxed">
              Our active maker community and support team are standing by. Chat with IndiBot instantly or reach us directly.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => setChatOpen(true)}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-lg shadow-orange-500/10 transition-all inline-flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Chat with IndiBot</span>
            </button>
            <a
              href="mailto:support@indihunt.co"
              className="px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-xs transition-colors inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-orange-500" />
              <span>Email Support</span>
            </a>
            <Link
              href="/discussions"
              className="px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-xs transition-colors inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span>Ask Community</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Floating Chat Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          id="indihunt-chat-button"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-2xl shadow-orange-500/30 flex items-center justify-center hover:scale-110 transition-all group"
          aria-label="Open IndiBot chat"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />
        </button>
      )}

      {/* Chat Window */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <IndiBot onClose={() => setChatOpen(false)} />
        </div>
      )}
    </div>
  );
}
