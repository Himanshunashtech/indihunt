import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase, getProductById, getProducts, getProductSlug, getReviews, Review } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

// Cached base64 of public/logo.webp for embedding directly in self-contained SVG badges
let cachedLogoBase64: string | null = null;
function getLogoBase64(): string {
  if (cachedLogoBase64 !== null) return cachedLogoBase64;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.webp");
    if (fs.existsSync(logoPath)) {
      const fileBuffer = fs.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/webp;base64,${fileBuffer.toString("base64")}`;
      return cachedLogoBase64;
    }
  } catch (err) {
    console.error("Error reading logo.webp for embed SVG:", err);
  }
  return "";
}

export async function GET(request: Request) {
  const logoBase64 = getLogoBase64();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const style = searchParams.get("style") || "classic";
  const rankParam = searchParams.get("rank");
  const upvotesParam = searchParams.get("upvotes");
  const ratingParam = searchParams.get("rating");
  const reviewsParam = searchParams.get("reviews");
  const period = searchParams.get("period") || "Day";

  let upvotesCount = 0;
  let reviewsCount = 0;
  let averageRating = 5.0;
  let productName = "Product";
  let productTagline = "Discover the best Indian tech products";
  let computedDayRank = 1;
  let computedWeekRank = 1;
  let computedMonthRank = 1;
  let productReviews: Review[] = [];

  if (id) {
    try {
      const allProducts = await getProducts();
      let product = null;

      if (allProducts && allProducts.length > 0) {
        product = allProducts.find(
          (p) =>
            p.id === id ||
            getProductSlug(p.name) === getProductSlug(id) ||
            p.name.toLowerCase().trim() === id.toLowerCase().trim()
        ) || null;
      }

      if (!product) {
        product = await getProductById(id);
      }

      if (product) {
        upvotesCount = product.upvotes_count || 0;
        productName = product.name || "Product";
        productTagline = product.tagline || "Discover the best Indian tech products";

        // Query live exact count from upvotes table if available
        try {
          if (supabase) {
            const { count } = await supabase
              .from('upvotes')
              .select('*', { count: 'exact', head: true })
              .eq('product_id', product.id);
            if (typeof count === 'number' && count > 0) {
              upvotesCount = count;
            }
          }
        } catch {
          // fallback to product.upvotes_count
        }

        // Query reviews and calculate average rating
        try {
          const revs = await getReviews(product.id);
          if (revs && revs.length > 0) {
            productReviews = revs;
            reviewsCount = revs.length;
            const sum = revs.reduce((acc, r) => acc + (r.rating || 5), 0);
            averageRating = Math.round((sum / revs.length) * 10) / 10;
          }
        } catch {
          // fallback to default rating
        }

        const prodLaunchDate = product.scheduled_for ? new Date(product.scheduled_for) : new Date(product.created_at);
        const productDateStr = prodLaunchDate.toDateString();

        if (allProducts && allProducts.length > 0) {
          // 1. Calculate Real Day Rank
          const sameDayProducts = allProducts.filter((p) => {
            const pLaunchDate = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
            return pLaunchDate.toDateString() === productDateStr;
          });
          sameDayProducts.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
          const dayRankIndex = sameDayProducts.findIndex((p) => p.id === product?.id);
          computedDayRank = dayRankIndex !== -1 ? dayRankIndex + 1 : 1;

          // 2. Calculate Real Week Rank (same 7-day window)
          const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
          const sameWeekProducts = allProducts.filter((p) => {
            const pLaunchDate = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
            return Math.abs(pLaunchDate.getTime() - prodLaunchDate.getTime()) <= oneWeekMs;
          });
          sameWeekProducts.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
          const weekRankIndex = sameWeekProducts.findIndex((p) => p.id === product?.id);
          computedWeekRank = weekRankIndex !== -1 ? weekRankIndex + 1 : 1;

          // 3. Calculate Real Month Rank (same month & year)
          const prodMonth = prodLaunchDate.getMonth();
          const prodYear = prodLaunchDate.getFullYear();
          const sameMonthProducts = allProducts.filter((p) => {
            const pLaunchDate = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
            return pLaunchDate.getMonth() === prodMonth && pLaunchDate.getFullYear() === prodYear;
          });
          sameMonthProducts.sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
          const monthRankIndex = sameMonthProducts.findIndex((p) => p.id === product?.id);
          computedMonthRank = monthRankIndex !== -1 ? monthRankIndex + 1 : 1;
        }
      }
    } catch (e) {
      console.error("Error fetching product for embed:", e);
    }
  }

  // Override with upvotes query param if provided
  if (upvotesParam) {
    const parsed = parseInt(upvotesParam);
    if (!isNaN(parsed) && parsed >= 0) {
      upvotesCount = parsed;
    }
  }

  // Override with review rating query params if provided
  if (ratingParam) {
    const parsed = parseFloat(ratingParam);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
      averageRating = parsed;
    }
  }
  if (reviewsParam) {
    const parsed = parseInt(reviewsParam);
    if (!isNaN(parsed) && parsed >= 0) {
      reviewsCount = parsed;
    }
  }
  const formattedRating = averageRating.toFixed(1);

  // Parse effective rank
  const effectiveDayRankNumber = rankParam ? parseInt(rankParam.replace(/\D/g, "")) || computedDayRank : computedDayRank;
  const effectiveDayRank = `#${effectiveDayRankNumber}`;
  const effectiveWeekRank = `#${computedWeekRank}`;
  const effectiveMonthRank = `#${computedMonthRank}`;

  // Helper to escape SVG text
  const escapeSvgText = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  // Rank icon color theme: Rank 1 -> Gold, Rank 2 -> Silver, Rank 3 -> Bronze, Rank 4+ -> Blue
  const getRankIconTheme = (rank: number) => {
    if (rank === 1) {
      return {
        ribbonLeft: "#e65100",
        ribbonRight: "#ea580c",
        medalFill: "#f59e0b",
        medalStroke: "#fbbf24",
        medalInner: "#f59e0b",
      };
    } else if (rank === 2) {
      return {
        ribbonLeft: "#475569",
        ribbonRight: "#64748b",
        medalFill: "#94a3b8",
        medalStroke: "#cbd5e1",
        medalInner: "#94a3b8",
      };
    } else if (rank === 3) {
      return {
        ribbonLeft: "#78350f",
        ribbonRight: "#92400e",
        medalFill: "#cd7f32",
        medalStroke: "#d97706",
        medalInner: "#b45309",
      };
    } else {
      return {
        ribbonLeft: "#1d4ed8",
        ribbonRight: "#2563eb",
        medalFill: "#3b82f6",
        medalStroke: "#60a5fa",
        medalInner: "#2563eb",
      };
    }
  };

  const dayIconTheme = getRankIconTheme(effectiveDayRankNumber);
  const weekIconTheme = getRankIconTheme(computedWeekRank);
  const monthIconTheme = getRankIconTheme(computedMonthRank);

  const escapedName = escapeSvgText(
    productName.length > 25 ? productName.substring(0, 22) + "..." : productName
  );
  const escapedTagline = escapeSvgText(
    productTagline.length > 45 ? productTagline.substring(0, 42) + "..." : productTagline
  );

  let svg = "";

  if (style === "classic" || style === "award" || style === "featured-day") {
    // #1 Product of the Day award badge (250x54) with rank-colored medal icon
    svg = `
<svg width="250" height="54" viewBox="0 0 250 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer Rounded Container with Coral Red Border -->
  <rect x="0.75" y="0.75" width="248.5" height="52.5" rx="16" fill="#ffffff" stroke="#ff5733" stroke-width="1.75"/>
  
  <!-- Left Side: Ribbon Medal (Rank-colored icon) -->
  <g transform="translate(16, 9)">
    <!-- Ribbon Tails at Bottom -->
    <path d="M6 24L1 34L7 31.5L11 34L9 24" fill="${dayIconTheme.ribbonLeft}"/>
    <path d="M26 24L24 34L28 31.5L34 34L29 24" fill="${dayIconTheme.ribbonRight}"/>
    <!-- Medal Outer Ring -->
    <circle cx="17.5" cy="17.5" r="14.5" fill="${dayIconTheme.medalFill}" stroke="${dayIconTheme.medalStroke}" stroke-width="1.5"/>
    <!-- Medal Inner Core -->
    <circle cx="17.5" cy="17.5" r="11" fill="${dayIconTheme.medalInner}"/>
    <!-- Medal Real Rank Number -->
    <text x="17.5" y="22" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${effectiveDayRankNumber > 9 ? 11.5 : 13.5}" font-weight="900" text-anchor="middle">${effectiveDayRankNumber}</text>
  </g>

  <!-- Right Side Text Stack -->
  <text x="56" y="21" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.1em">INDIHUNT</text>
  <text x="56" y="38" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" letter-spacing="-0.01em">${effectiveDayRank} Product of the ${period}</text>
</svg>
`.trim();
  } else if (style === "award-week") {
    // Product of the Week Award Badge with real week rank & rank-colored medal icon (260x54)
    svg = `
<svg width="260" height="54" viewBox="0 0 260 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="258.5" height="52.5" rx="16" fill="#ffffff" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(16, 9)">
    <path d="M6 24L1 34L7 31.5L11 34L9 24" fill="${weekIconTheme.ribbonLeft}"/>
    <path d="M26 24L24 34L28 31.5L34 34L29 24" fill="${weekIconTheme.ribbonRight}"/>
    <circle cx="17.5" cy="17.5" r="14.5" fill="${weekIconTheme.medalFill}" stroke="${weekIconTheme.medalStroke}" stroke-width="1.5"/>
    <circle cx="17.5" cy="17.5" r="11" fill="${weekIconTheme.medalInner}"/>
    <text x="17.5" y="22" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${computedWeekRank > 9 ? 11.5 : 13.5}" font-weight="900" text-anchor="middle">${computedWeekRank}</text>
  </g>
  <text x="56" y="21" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.1em">INDIHUNT</text>
  <text x="56" y="38" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" letter-spacing="-0.01em">${effectiveWeekRank} Product of the Week</text>
</svg>
`.trim();
  } else if (style === "award-month") {
    // Product of the Month Award Badge with real month rank & rank-colored medal icon (265x54)
    svg = `
<svg width="265" height="54" viewBox="0 0 265 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="263.5" height="52.5" rx="16" fill="#ffffff" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(16, 9)">
    <path d="M6 24L1 34L7 31.5L11 34L9 24" fill="${monthIconTheme.ribbonLeft}"/>
    <path d="M26 24L24 34L28 31.5L34 34L29 24" fill="${monthIconTheme.ribbonRight}"/>
    <circle cx="17.5" cy="17.5" r="14.5" fill="${monthIconTheme.medalFill}" stroke="${monthIconTheme.medalStroke}" stroke-width="1.5"/>
    <circle cx="17.5" cy="17.5" r="11" fill="${monthIconTheme.medalInner}"/>
    <text x="17.5" y="22" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${computedMonthRank > 9 ? 11.5 : 13.5}" font-weight="900" text-anchor="middle">${computedMonthRank}</text>
  </g>
  <text x="56" y="21" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.1em">INDIHUNT</text>
  <text x="56" y="38" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" letter-spacing="-0.01em">${effectiveMonthRank} Product of the Month</text>
</svg>
`.trim();
  } else if (style === "dark") {
    // Dark Theme Award Badge with real rank & rank-colored medal icon (250x54)
    svg = `
<svg width="250" height="54" viewBox="0 0 250 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="248.5" height="52.5" rx="16" fill="#0f172a" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(16, 9)">
    <path d="M6 24L1 34L7 31.5L11 34L9 24" fill="${dayIconTheme.ribbonLeft}"/>
    <path d="M26 24L24 34L28 31.5L34 34L29 24" fill="${dayIconTheme.ribbonRight}"/>
    <circle cx="17.5" cy="17.5" r="14.5" fill="${dayIconTheme.medalFill}" stroke="${dayIconTheme.medalStroke}" stroke-width="1.5"/>
    <circle cx="17.5" cy="17.5" r="11" fill="${dayIconTheme.medalInner}"/>
    <text x="17.5" y="22" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${effectiveDayRankNumber > 9 ? 11.5 : 13.5}" font-weight="900" text-anchor="middle">${effectiveDayRankNumber}</text>
  </g>
  <text x="56" y="21" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.1em">INDIHUNT</text>
  <text x="56" y="38" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" letter-spacing="-0.01em">${effectiveDayRank} Product of the ${period}</text>
</svg>
`.trim();
  } else if (style === "upvotes") {
    // Upvotes counter badge with real live upvotes & official logo.webp
    svg = `
<svg width="220" height="54" viewBox="0 0 220 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="218.5" height="52.5" rx="16" fill="#ffffff" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(16, 15)">
    <defs>
      <clipPath id="logoClipUpvotes">
        <circle cx="12" cy="12" r="12"/>
      </clipPath>
    </defs>
    <image href="${logoBase64}" x="0" y="0" width="24" height="24" clip-path="url(#logoClipUpvotes)"/>
  </g>
  <text x="46" y="21" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" letter-spacing="0.08em">FEATURED ON</text>
  <text x="46" y="38" fill="#0f172a" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="900">IndiHunt</text>
  <line x1="148" y1="12" x2="148" y2="42" stroke="#fed7aa" stroke-width="1.5"/>
  <g transform="translate(156, 8)">
    <path d="M25 14L17 5L9 14" stroke="#ff5733" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="17" y="30" fill="#0f172a" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="900" text-anchor="middle">${upvotesCount}</text>
    <text x="17" y="39" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="800" text-anchor="middle" letter-spacing="0.05em">UPVOTES</text>
  </g>
</svg>
`.trim();
  } else if (style === "banner-dark") {
    // Wide Banner Dark (450x80) with real rank & upvotes & rank-colored medal icon
    svg = `
<svg width="450" height="80" viewBox="0 0 450 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="450" height="80" rx="16" fill="#0f172a" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(18, 16)">
    <path d="M6 28L1 38L7 35.5L11 38L9 28" fill="${dayIconTheme.ribbonLeft}"/>
    <path d="M26 28L24 38L28 35.5L34 38L29 28" fill="${dayIconTheme.ribbonRight}"/>
    <circle cx="17.5" cy="17.5" r="16" fill="${dayIconTheme.medalFill}" stroke="${dayIconTheme.medalStroke}" stroke-width="1.5"/>
    <circle cx="17.5" cy="17.5" r="12" fill="${dayIconTheme.medalInner}"/>
    <text x="17.5" y="22.5" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${effectiveDayRankNumber > 9 ? 12 : 14}" font-weight="900" text-anchor="middle">${effectiveDayRankNumber}</text>
  </g>
  <text x="76" y="32" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800">${escapedName}</text>
  <text x="76" y="51" fill="#94a3b8" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500">${escapedTagline}</text>
  <text x="76" y="66" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" letter-spacing="0.05em">FEATURED ON INDIHUNT</text>
  <line x1="365" y1="18" x2="365" y2="62" stroke="#334155" stroke-width="1.5"/>
  <g transform="translate(375, 18)">
    <path d="M30 14L20 4L10 14" stroke="#ff5733" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="20" y="34" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" text-anchor="middle">${upvotesCount}</text>
    <text x="20" y="44" fill="#64748b" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="0.05em">UPVOTES</text>
  </g>
</svg>
`.trim();
  } else if (style === "review-rating" || style === "reviews-stars") {
    // Review Rating Card Badge (250x110) with 5 stars & official logo.webp
    svg = `
<svg width="250" height="110" viewBox="0 0 250 110" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="248.5" height="108.5" rx="16" fill="#ffffff" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(68, 14)">
    <defs>
      <clipPath id="logoClipReviewRating">
        <circle cx="10" cy="10" r="10"/>
      </clipPath>
    </defs>
    <image href="${logoBase64}" x="0" y="0" width="20" height="20" clip-path="url(#logoClipReviewRating)"/>
    <text x="26" y="14.5" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" letter-spacing="0.08em">INDIHUNT</text>
  </g>
  <g transform="translate(37, 38)">
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(0, 0) scale(1.1)"/>
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(38, 0) scale(1.1)"/>
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(76, 0) scale(1.1)"/>
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(114, 0) scale(1.1)"/>
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(152, 0) scale(1.1)"/>
  </g>
  <text x="125" y="91" fill="#334155" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" text-anchor="middle">(${formattedRating}) based on ${reviewsCount} review${reviewsCount === 1 ? '' : 's'}</text>
</svg>
`.trim();
  } else if (style === "review-rating-dark") {
    // Review Rating Card Badge Dark (250x110) with official logo.webp
    svg = `
<svg width="250" height="110" viewBox="0 0 250 110" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="248.5" height="108.5" rx="16" fill="#0f172a" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(68, 14)">
    <defs>
      <clipPath id="logoClipReviewRatingDark">
        <circle cx="10" cy="10" r="10"/>
      </clipPath>
    </defs>
    <image href="${logoBase64}" x="0" y="0" width="20" height="20" clip-path="url(#logoClipReviewRatingDark)"/>
    <text x="26" y="14.5" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" letter-spacing="0.08em">INDIHUNT</text>
  </g>
  <g transform="translate(37, 38)">
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(0, 0) scale(1.1)"/>
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(38, 0) scale(1.1)"/>
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(76, 0) scale(1.1)"/>
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(114, 0) scale(1.1)"/>
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="#ff5733" transform="translate(152, 0) scale(1.1)"/>
  </g>
  <text x="125" y="91" fill="#94a3b8" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" text-anchor="middle">(${formattedRating}) based on ${reviewsCount} review${reviewsCount === 1 ? '' : 's'}</text>
</svg>
`.trim();
  } else if (style === "review-cta" || style === "review" || style === "review-leave") {
    // Leave a Review on IndiHunt Badge (250x54) with official logo.webp
    svg = `
<svg width="250" height="54" viewBox="0 0 250 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="248.5" height="52.5" rx="16" fill="#ffffff" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(14, 11)">
    <defs>
      <clipPath id="logoClipReviewCta">
        <circle cx="16" cy="16" r="16"/>
      </clipPath>
    </defs>
    <image href="${logoBase64}" x="0" y="0" width="32" height="32" clip-path="url(#logoClipReviewCta)"/>
  </g>
  <text x="56" y="22" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" letter-spacing="0.08em">LEAVE A REVIEW ON</text>
  <text x="56" y="39" fill="#0f172a" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="900">IndiHunt</text>
  <g transform="translate(208, 14)">
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" stroke="#ff5733" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="scale(1.1)"/>
  </g>
</svg>
`.trim();
  } else if (style === "review-cta-dark") {
    // Leave a Review on IndiHunt Badge Dark (250x54) with official logo.webp
    svg = `
<svg width="250" height="54" viewBox="0 0 250 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="248.5" height="52.5" rx="16" fill="#0f172a" stroke="#ff5733" stroke-width="1.75"/>
  <g transform="translate(14, 11)">
    <defs>
      <clipPath id="logoClipReviewCtaDark">
        <circle cx="16" cy="16" r="16"/>
      </clipPath>
    </defs>
    <image href="${logoBase64}" x="0" y="0" width="32" height="32" clip-path="url(#logoClipReviewCtaDark)"/>
  </g>
  <text x="56" y="22" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" letter-spacing="0.08em">LEAVE A REVIEW ON</text>
  <text x="56" y="39" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="900">IndiHunt</text>
  <g transform="translate(208, 14)">
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" stroke="#ff5733" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="scale(1.1)"/>
  </g>
</svg>
`.trim();
  } else if (style === "review-card" || style === "testimonial") {
    // Individual Review Testimonial Card (500x200) with reviewer avatar, stars, quote & IndiHunt logo
    const reviewIdParam = searchParams.get("reviewId") || searchParams.get("review");
    let selectedReview = null;
    if (productReviews && productReviews.length > 0) {
      if (reviewIdParam) {
        selectedReview = productReviews.find((r) => r.id === reviewIdParam) || null;
      }
      if (!selectedReview) {
        selectedReview = productReviews[0];
      }
    }

    const reviewerName = searchParams.get("name") || selectedReview?.user?.full_name || selectedReview?.user?.username || "Verified Reviewer";
    const reviewerAvatar = searchParams.get("avatar") || selectedReview?.user?.avatar_url || "";
    const singleReviewRating = parseInt(searchParams.get("stars") || "") || selectedReview?.rating || 5;
    const reviewBodyText = searchParams.get("text") || selectedReview?.body || "Great product built by passionate makers!";

    const wrapSvgText = (text: string, maxCharsPerLine: number = 62, maxLines: number = 3): string[] => {
      const words = text.replace(/\s+/g, ' ').trim().split(' ');
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
          if (lines.length >= maxLines - 1) break;
        }
      }
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
      if (lines.length === maxLines && words.length > 0) {
        lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,!? ]*$/, '') + '...';
      }
      return lines;
    };

    const reviewLines = wrapSvgText(reviewBodyText, 62, 3);
    const starCount = Math.max(1, Math.min(5, singleReviewRating));
    const starPaths = Array.from({ length: 5 }).map((_, i) => {
      const fill = i < starCount ? "#ff5733" : "#e2e8f0";
      return `<path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="${fill}" transform="translate(${i * 18}, 0) scale(0.75)"/>`;
    }).join("");

    svg = `
<svg width="500" height="200" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="498.5" height="198.5" rx="16" fill="#ffffff" stroke="#ff5733" stroke-width="1.75"/>
  
  <!-- Reviewer Avatar & Name Header -->
  <g transform="translate(24, 20)">
    <defs>
      <clipPath id="reviewerAvatarClip">
        <circle cx="20" cy="20" r="20"/>
      </clipPath>
    </defs>
    ${
      reviewerAvatar
        ? `<image href="${escapeSvgText(reviewerAvatar)}" x="0" y="0" width="40" height="40" clip-path="url(#reviewerAvatarClip)"/>`
        : `<circle cx="20" cy="20" r="20" fill="#fed7aa"/>
           <text x="20" y="25.5" fill="#ea580c" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" text-anchor="middle">${escapeSvgText(reviewerName.charAt(0).toUpperCase())}</text>`
    }
    <text x="52" y="16" fill="#0f172a" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800">${escapeSvgText(reviewerName)}</text>
    <g transform="translate(52, 22)">
      ${starPaths}
    </g>
  </g>

  <!-- IndiHunt Badge Top Right -->
  <g transform="translate(390, 24)">
    <defs>
      <clipPath id="ihLogoRevCard">
        <circle cx="8" cy="8" r="8"/>
      </clipPath>
    </defs>
    <image href="${logoBase64}" x="0" y="0" width="16" height="16" clip-path="url(#ihLogoRevCard)"/>
    <text x="22" y="12.5" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.06em">INDIHUNT</text>
  </g>

  <!-- Review Quote Body Text -->
  <text x="24" y="90" fill="#334155" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-style="italic" font-weight="500">
    ${reviewLines.map((line, idx) => `<tspan x="24" dy="${idx === 0 ? 0 : 20}">“${escapeSvgText(line)}${idx === reviewLines.length - 1 ? '”' : ''}</tspan>`).join("")}
  </text>

  <!-- Footer Link -->
  <line x1="24" y1="164" x2="476" y2="164" stroke="#f1f5f9" stroke-width="1"/>
  <text x="24" y="182" fill="#94a3b8" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600">Verified review on IndiHunt for ${escapedName}</text>
