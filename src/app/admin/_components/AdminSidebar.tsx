"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  MessageSquare,
  Star,
  Flag,
  BookOpen,
  Megaphone,
  Bell,
  MessageCircle,
  BarChart3,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Shield,
  Vote,
  Trophy,
  Tags,
  Award,
  Search,
  Settings,
  ScrollText,
  TrendingUp,
  CreditCard,
  Image as ImageIcon,
  Briefcase,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/stats", icon: BarChart3, label: "Platform Stats" },
    ],
  },
  {
    label: "Launches & Products",
    items: [
      { href: "/admin/products", icon: Package, label: "Products" },
      { href: "/admin/leaderboard", icon: Trophy, label: "Leaderboard" },
      { href: "/admin/featured", icon: Award, label: "Featured" },
      { href: "/admin/categories", icon: Tags, label: "Categories & Tags" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/stories", icon: BookOpen, label: "Stories" },
      { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
      { href: "/admin/reviews", icon: Star, label: "Reviews" },
      { href: "/admin/forums", icon: MessageCircle, label: "Forums" },
    ],
  },
  {
    label: "Users",
    items: [
      { href: "/admin/users", icon: Users, label: "Users & Roles" },
      { href: "/admin/notifications", icon: Bell, label: "Notifications" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/careers", icon: Briefcase, label: "Careers & Jobs", badge: "hot" },
      { href: "/admin/moderation", icon: Shield, label: "Moderation Center", badge: "hot" },
      { href: "/admin/reports", icon: Flag, label: "All Reports", badge: "hot" },
      { href: "/admin/voting", icon: Vote, label: "Voting & Fraud" },
      { href: "/admin/audit-log", icon: ScrollText, label: "Audit Log" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/payments", icon: CreditCard, label: "Payments & Gateways", badge: "hot" },
      { href: "/admin/ads", icon: Megaphone, label: "Ad Campaigns" },
      { href: "/admin/billboards", icon: ImageIcon, label: "Billboard Ads" },
      { href: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", icon: Settings, label: "Settings" },
      { href: "/admin/search", icon: Search, label: "Global Search" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ShieldCheck className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">
              IndiHunt
            </div>
            <div className="text-xs font-semibold text-orange-400 uppercase tracking-widest mt-0.5">
              Admin Console
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_ITEMS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group ${
                      isActive
                        ? "bg-orange-500/15 text-orange-400 font-semibold shadow-sm shadow-orange-500/10"
                        : "text-slate-800 hover:text-black hover:bg-[#f2f4f8]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive ? "text-orange-400" : "text-slate-500 group-hover:text-black"
                        }`}
                      />
                      {item.label}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge === "hot" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                      {isActive && (
                        <ChevronRight className="w-3 h-3 text-orange-400" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-200 shrink-0 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Live Site
        </Link>
        <div className="px-3 py-2 text-xs text-slate-300 font-normal">
          IndiHunt Admin v3.0.0
        </div>
      </div>
    </div>
  );
}
