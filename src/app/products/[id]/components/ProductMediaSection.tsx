"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Bot,
  Zap,
  Sparkles,
  Code,
  Cloud,
  Palette,
  Tag
} from "lucide-react";
import { Product, getProductSlug } from "@/lib/supabase";
import { SponsoredAd } from "@/components/SponsoredAd";

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const ytMatch = cleanUrl.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const fallbackId = cleanUrl.split(/v=/)[1]?.split(/&/)[0] || cleanUrl.split("/").pop()?.split("?")[0];
    if (fallbackId && fallbackId.length === 11) {
      return `https://www.youtube.com/embed/${fallbackId}`;
    }
  }

  if (cleanUrl.includes("loom.com")) {
    const loomRegex = /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i;
    const loomMatch = cleanUrl.match(loomRegex);
    if (loomMatch && loomMatch[1]) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }
    const fallbackId = cleanUrl.split("/").pop()?.split("?")[0];
    if (fallbackId && fallbackId.length > 5) {
      return `https://www.loom.com/embed/${fallbackId}`;
    }
  }

  if (cleanUrl.includes("/embed/")) {
    if (cleanUrl.startsWith("http")) return cleanUrl;
    return `https://${cleanUrl}`;
  }

  return null;
}

interface ProductMediaSectionProps {
  product: Product;
  screenshots: string[];
}

