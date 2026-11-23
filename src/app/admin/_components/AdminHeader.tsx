"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search } from "lucide-react";

interface AdminHeaderProps {
  adminProfile: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
    role?: string;
  } | null;
}

export function AdminHeader({ adminProfile }: AdminHeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0 z-30">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 font-normal">
        <span className="text-slate-700">IndiHunt</span>
        <span>/</span>
        <span className="text-orange-400">Admin</span>
      </div>

      {/* Right: search + admin info + exit */}
      <div className="flex items-center gap-3">
        {/* Quick Search Link */}
        <Link
          href="/admin/search"
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-400">⌘K</kbd>
        </Link>

        {adminProfile && (
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-900 leading-none">
                {adminProfile.full_name || adminProfile.username}
              </div>
              <div className="text-xs text-orange-400 font-semibold uppercase tracking-wider mt-0.5">
                {adminProfile.role || "admin"}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-slate-900 font-semibold text-sm overflow-hidden border border-slate-200 shrink-0">
              {adminProfile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <Image
                  src={adminProfile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                width={48} height={48} />
              ) : (
                (adminProfile.full_name?.charAt(0) || "A").toUpperCase()
              )}
            </div>
          </div>
        )}

        <div className="w-px h-5 bg-slate-200" />

        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit Admin</span>
        </Link>
      </div>
    </header>
  );
}
