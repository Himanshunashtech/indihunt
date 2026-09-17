"use client";


import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Users,
  Megaphone,
  MessageSquare,
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Rocket,
  Eye,
  X,
  Upload,
  Tag,
  Hash,
  Search,
  CreditCard
} from "lucide-react";
import {
  supabase,
  getProductById,
  updateProduct,
  getProductMembers,
  inviteProductMember,
  Product,
  Profile,
  getProducts,
  getProductShoutoutsGiven,
  submitProductShoutouts,
  getProductSlug,
  uploadImage,
  deleteImage,
  getAdCampaigns,
  updateAdCampaignStatus,
  AdCampaign
} from "@/lib/supabase";
import { DEV_COMPANIES } from "@/app/new/page";
import { toast, Toaster } from "sonner";

const ALL_AVAILABLE_PLATFORM_TAGS = [
  // AI & Data
  "Artificial Intelligence",
  "AI Agents",
  "AI Chatbots",
  "AI Code Editors",
  "AI Coding Agents",
  "AI Notetakers",
  "AI Presentation Software",
  "AI Workflow Automation",
  "Analytics & Data",
  "Machine Learning",
  "LLMs",
  "Prompt Engineering",

  // Productivity & Core
  "Productivity",
  "SaaS",
  "Task Management",
  "Project Management",
  "Note Taking",
  "Calendar Apps",
  "Time Tracking",
  "Team Collaboration",
  "Knowledge Base",
  "CMS",
  "Customer Support",
  "Email Clients",
  "File Storage",
  "CRM",

  // Engineering & Dev
  "Developer Tools",
  "APIs & Integrations",
  "Open Source",
  "Cybersecurity",
  "No-Code",
  "Low-Code",
  "Vibe Coding",
  "Cloud & DevOps",
  "Databases",
  "Web Development",
  "Mobile Development",

  // Design & Creative
  "Design Tools",
  "3D & Animation",
  "Graphic Design",
  "UI/UX",
  "Generative Media",
  "Video Editing",
  "Photo Editing",
  "Audio & Music",

  // Marketing & Sales
  "Marketing Tools",
  "SEO",
  "Social Media",
  "Lead Generation",
  "Growth Hacking",
  "Email Marketing",
  "Advertising",

  // Finance & Business
  "Finance",
  "FinTech",
  "E-commerce",
  "Payments",
  "Invoicing",
  "Crypto / Web3",
  "Accounting",

  // Community & Social
  "Community",
  "Social Networking",
  "Forums",
  "Creator Economy",
  "Education",
  "Health & Fitness"
];

const SUGGESTED_TAGS = [
  "AI",
  "SaaS",
  "Developer Tools",
  "Productivity",
  "Design Tools",
  "Marketing",
  "Fintech",
  "Open Source",
  "E-commerce",
  "Analytics",
  "Mobile Apps",
  "No-Code",
  "Crypto / Web3",
  "Community"
];

type Tab = "settings" | "members" | "shoutouts" | "promote" | "advertising" | "reviews" | "notifications";

