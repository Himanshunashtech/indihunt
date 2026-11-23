import React from "react";
import { Play } from "lucide-react";
import { Product } from "@/lib/supabase";

interface DemoVideoTabProps {
  product: Product;
}

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

export default function DemoVideoTab({ product }: DemoVideoTabProps) {
  return (
    <div className="space-y-6 bg-card border border-border p-6 rounded-3xl shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-4 ">
        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
          <Play className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base">Product Walkthrough & Demo</h3>
          <p className="text-[10px] text-muted-foreground">Short video pitch from the launcher</p>
        </div>
      </div>

      {product && product.video_url ? (
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black">
          <iframe
            src={getEmbedUrl(product.video_url) || product.video_url}
            title="Product Walkthrough Video"
            className="w-full h-full object-cover"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground space-y-2 bg-muted/20 border border-dashed border-border rounded-2xl">
          <p className="text-xs font-semibold">No Walkthrough Video Submitted</p>
          <p className="text-[10px] max-w-sm mx-auto">Makers can add screen recordings, YouTube pitches, or Loom videos under product settings.</p>
        </div>
      )}
    </div>
  );
}