</svg>
`.trim();
  } else if (style === "review-card-dark" || style === "testimonial-dark") {
    // Individual Review Testimonial Card Dark (500x200)
    const reviewIdParam = searchParams.get("reviewId") || searchParams.get("review");
    let selectedReview = null;
    if (productReviews && productReviews.length > 0) {
      if (reviewIdParam) {
        selectedReview = productReviews.find((r) => r.id === reviewIdParam) || null;
      }
      if (!selectedReview) {
        selectedReview = productReviews[0];
      }
    }

    const reviewerName = searchParams.get("name") || selectedReview?.user?.full_name || selectedReview?.user?.username || "Verified Reviewer";
    const reviewerAvatar = searchParams.get("avatar") || selectedReview?.user?.avatar_url || "";
    const singleReviewRating = parseInt(searchParams.get("stars") || "") || selectedReview?.rating || 5;
    const reviewBodyText = searchParams.get("text") || selectedReview?.body || "Great product built by passionate makers!";

    const wrapSvgText = (text: string, maxCharsPerLine: number = 62, maxLines: number = 3): string[] => {
      const words = text.replace(/\s+/g, ' ').trim().split(' ');
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
          if (lines.length >= maxLines - 1) break;
        }
      }
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
      if (lines.length === maxLines && words.length > 0) {
        lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,!? ]*$/, '') + '...';
      }
      return lines;
    };

    const reviewLines = wrapSvgText(reviewBodyText, 62, 3);
    const starCount = Math.max(1, Math.min(5, singleReviewRating));
    const starPaths = Array.from({ length: 5 }).map((_, i) => {
      const fill = i < starCount ? "#ff5733" : "#334155";
      return `<path d="M12 2l2.9 6.6 7.1.6-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.7 7.1-.6z" fill="${fill}" transform="translate(${i * 18}, 0) scale(0.75)"/>`;
    }).join("");

    svg = `