export default function ProductSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const fromAdmin = searchParams?.get('from') === 'admin';

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [showPreLaunch, setShowPreLaunch] = useState(false);
  const [workedOnLaunch, setWorkedOnLaunch] = useState(true);
  const [fundingType, setFundingType] = useState<"bootstrapped" | "y_combinator" | "venture_backed">("bootstrapped");

  // Social links
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [medium, setMedium] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Invite member form state
  const [inviteInput, setInviteInput] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Shoutouts form states
  const [shoutouts, setShoutouts] = useState<{ id?: string; shouted_product_id: string; shouted_product_name: string; note: string }[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [shoutoutSearch, setShoutoutSearch] = useState("");
  const [showShoutoutSearchDropdown, setShowShoutoutSearchDropdown] = useState<number | null>(null);
  const [isSavingShoutouts, setIsSavingShoutouts] = useState(false);

  // Self Advertising states
  const [productCampaigns, setProductCampaigns] = useState<AdCampaign[]>([]);
  const [adName, setAdName] = useState("");
  const [adHeadline, setAdHeadline] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adCta, setAdCta] = useState("Visit Product");
  const [adTotalBudget, setAdTotalBudget] = useState(350);
  const [adDailyLimit, setAdDailyLimit] = useState(10);
  const [showLaunchAdModal, setShowLaunchAdModal] = useState(false);
  const [isSubmittingAd, setIsSubmittingAd] = useState(false);

  // Advertising states removed in favor of central /ads page

  useEffect(() => {
    if (!supabase || !productId) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setUser(session.user);
        loadProductData(session.user.id);
      }
    });
  }, [productId, router]);

  const loadProductData = async (userId: string) => {
    setIsLoading(true);
    try {
      const prod = await getProductById(productId);
      if (prod) {
        // Fetch user profile to check for admin role
        let isAdmin = false;
        if (supabase) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
          isAdmin = profile?.role === 'admin';
        }

        // Only allow owner/maker, member, or admin to view settings
        if (prod.maker_id !== userId && !isAdmin) {
          // Check if user is in members list
          const productMembers = await getProductMembers(prod.id);
          const isMember = productMembers.some(m => m.id === userId);
          if (!isMember) {
            router.push("/my-products");
            return;
          }
          setMembers(productMembers);
        } else {
          const productMembers = await getProductMembers(prod.id);
          setMembers(productMembers);
        }

        setProduct(prod);
        const slug = getProductSlug(prod.name);
        if (productId !== slug) {
          router.replace(`/my-products/${slug}/settings`);
        }
        setName(prod.name || "");
        setTagline(prod.tagline || "");
        const existingTags = prod.tags && Array.isArray(prod.tags) && prod.tags.length > 0
          ? prod.tags
          : (prod.category ? [prod.category] : []);
        setTags(existingTags);
        setLogoUrl(prod.logo_url || "");
        setGalleryImages(prod.screenshots || []);
        setUrl(prod.website_url || "");
        setDescription(prod.description || "");
        setTwitter(prod.twitter_url || "");
        setFacebook(prod.facebook_url || "");
        setInstagram(prod.instagram_url || "");
        setLinkedin(prod.linkedin_url || "");
        setMedium(prod.medium_url || "");
        setGithubUrl(prod.github_url || "");
        setVideoUrl(prod.video_url || "");
        setShowPreLaunch(prod.show_pre_launch || false);
        setWorkedOnLaunch(prod.worked_on_launch !== false);
        setFundingType(prod.funding_type || "bootstrapped");

        // Load shoutouts and other products
        const shoutoutsGiven = await getProductShoutoutsGiven(prod.id);

        let productsList: Product[] = [];
        if (supabase) {
          const { data, error } = await supabase
            .from('products')
            .select('*, maker:profiles!maker_id(*)');
          if (!error && data) {
            productsList = data;
          }
        } else {
          const local = localStorage.getItem("indihunt_products");
          if (local) {
            try {
              productsList = JSON.parse(local);
            } catch (e) {
              console.error(e);
            }
          }
        }

        const filtered = productsList.filter(p => p.id !== prod.id);
        const merged: any[] = [...filtered];
        DEV_COMPANIES.forEach((comp) => {
          if (!merged.some(p => p.name.toLowerCase() === comp.name.toLowerCase())) {
            merged.push(comp);
          }
        });
        setAllProducts(merged);
        setShoutouts(shoutoutsGiven.map(s => ({
          id: s.id,
          shouted_product_id: s.shouted_product_id,
          shouted_product_name: s.shouted_product?.name || "",
          note: s.note
        })));

        // Load advertising campaigns for this product
        try {
          const allCamps = await getAdCampaigns(userId);
          const prodCamps = allCamps.filter(c => c.product_id === prod.id);
          setProductCampaigns(prodCamps);
        } catch { }

      } else {
        router.push("/my-products");
      }
    } catch (err) {
      console.error(err);
      router.push("/my-products");
    } finally {
      setIsLoading(false);
    }
  };

  // Click outside listener for tag search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute all available tags (combining platform tags + dynamic tags from all loaded products)
  const allAvailableTags = React.useMemo(() => {
    const set = new Set<string>();
    ALL_AVAILABLE_PLATFORM_TAGS.forEach(t => set.add(t));
    SUGGESTED_TAGS.forEach(t => set.add(t));
    allProducts.forEach(p => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(t => {
          if (typeof t === "string" && t.trim()) set.add(t.trim());
        });
      }
      if (p.category && typeof p.category === "string" && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  // Filtered available tags based on search query
  const filteredAvailableTags = React.useMemo(() => {
    if (!tagInput.trim()) {
      return allAvailableTags.slice(0, 16);
    }
    const query = tagInput.trim().toLowerCase().replace(/^#+/, "");
    return allAvailableTags.filter(t => t.toLowerCase().includes(query)).slice(0, 24);
  }, [allAvailableTags, tagInput]);

  const handleAddTag = (rawTag?: string) => {
    const valueToAdd = (rawTag !== undefined ? rawTag : tagInput).trim();
    if (!valueToAdd) return;

    // Normalize: remove leading hash and trim


    const cleanTag = valueToAdd.replace(/^#+/, "").trim();
    if (!cleanTag) return;

    // Avoid duplicates (case-insensitive check)
    if (tags.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
      setTagInput("");
      return;
    }

    if (tags.length >= 10) {
      toast.error("Tag limit reached", { description: "You can add a maximum of 10 tags per product." });
      return;
    }

    setTags(prev => [...prev, cleanTag]);
    setTagInput("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSaving(true);

    try {
      const updated = await updateProduct(product.id, {
        name,
        tagline,
        tags,
        logo_url: logoUrl,
        screenshots: galleryImages,
        website_url: url,
        description,
        twitter_url: twitter,
        facebook_url: facebook,
        instagram_url: instagram,
        linkedin_url: linkedin,
        medium_url: medium,
        github_url: githubUrl,
        video_url: videoUrl,
        show_pre_launch: showPreLaunch,
        worked_on_launch: workedOnLaunch,
        funding_type: fundingType
      });

      if (updated) {
        setProduct(updated);
        if (updated.tags) setTags(updated.tags);
        if (updated.screenshots) setGalleryImages(updated.screenshots);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        toast.success("Product settings saved!", { duration: 1000 });
      } else {
        toast.error("Failed to update product settings", { duration: 1000 });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error saving settings", {
        description: err?.message || "An unexpected error occurred while saving."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !inviteInput.trim()) return;
    setIsInviting(true);

    try {
      const invitedUser = await inviteProductMember(product.id, inviteInput.trim());
      if (invitedUser) {
        setMembers(prev => [...prev, invitedUser]);
        toast.success(`Invitation sent to @${invitedUser.username}!`, {
          description: "They now have collaborator access to edit this product."
        });
        setInviteInput("");
      } else {
        toast.error("User not found or invitation failed.", {
          description: "Please check the username or email address and try again."
        });
      }
    } catch (err: any) {
      toast.error("Invitation failed", {
        description: err.message || "Could not invite this user."
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveShoutouts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSavingShoutouts(true);

    // Validate shoutouts notes (must be >= 20 chars if specified)
    const invalid = shoutouts.some(s => (!s.shouted_product_id && !s.shouted_product_name) || s.note.length < 20);
    if (invalid) {
      toast.error("Incomplete shoutout", {
        description: "Please make sure all shoutouts have a selected product and a note of at least 20 characters."
      });
      setIsSavingShoutouts(false);
      return;
    }

    try {
      await submitProductShoutouts(
        product.id,
        shoutouts.map(s => ({
          shouted_product_id: s.shouted_product_id,
          name: s.shouted_product_name,
          logo_url: allProducts.find(p => p.id === s.shouted_product_id || p.name === s.shouted_product_name)?.logo_url,
          note: s.note
        }))
      );

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      toast.success("Product shoutouts saved!", {
        description: "Your founder recommendations are now visible on their product pages."
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update shoutouts", {
        description: err?.message || "Please try again."
      });
    } finally {
      setIsSavingShoutouts(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!product) return;
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      if (supabase) {
        const { error } = await supabase
          .from("product_members")
          .delete()
          .eq("product_id", product.id)
          .eq("user_id", memberId);
        if (error) throw error;
      }

      setMembers(prev => prev.filter(m => m.id !== memberId));

      // Local fallback updates
      const key = `IndiHunt_members_${product.id}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        const current: Profile[] = JSON.parse(cached);
        localStorage.setItem(key, JSON.stringify(current.filter(m => m.id !== memberId)));
      }

      toast.success("Member removed", {
        description: "Collaborator access has been revoked."
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to remove member", {
        description: err?.message || "An error occurred."
      });
    }
  };

  const handleLaunchAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    setIsSubmittingAd(true);
    const toastId = toast.loading("Preparing secure Dodo Payments checkout...");
    try {
      const budgetAmount = Number(adTotalBudget) || 350;
      const campaignName = adName || `${product.name} Ad Campaign`;
      const headline = adHeadline || (product.tagline ? product.tagline.substring(0, 60) : `Discover ${product.name}`);
      const description = adDescription || (product.description ? product.description.substring(0, 120) : `Check out ${product.name} on IndiHunt.`);

      // Trigger Dodo Payments Checkout Session directly
      const checkoutRes = await fetch("/t/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          name: campaignName,
          userName: user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : ""),
          headline,
          description,
          cta_text: adCta,
          destination_url: `/products/${product.id}`,
          amount: budgetAmount,
          daily_limit: Number(adDailyLimit) || 10,
          cpm_rate: 10.0,
          userEmail: user.email || "",
        }),
      });

      const rawText = await checkoutRes.text();
      let checkoutData: any = {};
      try {
        checkoutData = JSON.parse(rawText);
      } catch {
        toast.error("Payment error", {
          id: toastId,
          description: "Server error initiating payment. Please try again."
        });
        return;
      }

      const redirectUrl = checkoutData.data?.url || checkoutData.url;
      if (redirectUrl) {
        toast.success("Redirecting to checkout...", { id: toastId });
        window.location.href = redirectUrl;
        return;
      }

      if (checkoutData.error) {
        toast.error("Payment initiation failed", {
          id: toastId,
          description: checkoutData.error || "Failed to initiate payment."
        });
      }
    } catch (err: any) {
      console.error("Ad launch checkout error:", err);
      toast.error("Checkout failed", {
        id: toastId,
        description: err?.message || "Failed to initiate checkout."
      });
    } finally {
      setIsSubmittingAd(false);
    }
  };

  const handleUpdateAdStatus = async (campId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const updated = await updateAdCampaignStatus(campId, nextStatus);
      if (updated) {
        setProductCampaigns(prev => prev.map(c => c.id === campId ? updated! : c));
        toast.success(nextStatus === "active" ? "Campaign activated!" : "Campaign paused.", {
          description: `Campaign #${campId.substring(0, 8)} status updated.`
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update campaign status", {
        description: err?.message || "Please try again."
      });
    }
  };



  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <CircularLoader label="Loading settings..." size="lg" center={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#ff5733] selection:text-white transition-colors duration-300">
      <Toaster
        position="top-right"
        duration={1000}
        toastOptions={{
          duration: 1000,
          style: {
            background: "#18181b",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            fontSize: "13px",
            fontWeight: 500,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
          },
          className: "!bg-[#18181b] !text-white !border-white/10 !rounded-2xl !shadow-2xl",
        }}
      />

      {/* Mini-Header */}
      <header className="sticky top-0 z-40 w-full  bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={fromAdmin ? "/admin/products" : "/my-products"} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>{fromAdmin ? "Back to Admin" : "Back to Products"}</span>
          </Link>

          <Link
            href={`/products/${product.id}`}
            className="px-4 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            View page
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Banner Title */}
        <div className="flex items-center gap-4">
          <img
            src={product.logo_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80"}
            alt=""
            className="w-16 h-16 rounded-2xl object-cover border border-border bg-muted flex-shrink-0"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground/90 leading-tight">Settings & members</h1>
            <p className="text-base text-foreground/80 leading-relaxed mt-0.5">Manage {product.name} Product Page</p>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className=" flex flex-wrap gap-2">
          {[
            { id: "settings", label: "Product Page settings", icon: Settings, bg: "bg-orange-500/10", color: "text-[#ff5733]" },
            { id: "members", label: "Members", icon: Users, bg: "bg-purple-500/10", color: "text-purple-500" },
            { id: "shoutouts", label: "Shoutouts", icon: MessageSquare, bg: "bg-emerald-500/10", color: "text-emerald-500" },
            { id: "promote", label: "Promote", icon: Megaphone, bg: "bg-sky-500/10", color: "text-sky-500" },
            { id: "advertising", label: "Self Advertising", icon: Megaphone, bg: "bg-amber-500/10", color: "text-amber-500" },
            { id: "reviews", label: "Reviews", icon: MessageSquare, bg: "bg-rose-500/10", color: "text-rose-500" },
            { id: "notifications", label: "Notifications", icon: Bell, bg: "bg-indigo-500/10", color: "text-indigo-500" }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${active ? "border-[#ff5733] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <div className={`w-6 h-6 rounded-lg ${tab.bg} ${tab.color} flex items-center justify-center text-xs flex-shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="pt-2">

          {/* 1. PRODUCT PAGE SETTINGS TAB */}
          {activeTab === "settings" && (
            <form onSubmit={handleSaveSettings} className="max-w-3xl space-y-6">

              <div className="space-y-4">

                {/* Product Name */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">Name of your product</label>
                    <span className="text-xs font-medium text-muted-foreground">{name.length}/40</span>
                  </div>
                  <input
                    type="text"
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-base font-medium text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-foreground block">Tagline</label>
                    <span className="text-[10px] text-muted-foreground">{tagline.length}/60</span>
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    required
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                  />
                </div>

                {/* Product Tags & Topics Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-orange-500" />
                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                          Product Tags & Topics ({tags.length}/10)
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add tags and categories to help users discover your product in search, leaderboards, and topic feeds.
                      </p>
                    </div>
                    {tags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTags([])}
                        className="text-[11px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear all tags
                      </button>
                    )}
                  </div>

                  {/* Active Tags Pills */}
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/20 border border-border/60 rounded-2xl">
                      {tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-foreground font-medium text-xs rounded-xl shadow-2xs group"
                        >
                          <Hash className="w-3 h-3 text-orange-500" />
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="p-0.5 hover:bg-orange-500/20 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-0.5"
                            title={`Remove #${t}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-border/70 rounded-2xl text-center bg-card/20">
                      <p className="text-xs font-medium text-muted-foreground">No tags added yet.</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">Add tags below or select from popular suggested topics.</p>
                    </div>
                  )}

                  {/* Search & Add Tag Input with Autocomplete Dropdown */}
                  <div className="relative" ref={tagDropdownRef}>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => {
                            setTagInput(e.target.value);
                            setShowTagDropdown(true);
                          }}
                          onFocus={() => setShowTagDropdown(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              if (tagInput.trim()) {
                                handleAddTag();
                                setShowTagDropdown(false);
                              }
                            } else if (e.key === "Escape") {
                              setShowTagDropdown(false);
                            }
                          }}
                          placeholder="Search all available tags or type custom tag (e.g. AI, SaaS, Fintech)..."
                          maxLength={30}
                          disabled={tags.length >= 10}
                          className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#ff5733] transition-colors disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddTag();
                          setShowTagDropdown(false);
                        }}
                        disabled={!tagInput.trim() || tags.length >= 10}
                        className="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-orange-500" />
                        <span>Add Tag</span>
                      </button>
                    </div>

                    {/* Search Dropdown Panel */}
                    {showTagDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-2xl shadow-xl z-30 max-h-64 overflow-hidden p-2.5 divide-y divide-border/40 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2 py-1 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex justify-between items-center pb-2">
                          <span>{tagInput.trim() ? `Search Results (${filteredAvailableTags.length})` : `All Available Tags (${allAvailableTags.length})`}</span>
                          <span className="text-[10px] font-normal lowercase text-muted-foreground">click to select / deselect</span>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                          {filteredAvailableTags.length > 0 ? (
                            filteredAvailableTags.map((availTag) => {
                              const isAdded = tags.some(t => t.toLowerCase() === availTag.toLowerCase());
                              return (
                                <button
                                  key={availTag}
                                  type="button"
                                  onClick={() => {
                                    if (isAdded) {
                                      const idx = tags.findIndex(t => t.toLowerCase() === availTag.toLowerCase());
                                      if (idx !== -1) handleRemoveTag(idx);
                                    } else {
                                      handleAddTag(availTag);
                                    }
                                  }}
                                  className={`px-2.5 py-1 text-xs font-medium rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${isAdded
                                      ? "bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400 font-semibold"
                                      : "bg-muted/40 hover:bg-muted border-border text-foreground hover:border-orange-500/40"
                                    }`}
                                >
                                  <Hash className="w-3 h-3 text-orange-500 opacity-80" />
                                  <span>{availTag}</span>
                                  {isAdded ? (
                                    <CheckCircle className="w-3 h-3 text-orange-500 ml-0.5" />
                                  ) : (
                                    <Plus className="w-3 h-3 text-muted-foreground ml-0.5" />
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="w-full py-3 text-center text-xs text-muted-foreground">
                              No existing tag found matching &quot;{tagInput}&quot;. Press <span className="font-semibold text-foreground">Add Tag</span> to create it!
                            </div>
                          )}
                        </div>

                        {tagInput.trim() && !allAvailableTags.some(t => t.toLowerCase() === tagInput.trim().toLowerCase()) && (
                          <div className="pt-2 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleAddTag();
                                setShowTagDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create new tag &quot;#{tagInput.trim().replace(/^#+/, "")}&quot;</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Suggested / Popular tags */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
                      Popular Suggested Tags:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_TAGS.map((sugTag) => {
                        const isSelected = tags.some((t) => t.toLowerCase() === sugTag.toLowerCase());
                        return (
                          <button
                            key={sugTag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                const idx = tags.findIndex((t) => t.toLowerCase() === sugTag.toLowerCase());
                                if (idx !== -1) handleRemoveTag(idx);
                              } else {
                                handleAddTag(sugTag);
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${isSelected
                                ? "bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400"
                                : "bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <span>#{sugTag}</span>
                            {isSelected ? <CheckCircle className="w-3 h-3 text-orange-500" /> : <Plus className="w-3 h-3 opacity-60" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Product Logo URL & Preview */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">Product Logo URL</label>
                  <div className="flex items-center gap-4">
                    {/* Live Logo Preview Box */}
                    <div className="w-14 h-14 rounded-2xl border border-border bg-card p-1.5 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm relative">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Product Logo Preview"
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-orange-500/10 to-amber-500/10 text-orange-500 font-bold text-base rounded-xl">
                          {name ? name.charAt(0).toUpperCase() : "P"}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.webp"
                          className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-base font-medium text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                        />
                        <label className="flex items-center gap-1.5 px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground font-semibold text-xs rounded-xl transition-all cursor-pointer flex-shrink-0">
                          <Upload className="w-3.5 h-3.5 text-orange-500" />
                          <span>{isUploadingLogo ? "Uploading..." : "Upload"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingLogo}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingLogo(true);
                              try {
                                const path = `logo_${product?.id || 'prod'}_${Date.now()}_${file.name}`;
                                const url = await uploadImage("products", file, path);
                                if (url) {
                                  setLogoUrl(url);
                                  toast.success("Logo uploaded successfully!");
                                } else {
                                  toast.error("Failed to upload logo.");
                                }
                              } catch (err: any) {
                                console.error("Logo upload error:", err);
                                toast.error("Logo upload error", { description: err?.message || "Please try another image." });
                              } finally {
                                setIsUploadingLogo(false);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Direct image URL for your product icon (PNG, JPG, SVG, WebP) or upload a new one. This logo appears on feed cards, product detail headers, and search listings.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Gallery Images / Screenshots Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                        Media Gallery ({galleryImages.length} Screenshots)
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">High-resolution app screenshots or UI feature previews.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Add Image URL Button / Inline Input */}
                      {showUrlInput ? (
                        <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1 shadow-xs animate-in fade-in zoom-in duration-150">
                          <input
                            type="url"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="Paste image URL..."
                            className="bg-transparent text-xs px-2 py-1 text-foreground focus:outline-none w-48 font-medium"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newImageUrl.trim()) {
                                  setGalleryImages(prev => [...prev, newImageUrl.trim()]);
                                  setNewImageUrl("");
                                  setShowUrlInput(false);
                                }
                              }
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newImageUrl.trim()) {
                                setGalleryImages(prev => [...prev, newImageUrl.trim()]);
                                setNewImageUrl("");
                                setShowUrlInput(false);
                              }
                            }}
                            className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(true)}
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border text-foreground font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-orange-500" />
                          <span>Add Image URL</span>
                        </button>
                      )}

                      {/* Upload Screenshots Button */}
                      <label className="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border text-foreground font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                        <Upload className="w-3.5 h-3.5 text-orange-500" />
                        <span>{isUploadingGallery ? "Uploading..." : "Upload Screenshots"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isUploadingGallery}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            setIsUploadingGallery(true);
                            try {
                              const uploadPromises = Array.from(files).map(async (file, index) => {
                                const path = `screenshot_${product?.id || 'prod'}_${Date.now()}_${index}_${file.name}`;
                                return await uploadImage("products", file, path);
                              });
                              const urls = await Promise.all(uploadPromises);
                              const validUrls = urls.filter((u): u is string => !!u);
                              if (validUrls.length > 0) {
                                setGalleryImages(prev => [...prev, ...validUrls]);
                                toast.success(`Uploaded ${validUrls.length} screenshot${validUrls.length > 1 ? 's' : ''}!`);
                              } else {
                                toast.error("Failed to upload screenshots.");
                              }
                            } catch (err: any) {
                              console.error("Gallery upload error:", err);
                              toast.error("Screenshot upload error", { description: err?.message || "Please try again." });
                            } finally {
                              setIsUploadingGallery(false);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Horizontal Carousel Row of Screenshots */}
                  {galleryImages.length > 0 ? (
                    <div className={`flex flex-row flex-nowrap gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin ${galleryImages.length <= 2 ? "justify-center" : ""}`}>
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className="w-[220px] flex-shrink-0 relative group">
                          <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border bg-black/5 shadow-xs">
                            <img
                              src={img}
                              alt={`Screenshot ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                // 1. Delete from bucket
                                await deleteImage("products", img);

                                // 2. Update local state
                                const newImages = galleryImages.filter((_, i) => i !== idx);
                                setGalleryImages(newImages);

                                // 3. Auto-save settings to DB so the UI remains in sync
                                if (product) {
                                  await updateProduct(product.id, { screenshots: newImages });
                                }
                                toast.info("Screenshot removed.");
                              }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-md"
                              title="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-border rounded-2xl text-center space-y-2 bg-card/30">
                      <p className="text-xs font-medium text-muted-foreground">No screenshots added yet.</p>
                      <p className="text-[11px] text-muted-foreground/80">Use the &quot;Add Image URL&quot; or &quot;Upload Screenshots&quot; buttons above to add product preview images.</p>
                    </div>
                  )}
                </div>

                {/* Product URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Product URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    placeholder="https://example.com"
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                  />
                </div>

                {/* Demo Video URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Demo Video URL (YouTube or Loom)</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://www.loom.com/share/..."
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-foreground block">Description</label>
                    <span className="text-[10px] text-muted-foreground">{description.length}/500</span>
                  </div>
                  <textarea
                    maxLength={500}
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors resize-none"
                  />
                </div>

                {/* Social Links */}
                <div className="pt-4 border-t border-border space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Social Accounts</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Twitter/X URL</label>
                      <input
                        type="url"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="https://twitter.com/username"
                        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Facebook URL</label>
                      <input
                        type="url"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="https://facebook.com/page"
                        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Instagram URL</label>
                      <input
                        type="url"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="https://instagram.com/profile"
                        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">LinkedIn URL</label>
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/company/name"
                        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Medium URL</label>
                      <input
                        type="url"
                        value={medium}
                        onChange={(e) => setMedium(e.target.value)}
                        placeholder="https://medium.com/@username"
                        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">GitHub Repository URL</label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username/repo"
                        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-[#ff5733] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Explorer Options */}
                <div className="pt-4 border-t border-border space-y-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Explorer Options</h3>
                  <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-border/50">
                    <input
                      type="checkbox"
                      id="showPreLaunch"
                      checked={showPreLaunch}
                      onChange={(e) => setShowPreLaunch(e.target.checked)}
                      className="w-4 h-4 text-[#ff5733] border-border rounded focus:ring-[#ff5733] focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="showPreLaunch" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                      Show pre-launch product in Explorer feed today
                      <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">Allow users to discover, comment, and share your scheduled product before its launch day (upvoting remains locked until scheduled date).</span>
                    </label>
                  </div>

                  <div className="space-y-2 bg-muted/20 p-4 rounded-2xl border border-border/50">
                    <label className="text-xs font-semibold text-foreground block">Your Role on this Product Launch</label>
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                        <input
                          type="radio"
                          name="workedOnLaunchSettings"
                          checked={workedOnLaunch === true}
                          onChange={() => setWorkedOnLaunch(true)}
                          className="w-4 h-4 text-[#ff5733] border-border focus:ring-[#ff5733]"
                        />
                        <span>I worked on this product <span className="text-[10px] text-emerald-500 font-semibold ml-1">(Display as Maker)</span></span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                        <input
                          type="radio"
                          name="workedOnLaunchSettings"
                          checked={workedOnLaunch === false}
                          onChange={() => setWorkedOnLaunch(false)}
                          className="w-4 h-4 text-[#ff5733] border-border focus:ring-[#ff5733]"
                        />
                        <span>I didn't work on this product <span className="text-[10px] text-blue-500 font-semibold ml-1">(Display as Hunter)</span></span>
                      </label>
                    </div>
                  </div>

                  {/* Funding Information */}
                  <div className="space-y-2 bg-muted/20 p-4 rounded-2xl border border-border/50">
                    <label className="text-xs font-semibold text-foreground block uppercase tracking-wider">Funding Information</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {[
                        { id: "bootstrapped", title: "Bootstrapped", desc: "Have not raised VC funding", icon: "🌱" },
                        { id: "y_combinator", title: "Y Combinator company", desc: "I am backed by Y Combinator", icon: "🟧" },
                        { id: "venture_backed", title: "Venture backed", desc: "I have raised venture-backed funding for this product.", icon: "💎" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFundingType(item.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${fundingType === item.id
                              ? "bg-[#ff5733]/15 border-[#ff5733] text-foreground ring-1 ring-[#ff5733]"
                              : "bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">{item.title}</span>
                            <span className="text-xs">{item.icon}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-snug">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-55 shadow-md shadow-orange-500/10"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>

            </form>
          )}

          {/* 2. MEMBERS TAB */}
          {activeTab === "members" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Side: Current Members */}
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Product Team Members</h3>
                  <p className="text-xs text-muted-foreground">These makers have full access to edit settings and manage the launch page.</p>
                </div>

                <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">

                  {/* Owner (Main Maker) */}
                  <div className="flex items-center justify-between p-4 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ff5733]/15 text-[#ff5733] font-semibold flex items-center justify-center border border-orange-550/20 text-xs">
                        👑
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-foreground block">
                          {product.maker?.full_name || "Owner/Creator"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          @{product.maker?.username || "creator"}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 border border-orange-500/20 text-[#ff5733] text-[9px] font-semibold rounded-full">
                      Owner
                    </span>
                  </div>

                  {/* Co-makers */}
                  {members.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground italic">
                      No team members added yet. Use the invitation panel to invite co-makers.
                    </div>
                  ) : (
                    members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-border"
                          />
                          <div>
                            <span className="text-xs font-semibold text-foreground block">{member.full_name}</span>
                            <span className="text-[10px] text-muted-foreground block">@{member.username}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-[9px] font-semibold rounded-full">
                            Member
                          </span>
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-1.5 border border-border hover:border-red-500/20 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                </div>
              </div>

              {/* Right Side: Invite Panel */}
              <div className="lg:col-span-4 bg-card border border-border p-6 rounded-3xl space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">Invite team members</h4>
                  <p className="text-[10px] text-muted-foreground">Collaborators will be able to edit product settings and co-manage this launch.</p>
                </div>

                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground block">Username or email</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rohit_sharma"
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#ff5733]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isInviting || !inviteInput.trim()}
                    className="w-full py-2 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center shadow-md shadow-orange-500/10"
                  >
                    {isInviting ? "Inviting..." : "Send invitation"}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* 2.5. SHOUTOUTS TAB */}
          {activeTab === "shoutouts" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Product Shoutouts</h3>
                <p className="text-xs text-muted-foreground">Shout out the products that helped you build {product.name}. Each shoutout lives on as a founder review, giving your product extra visibility.</p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShoutouts([...shoutouts, { shouted_product_id: "", shouted_product_name: "", note: "" }])}
                  className="w-full py-3 bg-[#ff5733]/5 hover:bg-[#ff5733]/10 text-[#ff5733] border border-dashed border-[#ff5733]/20 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>➕ Add shoutout</span>
                </button>

                <form onSubmit={handleSaveShoutouts} className="space-y-4">
                  {shoutouts.length === 0 ? (
                    <div className="bg-card border border-border p-8 rounded-3xl text-center text-muted-foreground text-xs">
                      No shoutouts added yet. Click &quot;Add shoutout&quot; above to select products you love!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shoutouts.map((shout, idx) => {
                        const filteredProducts = allProducts.filter(p =>
                          p.name.toLowerCase().includes((shoutoutSearch || "").toLowerCase()) &&
                          !shoutouts.some(s => s.shouted_product_id === p.id)
                        );

                        return (
                          <div key={idx} className="p-5 bg-card border border-border rounded-3xl space-y-4 relative shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-foreground">Shoutout #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShoutouts(shoutouts.filter((_, i) => i !== idx));
                                }}
                                className="text-[10px] font-semibold text-red-500 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>

                            {/* Product Search Box */}
                            <div className="relative">
                              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Search for a product</label>
                              {shout.shouted_product_name ? (() => {
                                const matched = allProducts.find(p => p.id === shout.shouted_product_id || p.name === shout.shouted_product_name);
                                return (
                                  <div className="flex items-center justify-between bg-muted/45 border border-border rounded-xl px-4 py-2.5 text-xs font-semibold text-foreground">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center flex-shrink-0">
                                        {matched?.logo_url ? (
                                          <img src={matched.logo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-[10px] font-semibold text-orange-500">{shout.shouted_product_name.charAt(0)}</span>
                                        )}
                                      </div>
                                      <span>{shout.shouted_product_name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...shoutouts];
                                        updated[idx].shouted_product_id = "";
                                        updated[idx].shouted_product_name = "";
                                        setShoutouts(updated);
                                      }}
                                      className="text-[10px] font-semibold text-orange-500 hover:underline cursor-pointer"
                                    >
                                      Change
                                    </button>
                                  </div>
                                );
                              })() : (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Type to search products..."
                                    value={showShoutoutSearchDropdown === idx ? shoutoutSearch : ""}
                                    onChange={(e) => {
                                      setShoutoutSearch(e.target.value);
                                      setShowShoutoutSearchDropdown(idx);
                                    }}
                                    onFocus={() => setShowShoutoutSearchDropdown(idx)}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#ff5733]"
                                  />
                                  {showShoutoutSearchDropdown === idx && (
                                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-background border border-border rounded-xl shadow-xl">
                                      {filteredProducts.length === 0 ? (
                                        <div className="p-3 text-[11px] text-muted-foreground">No matching products found</div>
                                      ) : (
                                        filteredProducts.map(p => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                              const updated = [...shoutouts];
                                              updated[idx].shouted_product_id = p.id;
                                              updated[idx].shouted_product_name = p.name;
                                              setShoutouts(updated);
                                              setShowShoutoutSearchDropdown(null);
                                              setShoutoutSearch("");
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-muted text-xs text-foreground font-medium flex items-center gap-2 cursor-pointer  last:border-0"
                                          >
                                            <div className="w-5 h-5 rounded overflow-hidden bg-muted flex-shrink-0">
                                              {p.logo_url && <img src={p.logo_url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <span>{p.name}</span>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Note field */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Why did you use it / Why do you recommend it?</label>
                                <span className={`text-[9px] font-semibold ${shout.note.length >= 20 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                  {shout.note.length}/20 chars min
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                placeholder="Explain why this product was helpful. Be specific (minimum 20 characters)..."
                                value={shout.note}
                                onChange={(e) => {
                                  const updated = [...shoutouts];
                                  updated[idx].note = e.target.value;
                                  setShoutouts(updated);
                                }}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-[#ff5733] resize-none"
                              />
                              {shout.note.length > 0 && shout.note.length < 20 && (
                                <p className="text-[9px] text-amber-600 font-semibold mt-1">⚠️ Shoutout note must be at least 20 characters</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {shoutouts.length > 0 && (
                    <button
                      type="submit"
                      disabled={isSavingShoutouts}
                      className="w-full py-2.5 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center shadow-md shadow-orange-500/10"
                    >
                      {isSavingShoutouts ? "Saving shoutouts..." : "Save shoutouts"}
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* 3. PROMOTE TAB */}
          {activeTab === "promote" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Promote {product.name}</h3>
                <p className="text-xs text-muted-foreground">Let everyone know you launched on IndiHunt! Embed these badges on your site to drive upvotes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Embed Badge Preview */}
                <div className="bg-card border border-border p-6 rounded-3xl space-y-4 flex flex-col items-center justify-center">
                  <div className="px-4 py-2.5 border-2 border-[#ff5733] bg-[#ff5733]/5 text-[#ff5733] rounded-xl font-extrabold text-xs uppercase tracking-widest flex items-center gap-2">
                    <Rocket className="w-4 h-4 animate-bounce" />
                    <span>Featured on IndiHunt</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Standard badge widget (Recommended)</span>
                </div>

                <div className="bg-card border border-border p-6 rounded-3xl space-y-3">
                  <h4 className="text-xs font-semibold text-foreground">HTML Embed Code</h4>
                  <textarea
                    readOnly
                    rows={4}
                    value={`<a href="https://indihunt.in/products/${product.id}" target="_blank">\n  <img src="https://indihunt.in/t/embed?id=${product.id}&style=classic" alt="Featured on IndiHunt" width="250" height="54" />\n</a>`}
                    className="w-full bg-background border border-border rounded-xl p-3 text-[10px] font-mono text-muted-foreground focus:outline-none resize-none"
                    onClick={(e) => {
                      (e.target as any).select();
                      navigator.clipboard?.writeText((e.target as any).value);
                      toast.success("Embed badge code copied to clipboard!");
                    }}
                  />
                  <p className="text-[9px] text-muted-foreground italic">Click box content to copy snippet.</p>
                </div>

              </div>
            </div>
          )}

          {/* 4. SELF ADVERTISING TAB */}
          {activeTab === "advertising" && (
            <div className="max-w-4xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Self Advertising for {product.name}</h3>
                  <p className="text-xs text-muted-foreground">Promote your product dynamically across high-traffic placement zones on IndiHunt.</p>
                </div>
                <button
                  onClick={() => setShowLaunchAdModal(true)}
                  className="bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/10 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Launch Ad Campaign</span>
                </button>
              </div>

              {productCampaigns.length === 0 ? (
                <div className="text-center py-16 px-4 bg-card border border-border/80 rounded-3xl space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-xl">📣</div>
                  <h4 className="text-base font-semibold text-foreground">Advertise {product.name}</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Set up CPC/CPM campaigns and dynamically get featured right below product galleries, discussions, newsletter issues, and more.
                  </p>
                  <button 
                    onClick={() => setShowLaunchAdModal(true)}
                    className="bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer inline-block"
                  >
                    Create Your First Ad
                  </button>
                </div>
              ) : (
                <div className="space-y-6 pt-4 border-t border-border/40">
                  {productCampaigns.map((camp) => {
                    const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : "0.00";
                    return (
                      <div key={camp.id} className="bg-card border border-border p-6 rounded-3xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-4">
                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Campaign ID</span>
                            <h4 className="text-xs font-mono font-semibold text-foreground mt-0.5">#{camp.id.substring(0, 8)}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                              camp.status === "active" 
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15" 
                                : camp.status === "paused"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                                : camp.status === "paused_by_admin"
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/15"
                                : camp.status === "pending_payment" || camp.status === "draft"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}>
                              {camp.status === "paused_by_admin" 
                                ? "Paused by Admin" 
                                : camp.status === "pending_payment"
                                ? "Payment Pending"
                                : camp.status === "draft"
                                ? "Draft (Pending)"
                                : camp.status}
                            </span>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/campaigns/${camp.id}`}
                                className="p-1.5 border border-border bg-background hover:bg-muted text-foreground rounded-lg transition-all cursor-pointer flex items-center justify-center"
                                title="View Performance Charts"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              {camp.status === "pending_payment" || camp.status === "draft" ? (
                                <Link
                                  href={`/ads?product_id=${product.id}`}
                                  className="px-3 py-1.5 bg-[#ff5733] hover:bg-[#e64a19] text-white text-[10px] font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                  title="Complete payment on Ads page to activate ad"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Pay Now</span>
                                </Link>
                              ) : camp.status === "paused_by_admin" ? (
                                <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-medium rounded-lg">
                                  Paused by team
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleUpdateAdStatus(camp.id, camp.status)}
                                  className="px-3 py-1.5 border border-border bg-background hover:bg-muted text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                                >
                                  {camp.status === "active" ? "Pause" : "Resume"}
                                </button>
                              )}
                              {/* Trash icon and Add Budget button completely removed for all users as requested */}
                            </div>
                          </div>
                        </div>

                        {/* Ad Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">CTA Button</span>
                            <span className="text-xs font-medium text-foreground block mt-1">{camp.cta_text}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Daily Budget Limit</span>
                            <span className="text-xs font-medium text-foreground block mt-1">₹{camp.daily_limit}/day</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Delivery Target</span>
                            <span className="text-xs font-medium text-foreground block mt-1">{camp.target_impressions?.toLocaleString() || "Standard"} imps</span>
                          </div>
                        </div>

                        {/* Analytics Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 bg-muted/20 border border-border/80 p-4 rounded-2xl">
                          <div>
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest block">Total Budget</span>
                            <span className="text-sm font-bold text-foreground block mt-0.5">₹{camp.total_budget}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest block">Delivered</span>
                            <span className="text-sm font-bold text-orange-500 block mt-0.5">{camp.delivered_impressions || camp.impressions || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest block">Impressions</span>
                            <span className="text-sm font-bold text-foreground block mt-0.5">{camp.impressions}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest block">Clicks</span>
                            <span className="text-sm font-bold text-foreground block mt-0.5">{camp.clicks}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest block">CTR</span>
                            <span className="text-sm font-bold text-foreground block mt-0.5">{ctr}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Launch Ad Modal */}
              {showLaunchAdModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => setShowLaunchAdModal(false)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg focus:outline-none"
                    >
                      ✕
                    </button>
                    <h3 className="text-base font-semibold text-foreground">Launch Self Ad Campaign</h3>
                    
                    <form onSubmit={handleLaunchAd} className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1">CTA text</label>
                        <select
                          value={adCta}
                          onChange={(e) => setAdCta(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-orange-500"
                        >
                          {["Visit Product", "Learn More", "Try Now", "Install", "Open"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1">Total Budget (₹)</label>
                            <input
                              type="number"
                              min={350}
                              value={adTotalBudget}
                              onChange={(e) => setAdTotalBudget(Number(e.target.value))}
                              className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-semibold text-orange-500 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1">Daily Limit (₹)</label>
                            <input
                              type="number"
                              min={10}
                              value={adDailyLimit}
                              onChange={(e) => setAdDailyLimit(Number(e.target.value))}
                              className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                          🔒 <strong>Dodo Payments Checkout:</strong> Ad campaigns are processed securely via Dodo Payments (UPI, Cards, NetBanking). Budget and impressions are activated automatically upon successful payment.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAd}
                        className="w-full py-2.5 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center"
                      >
                        {isSubmittingAd ? "Connecting to Dodo Payments..." : `Pay ₹${adTotalBudget} & Launch Campaign`}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* 4. REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Product Reviews & Sentiment</h3>
                <p className="text-xs text-muted-foreground">Monitor what the community has to say about your launch.</p>
              </div>

              <div className="bg-card border border-border p-8 rounded-3xl text-center space-y-2">
                <div className="text-2xl">✨</div>
                <h4 className="text-xs font-semibold text-foreground">Reviews analytics arriving soon</h4>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Sentiment analytics and direct reviews tracking will go live once this product accumulates more feedback.
                </p>
              </div>
            </div>
          )}

          {/* 5. NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Email & Push Notifications</h3>
                <p className="text-xs text-muted-foreground">Control how you receive alerts related to {product.name}.</p>
              </div>

              <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">Product Upvote Alerts</span>
                    <span className="text-[10px] text-muted-foreground">Send an email notification daily summarizing upvote dynamics.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#ff5733] w-4 h-4 rounded mt-1" />
                </div>

                <div className="flex items-start justify-between gap-4 pt-4 border-t border-border">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">Comments & Discussions</span>
                    <span className="text-[10px] text-muted-foreground">Receive instant alerts whenever a user posts a comment on your launch page.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#ff5733] w-4 h-4 rounded mt-1" />
                </div>

                <div className="flex items-start justify-between gap-4 pt-4 border-t border-border">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">Co-maker Invites & Mentions</span>
                    <span className="text-[10px] text-muted-foreground">Alert me when teammates make updates to this product details.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#ff5733] w-4 h-4 rounded mt-1" />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                    toast.success("Notification preferences saved!", { description: "Your alert settings have been updated." });
                  }}
                  className="px-5 py-2.5 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/10"
                >
                  Save settings
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
