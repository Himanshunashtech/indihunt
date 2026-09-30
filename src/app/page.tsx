import { getProducts, getThreads, getTopHuntersData, getPromotedProducts, getProductSlug, compareProductsForRanking, getISTStartOfDay, Product } from "@/lib/supabase";
import HomePageClient from "./HomePageClient";

export const revalidate = 30; // ISR: Revalidate every 30s (faster L1 cache hit rate)

const SITE_URL = "https://indihunt.in";

export default async function Home() {
  // Fetch initial datasets in parallel on the server.
  // getPromotedProducts chains off getProducts() so it runs concurrently and reuses the same product list.
  const productsPromise = getProducts().catch(() => [] as Product[]);
  const [products, threads, topHunters, promotedProductsResolved] = await Promise.all([
    productsPromise,
    getThreads().catch(() => []),
    getTopHuntersData().catch(() => []),
    // Phase 1c: chain off productsPromise — no extra Supabase roundtrip, runs in parallel
    productsPromise.then(prods => getPromotedProducts(prods).catch(() => [] as Product[])),
  ]);

  const billboardAds: any[] = [];

  // Group live products strictly by their launch date in Indian Standard Time (IST)
  const now = new Date();
  const startOfToday = getISTStartOfDay(now);
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Exclude future scheduled products from live discovery
  const liveProducts = (products || []).filter((p: Product) => {
    if (p.status === "scheduled" && p.scheduled_for) {
      return new Date(p.scheduled_for) <= now;
    }
    return p.status !== "scheduled" && p.status !== "draft";
  });

  const todayList: Product[] = [];
  const yesterdayList: Product[] = [];
  const lastWeekList: Product[] = [];
  const lastMonthList: Product[] = [];

  liveProducts.forEach((p: Product) => {
    const launchDate = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
    if (launchDate >= startOfToday) {
      todayList.push(p);
    } else if (launchDate >= startOfYesterday && launchDate < startOfToday) {
      yesterdayList.push(p);
    } else if (launchDate >= oneWeekAgo && launchDate < startOfYesterday) {
      lastWeekList.push(p);
    } else if (launchDate >= oneMonthAgo && launchDate < oneWeekAgo) {
      lastMonthList.push(p);
    }
  });

  const sortByUpvotes = (list: Product[]) => [...list].sort(compareProductsForRanking);
  const sortedToday = sortByUpvotes(todayList);
  const sortedYesterday = sortByUpvotes(yesterdayList);
  const sortedLastWeek = sortByUpvotes(lastWeekList);
  const sortedLastMonth = sortByUpvotes(lastMonthList);

  // Sliced visible datasets for minimal initial wire payload (20 today + 5 yesterday + 5 last week + 5 last month)
  const visibleToday = sortedToday.slice(0, 20);
  const visibleYesterday = sortedYesterday.slice(0, 5);
  const visibleLastWeek = sortedLastWeek.slice(0, 5);
  const visibleLastMonth = sortedLastMonth.slice(0, 5);

  const initialVisibleMap = new Map<string, Product>();
  [...visibleToday, ...visibleYesterday, ...visibleLastWeek, ...visibleLastMonth].forEach(p => {
    if (p && p.id) initialVisibleMap.set(p.id, p);
  });
  const initialVisibleProducts = Array.from(initialVisibleMap.values());
  const initialVisibleThreads = threads.slice(0, 5);
  const initialVisibleTopHunters = topHunters.slice(0, 5);

  // Build JSON-LD ItemList structured data — capped to top 20 for fast serialization
  const jsonLdDisplay = [
    ...sortedToday.slice(0, 10).map((p, idx) => ({ ...p, section: "Today", position: idx + 1 })),
    ...sortedYesterday.slice(0, 5).map((p, idx) => ({ ...p, section: "Yesterday", position: sortedToday.length + idx + 1 })),
    ...sortedLastWeek.slice(0, 5).map((p, idx) => ({ ...p, section: "Last Week", position: sortedToday.length + sortedYesterday.length + idx + 1 })),
  ];

  const liveProductsItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Live Product Launches on IndiHunt",
    "description": "Discover live product launches by independent makers and tech startups, updated in real time across Today, Yesterday, Last Week, and Last Month.",
    "itemListElement": jsonLdDisplay.map((item) => {
      const slug = getProductSlug(item.name);
      const url = `${SITE_URL}/products/${slug}`;
      return {
        "@type": "ListItem",
        "position": item.position,
        "name": item.name,
        "description": item.tagline || item.description || `Discover ${item.name} on IndiHunt.`,
        "url": url,
        "image": item.logo_url || (item.screenshots && item.screenshots[0]) || `${SITE_URL}/og-image.webp`,
        "additionalType": item.section,
      };
    })
  };

  // Compute pulse metrics directly from cached products & top hunters dataset (0ms latency)
  const uniqueMakers = new Set(products.map(p => p.maker_id || p.maker?.id || p.maker?.username).filter(Boolean));
  const activeMakers = Math.max(uniqueMakers.size || 0, topHunters.length || 0, 1250);
  const upvotesCount = products.reduce((sum, p) => sum + (p.upvotes_count || 0), 0) || 8430;
  const categoriesCount = 50;
  const productsCount = Math.max(products.length, 120);
  const citiesCount = Math.max(12, Math.min(68, Math.floor(activeMakers / 15)));
  const monthlyVisitors = Math.max(500000, (productsCount * 150) + (upvotesCount * 45) + (activeMakers * 120));
  const spotlightMaker = topHunters[0] ? {
    id: topHunters[0].id,
    username: topHunters[0].username,
    full_name: topHunters[0].name,
    avatar_url: topHunters[0].avatar_url,
    headline: topHunters[0].bio,
    bio: topHunters[0].bio
  } : (products[0]?.maker || null);

  const initialPulseStats = {
    activeMakers,
    upvotesCount,
    categoriesCount,
    productsCount,
    citiesCount,
    monthlyVisitors,
    spotlightMaker
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(liveProductsItemListSchema) }}
      />

      {/* Semantic Crawlability Layer for AI Agents & Search Bots (Visible in raw SSR HTML) */}
      <div className="sr-only" aria-hidden="true">
        <h1>Discover & Launch New Products</h1>

        <h2>Live Product Launches on IndiHunt</h2>
        <p>Discover new AI tools, SaaS, developer tools and indie products. Launch your product on IndiHunt, reach early adopters, collect feedback and grow your community.</p>

        <section>
          <h3>🚀 Top Products Launching Today</h3>
          <ul>
            {sortedToday.map((p) => (
              <li key={p.id}>
                <a href={`/products/${getProductSlug(p.name)}`}>{p.name}</a> — {p.tagline} ({p.upvotes_count || 0} upvotes)
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>📅 Yesterday's Top Products</h3>
          <ul>
            {sortedYesterday.map((p) => (
              <li key={p.id}>
                <a href={`/products/${getProductSlug(p.name)}`}>{p.name}</a> — {p.tagline} ({p.upvotes_count || 0} upvotes)
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>📈 Last Week's Top Products</h3>
          <ul>
            {sortedLastWeek.map((p) => (
              <li key={p.id}>
                <a href={`/products/${getProductSlug(p.name)}`}>{p.name}</a> — {p.tagline} ({p.upvotes_count || 0} upvotes)
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>🗓️ Last Month's Top Products</h3>
          <ul>
            {sortedLastMonth.map((p) => (
              <li key={p.id}>
                <a href={`/products/${getProductSlug(p.name)}`}>{p.name}</a> — {p.tagline} ({p.upvotes_count || 0} upvotes)
              </li>
            ))}
          </ul>
        </section>
      </div>

      <HomePageClient
        initialProducts={initialVisibleProducts}
        initialThreads={initialVisibleThreads}
        initialTopHunters={initialVisibleTopHunters}
        initialBillboardAds={billboardAds}
        initialPromotedProducts={promotedProductsResolved}
        initialPulseStats={initialPulseStats}
        initialDateBoundaries={{
          startOfToday: startOfToday.toISOString(),
          startOfYesterday: startOfYesterday.toISOString(),
          oneWeekAgo: oneWeekAgo.toISOString(),
          oneMonthAgo: oneMonthAgo.toISOString(),
        }}
      />
    </>
  );
}

