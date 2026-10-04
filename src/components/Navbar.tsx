"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Bell,
  Rocket,
  Compass,
  GraduationCap,
  Code2,
  Flame,
  Mail,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Trophy,
  Sparkles,
  Users,
  Newspaper,
  Home,
  Megaphone,
  Target,
  LayoutGrid,
  User,
  Settings,
  LogOut,
  Globe,
  ShieldCheck,
  Loader2,
  HelpCircle,
  Info,
  Briefcase,
  BarChart3,
  Award,
  Package,
  Clock,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import ThemeToggle from "@/components/ThemeToggle";
import {
  signInWithGoogle,
  signOut,
  clearCache,
  markAllNotificationsAsRead,
  getCategorySlug,
  type NotificationItem
} from "@/lib/supabase";
import { useUnreadNotificationsCount, useNotifications } from "@/hooks/useDb";
import { queryClient } from "@/lib/queryClient";
import { useAppDispatch, useAppSelector, setAuthModalOpen, logout } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";

interface NavbarProps {
  /** current theme — pass in from parent if you manage it there, otherwise Navbar manages it internally */
  theme?: "light" | "dark";
  onThemeToggle?: () => void;
  /** optional search state lifted up */
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  /** called when the user clicks Forums tab */
  onForumsClick?: () => void;
  /** called when user clicks on search input */
  onSearchClick?: () => void;
}

