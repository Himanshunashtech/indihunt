import React, { useState } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { AlternativeProduct, Product, addAlternative, getAlternatives, toggleAlternativeVote, getProductSlug } from "@/lib/supabase";
import { useAppDispatch } from "@/lib/store";
import { setAuthModalOpen } from "@/lib/store";

interface AlternativesTabProps {
  alternatives: AlternativeProduct[];
  setAlternatives: (alts: AlternativeProduct[]) => void;
  allProductsList: Product[];
  productId: string;
  user: any;
}

export default function AlternativesTab({
  alternatives,
  setAlternatives,
  allProductsList,
  productId,
  user
}: AlternativesTabProps) {
  const dispatch = useAppDispatch();
  const [selectedAltId, setSelectedAltId] = useState("");
  const [isSubmittingAlt, setIsSubmittingAlt] = useState(false);

  const handleAddAlternative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !productId || !selectedAltId) return;

    setIsSubmittingAlt(true);
    const added = await addAlternative(productId, selectedAltId, user.id);
    if (added) {
      setSelectedAltId("");
      const alts = await getAlternatives(productId, user.id);
      setAlternatives(alts);
      alert("Alternative suggested successfully!");
    } else {
      alert("This alternative has already been added or there was an error.");
    }
    setIsSubmittingAlt(false);
  };

  const handleVoteAlternative = async (altId: string) => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    const result = await toggleAlternativeVote(altId, productId, user.id);
    if (result.success) {
      const alts = await getAlternatives(productId, user.id);
      setAlternatives(alts);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alternatives List */}
      <div className="space-y-4">
        {alternatives.length === 0 ? (
          <div className="bg-card border border-border p-8 rounded-3xl text-center">
            <p className="text-xs text-muted-foreground italic">No alternatives suggested yet.</p>
          </div>
        ) : (
          alternatives.map((alt) => {
            const p = alt.alternative_product;
            if (!p) return null;
            return (
              <div key={alt.id} className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between gap-4 hover:border-orange-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0 flex items-center justify-center font-semibold text-orange-500">
                    {p.logo_url ? (
                      <img src={p.logo_url} alt={p.name} className="w-12 h-12 object-cover" />
                    ) : (
                      p.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <Link href={`/products/${getProductSlug(p.name)}`} className="text-xs font-semibold text-foreground hover:text-orange-500 transition-colors">
                      {p.name}
                    </Link>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{p.tagline}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase">★ {p.upvotes_count} upvotes</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleVoteAlternative(alt.id)}
                  className={`flex flex-col items-center justify-center border px-4 py-2 rounded-xl transition-all cursor-pointer ${alt.has_voted
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
                    : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold mt-1">{alt.votes_count}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
