"use client";


import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  MessageSquare,
  Clock,
  Globe,
  ArrowLeft,
  CheckCheck,
  Sparkles,
  Flame,
  UserCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";
import {
  supabase,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
  MOCK_NOTIFICATIONS
} from "@/lib/supabase";

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      fetchNotifs(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      fetchNotifs(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotifs = async (userId?: string) => {
    setLoading(true);
    const data = await getNotifications(userId);
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(user?.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "unread") return !n.read;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300 pt-[76px] sm:pt-[84px]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-card border border-border p-6 rounded-3xl shadow-xs">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground transition-all shrink-0 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-foreground/80" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <span>Notifications</span>
              </h1>
              <p className="text-xs text-muted-foreground font-normal pt-0.5">
                Stay updated on launches, comments, upvotes, and community activities.
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs font-semibold text-orange-500 cursor-pointer transition-all shadow-2xs self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6  pb-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[#ff5733] text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "unread"
                ? "bg-[#ff5733] text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </button>
        </div>

        {/* Notification Feed List */}
        <div className="space-y-4">
          {loading ? (
            <CircularLoader label="Loading notifications..." size="lg" />
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-3">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">No notifications found.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const timeAgo = (() => {
                const diff = (Date.now() - new Date(item.created_at).getTime()) / 1000;
                if (diff < 60) return `${Math.floor(diff)}s ago`;
                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                return `${Math.floor(diff / 86400)}d ago`;
              })();

              // Hunted Card
              if (item.type === "hunted") {
                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3.5 ${
                      !item.read
                        ? "bg-card border-orange-500/30 shadow-xs"
                        : "bg-card/70 border-border/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="relative w-11 h-11 flex-shrink-0">
                        <Image src={item.actor_avatar || ""} alt="" className="w-11 h-11 rounded-2xl object-cover border border-border" width={44} height={44} />
                        {item.secondary_avatar && (
                          <Image src={item.secondary_avatar} alt="" className="w-5 h-5 rounded-full object-cover border-2 border-card absolute -bottom-1 -right-1" width={20} height={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/90 font-normal leading-snug">
                          <span className="font-semibold text-foreground">{item.actor_name}</span> hunted <span className="font-semibold text-foreground">{item.product_name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={item.action_url || "#"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs font-medium text-foreground/85 transition-all shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.action_label || "View launch"}</span>
                      </Link>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span>{timeAgo}</span>
                      </span>
                    </div>
                  </div>
                );
              }

              // Thread Status Card
              if (item.type === "thread_status") {
                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3.5 ${
                      !item.read
                        ? "bg-card border-orange-500/30 shadow-xs"
                        : "bg-card/70 border-border/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-full border border-border/80 bg-muted/60 flex items-center justify-center text-foreground/70 flex-shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm text-foreground/90 leading-relaxed font-normal">
                          Your forum thread "<span className="font-semibold text-foreground">{item.thread_title}</span>" in <span className="font-semibold text-foreground">p/{item.category}</span> has been rejected.
                        </p>
                        {item.reason_text && (
                          <p className="text-xs text-muted-foreground font-normal leading-relaxed pt-0.5">{item.reason_text}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={item.action_url || "/faq"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs font-medium text-foreground/85 transition-all shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.action_label || "View forum guidelines"}</span>
                      </Link>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span>{timeAgo}</span>
                      </span>
                    </div>
                  </div>
                );
              }

              // Following Activity Card
              if (item.type === "following_activity") {
                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3 ${
                      !item.read
                        ? "bg-card border-orange-500/30 shadow-xs"
                        : "bg-card/70 border-border/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="relative w-11 h-11 flex-shrink-0">
                        <Image src={item.product_logo || item.actor_avatar || ""} alt="" className="w-11 h-11 rounded-2xl object-cover border border-border" width={44} height={44} />
                        {item.actor_avatar && (
                          <Image src={item.actor_avatar} alt="" className="w-5 h-5 rounded-full object-cover border-2 border-card absolute -bottom-1 -right-1" width={20} height={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-muted-foreground font-normal">Because you follow {item.product_name}:</p>
                        <p className="text-sm text-foreground/90 font-normal leading-snug">
                          <span className="font-semibold text-foreground uppercase tracking-tight">{item.actor_name}</span> started a thread <span className="font-semibold text-foreground">{item.thread_title}</span> in <span className="font-semibold text-foreground">p/{item.category}</span>
                        </p>
                        {item.body_text && (
                          <p className="text-xs text-muted-foreground/85 line-clamp-2 leading-relaxed font-normal pt-1">{item.body_text}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={item.action_url || "#"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs font-medium text-foreground/85 transition-all shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.action_label || "View thread"}</span>
                      </Link>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span>{timeAgo}</span>
                      </span>
                    </div>
                  </div>
                );
              }

              // Generic Card
              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3 ${
                    !item.read
                      ? "bg-card border-orange-500/30 shadow-xs"
                      : "bg-card/70 border-border/70 hover:border-border"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-muted border border-border flex-shrink-0">
                      <Image src={item.actor_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} alt="" className="w-full h-full object-cover" width={48} height={48} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm text-foreground/90 font-normal">
                        <span className="font-semibold text-foreground">{item.actor_name}</span> {item.type === 'upvote' ? 'upvoted' : item.type === 'follow' ? 'started following you' : 'mentioned you in'} <span className="font-semibold text-foreground">{item.product_name || item.thread_title || ''}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {item.action_url && (
                      <Link
                        href={item.action_url}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs font-medium text-foreground/85 transition-all shadow-2xs"
                      >
                        <span>{item.action_label || "View"}</span>
                      </Link>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal ml-auto">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                      <span>{timeAgo}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
