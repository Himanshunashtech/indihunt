"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Safely reset scroll to top on pathname changes across page navigations
  useEffect(() => {
    const handleScrollReset = () => {
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    // Immediate scroll reset
    handleScrollReset();

    // Secondary reset after next frame to ensure layout shifts during route transition start at the top
    const rafId = requestAnimationFrame(handleScrollReset);
    const timeoutId = setTimeout(handleScrollReset, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > window.innerHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-slate-900/40 hover:bg-slate-900/70 dark:bg-slate-100/35 dark:hover:bg-slate-100/60 backdrop-blur-md text-foreground transition-all duration-300 hover:scale-110 shadow-lg cursor-pointer outline-none focus:outline-none flex items-center justify-center border border-white/10 dark:border-black/5"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5 text-white" />
    </button>
  );
}
