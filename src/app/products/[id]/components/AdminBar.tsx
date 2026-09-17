import React from "react";
import Link from "next/link";
import { Product, getProductSlug } from "@/lib/supabase";

interface AdminBarProps {
  product: Product;
  isOwner: boolean;
  isScheduled: boolean;
  setActiveSubTab: (tab: string) => void;
}

export default function AdminBar({ product, isOwner, isScheduled, setActiveSubTab }: AdminBarProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isScheduled || !isOwner) return null;

  return (
    <>
      {/* Admin Bar */}
      <div className="bg-muted/95  px-6 py-2.5 flex items-center justify-between text-xs font-semibold text-muted-foreground max-w-7xl mx-auto mb-4 rounded-xl">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground">🛡️ Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/my-products/${getProductSlug(product.name)}/settings`} className="hover:text-foreground">
            Edit Launch
          </Link>
          <Link href={`/products/${getProductSlug(product.name)}/pre-launch`} className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href={`/products/${getProductSlug(product.name)}/embed`} className="hover:text-foreground">
            Embed
          </Link>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-amber-500/5 border border-amber-500/15 p-6 rounded-3xl space-y-4 shadow-sm mb-8 text-xs text-foreground/95">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span className="text-base">⏰</span>
            <span>
              This product is scheduled for {new Date(product.scheduled_for!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at 12:01 AM.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
              }}
              className="px-3.5 py-1.5 rounded-xl border border-border bg-card font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Share</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-border/40"></div>

        <p className="font-medium text-muted-foreground/80 leading-relaxed">
          Upvoting is disabled until the launch is live.
        </p>

        <div className="h-px bg-border/40"></div>

        <div className="flex flex-col gap-2">
          <span className="font-semibold text-foreground">
            Start conversations in your{" "}
            <Link
              href={`/products/${product.id}?tab=Forum`}
              onClick={() => setActiveSubTab("Forum")}
              className="text-orange-500 hover:underline"
            >
              product forum
            </Link>{" "}
            to engage early users and build momentum before launch day.
          </span>
          <button
            onClick={() => setActiveSubTab("Forum")}
            className="w-fit px-4 py-2 border border-border bg-card rounded-xl text-[10px] font-semibold hover:bg-muted transition-all"
          >
            Start new thread
          </button>
        </div>

        <div className="h-px bg-border/40"></div>

        <div className="space-y-2">
          <p className="font-medium text-muted-foreground/80">
            Want additional exposure for {product.name}? Start an ad campaign with as little as $1,199.
          </p>
          <Link
            href={`/ads?product_id=${product.id}`}
            className="w-fit px-4 py-2 border border-border bg-card rounded-xl text-[10px] font-semibold hover:bg-muted transition-all block"
          >
            Check out our advertising options
          </Link>
        </div>
      </div>
    </>
  );
}
