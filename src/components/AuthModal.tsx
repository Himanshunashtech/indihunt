"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { X as CloseIcon, ShieldCheck, Loader2 } from "lucide-react";
import { Github } from "./icons";
import { signInWithGoogle, signInWithGithub } from "@/lib/supabase";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAEFKr-BplIriR31K";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: any) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileSuccess?: (token: string) => void;
  }
}

export default function AuthModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.authModalOpen);
  const user = useAppSelector((state) => state.auth.user);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [signingInProvider, setSigningInProvider] = useState<"google" | "github" | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Automatically close modal once the user is confirmed logged in
  useEffect(() => {
    if (user && isOpen) {
      dispatch(setAuthModalOpen(false));
      setSigningInProvider(null);
    }
  }, [user, isOpen, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      setTurnstileToken(null);
      setSigningInProvider(null);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {}
      }
      return;
    }

    const renderWidget = () => {
      if (window.turnstile && turnstileContainerRef.current && !widgetIdRef.current) {
        try {
          const id = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: "auto",
            size: "flexible",
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            "error-callback": () => {
              setTurnstileToken(null);
            },
            "expired-callback": () => {
              setTurnstileToken(null);
            },
          });
          widgetIdRef.current = id;
        } catch (e) {
          console.warn("[Turnstile] Render error:", e);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSigningInProvider(null);
    dispatch(setAuthModalOpen(false));
  };

  const handleGoogleSignIn = async () => {
    try {
      setSigningInProvider("google");
      await signInWithGoogle();
    } catch (e) {
      console.error("[AuthModal] Google Sign In Error:", e);
      setSigningInProvider(null);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setSigningInProvider("github");
      await signInWithGithub();
    } catch (e) {
      console.error("[AuthModal] GitHub Sign In Error:", e);
      setSigningInProvider(null);
    }
  };

  return (
    <>
      {/* Load Cloudflare Turnstile script ONLY when Auth Modal is mounted */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
      />

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        {/* Modal Container */}
        <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl relative space-y-6 animate-in zoom-in-95 duration-200">
          
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer focus:outline-none"
            aria-label="Close"
          >
            <CloseIcon className="w-4 h-4" />
          </button>

          {/* Logo and Headings */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border/80 bg-muted flex items-center justify-center relative shadow-md">
              <Image src="/logo.webp" alt="Logo" width={80} height={80} decoding="async" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">Log in to IndiHunt</h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
                Join our community of friendly makers discovering and sharing the latest products in tech.
              </p>
            </div>
          </div>

          {/* Primary Social Sign-In Buttons: Google & GitHub */}
          <div className="space-y-3 pt-1">
            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={signingInProvider !== null}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border/80 bg-background hover:bg-muted/80 hover:border-border text-foreground hover:shadow-sm transition-all font-semibold text-sm cursor-pointer group disabled:opacity-70 disabled:cursor-wait"
            >
              {signingInProvider === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{signingInProvider === "google" ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>

            {/* GitHub */}
            <button
              onClick={handleGithubSignIn}
              disabled={signingInProvider !== null}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border/80 bg-background hover:bg-muted/80 hover:border-border text-foreground hover:shadow-sm transition-all font-semibold text-sm cursor-pointer group disabled:opacity-70 disabled:cursor-wait"
            >
              {signingInProvider === "github" ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
              ) : (
                <Github className="w-4 h-4 text-foreground flex-shrink-0 transition-transform group-hover:scale-110" />
              )}
              <span>{signingInProvider === "github" ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
            </button>
          </div>

          {/* Cloudflare Turnstile Bot Protection Widget (Only in Login Form) */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div ref={turnstileContainerRef} className="min-h-[65px] flex items-center justify-center" />
          </div>

          {/* Footer Notice */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center font-normal leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Protected by Cloudflare Turnstile. We never post without permission.</span>
          </div>

        </div>
      </div>
    </>
  );
}
