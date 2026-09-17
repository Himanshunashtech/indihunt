"use client";

// Admin layout — client component with built-in auth guard.
// Uses fixed overlay (z-[9999]) to cover the global Navbar/Footer from root layout.
// Auth check uses client-side Supabase (localStorage) since this app uses localStorage auth.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminHeader } from "./_components/AdminHeader";
import { AdminToastProvider } from "./_components/AdminToastProvider";
import { ShieldCheck } from "lucide-react";

interface AdminProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    async function checkAccess() {
      // Instant authorization check from session storage on client after mount
      if (typeof window !== "undefined" && sessionStorage.getItem("ih_admin_authorized") === "true") {
        setStatus("authorized");
      }

      // No Supabase configured → allow in local dev
      if (!supabase) {
        setStatus("authorized");
        if (typeof window !== "undefined") sessionStorage.setItem("ih_admin_authorized", "true");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (typeof window !== "undefined") sessionStorage.removeItem("ih_admin_authorized");
        setStatus("denied");
        router.replace("/?access=denied");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        setAdminProfile(profile as AdminProfile);
        setStatus("authorized");
        if (typeof window !== "undefined") sessionStorage.setItem("ih_admin_authorized", "true");
      } else {
        if (typeof window !== "undefined") sessionStorage.removeItem("ih_admin_authorized");
        setStatus("denied");
        router.replace("/?access=denied");
      }
    }

    checkAccess();
  }, [router]);

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <ShieldCheck className="w-7 h-7 text-slate-900" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 opacity-30 blur-xl animate-pulse" />
          </div>
          <div className="text-center">
            <div className="text-base font-extrabold text-slate-700 uppercase tracking-[0.2em]">IndiHunt Admin</div>
            <div className="text-sm text-slate-400 mt-1 font-normal animate-pulse">Verifying access…</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Denied — router.replace is in-flight ───────────────────────────────────
  if (status === "denied") {
    return null;
  }

  // ── Authorized ─────────────────────────────────────────────────────────────
  return (
    <AdminToastProvider>
      <div className="fixed inset-0 z-[9999] flex overflow-hidden bg-white text-slate-900">
        {/* Fixed sidebar with its own scroll */}
        <aside className="w-[260px] flex-shrink-0 h-full overflow-y-auto border-r border-slate-200 bg-white">
          <AdminSidebar />
        </aside>

        {/* Main content: header + scrollable page */}
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          <AdminHeader adminProfile={adminProfile} />
          <main className="flex-1 overflow-y-auto bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