export default function ProductMediaSection({ product, screenshots }: ProductMediaSectionProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [fullscreenMediaIndex, setFullscreenMediaIndex] = useState<number | null>(null);
  const mediaContainerRef = useRef<HTMLDivElement | null>(null);

  const embedUrl = product.video_url ? getEmbedUrl(product.video_url) : null;
  const slides = embedUrl
    ? [{ type: "video" as const, url: embedUrl }, ...screenshots.map(s => ({ type: "image" as const, url: s }))]
    : screenshots.map(s => ({ type: "image" as const, url: s }));

  // Keyboard navigation for fullscreen lightbox
  useEffect(() => {
    if (fullscreenMediaIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenMediaIndex(null);
      } else if (e.key === "ArrowLeft") {
        setFullscreenMediaIndex(prev => prev !== null && prev > 0 ? prev - 1 : slides.length - 1);
      } else if (e.key === "ArrowRight") {
        setFullscreenMediaIndex(prev => prev !== null && prev < slides.length - 1 ? prev + 1 : 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenMediaIndex, slides.length]);

  // Scroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const slideWidth = 500; // base width of slide
    const idx = Math.round(scrollLeft / (slideWidth + 16)); // 16px gap
    setActiveImageIdx(idx);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (mediaContainerRef.current) {
      const scrollAmount = direction === 'left' ? -516 : 516;
      mediaContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (slides.length === 0) {
    return <SponsoredAd excludeProductId={product.id} />;
  }

  return (
    <div className="space-y-4">
      {/* Media Scroll Gallery */}
      <div className="relative group max-w-6xl mx-auto">
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Left Scroll Trigger Arrow */}
        {activeImageIdx > 0 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/90 hover:bg-background border border-border shadow-md text-foreground cursor-pointer transition-all hover:scale-105 z-35 flex items-center justify-center focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={mediaContainerRef}
          onScroll={handleScroll}
          className={`flex overflow-x-auto gap-4 pb-3 scroll-smooth snap-x snap-mandatory no-scrollbar ${
            slides.length === 1
              ? "justify-center"
              : slides.length === 2
              ? "justify-start sm:justify-center"
              : ""
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {slides.map((slide, idx) => (
            <div
              key={idx}
              onClick={() => setFullscreenMediaIndex(idx)}
              className="flex-shrink-0 w-[85%] sm:w-[500px] aspect-video snap-center rounded-2xl overflow-hidden border border-border bg-black relative shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
            >
              {slide.type === "video" ? (
                <>
                  <div className="absolute inset-0 z-10 bg-transparent" />
                  <iframe
                    src={slide.url}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    className="w-full h-full pointer-events-none"
                  />
                </>
              ) : (
                <img
                  src={slide.url}
                  alt={`Product Slide ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ))}
        </div>

        {/* Right Scroll Trigger Arrow */}
        {activeImageIdx < slides.length - 1 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/90 hover:bg-background border border-border shadow-md text-foreground cursor-pointer transition-all hover:scale-105 z-35 flex items-center justify-center focus:outline-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scroll Indicator Dots */}
        {slides.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (mediaContainerRef.current) {
                    mediaContainerRef.current.scrollTo({
                      left: idx * 516,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  activeImageIdx === idx ? "bg-orange-500 w-3.5" : "bg-muted-foreground/35"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Launch Tags & Options Below Images */}
      <div className="py-4 space-y-2">
        <div className="text-base font-medium text-foreground/80">
          {product.pricing_type ? (
            product.pricing_type.toLowerCase() === "free" ? "Free Options" : product.pricing_type
          ) : "Free Options"}
        </div>

        {(() => {
          const realTags: string[] = (product.tags && Array.isArray(product.tags) && product.tags.length > 0)
            ? product.tags
            : (product.category && typeof product.category === 'string' && product.category.trim()
              ? product.category.split(',').map((s: string) => s.trim()).filter(Boolean)
              : ["Productivity", "Artificial Intelligence", "Virtual Assistants"]);

          if (realTags.length === 0) return null;

          const getTagIcon = (tagName: string) => {
            const t = tagName.toLowerCase();
            if (t.includes("ai") || t.includes("artificial") || t.includes("gpt") || t.includes("bot")) {
              return <Bot className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />;
            }
            if (t.includes("product") || t.includes("task") || t.includes("work") || t.includes("todo")) {
              return <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
            }
            if (t.includes("assistant") || t.includes("virtual") || t.includes("agent") || t.includes("chat")) {
              return <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />;
            }
            if (t.includes("dev") || t.includes("code") || t.includes("git") || t.includes("tech")) {
              return <Code className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
            }
            if (t.includes("saas") || t.includes("cloud") || t.includes("software")) {
              return <Cloud className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />;
            }
            if (t.includes("design") || t.includes("ui") || t.includes("ux") || t.includes("art")) {
              return <Palette className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />;
            }
            return <Tag className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />;
          };

          return (
            <div className="flex items-center gap-2 text-base font-medium text-foreground/80 flex-wrap">
              <span>Launch tags:</span>
              {realTags.map((tag: string, idx: number) => (
                <React.Fragment key={tag}>
                  <Link
                    href={`/categories/${getProductSlug(tag)}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-muted/40 hover:bg-orange-500/10 hover:text-orange-500 border border-border/60 text-foreground/90 font-medium transition-all text-sm"
                  >
                    {getTagIcon(tag)}
                    <span>{tag}</span>
                  </Link>
                  {idx < realTags.length - 1 && (
                    <span className="text-muted-foreground/40 font-semibold">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Sponsored Ad placement */}
      <SponsoredAd excludeProductId={product.id} />

      {/* Fullscreen Lightbox Modal */}
      {fullscreenMediaIndex !== null && (
        <div
          onClick={() => setFullscreenMediaIndex(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
        >
          {/* Top Bar with Counter & Close Button */}
          <div className="w-full flex items-center justify-between z-50 max-w-7xl px-2 h-10 flex-shrink-0">
            <span className="text-xs font-medium text-white/80 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              {fullscreenMediaIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => setFullscreenMediaIndex(null)}
              className="text-white hover:text-orange-400 transition-colors p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md cursor-pointer flex items-center justify-center focus:outline-none w-9 h-9"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Navigation arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenMediaIndex(prev => prev !== null && prev > 0 ? prev - 1 : slides.length - 1);
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-xl cursor-pointer transition-all hover:scale-105 z-50 focus:outline-none"
                title="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenMediaIndex(prev => prev !== null && prev < slides.length - 1 ? prev + 1 : 0);
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-xl cursor-pointer transition-all hover:scale-105 z-50 focus:outline-none"
                title="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Fullscreen Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 w-full max-w-6xl min-h-0 flex items-center justify-center py-2 overflow-hidden"
          >
            {slides[fullscreenMediaIndex].type === "video" ? (
              <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                <iframe
                  src={slides[fullscreenMediaIndex].url}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <img
                src={slides[fullscreenMediaIndex].url}
                alt={`Product Slide ${fullscreenMediaIndex + 1}`}
                className="w-auto h-auto max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/10 select-none block mx-auto"
                style={{
                  maxHeight: "calc(100vh - 110px)",
                  maxWidth: "calc(100vw - 80px)"
                }}
              />
            )}
          </div>

          {/* Bottom spacer to ensure balanced vertical centering */}
          <div className="h-6 flex-shrink-0" />
        </div>
      )}
    </div>
  );
}
