"use client";


import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Layers,
  MessageSquare,
  Rocket,
  Globe,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle,
  Upload,
  UserPlus,
  Tag,
  DollarSign,
  Play,
  Monitor,
  Info,
  X,
  Search,
  Bot,
  Zap,
  Cloud,
  Code,
  Palette,
  Plus
} from "lucide-react";
import {
  supabase,
  checkProductUrlExists,
  submitProduct,
  createThread,
  fetchUrlMetadata,
  uploadImage,
  submitProductInvestorDetails,
  submitProductShoutouts,
  getProducts,
  getUserProfile,
  addComment,
  Profile,
  getProductSlug,
  Product,
  searchUsersByEmailVector,
  getLaunchTags,
  LaunchTag,
  SEED_LAUNCH_TAGS
} from "@/lib/supabase";
import { CircularLoader } from "@/components/CircularLoader";
import DatePickerModal from "@/components/DatePickerModal";
import SuccessScheduledModal from "@/components/SuccessScheduledModal";
import Navbar from "@/components/Navbar";
export const ALL_AVAILABLE_TAGS = SEED_LAUNCH_TAGS.map(t => t.name);


export const DEV_COMPANIES: { id: string; name: string; tagline: string; logo_url: string }[] = [];

type Step = "main-info" | "media" | "makers" | "shoutouts" | "investors" | "extras" | "checklist";

function NewLaunchWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams ? searchParams.get("type") : null;
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"product" | "thread">("product");

  // Open Source & Student states
  const [isOpenSource, setIsOpenSource] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [isStudentProject, setIsStudentProject] = useState(false);
  const [school, setSchool] = useState("");
  const [isIndianProduct, setIsIndianProduct] = useState(false);
  const [fundingType, setFundingType] = useState<"bootstrapped" | "y_combinator" | "venture_backed">("bootstrapped");

  useEffect(() => {
    if (typeParam === "thread") {
      setActiveTab("thread");
    } else {
      setActiveTab("product");
      if (typeParam === "opensource") {
        setIsOpenSource(true);
      } else if (typeParam === "student") {
        setIsStudentProject(true);
      }
    }
  }, [typeParam]);

  const [isUrlSubmitted, setIsUrlSubmitted] = useState(false);

  // Wizard active step
  const [activeStep, setActiveStep] = useState<Step>("main-info");

  // Step 1: Main Info
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitName, setSubmitName] = useState("");
  const [submitTagline, setSubmitTagline] = useState("");
  const [submitDesc, setSubmitDesc] = useState("");
  const [launchTags, setLaunchTags] = useState<string[]>([]);
  const [dbLaunchTags, setDbLaunchTags] = useState<LaunchTag[]>([]);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [firstComment, setFirstComment] = useState("");
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Step 2: Media
  const [submitLogo, setSubmitLogo] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([""]);
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState<{ [key: number]: boolean }>({});
  const [videoUrl, setVideoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [additionalUrls, setAdditionalUrls] = useState<string[]>([]);
  const [xUsername, setXUsername] = useState("");

  // Shoutouts State
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [shoutouts, setShoutouts] = useState<{ shouted_product_id: string; shouted_product_name: string; note: string }[]>([]);
  const [shoutoutSearch, setShoutoutSearch] = useState("");
  const [showShoutoutSearchDropdown, setShowShoutoutSearchDropdown] = useState<number | null>(null); // holds index of shoutout input currently searching

  // Investor details State
  const [investorWhyTeam, setInvestorWhyTeam] = useState("");
  const [investorWhyIdea, setInvestorWhyIdea] = useState("");
  const [investorCompetitors, setInvestorCompetitors] = useState("");
  const [investorRevenue, setInvestorRevenue] = useState("");
  const [investorAnythingElse, setInvestorAnythingElse] = useState("");

  // Scheduling modals State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSuccessScheduledOpen, setIsSuccessScheduledOpen] = useState(false);
  const [scheduledLaunchDate, setScheduledLaunchDate] = useState<Date | undefined>(undefined);
  const [newCreatedProductId, setNewCreatedProductId] = useState<string | null>(null);
  const [newCreatedProductSlug, setNewCreatedProductSlug] = useState<string | null>(null);

  // Step 3: Makers
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workedOnLaunch, setWorkedOnLaunch] = useState<"yes" | "no">("no");
  const [coMakersProfiles, setCoMakersProfiles] = useState<Profile[]>([]);
  const [makerSearch, setMakerSearch] = useState("");
  const [makerResults, setMakerResults] = useState<Profile[]>([]);
  const [isSearchingMakers, setIsSearchingMakers] = useState(false);

  // Scroll to top when active wizard step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeStep]);

  // Guard against navigating to maker-only steps if user didn't work on launch
  useEffect(() => {
    if (workedOnLaunch !== "yes" && (activeStep === "shoutouts" || activeStep === "investors" || activeStep === "extras")) {
      setActiveStep("checklist");
    }
  }, [workedOnLaunch, activeStep]);

  // Step 4: Extras
  const [pricingType, setPricingType] = useState<"free" | "paid" | "paid_trial">("free");
  const [promoOffer, setPromoOffer] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoExpiry, setPromoExpiry] = useState("");

  // Step 5: Thread Form (Separate)
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadCategory, setThreadCategory] = useState("General");

  // step drafts state
  const [draftProducts, setDraftProducts] = useState<any[]>([]);

  // General feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auth checking & draft loading
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    client.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setUser(session.user);

        // Fetch User Profile
        getUserProfile(session.user.id).then((prof) => {
          if (prof) setProfile(prof);
        });

        // Load in-progress drafts
        fetch(`/t/products?userId=${session.user.id}`)
          .then(res => res.json())
          .then(resData => {
            const list = resData.data || resData.products;
            if (Array.isArray(list)) setDraftProducts(list.filter((p: any) => p.status === 'draft'));
          });
      }
    });

    getLaunchTags().then(tags => {
      if (tags && tags.length > 0) setDbLaunchTags(tags);
    });
  }, [router]);

  useEffect(() => {
    const loadShoutoutProducts = async () => {
      const dbProducts = await getProducts();
      const merged: any[] = [...dbProducts];
      DEV_COMPANIES.forEach((comp) => {
        if (!merged.some(p => p.name.toLowerCase() === comp.name.toLowerCase())) {
          merged.push(comp);
        }
      });
      setAllProducts(merged);
    };

    loadShoutoutProducts();
  }, []);

  useEffect(() => {
    if (!makerSearch.trim()) {
      setMakerResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingMakers(true);
      try {
        const results = await searchUsersByEmailVector(makerSearch);
        setMakerResults(results);
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setIsSearchingMakers(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [makerSearch]);

  const handleAddCoMaker = (profile: Profile) => {
    if (coMakersProfiles.find(p => p.id === profile.id) || profile.id === user?.id) {
      setMakerSearch("");
      setMakerResults([]);
      return;
    }
    setCoMakersProfiles(prev => [...prev, profile]);
    setMakerSearch("");
    setMakerResults([]);
  };

  const handleRemoveCoMaker = (profileId: string) => {
    setCoMakersProfiles(prev => prev.filter(p => p.id !== profileId));
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitUrl) {
      setErrorMsg("Please enter a product URL link first!");
      return;
    }

    // Auto-fix protocol if missing
    let urlToCheck = submitUrl.trim();
    if (!urlToCheck.startsWith("http://") && !urlToCheck.startsWith("https://")) {
      urlToCheck = "https://" + urlToCheck;
      setSubmitUrl(urlToCheck);
    }

    let isValidUrl = true;
    try {
      const parsedUrl = new URL(urlToCheck);
      if (!parsedUrl.hostname.includes('.') && parsedUrl.hostname !== 'localhost') {
        isValidUrl = false;
      }
    } catch (_) {
      isValidUrl = false;
    }

    if (!isValidUrl) {
      setErrorMsg("Please enter a valid product link!");
      return;
    }

    setIsFetchingMetadata(true);
    setErrorMsg("");

    try {
      // 1. Check if product already exists (across Supabase DB and local store)
      const duplicateCheck = await checkProductUrlExists(urlToCheck);
      if (duplicateCheck.exists) {
        setErrorMsg(duplicateCheck.message || "This product has already been launched on IndiHunt!");
        setIsFetchingMetadata(false);
        return;
      }
      // Fetch metadata mock simulation
      const meta = await fetchUrlMetadata(urlToCheck);
      if (meta) {
        setSubmitName(meta.name);
        setSubmitTagline(meta.tagline);
        setSubmitDesc(meta.description);
        setSubmitLogo(meta.logo_url);
      }
      setIsUrlSubmitted(true);
    } catch (err: any) {
      console.error(err);
      // Fallback: still proceed but with custom name
      const nameGuess = urlToCheck.replace(/https?:\/\/(www\.)?/, '').split('.')[0];
      setSubmitName(nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1));
      setIsUrlSubmitted(true);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleResumeDraft = (draft: any) => {
    setSubmitUrl(draft.website_url || "");
    setSubmitName(draft.name || "");
    setSubmitTagline(draft.tagline || "");
    setSubmitDesc(draft.description || "");
    setSubmitLogo(draft.logo_url || "");
    setPricingType(draft.pricing_type || "free");
    setPromoOffer(draft.promo_offer || "");
    setPromoCode(draft.promo_code || "");
    setPromoExpiry(draft.promo_expiry || "");
    setVideoUrl(draft.video_url || "");
    setDemoUrl(draft.demo_url || "");
    setIsIndianProduct(draft.country === "India");
    if (draft.screenshots && draft.screenshots.length > 0) {
      setGalleryImages(draft.screenshots);
    }
    setIsUrlSubmitted(true);
  };

  // Add gallery image input
  const addGalleryInput = () => {
    setGalleryImages([...galleryImages, ""]);
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    let score = 0;
    let total = 7;

    if (submitName.trim()) score++;
    if (submitTagline.trim()) score++;
    if (submitDesc.trim()) score++;
    if (submitLogo.trim()) score++;
    if (galleryImages.filter(img => img.trim() !== "").length > 0) score++;
    if (submitUrl.trim()) score++;
    if (launchTags.length > 0) score++;

    return Math.round((score / total) * 100);
  };

  // Check required fields
  const getValidationErrors = () => {
    const errors: string[] = [];
    if (!submitUrl.trim()) errors.push("Product URL link is required");
    if (!submitName.trim()) errors.push("Product name is required");
    if (!submitTagline.trim()) errors.push("Product tagline is required");
    if (!submitDesc.trim()) errors.push("Description is required");
    if (launchTags.length === 0) errors.push("At least 1 launch tag is required");
    if (!submitLogo.trim()) errors.push("Thumbnail (Logo) is required");
    if (galleryImages.filter(g => g.trim() !== "").length === 0) {
      errors.push("Add images to the gallery is required");
    }
    return errors;
  };

  const handleLaunchProduct = async (status: "live" | "draft" | "scheduled", customScheduledDate?: Date) => {
    const validation = getValidationErrors();
    if (validation.length > 0) {
      setErrorMsg(`Please resolve required errors: ${validation.join(", ")}`);
      setActiveStep("checklist");
      return;
    }

    if (!user) return;
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // Fast duplicate check before launch submission
      const duplicateCheck = await checkProductUrlExists(submitUrl);
      if (duplicateCheck.exists) {
        setErrorMsg(duplicateCheck.message || "This product has already been launched on IndiHunt!");
        setActiveStep("main-info");
        setIsSubmitting(false);
        return;
      }

      const activeGallery = galleryImages.filter(g => g.trim() !== "");
      const newProd = await submitProduct({
        name: submitName,
        tagline: submitTagline,
        description: submitDesc,
        website_url: submitUrl,
        logo_url: submitLogo,
        screenshots: activeGallery.length > 0 ? activeGallery : ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=450&q=80"],
        maker_id: user.id,
        pricing_type: pricingType,
        promo_offer: promoOffer || undefined,
        promo_code: promoCode || undefined,
        promo_expiry: promoExpiry || undefined,
        video_url: videoUrl || undefined,
        demo_url: demoUrl || undefined,
        status: status,
        scheduled_for: status === "scheduled" ? (customScheduledDate ? customScheduledDate.toISOString() : new Date(Date.now() + 86400000 * 2).toISOString()) : undefined,
        makers: coMakersProfiles.map(p => p.id),
        worked_on_launch: workedOnLaunch === "yes",
        funding_type: fundingType,
        is_open_source: isOpenSource,
        github_url: githubUrl.trim() || undefined,
        is_student_project: isStudentProject,
        school: isStudentProject ? school : undefined,
        additional_urls: additionalUrls.filter(u => u.trim() !== ""),
        twitter_url: xUsername ? `https://x.com/${xUsername.trim().replace(/^@/, '')}` : undefined,
        tags: launchTags,
        country: isIndianProduct ? "India" : "Global"
      }, user.id);

      if (newProd) {
        const prodSlug = getProductSlug(newProd.name);

        // Seed pre-launch and product cache immediately so the pre-launch dashboard renders in 0ms
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('ih_prelaunch_seed', JSON.stringify(newProd));
            localStorage.setItem(`ih_product_${newProd.id}`, JSON.stringify(newProd));
            if (prodSlug) localStorage.setItem(`ih_product_${prodSlug}`, JSON.stringify(newProd));
            window.dispatchEvent(new CustomEvent('ih_scheduled_product_updated', { detail: newProd }));
          } catch {}
        }

        // Run secondary submissions (comment, investor info, shoutouts, email) in parallel to cut latency by >70%
        const backgroundTasks: Promise<any>[] = [];

        if (firstComment.trim()) {
          backgroundTasks.push(addComment(newProd.id, user.id, firstComment.trim()).catch(e => console.error("Error adding initial comment:", e)));
        }

        if (workedOnLaunch === "yes" && (investorWhyTeam || investorWhyIdea || investorCompetitors || investorRevenue || investorAnythingElse)) {
          backgroundTasks.push(submitProductInvestorDetails({
            product_id: newProd.id,
            why_team: investorWhyTeam || undefined,
            why_idea: investorWhyIdea || undefined,
            competitors: investorCompetitors || undefined,
            revenue: investorRevenue || undefined,
            anything_else: investorAnythingElse || undefined
          }).catch(e => console.error("Error submitting investor details:", e)));
        }

        if (workedOnLaunch === "yes" && shoutouts.length > 0) {
          backgroundTasks.push(submitProductShoutouts(
            newProd.id,
            shoutouts.map(s => ({
              shouted_product_id: s.shouted_product_id,
              name: s.shouted_product_name,
              logo_url: allProducts.find(p => p.id === s.shouted_product_id || p.name === s.shouted_product_name)?.logo_url,
              note: s.note
            }))
          ).catch(e => console.error("Error submitting shoutouts:", e)));
        }

        if (user && user.email) {
          fetch('/t/send-email/launch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              to: user.email,
              productName: newProd.name,
              productSlug: prodSlug,
              makerName: user.user_metadata?.full_name || user.email.split('@')[0]
            })
          }).catch(e => console.error("Error sending launch email:", e));
        }

        // Wait for auxiliary records to settle concurrently
        if (backgroundTasks.length > 0) {
          await Promise.allSettled(backgroundTasks);
        }

        if (status === "scheduled") {
          setNewCreatedProductId(newProd.id);
          setNewCreatedProductSlug(prodSlug);
          // Prefetch pre-launch dashboard so it loads instantly on modal close
          const prelaunchTarget = prodSlug ? `/products/${prodSlug}/pre-launch` : `/products/${newProd.id}/pre-launch`;
          router.prefetch(prelaunchTarget);
          setIsSuccessScheduledOpen(true);
        } else {
          router.push(`/products/${prodSlug}?launched=true`);
        }
      } else {
        setErrorMsg("Failed to submit product launch.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const newThread = await createThread({
        title: threadTitle,
        body: threadBody,
        category: threadCategory,
        user_id: user.id
      }, user.id);

      if (newThread) {
        router.push("/");
      } else {
        setErrorMsg("Failed to create thread.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <span className="text-sm font-medium animate-pulse text-muted-foreground">Checking authentication...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <Navbar />

      {/* Mini-Header */}
      <header className="sticky top-0 z-40 w-full  bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Creator Wizard</span>
          </div>
        </div>
      </header>

      {!isUrlSubmitted ? (
        /* Split screen: 60% left for visuals/image, 40% right for form/loader */
        <main className="min-h-[calc(100vh-4rem)] w-full flex flex-col lg:flex-row overflow-hidden">

          {/* Left Visual: 60% width */}
          <div className="lg:w-[60%] w-full min-h-[300px] lg:min-h-0 relative overflow-hidden bg-muted border-r border-border flex flex-col justify-end p-8 sm:p-12">
            <Image
              src="/pattern.webp"
              alt="Geometric abstract pattern background"
              fill
              priority
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent z-10 flex flex-col justify-end p-8 sm:p-12">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#ff5733] mb-2">IndiHunt Creator Studio</span>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">Bring your ideas to life</h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                Launch your product or start a discussion with a community of thousands of developers, designers, and creators in India.
              </p>
            </div>
          </div>

          {/* Right Content/Form: 40% width */}
          <div className="lg:w-[40%] w-full flex flex-col justify-center p-6 sm:p-12 overflow-y-auto bg-background">
            {isFetchingMetadata ? (
              /* Loader nested inside 40% form area */
              <div className="flex flex-col items-center justify-center gap-4 text-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-[#ff5733] border-t-transparent animate-spin mb-2"></div>
                <h2 className="text-lg font-bold text-foreground animate-pulse">Analyzing the product...</h2>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  IndiHunt is gathering page metadata, assets, tags, and product specifications.
                </p>
              </div>
            ) : activeTab === "thread" ? (
              /* Discussion Thread Form */
              <form onSubmit={handleLaunchThread} className="space-y-5">
                <div>
                  <DialogTitle className="text-xl font-bold mb-1">Create Discussion Thread</DialogTitle>
                  <p className="text-xs text-muted-foreground mb-4">Start a conversation with developers and founders.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Category</label>
                  <select
                    value={threadCategory}
                    onChange={(e) => setThreadCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500"
                  >
                    <option value="General">💬 General Discussion</option>
                    <option value="Ask">🤔 Ask the Community</option>
                    <option value="Ideas">💡 Sharing Ideas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Thread Title</label>
                  <input
                    type="text"
                    required
                    placeholder="What is your best tip for launching regional tech?"
                    value={threadTitle}
                    onChange={(e) => setThreadTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Details (Body)</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Describe your thoughts or question..."
                    value={threadBody}
                    onChange={(e) => setThreadBody(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl cursor-pointer hover:shadow-lg transition-all"
                >
                  {isSubmitting ? "Posting..." : "Create Thread"}
                </button>
              </form>
            ) : (
              /* URL Submit Form */
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Submit a product</h1>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Found a cool product you want everyone to know about? Or maybe you made one yourself and want the world to know about it? You&apos;re in the right place.
                  </p>
                </div>

                <form onSubmit={handleUrlSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Link to the product</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. www.producthunt.com"
                      value={submitUrl}
                      onChange={(e) => setSubmitUrl(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isFetchingMetadata}
                    className="w-full py-3 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl cursor-pointer hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Get started</span>
                  </button>
                </form>

                {draftProducts.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-4">
                    <span className="block mb-2 font-medium">Your existing in progress posts:</span>
                    <div className="flex flex-wrap gap-2">
                      {draftProducts.map((draft, idx) => (
                        <button
                          key={draft.id || idx}
                          onClick={() => handleResumeDraft(draft)}
                          className="px-2.5 py-1 bg-muted border border-border rounded-lg text-[#ff5733] font-semibold hover:underline cursor-pointer transition-all text-[11px]"
                        >
                          {draft.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Multi-Step Wizard Layout */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8 sm:pt-12">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 space-y-2 h-fit">
              <div className="p-3.5 mb-3 bg-card border border-border/70 rounded-2xl flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-border/80 bg-muted flex-shrink-0 flex items-center justify-center shadow-xs">
                  {submitLogo ? (
                    <Image
                      src={submitLogo}
                      alt=""
                      className="w-full h-full object-cover"
                    width={48} height={48} />
                  ) : (
                    <span className="text-sm font-bold text-[#ff5733]">
                      {submitName ? submitName.charAt(0).toUpperCase() : "🚀"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground block truncate">
                    {submitName || "Your launch"}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center font-normal uppercase tracking-wider mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5 flex-shrink-0" />
                    Status: In progress
                  </span>
                </div>
              </div>

              {[
                { id: "main-info", label: "Main info", icon: Rocket, bg: "bg-orange-500/15 dark:bg-orange-500/20", color: "text-[#ff5733]", border: "border-orange-500/30" },
                { id: "media", label: "Images and media", icon: Monitor, bg: "bg-sky-500/15 dark:bg-sky-500/20", color: "text-sky-500", border: "border-sky-500/30" },
                { id: "makers", label: "Makers", icon: UserPlus, bg: "bg-purple-500/15 dark:bg-purple-500/20", color: "text-purple-500", border: "border-purple-500/30" },
                ...(workedOnLaunch === "yes" ? [
                  { id: "shoutouts", label: "Shoutouts", icon: MessageSquare, bg: "bg-emerald-500/15 dark:bg-emerald-500/20", color: "text-emerald-500", border: "border-emerald-500/30" },
                  { id: "investors", label: "Connect with Investors", icon: DollarSign, bg: "bg-amber-500/15 dark:bg-amber-500/20", color: "text-amber-500", border: "border-amber-500/30" },
                  { id: "extras", label: "Extras", icon: Tag, bg: "bg-pink-500/15 dark:bg-pink-500/20", color: "text-pink-500", border: "border-pink-500/30" },
                ] : []),
                { id: "checklist", label: "Launch checklist", icon: CheckCircle, bg: "bg-teal-500/15 dark:bg-teal-500/20", color: "text-teal-500", border: "border-teal-500/30" }
              ].map((step) => {
                const Icon = step.icon;
                const active = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id as Step)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-left transition-all cursor-pointer ${active
                      ? "bg-card text-foreground border border-border shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${step.bg} ${step.color} border ${step.border} flex items-center justify-center flex-shrink-0 transition-transform ${active ? "scale-105 shadow-xs" : "opacity-80"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold">{step.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Panels Container (No card background/borders, maximum width) */}
            <div className="lg:col-span-9 space-y-6">

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 text-xs mb-6 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeStep === "main-info" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Tell us more about this launch</h3>
                    <p className="text-xs text-muted-foreground">We'll need its name, tagline, links, launch tags, and description.</p>
                  </div>

                  <div className="space-y-5">
                    {/* Name of the launch */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Name of the launch</label>
                        <span className="text-[10px] font-semibold text-muted-foreground">{submitName.length}/40</span>
                      </div>
                      <input
                        type="text"
                        maxLength={40}
                        placeholder="e.g. Velocis Tracker"
                        value={submitName}
                        onChange={(e) => setSubmitName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Tagline */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tagline</label>
                        <span className="text-[10px] font-semibold text-muted-foreground">{submitTagline.length}/60</span>
                      </div>
                      <input
                        type="text"
                        maxLength={60}
                        placeholder="Concise and descriptive tagline for the launch"
                        value={submitTagline}
                        onChange={(e) => setSubmitTagline(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="border-t border-border/60 my-4" />

                    {/* Links Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Links</h4>

                      {/* Primary Link */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Links to the launch</label>
                        <div className="relative">
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={submitUrl}
                            onChange={(e) => setSubmitUrl(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500"
                          />
                          {isFetchingMetadata && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground animate-pulse font-medium">
                              Fetching...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Additional Links */}
                      {additionalUrls.map((url, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="url"
                            placeholder="https://appstore.com/your-app"
                            value={url}
                            onChange={(e) => {
                              const updated = [...additionalUrls];
                              updated[idx] = e.target.value;
                              setAdditionalUrls(updated);
                            }}
                            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAdditionalUrls(additionalUrls.filter((_, i) => i !== idx));
                            }}
                            className="w-10 h-10 flex items-center justify-center border border-border rounded-xl hover:bg-muted text-muted-foreground text-sm cursor-pointer transition-colors"
                          >
                            -
                          </button>
                        </div>
                      ))}

                      {/* Add more links button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setAdditionalUrls([...additionalUrls, ""])}
                          className="text-xs font-semibold text-[#ff5733] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>+ Add more links</span>
                          <span className="text-[10px] text-muted-foreground font-normal">"App Store, Google Play, Steam, Amazon..."</span>
                        </button>
                      </div>

                      {/* Indian Product Checkbox */}
                      <div className="pt-2">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isIndianProduct}
                            onChange={(e) => setIsIndianProduct(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-orange-500 focus:ring-orange-500/25 bg-background cursor-pointer"
                          />
                          <span className="text-xs font-medium text-foreground">Is this a Made in India product?</span>
                        </label>
                      </div>

                      {/* Open Source Checkbox */}
                      <div className="pt-2">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isOpenSource}
                            onChange={(e) => setIsOpenSource(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-orange-500 focus:ring-orange-500/25 bg-background cursor-pointer"
                          />
                          <span className="text-xs font-medium text-foreground">Is this an open source project?</span>
                        </label>
                      </div>

                      {/* Github Repository URL */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">GitHub Repository URL</label>
                        <input
                          type="url"
                          placeholder="https://github.com/username/repo"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Student Project Checkbox */}
                      <div className="pt-2">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isStudentProject}
                            onChange={(e) => setIsStudentProject(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-orange-500 focus:ring-orange-500/25 bg-background cursor-pointer"
                          />
                          <span className="text-xs font-medium text-foreground">Is this a student project?</span>
                        </label>
                      </div>

                      {/* College / School name */}
                      {isStudentProject && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">School / College Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Stanford University"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      )}

                      {/* X account */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">X account of the launch</label>
                        <div className="flex rounded-xl overflow-hidden border border-border focus-within:border-orange-500 bg-background">
                          <span className="bg-muted px-4 py-2.5 text-sm text-muted-foreground border-r border-border font-normal select-none flex items-center">
                            x.com/
                          </span>
                          <input
                            type="text"
                            placeholder="username"
                            value={xUsername}
                            onChange={(e) => setXUsername(e.target.value)}
                            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Funding Information */}

                    </div>

                    <div className="border-t border-border/60 my-4" />

                    {/* Description Section */}
                    <div>
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-foreground mb-0.5">Description</h4>
                        <p className="text-[10px] text-muted-foreground">What's new or different about your launch compared to existing products? Which features...</p>
                      </div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Description of the launch</label>
                        <span className="text-[10px] font-semibold text-muted-foreground">{submitDesc.length}/500</span>
                      </div>
                      <textarea
                        rows={5}
                        maxLength={500}
                        placeholder="Describe what your product accomplishes..."
                        value={submitDesc}
                        onChange={(e) => setSubmitDesc(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>

                    <div className="border-t border-border/60 my-4" />

                    {/* Launch tags */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <span>Launch tags</span>
                          <span className="text-red-500 font-semibold text-xs">* (Required)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setTagSearchQuery("");
                            setIsTagsModalOpen(true);
                          }}
                          className="text-xs font-semibold text-[#ff5733] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>View all tags</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-3">Select 1 to 3 launch tags for your product launch</p>
                      {launchTags.length === 0 && (
                        <div className="bg-muted/60 border border-border text-muted-foreground p-2.5 rounded-xl text-xs flex items-center gap-2 mb-3">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                          <span>At least 1 launch tag is required to publish this launch.</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set([
                          ...launchTags,
                          ...(dbLaunchTags.length > 0
                            ? dbLaunchTags.filter(t => t.is_popular).map(t => t.name)
                            : ["AI", "AI Agents", "AI Coding Agents", "LLM", "Chat Model", "Deployment", "Hosting", "Productivity", "Developer Tools", "SaaS", "Fintech", "Design", "Marketing", "Analytics", "Security", "Open Source"])
                        ])).map(tag => {
                          const active = launchTags.includes(tag);
                          const getWizardTagIcon = (tagName: string) => {
                            const t = tagName.toLowerCase();
                            if (t.includes("ai") || t.includes("artificial") || t.includes("gpt") || t.includes("bot") || t.includes("llm")) {
                              return <Bot className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />;
                            }
                            if (t.includes("product") || t.includes("task") || t.includes("work") || t.includes("todo")) {
                              return <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
                            }
                            if (t.includes("assistant") || t.includes("virtual") || t.includes("agent") || t.includes("chat") || t.includes("model")) {
                              return <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />;
                            }
                            if (t.includes("dev") || t.includes("code") || t.includes("git") || t.includes("tech")) {
                              return <Code className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
                            }
                            if (t.includes("deploy") || t.includes("host") || t.includes("server") || t.includes("infra")) {
                              return <Rocket className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
                            }
                            if (t.includes("saas") || t.includes("cloud") || t.includes("software")) {
                              return <Cloud className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />;
                            }
                            if (t.includes("design") || t.includes("ui") || t.includes("ux") || t.includes("art")) {
                              return <Palette className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />;
                            }
                            return <Tag className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />;
                          };
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                if (active) {
                                  setLaunchTags(launchTags.filter(t => t !== tag));
                                } else if (launchTags.length < 3) {
                                  setLaunchTags([...launchTags, tag]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${active
                                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs font-bold"
                                : "bg-background border-border text-muted-foreground hover:border-border/80"
                                }`}
                            >
                              {getWizardTagIcon(tag)}
                              <span>{tag}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-border/60 my-4" />

                    {/* Write the first comment */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Write the first comment</label>
                      <p className="text-[10px] text-muted-foreground mb-3">This comment will be posted upon launch. Adding a first comment is essential to get the discussion started.</p>
                      <textarea
                        rows={6}
                        placeholder="Welcome to our launch! Ask us anything..."
                        value={firstComment}
                        onChange={(e) => setFirstComment(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setActiveStep("media")}
                      className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer"
                    >
                      Next step: Media
                    </button>
                  </div>
                </div>
              )}

              {activeStep === "media" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Images and media</h3>
                    <p className="text-xs text-muted-foreground">Add visual resources to let users see how it works.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Thumbnail */}
                    <div className="bg-muted/30 border border-border p-5 rounded-2xl">
                      <span className="text-xs font-semibold text-foreground block mb-2">Thumbnail (Square Logo)</span>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center flex-shrink-0 relative">
                          {isUploadingLogo && !submitLogo ? (
                            <CircularLoader size="sm" />
                          ) : submitLogo ? (
                            <img src={submitLogo} alt="Logo preview" className="w-16 h-16 object-cover" />
                          ) : (
                            <Upload className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-2">
                          <input
                            type="url"
                            placeholder="Paste image logo URL"
                            value={submitLogo}
                            onChange={(e) => setSubmitLogo(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">Or upload:</span>
                            <label className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
                              <span className="py-1 px-2 rounded-md font-medium bg-orange-500/10 text-[#ff5733] hover:bg-orange-500/20 transition-colors">
                                {isUploadingLogo ? "Processing..." : "Choose File"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingLogo}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsUploadingLogo(true);
                                  // Instant optimistic local preview
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (reader.result) setSubmitLogo(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);

                                  try {
                                    const userId = user?.id || 'maker';
                                    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                    const path = `logo_${userId}_${Date.now()}_${sanitizedName}`;
                                    const url = await uploadImage("products", file, path, { type: 'icon', maxSizeBytes: 300 * 1024, maxDimension: 512 });
                                    if (url) {
                                      setSubmitLogo(url);
                                    }
                                  } catch (err) {
                                    console.error("Logo upload failed:", err);
                                  } finally {
                                    setIsUploadingLogo(false);
                                    e.target.value = "";
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-1">Recommended: 240x240px square JPG/PNG/GIF/WebP</span>
                        </div>
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Screenshots Gallery</label>
                        <label className="text-[10px] font-semibold text-[#ff5733] hover:underline cursor-pointer flex items-center gap-1 select-none">
                          {isUploadingMultiple ? "Processing..." : "+ Upload multiple"}
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            disabled={isUploadingMultiple}
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              setIsUploadingMultiple(true);

                              // Load instant previews for all chosen files
                              const localPreviews: string[] = [];
                              for (let i = 0; i < files.length; i++) {
                                await new Promise<void>((res) => {
                                  const r = new FileReader();
                                  r.onload = () => {
                                    if (r.result) localPreviews.push(r.result as string);
                                    res();
                                  };
                                  r.readAsDataURL(files[i]);
                                });
                              }

                              const currentImages = galleryImages.filter(img => img && img.trim() !== "");
                              setGalleryImages([...currentImages, ...localPreviews]);

                              try {
                                const userId = user?.id || 'maker';
                                const uploadPromises = Array.from(files).map(async (file, index) => {
                                  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                  const path = `screenshot_${userId}_${Date.now()}_${index}_${sanitizedName}`;
                                  const url = await uploadImage("products", file, path, { type: 'screenshot', maxSizeBytes: 800 * 1024, maxDimension: 1600 });
                                  return url || localPreviews[index];
                                });
                                const urls = await Promise.all(uploadPromises);
                                const validUrls = urls.filter((url): url is string => !!url);
                                if (validUrls.length > 0) {
                                  setGalleryImages([...currentImages, ...validUrls]);
                                }
                              } catch (error) {
                                console.error("Upload failed", error);
                              } finally {
                                setIsUploadingMultiple(false);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className={`flex flex-row flex-nowrap gap-4 overflow-x-auto pb-4 scrollbar-thin ${galleryImages.length <= 2 ? "justify-center" : ""}`}>
                        {galleryImages.map((img, idx) => (
                          <div key={idx} className="w-[220px] flex-shrink-0 relative group">
                            {img ? (
                              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border bg-black/5">
                                <img
                                  src={img}
                                  alt={`Screenshot ${idx + 1} Preview`}
                                  className="w-full h-full object-contain"
                                />
                                {galleryImages.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = galleryImages.filter((_, i) => i !== idx);
                                      setGalleryImages(updated);
                                    }}
                                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 hover:bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ) : (
                              <label className="w-full h-32 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-[10px] font-medium select-none bg-background cursor-pointer hover:border-orange-500 hover:text-orange-500 transition-colors">
                                {uploadingScreenshots[idx] ? (
                                  <div className="flex flex-col items-center gap-1.5">
                                    <CircularLoader size="sm" />
                                    <span>Processing...</span>
                                  </div>
                                ) : (
                                  <>
                                    + Upload
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={uploadingScreenshots[idx]}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploadingScreenshots(prev => ({ ...prev, [idx]: true }));

                                        // Instant local preview
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          if (reader.result) {
                                            const updated = [...galleryImages];
                                            updated[idx] = reader.result as string;
                                            setGalleryImages(updated);
                                          }
                                        };
                                        reader.readAsDataURL(file);

                                        try {
                                          const userId = user?.id || 'maker';
                                          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                          const path = `screenshot_${userId}_${Date.now()}_${idx}_${sanitizedName}`;
                                          const url = await uploadImage("products", file, path, { type: 'screenshot', maxSizeBytes: 800 * 1024, maxDimension: 1600 });
                                          if (url) {
                                            const updated = [...galleryImages];
                                            updated[idx] = url;
                                            setGalleryImages(updated);
                                          }
                                        } catch (err) {
                                          console.error("Screenshot upload error:", err);
                                        } finally {
                                          setUploadingScreenshots(prev => ({ ...prev, [idx]: false }));
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Extras links */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Video / Loom URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/... or https://loom.com/..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-foreground focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Interactive demo link (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://arcade.software/... or https://hexus.ai/..."
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-foreground focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-border">
                    <button
                      onClick={() => setActiveStep("main-info")}
                      className="px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setActiveStep("makers")}
                      className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer"
                    >
                      Next step: Makers
                    </button>
                  </div>
                </div>
              )}

              {activeStep === "makers" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Did you work on this launch?</h3>
                    <p className="text-xs text-muted-foreground">Let the community know your involvement.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="flex items-center justify-between bg-muted/20 border border-border/80 p-4 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="worked-launch"
                            checked={workedOnLaunch === "yes"}
                            onChange={() => setWorkedOnLaunch("yes")}
                            className="accent-[#ff5733]"
                          />
                          <div>
                            <span className="text-xs font-semibold text-foreground block">I worked on this product</span>
                            <span className="text-[10px] text-muted-foreground">You will be listed as both Hunter and Maker of this product</span>
                          </div>
                        </div>
                        {workedOnLaunch === "yes" && profile && (
                          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            <span className="text-[9px] bg-[#ff5733]/10 text-[#ff5733] font-semibold px-2 py-0.5 rounded-full border border-[#ff5733]/10">Maker</span>
                            <Image
                              src={profile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                              alt="Maker Avatar"
                              className="w-8 h-8 rounded-full object-cover border border-[#ff5733]/30"
                            width={32} height={32} />
                          </div>
                        )}
                      </label>

                      <label className="flex items-center justify-between bg-muted/20 border border-border/80 p-4 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="worked-launch"
                            checked={workedOnLaunch === "no"}
                            onChange={() => setWorkedOnLaunch("no")}
                            className="accent-[#ff5733]"
                          />
                          <div>
                            <span className="text-xs font-semibold text-foreground block">I didn&apos;t work on this product</span>
                            <span className="text-[10px] text-muted-foreground">You will be listed only as the Hunter of this product</span>
                          </div>
                        </div>
                        {workedOnLaunch === "no" && profile && (
                          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            <span className="text-[9px] bg-blue-500/10 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-500/10">Hunter</span>
                            <Image
                              src={profile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                              alt="Hunter Avatar"
                              className="w-8 h-8 rounded-full object-cover border border-blue-500/30"
                            width={32} height={32} />
                          </div>
                        )}
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Who else worked on this launch? (Co-makers)</label>
                      <p className="text-[10px] text-muted-foreground mb-3">Add co-makers to give your team credit. Search by email, name, or username.</p>
                      
                      {/* Added Co-Makers List */}
                      {coMakersProfiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {coMakersProfiles.map((maker) => (
                            <div key={maker.id} className="flex items-center gap-2 bg-card border border-border px-2.5 py-1 rounded-full shadow-sm">
                              <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                                {maker.avatar_url ? (
                                  <Image src={maker.avatar_url} alt={maker.full_name} className="w-full h-full object-cover" width={48} height={48} />
                                ) : (
                                  <span className="text-[9px] font-medium text-muted-foreground uppercase">{maker.full_name.charAt(0)}</span>
                                )}
                              </div>
                              <span className="text-xs font-medium text-foreground/90">{maker.full_name}</span>
                              <button type="button" onClick={() => handleRemoveCoMaker(maker.id)} className="ml-1 text-muted-foreground hover:text-rose-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={makerSearch}
                            onChange={(e) => setMakerSearch(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                          />
                          {isSearchingMakers && (
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                              <CircularLoader size="sm" />
                            </div>
                          )}
                        </div>

                        {/* Search Results Dropdown */}
                        {makerSearch.trim() && makerResults.length > 0 && (
                          <div className="absolute z-10 top-full left-0 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto overflow-x-hidden p-2 space-y-1">
                            {makerResults.map((userProfile) => (
                              <button
                                type="button"
                                key={userProfile.id}
                                onClick={() => handleAddCoMaker(userProfile)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors text-left"
                              >
                                <div className="w-7 h-7 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                                  {userProfile.avatar_url ? (
                                    <Image src={userProfile.avatar_url} alt={userProfile.full_name} className="w-full h-full object-cover" width={48} height={48} />
                                  ) : (
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">{userProfile.full_name.charAt(0)}</span>
                                  )}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-xs font-medium text-foreground truncate">{userProfile.full_name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate">{userProfile.work_email || userProfile.username}</span>
                                </div>
                                <div className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                  <UserPlus className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {makerSearch.trim() && !isSearchingMakers && makerResults.length === 0 && (
                          <div className="absolute z-10 top-full left-0 w-full mt-2 bg-card border border-border rounded-xl shadow-lg p-4 text-center">
                            <span className="text-xs text-muted-foreground">No users found.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setActiveStep("media")}
                      className="px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(workedOnLaunch === "yes" ? "shoutouts" : "checklist")}
                      className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer"
                    >
                      {workedOnLaunch === "yes" ? "Next step: Shoutouts" : "Next step: Launch checklist"}
                    </button>
                  </div>
                </div>
              )}

              {activeStep === "shoutouts" && workedOnLaunch === "yes" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Add products that helped make yours awesome</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Each shoutout lives on as a founder review — shown first on that product&apos;s review page with a link back to your product.
                      It&apos;s extra visibility that lasts beyond launch day! Launches with shoutouts are also more likely to get featured.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-[11px] font-medium flex items-center gap-2">
                    <span>📢 Launches typically add 3 shoutouts, but feel free to add more!</span>
                  </div>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShoutouts([...shoutouts, { shouted_product_id: "", shouted_product_name: "", note: "" }])}
                      className="w-full py-3 bg-[#ff5733]/5 hover:bg-[#ff5733]/10 text-[#ff5733] border border-dashed border-[#ff5733]/20 rounded-2xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>➕ Add shoutout</span>
                    </button>

                    <div className="space-y-4">
                      {shoutouts.map((shout, idx) => {
                        const filteredProducts = allProducts.filter(p =>
                          p.name.toLowerCase().includes((shoutoutSearch || "").toLowerCase()) &&
                          !shoutouts.some(s => s.shouted_product_id === p.id)
                        );

                        return (
                          <div key={idx} className="p-5 bg-card border border-border rounded-3xl space-y-4 relative shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-foreground font-medium">Shoutout #{idx + 1}</span>
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
                                          <Image src={matched.logo_url} alt="" className="w-full h-full object-cover" width={48} height={48} />
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
                                      className="text-[10px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })() : (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Search by product name..."
                                    onChange={(e) => {
                                      setShoutoutSearch(e.target.value);
                                      setShowShoutoutSearchDropdown(idx);
                                    }}
                                    onFocus={() => setShowShoutoutSearchDropdown(idx)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                                  />
                                  {showShoutoutSearchDropdown === idx && (
                                    <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-border">
                                      {filteredProducts.length > 0 ? (
                                        filteredProducts.map((p) => (
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
                                            className="w-full px-4 py-3 text-left hover:bg-muted text-xs font-medium text-foreground flex items-center gap-3 transition-colors cursor-pointer"
                                          >
                                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center flex-shrink-0">
                                              {p.logo_url ? (
                                                <Image src={p.logo_url} alt={p.name} className="w-full h-full object-cover" width={48} height={48} />
                                              ) : (
                                                <span className="text-xs font-semibold text-orange-500">{p.name.charAt(0)}</span>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <span className="block font-semibold text-foreground truncate text-left">{p.name}</span>
                                              <span className="block text-[10px] text-muted-foreground font-normal truncate text-left">{p.tagline}</span>
                                            </div>
                                          </button>
                                        ))
                                      ) : (
                                        <div className="px-4 py-3 text-xs text-muted-foreground">No products found</div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Why do you like this better than the alternatives? */}
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">Why do you like this better than the alternatives?</label>
                                <span className="text-[9px] font-semibold text-muted-foreground">{shout.note.length}/5000</span>
                              </div>
                              <textarea
                                rows={3}
                                maxLength={5000}
                                placeholder="Describe why this product helped you or why you like it (minimum 20 characters)..."
                                value={shout.note}
                                onChange={(e) => {
                                  const updated = [...shoutouts];
                                  updated[idx].note = e.target.value;
                                  setShoutouts(updated);
                                }}
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500 resize-none"
                              />
                              {shout.note.trim() && shout.note.length < 20 && (
                                <p className="text-[9px] text-amber-600 font-semibold mt-1">⚠️ Shoutout note must be at least 20 characters</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setActiveStep("makers")}
                      className="px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep("investors")}
                      className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer"
                    >
                      Next step: Connect with Investors
                    </button>
                  </div>
                </div>
              )}

              {activeStep === "investors" && workedOnLaunch === "yes" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Connect with Investors</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We partner with a small set of investors who are looking for great teams and products to fund.
                      If you would like to be connected with these investors, fill out the below. We will reach out to you if there is a match.
                      <strong className="text-foreground block mt-1 font-semibold">This information will never be shared publicly.</strong>
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Why are you the right founder/team to work on this? */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">Why are you the right founder/team to work on this?</label>
                        <span className="text-[9px] font-semibold text-muted-foreground">{investorWhyTeam.length}/5000</span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={5000}
                        placeholder="Tell investors about your background, experience, and why you can win..."
                        value={investorWhyTeam}
                        onChange={(e) => setInvestorWhyTeam(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>

                    {/* Why did you pick this idea to work on? */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">Why did you pick this idea to work on?</label>
                        <span className="text-[9px] font-semibold text-muted-foreground">{investorWhyIdea.length}/5000</span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={5000}
                        placeholder="What problem are you solving and why does it matter to you?"
                        value={investorWhyIdea}
                        onChange={(e) => setInvestorWhyIdea(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>

                    {/* Who are your competitors, and what do you understand about this idea that they don't? */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">Who are your competitors, and what do you understand about this idea that they don&apos;t?</label>
                        <span className="text-[9px] font-semibold text-muted-foreground">{investorCompetitors.length}/5000</span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={5000}
                        placeholder="What is your unfair advantage or secret insight?"
                        value={investorCompetitors}
                        onChange={(e) => setInvestorCompetitors(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>

                    {/* What's your revenue and/or growth rate? */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">What&apos;s your revenue and/or growth rate?</label>
                        <span className="text-[9px] font-semibold text-muted-foreground">{investorRevenue.length}/5000</span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={5000}
                        placeholder="MRR, ARR, active users, growth numbers..."
                        value={investorRevenue}
                        onChange={(e) => setInvestorRevenue(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>

                    {/* Anything else you would like investors to know? */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">Anything else you would like investors to know?</label>
                        <span className="text-[9px] font-semibold text-muted-foreground">{investorAnythingElse.length}/5000</span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={5000}
                        placeholder="Pitch deck link, other funding details, timeline..."
                        value={investorAnythingElse}
                        onChange={(e) => setInvestorAnythingElse(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Funding Information</label>
                    <div className="space-y-2">
                      {[
                        { id: "bootstrapped", title: "Bootstrapped", desc: "Have not raised VC funding" },
                        { id: "y_combinator", title: "Y Combinator company", desc: "I am backed by Y Combinator" },
                        { id: "venture_backed", title: "Venture backed", desc: "I have raised venture-backed funding for this product." }
                      ].map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-2.5 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={fundingType === item.id}
                            onChange={() => setFundingType(item.id as any)}
                            className="mt-0.5 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-semibold text-foreground block">{item.title}</span>
                            <span className="text-[11px] text-muted-foreground leading-snug">{item.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>





                  <div className="flex justify-between pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setActiveStep("shoutouts")}
                      className="px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep("extras")}
                      className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer"
                    >
                      Next step: Extras
                    </button>
                  </div>


                </div>
              )}

              {activeStep === "extras" && workedOnLaunch === "yes" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Pricing</h3>
                    <p className="text-xs text-muted-foreground">Optional, but the community appreciates knowing.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 bg-muted/20 border border-border/80 p-4 rounded-xl cursor-pointer">
                        <input
                          type="radio"
                          name="pricing"
                          checked={pricingType === "free"}
                          onChange={() => setPricingType("free")}
                          className="accent-[#ff5733]"
                        />
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Free</span>
                          <span className="text-[10px] text-muted-foreground">This launch is free to use</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 bg-muted/20 border border-border/80 p-4 rounded-xl cursor-pointer">
                        <input
                          type="radio"
                          name="pricing"
                          checked={pricingType === "paid"}
                          onChange={() => setPricingType("paid")}
                          className="accent-[#ff5733]"
                        />
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Paid</span>
                          <span className="text-[10px] text-muted-foreground">This launch requires payment and there is no free option</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 bg-muted/20 border border-border/80 p-4 rounded-xl cursor-pointer">
                        <input
                          type="radio"
                          name="pricing"
                          checked={pricingType === "paid_trial"}
                          onChange={() => setPricingType("paid_trial")}
                          className="accent-[#ff5733]"
                        />
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Paid (with a free trial or plan)</span>
                          <span className="text-[10px] text-muted-foreground">This launch requires payment but also offers a free trial or version</span>
                        </div>
                      </label>
                    </div>

                    <div className="border-t border-border pt-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-0.5">Promo code</h4>
                        <p className="text-xs text-muted-foreground">If you&apos;d like to offer a discount for the IndiHunt Community, add details here.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">What is the offer?</label>
                          <input
                            type="text"
                            placeholder="e.g. 3 months free"
                            value={promoOffer}
                            onChange={(e) => setPromoOffer(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Promo code</label>
                          <input
                            type="text"
                            placeholder="e.g. IndiHunt50"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Expiration Date</label>
                          <input
                            type="date"
                            value={promoExpiry}
                            onChange={(e) => setPromoExpiry(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>


                  </div>

                  <div className="flex justify-between pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setActiveStep("investors")}
                      className="px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setActiveStep("checklist")}
                      className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer"
                    >
                      Next step: Launch checklist
                    </button>
                  </div>
                </div>
              )}

              {activeStep === "checklist" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Required</h3>
                    <p className="text-xs text-muted-foreground">Check that you&apos;ve completed all of the required information.</p>
                  </div>

                  <div className="bg-muted/20 border border-border p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-foreground">Launch Checklist Completion</span>
                      <span className="text-xs font-semibold text-[#ff5733] bg-[#ff5733]/10 px-2 py-0.5 rounded-full">
                        {calculateCompletion()}% Complete
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        {submitName ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Product name</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {submitTagline ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Product tagline</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {submitDesc ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Description</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {submitLogo ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Thumbnail (Logo)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {galleryImages.filter(g => g.trim() !== "").length > 0 ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Add images to the gallery</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {submitUrl ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Product URL link</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {launchTags.length > 0 ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Launch tags (at least 1 required)</span>
                      </div>
                    </div>
                  </div>

                  {/* Strongly Recommended Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Strongly Recommended</h3>
                    <p className="text-xs text-muted-foreground">Go the extra mile and add suggested information. Successful launches usually do.</p>
                  </div>

                  <div className="bg-muted/20 border border-border p-5 rounded-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Co-Makers</span>
                        {coMakersProfiles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {coMakersProfiles.map(m => (
                              <span key={m.id} className="text-sm font-medium text-foreground/90">{m.full_name}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-foreground/80">None</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {firstComment.trim() ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Write the first comment</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {videoUrl.trim() ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Video / Loom</span>
                      </div>
                    </div>
                  </div>

                  {/* Warning message boxes */}
                  {getValidationErrors().length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-2xl space-y-1">
                      {getValidationErrors().map((err, idx) => (
                        <p key={idx} className="text-xs font-medium">• {err}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setActiveStep(workedOnLaunch === "yes" ? "extras" : "makers")}
                      className="px-4 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleLaunchProduct("draft")}
                        className="px-5 py-2.5 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Create draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(true)}
                        className="px-5 py-2.5 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Schedule launch
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </main>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={async (date) => {
          setScheduledLaunchDate(date);
          try {
            await handleLaunchProduct("scheduled", date);
          } finally {
            setIsDatePickerOpen(false);
          }
        }}
      />

      {/* Success Scheduled Modal */}
      <SuccessScheduledModal
        isOpen={isSuccessScheduledOpen}
        onClose={() => {
          setIsSuccessScheduledOpen(false);
          if (newCreatedProductSlug) {
            router.push(`/products/${newCreatedProductSlug}/pre-launch`);
          } else if (newCreatedProductId) {
            router.push(`/products/${newCreatedProductId}/pre-launch`);
          } else {
            router.push("/");
          }
        }}
      />
      {/* View All Tags Modal */}
      {isTagsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsTagsModalOpen(false)}
          />

          {/* Modal Container: Centered on all devices */}
          <div className="relative w-full max-w-xl h-[75vh] sm:h-[650px] bg-card border border-border rounded-[2rem] shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="p-6 pb-4  flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#ff5733]" />
                  <span>Select Launch Tags</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Select up to three tags for your product launch</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTagsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-all cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 py-4  bg-muted/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tags (e.g. AI, SaaS, Productivity)..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-orange-500"
                />
                {tagSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTagSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Tags Grid - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Selected tags quick view */}
              {launchTags.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Selected Tags ({launchTags.length}/3)</div>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-muted/20 border border-border/60 rounded-2xl">
                    {launchTags.map(tag => (
                      <button
                        key={`selected-${tag}`}
                        type="button"
                        onClick={() => setLaunchTags(launchTags.filter(t => t !== tag))}
                        className="px-2.5 py-1 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        <span>{tag}</span>
                        <X className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Popular & Trending Launch Tags */}
              {!tagSearchQuery && (
                <div className="bg-muted/20 border border-border/60 p-3.5 rounded-2xl space-y-2">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Popular & Trending Launch Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(dbLaunchTags.filter(t => t.is_popular).length > 0
                      ? dbLaunchTags.filter(t => t.is_popular).map(t => t.name)
                      : ["AI Agents", "AI Coding Agents", "LLM", "Chat Model", "Deployment", "Hosting", "AI", "SaaS", "Developer Tools", "Productivity", "Fintech", "Design", "Marketing", "Analytics", "Security", "Open Source"]
                    ).map(tag => {
                      const active = launchTags.includes(tag);
                      const disabled = !active && launchTags.length >= 3;
                      return (
                        <button
                          key={`popular-${tag}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (active) {
                              setLaunchTags(launchTags.filter(t => t !== tag));
                            } else if (launchTags.length < 3) {
                              setLaunchTags([...launchTags, tag]);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${active
                            ? "bg-[#ff5733] text-white border-[#ff5733] shadow-xs"
                            : disabled
                              ? "bg-muted/10 border-border/40 text-muted-foreground/40 cursor-not-allowed opacity-50"
                              : "bg-background border-border text-foreground hover:bg-muted hover:border-orange-500/40"
                            }`}
                        >
                          <span>{tag}</span>
                          {active ? (
                            <X className="w-3 h-3 text-white" />
                          ) : (
                            <Plus className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Available Tags</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Array.from(new Set([
                    ...dbLaunchTags.map(t => t.name),
                    ...ALL_AVAILABLE_TAGS
                  ]))
                    .filter(tag => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                    .map(tag => {
                      const active = launchTags.includes(tag);
                      const disabled = !active && launchTags.length >= 3;
                      return (
                        <button
                          key={`all-${tag}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (active) {
                              setLaunchTags(launchTags.filter(t => t !== tag));
                            } else if (launchTags.length < 3) {
                              setLaunchTags([...launchTags, tag]);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex justify-between items-center ${active
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 font-bold shadow-xs"
                            : disabled
                              ? "bg-muted/10 border-border/40 text-muted-foreground/45 cursor-not-allowed opacity-50"
                              : "bg-background border-border text-foreground hover:border-border/80"
                            }`}
                        >
                          <span className="truncate mr-1">{tag}</span>
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-900 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  {ALL_AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(tagSearchQuery.toLowerCase())).length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                      No tags found matching &ldquo;{tagSearchQuery}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-between gap-4">
              <div className="text-xs">
                <span className="font-semibold text-foreground">{launchTags.length}</span>
                <span className="text-muted-foreground"> / 3 selected</span>
              </div>
              <div className="flex gap-2">
                {launchTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLaunchTags([])}
                    className="px-4 py-2 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl cursor-pointer transition-all"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTagsModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-all hover:shadow-md"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback since Radix title is standard
function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-bold text-foreground ${className}`}>{children}</h2>;
}

export default function NewLaunchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <span className="text-sm font-medium animate-pulse text-muted-foreground">Loading Creator Studio...</span>
      </div>
    }>
      <NewLaunchWizard />
    </Suspense>
  );
}
