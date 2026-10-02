import type { Metadata } from "next";
import { Suspense } from "react";
import { getProductSlug } from "@/lib/supabase";
import { getProductCached } from "@/lib/product-cache";

export const revalidate = 3600;

const baseUrl = "https://indihunt.in";

// ─── Dynamic Metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductCached(id);

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

  const shouldIndex =
    !product.is_deleted &&
    product.status !== "draft" &&
    !(product as any).deleted_at;

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
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ─── Layout with JSON-LD Structured Data ──────────────────────────────────────
async function JsonLd({ id }: { id: string }) {
  const product = await getProductCached(id);
  if (!product) return null;

  const slug = getProductSlug(product.name);
  const canonicalUrl = `${baseUrl}/products/${slug}`;

  const firstProductImage =
    product.screenshots?.[0] || product.logo_url || `${baseUrl}/og-image.webp`;

  const tagsLower = (product.tags || []).map((t: string) => t.toLowerCase());
  const platforms: string[] = [];
  if (["ios", "mobile", "iphone"].some((t) => tagsLower.includes(t))) platforms.push("iOS");
  if (tagsLower.includes("android")) platforms.push("Android");
  if (["macos", "mac"].some((t) => tagsLower.includes(t))) platforms.push("macOS");
  if (tagsLower.includes("windows")) platforms.push("Windows");
  if (tagsLower.includes("linux")) platforms.push("Linux");
  if (platforms.length === 0) platforms.push("Web");

  const rawPrice = (product as any).price;
  const offers =
    product.pricing_type === "free"
      ? { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" }
      : rawPrice
      ? {
          "@type": "Offer",
          price: String(rawPrice).replace(/[^0-9.]/g, "") || "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        }
      : undefined;

  const primaryCategory =
    typeof product.category === "string" && product.category.trim()
      ? product.category.split(",")[0].trim()
      : product.tags?.[0] ?? null;

  const breadcrumbItems: any[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Categories", item: `${baseUrl}/categories` },
  ];
  if (primaryCategory) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: primaryCategory,
      item: `${baseUrl}/categories/${getProductSlug(primaryCategory)}`,
    });
  }
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: product.name,
    item: canonicalUrl,
  });

  const softwareAppLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.description || product.tagline,
    url: product.website_url || canonicalUrl,
    applicationCategory: primaryCategory || "WebApplication",
    operatingSystem: platforms.join(", "),
    ...(offers && { offers }),
    image: firstProductImage,
    ...(product.screenshots?.length > 0 && { screenshot: product.screenshots.slice(0, 4) }),
    keywords: (product.tags || []).join(", "),
    datePublished: product.created_at,
    publisher: {
      "@type": "Organization",
      name: "IndiHunt",
      url: baseUrl,
      logo: `${baseUrl}/favicon.webp`,
    },
  };

  if (product.maker) {
    softwareAppLd.author = {
      "@type": "Person",
      name: product.maker.full_name || product.maker.username || "Indie Maker",
      url: product.maker.username ? `${baseUrl}/@${product.maker.username}` : canonicalUrl,
    };
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  // escape "<" so product text can't break out of the script tag
  const serialize = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(softwareAppLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(breadcrumbLd) }} />
    </>
  );
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <JsonLd id={id} />
      </Suspense>
    </>
  );
}
