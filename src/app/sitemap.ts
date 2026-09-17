import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getProductSlug } from "@/lib/supabase";

export const revalidate = 86400; // Cache XML sitemap for 24 hours (86,400s)

const SITE_URL = "https://indihunt.in";
const STATIC_LAST_MODIFIED = new Date("2026-08-28T00:00:00.000Z");

// All category slugs — mirrors categories page & leaderboard filters
const ALL_CATEGORY_SLUGS = [
  "saas",
  "artificial-intelligence",
  "ai-agents",
  "ai-agents-automation",
  "ai-coding-agents",
  "productivity",
  "marketing-tools",
  "marketing-seo",
  "finance-fintech",
  "fintech-crypto",
  "developer-tools",
  "apis-integrations",
  "open-source",
  "design-tools",
  "design-creative",
  "mobile-apps",
  "web3-crypto",
  "e-commerce-retail",
  "health-fitness",
  "education-edtech",
  "analytics-data",
  "cybersecurity",
  "social-community",
  "media-entertainment",
  "no-code-low-code",
  "customer-support-crm",
  "ar-vr",
  "ad-blockers",
  "ai-notetakers",
  "presentation-software",
  "workflow-automation",
  "app-switcher",
  "cms",
  "calendar-apps",
  "compliance-software",
  "e-signature-apps",
  "email-clients",
  "file-storage",
  "hiring-software",
  "knowledge-base",
  "meeting-software",
  "note-writing-apps",
  "pdf-editor",
  "password-managers",
  "project-management",
  "scheduling-software",
  "team-collaboration",
  "time-tracking",
  "ai-code-editors",
  "ai-code-testing",
  "ai-databases",
  "vibe-coding",
  "ai-infrastructure",
  "accounting",
  "budgeting",
  "invoicing",
  "legal-services",
  "ai-sales-tools",
  "crm-software",
  "3d-animation",
  "ai-generative-media",
];

// All help center article slugs — mirrors /help/[id] page
const HELP_ARTICLE_SLUGS = [
  "get-featured",
  "understanding-scores",
  "community-guidelines",
  "claim-badges",
  "ad-campaigns",
];

const MONTHS_SHORT = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const BEST_PRODUCTS_PERIODS = ["daily", "weekly", "monthly", "yearly"];

