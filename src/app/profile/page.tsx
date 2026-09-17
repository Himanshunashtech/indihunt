"use client";


import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Mail,
  ShieldCheck,
  Rocket,
  Settings,
  ArrowUp,
  MessageSquare,
  Bookmark,
  Layers,
  Heart,
  Plus,
  Trash2,
  MapPin,
  ExternalLink,
  Award,
  Megaphone,
  X,
  ChevronRight,
  Clock,
  Info,
  AlertCircle,
  Eye,
  CreditCard
} from "lucide-react";
import {
  supabase,
  getUserProfile,
  getUserProfileByUsername,
  signOut,
  Profile,
  Product,
  Thread,
  Review,
  Collection,
  getUserCollections,
  createCollection,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection,
  getUserStack,
  addProductToStack,
  removeProductFromStack,
  getProducts,
  getCachedProducts,
  getAdCampaigns,
  updateAdCampaignStatus,
  deleteAdCampaign,
  AdCampaign,
  toggleFollowUser,
  isFollowingUser,
  Story,
  getStories,
  createStory,
  deleteStory,
  uploadImage,
  getProductSlug,
  updateUserProfile,
  getKarmaLeaderboard
} from "@/lib/supabase";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";
import { Github, Linkedin, Twitter } from "@/components/icons";
import ActivityHeatmap from "@/components/ActivityHeatmap";

function HexagonBadge({ number, topColor, bottomColor, icon, isTextIcon = false, iconColor }: { number: number; topColor: string; bottomColor: string; icon: string; isTextIcon?: boolean; iconColor?: string }) {
  return (
    <svg viewBox="0 0 100 115" className="w-9 h-10 flex-shrink-0">
      <polygon 
        points="50,2 98,30 98,85 50,113 2,85 2,30" 
        fill="none" 
        stroke="#E2E8F0" 
        strokeWidth="2"
      />
      <path 
        d="M 50,2 L 98,30 L 98,80 L 2,80 L 2,30 Z" 
        fill={topColor}
      />
      <path 
        d="M 2,80 L 98,80 L 98,85 L 50,113 L 2,85 Z" 
        fill={bottomColor}
      />
      {isTextIcon ? (
        <text x="50" y="48" textAnchor="middle" fontSize="30" fill={iconColor} dominantBaseline="middle">
          {icon}
        </text>
      ) : (
        <text x="50" y="52" textAnchor="middle" fontSize="28" dominantBaseline="middle">
          {icon}
        </text>
      )}
      <text x="50" y="99" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#FFFFFF" dominantBaseline="middle">
        {number}
      </text>
    </svg>
  );
}

interface ProfileContentProps {
  initialUserId?: string | null;
  initialUsername?: string | null;
  initialProfile?: Profile | null;
  initialProducts?: Product[];
}

