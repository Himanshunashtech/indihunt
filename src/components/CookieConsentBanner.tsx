"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Cookie, X, Check, Shield, Info, Settings } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean; // DataFast
  marketing: boolean; // Ad tracking
}

const STORAGE_KEY = "indihunt_cookie_consent_v1";

// Helper function to write real browser cookies (document.cookie)
const setRealCookies = (prefs: CookiePreferences) => {
  if (typeof document === "undefined") return;
  const maxAge = 365 * 24 * 60 * 60; // 1 year retention
  const sameSite = "SameSite=Lax; Path=/";

  document.cookie = `indihunt_consent=true; Max-Age=${maxAge}; ${sameSite}`;
  document.cookie = `indihunt_analytics=${prefs.analytics ? "granted" : "denied"}; Max-Age=${maxAge}; ${sameSite}`;
  document.cookie = `indihunt_marketing=${prefs.marketing ? "granted" : "denied"}; Max-Age=${maxAge}; ${sameSite}`;

  // If analytics disabled, disable DataFast tracking window flag
  if (!prefs.analytics) {
    (window as unknown as { datafast?: { disable?: boolean } }).datafast = { disable: true };
  }
};

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    marketing: true,
  });

  useEffect(() => {
    // Detect Global Privacy Control (GPC) signal
    const navigatorGpc = (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl;

    // Check if consent has already been given or stored
    const stored = localStorage.getItem(STORAGE_KEY) || (typeof document !== 'undefined' && document.cookie.includes("indihunt_consent=true") ? "granted" : null);

    if (navigatorGpc) {
      // Automatically opt-out non-essential tracking if GPC is active
      const gpcPrefs: CookiePreferences = {
        essential: true,
        analytics: false,
        marketing: false,
      };
      setPreferences(gpcPrefs);
      setRealCookies(gpcPrefs);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gpcPrefs));
      }
      return;
    }

    if (!stored) {
      // Check if user is logged in (or has session token in localStorage/cookies)
      const hasUserSession = typeof window !== 'undefined' && (
        localStorage.getItem('indihunt_profiles') ||
        localStorage.getItem('sb-access-token') ||
        document.cookie.includes('sb-')
      );

      if (hasUserSession) {
        // Automatically save consent for logged in users so they are never bothered by the banner
        const defaultConsent: CookiePreferences = { essential: true, analytics: true, marketing: true };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConsent));
        setPreferences(defaultConsent);
        setRealCookies(defaultConsent);
        setIsVisible(false);
        return;
      }

      // Small delay to let page settle before showing banner for guests
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setRealCookies(parsed);
        setIsVisible(false);
      } catch {
        setIsVisible(false);
      }
    }
  }, []);

  const handleDismissBanner = () => {
    const defaultPrefs: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPrefs));
    setPreferences(defaultPrefs);
    setRealCookies(defaultPrefs);
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setRealCookies(allAccepted);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleRejectNonEssential = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(onlyEssential));
    setPreferences(onlyEssential);
    setRealCookies(onlyEssential);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setRealCookies(preferences);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  if (!isVisible && !isModalOpen) return null;

  return (
    <>
      {/* Floating Compact Cookie Settings Popup Card */}
      {isVisible && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-[350px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-card dark:bg-slate-900 border border-border rounded-2xl p-4 sm:p-5 shadow-2xl text-foreground relative overflow-hidden">
            {/* Header: Logo & Close Button */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 text-white rounded-xl flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden">
                  <Image
                    src="/logo.webp"
                    alt="IndiHunt Logo"
                    width={36}
                    height={36}
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">IndiHunt</h3>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">by Indian Makers</p>
                </div>
              </div>
              <button
                onClick={handleDismissBanner}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title */}
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight mt-3">
              Cookie Settings
            </h2>

            {/* Body Description */}
            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 font-normal">
              IndiHunt uses cookies to ensure site functionality, analyze usage, and deliver targeted advertising. See our{" "}
              <Link href="/privacy" className="text-foreground font-semibold underline hover:text-[#ff5733] transition-colors">
                Privacy Policy
              </Link>.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3.5">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2.5 px-3 bg-[#ff5733] hover:bg-[#e04824] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage Options
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="w-full py-2 px-2.5 bg-card border border-border hover:bg-muted/80 text-foreground font-semibold text-[11px] rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3 text-emerald-500" />
                  Accept All
                </button>
                <button
                  onClick={handleRejectNonEssential}
                  className="w-full py-2 px-2.5 bg-card border border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground font-semibold text-[11px] rounded-lg transition-all cursor-pointer text-center"
                >
                  Essential Only
                </button>
              </div>
            </div>

            {/* Footer Attribution */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-2.5 mt-2.5 border-t border-border/50">
              <span>Powered by</span>
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <Shield className="w-3 h-3 text-[#ff5733]" />
                <span>IndiHunt Privacy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Cookie Preferences Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[92vw] max-w-[420px] bg-card dark:bg-slate-900 border border-border rounded-2xl p-4.5 sm:p-5 shadow-2xl z-50 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  <Image
                    src="/logo.webp"
                    alt="IndiHunt Logo"
                    width={32}
                    height={32}
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <Dialog.Title className="text-sm sm:text-base font-bold text-foreground">
                    Cookie Preferences
                  </Dialog.Title>
                  <Dialog.Description className="text-[11px] text-muted-foreground">
                    Customize how IndiHunt processes website cookies & data
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/80 transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </Dialog.Close>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {/* Essential Cookies */}
              <div className="p-3 bg-muted/40 border border-border/70 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    Essential Cookies
                    <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                      Required
                    </span>
                  </span>
                  <input type="checkbox" checked disabled className="w-3.5 h-3.5 rounded text-[#ff5733] cursor-not-allowed opacity-70" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Necessary for secure authentication sessions, CSRF protection, and core platform functionality.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="p-3 bg-card border border-border/70 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Analytics & Performance
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-[#ff5733] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Helps us analyze aggregate site usage and launch metrics to continuously improve IndiHunt.
                </p>
              </div>

              {/* Marketing & Ad Impression Cookies */}
              <div className="p-3 bg-card border border-border/70 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Ad Campaigns & Personalization
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-[#ff5733] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Used by self-serve maker ads to accurately tally impression metrics without selling user data.
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3 text-[#ff5733]" />
                <span>GPC signal supported</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRejectNonEssential}
                  className="px-3 py-1.5 bg-card border border-border hover:bg-muted/80 text-foreground text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Essential Only
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-3.5 py-1.5 bg-[#ff5733] hover:bg-[#e04824] text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