// Create a server-side Supabase client using env vars
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/leaderboard`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/top-hunters`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/pages`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/best-products`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/products`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/discussions`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "hourly", priority: 0.85 },
    { url: `${SITE_URL}/makers`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/awards`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/new`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/pages/studio`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/launch-insights`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/news`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/stories`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.75 },
    { url: `${SITE_URL}/guide`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/careers`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/faq`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.65 },
    { url: `${SITE_URL}/changelog`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.65 },
    { url: `${SITE_URL}/advertise`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.55 },
    { url: `${SITE_URL}/help`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/cookies`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Category directory pages (/categories/[slug])
  const categoryRoutes: MetadataRoute.Sitemap = ALL_CATEGORY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/categories/${slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const supabase = getSupabaseClient();
  const productRoutes: MetadataRoute.Sitemap = [];
  const profileRoutes: MetadataRoute.Sitemap = [];
  const threadRoutes: MetadataRoute.Sitemap = [];
  const bestProductRoutes: MetadataRoute.Sitemap = [];
  const launchInsightRoutes: MetadataRoute.Sitemap = [];

  // Help center article routes
  const helpRoutes: MetadataRoute.Sitemap = HELP_ARTICLE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/help/${slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Deduplication sets to avoid duplicate URLs when multiple records slugify identically
  const seenProductUrls = new Set<string>();
  const seenThreadUrls = new Set<string>();
  const seenStoryUrls = new Set<string>();
  const storyRoutes: MetadataRoute.Sitemap = [];
  const activeMakerIds = new Set<string>();

  if (supabase) {
    try {
      const now = new Date().toISOString();
      const { data: products } = await supabase
        .from("products")
        .select("name, created_at, status, scheduled_for, show_pre_launch, deleted_at, maker_id")
        .is("deleted_at", null)
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (products && Array.isArray(products)) {
        // Collect unique year/month combos for best-products and launch-insights routes
        const seenBestProductUrls = new Set<string>();
        const seenLaunchInsightUrls = new Set<string>();

        products
          .filter((p: any) => {
            if (p.status === "published" || p.status === "live") return true;
            if (p.status === "scheduled") {
              if (p.show_pre_launch) return true;
              if (p.scheduled_for && new Date(p.scheduled_for) <= new Date(now)) return true;
            }
            return false;
          })
          .forEach((p: any) => {
            if (p.maker_id) activeMakerIds.add(p.maker_id);
            const slug = getProductSlug(p.name);
            if (slug) {
              const productUrl = `${SITE_URL}/products/${slug}`;
              const altUrl = `${SITE_URL}/products/${slug}/alternatives`;
              if (!seenProductUrls.has(productUrl)) {
                seenProductUrls.add(productUrl);
                productRoutes.push({
                  url: productUrl,
                  lastModified: p.updated_at ? new Date(p.updated_at) : new Date(p.created_at),
                  changeFrequency: "weekly" as const,
                  priority: 0.85,
                });
                productRoutes.push({
                  url: altUrl,
                  lastModified: p.updated_at ? new Date(p.updated_at) : new Date(p.created_at),
                  changeFrequency: "weekly" as const,
                  priority: 0.75,
                });
              }
            }

            // Generate best-products and launch-insights date routes from product dates
            const createdDate = new Date(p.created_at);
            if (!isNaN(createdDate.getTime())) {
              const year = createdDate.getFullYear();
              const month = MONTHS_SHORT[createdDate.getMonth()];
              const day = createdDate.getDate();

              // /best-products/[period]/[year]/[month]
              for (const period of BEST_PRODUCTS_PERIODS) {
                const bpUrl = `${SITE_URL}/best-products/${period}/${year}/${month}`;
                if (!seenBestProductUrls.has(bpUrl)) {
                  seenBestProductUrls.add(bpUrl);
                  bestProductRoutes.push({
                    url: bpUrl,
                    lastModified: STATIC_LAST_MODIFIED,
                    changeFrequency: "daily" as const,
                    priority: 0.75,
                  });
                }
              }

              // /launch-insights/[year]/[month]/[day]
              const liUrl = `${SITE_URL}/launch-insights/${year}/${createdDate.getMonth() + 1}/${day}`;
              if (!seenLaunchInsightUrls.has(liUrl)) {
                seenLaunchInsightUrls.add(liUrl);
                launchInsightRoutes.push({
                  url: liUrl,
                  lastModified: STATIC_LAST_MODIFIED,
                  changeFrequency: "weekly" as const,
                  priority: 0.7,
                });
              }
            }
          });
      }
    } catch (err) {
      console.error("[sitemap] Failed to fetch products:", err);
    }

    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, created_at, indie_page_enabled")
        .not("username", "is", null)
        .limit(5000);

      if (profiles && Array.isArray(profiles) && profiles.length > 0) {
        profiles
          .filter((p: any) => p.username && p.username.trim().length > 0)
          .forEach((p: any) => {
            const cleanUser = p.username.replace(/^@/, "").trim();
            if (cleanUser) {
              // Handle @username profile route
              profileRoutes.push({
                url: `${SITE_URL}/@${cleanUser}`,
                lastModified: p.created_at ? new Date(p.created_at) : new Date(),
                changeFrequency: "weekly" as const,
                priority: 0.8,
              });
              
              // Handle /page/username IndiHunt page route
              // Only include if the user has active products and hasn't explicitly disabled the page
              if (p.indie_page_enabled !== false && activeMakerIds.has(p.id)) {
                profileRoutes.push({
                  url: `${SITE_URL}/page/${cleanUser}`,
                  lastModified: p.created_at ? new Date(p.created_at) : new Date(),
                  changeFrequency: "weekly" as const,
                  priority: 0.85,
                });
              }
            }
          });
      }
    } catch (err) {
      console.error("[sitemap] Failed to fetch profiles:", err);
    }

    try {
      const { data: threads } = await supabase
        .from("threads")
        .select("id, title, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (threads && Array.isArray(threads)) {
        threads.forEach((t: any) => {
          const slug = t.title ? getProductSlug(t.title) : t.id;
          if (slug) {
            const threadUrl = `${SITE_URL}/threads/${slug}`;
            if (!seenThreadUrls.has(threadUrl)) {
              seenThreadUrls.add(threadUrl);
              threadRoutes.push({
                url: threadUrl,
                lastModified: t.updated_at ? new Date(t.updated_at) : new Date(t.created_at),
                changeFrequency: "weekly" as const,
                priority: 0.7,
              });
            }
          }
        });
      }
    } catch (err) {
      console.error("[sitemap] Failed to fetch threads:", err);
    }

    try {
      const { data: stories } = await supabase
        .from("stories")
        .select("title, published_at")
        .order("published_at", { ascending: false })
        .limit(2000);

      if (stories && Array.isArray(stories)) {
        stories
          .filter((s: any) => s.title)
          .forEach((s: any) => {
            const storyUrl = `${SITE_URL}/stories/${getProductSlug(s.title)}`;
            if (!seenStoryUrls.has(storyUrl)) {
              seenStoryUrls.add(storyUrl);
              storyRoutes.push({
                url: storyUrl,
                lastModified: s.published_at ? new Date(s.published_at) : new Date(),
                changeFrequency: "weekly" as const,
                priority: 0.7,
              });
            }
          });
      }
    } catch (err) {
      console.error("[sitemap] Failed to fetch stories:", err);
    }
  }



  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...helpRoutes,
    ...productRoutes,
    ...profileRoutes,
    ...threadRoutes,
    ...storyRoutes,
    ...bestProductRoutes,
    ...launchInsightRoutes,
  ];
}
