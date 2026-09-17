"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const UNSPLASH_404_PHOTOS = [
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=1920&q=80"
];

export default function NotFound() {
  const [bgImage, setBgImage] = useState<string>("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * UNSPLASH_404_PHOTOS.length);
    setBgImage(UNSPLASH_404_PHOTOS[randomIndex]);
  }, []);

  const activeImage = bgImage || UNSPLASH_404_PHOTOS[0];

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-[#ff5733] selection:text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar />

      {/* Main 404 Hero Container starting below fixed Navbar (mt-14 sm:mt-16) */}
      <div className="relative w-full mt-14 sm:mt-16 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden">
        {/* Background Image — Full visibility starting below top navbar */}
        <div className="absolute inset-0 z-0">
          <img
            src={activeImage}
            alt="404 Background"
            className="w-full h-full object-cover transition-opacity duration-700"
          />
          {/* Subtle vignette gradient overlay */}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
        </div>

        {/* Floating Card Container — Left Aligned Product Hunt 404 Design */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 w-full py-12 sm:py-20 my-auto flex items-center justify-start">
          <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* 404 Label */}
            <span className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 block tracking-tight">
              404
            </span>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              We seem to have lost this page
            </h1>

            {/* Explanatory Paragraph */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Please accept these adorable photos of our IndiHunt team&apos;s furry friends as our humble apology for the inconvenience. Let&apos;s get you back to the homepage.
            </p>

            {/* Primary Coral/Orange Pill Button */}
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block px-7 py-3.5 rounded-full bg-[#ff5733] hover:bg-[#e04824] text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/30 hover:scale-[1.03] active:scale-95"
              >
                Go to the homepage
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Single global Footer rendered by RootLayout in layout.tsx */}
    </div>
  );
}
