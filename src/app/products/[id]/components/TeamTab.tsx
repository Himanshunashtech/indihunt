import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Crosshair, Package } from "lucide-react";
import { Product, Profile, inviteProductMember, getProductMembers } from "@/lib/supabase";

interface TeamTabProps {
  product: Product;
  user: any;
  teamMembers: Profile[];
  setTeamMembers: (members: Profile[]) => void;
}

export default function TeamTab({
  product,
  user,
  teamMembers,
  setTeamMembers
}: TeamTabProps) {

  return (
    <div className="space-y-6">
      {/* Team Members List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Main Maker Card */}
        {product.maker && (
          <div className="bg-card border border-border p-5 rounded-2xl flex items-start gap-4">
            <Link href={product.maker.username ? `/@${product.maker.username}` : `/profile?id=${product.maker_id}`} className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center font-semibold text-sm text-orange-500 flex-shrink-0 hover:opacity-90 transition-opacity">
              {product.maker.avatar_url ? (
                <Image src={product.maker.avatar_url} alt="Avatar" className="w-10 h-10 object-cover" width={40} height={40} />
              ) : (
                product.maker.full_name.charAt(0)
              )}
            </Link>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href={product.maker.username ? `/@${product.maker.username}` : `/profile?id=${product.maker_id}`} className="text-xs font-semibold text-foreground hover:text-orange-500 transition-colors">{product.maker.full_name}</Link>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-medium text-white shadow-2xs">
                  <Crosshair className="w-3 h-3" />
                  Hunter
                </span>
                {product.worked_on_launch !== false && (
                  <span className="bg-[#2ecc71] text-white text-xs font-medium px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                    <Package className="w-3.5 h-3.5" />
                    <span>Maker</span>
                  </span>
                )}
              </div>
              <Link href={product.maker.username ? `/@${product.maker.username}` : `/profile?id=${product.maker_id}`} className="text-[10px] text-muted-foreground block hover:text-orange-500 transition-colors">@{product.maker.username}</Link>
              <p className="text-[10px] text-muted-foreground/90 mt-1.5 line-clamp-2">{product.maker.bio || (product.worked_on_launch === false ? "Hunter on IndiHunt" : "Launching awesome things!")}</p>
            </div>
          </div>
        )}

        {/* Other members */}
        {teamMembers.map((member) => (
          <div key={member.id} className="bg-card border border-border p-5 rounded-2xl flex items-start gap-4">
            <Link href={member.username ? `/@${member.username}` : `/profile?id=${member.id}`} className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center font-semibold text-sm text-orange-500 flex-shrink-0 hover:opacity-90 transition-opacity">
              {member.avatar_url ? (
                <Image src={member.avatar_url} alt="Avatar" className="w-10 h-10 object-cover" width={40} height={40} />
              ) : (
                member.full_name.charAt(0)
              )}
            </Link>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href={member.username ? `/@${member.username}` : `/profile?id=${member.id}`} className="text-xs font-semibold text-foreground hover:text-orange-500 transition-colors">{member.full_name}</Link>
                <span className="text-[8px] bg-amber-500/10 text-amber-500 font-semibold px-1.5 py-0.2 rounded uppercase">Co-Maker</span>
              </div>
              <Link href={member.username ? `/@${member.username}` : `/profile?id=${member.id}`} className="text-[10px] text-muted-foreground block hover:text-orange-500 transition-colors">@{member.username}</Link>
              <p className="text-[10px] text-muted-foreground/90 mt-1.5 line-clamp-2">{member.bio || "Maker on IndiHunt"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