export default function Navbar({
  theme: externalTheme,
  onThemeToggle,
  searchQuery = "",
  onSearchChange,
  onForumsClick,
  onSearchClick,
}: NavbarProps) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [internalTheme, setInternalTheme] = useState<"light" | "dark">("light");
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentProfile = useAppSelector((state) => state.auth.profile);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const activeUser = mounted ? currentUser : null;
  const showAuthUI = mounted && !authLoading;

  const avatarUrl = useMemo(() => {
    if (currentProfile?.avatar_url) return currentProfile.avatar_url;
    if (activeUser?.user_metadata?.avatar_url) return activeUser.user_metadata.avatar_url;
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80";
  }, [currentProfile, activeUser]);

  const profileHref = useMemo(() => {
    if (currentProfile?.username) return `/@${currentProfile.username}`;
    const metaUsername = activeUser?.user_metadata?.user_name || activeUser?.user_metadata?.preferred_username;
    if (metaUsername) return `/@${metaUsername}`;
    return "/profile";
  }, [currentProfile?.username, activeUser?.user_metadata]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<"top" | "launches" | "forums" | "news" | "profile" | null>("top");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [visibleNotificationsCount, setVisibleNotificationsCount] = useState(10);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount(activeUser?.id);
  const { data: fetchedNotifications } = useNotifications(activeUser?.id, notificationsOpen);

  useEffect(() => {
    if (fetchedNotifications) {
      setNotificationsList(fetchedNotifications);
    }
  }, [fetchedNotifications]);

  const handleNotificationsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 50;
    if (bottom && visibleNotificationsCount < notificationsList.length) {
      setVisibleNotificationsCount(prev => prev + 10);
    }
  };

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (currentProfile?.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    if (notificationsOpen) {
      setVisibleNotificationsCount(10);
    }
  }, [notificationsOpen]);

  const [launchesOpen, setLaunchesOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [discussionsOpen, setDiscussionsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const launchesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const newsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const discussionsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const categoriesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const launchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const profileTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLaunchesEnter = () => {
    if (launchesTimerRef.current) clearTimeout(launchesTimerRef.current);
    setLaunchesOpen(true);
  };
  const handleLaunchesLeave = () => {
    launchesTimerRef.current = setTimeout(() => {
      setLaunchesOpen(false);
    }, 150);
  };

  const handleNewsEnter = () => {
    if (newsTimerRef.current) clearTimeout(newsTimerRef.current);
    setNewsOpen(true);
  };
  const handleNewsLeave = () => {
    newsTimerRef.current = setTimeout(() => {
      setNewsOpen(false);
    }, 150);
  };

  const handleDiscussionsEnter = () => {
    if (discussionsTimerRef.current) clearTimeout(discussionsTimerRef.current);
    setDiscussionsOpen(true);
  };
  const handleDiscussionsLeave = () => {
    discussionsTimerRef.current = setTimeout(() => {
      setDiscussionsOpen(false);
    }, 150);
  };

  const handleLaunchEnter = () => {
    if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
    setLaunchOpen(true);
  };
  const handleLaunchLeave = () => {
    launchTimerRef.current = setTimeout(() => {
      setLaunchOpen(false);
    }, 150);
  };

  const handleProfileEnter = () => {
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    setProfileOpen(true);
  };
  const handleProfileLeave = () => {
    profileTimerRef.current = setTimeout(() => {
      setProfileOpen(false);
    }, 150);
  };

  const handleCategoriesEnter = () => {
    if (categoriesTimerRef.current) clearTimeout(categoriesTimerRef.current);
    setCategoriesOpen(true);
  };
  const handleCategoriesLeave = () => {
    categoriesTimerRef.current = setTimeout(() => {
      setCategoriesOpen(false);
    }, 150);
  };

  const theme = externalTheme ?? internalTheme;

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (onSearchClick) {
          onSearchClick();
        } else {
          router.push("/search");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchClick, router]);

  // Internal theme init (only when not controlled externally)
  useEffect(() => {
    if (externalTheme) return;
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const init = saved || "light";
    setInternalTheme(init);
    if (init === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [externalTheme]);

  const handleThemeToggle = () => {
    if (onThemeToggle) {
      onThemeToggle();
    } else {
      const next = internalTheme === "light" ? "dark" : "light";
      setInternalTheme(next);
      localStorage.setItem("theme", next);
      if (next === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  };

  const handleSignOut = async () => {
    try {
      // 1. Clear ALL caches synchronously BEFORE Redux state change triggers re-render
      clearCache();
      queryClient.clear();
      if (typeof window !== 'undefined') {
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(k => {
            // Never delete cookie consent preferences or theme
            if (
              k === 'indihunt_cookie_consent_v1' ||
              k.includes('cookie_consent') ||
              k.includes('cookie_preference') ||
              k === 'theme'
            ) {
              return;
            }
            if (k.startsWith('ih_') || k.startsWith('indihunt_') || k.startsWith('sb-')) {
              localStorage.removeItem(k);
            }
          });
          sessionStorage.clear();
          document.cookie.split(";").forEach((c) => {
            const trimmed = c.trim();
            const cookieName = trimmed.split("=")[0];
            if (
              cookieName.startsWith("sb-") ||
              cookieName.includes("auth-token") ||
              cookieName.includes("access_token") ||
              cookieName.includes("refresh_token")
            ) {
              document.cookie = cookieName + "=;expires=" + new Date(0).toUTCString() + ";path=/";
            }
          });
        } catch (e) { }
      }

      // 2. Optimistic Client Cleanup & URL sanitization
      dispatch(logout());
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, "", "/");
      }

      // 3. Trigger full signout in background non-blockingly
      signOut().catch(console.error);

      // 4. Instant SPA navigation
      router.push("/");
    } catch (err) {
      console.error("Signout error:", err);
      router.push("/");
    }
  };

  // Close drawer on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  // Close notifications panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        const bellBtn = document.getElementById("bell-btn");
        if (bellBtn && bellBtn.contains(e.target as Node)) return;
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notificationsOpen]);

  // Lock body scroll when drawer or notifications panel is open
  useEffect(() => {
    document.body.style.overflow = (mobileOpen || notificationsOpen) ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileOpen, notificationsOpen]);

  const navLinks = [
    { label: "Home", href: "/", emoji: "🏠" },
    { label: "Pages", href: "/pages", emoji: "⚡" },
    { label: "Discussions", href: "/discussions", emoji: "💬" },
    { label: "Launch Archive", href: "/best-products", emoji: "🚀" },
    { label: "Launch Guide", href: "/guide", emoji: "🧭" },
    { label: "Stories", href: "/stories", emoji: "📖" },
    { label: "Changelog", href: "/changelog", emoji: "📗" },
    { label: "Makers", href: "/makers", emoji: "👾" },
    { label: "Top Hunters", href: "/top-hunters", emoji: "🎯" },
    { label: "Top Products", href: "/best-products", emoji: "🏆" },
  ];

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header suppressHydrationWarning className="fixed top-0 left-0 right-0 z-50 w-full bg-card/95 backdrop-blur-md border-b-2 border-border shadow-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center relative">

          {/* Left Group: Logo and Search */}
          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="xl:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer mr-1"
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/" prefetch={true} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-orange-500/20 border border-orange-500/30">
                <Image
                  src="/logo.webp"
                  alt="IndiHunt logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="hidden xs:block">
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent block leading-none">
                  IndiHunt
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mt-0.5">
                  Tech India
                </span>
              </div>
            </Link>

            {/* Search — desktop only */}
            <div className="hidden md:flex w-48 sm:w-60 relative items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="search-input"
                type="text"
                placeholder="Search ( ctrl + k )"
                value={onSearchChange ? searchQuery : internalSearchQuery}
                readOnly={!!onSearchClick}
                onClick={() => {
                  if (onSearchClick) {
                    onSearchClick();
                  } else if (!onSearchChange && pathname !== '/search') {
                    router.push('/search');
                  }
                }}
                onChange={(e) => {
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  } else {
                    setInternalSearchQuery(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !onSearchChange) {
                    const q = internalSearchQuery.trim();
                    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
                  }
                }}
                className="w-full bg-muted/70 border-2 border-border/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-full py-2 pl-10 pr-14 text-sm font-normal text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange-500 transition-all cursor-pointer shadow-xs"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[9px] font-semibold text-muted-foreground shadow-xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Centered Navigation — absolute so it's always truly centered */}
          <div className="hidden xl:flex absolute left-1/2 -translate-x-1/2 items-center">
            {/* Desktop nav */}
            <nav id="navbar-menu" suppressHydrationWarning className="hidden xl:flex items-center gap-6 lg:gap-8">
              {/* Best Products (Categories) dropdown */}
              <div
                onMouseEnter={handleCategoriesEnter}
                onMouseLeave={handleCategoriesLeave}
              >
                {!mounted ? (
                  <button
                    className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-2"
                  >
                    Best Products <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
                  </button>
                ) : (
                  <DropdownMenu.Root open={categoriesOpen} onOpenChange={setCategoriesOpen} modal={false}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-2"
                      >
                        Best Products {categoriesOpen ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/70" />}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="start"
                        sideOffset={8}
                        className="z-50 min-w-[360px] bg-card border border-border p-4 rounded-2xl shadow-2xl focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseEnter={handleCategoriesEnter}
                        onMouseLeave={handleCategoriesLeave}
                      >
                        <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-border pb-2 mb-3">
                          Browse Best Products by Category
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                          {[
                            "SaaS",
                            "Artificial Intelligence",
                            "AI Agents & Automation",
                            "Productivity",
                            "Marketing Tools",
                            "Finance & FinTech",
                            "Developer Tools",
                            "APIs & Integrations",
                            "Open Source",
                            "Design Tools",
                            "Mobile Apps",
                            "Web3 & Crypto",
                            "E-Commerce & Retail",
                            "Health & Fitness",
                            "Education & EdTech",
                            "Analytics & Data",
                            "Cybersecurity",
                            "Social & Community",
                            "Media & Entertainment",
                            "No-Code & Low-Code",
                            "Customer Support & CRM",
                            "AR/VR"
                          ].map((cat) => (
                            <DropdownMenu.Item asChild key={cat}>
                              <Link
                                href={`/categories/${getCategorySlug(cat)}`}
                                className="text-xs font-normal text-foreground/80 hover:text-orange-500 hover:bg-muted/70 px-2.5 py-1.5 rounded-lg transition-colors block truncate"
                              >
                                {cat}
                              </Link>
                            </DropdownMenu.Item>
                          ))}
                        </div>
                        <div className="border-t border-border/80 mt-3 pt-3 flex justify-end">
                          <DropdownMenu.Item asChild>
                            <Link href="/categories" className="text-xs font-normal uppercase tracking-wider text-orange-500 hover:underline flex items-center gap-1">
                              Show all categories →
                            </Link>
                          </DropdownMenu.Item>
                        </div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>

              {/* Launches dropdown */}
              <div
                onMouseEnter={handleLaunchesEnter}
                onMouseLeave={handleLaunchesLeave}
              >
                {!mounted ? (
                  <button
                    className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-2"
                  >
                    Launches <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
                  </button>
                ) : (
                  <DropdownMenu.Root open={launchesOpen} onOpenChange={setLaunchesOpen} modal={false}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-2"
                      >
                        Launches {launchesOpen ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/70" />}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="start"
                        sideOffset={8}
                        className="z-50 min-w-[260px] bg-card border border-border p-2.5 rounded-2xl shadow-2xl space-y-1 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseEnter={handleLaunchesEnter}
                        onMouseLeave={handleLaunchesLeave}
                      >
                        {[
                          { href: "/best-products", icon: Rocket, title: "Launch archive", sub: "Most-loved launches by the community", bg: "bg-orange-500/10", color: "text-orange-500" },
                          { href: "/pages", icon: Sparkles, title: "IndiHunt Pages", sub: "Personal websites for indie makers", bg: "bg-amber-500/10", color: "text-amber-500" },
                          { href: "/guide", icon: Compass, title: "Launch Guide", sub: "Checklists and pro tips for launching", bg: "bg-indigo-500/10", color: "text-indigo-500" },
                        ].map((item) => (
                          <DropdownMenu.Item asChild key={item.href}>
                            <Link href={item.href} className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted rounded-xl transition-colors">
                              <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.color} flex items-center justify-center text-xs flex-shrink-0`}>
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-normal text-foreground block">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground block">{item.sub}</span>
                              </div>
                            </Link>
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>

              {/* News dropdown */}
              <div
                onMouseEnter={handleNewsEnter}
                onMouseLeave={handleNewsLeave}
              >
                {!mounted ? (
                  <button
                    className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-2"
                  >
                    News <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
                  </button>
                ) : (
                  <DropdownMenu.Root open={newsOpen} onOpenChange={setNewsOpen} modal={false}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-2"
                      >
                        News {newsOpen ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/70" />}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="start"
                        sideOffset={8}
                        className="z-50 min-w-[290px] bg-card border border-border p-2.5 rounded-2xl shadow-2xl space-y-1 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseEnter={handleNewsEnter}
                        onMouseLeave={handleNewsLeave}
                      >
                        {[
                          { href: "/news", icon: Flame, title: "Daily News", sub: "Trending updates in the tech world", bg: "bg-orange-500/10", color: "text-orange-500" },
                          { href: "/stories", icon: BookOpen, title: "Stories", sub: "Tech news, maker interviews, and tips", bg: "bg-rose-500/10", color: "text-rose-500" },
                          { href: "/changelog", icon: ClipboardList, title: "Changelog", sub: "New platform features and releases", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                        ].map((item) => (
                          <DropdownMenu.Item asChild key={item.href}>
                            <Link href={item.href} className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted rounded-xl transition-colors">
                              <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.color} flex items-center justify-center text-xs flex-shrink-0`}>
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-normal text-foreground block">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground block">{item.sub}</span>
                              </div>
                            </Link>
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>

              {/* Forums / Discussions dropdown */}
              <div
                onMouseEnter={handleDiscussionsEnter}
                onMouseLeave={handleDiscussionsLeave}
              >
                {!mounted ? (
                  <button
                    className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-2"
                  >
                    Forums <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
                  </button>
                ) : (
                  <DropdownMenu.Root open={discussionsOpen} onOpenChange={setDiscussionsOpen} modal={false}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5 py-2"
                      >
                        Forums {discussionsOpen ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/70" />}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="start"
                        sideOffset={8}
                        className="z-50 min-w-[240px] bg-card border border-border p-2.5 rounded-2xl shadow-2xl space-y-1 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseEnter={handleDiscussionsEnter}
                        onMouseLeave={handleDiscussionsLeave}
                      >
                        {[
                          { href: "/discussions", icon: MessageSquare, title: "Forums & Discussions", sub: "Join discussions with the community", bg: "bg-orange-500/10", color: "text-orange-500" },
                          { href: "/profile/streak", icon: Flame, title: "Maker Streak", sub: "Track your daily maker contributions", bg: "bg-rose-500/10", color: "text-rose-500" },
                          { href: "/profile/leaderboard", icon: Trophy, title: "Leaderboard", sub: "See top makers on IndiHunt", bg: "bg-amber-500/10", color: "text-amber-500" },
                        ].map((item) => (
                          <DropdownMenu.Item asChild key={item.href}>
                            <Link href={item.href} className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted rounded-xl transition-colors">
                              <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.color} flex items-center justify-center text-xs flex-shrink-0`}>
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-normal text-foreground block">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground block">{item.sub}</span>
                              </div>
                            </Link>
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>

              {/* Top Hunters link */}
              <Link
                href="/top-hunters"
                className="text-base font-medium text-foreground/80 hover:text-orange-500 transition-colors cursor-pointer py-2"
              >
                Top Hunters
              </Link>
            </nav>
          </div>

          {/* Right actions — pushed to the far right */}
          <div suppressHydrationWarning className="flex items-center gap-3 ml-auto">
            {/* Launch (+) button and Notification Bell — logged in users only */}
            {!showAuthUI ? (
              <div className="flex items-center justify-center px-3 py-1">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              </div>
            ) : activeUser ? (
              <>
                <div
                  onMouseEnter={handleLaunchEnter}
                  onMouseLeave={handleLaunchLeave}
                >
                  {!mounted ? (
                    <button
                      className="flex items-center gap-0 sm:gap-1.5 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card hover:bg-slate-50 dark:hover:bg-slate-800/80 text-foreground font-semibold text-sm p-2 sm:px-5 sm:py-2 rounded-full transition-all cursor-pointer focus:outline-none shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-orange-500" />
                      <span className="hidden sm:inline">Submit</span>
                    </button>
                  ) : (
                    <DropdownMenu.Root open={launchOpen} onOpenChange={setLaunchOpen} modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="flex items-center gap-0 sm:gap-1.5 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card hover:bg-slate-50 dark:hover:bg-slate-800/80 text-foreground font-semibold text-sm p-2 sm:px-5 sm:py-2 rounded-full transition-all cursor-pointer focus:outline-none shadow-xs"
                        >
                          <Plus className="w-4 h-4 text-orange-500" />
                          <span className="hidden sm:inline">Submit</span>
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          sideOffset={8}
                          className="z-50 min-w-[200px] bg-card border border-border p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 focus:outline-none"
                          onMouseEnter={handleLaunchEnter}
                          onMouseLeave={handleLaunchLeave}
                        >
                          <DropdownMenu.Item asChild>
                            <Link href="/new?type=product" className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-normal text-foreground hover:bg-muted rounded-xl cursor-pointer focus:outline-none select-none transition-colors">
                              <Rocket className="w-4 h-4 text-orange-500" /> Submit Product
                            </Link>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item asChild>
                            <Link href="/new?type=thread" className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-normal text-foreground hover:bg-muted rounded-xl cursor-pointer focus:outline-none select-none transition-colors">
                              <MessageSquare className="w-4 h-4 text-orange-500" /> Start Discussion
                            </Link>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  {(() => {
                    const hasUnread = (unreadNotificationsCount > 0) || notificationsList.some((n) => !n.read);
                    return (
                      <button
                        id="bell-btn"
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className={`relative w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-card hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer group ${notificationsOpen ? "border-orange-500 text-orange-500" : ""
                          }`}
                        title="Notifications"
                      >
                        <Bell className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                        {hasUnread && (
                          <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                          </span>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                <button
                  id="login-btn"
                  onClick={() => dispatch(setAuthModalOpen(true))}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm px-5 py-2 rounded-full cursor-pointer shadow-md shadow-orange-500/15 transition-all"
                >
                  Log In
                </button>
              </>
            )}

            {/* User Profile Navigation & Dropdown */}
            {showAuthUI && activeUser && (
              <>
                {/* Mobile Only (< 640px): Direct link to user profile without dropdown */}
                <Link
                  href={profileHref}
                  className="flex sm:hidden items-center transition-all cursor-pointer outline-none"
                  title="My Profile"
                >
                  <Image
                    src={avatarUrl}
                    alt={activeUser.email || "user"}
                    width={36}
                    height={36}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500"
                  />
                </Link>

                {/* Desktop Only (>= 640px): Dropdown menu */}
                <div
                  className="hidden sm:block"
                  onMouseEnter={handleProfileEnter}
                  onMouseLeave={handleProfileLeave}
                >
                  {!mounted ? (
                    <button
                      className="flex items-center gap-1.5 p-0.5 hover:bg-muted rounded-full transition-all cursor-pointer outline-none focus:outline-none"
                    >
                      <Image
                        src={avatarUrl}
                        alt={activeUser.email || "user"}
                        width={40}
                        height={40}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 transition-all"
                      />
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ) : (
                    <DropdownMenu.Root open={profileOpen} onOpenChange={setProfileOpen} modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="flex items-center gap-1.5 p-0.5 hover:bg-muted rounded-full transition-all cursor-pointer outline-none focus:outline-none"
                        >
                          <Image
                            src={avatarUrl}
                            alt={activeUser.email || "user"}
                            width={40}
                            height={40}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 transition-all"
                          />
                          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${profileOpen ? 'rotate-180 text-orange-500' : ''}`} />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          sideOffset={8}
                          className="z-50 min-w-[210px] bg-card border border-border p-2 rounded-2xl shadow-2xl space-y-1 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150"
                          onMouseEnter={handleProfileEnter}
                          onMouseLeave={handleProfileLeave}
                        >
                          {[
                            { href: profileHref, label: "My Profile" },
                            { href: `/my-products`, label: "My Products" },
                            { href: `/profile/settings`, label: "Settings" },
                            ...((isAdmin || currentProfile?.role === 'admin') ? [{ href: `/admin`, label: "Admin Panel", isAdmin: true }] : [])
                          ].map((item) => (
                            <DropdownMenu.Item asChild key={item.href}>
                              <Link
                                href={item.href}
                                className={`flex items-center justify-between w-full px-3.5 py-2.5 text-xs font-normal text-foreground hover:bg-muted rounded-xl transition-colors`}
                              >
                                <span>{item.label}</span>
                                {item.isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />}
                              </Link>
                            </DropdownMenu.Item>
                          ))}
                          <div className="h-px bg-border/60 my-1" />
                          <DropdownMenu.Item
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-normal text-foreground hover:bg-muted rounded-xl cursor-pointer transition-colors focus:outline-none"
                            onClick={handleThemeToggle}
                          >
                            <div className="flex items-center gap-2">
                              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
                              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-muted/60">{theme}</span>
                          </DropdownMenu.Item>
                          <div className="h-px bg-border/60 my-1" />
                          <DropdownMenu.Item
                            className="w-full text-left px-3.5 py-2.5 text-xs font-normal text-foreground hover:bg-muted rounded-xl cursor-pointer transition-colors focus:outline-none"
                            onClick={handleSignOut}
                          >
                            Sign Out
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </header>

      {/* ── Notifications Backdrop ─────────────────────────────── */}
      {notificationsOpen && (
        <div
          onClick={() => setNotificationsOpen(false)}
          className="fixed top-16 sm:top-20 inset-0 z-30 bg-transparent transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ── Notifications Panel (Full height below navbar) ────────────────── */}
      <div
        ref={notificationsRef}
        className={`fixed top-16 sm:top-20 right-0 z-40 w-full sm:w-[380px] h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] bg-card border-l border-border shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col ${notificationsOpen
          ? "translate-x-0 opacity-100 visible"
          : "translate-x-full opacity-0 invisible"
          }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <span className="text-sm font-extrabold text-foreground">Notifications</span>
          <button
            onClick={async () => {
              await markAllNotificationsAsRead(activeUser?.id);
              queryClient.setQueryData(["unread_notifications_count", activeUser?.id || "guest"], 0);
              queryClient.setQueryData(["notifications", activeUser?.id || "guest"], (old: NotificationItem[] | undefined) =>
                (old || []).map(n => ({ ...n, read: true }))
              );
              setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
            }}
            className="text-[10px] text-orange-500 font-semibold hover:underline cursor-pointer focus:outline-none"
          >
            Mark all as read
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5"
          onScroll={handleNotificationsScroll}
        >
          {notificationsList.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-muted-foreground my-auto py-16">
              <Bell className="w-8 h-8 opacity-30 mx-auto" />
              <p className="text-xs font-semibold">No notifications yet</p>
              <p className="text-[11px] opacity-70">When you receive alerts, upvotes, or follower updates, they will appear here.</p>
            </div>
          ) : (
            notificationsList.slice(0, visibleNotificationsCount).map((item) => {
              const timeAgo = (() => {
                const diff = (Date.now() - new Date(item.created_at).getTime()) / 1000;
                if (diff < 60) return `${Math.floor(diff)}s ago`;
                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                return `${Math.floor(diff / 86400)}d ago`;
              })();

              if (item.type === "hunted") {
                return (
                  <div key={item.id} className="p-3.5 bg-muted/30 hover:bg-muted/60 rounded-2xl border border-border/60 transition-colors space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image src={item.actor_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"} alt="" width={40} height={40} className="w-10 h-10 rounded-2xl object-cover border border-border" />
                        {item.secondary_avatar && (
                          <Image src={item.secondary_avatar} alt="" width={20} height={20} className="w-5 h-5 rounded-full object-cover border-2 border-card absolute -bottom-1 -right-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/90 font-normal leading-snug">
                          <span className="font-semibold text-foreground">{item.actor_name}</span> hunted <span className="font-semibold text-foreground">{item.product_name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={item.action_url || "#"}
                        onClick={() => setNotificationsOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground/85 transition-all shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.action_label || "View launch"}</span>
                      </Link>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        <span>{timeAgo}</span>
                      </span>
                    </div>
                  </div>
                );
              }

              if (item.type === "thread_status") {
                return (
                  <div key={item.id} className="p-3.5 bg-muted/30 hover:bg-muted/60 rounded-2xl border border-border/60 transition-colors space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full border border-border/80 bg-muted/60 flex items-center justify-center text-foreground/70 flex-shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-foreground/90 leading-relaxed font-normal">
                          Your forum thread "<span className="font-semibold text-foreground">{item.thread_title}</span>" in <span className="font-semibold text-foreground">p/{item.category}</span> has been rejected.
                        </p>
                        {item.reason_text && (
                          <p className="text-xs text-muted-foreground font-normal leading-relaxed">{item.reason_text}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={item.action_url || "/faq"}
                        onClick={() => setNotificationsOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground/85 transition-all shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.action_label || "View forum guidelines"}</span>
                      </Link>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        <span>{timeAgo}</span>
                      </span>
                    </div>
                  </div>
                );
              }

              if (item.type === "following_activity") {
                return (
                  <div key={item.id} className="p-3.5 bg-muted/30 hover:bg-muted/60 rounded-2xl border border-border/60 transition-colors space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image src={item.product_logo || item.actor_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"} alt="" width={40} height={40} className="w-10 h-10 rounded-2xl object-cover border border-border" />
                        {item.actor_avatar && (
                          <Image src={item.actor_avatar} alt="" width={20} height={20} className="w-5 h-5 rounded-full object-cover border-2 border-card absolute -bottom-1 -right-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground font-normal">Because you follow {item.product_name}:</p>
                        <p className="text-xs text-foreground/90 font-normal leading-snug">
                          <span className="font-semibold text-foreground uppercase tracking-tight">{item.actor_name}</span> started a thread <span className="font-semibold text-foreground">{item.thread_title}</span> in <span className="font-semibold text-foreground">p/{item.category}</span>
                        </p>
                        {item.body_text && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed font-normal pt-0.5">{item.body_text}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={item.action_url || "#"}
                        onClick={() => setNotificationsOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground/85 transition-all shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.action_label || "View thread"}</span>
                      </Link>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        <span>{timeAgo}</span>
                      </span>
                    </div>
                  </div>
                );
              }

              // Generic Notification Card (Upvotes, Follows, Mentions)
              return (
                <div key={item.id} className="p-3.5 bg-muted/30 hover:bg-muted/60 rounded-2xl border border-border/60 transition-colors space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl overflow-hidden bg-muted border border-border flex-shrink-0">
                      <Image src={item.actor_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} alt="" width={36} height={36} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs text-foreground/90 font-normal">
                        <span className="font-semibold text-foreground">{item.actor_name}</span> {item.type === 'upvote' ? 'upvoted' : item.type === 'follow' ? 'started following you' : 'mentioned you in'} <span className="font-semibold text-foreground">{item.product_name || item.thread_title || ''}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {item.action_url && (
                      <Link
                        href={item.action_url}
                        onClick={() => setNotificationsOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground/85 transition-all shadow-2xs"
                      >
                        <span>{item.action_label || "View"}</span>
                      </Link>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal ml-auto">
                      <Clock className="w-3 h-3 text-muted-foreground/60" />
                      <span>{timeAgo}</span>
                    </span>
                  </div>
                </div>
              );
            }))}
        </div>
        <div className="p-4 border-t border-border flex-shrink-0">
          <button
            onClick={() => setNotificationsOpen(false)}
            className="w-full bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs py-2.5 rounded-xl transition-all border border-border"
          >
            Close Panel
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer Backdrop ─────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm xl:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer ─────────────────────────────────────── */}
      <div
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-[60] h-[100dvh] max-h-[100dvh] w-full max-w-sm sm:max-w-md bg-card border-r border-border shadow-2xl transform transition-all duration-300 ease-in-out xl:hidden flex flex-col ${mobileOpen
          ? "translate-x-0 opacity-100 visible pointer-events-auto"
          : "-translate-x-full opacity-0 invisible pointer-events-none"
          }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <Link href="/" prefetch={true} className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src="/logo.webp" alt="IndiHunt" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              IndiHunt
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile search - ALWAYS at top of hamburger menu */}
        <div className="px-4 pt-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              if (onSearchClick) {
                onSearchClick();
              } else {
                router.push("/search");
              }
            }}
            className="w-full relative flex items-center bg-muted/80 border border-border/80 hover:border-orange-500 rounded-full py-2.5 pl-9 pr-3 text-base text-muted-foreground hover:text-foreground transition-all cursor-pointer text-left shadow-xs group"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
            <span className="truncate text-base">Search products, discussions...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[11px] font-semibold text-muted-foreground shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-2.5 space-y-2 flex flex-col pb-16">

          {/* 1. Top Section (Top Products & Top Hunters) */}
          <div className="rounded-xl overflow-hidden border border-border/40">
            <button
              onClick={() => setActiveMobileSubmenu((prev) => (prev === "top" ? null : "top"))}
              className="w-full flex items-center justify-between px-3.5 py-3 text-base font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-base font-semibold">Top Products & Hunters</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${activeMobileSubmenu === "top" ? "rotate-180 text-orange-500" : ""
                  }`}
              />
            </button>
            {activeMobileSubmenu === "top" && (
              <div className="px-2.5 py-1.5 space-y-1 bg-muted/20 border-t border-border/40">
                {[
                  { href: "/best-products", icon: Trophy, label: "Top Products", sub: "Most-loved and top-rated launches", bg: "bg-amber-500/10", color: "text-amber-500" },
                  { href: "/top-hunters", icon: Target, label: "Top Hunters", sub: "Leaderboard of top product hunters", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                  { href: "/awards", icon: Award, label: "Product Awards", sub: "Platform awards & recognition", bg: "bg-rose-500/10", color: "text-rose-500" },
                ].map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${subItem.bg} ${subItem.color} flex items-center justify-center flex-shrink-0`}>
                      <subItem.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-medium text-foreground block">{subItem.label}</span>
                      <span className="text-xs text-muted-foreground block leading-tight">{subItem.sub}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 2. Launches & Products Accordion */}
          <div className="rounded-xl overflow-hidden border border-border/40">
            <button
              onClick={() => setActiveMobileSubmenu((prev) => (prev === "launches" ? null : "launches"))}
              className="w-full flex items-center justify-between px-3.5 py-3 text-base font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Rocket className="w-5 h-5 text-orange-500" />
                <span className="text-base font-semibold">Launches & Products</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${activeMobileSubmenu === "launches" ? "rotate-180 text-orange-500" : ""
                  }`}
              />
            </button>
            {activeMobileSubmenu === "launches" && (
              <div className="px-2.5 py-1.5 space-y-1 bg-muted/20 border-t border-border/40">
                {[
                  { href: "/best-products", icon: Rocket, label: "Launch Archive", sub: "Most-loved launches by the community", bg: "bg-orange-500/10", color: "text-orange-500" },
                  { href: "/pages", icon: Sparkles, label: "IndiHunt Pages", sub: "Personal websites for indie makers", bg: "bg-amber-500/10", color: "text-amber-500" },
                  { href: "/categories", icon: LayoutGrid, label: "Categories", sub: "Browse products by category", bg: "bg-indigo-500/10", color: "text-indigo-500" },
                  { href: "/guide", icon: Compass, label: "Launch Guide", sub: "Checklists & pro tips for launching", bg: "bg-blue-500/10", color: "text-blue-500" },
                ].map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${subItem.bg} ${subItem.color} flex items-center justify-center flex-shrink-0`}>
                      <subItem.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-medium text-foreground block">{subItem.label}</span>
                      <span className="text-xs text-muted-foreground block leading-tight">{subItem.sub}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 3. Forums & Community Accordion */}
          <div className="rounded-xl overflow-hidden border border-border/40">
            <button
              onClick={() => setActiveMobileSubmenu((prev) => (prev === "forums" ? null : "forums"))}
              className="w-full flex items-center justify-between px-3.5 py-3 text-base font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                <span className="text-base font-semibold">Forums & Discussions</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${activeMobileSubmenu === "forums" ? "rotate-180 text-orange-500" : ""
                  }`}
              />
            </button>
            {activeMobileSubmenu === "forums" && (
              <div className="px-2.5 py-1.5 space-y-1 bg-muted/20 border-t border-border/40">
                {[
                  { href: "/discussions", icon: MessageSquare, label: "Forums & Discussions", sub: "Ask questions & connect with makers", bg: "bg-orange-500/10", color: "text-orange-500" },
                  { href: "/profile/streak", icon: Flame, label: "Maker Streaks", sub: "Track daily maker activity", bg: "bg-rose-500/10", color: "text-rose-500" },
                  { href: "/profile/leaderboard", icon: Trophy, label: "Leaderboard", sub: "Highest scoring community members", bg: "bg-amber-500/10", color: "text-amber-500" },
                ].map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${subItem.bg} ${subItem.color} flex items-center justify-center flex-shrink-0`}>
                      <subItem.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-medium text-foreground block">{subItem.label}</span>
                      <span className="text-xs text-muted-foreground block leading-tight">{subItem.sub}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 4. News & Updates Accordion */}
          <div className="rounded-xl overflow-hidden border border-border/40">
            <button
              onClick={() => setActiveMobileSubmenu((prev) => (prev === "news" ? null : "news"))}
              className="w-full flex items-center justify-between px-3.5 py-3 text-base font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Newspaper className="w-5 h-5 text-orange-500" />
                <span className="text-base font-semibold">News & Updates</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${activeMobileSubmenu === "news" ? "rotate-180 text-orange-500" : ""
                  }`}
              />
            </button>
            {activeMobileSubmenu === "news" && (
              <div className="px-2.5 py-1.5 space-y-1 bg-muted/20 border-t border-border/40">
                {[
                  { href: "/news", icon: Flame, label: "Daily News", sub: "Trending updates in the tech world", bg: "bg-orange-500/10", color: "text-orange-500" },
                  { href: "/stories", icon: BookOpen, label: "Stories & Articles", sub: "Tech news & founder interviews", bg: "bg-rose-500/10", color: "text-rose-500" },
                  { href: "/changelog", icon: ClipboardList, label: "Changelog", sub: "New platform features and releases", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                ].map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${subItem.bg} ${subItem.color} flex items-center justify-center flex-shrink-0`}>
                      <subItem.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-medium text-foreground block">{subItem.label}</span>
                      <span className="text-xs text-muted-foreground block leading-tight">{subItem.sub}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 5. My Profile Accordion (Only for logged-in users) */}
          {activeUser && (
            <div className="rounded-xl overflow-hidden border border-border/40">
              <button
                onClick={() => setActiveMobileSubmenu((prev) => (prev === "profile" ? null : "profile"))}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {activeUser?.user_metadata?.avatar_url ? (
                    <img
                      src={activeUser.user_metadata.avatar_url}
                      alt={activeUser.email || "user"}
                      className="w-4 h-4 rounded-full object-cover border border-orange-500/40"
                    />
                  ) : (
                    <User className="w-4 h-4 text-orange-500" />
                  )}
                  <span>My Profile</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${activeMobileSubmenu === "profile" ? "rotate-180 text-orange-500" : ""
                    }`}
                />
              </button>
              {activeMobileSubmenu === "profile" && (
                <div className="px-2.5 py-1.5 space-y-1 bg-muted/20 border-t border-border/40">
                  {[
                    { href: "/profile", icon: User, label: "Profile", sub: "View your public maker profile", bg: "bg-orange-500/10", color: "text-orange-500" },
                    { href: "/my-products", icon: Package, label: "My Products", sub: "Manage your launched products", bg: "bg-indigo-500/10", color: "text-indigo-500" },
                    { href: "/profile/settings", icon: Settings, label: "Settings", sub: "Update account preferences", bg: "bg-purple-500/10", color: "text-purple-500" },
                  ].map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg ${subItem.bg} ${subItem.color} flex items-center justify-center flex-shrink-0`}>
                        <subItem.icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-foreground block">{subItem.label}</span>
                        <span className="text-[10px] text-muted-foreground block leading-tight">{subItem.sub}</span>
                      </div>
                    </Link>
                  ))}
                  {/* <button
                    onClick={handleThemeToggle}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                        {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-foreground block">
                          {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block leading-tight">Switch appearance theme</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-muted/60">
                      {theme}
                    </span>
                  </button> */}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-foreground block">Logout</span>
                      <span className="text-[10px] text-muted-foreground block leading-tight">Sign out of your account</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

        </nav>


      </div>
    </>
  );
}
