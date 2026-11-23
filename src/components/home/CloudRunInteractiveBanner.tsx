"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const commandText = "gcloud run launch";

export default function CloudRunInteractiveBanner() {
  const [copied, setCopied] = useState(false);
  const [typed, setTyped] = useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commandText);
      window.open(
        "https://cloud.google.com/run",
        "_blank",
        "noopener,noreferrer"
      );
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (error) {
      console.error("Failed to copy command:", error);
    }
  };

  // Typewriter animation
  useEffect(() => {
    let i = 0;
    let dir = 1;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      setTyped(commandText.slice(0, i));

      if (dir === 1 && i === commandText.length) {
        dir = -1;
        timer = setTimeout(tick, 1800);
        return;
      }

      if (dir === -1 && i === 0) {
        dir = 1;
        timer = setTimeout(tick, 600);
        return;
      }

      i += dir;

      timer = setTimeout(
        tick,
        dir === 1 ? 100 : 35
      );
    };

    tick();

    return () => clearTimeout(timer);
  }, []);

  const columns = [
    { x: -20, height: 76, step: 105, delay: "0s" },
    { x: 48, height: 52, step: 88, delay: "0.7s" },
    { x: 116, height: 76, step: 105, delay: "1.4s" },
    { x: 184, height: 52, step: 88, delay: "2.1s" },
    { x: 252, height: 76, step: 105, delay: "2.8s" },
  ];

  return (
    <div
      className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[38px] p-1 sm:p-4 select-none mb-4"
      style={{
        background: "linear-gradient(180deg, #5b2fd1 0%, #812fba 42%, #b62f8e 70%, #e63f5a 100%)",
      }}
    >
      {/* ANIMATED RIGHT-SIDE BACKGROUND */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[38%] lg:w-[38%] pointer-events-none overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-[125%] -translate-y-[12%]"
          viewBox="0 0 320 520"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="capsuleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {columns.map((column, columnIndex) => (
            <g key={columnIndex}>
              <animateTransform
                attributeName="transform"
                type="translate"
                from={`0 -${column.step}`}
                to="0 0"
                dur="4s"
                begin={column.delay}
                repeatCount="indefinite"
              />

              {Array.from({ length: 8 }).map((_, index) => (
                <rect
                  key={index}
                  x={column.x}
                  y={-20 + index * column.step}
                  width="62"
                  height={column.height}
                  rx="31"
                  fill="url(#capsuleGradient)"
                />
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* CONTENT CARD */}
      <div
        className="relative z-10 w-full md:w-[65%] lg:w-[64%] rounded-[20px] sm:rounded-[36px] px-3.5 py-4 sm:px-7 sm:py-6 shadow-xl"
        style={{
          backgroundColor: "#18181b",
          color: "#ffffff",
        }}
      >
        {/* CHIP */}
        <div
          className="inline-flex items-center gap-2 h-8 pl-1.5 pr-3.5 rounded-full"
          style={{ backgroundColor: "#222227" }}
        >
          <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
              <path d="M4 5l8 7-8 7z" fill="#4285f4" />
              <path d="M9 5l8 7-8 7z" fill="#ea4335" opacity="0.9" />
              <path d="M14 8l5 4-5 4z" fill="#34a853" />
            </svg>
          </span>
          <span className="text-[12px] sm:text-[13px] text-white/90">
            Brought to you by Google Cloud Run
          </span>
        </div>

        {/* TITLE */}
        <h2 className="mt-4 text-2xl sm:text-3xl lg:text-[36px] font-normal tracking-tight leading-[1.08]">
          Build the best thing.
          <br />
          Let{" "}
          <span
            style={{
              color: "#c58af9",
              backgroundImage: "linear-gradient(90deg, #8ab4f8 0%, #c58af9 50%, #f28b82 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
            }}
          >
            Cloud Run
          </span>{" "}
          handle the rest.
        </h2>

        {/* DESCRIPTION */}
        <p className="mt-3 max-w-xl text-sm sm:text-[14px] leading-relaxed text-[#d4d4d8]">
          Build for your first users and your next thousand. Ask Googlers and Google Developer Experts how in today&apos;s comments.
        </p>

        {/* TERMINAL */}
        <div
          className="mt-5 flex items-center justify-between gap-3 h-12 sm:h-14 pl-4 pr-2 rounded-full border"
          style={{
            backgroundColor: "#222227",
            borderColor: "#2e2e36",
          }}
        >
          <div
            suppressHydrationWarning
            className="flex items-center gap-2 font-mono text-sm min-w-0"
          >
            <span className="text-white/50">$</span>
            <span className="text-white truncate">{typed}</span>
            <span className="w-2 h-4 bg-[#8e8e92] flex-shrink-0 animate-pulse" />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 h-9 sm:h-10 pl-3.5 pr-1.5 rounded-full text-sm font-medium text-white flex-shrink-0 transition-transform active:scale-95 cursor-pointer"
            style={{ backgroundColor: "#2f86ff" }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="pr-2">Copied</span>
              </>
            ) : (
              <>
                <span>Try it</span>
                <span className="flex items-center justify-center h-7 px-2.5 rounded-lg bg-white/25 text-xs">
                  ↵
                </span>
              </>
            )}
          </button>
        </div>

        {/* CLOUD RUN LINK */}
        <p className="mt-4 text-sm font-normal text-[#a1a1a8]">
          Building on Cloud Run?{" "}
          <a
            href="https://cloud.google.com/run"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8ab4f8] hover:underline"
          >
            Learn More →
          </a>
        </p>

        {/* DISCUSSION LINK */}
        <div className="mt-4">
          <Link
            href="/threads/what-do-you-think-about-google-cloud-run"
            className="text-sm font-normal text-[#8ab4f8] hover:underline"
          >
            Join the forum discussion →
          </Link>
        </div>
      </div>
    </div>
  );
}
