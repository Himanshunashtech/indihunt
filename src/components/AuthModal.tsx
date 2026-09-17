"use client";

import React from "react";
import { X as CloseIcon } from "lucide-react";
import { Github, Facebook, Linkedin, Twitter } from "./icons";
import { signInWithGoogle, signInWithGithub } from "@/lib/supabase";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { setAuthModalOpen } from "@/lib/store";

export default function AuthModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.authModalOpen);

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch(setAuthModalOpen(false));
  };

  const handleGoogleSignIn = async () => {
    handleClose();
    await signInWithGoogle();
  };

  const handleGithubSignIn = async () => {
    handleClose();
    await signInWithGithub();
  };

  const handleDummyClick = (provider: string) => {
    alert(`Sign in with ${provider} coming soon! Please use Google Sign In (Google G logo below).`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl relative space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer focus:outline-none"
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        {/* Logo and Headings */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border/80 bg-muted flex items-center justify-center relative shadow-md">
            <img src="/logo.webp" alt="Logo" width={80} height={80} decoding="async" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Log in to IndiHunt</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
              Join our community of friendly folks discovering and sharing the latest products in tech.
            </p>
          </div>
        </div>

        {/* Primary Social Buttons */}
        <div className="space-y-3">
          {/* LinkedIn */}
          <button
            onClick={() => handleDummyClick("LinkedIn")}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border bg-background text-foreground/50 transition-all font-semibold text-xs cursor-not-allowed opacity-40"
          >
            <Linkedin className="w-4 h-4 text-[#0A66C2]/50" />
            <span>Sign in with LinkedIn</span>
          </button>

          {/* GitHub */}
          <button
            onClick={handleGithubSignIn}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground hover:shadow-sm transition-all font-semibold text-xs cursor-pointer"
          >
            <Github className="w-4 h-4 text-foreground" />
            <span>Sign in with GitHub</span>
          </button>

          {/* X */}
          <button
            onClick={() => handleDummyClick("X")}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border bg-background text-foreground/50 transition-all font-semibold text-xs cursor-not-allowed opacity-40"
          >
            <Twitter className="w-4 h-4 text-foreground/50" />
            <span>Sign in with X</span>
          </button>
        </div>

        {/* Secondary Circle Social Buttons Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center py-2.5 rounded-xl border border-border bg-background hover:bg-muted transition-all cursor-pointer"
            title="Sign in with Google"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleDummyClick("Facebook")}
            className="flex items-center justify-center py-2.5 rounded-xl border border-border bg-background transition-all cursor-not-allowed opacity-40"
            title="Sign in with Facebook"
          >
            <Facebook className="w-4 h-4 text-[#1877F2]/50 fill-[#1877F2]/50" />
          </button>

          {/* Apple */}
          <button
            onClick={() => handleDummyClick("Apple")}
            className="flex items-center justify-center py-2.5 rounded-xl border border-border bg-background transition-all cursor-not-allowed opacity-40 text-foreground/50"
            title="Sign in with Apple"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.2.12.3.12 1-.02 2.14-.62 2.51-1.45" />
            </svg>
          </button>
        </div>

        {/* Footer Notice */}
        <p className="text-xs sm:text-sm text-muted-foreground text-center font-normal leading-relaxed">
          We'll never post to any of your accounts without your permission.
        </p>

      </div>
    </div>
  );
}
