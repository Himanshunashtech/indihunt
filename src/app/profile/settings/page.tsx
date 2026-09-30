"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle,
  Mail,
  ShieldCheck,
  Rocket,
  Settings,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileCheck,
  FileText,
  BarChart2,
  MessageCircle,
  Award,
  Star,
  Compass,
  Users,
  UserCheck,
  AtSign,
  BellOff,
  Bookmark,
  Bell,
  AlertTriangle,
  Trash2,
  UserX
} from "lucide-react";
import { 
  supabase, 
  getUserProfile, 
  getUserProducts,
  updateUserProfile,
  uploadImage,
  signOut,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  deactivateUserAccount,
  deleteUserAccount,
  UserNotificationSettings,
  DEFAULT_USER_NOTIFICATION_SETTINGS,
  Profile,
  Product,
  Thread,
  Review,
  INDIE_PAGE_THEMES
} from "@/lib/supabase";

function BlueToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#2563eb]" : "bg-slate-300 dark:bg-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followersList, setFollowersList] = useState<Profile[]>([]);
  const [followingList, setFollowingList] = useState<Profile[]>([]);
  const [followedProducts, setFollowedProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Edit states
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Notification Settings states
  const [notifSettings, setNotifSettings] = useState<UserNotificationSettings>(DEFAULT_USER_NOTIFICATION_SETTINGS);
  const [newslettersExpanded, setNewslettersExpanded] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(true);
  const [notifToast, setNotifToast] = useState("");

  // Deactivation and Deletion states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isProcessingAccountAction, setIsProcessingAccountAction] = useState(false);

  // Indie Page States
  const [indiePageEnabled, setIndiePageEnabled] = useState(false);
  const [indiePageTheme, setIndiePageTheme] = useState("light");
  const [isUpdatingIndiePage, setIsUpdatingIndiePage] = useState(false);
  const [indiePageMsg, setIndiePageMsg] = useState("");

  const handleDeactivateAccount = async () => {
    if (!user?.id) return;
    setIsProcessingAccountAction(true);
    await deactivateUserAccount(user.id);
    setIsProcessingAccountAction(false);
    setShowDeactivateModal(false);
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || deleteConfirmText.trim().toLowerCase() !== "delete my account") return;
    setIsProcessingAccountAction(true);
    await deleteUserAccount(user.id);
    setIsProcessingAccountAction(false);
    setShowDeleteModal(false);
    router.push("/");
  };

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
        getUserNotificationSettings(session.user.id).then(setNotifSettings);
      }
    });
  }, [router]);

  const handleToggleSetting = async (key: keyof UserNotificationSettings, value: boolean) => {
    if (!user?.id) return;
    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);

    // If turning on a browser push notification, request native browser permission
    if (value && (key === "new_followers_push" || key === "friend_posts_push" || key === "mentions_push")) {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          try {
            const perm = await Notification.requestPermission();
            if (perm !== "granted") {
              setNotifToast("Push permission denied by browser");
              setTimeout(() => setNotifToast(""), 3000);
            }
          } catch (e) {
            console.error("Browser push permission error:", e);
          }
        }
      }
    }

    await updateUserNotificationSettings(user.id, { [key]: value });
    setNotifToast("Preferences saved");
    setTimeout(() => setNotifToast(""), 2000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    setProfileMsg("");
    try {
      const updated = await updateUserProfile(user.id, {
        full_name: editName,
        username: editUsername,
        headline: editHeadline,
        avatar_url: editAvatar,
        linkedin_url: editLinkedin,
        twitter_url: editTwitter,
        github_url: editGithub,
        website: editWebsite,
        location: editLocation
      });
      if (updated) {
        setProfile(updated);
        setProfileMsg("Profile updated successfully!");
      } else {
        const updatedMock = {
          ...profile,
          full_name: editName,
          username: editUsername,
          headline: editHeadline,
          avatar_url: editAvatar,
          linkedin_url: editLinkedin,
          twitter_url: editTwitter,
          github_url: editGithub,
          website: editWebsite,
          location: editLocation
        } as Profile;
        setProfile(updatedMock);
        setProfileMsg("Profile updated (local preview)!");
      }
    } catch (err: any) {
      console.error(err);
      setProfileMsg("Error updating profile: " + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const fetchProfile = async (uid: string) => {
    setIsLoading(true);
    const prof = await getUserProfile(uid);
    if (prof) {
      setProfile(prof);
      setEditName(prof.full_name || "");
      setEditUsername(prof.username || "");
      setEditHeadline(prof.headline || "");
      setEditAvatar(prof.avatar_url || "");
      setEditLinkedin(prof.linkedin_url || "");
      setEditTwitter(prof.twitter_url || "");
      setEditGithub(prof.github_url || "");
      setEditWebsite(prof.website || "");
      setEditLocation(prof.location || "");
      setIndiePageEnabled(prof.indie_page_enabled ?? true);
      setIndiePageTheme(prof.indie_page_theme || "light");
    }
    
    try {
      const ownProducts = await getUserProducts(uid);

      let memberProdsList: Product[] = [];
      if (supabase) {
        try {
          const { data: memberProducts } = await supabase
            .from("product_members")
            .select("products(*)")
            .eq("user_id", uid);

          memberProdsList = (memberProducts || [])
            .map((m: any) => m.products)
            .filter((p): p is Product => !!p);
        } catch (e) {}
      }

      const combined = [...(ownProducts || []), ...memberProdsList];
      const uniqueProducts = combined.filter(
        (value, index, self) => self.findIndex(p => p.id === value.id) === index
      );

      uniqueProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProducts(uniqueProducts as Product[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-muted-foreground font-medium">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      <Navbar />

      {/* Main container */}
      <main className="max-w-4xl mx-auto px-4 pt-42 sm:pt-44 pb-20">
        <div className="space-y-10">
          
          <div className="flex flex-row items-center justify-between">
            <h1 className="text-base font-semibold text-foreground tracking-tight">My details</h1>
            <Link href="/profile" className="text-sm font-medium text-orange-500 hover:underline">
              View my profile
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
            {/* Avatar Section */}
            <div className="flex flex-row items-center gap-4 py-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-2xl font-medium text-foreground flex-shrink-0">
                {editAvatar ? (
                  <Image src={editAvatar} alt="Avatar" className="w-full h-full object-cover" width={48} height={48} />
                ) : profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" width={48} height={48} />
                ) : (
                  profile?.full_name?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="Paste image URL..."
                    className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-orange-500 w-60"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Recommended size: 400x400px image URL</p>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
                <input 
                  type="text" 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Headline</label>
              <input 
                type="text" 
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                placeholder="A short tagline describing yourself"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Location</label>
                <input 
                  type="text" 
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, India"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">LinkedIn Profile URL</label>
                <input 
                  type="url" 
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Twitter / X URL</label>
                <input 
                  type="url" 
                  value={editTwitter}
                  onChange={(e) => setEditTwitter(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">GitHub Profile URL</label>
                <input 
                  type="url" 
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Personal / Product Website URL</label>
              <input 
                type="url" 
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {profileMsg && (
              <p className="text-xs font-medium text-orange-500">{profileMsg}</p>
            )}

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isUpdatingProfile}
                className="relative inline-block rounded-full border-2 border-orange-500 bg-[#ff5733] px-6 py-2.5 text-center text-sm font-medium text-white transition-all duration-300 hover:bg-[#e64a19] shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isUpdatingProfile ? "Saving changes..." : "Save details"}
              </button>
            </div>
          </form>

          {/* IndiHunt Page Section */}
          <div className="border-t border-border pt-10 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
                <Rocket className="w-5 h-5 text-orange-500" />
                <span>IndiHunt Page</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-normal leading-relaxed">
                Create a beautiful standalone page to showcase all your launched products — like a showcase for makers.
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between gap-4 p-4 border border-border/80 rounded-2xl bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <Star className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-foreground block">Enable IndiHunt Page</span>
                  <span className="text-[11px] text-muted-foreground block font-normal leading-relaxed">
                    Make your page public at <strong className="text-orange-500">indihunt.in/page/{profile?.username}</strong>
                  </span>
                </div>
              </div>
              <BlueToggleSwitch
                checked={indiePageEnabled}
                onChange={async (val) => {
                  setIndiePageEnabled(val);
                  setIsUpdatingIndiePage(true);
                  await updateUserProfile(user.id, { indie_page_enabled: val });
                  setIsUpdatingIndiePage(false);
                  setIndiePageMsg(val ? "Page enabled!" : "Page disabled");
                  setTimeout(() => setIndiePageMsg(""), 2000);
                }}
              />
            </div>

            {indiePageMsg && (
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full animate-pulse">
                {indiePageMsg}
              </span>
            )}

            {/* View Page & Open Studio Links */}
            {profile?.username && (
              <div className="pt-2 flex flex-wrap gap-3 items-center">
                <Link
                  href="/pages/studio"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/20"
                >
                  🎨 Customize in Studio (/pages/studio)
                </Link>
                {indiePageEnabled && (
                  <a
                    href={`/page/${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
                  >
                    🚀 View Live Page
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Product Hunt Style Granular Notification Settings Section */}
          <div className="border-t border-border pt-10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <span>Notification Preferences</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-normal leading-relaxed">
                  Configure real-time in-app and browser push notifications for your activity and followed products.
                </p>
              </div>
              {notifToast && (
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full animate-pulse">
                  {notifToast}
                </span>
              )}
            </div>

            {/* Collapsible Section 1: Newsletters */}
            <div className="border border-border/80 rounded-2xl bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setNewslettersExpanded(!newslettersExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-orange-500" />
                  <div>
                    <span className="text-xs font-extrabold text-foreground block">Newsletters</span>
                    <span className="text-[11px] text-muted-foreground block font-normal leading-relaxed">Top products, breakthrough trends, and tech stories for your feed.</span>
                  </div>
                </div>
                {newslettersExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {newslettersExpanded && (
                <div className="p-4 border-t border-border/80 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground font-semibold">Daily Product Hunt Digest</span>
                    <BlueToggleSwitch
                      checked={notifSettings.discovery_notifications}
                      onChange={(val) => handleToggleSetting("discovery_notifications", val)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Section 2: Notifications List */}
            <div className="border border-border/80 rounded-2xl bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setNotificationsExpanded(!notificationsExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-orange-500" />
                  <div>
                    <span className="text-xs font-extrabold text-foreground block">Notifications</span>
                    <span className="text-[11px] text-muted-foreground block font-normal leading-relaxed">Real-time alerts on your activity and products you follow.</span>
                  </div>
                </div>
                {notificationsExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {notificationsExpanded && (
                <div className="divide-y divide-border/60 bg-card">
                  
                  {/* Single Toggle Rows */}
                  {[
                    { key: "product_updates_inapp" as const, icon: Rocket, label: "Product update alerts", desc: "Get notified in-app about updates and announcements from products." },
                    { key: "forum_threads_inapp" as const, icon: MessageSquare, label: "Forum thread notifications", desc: "Get notified when a forum thread is created by people you follow." },
                    { key: "forum_status_inapp" as const, icon: FileCheck, label: "Forum thread status notifications", desc: "Get notified in-app about forum thread moderation decisions." },
                    { key: "comment_digest_inapp" as const, icon: FileText, label: "Comment digest notifications", desc: "Receive in-app summaries of comments on your products." },
                    { key: "maker_reports_inapp" as const, icon: BarChart2, label: "Maker report notifications", desc: "Receive digests and notifications related to your launched products." },
                    { key: "product_feedback_inapp" as const, icon: MessageCircle, label: "Product feedback notifications", desc: "Get updates about engagement and recognition for your products." },
                    { key: "personal_achievements_inapp" as const, icon: Award, label: "Personal achievement notifications", desc: "Receive alerts about badges and achievements awarded to your profile." },
                    { key: "product_recognitions_inapp" as const, icon: Star, label: "Product recognition notifications", desc: "Stay informed about special recognition and badges awarded to your products." },
                    { key: "discovery_notifications" as const, icon: Compass, label: "Discovery notifications", desc: "Receive browser/in-app notifications about trending products you might enjoy." },
                  ].map((row) => (
                    <div key={row.key} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <row.icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-foreground block">{row.label}</span>
                          <span className="text-[11px] text-muted-foreground block font-normal leading-relaxed">{row.desc}</span>
                        </div>
                      </div>
                      <BlueToggleSwitch
                        checked={notifSettings[row.key]}
                        onChange={(val) => handleToggleSetting(row.key, val)}
                      />
                    </div>
                  ))}

                  {/* Dual Toggle Rows (In-App & Browser Push) */}
                  {[
                    {
                      groupLabel: "New followers",
                      groupDesc: "Get notified when someone follows you.",
                      groupIcon: Users,
                      inAppKey: "new_followers_inapp" as const,
                      pushKey: "new_followers_push" as const,
                    },
                    {
                      groupLabel: "Friend posts",
                      groupDesc: "Get notified when your friends post new products.",
                      groupIcon: UserCheck,
                      inAppKey: "friend_posts_inapp" as const,
                      pushKey: "friend_posts_push" as const,
                    },
                    {
                      groupLabel: "Mentions",
                      groupDesc: "Get notified when someone mentions you in a comment or forum thread.",
                      groupIcon: AtSign,
                      inAppKey: "mentions_inapp" as const,
                      pushKey: "mentions_push" as const,
                    },
                  ].map((group) => (
                    <div key={group.groupLabel} className="p-4 space-y-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <group.groupIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-foreground block">{group.groupLabel}</span>
                          <span className="text-[11px] text-muted-foreground block font-normal leading-relaxed">{group.groupDesc}</span>
                        </div>
                      </div>

                      <div className="pl-7 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-normal">In-app notifications</span>
                          <BlueToggleSwitch
                            checked={notifSettings[group.inAppKey]}
                            onChange={(val) => handleToggleSetting(group.inAppKey, val)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-normal">Browser push notifications</span>
                          <BlueToggleSwitch
                            checked={notifSettings[group.pushKey]}
                            onChange={(val) => handleToggleSetting(group.pushKey, val)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>

            {/* Bottom Actions: Unsubscribe All & Auto-Follow */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-4 p-4 border border-border/80 rounded-2xl bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <BellOff className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Unsubscribe from all notifications</span>
                    <span className="text-[11px] text-muted-foreground block font-normal leading-relaxed">
                      Unsubscribe from all newsletters and notifications. You'll still receive important messaging like password resets.
                    </span>
                  </div>
                </div>
                <BlueToggleSwitch
                  checked={notifSettings.unsubscribe_all}
                  onChange={(val) => handleToggleSetting("unsubscribe_all", val)}
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-4 border border-border/80 rounded-2xl bg-card hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <Bookmark className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Auto-follow when commenting</span>
                    <span className="text-[11px] text-muted-foreground block font-normal leading-relaxed">
                      When you comment on a product or thread, you will automatically follow it.
                    </span>
                  </div>
                </div>
                <BlueToggleSwitch
                  checked={notifSettings.auto_follow_commenting}
                  onChange={(val) => handleToggleSetting("auto_follow_commenting", val)}
                />
              </div>
            </div>

          </div>

          {/* Account Management & Danger Zone (Matching Screenshot) */}
          <div className="border-t border-border pt-12 space-y-8">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-foreground tracking-tight">Account Management</h3>
              <p className="text-[11px] text-muted-foreground font-normal">Deactivate or permanently delete your account and associated personal data.</p>
            </div>

            <div className="space-y-6 max-w-xl mx-auto py-4">
              {/* Deactivate Account */}
              <div className="flex flex-col items-center justify-center text-center space-y-3.5 p-6 bg-card border border-border/80 rounded-3xl shadow-2xs">
                <p className="text-sm font-normal text-foreground">Would you like to deactivate your account?</p>
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(true)}
                  className="px-6 py-2.5 rounded-full border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-all shadow-2xs cursor-pointer"
                >
                  Deactivate Account
                </button>
              </div>

              {/* Delete Account */}
              <div className="flex flex-col items-center justify-center text-center space-y-3.5 p-6 bg-card border border-border/80 rounded-3xl shadow-2xs">
                <p className="text-sm font-normal text-foreground">Would you like to delete your account and all associated data?</p>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2.5 rounded-full border border-border bg-card hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/40 text-foreground text-sm font-medium transition-all shadow-2xs cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-foreground">Deactivate Account?</h4>
                <p className="text-[10px] text-amber-500 font-semibold">Temporary account pause</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Your profile will be hidden and your account will be paused. Your submitted products and comments will remain on the site. You can reactivate anytime by logging back in.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAccountAction}
                onClick={handleDeactivateAccount}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessingAccountAction ? "Deactivating..." : "Confirm Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-foreground">Permanently Delete Account?</h4>
                <p className="text-[10px] text-red-500 font-semibold">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/60 text-xs space-y-2">
              <p className="text-xs font-semibold text-foreground">Data Retention & Privacy Notice:</p>
              <ul className="list-disc pl-4 text-muted-foreground space-y-1.5 text-[11px] leading-relaxed font-medium">
                <li><strong className="text-foreground font-semibold">Submitted Products:</strong> Products you launched will remain live on IndiHunt so upvotes and community threads stay intact.</li>
                <li><strong className="text-foreground font-semibold">Comments & Posts:</strong> Your name will be anonymized to "Deleted User".</li>
                <li><strong className="text-foreground font-semibold">Personal Data:</strong> Your email, profile bio, avatar, and notification settings will be permanently deleted.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Type <span className="text-red-500 font-mono font-semibold">delete my account</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete my account"
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAccountAction || deleteConfirmText.trim().toLowerCase() !== "delete my account"}
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessingAccountAction ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
