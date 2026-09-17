"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function TopProgressBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(true);
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    // Prevent repeated animation when pathname has not changed (e.g. strict mode, re-renders)
    if (prevPathname.current === pathname) {
      return;
    }
    prevPathname.current = pathname;

    setLoading(true);
    setAnimating(true);

    const completeTimer = setTimeout(() => {
      setAnimating(false);
    }, 600);

    const hideTimer = setTimeout(() => {
      setLoading(false);
    }, 850);

    return () => {
      clearTimeout(completeTimer);
      clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed top-0 left-0 h-[3px] z-[9999] pointer-events-none transition-opacity duration-300 ${
          animating ? "page-top-loader opacity-100" : "w-full opacity-0"
        }`}
        style={{
          background: "linear-gradient(to right, #3b0764, #6d28d9, #ff5733, #b91c1c)"
        }}
      />
      <style>{`
        @keyframes pageLoadingBar {
          0% {
            transform: scaleX(0);
          }
          60% {
            transform: scaleX(0.7);
          }
          100% {
            transform: scaleX(1);
          }
        }
        .page-top-loader {
          width: 100%;
          transform-origin: left;
          animation: pageLoadingBar 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
