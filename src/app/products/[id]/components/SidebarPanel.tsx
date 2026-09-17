import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Bookmark,
  Share,
  BarChart2,
  ExternalLink,
  Sparkles,
  Orbit,
  Calendar,
  Code,
  Award
} from "lucide-react";
import { Github, Facebook, Linkedin, Twitter } from "@/components/icons";
import { Product, Profile, toggleFollowProduct, getProductFollowers, getProductSlug } from "@/lib/supabase";
import { useAppDispatch } from "@/lib/store";
import { setAuthModalOpen } from "@/lib/store";
import { HexagonAwardBadge } from "@/components/AwardBadge";

export interface SidebarAwardItem {
  type: string;
  title: string;
  subtitle: string;
  date: string;
  rank: string;
  iconType: string;
  tagline?: string;
}

interface SidebarPanelProps {
  product: Product;
  dailyRank: number | null;
  rankLabel?: string;
  isScheduled: boolean;
  handleVote: (e?: React.MouseEvent) => void;
  user: any;
  isFollowed: boolean;
  setIsFollowed: (val: boolean) => void;
  productFollowers: Profile[];
  setProductFollowers: (followers: Profile[]) => void;
  setShowShareModal: (val: boolean) => void;
  setShowEmbedModal: (val: boolean) => void;
  setActiveSubTab: (val: string) => void;
  productAwards: SidebarAwardItem[];
  similarProducts: Product[];
  userCollections?: any[];
  onAddToCollection?: (colId: string) => void;
  onCreateCollectionAndAdd?: (name: string, desc: string) => void;
  prevProd?: Product | null;
  nextProd?: Product | null;
}

function getRefUrl(url: string): string {
  if (!url) return "";
  try {
    let checkUrl = url.trim();
    if (!/^https?:\/\//i.test(checkUrl)) {
      checkUrl = "https://" + checkUrl;
    }
    const parsed = new URL(checkUrl);
    parsed.searchParams.set("ref", "indihunt");
    return parsed.toString();
  } catch (e) {
    const hasQuery = url.includes("?");
    return `${url}${hasQuery ? "&" : "?"}ref=indihunt`;
  }
}

