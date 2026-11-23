"use client";

import React from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";

interface OnboardingModalProps {
  open: boolean;
  currentUser: any;
  onboardName: string;
  setOnboardName: (v: string) => void;
  onboardUsername: string;
  setOnboardUsername: (v: string) => void;
  onboardLinkedIn: string;
  setOnboardLinkedIn: (v: string) => void;
  onboardTwitter: string;
  setOnboardTwitter: (v: string) => void;
  onboardHeadline: string;
  setOnboardHeadline: (v: string) => void;
  onboardNewsletterLeaderboard: boolean;
  setOnboardNewsletterLeaderboard: (v: boolean) => void;
  onboardNewsletterRoundup: boolean;
  setOnboardNewsletterRoundup: (v: boolean) => void;
  onboardNewsletterFrontier: boolean;
  setOnboardNewsletterFrontier: (v: boolean) => void;
  onboardAgeCheck: boolean;
  setOnboardAgeCheck: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSignOut: () => void;
}

export default function OnboardingModal({
  open,
  currentUser,
  onboardName,
  setOnboardName,
  onboardUsername,
  setOnboardUsername,
  onboardLinkedIn,
  setOnboardLinkedIn,
  onboardTwitter,
  setOnboardTwitter,
  onboardHeadline,
  setOnboardHeadline,
  onboardNewsletterLeaderboard,
  setOnboardNewsletterLeaderboard,
  onboardNewsletterRoundup,
  setOnboardNewsletterRoundup,
  onboardNewsletterFrontier,
  setOnboardNewsletterFrontier,
  onboardAgeCheck,
  setOnboardAgeCheck,
  onSubmit,
  onSignOut,
}: OnboardingModalProps) {
  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />

        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[92vh] bg-card border border-border rounded-3xl p-6 sm:p-8 overflow-y-auto z-50 shadow-2xl focus:outline-none">
          <div className="text-center mb-6">
            <Dialog.Title className="text-2xl font-bold text-foreground tracking-tight">
              Tell us more about yourself
            </Dialog.Title>
            <Dialog.Description className="text-base text-muted-foreground mt-1.5">
              Completing onboarding helps us personalize your IndiHunt experience.
            </Dialog.Description>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Profile Avatar Section */}
            <div className="flex flex-col items-center gap-1 mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden border-2 border-border">
                {currentUser?.user_metadata?.avatar_url ? (
                  <Image
                    src={currentUser.user_metadata.avatar_url}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : onboardName ? (
                  onboardName.charAt(0).toUpperCase()
                ) : (
                  "M"
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Recommended size: 400x400px
              </span>
            </div>

            {/* Name */}
            <div>
              <label className="block text-base font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                Name
              </label>
              <input
                type="text"
                required
                placeholder="Himanshu Sharma"
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-base text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-base font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="himanshu_sharma100"
                value={onboardUsername}
                onChange={(e) => setOnboardUsername(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-base text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-base font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                Email
              </label>
              <input
                type="email"
                readOnly
                disabled
                value={currentUser?.email || ""}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-base text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-base font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                LinkedIn
              </label>
              <input
                type="text"
                placeholder="https://www.linkedin.com/in/username"
                value={onboardLinkedIn}
                onChange={(e) => setOnboardLinkedIn(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-base text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Twitter / X.com */}
            <div>
              <label className="block text-base font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                X.com (Twitter)
              </label>
              <input
                type="text"
                placeholder="https://x.com/username"
                value={onboardTwitter}
                onChange={(e) => setOnboardTwitter(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-base text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Headline */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-base font-semibold text-muted-foreground uppercase tracking-widest">
                  Headline
                </label>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {onboardHeadline.length}/40
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={40}
                placeholder="Example: Co-founder and storyteller. Building a social app."
                value={onboardHeadline}
                onChange={(e) => setOnboardHeadline(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-base text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Newsletter Checklist */}
            <div className="border-t border-border pt-3 mt-4">
              <h4 className="text-base font-semibold text-foreground mb-1 uppercase tracking-wider">
                Stay ahead of the curve
              </h4>
              <p className="text-[11px] text-muted-foreground mb-3">
                Join other successful builders reading about the best launches and the people powering them.
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onboardNewsletterLeaderboard}
                    onChange={(e) => setOnboardNewsletterLeaderboard(e.target.checked)}
                    className="mt-0.5 accent-orange-600 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-semibold text-foreground">
                        😺 The Leaderboard
                      </span>
                      <span className="bg-orange-600/10 text-orange-500 text-[9px] font-semibold px-1.5 py-0.2 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      The Daily: Three takes, ten top launches, one fast scroll. That&apos;s it.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onboardNewsletterRoundup}
                    onChange={(e) => setOnboardNewsletterRoundup(e.target.checked)}
                    className="mt-0.5 accent-orange-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-base font-semibold text-foreground">
                      📅 The Roundup
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      The week in tech: breakout products, bold ideas, and the stuff people actually talked about.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onboardNewsletterFrontier}
                    onChange={(e) => setOnboardNewsletterFrontier(e.target.checked)}
                    className="mt-0.5 accent-orange-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-base font-semibold text-foreground">
                      🧠 The Frontier (Every Tuesday)
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Tech&apos;s AI signal boost: standout launches, sharp analysis, founder intel.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Age Verification Required Checkbox */}
            <div className="py-2 border-t border-border mt-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={onboardAgeCheck}
                  onChange={(e) => setOnboardAgeCheck(e.target.checked)}
                  className="accent-orange-600 cursor-pointer"
                />
                <span className="text-base text-foreground">
                  I am 16 years old or older <span className="text-red-500 font-semibold">*</span>
                </span>
              </label>
            </div>

            {/* LinkedIn Recommendation Banner */}
            {!onboardLinkedIn && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-2.5 rounded-xl text-base flex items-center justify-center gap-2 mb-2 animate-in fade-in duration-200">
                <span className="font-medium">• LinkedIn is recommended</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-3 border-t border-border mt-4">
              <button
                type="submit"
                disabled={!onboardAgeCheck}
                className={`w-full py-3 px-6 rounded-full text-white text-base font-semibold transition-all cursor-pointer text-center ${
                  onboardAgeCheck
                    ? "bg-[#ff5733] hover:bg-[#e64a19] shadow-md shadow-orange-500/15"
                    : "bg-muted-foreground/30 text-muted-foreground/80 cursor-not-allowed"
                }`}
              >
                Complete
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-2.5 text-base text-muted-foreground hover:text-foreground font-medium hover:underline transition-all cursor-pointer text-center"
              >
                Cancel / Logout
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
