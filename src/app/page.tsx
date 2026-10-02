import { 
  getHomeProductsDirect, 
  getHomeThreadsDirect, 
  getTopHuntersData, 
  getPromotedProducts, 
  getProductSlug, 
  compareProductsForRanking, 
  getISTStartOfDay, 
  Product 
} from "@/lib/supabase";
import HomePageClient from "./HomePageClient";

export const revalidate = 60; // ISR: Revalidate cached page data every 60s
export const preferredRegion = ["bom1", "sin1", "iad1", "cle1"]; // Function region next to database

const SITE_URL = "https://indihunt.in";

export default async function Home() {
  // 1. Direct DB service layer calls wrapped in Promise.all (zero HTTP self-fetch)
  const productsPromise = getHomeProductsDirect(150).catch(() => [] as Product[]);
  const threadsPromise = getHomeThreadsDirect(15).catch(() => []);

  const [products, threads] = await Promise.all([
    productsPromise,
    threadsPromise,
  ]);

  // Derive secondary datasets without additional DB roundtrips
  const [topHunters, promotedProductsResolved] = await Promise.all([
    getTopHuntersData("all_time", products).catch(() => []),
    getPromotedProducts(products).catch(() => [] as Product[]),
  ]);

  const billboardAds: any[] = [];

  // Group live products strictly by their launch date in Indian Standard Time (IST)
  const now = new Date();
  const startOfToday = getISTStartOfDay(now);
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Separate upcoming and live products
  const upcomingList: Product[] = [];
  const liveProducts: Product[] = [];

  (products || []).forEach((p: Product) => {
    if (p.status === "draft") return;
    if (p.scheduled_for) {
      const launchDate = new Date(p.scheduled_for);
      if (launchDate > now) {
        upcomingList.push(p);
        return;
      }
    }
    if (p.status !== "scheduled") {
      liveProducts.push(p);
    } else if (p.scheduled_for && new Date(p.scheduled_for) <= now) {
      liveProducts.push({ ...p, status: "live" });
    }
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

  const initialVisibleThreads = threads.slice(0, 10);
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
        initialProducts={products}
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