export default function SidebarPanel({
  product,
  dailyRank,
  rankLabel = "Day Rank",
  isScheduled,
  handleVote,
  user,
  isFollowed,
  setIsFollowed,
  productFollowers,
  setProductFollowers,
  setShowShareModal,
  setShowEmbedModal,
  setActiveSubTab,
  productAwards,
  similarProducts,
  userCollections = [],
  onAddToCollection,
  onCreateCollectionAndAdd,
  prevProd,
  nextProd
}: SidebarPanelProps) {
  const dispatch = useAppDispatch();
  const [showCollectionModal, setShowCollectionModal] = React.useState(false);
  const [newColName, setNewColName] = React.useState("");
  const [newColDesc, setNewColDesc] = React.useState("");

  const isInCollection = userCollections.some((col: any) =>
    col.products && col.products.some((p: any) => p.id === product.id)
  );

  return (
    <div className="lg:col-span-3 space-y-6">
      {/* Launch rank & Upvote section (Desktop only, mobile uses fixed bottom bar) */}
      <div className="hidden sm:block pb-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            {dailyRank !== null ? (
              <span className="text-2xl font-bold text-foreground block">#{dailyRank}</span>
            ) : (
              <div className="h-8 w-12 bg-muted/60 animate-pulse rounded-md my-0.5" />
            )}
            <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">{rankLabel}</span>
          </div>

          {/* Ranking toggle */}
          <div className="flex gap-1.5 border border-border rounded-lg p-0.5">
            <button
              onClick={() => prevProd && (window.location.href = `/products/${getProductSlug(prevProd.name)}`)}
              disabled={!prevProd}
              className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={prevProd ? `Previous: ${prevProd.name}` : "No previous product"}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nextProd && (window.location.href = `/products/${getProductSlug(nextProd.name)}`)}
              disabled={!nextProd}
              className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={nextProd ? `Next: ${nextProd.name}` : "No next product"}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Upvote button */}
        <button
          type="button"
          onClick={isScheduled ? undefined : handleVote}
          disabled={isScheduled}
          className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-full font-bold text-sm transition-all cursor-pointer ${isScheduled
            ? "bg-muted border border-border text-muted-foreground/60 cursor-not-allowed"
            : product.has_upvoted
              ? "bg-white dark:bg-card border-2 border-[#ff5733] text-[#ff5733] shadow-sm hover:bg-orange-500/5"
              : "bg-[#ff5733] text-white hover:bg-[#e64a19] shadow-md shadow-orange-500/20"
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 16 16"
            className={`w-4 h-4 stroke-[1.5px] transition-all duration-300 ${product.has_upvoted
              ? "fill-[#ff5733] stroke-[#ff5733]"
              : "fill-white dark:fill-transparent stroke-current"
              }`}
          >
            <path d="M6.579 3.467c.71-1.067 2.132-1.067 2.842 0L12.975 8.8c.878 1.318.043 3.2-1.422 3.2H4.447c-1.464 0-2.3-1.882-1.422-3.2z" />
          </svg>
          <span>{isScheduled ? "Upvoting Disabled" : `${product.has_upvoted ? "Upvoted" : "Upvote"} • ${product.upvotes_count} points`}</span>
        </button>
      </div>

      {/* Scoring & Featuring Panel */}
      <Link href="/guide/scoring" className="group block  pb-6 space-y-3 cursor-pointer">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block group-hover:text-orange-500 transition-colors">Scoring & Featuring</span>
          <span className="text-xs font-medium text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">Learn more →</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 p-3 rounded-xl border border-border/60 text-center">
            <span className="text-2xl font-extrabold text-blue-500 block">{product.quality_score ?? 0}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quality Score</span>
          </div>
          <div className="bg-muted/30 p-3 rounded-xl border border-border/60 text-center">
            <span className="text-2xl font-extrabold text-pink-500 block">{product.engagement_score ?? 0}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Engagement</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
          <span className="font-semibold text-muted-foreground">Featured Status:</span>
          <span className={`font-semibold uppercase text-xs px-2.5 py-1 rounded-full ${product.featured
            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/15'
            : 'bg-muted text-muted-foreground border border-border'
            }`}>
            {product.featured ? '⭐ Featured' : 'Not Featured'}
          </span>
        </div>
      </Link>

      {/* Sidebar Actions & Info matching Product Hunt */}
      <div className="space-y-6">

        {/* Quick Actions List */}
        <div className=" pb-6 space-y-3">
          <button
            onClick={async () => {
              if (!user) {
                dispatch(setAuthModalOpen(true));
                return;
              }
              const success = await toggleFollowProduct(product.id, user.id, isFollowed);
              if (success) {
                setIsFollowed(!isFollowed);
                const followers = await getProductFollowers(product.id);
                setProductFollowers(followers);
              }
            }}
            className="w-full flex items-center gap-3 text-sm font-medium text-foreground/90 hover:text-orange-500 transition-colors text-left focus:outline-none cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md border border-border flex items-center justify-center bg-muted/35">
              <Plus className="w-4 h-4" />
            </div>
            <span>{isFollowed ? `Following ${product.name}` : `Follow ${product.name}: ${product.tagline}`}</span>
          </button>

          <button
            onClick={() => {
              if (!user) { dispatch(setAuthModalOpen(true)); return; }
              setShowCollectionModal(true);
            }}
            className={`w-full flex items-center gap-3 text-sm font-medium transition-colors text-left focus:outline-none cursor-pointer ${
              isInCollection ? "text-[#ff5733] font-semibold" : "text-foreground/90 hover:text-orange-500"
            }`}
          >
            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
              isInCollection ? "border-[#ff5733] bg-orange-500/10 text-[#ff5733]" : "border-border bg-muted/35"
            }`}>
              <Bookmark className={`w-4 h-4 ${isInCollection ? "fill-[#ff5733] text-[#ff5733]" : ""}`} />
            </div>
            <span>{isInCollection ? "In your collection" : "Add to collection"}</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="w-full flex items-center gap-3 text-sm font-medium text-foreground/90 hover:text-orange-500 transition-colors text-left focus:outline-none cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md border border-border flex items-center justify-center bg-muted/35">
              <Share className="w-4 h-4" />
            </div>
            <span>Share</span>
          </button>

          <button
            onClick={() => setActiveSubTab("Analytics")}
            className="w-full flex items-center gap-3 text-sm font-medium text-foreground/90 hover:text-orange-500 transition-colors text-left focus:outline-none cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md border border-border flex items-center justify-center bg-muted/35">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setShowEmbedModal(true)}
            className="w-full flex items-center gap-3 text-sm font-medium text-foreground/90 hover:text-orange-500 transition-colors text-left focus:outline-none cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md border border-border flex items-center justify-center bg-muted/35">
              <Code className="w-4 h-4" />
            </div>
            <span>Embed Badge</span>
          </button>
        </div>

        {/* Product Followers Widget */}
        <div className=" pb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Followers</span>
            <span className="text-xs font-bold text-foreground">{productFollowers.length}</span>
          </div>
          {productFollowers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {productFollowers.map((follower) => (
                <div key={follower.id} className="relative group cursor-pointer" title={follower.full_name}>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center font-semibold text-xs text-orange-500">
                    {follower.avatar_url ? (
                      <img src={follower.avatar_url} alt={follower.full_name} className="w-full h-full object-cover" />
                    ) : (
                      follower.full_name.charAt(0)
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-medium">No followers yet. Be the first to follow!</p>
          )}
        </div>

        {/* Company Info section */}
        <div className=" pb-6 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Company Info</span>

          <div className="space-y-3">
            <a
              href={getRefUrl(product.website_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground/80" />
              <span className="font-medium">{product.website_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>

            {product.github_url && (
              <a
                href={product.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-4 h-4 text-muted-foreground/80" />
                <span className="font-medium">GitHub</span>
              </a>
            )}
          </div>
        </div>

        {/* Product Info section */}
        <div className=" pb-6 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">{product.name} Info</span>

          <div className="space-y-3 text-sm font-normal text-foreground/90">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Listed on IndiHunt: {new Date(product.created_at).getFullYear() || 2026}</span>
            </div>

            <button
              onClick={() => alert("Showing past launches")}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-orange-500 hover:text-orange-650 transition-colors focus:outline-none cursor-pointer"
            >
              <span>View some launches</span>
            </button>
          </div>
        </div>

        {/* Forum Section */}
        <div className=" pb-6 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Forum</span>

          <button
            onClick={() => setActiveSubTab("Forum")}
            className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-semibold text-xs text-orange-500">
              p/
            </div>
            <span>p/{product.name.toLowerCase().replace(/\s+/g, '')}</span>
          </button>
        </div>

        {/* Awards Section */}
        <div className=" pb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Awards</span>
            <Link href="/awards" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
              View All →
            </Link>
          </div>

          {productAwards.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {productAwards.slice(0, 6).map((award, i) => (
                <Link key={i} href="/awards">
                  <HexagonAwardBadge rank={award.rank} type={award.type} size="sm" title={`${award.type}: ${award.title}`} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">No awards yet. Support this product with upvotes to unlock milestones!</p>
              <Link href="/awards" className="text-xs font-semibold text-orange-500 hover:underline block pt-0.5">
                Explore all IndiHunt awards →
              </Link>
            </div>
          )}
        </div>

        {/* Social Links Section */}
        {(product.facebook_url || product.linkedin_url || product.twitter_url) && (
          <div className=" pb-6 space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Social</span>

            <div className="space-y-3.5">
              {product.facebook_url && (
                <a
                  href={product.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-[#1877F2] transition-colors font-medium"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
              )}

              {product.linkedin_url && (
                <a
                  href={product.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-[#0A66C2] transition-colors font-medium"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}

              {product.twitter_url && (
                <a
                  href={product.twitter_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <Twitter className="w-4 h-4" />
                  <span>X</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Similar Products section */}
        <div className=" pb-6 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Similar Products</span>

          <div className="space-y-4">
            {similarProducts.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No similar products found.</span>
            ) : (
              similarProducts.map((item, idx) => (
                <div key={idx} className="flex gap-3.5 items-start  pb-3.5 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center font-semibold text-sm text-orange-500 border border-orange-500/15 flex-shrink-0 overflow-hidden">
                    {item.logo_url ? (
                      <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      item.name.charAt(0)
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Link href={`/products/${getProductSlug(item.name)}`} className="text-base font-semibold text-foreground block hover:text-orange-500 transition-colors cursor-pointer truncate">
                      {item.name}
                    </Link>
                    <p className="text-base text-muted-foreground line-clamp-2 font-normal leading-snug">{item.tagline}</p>
                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground font-normal flex-wrap">
                      <span className="text-[#ff5733] font-semibold">▲ {item.upvotes_count || 0}</span>
                      <span>•</span>
                      <span>({item.comments_count || 0} reviews)</span>
                      <span>•</span>
                      <span className="text-emerald-500 font-semibold uppercase text-[11px]">
                        {item.pricing_type || "free"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add to Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Save to Collection</h4>
                <p className="text-[10px] text-muted-foreground">Select a collection to add {product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCollectionModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Existing Collections List */}
            {userCollections.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Your Collections</span>
                {userCollections.map((col: any) => {
                  const alreadyInCol = col.products && col.products.some((p: any) => p.id === product.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        if (!alreadyInCol && onAddToCollection) {
                          onAddToCollection(col.id);
                        }
                        setShowCollectionModal(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        alreadyInCol
                          ? "bg-orange-500/10 border-orange-500/30 text-orange-500 font-semibold"
                          : "bg-muted/30 border-border/80 hover:border-orange-500/30 text-foreground"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-semibold block truncate">{col.name}</span>
                        {col.description && <span className="text-[10px] text-muted-foreground block truncate">{col.description}</span>}
                      </div>
                      <span className="text-xs shrink-0">
                        {alreadyInCol ? "✓ Saved" : "+ Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Create New Collection Inline Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newColName.trim()) return;
                if (onCreateCollectionAndAdd) {
                  onCreateCollectionAndAdd(newColName.trim(), newColDesc.trim());
                }
                setNewColName("");
                setNewColDesc("");
                setShowCollectionModal(false);
              }}
              className="space-y-3 pt-2 border-t border-border/60"
            >
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Create New Collection</span>
              <input
                type="text"
                placeholder="Collection Name (e.g. Favorite Tools)"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-orange-500"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newColDesc}
                onChange={(e) => setNewColDesc(e.target.value)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-orange-500"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCollectionModal(false)}
                  className="flex-1 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#ff5733] hover:bg-[#ff5733]/90 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Create & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