<svg width="500" height="200" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="498.5" height="198.5" rx="16" fill="#0f172a" stroke="#ff5733" stroke-width="1.75"/>
  
  <!-- Reviewer Avatar & Name Header -->
  <g transform="translate(24, 20)">
    <defs>
      <clipPath id="reviewerAvatarClipDark">
        <circle cx="20" cy="20" r="20"/>
      </clipPath>
    </defs>
    ${
      reviewerAvatar
        ? `<image href="${escapeSvgText(reviewerAvatar)}" x="0" y="0" width="40" height="40" clip-path="url(#reviewerAvatarClipDark)"/>`
        : `<circle cx="20" cy="20" r="20" fill="#334155"/>
           <text x="20" y="25.5" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" text-anchor="middle">${escapeSvgText(reviewerName.charAt(0).toUpperCase())}</text>`
    }
    <text x="52" y="16" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800">${escapeSvgText(reviewerName)}</text>
    <g transform="translate(52, 22)">
      ${starPaths}
    </g>
  </g>

  <!-- IndiHunt Badge Top Right -->
  <g transform="translate(390, 24)">
    <defs>
      <clipPath id="ihLogoRevCardDark">
        <circle cx="8" cy="8" r="8"/>
      </clipPath>
    </defs>
    <image href="${logoBase64}" x="0" y="0" width="16" height="16" clip-path="url(#ihLogoRevCardDark)"/>
    <text x="22" y="12.5" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="0.06em">INDIHUNT</text>
  </g>

  <!-- Review Quote Body Text -->
  <text x="24" y="90" fill="#cbd5e1" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-style="italic" font-weight="500">
    ${reviewLines.map((line, idx) => `<tspan x="24" dy="${idx === 0 ? 0 : 20}">“${escapeSvgText(line)}${idx === reviewLines.length - 1 ? '”' : ''}</tspan>`).join("")}
  </text>

  <!-- Footer Link -->
  <line x1="24" y1="164" x2="476" y2="164" stroke="#1e293b" stroke-width="1"/>
  <text x="24" y="182" fill="#64748b" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600">Verified review on IndiHunt for ${escapedName}</text>
</svg>
`.trim();
  } else {
    // Mini Pill (160x42) with real rank & rank-colored circle icon
    svg = `
<svg width="160" height="42" viewBox="0 0 160 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.75" y="0.75" width="158.5" height="40.5" rx="21" fill="#ffffff" stroke="#ff5733" stroke-width="1.75"/>
  <circle cx="18" cy="21" r="9" fill="${dayIconTheme.medalFill}"/>
  <text x="18" y="24.5" fill="#ffffff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${effectiveDayRankNumber > 9 ? 8.5 : 10}" font-weight="900" text-anchor="middle">${effectiveDayRankNumber}</text>
  <text x="34" y="18" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="800" letter-spacing="0.05em">INDIHUNT</text>
  <text x="34" y="30" fill="#ff5733" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800">${effectiveDayRank} Product of Day</text>
</svg>
`.trim();
  }

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    },
  });
}
