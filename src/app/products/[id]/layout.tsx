import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Script from "next/script";

const baseUrl = "https://indihunt.in";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function getProductSlug(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchProductForSeo(idOrSlug: string) {
  try {
    if (supabase) {
      // 1. Direct ID lookup
      let { data: product } = await supabase
        .from("products")
        .select("*, maker:profiles!maker_id(*)")
        .eq("id", idOrSlug)
        .maybeSingle();

      // 2. Slug lookup if ID fails
      if (!product) {
        const { data: allProds } = await supabase
          .from("products")
          .select("*, maker:profiles!maker_id(*)");
        if (allProds) {
          product = allProds.find(
            (p: any) => getProductSlug(p.name) === idOrSlug.toLowerCase() || p.id === idOrSlug
          ) || null;
        }
      }
      if (product) return product;
    }
  } catch (e) {
    console.error("Error fetching SEO product directly from Supabase:", e);
  }

  return null;
}

// ─── Dynamic Metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductForSeo(id);

  if (!product) {
    return {
      title: "Product — IndiHunt",
      description: "Discover and launch amazing indie tech products on IndiHunt.",
    };
  }

  const slug = getProductSlug(product.name);
  const canonicalUrl = `${baseUrl}/products/${slug}`;
  const rawDesc = product.description || product.tagline || "";
  const description =
    rawDesc.length > 155
      ? rawDesc.slice(0, 155).replace(/\n/g, " ").trim() + "…"
      : rawDesc.replace(/\n/g, " ").trim();

  const firstProductImage = (product.screenshots && product.screenshots.length > 0 && product.screenshots[0])
    ? product.screenshots[0]
    : (product.logo_url || `${baseUrl}/og-image.webp`);

  const ogImages: { url: string; width: number; height: number; alt: string }[] = [];

  // Primary image (First screenshot or logo)
  if (product.screenshots && product.screenshots.length > 0 && product.screenshots[0]) {
    ogImages.push({
      url: product.screenshots[0],
      width: 1200,
      height: 630,
      alt: `${product.name} — ${product.tagline}`,
    });
  }

  // Product logo image
  if (product.logo_url) {
    ogImages.push({
      url: product.logo_url,
      width: 400,
      height: 400,
      alt: `${product.name} logo`,
    });
  }

  // Additional screenshots
  if (product.screenshots && product.screenshots.length > 1) {
    product.screenshots.slice(1).forEach((src: string, idx: number) => {
      if (src) {
        ogImages.push({
          url: src,
          width: 1200,
          height: 630,
          alt: `${product.name} screenshot ${idx + 2}`,
        });
      }
    });
  }

  // Fallback OG image
  if (ogImages.length === 0) {
    ogImages.push({
      url: `${baseUrl}/og-image.webp`,
      width: 1200,
      height: 630,
      alt: "IndiHunt",
    });
  }

  const keywords: string[] = [
    product.name,
    product.tagline,
    ...(product.tags || []),
    "IndiHunt",
    "startup",
    "product launch",
    "tech product",
    "indie maker",
  ].filter(Boolean);

  return {
    title: `${product.name} — ${product.tagline}`,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${product.name} — ${product.tagline}`,
      description,
      url: canonicalUrl,
      siteName: "IndiHunt",
      type: "website",
      locale: "en_US",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${product.tagline}`,
      description,
      images: [firstProductImage],
      creator: "@indihunt",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ─── Layout with JSON-LD Structured Data ──────────────────────────────────────
export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProductForSeo(id);

  if (!product) return <>{children}</>;

  const slug = getProductSlug(product.name);
  const canonicalUrl = `${baseUrl}/products/${slug}`;

  const firstProductImage = (product.screenshots && product.screenshots.length > 0 && product.screenshots[0])
    ? product.screenshots[0]
    : (product.logo_url || `${baseUrl}/og-image.webp`);

  // Determine operating systems from product tags or default to Web
  const detectedPlatforms: string[] = [];
  const tagsLower = (product.tags || []).map((t: string) => t.toLowerCase());
  if (tagsLower.includes("ios") || tagsLower.includes("mobile") || tagsLower.includes("iphone")) detectedPlatforms.push("iOS");
  if (tagsLower.includes("android")) detectedPlatforms.push("Android");
  if (tagsLower.includes("macos") || tagsLower.includes("mac")) detectedPlatforms.push("macOS");
  if (tagsLower.includes("windows")) detectedPlatforms.push("Windows");
  if (tagsLower.includes("linux")) detectedPlatforms.push("Linux");
  if (detectedPlatforms.length === 0) detectedPlatforms.push("Web");

  const offers = product.pricing_type === "free"
    ? {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      }
    : (product as any).price
    ? {
        "@type": "Offer",
        "price": String((product as any).price).replace(/[^0-9.]/g, "") || "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      }
    : undefined;

  // Category handling for Breadcrumbs
  const primaryCategory = (product.category && typeof product.category === 'string' && product.category.trim())
    ? product.category.split(',')[0].trim()
    : (product.tags && Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : null);

  const categorySlug = primaryCategory ? getProductSlug(primaryCategory) : null;

  // BreadcrumbList items
  const breadcrumbItems: any[] = [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
    { "@type": "ListItem", "position": 2, "name": "Categories", "item": `${baseUrl}/categories` },
  ];

  if (primaryCategory && categorySlug) {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": 3,
      "name": primaryCategory,
      "item": `${baseUrl}/categories/${categorySlug}`,
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": 4,
      "name": product.name,
      "item": canonicalUrl,
    });
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": 3,
      "name": product.name,
      "item": canonicalUrl,
    });
  }

  // Schema.org SoftwareApplication — enables rich results in Google Search
  const softwareAppLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": product.name,
    "description": product.description || product.tagline,
    "url": product.website_url || canonicalUrl,
    "applicationCategory": primaryCategory || "WebApplication",
    "operatingSystem": detectedPlatforms.join(", "),
    ...(offers && { "offers": offers }),
    "image": firstProductImage,
    ...(product.screenshots?.length > 0 && {
      "screenshot": product.screenshots.slice(0, 4),
    }),
    "keywords": (product.tags || []).join(", "),
    "datePublished": product.created_at,
    "publisher": {
      "@type": "Organization",
      "name": "IndiHunt",
      "url": baseUrl,
      "logo": `${baseUrl}/favicon.webp`,
    },
  };

  if (product.maker) {
    softwareAppLd.author = {
      "@type": "Person",
      "name": product.maker.full_name || product.maker.username || "Indie Maker",
      "url": product.maker.username ? `${baseUrl}/@${product.maker.username}` : canonicalUrl,
    };
  }

  // BreadcrumbList — helps Google show rich breadcrumbs in SERPs
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems,
  };

  return (
    <>
      <Script
        id={`jsonld-sw-${product.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppLd) }}
      />
      <Script
        id={`jsonld-bc-${product.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