function ProfileContent({
  initialUserId,
  initialUsername,
  initialProfile,
  initialProducts = [],
}: ProfileContentProps = {}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUserId = searchParams ? searchParams.get("id") : null;
  const targetUserId = initialUserId !== undefined ? initialUserId : queryUserId;
  const targetUsername = initialUsername || null;

  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxProfile = useAppSelector((state) => state.auth.profile);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [user, setUser] = useState<any>(reduxUser);
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (initialProfile) return initialProfile;
    const isTargetingSelf = (!targetUserId && !targetUsername) || targetUserId === reduxUser?.id || (reduxProfile && targetUsername === reduxProfile.username);
    if (isTargetingSelf && reduxProfile) return reduxProfile;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("indihunt_profile");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!targetUserId || parsed.id === targetUserId || parsed.username === targetUsername) {
            return parsed;
          }
        }
      } catch (e) { }
    }
    return null;
  });
  const [followersList, setFollowersList] = useState<Profile[]>([]);
  const [followingList, setFollowingList] = useState<Profile[]>([]);
  const [followedProducts, setFollowedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"about" | "stories" | "forums" | "activity" | "upvotes" | "hunted" | "collection" | "stacks" | "reviews" | "campaigns" | "pacts">("about");
  const [products, setProducts] = useState<Product[]>(() => {
    if (initialProducts && initialProducts.length > 0) return initialProducts;
    if (typeof window !== "undefined") {
      try {
        const cached = getCachedProducts();
        if (cached && cached.length > 0) {
          const profId = initialProfile?.id || reduxProfile?.id;
          if (profId) {
            const filtered = cached.filter((p: Product) => p.maker_id === profId);
            if (filtered.length > 0) return filtered;
          }
          return cached;
        }
      } catch (e) { }
    }
    return [];
  });
  const [userThreads, setUserThreads] = useState<Thread[]>([]);

  // Pacts State
  const [pacts, setPacts] = useState<any[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Product[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [userStack, setUserStack] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => !profile && !initialProfile && !reduxProfile);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userRank, setUserRank] = useState<string>("#1");
  const [userKP, setUserKP] = useState<number>(0);

  // Stories State
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryExcerpt, setNewStoryExcerpt] = useState("");
  const [newStoryCategory, setNewStoryCategory] = useState("Makers");
  const [newStoryImageUrl, setNewStoryImageUrl] = useState("");
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);
  const [isUploadingStoryImage, setIsUploadingStoryImage] = useState(false);


  // Campaigns State
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);

  const isOwnProfile = profile
    ? (user ? user.id === profile.id : false)
    : (!targetUserId && !targetUsername);

  // New Collection Form State
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [isCreatingCol, setIsCreatingCol] = useState(false);

  const handleStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingStoryImage(true);
    try {
      const extension = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${extension}`;

      let publicUrl = "";
      if (supabase) {
        const uploadedPath = await uploadImage("story-images", file, path);
        if (uploadedPath) {
          publicUrl = uploadedPath;
        }
      }

      if (!publicUrl) {
        publicUrl = URL.createObjectURL(file);
      }
      setNewStoryImageUrl(publicUrl);
    } catch (err) {
      console.error("Error uploading cover image:", err);
    } finally {
      setIsUploadingStoryImage(false);
    }
  };

  const handleCreateStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newStoryTitle.trim() || !newStoryContent.trim()) return;

    setIsSubmittingStory(true);
    try {
      const payload = {
        title: newStoryTitle.trim(),
        content: newStoryContent.trim(),
        excerpt: newStoryExcerpt.trim() || newStoryContent.trim().substr(0, 150) + '...',
        category: newStoryCategory,
        image_url: newStoryImageUrl || undefined,
        user_id: user.id,
        published_at: new Date().toISOString()
      };

      const created = await createStory(payload);
      if (created) {
        setUserStories(prev => [created, ...prev]);
        setShowNewStoryModal(false);
        setNewStoryTitle("");
        setNewStoryContent("");
        setNewStoryExcerpt("");
        setNewStoryCategory("Makers");
        setNewStoryImageUrl("");
      }
    } catch (err) {
      console.error("Error creating story:", err);
    } finally {
      setIsSubmittingStory(false);
    }
  };

  const handleDeleteStory = async (e: React.MouseEvent, storyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this story?")) return;
    const success = await deleteStory(storyId);
    if (success) {
      setUserStories(prev => prev.filter(s => s.id !== storyId));
    } else {
      alert("Failed to delete story.");
    }
  };

  // Add to Stack State
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductForStack, setSelectedProductForStack] = useState("");

  useEffect(() => {
    // Reset states immediately when navigating to another user profile to prevent showing old profile
    const isTargetingSelf = (!targetUserId && !targetUsername) || targetUserId === reduxUser?.id || (reduxProfile && targetUsername === reduxProfile.username);
    let initialProf: Profile | null = initialProfile || null;
    if (!initialProf) {
      if (isTargetingSelf && reduxProfile) {
        initialProf = reduxProfile;
      } else if (targetUserId && typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`ih_profile_${targetUserId}`);
          if (cached) initialProf = JSON.parse(cached);
        } catch (e) {}
      }
    }
    setProfile(initialProf);
    setIsLoading(!initialProf);
    setFollowersList([]);
    setFollowingList([]);
    setFollowedProducts([]);
    setProducts([]);
    setUserThreads([]);
    setPacts([]);
    setUserUpvotes([]);
    setUserReviews([]);
    setCollections([]);
    setUserStack([]);
    setUserStories([]);
    setCampaigns([]);

    if (!supabase) return;
    const client = supabase;
    const loadProfile = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      let resolvedUid = initialProfile?.id || targetUserId;
      if (!resolvedUid && targetUsername) {
        const resolvedProfile = await getUserProfileByUsername(targetUsername);
        if (resolvedProfile) {
          resolvedUid = resolvedProfile.id;
        }
      }
      const uid = resolvedUid || session?.user?.id;
      if (uid) {
        fetchProfileData(uid);
      } else if (!targetUsername && !targetUserId && !initialProfile) {
        // Only redirect to home if on bare /profile with no query, no target, and no active session
        router.push("/");
      } else {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [router, targetUserId, targetUsername, reduxUser, reduxProfile, initialProfile]);

  // Redirect to username slug URL format (e.g. /@username) if currently on query-based URL (e.g. /profile?id=xyz)
  useEffect(() => {
    if (profile && profile.username && !targetUsername) {
      router.replace(`/@${profile.username}`);
    }
  }, [profile, targetUsername, router]);

  const fetchProfileData = async (uid: string) => {
    if (!profile) {
      setIsLoading(true);
    }
    try {
      const sessionPromise = supabase ? supabase.auth.getSession() : Promise.resolve({ data: { session: null } });

      // Run all primary fetches in parallel (16 concurrent queries)
      const [
        prof,
        cols,
        stack,
        allProds,
        sessionResult,
        camps,
        ownProductsResult,
        memberProductsResult,
        followsRowsResult,
        followingRowsResult,
        prodFollowingRowsResult,
        threadsResult,
        upvotesResult,
        reviewsResult,
        allStories,
        pactsResult,
        leaderboardData
      ] = await Promise.all([
        getUserProfile(uid),
        getUserCollections(uid),
        getUserStack(uid),
        getProducts(),
        sessionPromise,
        supabase ? getAdCampaigns(uid) : Promise.resolve([] as AdCampaign[]),
        supabase ? supabase.from("products").select("*").eq("maker_id", uid) : Promise.resolve({ data: [] as any[], error: null as any }),
        supabase ? supabase.from("product_members").select("products(*)").eq("user_id", uid) : Promise.resolve({ data: [] as any[], error: null as any }),
        supabase ? supabase.from("user_follows").select("follower_id").eq("following_id", uid) : Promise.resolve({ data: [] as any[], error: null as any }),
        supabase ? supabase.from("user_follows").select("following_id").eq("follower_id", uid) : Promise.resolve({ data: [] as any[], error: null as any }),
        supabase ? supabase.from("product_follows").select("product:products(*, maker:profiles!maker_id(*))").eq("user_id", uid) : Promise.resolve({ data: [] as any[], error: null as any }),
        supabase ? supabase.from("threads").select("*").eq("user_id", uid).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[], error: null as any }),
        supabase ? supabase.from("upvotes").select("products(*)").eq("user_id", uid) : Promise.resolve({ data: [] as any[], error: null as any }),
        supabase ? supabase.from("reviews").select("*, product:products(*)").eq("user_id", uid).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[], error: null as any }),
        getStories(),
        supabase ? supabase.from("pacts").select("*, product_1(id, name, scheduled_for, logo_url), product_2(id, name, scheduled_for, logo_url), user_1(id, full_name, avatar_url), user_2(id, full_name, avatar_url)").or(`user_1.eq.${uid},user_2.eq.${uid}`) : Promise.resolve({ data: [] as any[], error: null as any }),
        getKarmaLeaderboard(100)
      ]);

      if (prof) setProfile(prof);
      setCollections(cols);
      setUserStack(stack);
      setAvailableProducts(allProds);

      // Compute dynamic real Karma Points (KP)
      const ownProdsCount = (ownProductsResult?.data || []).length;
      const threadsCount = (threadsResult?.data || []).length;
      const upvotesCount = (upvotesResult?.data || []).length;
      const reviewsCount = (reviewsResult?.data || []).length;

      const dynamicKP = prof?.karma_points || Math.max(
        (ownProdsCount * 15) + (threadsCount * 5) + (reviewsCount * 5) + (upvotesCount * 2) + 12,
        12
      );
      setUserKP(dynamicKP);

      // Compute dynamic real Leaderboard Rank
      if (leaderboardData && leaderboardData.length > 0) {
        const index = leaderboardData.findIndex(l => l.id === uid);
        if (index >= 0) {
          setUserRank(`#${index + 1}`);
        } else {
          setUserRank(`#${leaderboardData.length + 1}+`);
        }
      } else {
        setUserRank("#1");
      }

      const currentSessionUid = sessionResult?.data?.session?.user?.id;
      if (uid === currentSessionUid) {
        setCampaigns(camps);
      } else if (currentSessionUid) {
        // Query following status in background
        isFollowingUser(currentSessionUid, uid).then(status => setIsFollowing(status)).catch(() => { });
      }

      // Process products (maker + member)
      const ownProducts = ownProductsResult?.data || [];
      const memberProducts = memberProductsResult?.data || [];
      const memberProdsList = (memberProducts || [])
        .map((m: any) => m.products)
        .filter((p): p is Product => !!p);

      const combined = [...(ownProducts || []), ...memberProdsList];
      let uniqueProducts = combined.filter(
        (value, index, self) => self.findIndex(p => p.id === value.id) === index
      );

      const isOwn = currentSessionUid === uid;
      if (!isOwn) {
        const now = new Date();
        uniqueProducts = uniqueProducts.filter(p => {
          if (p.status === 'draft') return false;
          if (p.status === 'scheduled' && p.scheduled_for) {
            return new Date(p.scheduled_for) <= now;
          }
          return true;
        });
      }

      uniqueProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProducts(uniqueProducts as Product[]);

      if (supabase) {
        // Fetch followers list using the ids we retrieved in parallel
        const followsRows = followsRowsResult?.data || [];
        const followerIds = followsRows.map((f: { follower_id: string }) => f.follower_id);

        let directFollowerProfs: Profile[] = [];
        if (followerIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("*")
            .in("id", followerIds);
          directFollowerProfs = profs || [];
        }

        const myProductIds = uniqueProducts.map(p => p.id);
        let productFollowerProfs: Profile[] = [];
        if (myProductIds.length > 0) {
          const { data: prodFollows } = await supabase
            .from("product_follows")
            .select("user:profiles(*)")
            .in("product_id", myProductIds);
          if (prodFollows) {
            productFollowerProfs = prodFollows.map((pf: any) => pf.user).filter(Boolean) as Profile[];
          }
        }

        const combinedFollowers = [...directFollowerProfs, ...productFollowerProfs];
        const uniqueFollowers = combinedFollowers.filter(
          (value, index, self) => self.findIndex(p => p.id === value.id) === index
        );
        setFollowersList(uniqueFollowers);

        // Fetch following list using the ids we retrieved in parallel
        const followingRows = followingRowsResult?.data || [];
        const followingIds = followingRows.map(f => f.following_id);

        let directFollowingProfs: Profile[] = [];
        if (followingIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("*")
            .in("id", followingIds);
          directFollowingProfs = profs || [];
        }
        setFollowingList(directFollowingProfs);

        // Process followed products
        const prodFollowingRows = prodFollowingRowsResult?.data || [];
        const followedProds = (prodFollowingRows || [])
          .map((pf: any) => pf.product)
          .filter(Boolean) as Product[];
        setFollowedProducts(followedProds);

        // Process threads, upvotes and reviews
        setUserThreads(threadsResult?.data || []);

        const upvotesData = upvotesResult?.data || [];
        const upvotedProds = (upvotesData || [])
          .map((u: any) => u.products)
          .filter((p): p is Product => !!p);
        setUserUpvotes(upvotedProds);

        setUserReviews(reviewsResult?.data || []);

        // Process stories
        const userSts = allStories.filter(s => s.user_id === uid);
        setUserStories(userSts);

        // Process Pacts
        try {
          const dbPacts = pactsResult?.data || [];
          const dbError = pactsResult?.error;

          if (!dbError && dbPacts && dbPacts.length > 0) {
            const formatted = dbPacts.map((pact: any) => {
              const isUser1 = pact.user_1.id === uid;
              const partner = isUser1 ? pact.user_2 : pact.user_1;
              const yourProduct = isUser1 ? pact.product_1 : pact.product_2;
              const theirProduct = isUser1 ? pact.product_2 : pact.product_1;

              return {
                id: pact.id,
                partnerName: partner.full_name || "Builder",
                partnerTrust: "100 TRUST",
                partnerAvatar: partner.avatar_url || "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=80&q=80",
                pactSince: new Date(pact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
                description: `A two-way upvote on IndiHunt. Show up when their day comes — they'll show up for yours.`,
                yourLaunch: {
                  name: yourProduct.name,
                  logoUrl: yourProduct.logo_url,
                  date: new Date(yourProduct.scheduled_for || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  status: "they-upvoted"
                },
                theirLaunch: {
                  name: theirProduct.name,
                  logoUrl: theirProduct.logo_url,
                  date: new Date(theirProduct.scheduled_for || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  status: pact.status === "completed" ? "you-upvoted" : "you-upvote"
                }
              };
            });
            setPacts(formatted);
          } else {
            // Dynamic fallback calculation directly from upvotes & products tables:
            // Find products launched by the current user
            const { data: myProducts } = await supabase
              .from("products")
              .select("id, name, scheduled_for, logo_url")
              .eq("maker_id", uid);

            if (myProducts && myProducts.length > 0) {
              const myProductIds = myProducts.map((p: any) => p.id);
              // Get upvotes on my products
              const { data: votesOnMe } = await supabase
                .from("upvotes")
                .select("user_id, profiles(id, full_name, avatar_url)")
                .in("product_id", myProductIds);

              if (votesOnMe && votesOnMe.length > 0) {
                const voterIds = Array.from(new Set(votesOnMe.map((v: any) => v.user_id)));
                // Get products launched by these voters
                const { data: voterProducts } = await supabase
                  .from("products")
                  .select("id, name, maker_id, scheduled_for, logo_url")
                  .in("maker_id", voterIds);

                if (voterProducts && voterProducts.length > 0) {
                  const voterProductIds = voterProducts.map((p: any) => p.id);
                  // Get upvotes I made on their products
                  const { data: myVotesOnVoters } = await supabase
                    .from("upvotes")
                    .select("product_id")
                    .eq("user_id", uid)
                    .in("product_id", voterProductIds);

                  if (myVotesOnVoters && myVotesOnVoters.length > 0) {
                    const calculatedPacts = [];

                    for (const vote of myVotesOnVoters) {
                      const matchedProduct = voterProducts.find((p: any) => p.id === vote.product_id);
                      if (!matchedProduct) continue;

                      // Find profile of the user who upvoted my product and whose product I upvoted
                      const voterVote = votesOnMe.find((uv: any) => uv.user_id === matchedProduct.maker_id);
                      const voterProfile = voterVote ? (voterVote.profiles as any) : null;
                      if (!voterProfile) continue;

                      // Get the specific product of mine they upvoted
                      const myProductTheyUpvoted = myProducts[0];

                      calculatedPacts.push({
                        id: `pact-calc-${matchedProduct.id}`,
                        partnerName: voterProfile.full_name || "Builder",
                        partnerTrust: "120 TRUST",
                        partnerAvatar: voterProfile.avatar_url || "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=80&q=80",
                        pactSince: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
                        description: `A two-way upvote on IndiHunt. Show up when their day comes — they'll show up for yours.`,
                        yourLaunch: {
                          name: myProductTheyUpvoted.name,
                          logoUrl: myProductTheyUpvoted.logo_url,
                          date: new Date(myProductTheyUpvoted.scheduled_for || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                          status: "they-upvoted"
                        },
                        theirLaunch: {
                          name: matchedProduct.name,
                          logoUrl: matchedProduct.logo_url,
                          date: new Date(matchedProduct.scheduled_for || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                          status: "you-upvoted" // automatically completed since mutual upvotes are detected!
                        }
                      });
                    }
                    setPacts(calculatedPacts);
                  } else {
                    setPacts([]);
                  }
                } else {
                  setPacts([]);
                }
              } else {
                setPacts([]);
              }
            } else {
              setPacts([]);
            }
          }
        } catch (e) {
          console.error("Error loading pacts:", e);
          setPacts([]);
        }

      } else {
        // Local storage fallbacks
        const userSts = allStories.filter(s => s.user_id === uid);
        setUserStories(userSts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };



  const handleUpdateCampaignStatus = async (campId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const updated = await updateAdCampaignStatus(campId, nextStatus);
      if (updated) {
        setCampaigns(prev => prev.map(c => c.id === campId ? updated! : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCampaignClick = async (campId: string) => {
    if (profile?.role !== "admin") {
      alert("Only an administrator can delete an advertising campaign. If you wish to stop your ad, you can Pause it or contact support@indihunt.in.");
      return;
    }
    if (!confirm("Are you sure you want to delete this advertising campaign?")) return;
    try {
      const success = await deleteAdCampaign(campId);
      if (success) {
        setCampaigns(prev => prev.filter(c => c.id !== campId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowUser = async () => {
    const sessionResult = await supabase?.auth.getSession();
    const currentSessionUid = sessionResult?.data?.session?.user?.id;
    if (!currentSessionUid) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    const targetId = targetUserId || profile?.id;
    if (!targetId) return;

    const success = await toggleFollowUser(currentSessionUid, targetId, isFollowing);
    if (success) {
      setIsFollowing(!isFollowing);
      // Reload followers count
      if (supabase) {
        const { data: followsRows } = await supabase
          .from("user_follows")
          .select("follower_id")
          .eq("following_id", targetId);
        const followerIds = (followsRows || []).map(f => f.follower_id);

        let directFollowerProfs: Profile[] = [];
        if (followerIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("*")
            .in("id", followerIds);
          directFollowerProfs = profs || [];
        }
        setFollowersList(directFollowerProfs);
      }
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCollectionName.trim()) return;
    setIsCreatingCol(true);
    try {
      const col = await createCollection(newCollectionName, newCollectionDesc, user.id);
      if (col) {
        setCollections(prev => [col, ...prev]);
        setNewCollectionName("");
        setNewCollectionDesc("");
        setShowNewCollectionModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCol(false);
    }
  };

  const handleAddToStack = async () => {
    if (!user || !selectedProductForStack) return;
    try {
      const success = await addProductToStack(selectedProductForStack, user.id);
      if (success) {
        const stack = await getUserStack(user.id);
        setUserStack(stack);
        setSelectedProductForStack("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromStack = async (pid: string) => {
    if (!user) return;
    try {
      const success = await removeProductFromStack(pid, user.id);
      if (success) {
        setUserStack(prev => prev.filter(p => p.id !== pid));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compile Unified Activities
  const getActivities = () => {
    const list: any[] = [];

    // Add launches
    products.forEach(p => {
      list.push({
        id: `act-launch-${p.id}`,
        type: "launch",
        title: `hunted ${p.name}`,
        subtitle: p.tagline,
        logo: p.logo_url,
        product: p,
        created_at: p.created_at
      });
    });

    // Add reviews
    userReviews.forEach(r => {
      list.push({
        id: `act-review-${r.id}`,
        type: "review",
        title: `reviewed ${r.product?.name}`,
        subtitle: r.body,
        logo: r.product?.logo_url,
        product: r.product,
        created_at: r.created_at
      });
    });

    // Add threads
    userThreads.forEach(t => {
      list.push({
        id: `act-thread-${t.id}`,
        type: "thread",
        title: `started discussion "${t.title}"`,
        subtitle: t.body,
        created_at: t.created_at
      });
    });

    // Add stories
    userStories.forEach(s => {
      list.push({
        id: `act-story-${s.id}`,
        type: "story",
        title: `published story "${s.title}"`,
        subtitle: s.excerpt || s.content,
        logo: s.image_url,
        created_at: s.published_at || (s as any).created_at
      });
    });

    // Add upvotes
    userUpvotes.forEach(u => {
      if (u.created_at) {
        list.push({
          id: `act-upvote-${u.id}`,
          type: "upvote",
          title: `upvoted ${u.name}`,
          subtitle: u.tagline,
          logo: u.logo_url,
          product: u,
          created_at: u.created_at
        });
      }
    });

    // Add collections
    collections.forEach(c => {
      if (c.created_at) {
        list.push({
          id: `act-collection-${c.id}`,
          type: "collection",
          title: `curated collection "${c.name}"`,
          subtitle: c.description || "",
          created_at: c.created_at
        });
      }
    });

    // Add pacts
    pacts.forEach(pact => {
      list.push({
        id: `act-pact-${pact.id}`,
        type: "pact",
        title: `formed a Crew Pact with ${pact.partnerName}`,
        subtitle: pact.description,
        created_at: pact.yourLaunch?.date ? new Date(pact.yourLaunch.date).toISOString() : new Date().toISOString()
      });
    });

    // Sort by created_at descending
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const activitiesList = getActivities();

  const isTargetingSelf = (!targetUserId && !targetUsername) || targetUserId === reduxUser?.id || (reduxProfile && targetUsername === reduxProfile.username);
  const isProfileForCurrentTarget = profile
    ? (isTargetingSelf
        ? (reduxUser ? profile.id === reduxUser.id : true)
        : (targetUserId ? profile.id === targetUserId : (targetUsername ? profile.username === targetUsername : false)))
    : false;

  const isProfileLoading = !profile && isLoading;

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-36">
          <CircularLoader label="Loading profile..." size="lg" center={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-42 sm:pt-44 pb-16 space-y-6">

        {/* Banner Area */}
        <div className="pb-8  flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-4xl font-medium text-white shadow-md overflow-hidden border-2 border-border">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            {profile?.is_maker && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border-2 border-background shadow-xs">
                MAKER
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center sm:items-start text-center sm:text-left space-y-3">
            <div className="flex flex-col items-center sm:items-start">
              <h1 className="mb-0.5 text-2xl sm:text-3xl font-medium text-foreground">
                {profile?.full_name && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.full_name)
                  ? profile.full_name
                  : (profile?.username ? `@${profile.username}` : "Indie Maker")}
              </h1>
              <span className="text-base sm:text-lg font-light text-muted-foreground">
                {(profile as any)?.headline || "Indie founder building AI-powered apps"}
              </span>
            </div>

            {/* Handle & Follower stats row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
              <span>@{profile?.username || "username"}</span>
              <span className="opacity-40">•</span>
              <Link href="/profile" className="hover:text-orange-500 transition-colors">
                <strong className="font-medium text-foreground">{followersList.length}</strong> followers
              </Link>
              <span className="opacity-40">•</span>
              <Link href="/profile" className="hover:text-orange-500 transition-colors">
                <strong className="font-medium text-foreground">{followingList.length + followedProducts.length}</strong> following
              </Link>
            </div>

            {/* Streak Indicator */}
            <div className="flex items-center gap-3">
              <Link href="/profile/streak" className="text-sm font-normal text-muted-foreground hover:text-orange-500 transition-colors flex items-center gap-1">
                <span>🌟</span>
                <span>{((profile as any)?.streak_count) || 5} day streak</span>
              </Link>
            </div>

            {/* Kitty Points Card Box */}
            <div className="flex overflow-hidden rounded-lg bg-muted/60 border border-border/80 text-xs">
              <Link href="/profile/leaderboard" className="flex flex-col px-3 py-2 hover:bg-muted transition-colors border-r border-border/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-foreground">{userRank}</span>
                  <span className="text-xs text-muted-foreground">Community Rank</span>
                </div>
                <span className="text-sm font-medium text-orange-500">{userKP} KP</span>
              </Link>
              <Link href="/profile/leaderboard" className="flex flex-col px-3 py-2 hover:bg-muted transition-colors">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-foreground">{userRank}</span>
                  <span className="text-xs text-muted-foreground">All time</span>
                </div>
                <span className="text-sm font-medium text-orange-500">{userKP} KP</span>
              </Link>
            </div>
          </div>

          {/* Edit / Follow button */}
          <div className="sm:self-start pt-1 flex flex-col gap-2 items-center sm:items-end">
            {isOwnProfile ? (
              <>
                <Link
                  href="/profile/settings"
                  className="relative inline-block rounded-full border-2 border-border bg-card px-4 py-2 text-center text-sm font-medium text-foreground transition-all duration-300 hover:border-border/80 hover:bg-muted shadow-xs"
                >
                  Edit my profile
                </Link>
                {profile?.indie_page_enabled !== false ? (
                  <Link
                    href={`/page/${profile?.username}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-center text-sm font-semibold text-white transition-all duration-300 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/20"
                  >
                    🚀 View Page
                  </Link>
                ) : (
                  <Link
                    href="/pages/studio"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-center text-sm font-semibold text-white transition-all duration-300 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/20 cursor-pointer"
                  >
                    🚀 Create Your Page
                  </Link>
                )}
              </>
            ) : (
              <button
                onClick={handleFollowUser}
                className={`rounded-full px-5 py-2 border font-medium text-sm transition-all duration-300 shadow-xs cursor-pointer ${isFollowing
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500/15"
                    : "bg-[#ff5733] hover:bg-[#e64a19] border-transparent text-white"
                  }`}
              >
                {isFollowing ? "✓ Following" : "+ Follow User"}
              </button>
            )}
          </div>
        </div>

        {/* Builder Activity Heatmap */}
        <ActivityHeatmap
          userId={profile?.id || user?.id}
          username={profile?.username}
          streakCount={((profile as any)?.streak_count) || 11}
          karmaPoints={userKP || ((profile as any)?.karma_points) || 338}
          activities={activitiesList.map(a => ({ date: a.created_at, type: a.type }))}
        />

        {/* Pill-styled Subnav */}
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 ">
          {(["about", "stories", "forums", "activity", "upvotes", "hunted", "collection", "stacks", "reviews", ...(isOwnProfile ? ["campaigns", "pacts"] : [])] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 whitespace-nowrap focus:outline-none ${activeTab === tab
                  ? "bg-muted text-foreground font-medium shadow-xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
            >
              {tab === "hunted" ? `${products.length} Hunted` : tab === "collection" ? `${collections.length} Collection` : tab === "campaigns" ? "📢 Campaigns" : tab === "pacts" ? "🤝 Crew Pacts" : tab === "stories" ? `${userStories.length} Stories` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>


        {/* Tab content area */}
        <div className="bg-white/90 dark:bg-card/90 backdrop-blur-xs border border-border rounded-3xl p-6 sm:p-8 min-h-[300px] shadow-xs">

          {/* STORIES TAB */}
          {activeTab === "stories" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {isOwnProfile ? "My Stories" : "Stories"}
                </h4>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowNewStoryModal(true)}
                    className="px-3.5 py-2 bg-[#ff5733] hover:bg-[#e64a19] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-orange-500/10 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Story</span>
                  </button>
                )}
              </div>

              {userStories.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-muted/5 space-y-2">
                  <span className="text-2xl">✍️</span>
                  <p className="text-xs font-semibold text-muted-foreground">No stories yet</p>
                  <p className="text-[10px] text-muted-foreground/75">
                    {isOwnProfile ? "Write your first story to share your builder journey!" : "This maker hasn't posted any stories yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userStories.map(story => (
                    <Link
                      key={story.id}
                      href={`/stories/${getProductSlug(story.title)}`}
                      className="bg-white dark:bg-card border border-border shadow-xs hover:border-orange-500/30 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col group"
                    >
                      {story.image_url && (
                        <div className="w-full h-32 overflow-hidden bg-muted relative">
                          <img
                            src={story.image_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md inline-block">
                            {story.category}
                          </span>
                          <h4 className="font-bold text-xs text-foreground group-hover:text-orange-500 transition-colors line-clamp-1">
                            {story.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {story.excerpt || story.content}
                          </p>
                        </div>
                        <div className="text-[9px] text-muted-foreground font-semibold border-t border-border/40 pt-2 flex justify-between items-center">
                          <span>By @{profile?.username}</span>
                          <div className="flex items-center gap-2">
                            <span>{new Date(story.published_at).toLocaleDateString()}</span>
                            {isOwnProfile && (
                              <button
                                onClick={(e) => handleDeleteStory(e, story.id)}
                                className="text-red-500 hover:text-red-700 font-bold cursor-pointer transition-colors flex items-center gap-0.5 ml-1"
                                title="Delete Story"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">About</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profile?.bio || "Solo founder & software engineer building AI-powered apps. Currently working on tools focused on real, Indian home-style food. I love turning complex tech into simple, useful products."}
                </p>
              </div>

              {profile?.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span>{profile.location}</span>
                </div>
              )}

              {/* Links */}
              {((profile as any)?.website || (profile as any)?.linkedin_url || (profile as any)?.twitter_url || (profile as any)?.github_url) && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Links</h4>
                  <div className="flex flex-wrap gap-4">
                    {(profile as any)?.website && (
                      <a href={(profile as any).website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-orange-500 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Website</span>
                      </a>
                    )}
                    {(profile as any)?.linkedin_url && (
                      <a href={(profile as any).linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-orange-500 hover:underline">
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {(profile as any)?.twitter_url && (
                      <a href={(profile as any).twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-orange-500 hover:underline">
                        <Twitter className="w-3.5 h-3.5" />
                        <span>Twitter / X</span>
                      </a>
                    )}
                    {(profile as any)?.github_url && (
                      <a href={(profile as any).github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-orange-500 hover:underline">
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Badges</h4>
                <div className="flex flex-row flex-wrap items-center gap-x-6 gap-y-4">
                  {/* Tastemaker badge */}
                  {((profile as any)?.karma_points || 0) > 0 && (
                    <div className="flex items-center gap-3">
                      <HexagonBadge 
                        number={1} 
                        topColor="#FFF3E0" 
                        bottomColor="#F5A623" 
                        icon="▲" 
                        isTextIcon={true} 
                        iconColor="#F5A623" 
                      />
                      <span className="text-sm font-medium text-foreground">Tastemaker</span>
                    </div>
                  )}

                  {/* Gone streaking 10 badge */}
                  {((profile as any)?.streak_count || 0) >= 10 && (
                    <div className="flex items-center gap-3">
                      <HexagonBadge 
                        number={10} 
                        topColor="#F3E5F5" 
                        bottomColor="#9C27B0" 
                        icon="🔥" 
                      />
                      <span className="text-sm font-medium text-foreground">Gone streaking 10</span>
                    </div>
                  )}

                  {/* Gone streaking badge */}
                  {((profile as any)?.streak_count || 0) >= 2 && (
                    <div className="flex items-center gap-3">
                      <HexagonBadge 
                        number={2} 
                        topColor="#FFF3E0" 
                        bottomColor="#F5A623" 
                        icon="🔥" 
                      />
                      <span className="text-sm font-medium text-foreground">Gone streaking</span>
                    </div>
                  )}

                  {/* Gone streaking 5 badge */}
                  {((profile as any)?.streak_count || 0) >= 5 && (
                    <div className="flex items-center gap-3">
                      <HexagonBadge 
                        number={5} 
                        topColor="#F1F8E9" 
                        bottomColor="#8EB339" 
                        icon="🔥" 
                      />
                      <span className="text-sm font-medium text-foreground">Gone streaking 5</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Maker History */}
              <div className="space-y-5 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Maker History</h4>
                <div className="relative border-l-2 border-border/60 ml-4 pl-6 space-y-6">
                  {products.map(p => (
                    <div key={p.id} className="relative flex items-start gap-3 group">
                      {/* Logo / Marker */}
                      <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-xl overflow-hidden bg-muted border-2 border-background shadow-xs flex-shrink-0 flex items-center justify-center">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="text-xs font-semibold text-[#ff5733]">{p.name.slice(0, 1)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pl-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/products/${getProductSlug(p.name)}`} className="text-xs sm:text-sm font-semibold text-foreground hover:text-[#ff5733] transition-colors">
                            {p.name}
                          </Link>
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                            {new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/90 mt-0.5 line-clamp-1">{p.tagline}</p>
                      </div>
                    </div>
                  ))}

                  {/* Joined Event */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-xl bg-orange-500/15 border-2 border-background flex-shrink-0 flex items-center justify-center text-sm shadow-xs">
                      🎉
                    </div>
                    <div className="pl-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                          Joined IndiHunt 🎉
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Recent'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/90 mt-0.5">Started building & discovering indie software products 🚀</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORUMS TAB */}
          {activeTab === "forums" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
                {isOwnProfile ? "My Discussion Threads" : "Discussion Threads"}
              </h4>
              {userThreads.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No discussion threads created yet.</p>
              ) : (
                <div className="space-y-3">
                  {userThreads.map(thread => (
                    <Link
                      key={thread.id}
                      href={`/threads/${getProductSlug(thread.title)}`}
                      className="block p-4 bg-white dark:bg-card border border-border shadow-xs rounded-2xl hover:border-orange-500/30 hover:shadow-md transition-all"
                    >
                      <span className="text-xs font-semibold text-foreground block mb-1">{thread.title}</span>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{thread.body}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80 font-semibold">
                        <span>💬 {thread.comments_count || 0} Comments</span>
                        <span>🔺 {thread.upvotes_count || 0} Upvotes</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Recent Activities</h4>
              {activitiesList.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No recent activities found.</p>
              ) : (
                <div className="space-y-4">
                  {activitiesList.map(act => (
                    <div key={act.id} className="flex gap-4 items-start p-4 bg-white dark:bg-card border border-border shadow-xs rounded-2xl">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center font-bold text-sm border border-border">
                        {act.logo ? (
                          <img src={act.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          "P"
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-foreground block">
                            {profile?.full_name || "User"} <span className="font-medium text-muted-foreground">{act.title}</span>
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(act.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{act.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UPVOTES TAB */}
          {activeTab === "upvotes" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">{userUpvotes.length} Upvotes</h4>
              {userUpvotes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No upvoted products yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userUpvotes.map(prod => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.id}`}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-card border border-border shadow-xs rounded-2xl hover:border-orange-500/30 hover:shadow-md transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center font-semibold text-sm text-orange-500 flex-shrink-0">
                        {prod.logo_url ? (
                          <img src={prod.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          prod.name.charAt(0)
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold text-foreground block truncate group-hover:text-[#ff5733] transition-colors">{prod.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">{prod.tagline}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HUNTED TAB */}
          {activeTab === "hunted" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Hunted / Launched Products</h4>
              {products.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">You haven&apos;t launched any products yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map(prod => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.id}`}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-card border border-border shadow-xs rounded-2xl hover:border-orange-500/30 hover:shadow-md transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center font-semibold text-sm text-orange-500 flex-shrink-0">
                        {prod.logo_url ? (
                          <img src={prod.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          prod.name.charAt(0)
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold text-foreground block truncate group-hover:text-[#ff5733] transition-colors">{prod.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">{prod.tagline}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COLLECTION TAB */}
          {activeTab === "collection" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {isOwnProfile ? "My Collections" : "Collections"}
                </h4>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowNewCollectionModal(true)}
                    className="px-3 py-1.5 bg-[#ff5733] hover:opacity-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Collection</span>
                  </button>
                )}
              </div>

              {collections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No collections created yet. Group products you love together!</p>
              ) : (
                <div className="space-y-4">
                  {collections.map(col => (
                    <div key={col.id} className="p-5 bg-white dark:bg-card border border-border shadow-xs rounded-2xl space-y-3 relative group/col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-semibold text-foreground block">{col.name}</span>
                          {col.description && (
                            <span className="text-[10px] text-muted-foreground">{col.description}</span>
                          )}
                        </div>
                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user?.id) return;
                              if (confirm(`Are you sure you want to delete collection "${col.name}"?`)) {
                                await deleteCollection(col.id, user.id);
                                setCollections(prev => prev.filter(c => c.id !== col.id));
                              }
                            }}
                            className="p-1 text-muted-foreground hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete collection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {col.products && col.products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {col.products.map(prod => (
                            <div key={prod.id} className="relative group/prod flex items-center justify-between p-2.5 bg-white dark:bg-card border border-border shadow-2xs rounded-xl hover:border-orange-500/30 transition-all">
                              <Link
                                href={`/products/${prod.id}`}
                                className="flex items-center gap-2.5 min-w-0 flex-1"
                              >
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center font-semibold text-xs">
                                  {prod.logo_url ? <img src={prod.logo_url} className="w-full h-full object-cover" /> : prod.name.charAt(0)}
                                </div>
                                <span className="text-[11px] font-semibold text-foreground truncate">{prod.name}</span>
                              </Link>
                              {isOwnProfile && (
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    if (!user?.id) return;
                                    await removeProductFromCollection(col.id, prod.id, user.id);
                                    setCollections(prev => prev.map(c => c.id === col.id ? { ...c, products: (c.products || []).filter(p => p.id !== prod.id) } : c));
                                  }}
                                  className="p-1 text-muted-foreground hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                  title="Remove product from collection"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/80 italic block">No products inside this collection yet.</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Create Collection Modal */}
              {showNewCollectionModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <form onSubmit={handleCreateCollection} className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Create New Collection</h4>
                      <p className="text-[10px] text-muted-foreground">Keep your favorite digital products organized.</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Collection Name</label>
                        <input
                          type="text"
                          placeholder="e.g. My Favorite Dev Tools"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          className="w-full bg-muted/25 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Description (Optional)</label>
                        <textarea
                          placeholder="e.g. Best developer tools launched this year"
                          value={newCollectionDesc}
                          onChange={(e) => setNewCollectionDesc(e.target.value)}
                          className="w-full bg-muted/25 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 h-16 resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewCollectionModal(false)}
                        className="px-3.5 py-1.5 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingCol}
                        className="px-3.5 py-1.5 bg-[#ff5733] text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        {isCreatingCol ? "Creating..." : "Create"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* STACKS TAB */}
          {activeTab === "stacks" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {isOwnProfile ? "My Tech Stack" : "Tech Stack"}
                </h4>
                <p className="text-xs text-muted-foreground">Tools and products active in their development stack.</p>
              </div>

              {/* Add Stack Form */}
              {isOwnProfile && (
                <div className="flex flex-col sm:flex-row gap-2 bg-muted/15 p-4 border border-border/80 rounded-2xl">
                  <select
                    value={selectedProductForStack}
                    onChange={(e) => setSelectedProductForStack(e.target.value)}
                    className="w-full max-w-full sm:flex-1 min-w-0 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">Select a tool/product to add...</option>
                    {availableProducts
                      .filter(p => !userStack.some(s => s.id === p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                  <button
                    onClick={handleAddToStack}
                    disabled={!selectedProductForStack}
                    className="w-full sm:w-auto justify-center px-4 py-2 bg-foreground text-background hover:opacity-90 disabled:opacity-50 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              )}

              {userStack.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No products added to stack yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userStack.map(prod => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-card border border-border shadow-xs rounded-2xl group"
                    >
                      <Link href={`/products/${prod.id}`} className="flex items-center gap-3 overflow-hidden mr-2">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center font-semibold text-sm text-orange-500 flex-shrink-0">
                          {prod.logo_url ? (
                            <img src={prod.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            prod.name.charAt(0)
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-semibold text-foreground block truncate group-hover:text-[#ff5733] transition-colors">{prod.name}</span>
                          <span className="text-[10px] text-muted-foreground block truncate">{prod.tagline}</span>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleRemoveFromStack(prod.id)}
                        className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">My Reviews</h4>
              {userReviews.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No reviews posted yet.</p>
              ) : (
                <div className="space-y-4">
                  {userReviews.map(rev => (
                    <div key={rev.id} className="p-5 bg-white dark:bg-card border border-border shadow-xs rounded-2xl space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <Link href={`/products/${rev.product?.id}`} className="hover:underline">
                          <span className="text-xs font-semibold text-foreground block">{rev.product?.name}</span>
                        </Link>
                        <div className="flex items-center gap-0.5 bg-orange-500/10 text-orange-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                          <span>⭐</span>
                          <span>{rev.rating}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{rev.body}</p>
                      <span className="text-[9px] text-muted-foreground/80 block">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "campaigns" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Self-Serve Advertising</h4>
                  <p className="text-xs text-muted-foreground mt-1">Create and manage your CPC/CPM advertising campaigns to boost product discovery.</p>
                </div>
                {isOwnProfile && (
                  <Link
                    href="/ads"
                    className="bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Campaign</span>
                  </Link>
                )}
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-16 px-4 bg-card/20 border border-border/60 rounded-3xl space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-xl">📣</div>
                  <h4 className="text-sm font-semibold text-foreground">Launch Your First Ad</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Advertise your products across premium high-traffic spots on IndiHunt. Automated budget controls and detailed analytics.
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/ads"
                      className="bg-[#ff5733] hover:bg-[#e64a19] text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all inline-block"
                    >
                      Create Campaign
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats dashboard grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Campaigns</span>
                      <span className="text-lg font-bold text-foreground block mt-1">{campaigns.length}</span>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Running</span>
                      <span className="text-lg font-bold text-emerald-500 block mt-1">
                        {campaigns.filter(c => c.status === "active").length}
                      </span>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Total Target</span>
                      <span className="text-lg font-bold text-foreground block mt-1">
                        {campaigns.reduce((acc, c) => acc + (c.target_impressions || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Total Delivered</span>
                      <span className="text-lg font-bold text-orange-500 block mt-1">
                        {campaigns.reduce((acc, c) => acc + (c.delivered_impressions || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">Impressions</span>
                      <span className="text-lg font-bold text-foreground block mt-1">
                        {campaigns.reduce((acc, c) => acc + c.impressions, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">CTR</span>
                      <span className="text-lg font-bold text-foreground block mt-1">
                        {(() => {
                          const totalViews = campaigns.reduce((acc, c) => acc + c.impressions, 0);
                          const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
                          return totalViews > 0
                            ? `${((totalClicks / totalViews) * 100).toFixed(2)}%`
                            : "0.00%";
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Pending payment notice banner if any campaign is awaiting payment */}
                  {campaigns.some(c => c.status === "pending_payment" || c.status === "draft") && isOwnProfile && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-medium">You have ad campaigns pending payment. Complete checkout on the Ads page to activate immediate impression delivery.</span>
                      </div>
                      <Link
                        href="/ads"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ff5733] hover:bg-[#e64a19] text-white rounded-lg text-xs font-semibold transition-all flex-shrink-0 shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Complete Payment</span>
                      </Link>
                    </div>
                  )}

                  {/* List of campaigns */}
                  <div className="border border-border rounded-3xl overflow-hidden bg-card/20">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className=" bg-card/65 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                            <th className="px-5 py-3.5">Campaign Name</th>
                            <th className="px-5 py-3.5 text-center">Status</th>
                            <th className="px-5 py-3.5">Delivery Progress</th>
                            <th className="px-5 py-3.5 text-center">Impressions</th>
                            <th className="px-5 py-3.5 text-center">Clicks</th>
                            <th className="px-5 py-3.5 text-center">CTR</th>
                            {isOwnProfile && <th className="px-5 py-3.5 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {campaigns.map(camp => {
                            const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : "0.00";
                            const isPendingPayment = camp.status === "pending_payment" || camp.status === "draft";
                            const payUrl = camp.product_id ? `/ads?product_id=${camp.product_id}` : "/ads";

                            return (
                              <tr key={camp.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-5 py-4">
                                  <span className="font-semibold text-foreground block">{camp.name}</span>
                                  <span className="text-[10px] text-muted-foreground block truncate max-w-xs">{camp.headline}</span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                                    camp.status === "active"
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                                      : camp.status === "paused"
                                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                                        : camp.status === "paused_by_admin"
                                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/15"
                                          : isPendingPayment
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
                                </td>
                                <td className="px-5 py-4 text-muted-foreground font-medium">
                                  {camp.delivered_impressions?.toLocaleString()} / {camp.target_impressions?.toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-center font-semibold text-foreground">
                                  {camp.impressions.toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-center font-semibold text-foreground">
                                  {camp.clicks.toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-center font-bold text-orange-500">
                                  {ctr}%
                                </td>
                                {isOwnProfile && (
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Link
                                        href={`/campaigns/${camp.id}`}
                                        className="p-1.5 border border-border bg-background hover:bg-muted text-foreground rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                        title="View Performance Charts"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </Link>

                                      {isPendingPayment ? (
                                        <Link
                                          href={payUrl}
                                          className="px-2.5 py-1 bg-[#ff5733] hover:bg-[#e64a19] text-white text-[10px] font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                          title="Complete payment on Ads page to activate ad"
                                        >
                                          <CreditCard className="w-3.5 h-3.5" />
                                          <span>Pay Now</span>
                                        </Link>
                                      ) : camp.status === "paused_by_admin" ? (
                                        <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-medium rounded-lg" title="Paused by our team. Contact the team for assistance.">
                                          Paused by team
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleUpdateCampaignStatus(camp.id, camp.status)}
                                          className="px-2.5 py-1 border border-border bg-background hover:bg-muted text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                                        >
                                          {camp.status === "active" ? "Pause" : "Resume"}
                                        </button>
                                      )}

                                      {/* Only admin can delete campaigns to prevent makers from accidentally deleting their active paid ads */}
                                      {profile?.role === "admin" && (
                                        <button
                                          onClick={() => handleDeleteCampaignClick(camp.id)}
                                          className="p-1 border border-red-500/20 bg-background hover:bg-red-500/5 text-red-500 rounded-lg transition-all cursor-pointer"
                                          title="Admin only: Delete Campaign"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Modal */}

            </div>
          )}
          {activeTab === "pacts" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className=" pb-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Crew Pacts</h4>
                <p className="text-xs text-muted-foreground mt-1">Pacts are automatically formed when you and another maker upvote each other's products on IndiHunt. On launch day, show up for each other.</p>
              </div>

              {/* Pacts Grid */}
              {pacts.length === 0 ? (
                <div className="text-center py-16 px-4 bg-card/20 border border-border/60 rounded-3xl space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-xl">🤝</div>
                  <h4 className="text-sm font-semibold text-foreground">No active pacts yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Once you and another maker upvote each other's products on IndiHunt, your mutual pact will automatically appear here!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pacts.map((pact) => (
                    <div
                      key={pact.id}
                      className="bg-card/50 border border-border/80 rounded-3xl p-6 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center hover:border-orange-500/10 transition-all duration-300"
                    >
                      {/* Left: Info */}
                      <div className="space-y-4 max-w-xl">
                        <div className="flex items-center gap-2">
                          {pact.theirLaunch.status === "you-upvote" && (
                            <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded-md uppercase">
                              Your Turn
                            </span>
                          )}
                          {pact.theirLaunch.status === "you-upvoted" && (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded-md uppercase">
                              Completed
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-muted-foreground/80 tracking-wider">
                            PACT SINCE {pact.pactSince}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-xl font-extrabold text-foreground">
                            Pact with <span className="text-orange-500">{pact.partnerName}</span>
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium max-w-md">
                            {pact.description}
                          </p>
                        </div>

                        {/* Partner Profile Badge */}
                        <div className="inline-flex items-center gap-2 bg-background border border-border/80 rounded-2xl px-3 py-1.5">
                          <img
                            src={pact.partnerAvatar}
                            alt={pact.partnerName}
                            className="w-5 h-5 rounded-full object-cover border border-border"
                          />
                          <span className="text-[10px] font-bold text-foreground">{pact.partnerName}</span>
                          <span className="text-[9px] font-bold text-orange-500 tracking-wider">
                            • {pact.partnerTrust}
                          </span>
                        </div>
                      </div>

                      {/* Right: Launches Side-by-Side Card */}
                      <div className="w-full lg:w-auto bg-background/50 border border-border/80 rounded-3xl p-5 flex items-center justify-between gap-6 max-w-md lg:max-w-none">
                        {/* Your Launch Card */}
                        <div className="flex flex-col items-center text-center space-y-2 bg-card border border-border/60 p-4 rounded-2xl w-36 shadow-sm">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                            Your Launch
                          </span>
                          {pact.yourLaunch.logoUrl ? (
                            <img src={pact.yourLaunch.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm shadow-inner">
                              {pact.yourLaunch.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-[11px] font-extrabold text-foreground truncate w-full">
                            {pact.yourLaunch.name}
                          </span>
                          <span className="text-[9px] font-semibold text-muted-foreground">
                            {pact.yourLaunch.date}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                            ✓ They Upvoted
                          </span>
                        </div>

                        {/* Pact Separator */}
                        <div className="flex flex-col items-center justify-center text-muted-foreground shrink-0 select-none">
                          <span className="text-xs font-extrabold">→</span>
                          <span className="text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground/60 my-0.5">
                            Pact
                          </span>
                          <span className="text-xs font-extrabold">←</span>
                        </div>

                        {/* Their Launch Card */}
                        <div className="flex flex-col items-center text-center space-y-2 bg-card border border-border/60 p-4 rounded-2xl w-36 shadow-sm">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                            Their Launch
                          </span>
                          {pact.theirLaunch.logoUrl ? (
                            <img src={pact.theirLaunch.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm shadow-inner">
                              {pact.theirLaunch.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-[11px] font-extrabold text-foreground truncate w-full">
                            {pact.theirLaunch.name}
                          </span>
                          <span className="text-[9px] font-semibold text-muted-foreground">
                            {pact.theirLaunch.date}
                          </span>

                          {pact.theirLaunch.status === "you-upvote" ? (
                            <button
                              onClick={() => {
                                setPacts(
                                  pacts.map((item) =>
                                    item.id === pact.id
                                      ? {
                                        ...item,
                                        theirLaunch: {
                                          ...item.theirLaunch,
                                          status: "you-upvoted"
                                        }
                                      }
                                      : item
                                  )
                                );
                              }}
                              className="w-full text-[9px] font-extrabold text-orange-500 hover:text-white border border-orange-500/35 hover:bg-orange-500 bg-orange-500/5 px-2 py-1 rounded-full cursor-pointer transition-all"
                            >
                              ⏳ You Upvote
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                              ✓ Upvoted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>



        {/* Create Story Modal */}
        {showNewStoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              <div>
                <h3 className="text-lg font-extrabold text-foreground">Create New Story</h3>
                <p className="text-xs text-muted-foreground mt-1">Share your design decisions, technical pivots, and founder updates.</p>
              </div>

              <form onSubmit={handleCreateStorySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Story Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. How we scaled to 10k users in a week"
                    value={newStoryTitle}
                    onChange={(e) => setNewStoryTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Category</label>
                    <select
                      value={newStoryCategory}
                      onChange={(e) => setNewStoryCategory(e.target.value)}
                      className="w-full max-w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                    >
                      <option value="Makers">Makers</option>
                      <option value="Opinions">Opinions</option>
                      <option value="News">News</option>
                      <option value="Announcements">Announcements</option>
                      <option value="How To">How To</option>
                      <option value="Interviews">Interviews</option>
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Cover Image (URL or Upload)</label>
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <input
                        type="text"
                        placeholder="https://example.com/image.png"
                        value={newStoryImageUrl}
                        onChange={(e) => setNewStoryImageUrl(e.target.value)}
                        className="flex-1 min-w-0 bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                      />
                      <label className="shrink-0 bg-muted hover:bg-muted/80 text-foreground border border-border px-3.5 py-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all">
                        <span className="text-[10px] font-semibold whitespace-nowrap">
                          {isUploadingStoryImage ? "Uploading..." : "Upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStoryImageUpload}
                          disabled={isUploadingStoryImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {newStoryImageUrl && (
                      <div className="mt-2 relative w-full h-24 rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={newStoryImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewStoryImageUrl("")}
                          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Short Summary / Excerpt</label>
                  <input
                    type="text"
                    placeholder="A brief summary showing up on story cards..."
                    value={newStoryExcerpt}
                    onChange={(e) => setNewStoryExcerpt(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Story Content <span className="text-red-500">*</span></label>
                  <textarea
                    rows={8}
                    placeholder="Write your story here... Markdown is supported."
                    value={newStoryContent}
                    onChange={(e) => setNewStoryContent(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-orange-500 font-sans resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setShowNewStoryModal(false)}
                    className="px-4 py-2.5 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingStory}
                    className="px-5 py-2.5 bg-[#ff5733] text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingStory ? "Publishing..." : "Publish Story"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



      </main>
    </div>

  );
}

export default function ProfilePage({
  initialUserId,
  initialUsername,
  initialProfile,
  initialProducts = []
}: {
  initialUserId?: string | null;
  initialUsername?: string | null;
  initialProfile?: Profile | null;
  initialProducts?: Product[];
} = {}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CircularLoader label="Loading profile..." size="lg" center={false} />
      </div>
    }>
      <ProfileContent
        initialUserId={initialUserId}
        initialUsername={initialUsername}
        initialProfile={initialProfile}
        initialProducts={initialProducts}
      />
    </Suspense>
  );
}
