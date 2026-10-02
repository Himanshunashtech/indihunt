import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Favicon from "@/components/Favicon";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Package
} from "lucide-react";
import { Product, Profile, ProductShoutout, getProductSlug } from "@/lib/supabase";

interface MakersSectionProps {
  product: Product;
  teamMembers: Profile[];
  shoutoutsGiven: ProductShoutout[];
}

export default function MakersSection({ product, teamMembers, shoutoutsGiven }: MakersSectionProps) {
  const [isLaunchTeamExpanded, setIsLaunchTeamExpanded] = useState(false);

  return (
    <div className=" pb-6 transition-all duration-300">
      {/* Collapsed Header Row */}
      <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-3">
        <div className="flex items-center gap-3">
          {/* Users Icon Container */}
          <div className="w-10 h-10 border border-border bg-card rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <style>{`
              .shadow-sm {
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
              }
            `}</style>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground text-base tracking-tight">Launch Team / Built With</span>
        </div>

        {/* Middle: Launch Team Avatars & Built With Logos (Separated) */}
        <div className="flex items-center gap-4 overflow-hidden mx-auto sm:ml-4 sm:mr-auto py-1 flex-wrap sm:flex-nowrap">
          {/* User Avatars Row (Launch Team) */}
          <div className="flex items-center -space-x-2">
            {/* Owner Avatar with H (blue) or M (green) badge */}
            {product.maker_id && (
              <Link
                href={product.maker?.username ? `/@${product.maker.username}` : `/profile?id=${product.maker_id}`}
                title={`${product.maker?.full_name || "Maker"} (${product.worked_on_launch === false ? "Hunter" : "Maker"})`}
                className="relative group"
              >
                <div className="w-8 h-8 rounded-full border-2 border-card overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-semibold text-white text-[10px] shadow-sm cursor-pointer hover:scale-105 transition-all">
                  {product.maker?.avatar_url ? (
                    <Image src={product.maker.avatar_url} alt="" className="object-cover w-full h-full" width={48} height={48} />
                  ) : (
                    product.maker?.full_name?.charAt(0) || "M"
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex items-center -space-x-1">
                  {product.worked_on_launch !== false && (
                    <span
                      className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-card flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                      title="Maker"
                    >
                      M
                    </span>
                  )}
                  <span
                    className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-card flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                    title="Hunter"
                  >
                    H
                  </span>
                </div>
              </Link>
            )}

            {/* Co-makers Avatars with M (green) badge */}
            {teamMembers.map((member) => (
              <Link
                key={member.id}
                href={`/profile?id=${member.id}`}
                title={`${member.full_name} (Maker)`}
                className="relative group"
              >
                <div className="w-8 h-8 rounded-full border-2 border-card overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-semibold text-white text-[10px] shadow-sm cursor-pointer hover:scale-105 transition-all">
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt="" className="object-cover w-full h-full" width={48} height={48} />
                  ) : (
                    member.full_name?.charAt(0) || "C"
                  )}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-card flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                  title="Maker"
                >
                  M
                </span>
              </Link>
            ))}
          </div>

          {/* Separated Shoutout Product/Tool Logos */}
          {shoutoutsGiven.length > 0 && (
            <div className="flex items-center -space-x-1.5 border-l border-border/40 pl-3">
              {shoutoutsGiven.map((shout) => {
                if (!shout.shouted_product) return null;
                const slug = getProductSlug(shout.shouted_product.name) || shout.shouted_product.id;
                return (
                  <Link key={shout.id} href={`/products/${slug}`} title={`Built with ${shout.shouted_product.name}`}>
                    <div className="w-8 h-8 rounded-xl border-2 border-card overflow-hidden bg-muted flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transition-all">
                      <Favicon src={shout.shouted_product.logo_url} websiteUrl={shout.shouted_product.website_url} size={48} alt={shout.shouted_product.name} className="object-cover w-full h-full" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Show more toggle button */}
        <button
          onClick={() => setIsLaunchTeamExpanded(!isLaunchTeamExpanded)}
          className="flex items-center gap-1.5 px-4 py-2 border border-border hover:bg-muted/50 rounded-full text-xs font-medium text-foreground transition-all cursor-pointer shadow-sm select-none"
        >
          <span>{isLaunchTeamExpanded ? "Show less" : "Show more"}</span>
          {isLaunchTeamExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Expanded Content (matches screenshot 1 layout) */}
      {isLaunchTeamExpanded && (
        <div className="border-t border-border/60 mt-4 pt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Makers Grid Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Owner Profile */}
            {product.maker && (
              <div className="flex items-start gap-3 p-1 rounded-xl hover:bg-muted/10 transition-all">
                <Link
                  href={product.maker.username ? `/@${product.maker.username}` : `/profile?id=${product.maker.id}`}
                  className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-muted border border-border shadow-sm"
                >
                  {product.maker.avatar_url ? (
                    <Image src={product.maker.avatar_url} alt="" className="object-cover w-full h-full" width={48} height={48} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-semibold text-sm">
                      {product.maker.full_name?.charAt(0) || "M"}
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm hover:text-orange-500 transition-colors">
                      <Link href={product.maker.username ? `/@${product.maker.username}` : `/profile?id=${product.maker.id}`}>{product.maker.full_name}</Link>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                      <Crosshair className="w-3 h-3" />
                      Hunter
                    </span>
                    {product.worked_on_launch !== false && (
                      <span className="bg-[#2ecc71] text-white text-xs font-medium px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-sm">
                        <Package className="w-3.5 h-3.5" />
                        <span>Maker</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {product.maker.headline ||
                      product.maker.bio ||
                      (product.worked_on_launch === false ? "Hunter on IndiHunt" : "Founder & Builder")}
                  </p>
                </div>
              </div>
            )}

            {/* Co-makers Profiles */}
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-start gap-3 p-1 rounded-xl hover:bg-muted/10 transition-all"
              >
                <Link
                  href={member.username ? `/@${member.username}` : `/profile?id=${member.id}`}
                  className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-muted border border-border shadow-sm"
                >
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt="" className="object-cover w-full h-full" width={48} height={48} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-semibold text-sm">
                      {member.full_name?.charAt(0) || "M"}
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm hover:text-orange-500 transition-colors">
                      <Link href={member.username ? `/@${member.username}` : `/profile?id=${member.id}`}>{member.full_name}</Link>
                    </span>
                    {member.is_maker && (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Maker
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {member.headline || member.bio || "Maker"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Built With (Shoutouts) Section */}
          {shoutoutsGiven.length > 0 && (
            <div className="space-y-3.5 pt-4 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">
                Built With
              </span>
              <div className="space-y-4">
                {shoutoutsGiven.map((shout) => {
                  if (!shout.shouted_product) return null;
                  const slug = getProductSlug(shout.shouted_product.name) || shout.shouted_product.id;
                  return (
                    <div
                      key={shout.id}
                      className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-muted/10 transition-all border border-border/40"
                    >
                      <Link
                        href={`/products/${slug}`}
                        className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center flex-shrink-0 font-semibold text-sm text-orange-500 shadow-sm hover:opacity-90 transition-opacity"
                      >
                        <Favicon src={shout.shouted_product.logo_url} websiteUrl={shout.shouted_product.website_url} size={48} alt={shout.shouted_product.name} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/products/${slug}`}
                            className="text-base font-semibold text-foreground block hover:text-orange-500 transition-colors cursor-pointer truncate"
                          >
                            {shout.shouted_product.name}
                          </Link>
                          {shout.shouted_product.pricing_type && (
                            <span className="text-[10px] font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border capitalize">
                              {shout.shouted_product.pricing_type}
                            </span>
                          )}
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                          {shout.shouted_product.tagline}
                        </p>
                        {shout.note && (
                          <div className="mt-2 text-base text-foreground/85 bg-muted/20 border border-border/30 rounded-xl p-2.5 leading-relaxed whitespace-pre-wrap">
                            {shout.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
