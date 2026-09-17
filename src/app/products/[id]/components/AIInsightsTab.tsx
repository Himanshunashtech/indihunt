import React from "react";
import { Sparkles } from "lucide-react";
import { Product } from "@/lib/supabase";

interface AIInsightsTabProps {
  product: Product;
  setProduct: (p: Product) => void;
}

export default function AIInsightsTab({ product, setProduct }: AIInsightsTabProps) {
  return (
    <div className="space-y-6 bg-card border border-border p-6 rounded-3xl shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-4 ">
        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-base">AI Product Analysis</h3>
          <p className="text-[10px] text-muted-foreground">Generated instantly using Gemini AI models</p>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-xs text-muted-foreground leading-relaxed space-y-4">
        {product && product.ai_summary ? (
          <div
            className="space-y-4"
            dangerouslySetInnerHTML={{
              __html: product.ai_summary
                .replace(/### (.*)/g, '<h4 class="font-bold text-foreground text-sm mt-4 mb-2">$1</h4>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                .replace(/- (.*)/g, '<li class="ml-4 list-disc text-xs">$1</li>')
            }}
          />
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-xs">No AI summary generated for this launch yet.</p>
            <button
              type="button"
              onClick={async () => {
                const { getAISummaryForProduct } = await import("@/lib/gemini");
                const sum = await getAISummaryForProduct(product.name, product.tagline, product.description || "", product.tags || []);
                setProduct({ ...product, ai_summary: sum });
              }}
              className="px-5 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Generate AI Insights
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
