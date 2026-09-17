"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  ExternalLink,
  Megaphone,
  Users,
  BarChart2,
  Code,
  Copy,
  Check,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { useAppSelector } from "@/lib/store";
import { supabase, getProductSlug, Product } from "@/lib/supabase";

export default function LaunchScheduleWidget() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const [scheduledProducts, setScheduledProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!user) {
      setScheduledProducts([]);
      return;
    }

    let productsList: Product[] = [];

    const updateScheduledState = () => {
      // Find all products that are scheduled in the future
      const scheduled = productsList.filter((p) => {
        const isScheduledStatus = p.status === "scheduled";
        const hasFutureDate = p.scheduled_for && new Date(p.scheduled_for) > new Date();
        return isScheduledStatus && hasFutureDate;
      });

      setScheduledProducts(scheduled);
    };

    const fetchScheduledLaunch = async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("maker_id", user.id);

        if (!error && data) {
          productsList = data;
        }
      } else {
        // Fallback to local storage in offline/mock mode
        const local = localStorage.getItem("indihunt_products");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            productsList = parsed.filter((p: any) => p.maker_id === user.id);
          } catch (e) {
            console.error(e);
          }
        }
      }

      updateScheduledState();
    };

    fetchScheduledLaunch();

    // Check periodically (every 30 seconds) in case it launches locally
    const interval = setInterval(updateScheduledState, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const scheduledProduct = scheduledProducts[currentIndex] || null;

  if (pathname?.startsWith("/page/") || pathname?.includes("/embed") || !scheduledProduct || isDismissed) {
    return null;
  }

  const handleCycleLaunch = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % scheduledProducts.length);
  };

  const productSlug = getProductSlug(scheduledProduct.name);
  const productUrl = typeof window !== "undefined"
    ? `${window.location.origin}/products/${productSlug || scheduledProduct.id}`
    : "";

  const embedCode = `<a href="${productUrl}" target="_blank"><img src="${typeof window !== "undefined" ? window.location.origin : ""
    }/t/embed?id=${scheduledProduct.id}&style=classic" alt="${scheduledProduct.name} on IndiHunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>`;

  const copyProductLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  // Render minimized orange box with single left arrow if multiple launches exist (no numbers)
  if (!isOpen) {
    return (
      <div className="fixed bottom-0 left-3 sm:left-4 right-auto max-w-[min(280px,80vw)] sm:max-w-xs w-auto sm:w-full z-50 flex items-center bg-[#ff5733] text-white px-3 pt-2.5 pb-2 rounded-t-2xl rounded-b-none shadow-2xl border border-orange-400/30 no-hover-bg">
        {scheduledProducts.length > 1 && (
          <button
            onClick={handleCycleLaunch}
            title="Switch scheduled launch"
            className="p-1 hover:bg-black/20 rounded-lg text-white/90 hover:text-white transition-all cursor-pointer mr-1.5 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="flex-1 flex flex-col items-start min-w-0 text-left group/launch cursor-pointer !bg-transparent hover:!bg-transparent focus:!bg-transparent border-none p-0 shadow-none outline-none no-hover-bg"
        >
          <div className="flex items-center gap-1.5 w-full font-semibold text-xs text-white">
            <span className="truncate flex-1 pr-1">{scheduledProduct.name}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover/launch:opacity-100 transition-opacity flex-shrink-0 text-white" />
          </div>
          <div className="text-[11px] font-normal mt-0.5 opacity-90 flex items-center gap-1 text-white/90">
            <span>Launch tips</span>
            <span>🚀</span>
          </div>
        </button>
      </div>
    );
  }

  // Render expanded drawer/modal panel with single left arrow if multiple launches exist (no numbers)
  return (
    <div className="fixed bottom-3 left-3 sm:left-4 right-auto max-w-[min(300px,85vw)] sm:max-w-sm w-auto sm:w-full z-50 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="bg-[#ff5733] text-white p-3.5 flex items-center justify-between relative">
        <div className="flex items-center gap-2 min-w-0">
          {scheduledProducts.length > 1 && (
            <button
              onClick={handleCycleLaunch}
              title="Switch scheduled launch"
              className="p-1 bg-black/20 hover:bg-black/35 rounded-lg text-white transition-all cursor-pointer flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm tracking-tight truncate">Congrats on your launch! 🎉</h4>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIsOpen(false)}
            title="Minimize"
            className="text-white/80 hover:text-white hover:bg-black/10 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all cursor-pointer"
          >
            Minimize
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            title="Close"
            className="text-white/80 hover:text-white hover:bg-black/10 p-1 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 overflow-y-auto space-y-4 text-xs">
        <p className="text-muted-foreground leading-relaxed">
          Here are some things you can do to get{" "}
          <Link
            href={`/products/${productSlug || scheduledProduct.id}`}
            className="font-semibold text-[#ff5733] hover:underline"
          >
            {scheduledProduct.name}
          </Link>{" "}
          featured on the homepage:
        </p>

        {/* Action 1: Add Shoutouts */}
        <div className="flex gap-3 items-start p-2.5 rounded-xl border border-border/50 bg-card/45">
          <Megaphone className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-semibold text-foreground flex items-center gap-1">Add Shoutouts</h5>
            <p className="text-muted-foreground mt-0.5">Share what tools you used to build this launch.</p>
            <Link
              href={`/my-products/${productSlug || getProductSlug(scheduledProduct.name)}/settings`}
              className="text-[#ff5733] hover:underline font-semibold mt-1.5 inline-block"
            >
              Add some shoutouts →
            </Link>
          </div>
        </div>

        {/* Action 2: Invite co-makers */}
        <div className="flex gap-3 items-start p-2.5 rounded-xl border border-border/50 bg-card/45">
          <Users className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-foreground">Invite your co-Makers</h5>
            <p className="text-muted-foreground mt-0.5">Get everyone who worked on this launch involved on its launch!</p>
            <div className="mt-2 flex gap-1.5">
              <input
                type="text"
                readOnly
                value={productUrl}
                className="bg-muted border border-border rounded-lg px-2 py-1 flex-1 text-[10px] text-muted-foreground focus:outline-none truncate select-all"
              />
              <button
                onClick={copyProductLink}
                className="bg-card hover:bg-muted border border-border rounded-lg px-2.5 py-1 font-semibold text-foreground/80 hover:text-foreground flex items-center gap-1 cursor-pointer transition-all flex-shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "COPIED" : "COPY LINK"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action 3: Launch Day Dashboard */}
        <div className="flex gap-3 items-start p-2.5 rounded-xl border border-border/50 bg-card/45">
          <BarChart2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-semibold text-foreground">Launch Day dashboard</h5>
            <p className="text-muted-foreground mt-0.5">Monitor your launch stats live.</p>
            <Link
              href={`/products/${productSlug || scheduledProduct.id}/pre-launch`}
              className="text-[#ff5733] hover:underline font-semibold mt-1.5 inline-block"
            >
              Monitor launch stats live →
            </Link>
          </div>
        </div>

        {/* Action 4: Embed Widget */}
        <div className="flex gap-3 items-start p-2.5 rounded-xl border border-border/50 bg-card/45">
          <Code className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-foreground">Place an embed on your site</h5>
            <p className="text-muted-foreground mt-0.5">Your community can help your launch succeed.</p>

            {/* Simple preview badge */}
            <div className="my-2 p-2 bg-muted/50 rounded-lg flex items-center justify-center border border-border/40">
              <div className="border border-border bg-card rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm scale-95 origin-center">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">Launch scheduled on</span>
                <span className="font-bold text-[10px] text-foreground">IndiHunt</span>
              </div>
            </div>

            <div className="flex gap-1.5 mt-2">
              <input
                type="text"
                readOnly
                value={embedCode}
                className="bg-muted border border-border rounded-lg px-2 py-1 flex-1 text-[10px] text-muted-foreground focus:outline-none truncate select-all"
              />
              <button
                onClick={copyEmbedCode}
                className="bg-card hover:bg-muted border border-border rounded-lg px-2.5 py-1 font-semibold text-foreground/80 hover:text-foreground flex items-center gap-1 cursor-pointer transition-all flex-shrink-0"
              >
                {embedCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{embedCopied ? "COPIED" : "COPY CODE"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
