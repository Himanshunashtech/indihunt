import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";

export function ClaudeStartupsBanner() {
  const columns = [
    { x: -20, height: 76, step: 105, delay: "0s" },
    { x: 48, height: 52, step: 88, delay: "0.7s" },
    { x: 116, height: 76, step: 105, delay: "1.4s" },
    { x: 184, height: 52, step: 88, delay: "2.1s" },
    { x: 252, height: 76, step: 105, delay: "2.8s" },
    { x: 320, height: 52, step: 88, delay: "1.2s" },
    { x: 388, height: 76, step: 105, delay: "2.4s" },
  ];

  return (
    <div className="relative w-full rounded-[2rem] overflow-hidden mb-8 shadow-sm group"
         style={{ background: "linear-gradient(180deg, #ea580c 0%, #f97316 50%, #fdba74 100%)" }}
    >
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden opacity-60">
        <svg
          className="absolute inset-0 w-full h-[125%] -translate-y-[12%]"
          viewBox="0 0 420 520"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="orangeCapsuleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
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

              {Array.from({ length: 12 }).map((_, index) => (
                <rect
                  key={index}
                  x={column.x}
                  y={-20 + index * column.step}
                  width="62"
                  height={column.height}
                  rx="31"
                  fill="url(#orangeCapsuleGradient)"
                />
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* Edge Images / Video Placeholders matching the screenshot */}
      <div className="absolute top-2 -left-8 w-40 h-28 rounded-2xl overflow-hidden opacity-90 rotate-[-2deg] shadow-2xl hidden md:block border border-white/20">
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop"
          alt="Founder"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      </div>

      <div className="absolute top-12 -right-12 w-48 h-32 rounded-2xl overflow-hidden opacity-90 rotate-[3deg] shadow-2xl hidden md:block border border-white/20">
        <img
          src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=300&fit=crop"
          alt="Founder"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 left-16 w-48 h-32 rounded-2xl overflow-hidden opacity-90 rotate-[4deg] shadow-2xl hidden md:block border border-white/20">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
          alt="Founders"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute -bottom-4 right-24 w-36 h-28 rounded-2xl overflow-hidden opacity-90 rotate-[-3deg] shadow-2xl hidden md:block border border-white/20">
        <img
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop"
          alt="Founder"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-10 px-6 text-center max-w-3xl mx-auto drop-shadow-md">
        <span className="text-white/80 font-semibold text-sm tracking-widest mb-4 uppercase">
          Claude Startups
        </span>
        
        <h2 className="text-4xl md:text-5xl font-serif text-white leading-[1.1] mb-4 tracking-tight">
          Start up <br className="hidden sm:block" />
          and stand out
        </h2>
        
        <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl font-light leading-relaxed">
          Join the founders building on Claude. Get special offers on tools that
          help with running an AI-native company, office hours with Anthropic's
          Applied AI team, and more.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="https://claude.com/programs/startups" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white hover:bg-orange-50 text-orange-600 rounded-full px-8 py-3 text-sm font-bold transition-colors shadow-lg w-full sm:w-auto"
          >
            Apply now
          </Link>
          
          <Link
            href="/threads/anthropics-claude-startups-program-what-founders-actually-get-and-what-they-dont-13-part-thread-no-links-anywhere-post-as-numbered-tweets-or-as-one-long-post-on-x-premium-or-linkedin"
            className="bg-black/10 hover:bg-black/20 text-white rounded-full px-8 py-3 text-sm font-bold transition-colors shadow-lg border border-white/30 w-full sm:w-auto"
          >
            Read discussion
          </Link>
        </div>
      </div>
    </div>
  );
}
