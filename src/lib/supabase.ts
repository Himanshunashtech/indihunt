import { createBrowserClient as createClient } from '@supabase/ssr';
import { cache as reactCache } from 'react';
import { secureApiFetch, clearClientApiCache } from '@/lib/api/client';
import {
  getCachedData as getRedisCache,
  setCachedData as setRedisCache,
  invalidateCache as invalidateRedisCache,
  invalidateCachePattern as invalidateRedisPattern
} from '@/lib/redis';
export type {
  Profile,
  Product,
  Comment,
  Thread,
  Review,
  AlternativeProduct,
  Collection,
  UserStack,
  Story,
  StoryComment,
  ProductInvestorDetails,
  ProductShoutout,
  LaunchInsightsData,
  NewsItem,
  AdCampaign,
  AdEvent,
  VectorSearchResult,
  MultiEntitySearchResults,
  ThreadReport,
  NotificationItem,
  UserNotificationSettings,
  PaymentGatewayType,
  PaymentRecord,
  PolarPayment,
  PaymentGatewayConfig,
  AdBudgetTransaction,
  Hunter,
  BillboardAd,
  CategorySummary,
  LeaderboardActivity,
  JobPosting,
  JobPostingInput,
  JobApplication,
  JobApplicationInput,
  JobApplicationStatus,
  LaunchTag,
  LaunchTagInput,
  ProductRankDetails,
} from '@/types';

import type {
  Profile,
  Product,
  Comment,
  Thread,
  Review,
  AlternativeProduct,
  Collection,
  UserStack,
  Story,
  StoryComment,
  ProductInvestorDetails,
  ProductShoutout,
  LaunchInsightsData,
  NewsItem,
  AdCampaign,
  AdEvent,
  VectorSearchResult,
  MultiEntitySearchResults,
  ThreadReport,
  NotificationItem,
  UserNotificationSettings,
  PaymentGatewayType,
  PaymentRecord,
  PolarPayment,
  PaymentGatewayConfig,
  AdBudgetTransaction,
  Hunter,
  BillboardAd,
  CategorySummary,
  LeaderboardActivity,
  JobPosting,
  JobPostingInput,
  JobApplication,
  JobApplicationInput,
  JobApplicationStatus,
  LaunchTag,
  LaunchTagInput,
  ProductRankDetails,
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client directly with NEXT_PUBLIC_SUPABASE_URL
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Module-level in-memory cache + persistent localStorage for instant page reloads
const clientCache: Record<string, { data: any; timestamp: number }> = {};
const MEMORY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes TTL in memory
const PERSIST_CACHE_TTL = 60 * 60 * 1000; // 60 minutes TTL in localStorage

export function clearCache(keyPrefix?: string): void {
  if (keyPrefix) {
    invalidateRedisPattern(`public_${keyPrefix}`).catch(() => { });
    clearClientApiCache(`/t/${keyPrefix}`);
  } else {
    invalidateRedisPattern('public_').catch(() => { });
    clearClientApiCache();
  }
  if (typeof window === 'undefined') return;
  if (keyPrefix) {
    Object.keys(clientCache).forEach(k => {
      if (k.startsWith(keyPrefix)) {
        delete clientCache[k];
      }
    });
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith(`ih_cache_${keyPrefix}`)) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) { }
  } else {
    Object.keys(clientCache).forEach(k => delete clientCache[k]);
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('ih_cache_')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) { }
  }
}

function getCachedData(key: string): any | null {
  if (typeof window === 'undefined') return null;
  const entry = clientCache[key];
  if (entry && (Date.now() - entry.timestamp) < MEMORY_CACHE_TTL) {
    if (Array.isArray(entry.data) && entry.data.length === 0) {
      return null;
    }
    return entry.data;
  }

  // Restore cache instantly from localStorage on page refresh
  try {
    const raw = localStorage.getItem(`ih_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.timestamp && (Date.now() - parsed.timestamp) < PERSIST_CACHE_TTL) {
        if (Array.isArray(parsed.data) && parsed.data.length === 0) {
          return null;
        }
        clientCache[key] = parsed;
        return parsed.data;
      }
    }
  } catch (e) { }

  return null;
}

function setCachedData(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  if (data === null || data === undefined) return;
  if (Array.isArray(data) && data.length === 0) return;

  const entry = {
    data,
    timestamp: Date.now()
  };
  clientCache[key] = entry;
  try {
    localStorage.setItem(`ih_cache_${key}`, JSON.stringify(entry));
  } catch (e) { }
}

function withCache<Args extends any[], Ret>(
  keyPrefix: string,
  fn: (...args: Args) => Promise<Ret>,
  getKeySuffix: (...args: Args) => string = (...args) => args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join('_')
): (...args: Args) => Promise<Ret> {
  return async (...args: Args): Promise<Ret> => {
    const key = `${keyPrefix}_${getKeySuffix(...args)}`;
    const cached = getCachedData(key);
    if (cached !== null && (!Array.isArray(cached) || cached.length > 0)) {
      // Revalidate silently in background if older than 30 seconds
      const entry = clientCache[key];
      if (!entry || (Date.now() - entry.timestamp > 30000)) {
        fn(...args).then(fresh => {
          if (fresh !== undefined && fresh !== null && (!Array.isArray(fresh) || fresh.length > 0)) {
            setCachedData(key, fresh);
          }
        }).catch(() => { });
      }
      return cached;
    }

    if (keyPrefix === 'products') {
      const currentUserId = args[0];
      if (!currentUserId) {
        const fallbackCached = getCachedProducts();
        if (fallbackCached && fallbackCached.length > 0) {
          setCachedData(key, fallbackCached);
          fn(...args).then(fresh => {
            if (fresh !== undefined && fresh !== null && (!Array.isArray(fresh) || fresh.length > 0)) {
              setCachedData(key, fresh);
            }
          }).catch(() => { });
          return fallbackCached as unknown as Ret;
        }
      }
    }

    const result = await fn(...args);
    if (result !== undefined && result !== null && (!Array.isArray(result) || result.length > 0)) {
      setCachedData(key, result);
    }
    return result;
  };
}

export function getCachedProduct(productId: string): Product | null {
  return getCachedData(`product_by_id_${productId}`);
}

export function getCachedProducts(currentUserId?: string): Product[] {
  let products: Product[] = [];
  const cached = getCachedData(`products_${currentUserId || 'guest'}`);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    products = cached;
  } else {
    const fallbackGuest = getCachedData('products_guest') || getCachedData('products_undefined');
    if (fallbackGuest && Array.isArray(fallbackGuest) && fallbackGuest.length > 0) {
      products = fallbackGuest;
    } else if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('indihunt_products');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = parsed.filter(p =>
              p &&
              p.id !== 'prod-media-1' &&
              p.id !== 'prod-media-2' &&
              p.id !== 'prod-media-3' &&
              p.name !== 'StreamPulse AI' &&
              p.name !== 'VoxWave Studio' &&
              p.name !== 'OmniPlay Pro'
            );
            products = cleaned;
            if (cleaned.length !== parsed.length) {
              localStorage.setItem('indihunt_products', JSON.stringify(cleaned));
            }
          }
        }
      } catch (e) { }
    }
  }

  // Filter out any fake products from memory cache if present
  products = products.filter(p =>
    p &&
    p.id !== 'prod-media-1' &&
    p.id !== 'prod-media-2' &&
    p.id !== 'prod-media-3' &&
    p.name !== 'StreamPulse AI' &&
    p.name !== 'VoxWave Studio' &&
    p.name !== 'OmniPlay Pro'
  );

  if (typeof window !== 'undefined' && products.length > 0) {
    try {
      if (currentUserId) {
        const rawVotes = localStorage.getItem(`indihunt_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_upvotes');
        const votes: string[] = JSON.parse(rawVotes || '[]');
        const votedSet = new Set(votes);
        return products.map(p => ({
          ...p,
          has_upvoted: votedSet.has(p.id)
        }));
      } else {
        return products.map(p => ({
          ...p,
          has_upvoted: false
        }));
      }
    } catch (e) { }
  }

  return products;
}

export function getCachedThreads(currentUserId?: string): Thread[] {
  return getCachedData(`threads_${currentUserId || 'guest'}`) || [];
}

// Mock Data structure for fallback mode
export const MOCK_PROFILES: Record<string, Profile> = {
  'user-1': {
    id: 'user-1',
    username: 'john_doe',
    full_name: 'John Doe',
    is_maker: true,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    bio: 'Building the future of indie hunting',
    headline: 'Indie Maker & Developer',
    karma_points: 120,
    followers_count: 45,
    is_verified: true,
    streak_count: 5,
    website: 'https://johndoe.com',
    github_url: 'https://github.com/johndoe',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    twitter_url: 'https://twitter.com/johndoe'
  },
  'user-2': {
    id: 'user-2',
    username: 'jane_smith',
    full_name: 'Jane Smith',
    is_maker: true,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    bio: 'Product Designer at IndiHunt',
    headline: 'UI/UX Designer & Maker',
    karma_points: 85,
    followers_count: 32,
    is_verified: true,
    streak_count: 3
  }
};

export function normalizeProductUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    let url = rawUrl.trim().toLowerCase();
    url = url.replace(/^https?:\/\//i, '');
    url = url.replace(/^www\./i, '');
    url = url.split('?')[0].split('#')[0];
    url = url.replace(/\/+$/, '');
    return url;
  } catch {
    return rawUrl ? rawUrl.trim().toLowerCase() : "";
  }
}

export function extractDomainFromUrl(rawUrl: string): string {
  const norm = normalizeProductUrl(rawUrl);
  return norm.split('/')[0] || norm;
}

export async function checkProductUrlExists(
  urlToCheck: string,
  excludeProductId?: string
): Promise<{ exists: boolean; product?: Product; message?: string }> {
  if (!urlToCheck || !urlToCheck.trim()) {
    return { exists: false };
  }

  const normalizedInput = normalizeProductUrl(urlToCheck);
  const domainInput = extractDomainFromUrl(urlToCheck);

  if (!normalizedInput) {
    return { exists: false };
  }

  // 1. API route check
  try {
    const res = await secureApiFetch<Product[]>(`/t/products?check_url=${encodeURIComponent(normalizedInput)}&limit=20`);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      const match = res.data.find(p => {
        if (excludeProductId && (p.id === excludeProductId || getProductSlug(p.name) === excludeProductId)) {
          return false;
        }
        if (p.is_deleted) return false;
        const normExisting = normalizeProductUrl(p.website_url);
        const domainExisting = extractDomainFromUrl(p.website_url);
        return normExisting === normalizedInput || (domainInput.includes('.') && domainExisting === domainInput);
      });

      if (match) {
        return {
          exists: true,
          product: match,
          message: `This product (${match.name}) has already been launched on IndiHunt!`
        };
      }
    }
  } catch (err) { }

  // 2. Direct Supabase check
  if (supabase) {
    try {
      const { data: dbMatches } = await supabase
        .from('products')
        .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, is_maker, karma_points, streak_count)')
        .or(`website_url.ilike.%${domainInput}%,website_url.ilike.%${normalizedInput}%`)
        .limit(20);

      if (dbMatches && dbMatches.length > 0) {
        const match = dbMatches.find((p: any) => {
          if (excludeProductId && (p.id === excludeProductId || getProductSlug(p.name) === excludeProductId)) {
            return false;
          }
          if (p.is_deleted) return false;
          const normExisting = normalizeProductUrl(p.website_url || '');
          const domainExisting = extractDomainFromUrl(p.website_url || '');
          return normExisting === normalizedInput || (domainInput.includes('.') && domainExisting === domainInput);
        });

        if (match) {
          return {
            exists: true,
            product: match as Product,
            message: `This product (${match.name}) has already been launched on IndiHunt!`
          };
        }
      }
    } catch (e) { }
  }

  // 3. Fallback: check local storage & mock products
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('indihunt_products');
      const allLocal: Product[] = raw ? JSON.parse(raw) : [];
      const match = allLocal.find(p => {
        if (excludeProductId && (p.id === excludeProductId || getProductSlug(p.name) === excludeProductId)) {
          return false;
        }
        if (p.is_deleted) return false;
        const normExisting = normalizeProductUrl(p.website_url || '');
        const domainExisting = extractDomainFromUrl(p.website_url || '');
        return normExisting === normalizedInput || (domainInput.includes('.') && domainExisting === domainInput);
      });

      if (match) {
        return {
          exists: true,
          product: match,
          message: `This product (${match.name}) has already been launched on IndiHunt!`
        };
      }
    } catch { }
  }

  return { exists: false };
}

export function calculateQualityScore(product: Partial<Product>, maker?: Profile): number {
  let score = 0;

  // Working website: 20 pts
  if (product.website_url && product.website_url.trim().length > 0 && !product.website_url.includes("placeholder") && !product.website_url.includes("example.com")) {
    score += 20;
  }

  // Logo uploaded: 10 pts
  if (product.logo_url && product.logo_url.trim().length > 0 && !product.logo_url.includes("placeholder")) {
    score += 10;
  }

  // 3+ screenshots: 15 pts
  if (product.screenshots && product.screenshots.length >= 3) {
    score += 15;
  }

  // Demo video: 10 pts
  if (product.video_url && product.video_url.trim().length > 0) {
    score += 10;
  }

  // Good description: 15 pts (if >= 200 chars)
  if (product.description && product.description.trim().length >= 200) {
    score += 15;
  }

  // Verified maker profile: 10 pts
  if (maker && (maker.is_verified || maker.id === 'user-1' || maker.id === 'user-2')) {
    score += 10;
  }

  // Social links: 5 pts
  if (product.twitter_url || product.facebook_url || product.instagram_url || product.linkedin_url || product.github_url) {
    score += 5;
  }

  // Complete tags/categories: 5 pts
  if (product.tags && product.tags.length > 0) {
    score += 5;
  }

  // Fast website (optional): 10 pts
  if (product.website_url && !product.website_url.includes("broken")) {
    score += 10;
  }

  return score;
}

export function calculateEngagementScore(product: Partial<Product>, commentsCount = 0): number {
  const upvotes = product.upvotes_count || 0;
  const comments = commentsCount || product.comments_count || 0;
  const bookmarks = (product as any).bookmarks_count || 0;
  const views = (product as any).views_count || (product as any).views || 0;

  return (upvotes * 3) + (comments * 5) + (bookmarks * 2) + Math.floor(views / 20);
}

export function checkFeaturedEligibility(product: Partial<Product>, maker?: Profile): boolean {
  // Website/demo link works
  const hasWebsite = product.website_url && product.website_url.trim().length > 0 && !product.website_url.includes("broken");
  // Logo uploaded
  const hasLogo = product.logo_url && product.logo_url.trim().length > 0;
  // At least 3 screenshots or a demo video
  const hasScreenshotsOrVideo = (product.screenshots && product.screenshots.length >= 3) || (product.video_url && product.video_url.trim().length > 0);
  // Description is at least 200 characters
  const hasGoodDesc = product.description && product.description.trim().length >= 200;
  // Tagline is present
  const hasTagline = product.tagline && product.tagline.trim().length > 0;
  // Product category selected
  const hasCategory = (product.tags && product.tags.length > 0);
  // Maker profile completed (headline / full_name / username present)
  const isMakerProfileComplete = !!(maker && maker.full_name && maker.username && maker.headline);
  // Product is publicly accessible (status is not draft)
  const isPublic = product.status !== 'draft';

  return !!(hasWebsite && hasLogo && hasScreenshotsOrVideo && hasGoodDesc && hasTagline && hasCategory && isMakerProfileComplete && isPublic);
}

export function evaluateFeaturing(product: Product, commentsCount = 0, makerProfile?: Profile): {
  featured: boolean;
  quality_score: number;
  engagement_score: number;
  featured_at?: string;
} {
  const maker = makerProfile || product.maker;
  const quality = calculateQualityScore(product, maker);
  const engagement = calculateEngagementScore(product, commentsCount);

  // Products that should never be featured: spam, broken website, etc.
  if (product.never_feature || (product.website_url && product.website_url.includes("broken"))) {
    return { featured: false, quality_score: quality, engagement_score: engagement };
  }

  // Admin Manual Pick override
  if (product.editor_pick) {
    return {
      featured: true,
      quality_score: quality,
      engagement_score: engagement,
      featured_at: product.featured_at || new Date().toISOString()
    };
  }

  // Check Featured Eligibility checklist
  const isEligible = checkFeaturedEligibility(product, maker);
  if (!isEligible) {
    return { featured: false, quality_score: quality, engagement_score: engagement };
  }

  // Check 12-hour window rule:
  const launchDate = product.scheduled_for ? new Date(product.scheduled_for) : new Date(product.created_at || new Date());
  const now = new Date();
  const diffHours = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60);

  // Auto rules:
  // - Quality Score >= 80
  // - At least 20 upvotes
  // - At least 5 comments
  // - No reports for spam (handled via never_feature / spam report counts if any)
  // - Less than 30 days old
  // - MUST achieve this within 12 hours of launch.
  const meetsAutoRules = quality >= 80 &&
    (product.upvotes_count || 0) >= 20 &&
    (commentsCount || product.comments_count || 0) >= 5 &&
    diffHours < 30 * 24; // Less than 30 days old

  // If they meet auto rules and are within 12 hours of launch, auto-feature.
  // Or, if they were already featured (product.featured is true) and are still less than 30 days old.
  let isFeatured = false;
  if (meetsAutoRules && diffHours <= 12) {
    isFeatured = true;
  } else if (product.featured && diffHours < 30 * 24) {
    // Retain featuring if already featured before 12 hour window expired
    isFeatured = true;
  }

  return {
    featured: isFeatured,
    quality_score: quality,
    engagement_score: engagement,
    featured_at: isFeatured ? (product.featured_at || new Date().toISOString()) : undefined
  };
}

export async function featureProduct(productId: string, action: 'feature' | 'unfeature'): Promise<boolean> {
  clearCache();
  try {
    const res = await secureApiFetch<{ success: boolean; featured: boolean }>(
      `/t/products/${encodeURIComponent(productId)}/feature`,
      {
        method: 'POST',
        body: JSON.stringify({ action }),
      }
    );
    if (res && res.success) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('indihunt_products');
        if (cached) {
          const products: Product[] = JSON.parse(cached);
          const updated = products.map(p => {
            if (p.id === productId) {
              return {
                ...p,
                editor_pick: action === 'feature',
                featured: action === 'feature',
                featured_at: action === 'feature' ? new Date().toISOString() : undefined,
                never_feature: action === 'unfeature'
              };
            }
            return p;
          });
          localStorage.setItem('indihunt_products', JSON.stringify(updated));
        }
      }
      return true;
    }
  } catch { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_products');
    if (cached) {
      const products: Product[] = JSON.parse(cached);
      const updated = products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            editor_pick: action === 'feature',
            featured: action === 'feature',
            featured_at: action === 'feature' ? new Date().toISOString() : undefined,
            never_feature: action === 'unfeature'
          };
        }
        return p;
      });
      localStorage.setItem('indihunt_products', JSON.stringify(updated));
      return true;
    }
  }
  return false;
}

/**
 * Helper to check if a product is officially launched and active (not scheduled for future, not draft, not deleted).
 */
export function isProductLaunched(p?: { status?: string; scheduled_for?: string; is_deleted?: boolean } | null): boolean {
  if (!p || p.is_deleted || p.status === 'draft') return false;
  const now = new Date();
  if (p.scheduled_for && new Date(p.scheduled_for) > now) return false;
  if (p.status === 'scheduled') {
    return !!(p.scheduled_for && new Date(p.scheduled_for) <= now);
  }
  return true;
}

/**
 * Calculates start of day in Indian Standard Time (IST, UTC+5:30)
 */
export function getISTStartOfDay(date: Date = new Date()): Date {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(date.getTime() + IST_OFFSET_MS);
  const istDateStr = istNow.toISOString().split('T')[0];
  return new Date(new Date(`${istDateStr}T00:00:00.000Z`).getTime() - IST_OFFSET_MS);
}

/**
 * Checks if the current time falls within the daily Indian Pre-Launch Window:
 * - 8:00 PM (20:00) to 2:00 AM (02:00) IST (Indian Standard Time)
 */
export function isIndianPreLaunchWindow(date: Date = new Date()): boolean {
  try {
    const istTimeStr = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
    const match = istTimeStr.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hour = parseInt(match[1], 10);
      return hour >= 20 || hour < 2;
    }
  } catch {
    const hour = date.getHours();
    return hour >= 20 || hour < 2;
  }
  const hour = date.getHours();
  return hour >= 20 || hour < 2;
}

export const isGlobalPreLaunchWindow = isIndianPreLaunchWindow;

// Helper to auto-promote past scheduled products to 'live' in Supabase & local cache
export async function syncScheduledProducts(): Promise<void> {
  const now = new Date();

  try {
    await secureApiFetch('/t/products/sync-scheduled', { method: 'POST' });
  } catch { }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('indihunt_products');
      if (raw) {
        const prods: Product[] = JSON.parse(raw);
        let changed = false;
        const updated = prods.map(p => {
          if (p.status === 'scheduled' && p.scheduled_for && new Date(p.scheduled_for) <= now) {
            changed = true;
            return { ...p, status: 'live' as const };
          }
          return p;
        });
        if (changed) {
          localStorage.setItem('indihunt_products', JSON.stringify(updated));
        }
      }
    } catch { }
  }
}

// Helper to interact with Local Storage or API
async function getProductsRaw(currentUserId?: string): Promise<Product[]> {
  // 1. High-speed cache check for public/guest SSR (< 1ms)
  if (!currentUserId) {
    const cachedPublic = await getRedisCache<Product[]>('public_products');
    if (cachedPublic && Array.isArray(cachedPublic) && cachedPublic.length > 0) {
      return cachedPublic;
    }
  }

  // 2. Direct Supabase query during SSR / Server execution (0ms network loopback overhead)
  if (typeof window === 'undefined' && supabase) {
    try {
      const { data: dbProducts } = await supabase
        .from('products')
        .select('*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)')
        .order('created_at', { ascending: false });

      if (dbProducts && dbProducts.length > 0) {
        if (!currentUserId) {
          setRedisCache('public_products', dbProducts, 300).catch(() => { });
        }
        return dbProducts as Product[];
      }
    } catch { }
  }

  try {
    const query = currentUserId ? `?userId=${encodeURIComponent(currentUserId)}&limit=500` : '?limit=500';
    const res = await secureApiFetch<Product[]>(`/t/products${query}`);
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      if (!currentUserId) {
        setRedisCache('public_products', res.data, 300).catch(() => { });
      }
      return res.data;
    }
  } catch { }

  return getCachedProducts(currentUserId);
}

export const getProducts = getProductsRaw;

export async function toggleUpvote(productId: string, userId: string): Promise<{ success: boolean; has_upvoted: boolean; upvotes_count: number; productId: string }> {
  clearCache();

  try {
    const res = await secureApiFetch<{ success: boolean; has_upvoted: boolean; upvotes_count: number; productId?: string }>(
      `/t/products/${encodeURIComponent(productId)}/upvote`,
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }
    );

    const data: any = res?.data || res;
    if (res && res.success) {
      const hasUpvoted = Boolean(data?.has_upvoted ?? res?.has_upvoted);
      const upvotesCount = typeof data?.upvotes_count === 'number'
        ? data.upvotes_count
        : (typeof res?.upvotes_count === 'number' ? res.upvotes_count : 0);
      const resolvedId = String(data?.productId || res?.productId || productId);

      if (typeof window !== 'undefined') {
        const rawUserVotes = (userId ? localStorage.getItem(`indihunt_upvotes_${userId}`) : null) || localStorage.getItem('indihunt_upvotes');
        const votes: string[] = JSON.parse(rawUserVotes || '[]');
        let nextVotes: string[];
        if (hasUpvoted) {
          nextVotes = Array.from(new Set([...votes, resolvedId, productId]));
        } else {
          nextVotes = votes.filter(id => id !== resolvedId && id !== productId);
        }
        localStorage.setItem('indihunt_upvotes', JSON.stringify(nextVotes));
        if (userId) {
          localStorage.setItem(`indihunt_upvotes_${userId}`, JSON.stringify(nextVotes));
        }

        // Keep indihunt_products in localStorage updated as well
        try {
          const rawProds = localStorage.getItem('indihunt_products');
          if (rawProds) {
            const prods = JSON.parse(rawProds);
            if (Array.isArray(prods)) {
              const updated = prods.map(p => {
                if (p.id === resolvedId || p.id === productId) {
                  return { ...p, upvotes_count: upvotesCount, has_upvoted: hasUpvoted };
                }
                return p;
              });
              localStorage.setItem('indihunt_products', JSON.stringify(updated));
            }
          }
        } catch {}
      }
      return { success: true, has_upvoted: hasUpvoted, upvotes_count: upvotesCount, productId: resolvedId };
    }
  } catch (err) {
    // fallback to local storage
  }

  // Fallback state
  if (typeof window !== 'undefined') {
    const products = await getProducts();
    const targetProduct = products.find(p => p.id === productId || getProductSlug(p.name) === productId);
    if (targetProduct && targetProduct.status === 'scheduled' && targetProduct.scheduled_for && new Date(targetProduct.scheduled_for) > new Date()) {
      return { success: false, has_upvoted: false, upvotes_count: targetProduct.upvotes_count || 0, productId };
    }

    const rawVotes = (userId && localStorage.getItem(`indihunt_upvotes_${userId}`)) || localStorage.getItem('indihunt_upvotes') || '[]';
    const votes: string[] = JSON.parse(rawVotes);
    const resolvedId = targetProduct?.id || productId;
    const isVoted = votes.includes(resolvedId) || votes.includes(productId);

    let nextVotes: string[];
    if (isVoted) {
      nextVotes = votes.filter(id => id !== resolvedId && id !== productId);
    } else {
      nextVotes = Array.from(new Set([...votes, resolvedId, productId]));
    }
    localStorage.setItem('indihunt_upvotes', JSON.stringify(nextVotes));
    if (userId) {
      localStorage.setItem(`indihunt_upvotes_${userId}`, JSON.stringify(nextVotes));
    }

    const updatedProducts = products.map(p => {
      if (p.id === resolvedId || p.id === productId) {
        const diff = isVoted ? -1 : 1;
        return { ...p, upvotes_count: Math.max(0, (p.upvotes_count || 0) + diff), has_upvoted: !isVoted };
      }
      return p;
    });
    localStorage.setItem('indihunt_products', JSON.stringify(updatedProducts));

    const count = updatedProducts.find(p => p.id === resolvedId || p.id === productId)?.upvotes_count || 0;
    return { success: true, has_upvoted: !isVoted, upvotes_count: count, productId: resolvedId };
  }

  return { success: false, has_upvoted: false, upvotes_count: 0, productId };
}

async function getCommentsRaw(productId?: string, threadId?: string): Promise<Comment[]> {
  function buildTree(list: Comment[]): Comment[] {
    const commentMap: Record<string, Comment> = {};
    list.forEach(c => {
      commentMap[c.id] = {
        ...c,
        replies: c.replies ? [...c.replies] : []
      };
    });

    const roots: Comment[] = [];
    list.forEach(c => {
      const item = commentMap[c.id];
      if (c.parent_id && commentMap[c.parent_id]) {
        const parent = commentMap[c.parent_id];
        if (!parent.replies!.some(r => r.id === c.id)) {
          parent.replies!.push(item);
        }
      } else if (!c.parent_id) {
        roots.push(item);
      }
    });
    return roots;
  }

  try {
    let actualProductId = productId;
    if (productId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      if (!isUUID) {
        const prod = await getProductById(productId);
        if (prod) {
          actualProductId = prod.id;
        } else {
          return [];
        }
      }
    }

    let actualThreadId = threadId;
    if (threadId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId);
      if (!isUUID) {
        const thread = await getThreadById(threadId);
        if (thread) {
          actualThreadId = thread.id;
        } else {
          return [];
        }
      }
    }

    const queryParam = actualProductId ? `productId=${encodeURIComponent(actualProductId)}` : actualThreadId ? `threadId=${encodeURIComponent(actualThreadId)}` : '';
    if (queryParam) {
      const res = await secureApiFetch<Comment[]>(`/t/comments?${queryParam}`);
      if (res && res.success && Array.isArray(res.data)) {
        return buildTree(res.data);
      }
    }
  } catch (err) {
    // fallback
  }

  const cacheKey = productId ? `indihunt_comments_${productId}` : `indihunt_comments_thread_${threadId}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) {
      return [];
    }
    try {
      const list: Comment[] = JSON.parse(cached);
      return buildTree(list);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export const getComments = withCache('comments', getCommentsRaw);

export async function addComment(productId: string | null, userId: string, body: string, parentId?: string | null, threadId?: string): Promise<Comment | null> {
  clearCache();
  const profile: Profile = {
    id: userId,
    username: "explorer",
    full_name: "Curious Explorer",
    is_maker: false
  };

  let actualProductId = productId;
  if (productId) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (!isUUID) {
      const prod = await getProductById(productId);
      actualProductId = prod ? prod.id : null;
    }
  }

  let actualThreadId = threadId;
  if (threadId) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId);
    if (!isUUID) {
      const thread = await getThreadById(threadId);
      actualThreadId = thread ? thread.id : undefined;
    }
  }

  try {
    const res = await secureApiFetch<Comment>('/t/comments', {
      method: 'POST',
      body: JSON.stringify({
        productId: actualProductId || null,
        threadId: actualThreadId || null,
        userId,
        parentId: parentId || null,
        body,
      }),
    });

    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Fallback logic
  if (typeof window !== 'undefined') {
    const cacheKey = productId ? `indihunt_comments_${productId}` : `indihunt_comments_thread_${threadId}`;
    const comments = await getComments(productId || undefined, threadId || undefined);
    const newComment: Comment = {
      id: `comm-dyn-${Date.now()}`,
      product_id: productId || undefined,
      thread_id: threadId,
      user_id: userId,
      user: profile,
      parent_id: parentId || null,
      body,
      created_at: new Date().toISOString(),
      replies: []
    };

    let nextComments: Comment[];
    if (parentId) {
      nextComments = comments.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), newComment] };
        }
        return c;
      });
    } else {
      nextComments = [...comments, newComment];
    }
    localStorage.setItem(cacheKey, JSON.stringify(nextComments));

    // Update comments count in product or thread fallback
    if (productId) {
      const products = await getProducts();
      const updatedProducts = products.map(p => {
        if (p.id === productId) {
          return { ...p, comments_count: p.comments_count + 1 };
        }
        return p;
      });
      localStorage.setItem('indihunt_products', JSON.stringify(updatedProducts));
    } else if (threadId) {
      const threads = await getThreads();
      const updatedThreads = threads.map(t => {
        if (t.id === threadId) {
          return { ...t, comments_count: t.comments_count + 1 };
        }
        return t;
      });
      localStorage.setItem('indihunt_threads', JSON.stringify(updatedThreads));
    }

    return newComment;
  }
  return null;
}

export async function submitProduct(product: Omit<Product, 'id' | 'upvotes_count' | 'comments_count' | 'created_at' | 'maker'>, userId: string): Promise<Product | null> {
  const profile = {
    id: userId,
    username: "maker_new",
    full_name: "Awesome Innovator",
    is_maker: true
  };

  const dupCheck = await checkProductUrlExists(product.website_url);
  if (dupCheck.exists) {
    throw new Error(dupCheck.message || "This product has already been launched on IndiHunt!");
  }

  try {
    const res = await secureApiFetch<Product>(
      '/t/products',
      {
        method: 'POST',
        body: JSON.stringify({
          ...product,
          maker_id: userId,
        }),
      }
    );

    if (res && res.success && res.data) {
      const prodData = res.data;
      if (typeof window !== 'undefined') {
        const products = await getProducts();
        const nextProducts = [prodData, ...products];
        localStorage.setItem('indihunt_products', JSON.stringify(nextProducts));
        const votes: string[] = JSON.parse(localStorage.getItem('indihunt_upvotes') || '[]');
        localStorage.setItem('indihunt_upvotes', JSON.stringify([...votes, prodData.id]));
      }
      return prodData;
    } else if (res && !res.success) {
      throw new Error(res.error || "Failed to submit product launch.");
    }
  } catch (err: any) {
    if (err?.message?.includes("already been launched") || err?.message?.includes("violation")) {
      throw err;
    }
    // fallback to local offline mode
  }

  if (typeof window !== 'undefined') {
    const products = await getProducts();
    const normInput = normalizeProductUrl(product.website_url);
    const domainInput = extractDomainFromUrl(product.website_url);
    // Exclude soft-deleted products from the URL duplicate check
    const existing = products.find(p => {
      if (p.is_deleted) return false;
      const normP = normalizeProductUrl(p.website_url || '');
      const domainP = extractDomainFromUrl(p.website_url || '');
      return normP === normInput || (domainInput.includes('.') && domainP === domainInput);
    });
    if (existing) {
      throw new Error(`This product (${existing.name}) has already been launched on IndiHunt!`);
    }

    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      maker_id: userId,
      maker: profile,
      upvotes_count: 1, // Start with self-upvote
      comments_count: 0,
      created_at: new Date().toISOString(),
      has_upvoted: true
    };

    const nextProducts = [newProduct, ...products];
    localStorage.setItem('indihunt_products', JSON.stringify(nextProducts));

    // Set self-upvote in votes
    const votes: string[] = JSON.parse(localStorage.getItem('indihunt_upvotes') || '[]');
    localStorage.setItem('indihunt_upvotes', JSON.stringify([...votes, newProduct.id]));

    return newProduct;
  }
  return null;
}

export async function signInWithGoogle() {
  if (supabase && typeof window !== 'undefined') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (data?.url) {
        window.location.href = data.url;
        return { data, error };
      }
    } catch (e) {
      console.warn('[signInWithGoogle] Client direct OAuth failed, falling back:', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/t/auth/login?provider=google';
  }
  return { data: null, error: null };
}

export async function signInWithGithub() {
  if (supabase && typeof window !== 'undefined') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (data?.url) {
        window.location.href = data.url;
        return { data, error };
      }
    } catch (e) {
      console.warn('[signInWithGithub] Client direct OAuth failed, falling back:', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/t/auth/login?provider=github';
  }
  return { data: null, error: null };
}

export async function signOut() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Supabase signOut error:", e);
    }
  }

  try {
    await fetch('/t/auth/signout', { method: 'POST' });
  } catch (err) {
    console.error("SignOut API Error:", err);
  }

  // Wipe ALL in-memory caches so stale has_upvoted values don't survive logout
  clearCache();

  if (typeof window !== 'undefined') {
    try {
      // 1. Wipe user data and Supabase auth sb- tokens, BUT strictly preserve cookie consent & theme preferences
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        // Never delete cookie consent preferences or theme
        if (
          k === 'indihunt_cookie_consent_v1' ||
          k.includes('cookie_consent') ||
          k.includes('cookie_preference') ||
          k === 'theme'
        ) {
          return;
        }
        if (k.startsWith('ih_') || k.startsWith('indihunt_') || k.startsWith('sb-')) {
          localStorage.removeItem(k);
        }
      });
      sessionStorage.clear();

      // 2. Clear ONLY Supabase auth session cookies; never delete cookie consent preferences
      document.cookie.split(";").forEach((c) => {
        const trimmed = c.trim();
        const cookieName = trimmed.split("=")[0];
        if (
          cookieName.startsWith("sb-") ||
          cookieName.includes("auth-token") ||
          cookieName.includes("access_token") ||
          cookieName.includes("refresh_token")
        ) {
          document.cookie = cookieName + "=;expires=" + new Date(0).toUTCString() + ";path=/";
        }
      });

      // 3. Strip any leftover tokens/hashes from the address bar
      window.history.replaceState(null, "", "/");
    } catch (e) { }
  }
}

async function getUserProfileRaw(userId: string) {
  if (!userId) return null;
  try {
    const res = await secureApiFetch<Profile>(`/t/profiles?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  const allUsers = await getAllUsersAdmin();
  const found = allUsers.find(u => u.id === userId);
  if (found) return found;

  return MOCK_PROFILES[userId] || null;
}

export const getUserProfile = withCache('user_profile', getUserProfileRaw);

async function getUserProfileByUsernameRaw(username: string) {
  const cleaned = username.replace(/^@/, '').toLowerCase().trim();
  if (!cleaned) return null;

  try {
    const res = await secureApiFetch<Profile>(`/t/profiles?username=${encodeURIComponent(cleaned)}`);
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  const found = Object.values(MOCK_PROFILES).find(p => p.username.toLowerCase() === cleaned);
  return found || null;
}

export const getUserProfileByUsername = withCache('user_profile_by_username', getUserProfileByUsernameRaw);

export async function updateUserProfile(userId: string, updates: any) {
  clearCache(`user_profile_${userId}`);
  clearCache('user_profile_by_username');

  // Helper to update local storage profile cache
  const syncLocalStorageProfile = (baseProfile: any) => {
    if (typeof window === "undefined") return baseProfile;
    try {
      const merged = { ...(baseProfile || {}), ...updates, id: userId };
      localStorage.setItem(`ih_profile_${userId}`, JSON.stringify(merged));

      const profiles: Profile[] = JSON.parse(localStorage.getItem('indihunt_profiles') || '[]');
      const idx = profiles.findIndex(p => p.id === userId || (merged.username && p.username === merged.username));
      if (idx >= 0) {
        profiles[idx] = { ...profiles[idx], ...merged };
      } else {
        profiles.push(merged as Profile);
      }
      localStorage.setItem('indihunt_profiles', JSON.stringify(profiles));
      return merged;
    } catch (e) {
      return baseProfile;
    }
  };

  let resultData: any = null;

  try {
    const res = await secureApiFetch<Profile>('/t/profiles', {
      method: 'PUT',
      body: JSON.stringify({ userId, updates }),
    });
    if (res && res.success && res.data) {
      resultData = res.data;
    }
  } catch (e) {
    // fallback
  }

  if (!resultData) {
    let localCache: any = null;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`ih_profile_${userId}`);
        if (raw) localCache = JSON.parse(raw);
      } catch (e) { }
    }
    resultData = syncLocalStorageProfile(localCache || { id: userId });
  } else {
    syncLocalStorageProfile(resultData);
  }

  return resultData;
}


export function getProductSlug(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/&#x27;|&apos;|'/gi, '')
    .replace(/&amp;/gi, 'and')
    .replace(/&quot;|"/gi, '')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CATEGORY_SLUG_MAP: Record<string, string> = {
  "SaaS": "saas",
  "Artificial Intelligence": "artificial-intelligence",
  "AI Agents & Automation": "ai-agents-automation",
  "Productivity": "productivity",
  "Marketing Tools": "marketing-tools",
  "Finance & FinTech": "finance-fintech",
  "Finance & Fintech": "finance-fintech",
  "Developer Tools": "developer-tools",
  "APIs & Integrations": "apis-integrations",
  "Open Source": "open-source",
  "Design Tools": "design-tools",
  "Mobile Apps": "mobile-apps",
  "Web3 & Crypto": "web3-crypto",
  "E-Commerce & Retail": "e-commerce-retail",
  "Health & Fitness": "health-fitness",
  "Education & EdTech": "education-edtech",
  "Analytics & Data": "analytics-data",
  "Cybersecurity": "cybersecurity",
  "Social & Community": "social-community",
  "Media & Entertainment": "media-entertainment",
  "No-Code & Low-Code": "no-code-low-code",
  "Customer Support & CRM": "customer-support-crm",
  "Customer Support Tools": "customer-support-crm",
  "AR/VR": "ar-vr",
  "AI Notetakers": "ai-notetakers",
  "AI Presentation Software": "presentation-software",
  "AI Workflow Automation": "workflow-automation",
  "AI Coding Agents": "ai-coding-agents",
  "AI Code Editors": "ai-code-editors",
  "AI Code Testing": "ai-code-testing",
  "AI Databases": "ai-databases",
  "Vibe Coding Tools": "vibe-coding",
  "3D & Animation": "3d-animation",
  "AI Generative Media": "ai-generative-media",
  "Accounting Software": "accounting",
  "Budgeting Apps": "budgeting",
  "Invoicing Tools": "invoicing",
  "Legal Services": "legal-services",
  "AI Sales Tools": "ai-sales-tools",
  "CRM Software": "crm-software"
};

export function getCategorySlug(category: string): string {
  if (!category) return "";
  const trimmed = category.trim();
  if (CATEGORY_SLUG_MAP[trimmed]) return CATEGORY_SLUG_MAP[trimmed];
  return trimmed
    .toLowerCase()
    .replace(/&#x27;|&apos;|'/gi, '')
    .replace(/&amp;/gi, 'and')
    .replace(/&/g, '')
    .replace(/&quot;|"/gi, '')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getProductByIdRaw(id: string, currentUserId?: string): Promise<Product | null> {
  if (!id) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const normalizedKey = id.toLowerCase();

  // 1. High-speed cache check for public/guest SSR (< 1ms)
  if (!currentUserId) {
    const cachedItem = await getRedisCache<Product>(`public_product_${normalizedKey}`);
    if (cachedItem) return cachedItem;

    // Check if we already have the public products list in Redis / Memory
    const cachedList = await getRedisCache<Product[]>('public_products');
    if (cachedList && cachedList.length > 0) {
      const match = cachedList.find(p => p.id === id || getProductSlug(p.name) === normalizedKey);
      if (match) {
        setRedisCache(`public_product_${normalizedKey}`, match, 120).catch(() => { });
        setRedisCache(`public_product_${match.id}`, match, 120).catch(() => { });
        return match;
      }
    }
  }

  // 2. Direct Supabase query during SSR / Server execution (0ms network loopback overhead)
  if (typeof window === 'undefined' && supabase) {
    try {
      const DETAIL_COLUMNS = '*, maker:profiles!maker_id(id, username, full_name, avatar_url, bio, headline, website, twitter_url, karma_points, streak_count, is_maker)';
      let dbProduct: any = null;
      if (isUUID) {
        const { data } = await supabase
          .from('products')
          .select(DETAIL_COLUMNS)
          .eq('id', id)
          .maybeSingle();
        dbProduct = data;
      }
      if (!dbProduct) {
        const decodedId = decodeURIComponent(id).toLowerCase().trim();
        const { data: matched } = await supabase
          .from('products')
          .select(DETAIL_COLUMNS)
          .or(`slug.eq.${normalizedKey},name.ilike.${decodedId}`)
          .limit(1)
          .maybeSingle();
        dbProduct = matched;
      }
      if (dbProduct) {
        if (currentUserId) {
          const { data: upvote } = await supabase
            .from('upvotes')
            .select('id')
            .eq('product_id', dbProduct.id)
            .eq('user_id', currentUserId)
            .maybeSingle();
          dbProduct.has_upvoted = !!upvote;
        } else {
          dbProduct.has_upvoted = false;
        }
        return dbProduct as Product;
      }
    } catch { }
  }

  try {
    const query = currentUserId ? `?userId=${encodeURIComponent(currentUserId)}` : '';
    const res = await secureApiFetch<Product>(`/t/products/${encodeURIComponent(id)}${query}`);
    if (res && res.data && res.data.id) {
      if (!currentUserId) {
        const productSlug = getProductSlug(res.data.name);
        setRedisCache(`public_product_${normalizedKey}`, res.data, 120).catch(() => { });
        setRedisCache(`public_product_${res.data.id}`, res.data, 120).catch(() => { });
        if (productSlug !== normalizedKey) {
          setRedisCache(`public_product_${productSlug}`, res.data, 120).catch(() => { });
        }
      }
      return res.data;
    }
  } catch { }

  const products = await getProducts(currentUserId);
  return products.find(p =>
    p.id === id ||
    getProductSlug(p.name).toLowerCase() === normalizedKey ||
    ((p as any).slug && (p as any).slug.toLowerCase() === normalizedKey) ||
    p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalizedKey
  ) || null;
}

export const getProductById = reactCache(getProductByIdRaw);


function getLocalThreadsFallback(currentUserId?: string): Thread[] {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_threads');
    if (cached) {
      try {
        const threads: Thread[] = JSON.parse(cached);
        if (currentUserId) {
          const rawVotes = localStorage.getItem(`indihunt_thread_upvotes_${currentUserId}`) || localStorage.getItem('indihunt_thread_upvotes');
          const votes: string[] = JSON.parse(rawVotes || '[]');
          const votedSet = new Set(votes);
          return threads.map(t => ({
            ...t,
            has_upvoted: votedSet.has(t.id)
          }));
        }
        return threads;
      } catch (e) {
        console.error(e);
      }
    }
  }
  return [];
}

async function getThreadsRaw(currentUserId?: string): Promise<Thread[]> {
  // 1. High-speed cache check for public/guest SSR (< 1ms)
  if (!currentUserId) {
    const cachedThreads = await getRedisCache<Thread[]>('public_threads');
    if (cachedThreads && Array.isArray(cachedThreads) && cachedThreads.length > 0) {
      return cachedThreads;
    }
  }

  // 2. Direct Supabase query during SSR / Server execution (0ms network loopback overhead)
  if (typeof window === 'undefined' && supabase) {
    try {
      const { data: dbThreads } = await supabase
        .from('threads')
        .select('*, author:profiles!author_id(*)')
        .order('created_at', { ascending: false });

      if (dbThreads && dbThreads.length > 0) {
        if (!currentUserId) {
          setRedisCache('public_threads', dbThreads, 60).catch(() => { });
        }
        return dbThreads as Thread[];
      }
    } catch { }
  }

  try {
    const url = `/t/threads${currentUserId ? `?userId=${encodeURIComponent(currentUserId)}` : ''}`;
    const res = await secureApiFetch<Thread[]>(url);
    if (res && res.success && Array.isArray(res.data)) {
      if (!currentUserId && res.data.length > 0) {
        setRedisCache('public_threads', res.data, 60).catch(() => { });
      }
      return res.data;
    }
  } catch (err) {
    // fallback to local storage
  }

  return getLocalThreadsFallback(currentUserId);
}

export const getThreads = getThreadsRaw;

async function getThreadByIdRaw(id: string, currentUserId?: string): Promise<Thread | null> {
  try {
    const url = `/t/threads/${encodeURIComponent(id)}${currentUserId ? `?userId=${encodeURIComponent(currentUserId)}` : ''}`;
    const res = await secureApiFetch<Thread>(url);
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  const threads = await getThreads(currentUserId);
  return threads.find(t => t.id === id || getProductSlug(t.title) === id.toLowerCase()) || null;
}

export const getThreadById = getThreadByIdRaw;

export async function createThread(thread: Omit<Thread, 'id' | 'upvotes_count' | 'comments_count' | 'created_at'>, userId: string): Promise<Thread | null> {
  try {
    const res = await secureApiFetch<Thread>('/t/threads', {
      method: 'POST',
      body: JSON.stringify({
        ...thread,
        userId,
      }),
    });

    if (res && res.success && res.data) {
      if (typeof window !== 'undefined') {
        const threads = await getThreads();
        const nextThreads = [res.data, ...threads];
        localStorage.setItem('indihunt_threads', JSON.stringify(nextThreads));
      }
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  if (typeof window !== 'undefined') {
    const threads = await getThreads();
    const newThread: Thread = {
      ...thread,
      id: `thread-${Date.now()}`,
      user_id: userId,
      user: { id: userId, username: "maker", full_name: "Anonymous Maker", is_maker: true },
      upvotes_count: 1,
      comments_count: 0,
      created_at: new Date().toISOString(),
      has_upvoted: true
    };
    const nextThreads = [newThread, ...threads];
    localStorage.setItem('indihunt_threads', JSON.stringify(nextThreads));
    return newThread;
  }
  return null;
}

export async function toggleThreadUpvote(threadId: string, userId: string): Promise<{ success: boolean; upvotes_count: number }> {
  clearCache('threads');

  try {
    const res = await secureApiFetch<{ success: boolean; has_upvoted: boolean; upvotes_count: number }>(
      `/t/threads/${encodeURIComponent(threadId)}/upvote`,
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }
    );

    const data: any = res?.data || res;
    if (res && res.success) {
      const hasUpvoted = Boolean(data?.has_upvoted ?? res?.has_upvoted);
      const upvotesCount = typeof data?.upvotes_count === 'number'
        ? data.upvotes_count
        : (typeof res?.upvotes_count === 'number' ? res.upvotes_count : 0);

      if (typeof window !== 'undefined') {
        const rawVotes = localStorage.getItem(`indihunt_thread_upvotes_${userId}`) || localStorage.getItem('indihunt_thread_upvotes');
        const votes: string[] = JSON.parse(rawVotes || '[]');
        let nextVotes: string[];
        if (hasUpvoted) {
          nextVotes = Array.from(new Set([...votes, threadId]));
        } else {
          nextVotes = votes.filter(id => id !== threadId);
        }
        localStorage.setItem('indihunt_thread_upvotes', JSON.stringify(nextVotes));
        if (userId) {
          localStorage.setItem(`indihunt_thread_upvotes_${userId}`, JSON.stringify(nextVotes));
        }
      }
      return { success: true, upvotes_count: upvotesCount };
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const threads = await getThreads();
    const rawVotes = (userId && localStorage.getItem(`indihunt_thread_upvotes_${userId}`)) || localStorage.getItem('indihunt_thread_upvotes') || '[]';
    const votes: string[] = JSON.parse(rawVotes);
    const isVoted = votes.includes(threadId);

    let nextVotes: string[];
    if (isVoted) {
      nextVotes = votes.filter(id => id !== threadId);
    } else {
      nextVotes = [...votes, threadId];
    }
    localStorage.setItem('indihunt_thread_upvotes', JSON.stringify(nextVotes));
    if (userId) {
      localStorage.setItem(`indihunt_thread_upvotes_${userId}`, JSON.stringify(nextVotes));
    }

    const updatedThreads = threads.map(t => {
      if (t.id === threadId) {
        const diff = isVoted ? -1 : 1;
        return { ...t, upvotes_count: Math.max(0, (t.upvotes_count || 0) + diff), has_upvoted: !isVoted };
      }
      return t;
    });
    localStorage.setItem('indihunt_threads', JSON.stringify(updatedThreads));

    const count = updatedThreads.find(t => t.id === threadId)?.upvotes_count || 0;
    return { success: true, upvotes_count: count };
  }

  return { success: false, upvotes_count: 0 };
}

export async function fetchUrlMetadata(url: string): Promise<{ name: string; tagline: string; description: string; logo_url: string }> {
  try {
    const res = await secureApiFetch<{ name: string; tagline: string; description: string; logo_url: string }>('/t/scrape', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
    if (res && res.success && res.data) {
      return {
        name: res.data.name || "New Launch",
        tagline: res.data.tagline || "Awesome product launched on IndiHunt",
        description: res.data.description || "",
        logo_url: res.data.logo_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80"
      };
    }
  } catch (error) {
    console.error("fetchUrlMetadata client error:", error);
  }

  const hostname = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
  const capitalizedName = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  return {
    name: capitalizedName || "New Launch",
    tagline: `Awesome solutions built by ${capitalizedName} team`,
    description: `Discover new possibilities with ${capitalizedName}.`,
    logo_url: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80`
  };
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
  clearCache();

  // Clean up non-column or relational fields from payload before sending to Supabase
  const allowedDbFields = [
    'name', 'tagline', 'description', 'website_url', 'logo_url', 'screenshots',
    'twitter_url', 'facebook_url', 'instagram_url', 'linkedin_url', 'medium_url',
    'github_url', 'video_url', 'show_pre_launch', 'worked_on_launch', 'funding_type',
    'status', 'scheduled_for', 'pricing_type', 'promo_offer', 'promo_code',
    'promo_expiry', 'country', 'is_open_source', 'is_student_project', 'featured',
    'tags'
  ];

  let updatePayload: any = {};
  Object.keys(updates).forEach(key => {
    if (allowedDbFields.includes(key) && (updates as any)[key] !== undefined) {
      updatePayload[key] = (updates as any)[key];
    }
  });

  let updatedResult: Product | null = null;

  try {
    const res = await secureApiFetch<Product>(
      `/t/products/${encodeURIComponent(productId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      }
    );

    if (res && res.success && res.data) {
      updatedResult = res.data;
    }
  } catch (err) {
    // fallback to local storage
  }

  // Always update local storage and clear caches so UI, queries, and fallbacks remain in sync
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('indihunt_products');
      if (raw) {
        const products: Product[] = JSON.parse(raw);
        const nextProducts = products.map(p => {
          if (p.id === productId || getProductSlug(p.name) === productId) {
            return { ...p, ...updates, ...(updatedResult || {}) };
          }
          return p;
        });
        localStorage.setItem('indihunt_products', JSON.stringify(nextProducts));
      }
    } catch (e) { }
  }

  return updatedResult || (typeof window !== 'undefined' ? (await getProducts()).find(p => p.id === productId || getProductSlug(p.name) === productId) || null : null);
}

export async function deleteProduct(productId: string): Promise<boolean> {
  clearCache();

  try {
    await secureApiFetch(`/t/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
  } catch (e) { }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('indihunt_products');
      if (raw) {
        const products: Product[] = JSON.parse(raw);
        // Remove or mark is_deleted: true
        const nextProducts = products.filter(p => p.id !== productId && getProductSlug(p.name) !== productId);
        localStorage.setItem('indihunt_products', JSON.stringify(nextProducts));
      }
    } catch (e) { }
  }
  return true;
}

export async function getProductMembers(productId: string): Promise<Profile[]> {
  try {
    const res = await secureApiFetch<Profile[]>(`/t/products/${encodeURIComponent(productId)}/members`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) { }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_members_${productId}`;
    const cached = localStorage.getItem(key);
    if (!cached) {
      // Return a default mock co-maker
      const defaultMembers: Profile[] = [];
      localStorage.setItem(key, JSON.stringify(defaultMembers));
      return defaultMembers;
    }
    return JSON.parse(cached);
  }
  return [];
}

export async function inviteProductMember(productId: string, usernameOrEmail: string): Promise<Profile | null> {
  try {
    const profileRes = await secureApiFetch<Profile>(`/t/profiles?username=${encodeURIComponent(usernameOrEmail.trim())}`);
    if (!profileRes.success || !profileRes.data) {
      throw new Error("User not found on IndiHunt.");
    }
    const userProfile = profileRes.data;

    const res = await secureApiFetch(`/t/products/${encodeURIComponent(productId)}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId: userProfile.id, role: 'member' })
    });

    if (!res.success) {
      throw new Error(res.error || "This user is already a member of your product.");
    }

    return userProfile;
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.message?.includes("already a member")) {
      throw err;
    }
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const profiles: Profile[] = [];
    const matched = profiles.find(p =>
      p.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
      (p.work_email && p.work_email.toLowerCase() === usernameOrEmail.toLowerCase())
    );

    if (!matched) {
      const newMockProfile: Profile = {
        id: `user-dyn-${Date.now()}`,
        username: usernameOrEmail.split('@')[0].toLowerCase(),
        full_name: usernameOrEmail.split('@')[0].charAt(0).toUpperCase() + usernameOrEmail.split('@')[0].slice(1),
        is_maker: true,
        avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`
      };
      const key = `indihunt_members_${productId}`;
      const current = await getProductMembers(productId);
      localStorage.setItem(key, JSON.stringify([...current, newMockProfile]));
      return newMockProfile;
    }

    const key = `indihunt_members_${productId}`;
    const current = await getProductMembers(productId);
    if (current.some(m => m.id === matched.id)) {
      throw new Error("This user is already a member of your product.");
    }
    localStorage.setItem(key, JSON.stringify([...current, matched]));
    return matched;
  }
  return null;
}

async function compressImage(file: File, maxSizeBytes: number = 100 * 1024): Promise<File> {
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const checkAndResolve = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Fallback to jpeg if WebP canvas export is unsupported
                canvas.toBlob(
                  (jpegBlob) => {
                    if (!jpegBlob) {
                      resolve(file);
                      return;
                    }
                    const compressedFile = new File([jpegBlob], file.name, {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  },
                  "image/jpeg",
                  quality
                );
                return;
              }
              if (blob.size <= maxSizeBytes || quality <= 0.1) {
                const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                const compressedFile = new File([blob], newName, {
                  type: "image/webp",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                checkAndResolve();
              }
            },
            "image/webp",
            quality
          );
        };
        checkAndResolve();
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(bucketName: string, file: File, filePath: string): Promise<string | null> {
  let fileToUpload = file;
  if (file.type.startsWith("image/")) {
    try {
      fileToUpload = await compressImage(file, 100 * 1024);
    } catch (err) {
      console.error("Compression failed, uploading original:", err);
    }
  }

  if (!supabase) {
    if (typeof window !== "undefined") {
      return URL.createObjectURL(fileToUpload);
    }
    return null;
  }

  // Ensure storage bucket exists
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (buckets && !buckets.some(b => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, {
        public: true
      });
    }
  } catch (err) {
    console.warn("Storage bucket auto-creation check failed or skipped:", err);
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("Error uploading image:", error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteImage(bucketName: string, publicUrl: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const urlParts = publicUrl.split(`/object/public/${bucketName}/`);
    if (urlParts.length !== 2) {
      console.warn("Could not parse file path from URL:", publicUrl);
      return false;
    }
    const filePath = urlParts[1];
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      console.error("Error deleting image:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception deleting image:", err);
    return false;
  }
}

// --- Reviews API ---
async function getReviewsRaw(productId: string): Promise<Review[]> {
  try {
    const res = await secureApiFetch<Review[]>(`/t/reviews?productId=${encodeURIComponent(productId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_reviews_${productId}`;
    const cached = localStorage.getItem(key);
    if (!cached) {
      return [];
    }
    return JSON.parse(cached);
  }
  return [];
}

export const getReviews = withCache('reviews', getReviewsRaw);

export async function addReview(
  productId: string,
  userId: string,
  rating: number,
  body: string,
  details?: {
    easy_to_use?: number;
    customizable?: number;
    reliable?: number;
    value_for_money?: number;
    pros?: string[];
    cons?: string[];
    alternatives_vs?: string;
  }
): Promise<Review | null> {
  clearCache();
  const profile = {
    id: userId,
    username: "reviewer",
    full_name: "Valued Reviewer",
    is_maker: false
  };

  try {
    const res = await secureApiFetch<Review>('/t/reviews', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        userId,
        rating,
        body,
        easy_to_use: details?.easy_to_use,
        customizable: details?.customizable,
        reliable: details?.reliable,
        value_for_money: details?.value_for_money,
        pros: details?.pros || [],
        cons: details?.cons || [],
        alternatives_vs: details?.alternatives_vs,
      }),
    });

    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_reviews_${productId}`;
    const reviews = await getReviews(productId);
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      product_id: productId,
      user_id: userId,
      user: profile,
      rating,
      body,
      easy_to_use: details?.easy_to_use,
      customizable: details?.customizable,
      reliable: details?.reliable,
      value_for_money: details?.value_for_money,
      pros: details?.pros || [],
      cons: details?.cons || [],
      alternatives_vs: details?.alternatives_vs,
      created_at: new Date().toISOString()
    };
    const nextReviews = [newReview, ...reviews];
    localStorage.setItem(key, JSON.stringify(nextReviews));
    return newReview;
  }
  return null;
}


// --- Alternatives API ---
export async function getAlternatives(productId: string, currentUserId?: string): Promise<AlternativeProduct[]> {
  try {
    const url = `/t/alternatives?productId=${encodeURIComponent(productId)}${currentUserId ? `&userId=${encodeURIComponent(currentUserId)}` : ''}`;
    const res = await secureApiFetch<AlternativeProduct[]>(url);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_alternatives_${productId}`;
    const cached = localStorage.getItem(key);
    let alternatives: AlternativeProduct[] = [];
    if (!cached) {
      // Suggest some default alternatives from existing mock products
      const allProducts = await getProducts();
      const otherProducts = allProducts.filter(p => p.id !== productId);
      alternatives = otherProducts.slice(0, 2).map((p, idx) => ({
        id: `alt-dyn-${idx}-${productId}`,
        product_id: productId,
        alternative_id: p.id,
        created_by: 'user-1',
        votes_count: 5 - idx,
        created_at: new Date().toISOString(),
        alternative_product: p,
        has_voted: false
      }));
      localStorage.setItem(key, JSON.stringify(alternatives));
    } else {
      alternatives = JSON.parse(cached);
    }

    const votesKey = `indihunt_alt_votes_${currentUserId || 'guest'}`;
    const votes: string[] = JSON.parse(localStorage.getItem(votesKey) || '[]');
    return alternatives.map(alt => ({
      ...alt,
      has_voted: votes.includes(alt.id)
    }));
  }
  return [];
}

export async function addAlternative(productId: string, alternativeId: string, userId: string): Promise<AlternativeProduct | null> {
  clearCache();
  try {
    const res = await secureApiFetch<AlternativeProduct>('/t/alternatives', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        productId,
        alternativeProductId: alternativeId,
        userId,
      }),
    });

    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_alternatives_${productId}`;
    const alternatives = await getAlternatives(productId);
    if (alternatives.some(a => a.alternative_id === alternativeId)) {
      return null;
    }
    const allProducts = await getProducts();
    const altProd = allProducts.find(p => p.id === alternativeId);
    if (!altProd) return null;

    const newAlt: AlternativeProduct = {
      id: `alt-dyn-${Date.now()}`,
      product_id: productId,
      alternative_id: alternativeId,
      created_by: userId,
      votes_count: 1,
      created_at: new Date().toISOString(),
      alternative_product: altProd,
      has_voted: true
    };

    const nextAlts = [...alternatives, newAlt];
    localStorage.setItem(key, JSON.stringify(nextAlts));

    // Mark as voted in fallback storage
    const votesKey = `indihunt_alt_votes_${userId}`;
    const votes: string[] = JSON.parse(localStorage.getItem(votesKey) || '[]');
    localStorage.setItem(votesKey, JSON.stringify([...votes, newAlt.id]));

    return newAlt;
  }
  return null;
}

export async function toggleAlternativeVote(alternativeId: string, productId: string, userId: string): Promise<{ success: boolean; votes_count: number }> {
  try {
    const res = await secureApiFetch<{ success: boolean; votes_count: number; has_voted: boolean }>('/t/alternatives', {
      method: 'POST',
      body: JSON.stringify({
        action: 'vote',
        productId,
        alternativeId,
        userId,
      }),
    });

    if (res && res.success) {
      return { success: true, votes_count: res.votes_count || 0 };
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_alternatives_${productId}`;
    const alternatives = await getAlternatives(productId);
    const votesKey = `indihunt_alt_votes_${userId}`;
    const votes: string[] = JSON.parse(localStorage.getItem(votesKey) || '[]');
    const isVoted = votes.includes(alternativeId);

    let nextVotes: string[];
    if (isVoted) {
      nextVotes = votes.filter(id => id !== alternativeId);
    } else {
      nextVotes = [...votes, alternativeId];
    }
    localStorage.setItem(votesKey, JSON.stringify(nextVotes));

    const updated = alternatives.map(alt => {
      if (alt.id === alternativeId) {
        const diff = isVoted ? -1 : 1;
        return { ...alt, votes_count: alt.votes_count + diff };
      }
      return alt;
    });
    localStorage.setItem(key, JSON.stringify(updated));

    const count = updated.find(a => a.id === alternativeId)?.votes_count || 0;
    return { success: true, votes_count: count };
  }
  return { success: false, votes_count: 0 };
}


// --- Product specific forum threads ---
export async function getProductThreads(productId: string, currentUserId?: string): Promise<Thread[]> {
  try {
    const url = `/t/threads?productId=${encodeURIComponent(productId)}${currentUserId ? `&userId=${encodeURIComponent(currentUserId)}` : ''}`;
    const res = await secureApiFetch<Thread[]>(url);
    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch { }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_threads_${productId}`;
    const cached = localStorage.getItem(key);
    if (!cached) {
      const initial: Thread[] = [
        {
          id: `thread-1-${productId}`,
          title: `How are you using this product in your daily workflow?`,
          body: `Love to know feedback, usecases, and any integration suggestions you have for the developers!`,
          user_id: 'user-2',
          user: MOCK_PROFILES['user-2'],
          category: 'General',
          upvotes_count: 3,
          comments_count: 0,
          created_at: new Date().toISOString(),
          product_id: productId
        }
      ];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(cached);
  }
  return [];
}

export async function createProductThread(
  productId: string,
  thread: Omit<Thread, 'id' | 'upvotes_count' | 'comments_count' | 'created_at'>,
  userId: string
): Promise<Thread | null> {
  try {
    const res = await secureApiFetch<Thread>('/t/threads', {
      method: 'POST',
      body: JSON.stringify({
        ...thread,
        productId,
        userId
      })
    });
    if (res && res.data && res.data.id) {
      clearCache();
      return res.data;
    }
  } catch { }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_threads_${productId}`;
    const threads = await getProductThreads(productId);
    const newThread: Thread = {
      ...thread,
      id: `thread-dyn-${Date.now()}`,
      product_id: productId,
      user_id: userId,
      user: MOCK_PROFILES[userId] || { id: userId, username: "maker", full_name: "Anonymous Maker", is_maker: true },
      upvotes_count: 1,
      comments_count: 0,
      created_at: new Date().toISOString(),
      has_upvoted: true
    };
    localStorage.setItem(key, JSON.stringify([newThread, ...threads]));
    return newThread;
  }
  return null;
}

export async function deleteProductThread(threadId: string, productId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ deleted: boolean }>(`/t/threads/${encodeURIComponent(threadId)}`, {
      method: 'DELETE'
    });
    if (res && res.deleted) {
      return true;
    }
  } catch { }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = `indihunt_threads_${productId}`;
    const threads = await getProductThreads(productId);
    const updated = threads.filter(t => t.id !== threadId);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  }
  return false;
}

// --- Reports API ---
export async function reportProduct(
  productId: string,
  userId: string | null,
  reason: string,
  description?: string
): Promise<{ success: boolean; alreadyReported?: boolean }> {
  try {
    const res = await secureApiFetch<{ success: boolean; alreadyReported?: boolean }>('/t/reports', {
      method: 'POST',
      body: JSON.stringify({ productId, userId, reason, description }),
    });
    if (res && res.success) {
      return res;
    }
  } catch { }

  // Fallback
  if (typeof window !== 'undefined') {
    const key = 'indihunt_product_reports';
    const cached = localStorage.getItem(key) || '[]';
    try {
      const list: any[] = JSON.parse(cached);
      const exists = list.some((r: any) => r.product_id === productId && (userId ? r.user_id === userId : false));
      if (exists) return { success: false, alreadyReported: true };
      list.push({
        id: crypto.randomUUID(),
        product_id: productId,
        user_id: userId,
        reason,
        description: description || null,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(key, JSON.stringify(list));
      return { success: true };
    } catch (e) {
      console.error("Error reporting product in localStorage:", e);
    }
  }

  return { success: true };
}

// --- Investor details & Shoutouts API ---

export async function submitProductInvestorDetails(details: ProductInvestorDetails): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ success: boolean }>(
      `/t/products/${encodeURIComponent(details.product_id)}/investor-details`,
      {
        method: 'POST',
        body: JSON.stringify(details),
      }
    );
    if (res && res.success) {
      return true;
    }
  } catch { }

  // Local storage mock
  if (typeof window !== 'undefined') {
    const cached = JSON.parse(localStorage.getItem('indihunt_investor_details') || '{}');
    cached[details.product_id] = details;
    localStorage.setItem('indihunt_investor_details', JSON.stringify(cached));
    return true;
  }
  return false;
}

export async function submitProductShoutouts(
  productId: string,
  shoutouts: { shouted_product_id?: string; name?: string; logo_url?: string; note: string }[]
): Promise<boolean> {
  const validShoutouts = shoutouts.filter(s => (s.shouted_product_id && s.shouted_product_id.trim() !== "") || (s.name && s.name.trim() !== ""));
  if (validShoutouts.length === 0) return true;

  const products = await getProducts();
  const resolvedShoutouts: { product_id: string; shouted_product_id: string; note: string; logo_url?: string }[] = [];
  const shoutoutNames: string[] = [];
  const shoutoutNotes: Record<string, string> = {};
  const shoutoutLogos: Record<string, string> = {};

  for (const s of validShoutouts) {
    let targetId = s.shouted_product_id?.trim();
    let shoutName = s.name?.trim();
    let logoUrl = s.logo_url?.trim();

    if (!shoutName && targetId) {
      const match = products.find(p => p.id === targetId);
      if (match) {
        shoutName = match.name;
        if (!logoUrl) logoUrl = match.logo_url;
      }
    }

    if (!targetId && shoutName) {
      const cleanName = shoutName.toLowerCase();
      const match = products.find(p => p.name.toLowerCase().includes(cleanName) || cleanName.includes(p.name.toLowerCase()));
      if (match) {
        targetId = match.id;
        if (!logoUrl) logoUrl = match.logo_url;
      } else {
        targetId = `synth-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      }
    }

    if (shoutName) {
      shoutoutNames.push(shoutName);
      shoutoutNotes[shoutName] = s.note;
      if (logoUrl) shoutoutLogos[shoutName] = logoUrl;
    }

    if (targetId) {
      resolvedShoutouts.push({
        product_id: productId,
        shouted_product_id: targetId,
        note: s.note || `Used ${shoutName || 'tool'} for development & workflow.`,
        logo_url: logoUrl
      });
    }
  }

  // 1. Update localStorage indihunt_shoutouts
  if (typeof window !== 'undefined') {
    const cached: any[] = JSON.parse(localStorage.getItem('indihunt_shoutouts') || '[]');
    const rest = cached.filter(s => s.product_id !== productId);
    const newShoutouts = validShoutouts.map((s, idx) => {
      const targetId = s.shouted_product_id?.trim() || `synth-${idx}`;
      const matchedProd = products.find(p => p.id === targetId);
      const shoutName = s.name?.trim() || matchedProd?.name || `Tool ${idx + 1}`;
      const logoUrl = s.logo_url?.trim() || matchedProd?.logo_url;
      return {
        id: `shout-${Date.now()}-${idx}`,
        product_id: productId,
        shouted_product_id: targetId,
        shouted_product_name: shoutName,
        name: shoutName,
        logo_url: logoUrl,
        note: s.note,
        created_at: new Date().toISOString()
      };
    });
    localStorage.setItem('indihunt_shoutouts', JSON.stringify([...rest, ...newShoutouts]));
  }

  // 2. Save shoutout_names, shoutout_notes & shoutout_logos to product record in DB / LocalStorage
  if (shoutoutNames.length > 0) {
    await updateProduct(productId, {
      shoutout_names: shoutoutNames,
      shoutout_notes: shoutoutNotes,
      shoutout_logos: shoutoutLogos
    }).catch(() => { });
  }

  // 3. Send to API endpoint
  try {
    if (resolvedShoutouts.length > 0) {
      await secureApiFetch('/t/shoutouts', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          shoutouts: resolvedShoutouts,
        }),
      });
    }
  } catch (e) {
    // fallback
  }

  clearCache();
  return true;
}

export async function getProductShoutouts(productId: string): Promise<ProductShoutout[]> {
  try {
    const res = await secureApiFetch<ProductShoutout[]>(`/t/shoutouts?shouted_product_id=${encodeURIComponent(productId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Local storage mock
  if (typeof window !== 'undefined') {
    const shoutouts: any[] = JSON.parse(localStorage.getItem('indihunt_shoutouts') || '[]');
    const filtered = shoutouts.filter(s => s.shouted_product_id === productId);
    const products = await getProducts();
    return filtered.map(s => ({
      ...s,
      shouted_product: products.find(p => p.id === s.product_id)
    }));
  }
  return [];
}

export async function getProductShoutoutsGiven(productId: string): Promise<ProductShoutout[]> {
  let dbShoutouts: any[] = [];

  try {
    const res = await secureApiFetch<any[]>(`/t/shoutouts?productId=${encodeURIComponent(productId)}`);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      dbShoutouts = res.data;
    }
  } catch (err) {
    // fallback
  }


  if (typeof window !== 'undefined') {
    const shoutouts: any[] = JSON.parse(localStorage.getItem('indihunt_shoutouts') || '[]');
    const localFiltered = shoutouts.filter(s => s.product_id === productId);
    if (localFiltered.length > 0) {
      localFiltered.forEach(ls => {
        if (!dbShoutouts.some(ds => ds.shouted_product_id === ls.shouted_product_id || ds.id === ls.id)) {
          dbShoutouts.push(ls);
        }
      });
    }
  }

  const allProducts = await getProducts();

  const targetProduct = await getProductById(productId);

  if (dbShoutouts.length > 0) {
    const resolved: ProductShoutout[] = dbShoutouts.map((s, idx) => {
      const matched = s.shouted_product || allProducts.find(p => p.id === s.shouted_product_id || (s.shouted_product_name && p.name.toLowerCase() === s.shouted_product_name.toLowerCase()) || (s.name && p.name.toLowerCase() === s.name.toLowerCase()));
      const displayName = s.shouted_product_name || s.name || matched?.name || `Product ${idx + 1}`;
      const logoUrl = s.logo_url || s.shouted_product_logo || matched?.logo_url || targetProduct?.shoutout_logos?.[displayName] || `https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=120&q=80`;

      const resolvedProduct: Product = matched ? {
        ...matched,
        logo_url: matched.logo_url || logoUrl
      } : {
        id: s.shouted_product_id || `synth-${idx}`,
        name: displayName,
        tagline: `${displayName} software tool & integration`,
        description: `Tool used by product founder`,
        website_url: `https://www.google.com/search?q=${encodeURIComponent(displayName)}`,
        logo_url: logoUrl,
        screenshots: [],
        maker_id: 'synth',
        upvotes_count: 42,
        comments_count: 3,
        created_at: new Date().toISOString()
      };

      return {
        id: s.id || `shout-${idx}`,
        product_id: productId,
        shouted_product_id: s.shouted_product_id || `synth-${idx}`,
        note: s.note || `Used ${displayName} for product development & workflow.`,
        logo_url: logoUrl,
        created_at: s.created_at || new Date().toISOString(),
        shouted_product: resolvedProduct
      };
    });

    if (resolved.length > 0) return resolved;
  }

  return [];
}

export async function rescheduleProductLaunch(productId: string, date: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ success: boolean }>(
      `/t/products/${encodeURIComponent(productId)}/reschedule`,
      {
        method: 'POST',
        body: JSON.stringify({ date }),
      }
    );
    if (res && res.success) {
      return true;
    }
  } catch { }

  // Local storage mock
  if (typeof window !== 'undefined') {
    const products = await getProducts();
    const updated = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          scheduled_for: date,
          status: 'scheduled'
        };
      }
      return p;
    });
    localStorage.setItem('indihunt_products', JSON.stringify(updated));
    return true;
  }
  return false;
}

// --- Follows API ---
export async function getProductFollowers(productId: string): Promise<Profile[]> {
  try {
    const res = await secureApiFetch<Profile[]>(`/t/product-follows?productId=${encodeURIComponent(productId)}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (error) {
    console.error("Error fetching product followers from /t/product-follows:", error);
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const follows = JSON.parse(localStorage.getItem('indihunt_product_follows') || '[]');
    const matchingUserIds = follows
      .filter((f: string) => f.startsWith(`${productId}_`))
      .map((f: string) => f.split('_')[1]);

    // return users from MOCK_PROFILES or fallback
    return matchingUserIds.map((id: string) => MOCK_PROFILES[id] || {
      id,
      username: `follower_${id.slice(0, 4)}`,
      full_name: `Follower ${id.slice(0, 4)}`,
      is_maker: false
    });
  }
  return [];
}

export async function isFollowingProduct(productId: string, userId: string): Promise<boolean> {
  try {
    const followers = await getProductFollowers(productId);
    return followers.some(u => u.id === userId);
  } catch {
    // Fallback
    if (typeof window !== 'undefined') {
      const follows = JSON.parse(localStorage.getItem('indihunt_product_follows') || '[]');
      return follows.includes(`${productId}_${userId}`);
    }
    return false;
  }
}

export async function toggleFollowProduct(productId: string, userId: string, isCurrentlyFollowing: boolean): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ isFollowing: boolean }>('/t/product-follows', {
      method: 'POST',
      body: JSON.stringify({ productId, userId }),
    });
    if (res.success && res.data) {
      return res.data.isFollowing;
    }
    return !isCurrentlyFollowing;
  } catch (error) {
    console.error("Error toggling product follow via /t/product-follows:", error);
  }

  // Fallback
  if (typeof window !== 'undefined') {
    let follows = JSON.parse(localStorage.getItem('indihunt_product_follows') || '[]');
    const key = `${productId}_${userId}`;
    if (isCurrentlyFollowing) {
      follows = follows.filter((f: string) => f !== key);
    } else {
      follows.push(key);
    }
    localStorage.setItem('indihunt_product_follows', JSON.stringify(follows));
    return true;
  }
  return false;
}

export async function isFollowingUser(followerId: string, followingId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ isFollowing: boolean }>(
      `/t/user-follows?followerId=${encodeURIComponent(followerId)}&followingId=${encodeURIComponent(followingId)}`
    );
    if (res && res.success && res.data) {
      return !!res.data.isFollowing;
    }
  } catch (e) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const follows = JSON.parse(localStorage.getItem('indihunt_user_follows') || '[]');
    return follows.includes(`${followerId}_${followingId}`);
  }
  return false;
}

export async function toggleFollowUser(followerId: string, followingId: string, isCurrentlyFollowing: boolean): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ isFollowing: boolean }>('/t/user-follows', {
      method: 'POST',
      body: JSON.stringify({ followerId, followingId, isCurrentlyFollowing }),
    });

    if (res && res.success && res.data) {
      clearCache(`user_profile_${followerId}`);
      if (typeof window !== 'undefined') {
        let follows = JSON.parse(localStorage.getItem('indihunt_user_follows') || '[]');
        const key = `${followerId}_${followingId}`;
        if (!res.data.isFollowing) {
          follows = follows.filter((f: string) => f !== key);
        } else {
          follows.push(key);
        }
        localStorage.setItem('indihunt_user_follows', JSON.stringify(follows));
      }
      return res.data.isFollowing;
    }
  } catch (e) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    let follows = JSON.parse(localStorage.getItem('indihunt_user_follows') || '[]');
    const key = `${followerId}_${followingId}`;
    if (isCurrentlyFollowing) {
      follows = follows.filter((f: string) => f !== key);
    } else {
      follows.push(key);
    }
    localStorage.setItem('indihunt_user_follows', JSON.stringify(follows));
    return true;
  }
  return false;
}


// --- Collections API ---
export async function getUserCollections(userId: string): Promise<Collection[]> {
  try {
    const res = await secureApiFetch<Collection[]>(`/t/collections?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const cacheKey = `indihunt_collections_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  }
  return [];
}

export async function createCollection(name: string, description: string, userId: string): Promise<Collection | null> {
  try {
    const res = await secureApiFetch<Collection>('/t/collections', {
      method: 'POST',
      body: JSON.stringify({ name, description, userId }),
    });
    if (res && res.success && res.data) {
      if (typeof window !== 'undefined') {
        const cacheKey = `indihunt_collections_${userId}`;
        const collections = await getUserCollections(userId);
        localStorage.setItem(cacheKey, JSON.stringify([res.data, ...collections]));
      }
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const cacheKey = `indihunt_collections_${userId}`;
    const collections = await getUserCollections(userId);
    const newCol: Collection = {
      id: `col-${Date.now()}`,
      name,
      description,
      user_id: userId,
      created_at: new Date().toISOString(),
      products: []
    };
    localStorage.setItem(cacheKey, JSON.stringify([newCol, ...collections]));
    return newCol;
  }
  return null;
}

export async function addProductToCollection(collectionId: string, productId: string, userId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch(`/t/collections/${encodeURIComponent(collectionId)}/products`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    if (res && res.success) {
      return true;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const cacheKey = `indihunt_collections_${userId}`;
    const collections = await getUserCollections(userId);
    const products = await getProducts();
    const targetProduct = products.find(p => p.id === productId);

    if (targetProduct) {
      const updated = collections.map(col => {
        if (col.id === collectionId) {
          const alreadyExists = col.products?.some(p => p.id === productId);
          if (alreadyExists) return col;
          return {
            ...col,
            products: [...(col.products || []), targetProduct]
          };
        }
        return col;
      });
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return true;
    }
  }
  return false;
}

export async function deleteCollection(collectionId: string, userId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch(`/t/collections?id=${encodeURIComponent(collectionId)}&userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      return true;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const cacheKey = `indihunt_collections_${userId}`;
    const collections = await getUserCollections(userId);
    const updated = collections.filter(col => col.id !== collectionId);
    localStorage.setItem(cacheKey, JSON.stringify(updated));
    return true;
  }
  return false;
}

export async function removeProductFromCollection(collectionId: string, productId: string, userId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch(`/t/collections/${encodeURIComponent(collectionId)}/products?productId=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      return true;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const cacheKey = `indihunt_collections_${userId}`;
    const collections = await getUserCollections(userId);
    const updated = collections.map(col => {
      if (col.id === collectionId) {
        return {
          ...col,
          products: (col.products || []).filter(p => p.id !== productId)
        };
      }
      return col;
    });
    localStorage.setItem(cacheKey, JSON.stringify(updated));
    return true;
  }
  return false;
}

// --- Stacks API ---
export async function getUserStack(userId: string): Promise<Product[]> {
  try {
    const res = await secureApiFetch<Product[]>(`/t/user-stacks?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const cacheKey = `indihunt_stack_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return [];
    const productIds: string[] = JSON.parse(cached);
    const products = await getProducts();
    return products.filter(p => productIds.includes(p.id));
  }
  return [];
}

export async function addProductToStack(productId: string, userId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch('/t/user-stacks', {
      method: 'POST',
      body: JSON.stringify({ userId, productId }),
    });
    if (res && res.success) {
      return true;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const cacheKey = `indihunt_stack_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    const productIds: string[] = cached ? JSON.parse(cached) : [];
    if (!productIds.includes(productId)) {
      localStorage.setItem(cacheKey, JSON.stringify([...productIds, productId]));
    }
    return true;
  }
  return false;
}

export async function removeProductFromStack(productId: string, userId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch(`/t/user-stacks?userId=${encodeURIComponent(userId)}&productId=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      return true;
    }
  } catch (err) {
    // fallback
  }

  // Fallback
  if (typeof window !== 'undefined') {
    const cacheKey = `indihunt_stack_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const productIds: string[] = JSON.parse(cached);
      const updated = productIds.filter(id => id !== productId);
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    }
    return true;
  }
  return false;
}


// ─── Comment Upvotes ─────────────────────────────────────────────────────────

/**
 * Toggle a like/upvote on a comment.
 * Returns { upvotes_count, has_upvoted } after the toggle.
 */
export async function toggleCommentUpvote(
  commentId: string,
  userId: string
): Promise<{ upvotes_count: number; has_upvoted: boolean } | null> {
  try {
    const res = await secureApiFetch<{ success: boolean; has_upvoted: boolean; upvotes_count: number }>(
      `/t/comments/${encodeURIComponent(commentId)}/upvote`,
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }
    );

    const data: any = res?.data || res;
    if (res && res.success) {
      const count = typeof data?.upvotes_count === 'number'
        ? data.upvotes_count
        : (typeof res?.upvotes_count === 'number' ? res.upvotes_count : 0);
      const hasUpvoted = Boolean(data?.has_upvoted ?? res?.has_upvoted);
      return {
        upvotes_count: count,
        has_upvoted: hasUpvoted,
      };
    }
  } catch (err) {
    // fallback
  }

  return { upvotes_count: 0, has_upvoted: false };
}

// ─── Comment Reports ──────────────────────────────────────────────────────────

/**
 * Report a specific comment.
 */
export async function reportComment(
  commentId: string,
  userId: string,
  reason: string = 'spam',
  description?: string
): Promise<{ success: boolean; alreadyReported?: boolean }> {
  // Fallback
  if (typeof window !== 'undefined') {
    const key = 'indihunt_comment_reports';
    const cached = localStorage.getItem(key) || '[]';
    try {
      const list: any[] = JSON.parse(cached);
      const exists = list.some((r: any) => r.comment_id === commentId && r.user_id === userId);
      if (exists) return { success: false, alreadyReported: true };
      list.push({
        id: crypto.randomUUID(),
        comment_id: commentId,
        user_id: userId,
        reason,
        description: description || null,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(key, JSON.stringify(list));
      return { success: true };
    } catch (e) {
      console.error("Error reporting comment in localStorage:", e);
    }
  }

  return { success: false };
}

// ─── Comment Management (Edit & Delete) ──────────────────────────────────────

export async function updateComment(
  commentId: string,
  userId: string,
  newBody: string
): Promise<boolean> {
  clearCache();
  try {
    const res = await secureApiFetch(`/t/comments/${encodeURIComponent(commentId)}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, body: newBody }),
    });

    if (res && res.success) {
      return true;
    }
  } catch (err) {
    // fallback
  }

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('indihunt_comments')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const list: Comment[] = JSON.parse(cached);
            let modified = false;
            const updateRecursive = (arr: Comment[]): Comment[] => {
              return arr.map(c => {
                if (c.id === commentId && (c.user_id === userId || !c.user_id)) {
                  modified = true;
                  return { ...c, body: newBody };
                }
                if (c.replies && c.replies.length > 0) {
                  return { ...c, replies: updateRecursive(c.replies) };
                }
                return c;
              });
            };
            const nextList = updateRecursive(list);
            if (modified) {
              localStorage.setItem(key, JSON.stringify(nextList));
            }
          } catch (e) { }
        }
      }
    }
  }
  return true;
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  clearCache();
  try {
    const res = await secureApiFetch(`/t/comments/${encodeURIComponent(commentId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });

    if (res && res.success) {
      return true;
    }
  } catch (err) {
    // fallback
  }

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('indihunt_comments')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const list: Comment[] = JSON.parse(cached);
            let modified = false;
            const deleteRecursive = (arr: Comment[]): Comment[] => {
              return arr.filter(c => {
                if (c.id === commentId && (c.user_id === userId || !c.user_id)) {
                  modified = true;
                  return false;
                }
                if (c.replies && c.replies.length > 0) {
                  c.replies = deleteRecursive(c.replies);
                }
                return true;
              });
            };
            const nextList = deleteRecursive(list);
            if (modified) {
              localStorage.setItem(key, JSON.stringify(nextList));
            }
          } catch (e) { }
        }
      }
    }
  }
  return true;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

/**
 * Fetch top users by karma_points (KP Leaderboard)
 */
export async function getKarmaLeaderboard(limit: number = 20): Promise<Profile[]> {
  try {
    const res = await secureApiFetch<Profile[]>(`/t/leaderboard/karma?limit=${limit}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  const allUsers = await getAllUsersAdmin();
  return allUsers
    .slice()
    .sort((a, b) => (b.karma_points || 0) - (a.karma_points || 0))
    .slice(0, limit);
}

/**
 * Fetch top users by streak_count (Streak Leaderboard)
 */
export async function getStreakLeaderboard(limit: number = 20): Promise<Profile[]> {
  try {
    const res = await secureApiFetch<Profile[]>(`/t/leaderboard/streak?limit=${limit}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (error) {
    // fallback
  }

  const allUsers = await getAllUsersAdmin();
  return allUsers
    .slice()
    .sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0))
    .slice(0, limit);
}

/**
 * Update user streak via the DB function (records daily visit, increments streak).
 * Should be called when the user loads the app and has been active for >= 60 seconds.
 */
export async function updateUserStreak(userId: string): Promise<{ streak_count: number; last_active_date: string | null } | null> {
  try {
    const res = await secureApiFetch<{ streak_count: number; last_active_date: string | null }>('/t/user-streak', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });

    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (e) {
    // fallback
  }

  return { streak_count: 1, last_active_date: new Date().toISOString() };
}


// --- Campaign Helper Functions ---

export async function getLaunchInsights(dateStr?: string): Promise<LaunchInsightsData> {
  try {
    const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
    const res = await secureApiFetch<LaunchInsightsData>(`/t/launch-insights${query}`);
    if (res && res.data && res.data.products) {
      return res.data;
    }
  } catch { }

  // 1. Resolve active products from fallback
  let activeProducts = await getProducts();

  // Filter for products launched on today's date
  const targetDateObj = dateStr ? new Date(dateStr) : new Date();
  const targetY = targetDateObj.getFullYear();
  const targetM = targetDateObj.getMonth() + 1;
  const targetD = targetDateObj.getDate();

  const isTodayProduct = (p: Product): boolean => {
    const dStr = p.scheduled_for || p.created_at;
    if (!dStr) return false;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return false;
    return d.getFullYear() === targetY && (d.getMonth() + 1) === targetM && d.getDate() === targetD;
  };

  const todayFilteredProducts = activeProducts.filter(isTodayProduct);
  let finalProducts = todayFilteredProducts.length > 0 ? todayFilteredProducts : activeProducts;

  // Sort by upvotes and strictly limit to top 20 products for today's analytics
  activeProducts = finalProducts
    .sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0))
    .slice(0, 20);

  // Make sure tags are initialized on all products
  activeProducts.forEach((p) => {
    if (!p.tags) p.tags = [];
  });

  const slots = [
    "12:30 PM", "01:00 PM", "01:15 PM", "01:30 PM", "02:00 PM", "02:15 PM", "02:30 PM",
    "03:00 PM", "03:15 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"
  ];

  // If absolutely no products exist in the database, return empty structure
  if (activeProducts.length === 0) {
    const dummyProduct: Product = {
      id: "dummy",
      name: "No products launched",
      tagline: "Be the first to submit a product!",
      description: "Be the first to submit a product!",
      website_url: "https://indihunt.com",
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80",
      screenshots: [],
      maker_id: "dummy-user",
      upvotes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      tags: []
    };
    const dummyProfile: Profile = {
      id: "dummy-user",
      username: "IndiHunt",
      full_name: "IndiHunt Community",
      is_maker: true
    };
    const dummyComment: Comment = {
      id: "dummy-comment",
      body: "Welcome to IndiHunt! No comments are available yet.",
      created_at: new Date().toISOString(),
      user_id: "dummy-user",
      user: dummyProfile,
      upvotes_count: 0
    };
    return {
      products: [],
      pointsTimeline: [],
      commentsTimeline: [],
      mostPoints: {
        product: dummyProduct,
        points: 0,
        sparkline: slots.map(() => 0)
      },
      mostComments: {
        product: dummyProduct,
        comments: 0,
        sparkline: slots.map(() => 0)
      },
      mostPopularTag: {
        name: "None",
        count: 0,
        products: []
      },
      topComment: {
        comment: dummyComment,
        votes: 0,
        user: dummyProfile,
        product: dummyProduct
      }
    };
  }

  // 2. Build time series (points over time and comments over time)
  const pointsTimeline: any[] = [];
  const commentsTimeline: any[] = [];

  slots.forEach((slot, index) => {
    const progress = (index + 1) / slots.length;
    // Logarithmic curve for points to look organic
    const logFactor = Math.log(1 + progress * 9) / Math.log(10);
    // Comment growth curve (more S-shaped/sigmoidal)
    const sigmoidalFactor = 1 / (1 + Math.exp(-6 * (progress - 0.5)));

    const pointsObj: any = { time: slot };
    const commentsObj: any = { time: slot };

    activeProducts.forEach(p => {
      const pointsMax = p.upvotes_count || 0;
      const commentsMax = p.comments_count || 0;

      // Points over time simulation
      let pointsVal = Math.round(pointsMax * logFactor);
      if (index === 0) pointsVal = Math.round(pointsMax * 0.12);
      if (index === slots.length - 1) pointsVal = pointsMax;
      pointsObj[p.name] = Math.max(0, pointsVal);

      // Comments over time simulation
      let commentsVal = Math.round(commentsMax * sigmoidalFactor);
      if (index === 0) commentsVal = Math.round(commentsMax * 0.05);
      if (index === slots.length - 1) commentsVal = commentsMax;
      commentsObj[p.name] = Math.max(0, commentsVal);
    });

    pointsTimeline.push(pointsObj);
    commentsTimeline.push(commentsObj);
  });

  // Dynamic statistics calculations
  const sortedByPoints = [...activeProducts].sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
  const sortedByComments = [...activeProducts].sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));

  const mostPointsProduct = sortedByPoints[0];
  const mostCommentsProduct = sortedByComments[0];

  const pointsMax = mostPointsProduct.upvotes_count || 0;
  const commentsMax = mostCommentsProduct.comments_count || 0;

  const dynamicPointsSparkline = slots.map((_, i) => Math.round(pointsMax * (Math.log(1 + ((i + 1) / slots.length) * 9) / Math.log(10))));
  const dynamicCommentsSparkline = slots.map((_, i) => Math.round(commentsMax * (1 / (1 + Math.exp(-6 * (((i + 1) / slots.length) - 0.5))))));

  // Find most popular tag dynamically
  const tagCounts: Record<string, number> = {};
  activeProducts.forEach(p => {
    p.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  let popularTagName = "None";
  let popularTagCount = 0;
  Object.entries(tagCounts).forEach(([tag, count]) => {
    if (count > popularTagCount) {
      popularTagCount = count;
      popularTagName = tag;
    }
  });

  // 4. Fetch real top comment from database or local comments for today's active products
  let topCommentObj: Comment | null = null;
  let topCommentUser: Profile | null = null;
  let topCommentProduct: Product | null = null;

  // Check local storage comments for today's active products
  if (typeof window !== 'undefined') {
    for (const p of activeProducts) {
      try {
        const stored = localStorage.getItem(`indihunt_comments_${p.id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as Comment[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sorted = [...parsed].sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
            const best = sorted[0];
            if (!topCommentObj || (best.upvotes_count || 0) > (topCommentObj.upvotes_count || 0)) {
              topCommentObj = best;
              topCommentUser = best.user || p.maker || {
                id: "user-commenter",
                username: "community",
                full_name: "Community Member",
                is_maker: false
              };
              topCommentProduct = p;
            }
          }
        }
      } catch (e) { }
    }
  }

  // Fallback top voted comment for today's product analytics
  if (!topCommentObj || (topCommentObj.upvotes_count || 0) === 0) {
    topCommentProduct = activeProducts.find(p => p.name.toLowerCase().includes("caloi") || p.name.toLowerCase().includes("langwatch")) || activeProducts[0];
    topCommentUser = {
      id: "flowboard-teams",
      username: "flowboardteams",
      full_name: "Flow Board",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      is_maker: true
    };
    topCommentObj = {
      id: "top-comment-caloi",
      body: "I've been trying Caloi AI and one thing I really like is how quickly it recognizes food from a photo. Logging meals feels much faster than manually searching for every ingredient. The clean UI and macro tracking are also easy to understand. Looking forward to barcode scanning and more AI meal suggestions. Great work so far—excited to see how the app evolves! 🚀",
      created_at: topCommentProduct.created_at || new Date().toISOString(),
      user_id: topCommentUser.id,
      user: topCommentUser,
      upvotes_count: 2
    };
  }

  return {
    products: activeProducts,
    pointsTimeline,
    commentsTimeline,
    mostPoints: {
      product: mostPointsProduct,
      points: pointsMax,
      sparkline: dynamicPointsSparkline
    },
    mostComments: {
      product: mostCommentsProduct,
      comments: commentsMax,
      sparkline: dynamicCommentsSparkline
    },
    mostPopularTag: {
      name: popularTagName !== "None" ? popularTagName : "Launch",
      count: popularTagCount > 0 ? popularTagCount : activeProducts.length,
      products: popularTagName !== "None"
        ? activeProducts.filter(p => p.tags?.includes(popularTagName))
        : activeProducts
    },
    topComment: {
      comment: topCommentObj,
      votes: topCommentObj.upvotes_count || 0,
      user: topCommentUser || (topCommentObj.user as Profile),
      product: topCommentProduct || activeProducts[0]
    }
  };
}

export async function getFollowedForums(userId: string): Promise<string[]> {
  try {
    const res = await secureApiFetch<string[]>(`/t/forum-follows?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) { }

  const cached = typeof window !== 'undefined' ? localStorage.getItem(`bh_forum_follows_${userId}`) : null;
  return cached ? JSON.parse(cached) : [];
}

export async function toggleFollowForum(forumId: string, userId: string): Promise<{ success: boolean; followed: boolean }> {
  try {
    const res = await secureApiFetch<{ success: boolean; followed: boolean }>(
      '/t/forum-follows',
      {
        method: 'POST',
        body: JSON.stringify({ forumId, userId }),
      }
    );

    if (res && res.success) {
      if (typeof window !== 'undefined') {
        const list = await getFollowedForums(userId);
        let updatedList: string[];
        if (res.followed) {
          updatedList = Array.from(new Set([...list, forumId]));
        } else {
          updatedList = list.filter(id => id !== forumId);
        }
        localStorage.setItem(`bh_forum_follows_${userId}`, JSON.stringify(updatedList));
      }
      return { success: true, followed: !!res.followed };
    }
  } catch (err) { }

  const list = await getFollowedForums(userId);
  const isFollowed = list.includes(forumId);
  let updatedList: string[];
  if (isFollowed) {
    updatedList = list.filter(id => id !== forumId);
  } else {
    updatedList = [...list, forumId];
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(`bh_forum_follows_${userId}`, JSON.stringify(updatedList));
  }
  return { success: true, followed: !isFollowed };
}

export async function getForumFollowersCount(forumId: string): Promise<number> {
  try {
    const res = await secureApiFetch<{ count: number }>(`/t/forum-follows?forumId=${encodeURIComponent(forumId)}`);
    if (res && res.success && typeof res.data?.count === 'number') {
      return res.data.count;
    }
  } catch (err) { }

  return 12;
}

export async function recordView(itemId: string, itemType: 'product' | 'thread' | 'comment' | 'review', userId?: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ success: boolean }>('/t/views', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType, userId }),
    });
    if (res && res.success) return true;
  } catch (err) { }

  // Fallback storage update
  if (typeof window !== 'undefined') {
    try {
      if (itemType === 'product') {
        const cached = localStorage.getItem('indihunt_products');
        if (cached) {
          const list = JSON.parse(cached);
          const updated = list.map((p: any) => p.id === itemId ? { ...p, views_count: (p.views_count || 0) + 1 } : p);
          localStorage.setItem('indihunt_products', JSON.stringify(updated));
        }
      } else if (itemType === 'thread') {
        const cached = localStorage.getItem('indihunt_threads');
        if (cached) {
          const list = JSON.parse(cached);
          const updated = list.map((t: any) => t.id === itemId ? { ...t, views_count: (t.views_count || 0) + 1 } : t);
          localStorage.setItem('indihunt_threads', JSON.stringify(updated));
        }
      } else if (itemType === 'review') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('indihunt_reviews_')) {
            const cached = localStorage.getItem(key);
            if (cached) {
              const list = JSON.parse(cached);
              if (list.some((r: any) => r.id === itemId)) {
                const updated = list.map((r: any) => r.id === itemId ? { ...r, views: (r.views || 0) + 1 } : r);
                localStorage.setItem(key, JSON.stringify(updated));
                break;
              }
            }
          }
        }
      }
      return true;
    } catch (e) { }
  }
  return false;
}

export const DEFAULT_STORIES: Story[] = [
  {
    id: "indihunt-origin",
    title: "The Origin of IndiHunt: How We Got the Idea to Build Bharat's SaaS Launchpad",
    excerpt: "The inside story of how we realized Indian indie makers needed their own launchpad, the early code pivots, and our vision to empower the next wave of Bharat's tech builders.",
    content: `Every great project starts with a simple frustration. For us, it was the realization that while India has one of the largest developer ecosystems in the world, local indie makers and solo builders lacked a dedicated, focused launchpad to show off their creations to a community that understands their unique challenges.

Sure, there are global platforms, but local context, pricing strategies tailored for the Indian market, and local community support were completely missing. That's when the idea of **IndiHunt** was born: a curated community dedicated entirely to launching, discovering, and supporting products built in India.

### The First Iteration

We started with a basic spreadsheet, listing interesting projects we found on X (formerly Twitter) and GitHub. The response was immediate: founders wanted to talk to other founders, share feedback, and upvote projects. We realized a simple spreadsheet wouldn't cut it. 

Over a weekend, we hacked together the first web interface. We focused on:
1. **Simple Launching**: Letting makers list their product in under 5 minutes.
2. **Community Feedback**: Comments that feel like a product brainstorm session rather than just polite applause.
3. **Ecosystem Pulse**: Highlighting trending categories and active maker streaks to make the launchpad feel alive.

### Looking Ahead

Today, IndiHunt is growing, but our mission remains unchanged: to provide the ultimate showcase for indie software engineering in India. Whether you are building a developer tool, an AI assistant, or a niche B2B SaaS, your product has a home here. Thank you for being a part of this journey!`,
    image_url: "/indihunt_origin.webp",
    category: "Interviews",
    published_at: new Date("2026-07-01T00:00:00.000Z").toISOString(),
    created_at: new Date("2026-07-01T00:00:00.000Z").toISOString(),
    user_id: "user-1",
    user: MOCK_PROFILES['user-1']
  },
  {
    id: "solopreneur-saas-guides",
    title: "Solopreneur SaaS Guide: Building and Scaling Alone in India",
    excerpt: "A comprehensive handbook for solo developers in India on how to pick an idea, build efficiently, and handle marketing and payments without a co-founder.",
    content: `Scaling a software product as a solo founder is one of the most challenging yet rewarding journeys. In India, solopreneurs face unique challenges, from navigation of regulatory compliance to setting up international payments.

### Finding the Right Idea

When you are building alone, your resource is time. You cannot afford to build a complex platform that requires a large team. Focus on:
1. **Micro-SaaS**: Small, focused tools that solve one specific problem extremely well.
2. **Developer Tools**: Products where you are the target user, so you understand the needs perfectly.
3. **Niche B2B**: Businesses that are willing to pay because your tool saves them time or money.

### Setting Up Payments

One of the biggest hurdles for Indian makers is payment gateways. Platforms like Razorpay, Stripe, and global merchants of record like Lemon Squeezy or Polar are crucial for selling subscriptions internationally. Make sure you set up tax compliance correctly from day one.

### Distribution is King

It's not enough to build a great product. You need to tell the world. Start building in public on Twitter/X, share your journey on LinkedIn, and launch on platforms like IndiHunt and Product Hunt to get your first 100 users.`,
    image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
    category: "Guides",
    published_at: new Date("2026-07-15T00:00:00.000Z").toISOString(),
    created_at: new Date("2026-07-15T00:00:00.000Z").toISOString(),
    user_id: "user-2",
    user: MOCK_PROFILES['user-2']
  },
  {
    id: "product-hunt-playbook",
    title: "The Indian Maker's Product Hunt Playbook: Launching to the World",
    excerpt: "Learn how to rank in the top 5 on Product Hunt, prepare your launch collateral, and leverage the supportive Indian developer ecosystem for global reach.",
    content: `Launching on Product Hunt is a major milestone for any startup. For Indian makers, it represents a golden opportunity to get global exposure. But a successful launch requires weeks of preparation.

### The Pre-Launch Checklist

Do not just launch when the code is ready. Prepare the following at least two weeks in advance:
1. **Eye-catching Assets**: A high-quality logo (preferably animated GIF), beautiful screenshots, and a short 1-minute demo video.
2. **Clear Messaging**: A compelling tagline and a detailed first comment explaining why you built the product and what problem it solves.
3. **Teaser Page**: Build a teaser page on Product Hunt and share it with your existing network to gather subscribers.

### Launch Day Strategy

Product Hunt resets at 12:01 AM PST (which is 12:31 PM IST). You want to launch exactly at that time to get the full 24 hours of exposure. 
- **Reach Out**: Send personal, non-spammy messages to your community, mentors, and fellow makers.
- **Engage**: Respond to every single comment on your launch page immediately. Feedback is just as valuable as upvotes!
- **Social Media**: Leverage Twitter/X and LinkedIn to share live updates throughout the launch day.`,
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    category: "Playbooks",
    published_at: new Date("2026-08-01T00:00:00.000Z").toISOString(),
    created_at: new Date("2026-08-01T00:00:00.000Z").toISOString(),
    user_id: "user-1",
    user: MOCK_PROFILES['user-1']
  }
];

async function getStoriesRaw(search?: string): Promise<Story[]> {
  try {
    const url = search ? `/t/stories?search=${encodeURIComponent(search)}` : `/t/stories`;
    const res = await secureApiFetch<Story[]>(url);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_stories') || '[]';
    let list: Story[] = JSON.parse(cached);
    if (list.length === 0) {
      list = [...DEFAULT_STORIES];
      localStorage.setItem('indihunt_stories', JSON.stringify(list));
    }
    if (search) {
      list = list.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }
  return [];
}

export const getStories = withCache('stories', getStoriesRaw);

export async function createStory(storyData: Partial<Story>): Promise<Story | null> {
  clearCache('stories');

  try {
    const res = await secureApiFetch<Story>('/t/stories', {
      method: 'POST',
      body: JSON.stringify({
        title: storyData.title,
        content: storyData.content,
        category: storyData.category || 'General',
        image_url: storyData.image_url || null,
        user_id: storyData.user_id,
        excerpt: storyData.excerpt || (storyData.content ? storyData.content.substring(0, 150) + '...' : ''),
      }),
    });

    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_stories') || '[]';
    const list: Story[] = JSON.parse(cached);
    const newStory: Story = {
      id: Math.random().toString(36).substr(2, 9),
      title: storyData.title || '',
      content: storyData.content || '',
      image_url: storyData.image_url,
      category: storyData.category || 'Makers',
      user_id: storyData.user_id || 'user-1',
      excerpt: storyData.excerpt || (storyData.content ? storyData.content.substr(0, 150) + '...' : ''),
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user: MOCK_PROFILES[storyData.user_id || 'user-1'] || MOCK_PROFILES['user-1']
    };
    list.unshift(newStory);
    localStorage.setItem('indihunt_stories', JSON.stringify(list));
    return newStory;
  }
  return null;
}

export async function deleteStory(storyId: string): Promise<boolean> {
  clearCache('stories');
  try {
    const res = await secureApiFetch(`/t/stories/${encodeURIComponent(storyId)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      return true;
    }
  } catch (err) {
    // fallback
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_stories') || '[]';
    const list: Story[] = JSON.parse(cached);
    const filtered = list.filter(s => s.id !== storyId);
    localStorage.setItem('indihunt_stories', JSON.stringify(filtered));
    return true;
  }
  return false;
}

export async function getStoryComments(storyId: string): Promise<StoryComment[]> {
  try {
    const res = await secureApiFetch<StoryComment[]>(`/t/stories/${encodeURIComponent(storyId)}/comments`);
    if (res && res.success && Array.isArray(res.data)) {
      const data = res.data;
      const roots = data.filter(c => !c.parent_id);
      const childMap = data.reduce((acc, c) => {
        if (c.parent_id) {
          acc[c.parent_id] = acc[c.parent_id] || [];
          acc[c.parent_id].push(c);
        }
        return acc;
      }, {} as Record<string, StoryComment[]>);

      const populate = (comments: StoryComment[]) => {
        comments.forEach(c => {
          if (childMap[c.id]) {
            c.replies = childMap[c.id];
            populate(childMap[c.id]);
          }
        });
      };
      populate(roots);
      return roots;
    }
  } catch (err) {
    // fallback
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`indihunt_story_comments_${storyId}`) || '[]';
    const list: StoryComment[] = JSON.parse(cached);
    const roots = list.filter(c => !c.parent_id);
    const childMap = list.reduce((acc, c) => {
      if (c.parent_id) {
        acc[c.parent_id] = acc[c.parent_id] || [];
        acc[c.parent_id].push(c);
      }
      return acc;
    }, {} as Record<string, StoryComment[]>);

    const populate = (comments: StoryComment[]) => {
      comments.forEach(c => {
        if (childMap[c.id]) {
          c.replies = childMap[c.id];
          populate(childMap[c.id]);
        }
      });
    };
    populate(roots);
    return roots;
  }
  return [];
}

export async function addStoryComment(storyId: string, userId: string, body: string, parentId?: string | null): Promise<StoryComment | null> {
  try {
    const res = await secureApiFetch<StoryComment>(`/t/stories/${encodeURIComponent(storyId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, body, parentId: parentId || null }),
    });

    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) {
    // fallback
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`indihunt_story_comments_${storyId}`) || '[]';
    const list: StoryComment[] = JSON.parse(cached);
    const newComment: StoryComment = {
      id: Math.random().toString(36).substr(2, 9),
      story_id: storyId,
      user_id: userId,
      parent_id: parentId || null,
      body,
      created_at: new Date().toISOString(),
      user: MOCK_PROFILES[userId] || MOCK_PROFILES['user-1']
    };
    list.push(newComment);
    localStorage.setItem(`indihunt_story_comments_${storyId}`, JSON.stringify(list));
    return newComment;
  }
  return null;
}

export function checkContentViolation(text: string): { hasViolation: boolean; message?: string } {
  if (!text) return { hasViolation: false };

  // Link detection patterns
  const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\.com\b|\.net\b|\.org\b|\.io\b|\.co\b)/i;

  // Advertising/spam keywords
  const spamKeywords = [
    'buy now', 'discount code', 'promo code', 'special offer', 'limited offer',
    'get rich', 'earn money', 'cryptocurrency investment', 'click here',
    'visit my website', 'visit our site', 'free giveaway', 'make money fast',
    'subscribe to', 'check out my channel'
  ];

  if (linkRegex.test(text)) {
    return {
      hasViolation: true,
      message: "Community Guidelines Violation: Links or external website references are not allowed in comments or discussion replies."
    };
  }

  const lowercaseText = text.toLowerCase();
  for (const kw of spamKeywords) {
    if (lowercaseText.includes(kw)) {
      return {
        hasViolation: true,
        message: `Community Guidelines Violation: Your message contains promotional phrasing ("${kw}") which resembles advertising. Advertisements are not allowed.`
      };
    }
  }

  return { hasViolation: false };
}

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Show HN: IndiHunt – Next.js Platform for Indian Makers to Launch Software Products",
    url: "https://indihunt.in",
    score: 156,
    by: "himanshu",
    time: Math.floor(Date.now() / 1000) - 3600,
    descendants: 24
  },
  {
    id: "2",
    title: "Supabase launches Postgres WASM in the browser",
    url: "https://supabase.com/blog/postgres-wasm",
    score: 342,
    by: "kiwicopple",
    time: Math.floor(Date.now() / 1000) - 7200,
    descendants: 89
  },
  {
    id: "3",
    title: "Next.js 15: The App Router and Server Components Evolved",
    url: "https://nextjs.org/blog/next-15",
    score: 218,
    by: "timneutkens",
    time: Math.floor(Date.now() / 1000) - 10800,
    descendants: 45
  },
  {
    id: "4",
    title: "Vercel raises Series E to scale front-end infrastructure",
    url: "https://vercel.com/blog",
    score: 189,
    by: "rauchg",
    time: Math.floor(Date.now() / 1000) - 14400,
    descendants: 33
  },
  {
    id: "5",
    title: "Why SQLite is all you need for small and medium projects",
    url: "https://example.com/sqlite-all-you-need",
    score: 412,
    by: "sqlite_fan",
    time: Math.floor(Date.now() / 1000) - 18000,
    descendants: 112
  }
];

export async function fetchDailyNews(): Promise<NewsItem[]> {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_news');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
  }

  try {
    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (!res.ok) throw new Error("Failed to fetch top stories");
    const storyIds: number[] = await res.json();

    const topIds = storyIds.slice(0, 30);
    const detailPromises = topIds.map(async (id) => {
      try {
        const detailRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!detailRes.ok) return null;
        return detailRes.json();
      } catch {
        return null;
      }
    });

    const details = await Promise.all(detailPromises);
    const validStories = details.filter((item: any): item is any =>
      item !== null && item.type === 'story' && item.title !== undefined
    );

    if (validStories.length > 0) {
      const results: NewsItem[] = validStories.map((s: any) => ({
        id: String(s.id),
        title: s.title,
        url: s.url,
        score: s.score || 0,
        by: s.by || "anonymous",
        time: s.time || Math.floor(Date.now() / 1000),
        descendants: s.descendants || 0
      }));

      if (typeof window !== 'undefined') {
        localStorage.setItem('indihunt_news', JSON.stringify(results));
      }
      return results;
    }
    return MOCK_NEWS;
  } catch (error) {
    console.error("fetchDailyNews error, using mock data:", error);
    return MOCK_NEWS;
  }
}

export async function fetchNewsByDay(date: Date): Promise<NewsItem[]> {
  const startOfDay = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000);
  const endOfDay = startOfDay + 24 * 60 * 60;

  const cacheKey = `indihunt_news_${startOfDay}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
  }

  try {
    const res = await fetch(`https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i>=${startOfDay},created_at_i<${endOfDay}&hitsPerPage=30`);
    if (!res.ok) throw new Error("Failed to fetch news from Algolia");
    const data = await res.json();

    const results: NewsItem[] = (data.hits || [])
      .filter((hit: any) => hit.title && hit.title.trim().length > 0)
      .map((hit: any) => ({
        id: String(hit.objectID),
        title: hit.title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        score: hit.points || 0,
        by: hit.author || "anonymous",
        time: hit.created_at_i || Math.floor(Date.now() / 1000),
        descendants: hit.num_comments || 0
      }));

    if (results.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify(results));
    }

    return results;
  } catch (error) {
    console.error(`fetchNewsByDay error for ${date.toDateString()}:`, error);
    // If it's today and network fails, fallback to general MOCK_NEWS
    const isToday = new Date().toDateString() === date.toDateString();
    if (isToday) {
      return MOCK_NEWS;
    }
    return [];
  }
}

export async function scheduleProductDeletion(productId: string, reason: string, userId: string): Promise<boolean> {
  clearCache();
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 7);

  try {
    const res = await secureApiFetch<{ success: boolean; scheduled_deletion_date: string }>(
      `/t/products/${encodeURIComponent(productId)}/deletion`,
      {
        method: 'POST',
        body: JSON.stringify({ reason, userId }),
      }
    );
    if (res && res.success) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('indihunt_products') || '[]';
        const list: Product[] = JSON.parse(cached);
        const updated = list.map(p => {
          if (p.id === productId) {
            return {
              ...p,
              scheduled_deletion_date: res.scheduled_deletion_date || scheduledDate.toISOString(),
              deletion_reason: reason,
              deleted_by: userId
            };
          }
          return p;
        });
        localStorage.setItem('indihunt_products', JSON.stringify(updated));
      }
      return true;
    }
  } catch { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_products') || '[]';
    const list: Product[] = JSON.parse(cached);
    const updated = list.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          scheduled_deletion_date: scheduledDate.toISOString(),
          deletion_reason: reason,
          deleted_by: userId
        };
      }
      return p;
    });
    localStorage.setItem('indihunt_products', JSON.stringify(updated));
    return true;
  }
  return false;
}

export async function cancelProductDeletion(productId: string): Promise<boolean> {
  clearCache();
  try {
    const res = await secureApiFetch<{ success: boolean; cancelled: boolean }>(
      `/t/products/${encodeURIComponent(productId)}/deletion`,
      {
        method: 'DELETE',
      }
    );
    if (res && res.success) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('indihunt_products') || '[]';
        const list: Product[] = JSON.parse(cached);
        const updated = list.map(p => {
          if (p.id === productId) {
            const { scheduled_deletion_date, deletion_reason, deleted_by, ...rest } = p;
            return rest;
          }
          return p;
        });
        localStorage.setItem('indihunt_products', JSON.stringify(updated));
      }
      return true;
    }
  } catch { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_products') || '[]';
    const list: Product[] = JSON.parse(cached);
    const updated = list.map(p => {
      if (p.id === productId) {
        const { scheduled_deletion_date, deletion_reason, deleted_by, ...rest } = p;
        return rest;
      }
      return p;
    });
    localStorage.setItem('indihunt_products', JSON.stringify(updated));
    return true;
  }
  return false;
}

export function getCachedStories(search?: string): Story[] {
  const key = `stories_${search || ''}`;
  return getCachedData(key) || [];
}

// --- Self-Serve Advertising Platform Types & DB Operations ---

export async function getAdCampaigns(userId: string): Promise<AdCampaign[]> {
  try {
    const res = await secureApiFetch<AdCampaign[]>(`/t/ads/campaigns?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_ad_campaigns') || '[]';
    const list: AdCampaign[] = JSON.parse(cached);
    return list.filter(c => c.user_id === userId);
  }
  return [];
}

function seedAdEvents(campaignId: string, maxCpc: number) {
  if (typeof window === 'undefined') return { clicks: 0, impressions: 0, spent: 0 };

  const events: any[] = [];
  const now = new Date();
  const hoursToSimulate = 24;

  for (let i = 0; i < hoursToSimulate; i++) {
    const eventTime = new Date(now.getTime() - (hoursToSimulate - i) * 60 * 60 * 1000);
    const impsCount = Math.floor(Math.random() * 20) + 15;
    for (let j = 0; j < impsCount; j++) {
      events.push({
        id: `ev-seed-imp-${i}-${j}-${Math.random().toString(36).substr(2, 9)}`,
        campaign_id: campaignId,
        event_type: 'impression',
        created_at: eventTime.toISOString()
      });
    }

    const clickCount = Math.random() < 0.4 ? 1 : (Math.random() < 0.15 ? 2 : 0);
    for (let k = 0; k < clickCount; k++) {
      events.push({
        id: `ev-seed-clk-${i}-${k}-${Math.random().toString(36).substr(2, 9)}`,
        campaign_id: campaignId,
        event_type: 'click',
        created_at: eventTime.toISOString()
      });
    }
  }

  const clicks = events.filter(e => e.event_type === 'click').length;
  const impressions = events.filter(e => e.event_type === 'impression').length;
  const spent = Number(((impressions * 0.005) + (clicks * maxCpc)).toFixed(2));

  localStorage.setItem(`indihunt_ad_events_${campaignId}`, JSON.stringify(events));
  return { clicks, impressions, spent };
}

export async function createAdCampaign(campaign: Omit<AdCampaign, 'id' | 'target_impressions' | 'delivered_impressions' | 'impressions' | 'clicks' | 'created_at'>): Promise<AdCampaign | null> {
  try {
    const res = await secureApiFetch<AdCampaign>('/t/ads/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_ad_campaigns') || '[]';
    const list: AdCampaign[] = JSON.parse(cached);
    const generatedId = `ad-${Date.now()}`;
    const budget = Math.max(Number(campaign.total_budget) || 1000, 1);
    const cpmRate = campaign.cpm_rate || 10.00;
    const { clicks, impressions } = seedAdEvents(generatedId, 0.30);
    const newCamp: AdCampaign = {
      ...campaign,
      total_budget: budget,
      daily_limit: Math.min(Number(campaign.daily_limit) || 10, budget),
      cpm_rate: cpmRate,
      target_impressions: (budget / cpmRate) * 1000,
      delivered_impressions: impressions,
      impressions,
      clicks,
      id: generatedId,
      created_at: new Date().toISOString()
    };
    list.push(newCamp);
    localStorage.setItem('indihunt_ad_campaigns', JSON.stringify(list));
    return newCamp;
  }
  return null;
}

export async function updateAdCampaignStatus(campaignId: string, status: AdCampaign['status']): Promise<AdCampaign | null> {
  try {
    const res = await secureApiFetch<AdCampaign>('/t/ads/campaigns', {
      method: 'PUT',
      body: JSON.stringify({ id: campaignId, status }),
    });
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_ad_campaigns') || '[]';
    const list: AdCampaign[] = JSON.parse(cached);
    let updated: AdCampaign | null = null;
    const nextList = list.map(c => {
      if (c.id === campaignId) {
        updated = { ...c, status };
        return updated;
      }
      return c;
    });
    localStorage.setItem('indihunt_ad_campaigns', JSON.stringify(nextList));
    return updated;
  }
  return null;
}

export async function addAdBudget(campaignId: string, amount: number): Promise<AdCampaign | null> {
  try {
    const res = await secureApiFetch<AdCampaign>('/t/ads/campaigns', {
      method: 'PUT',
      body: JSON.stringify({ id: campaignId, addBudget: amount }),
    });
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_ad_campaigns') || '[]';
    const list: AdCampaign[] = JSON.parse(cached);
    let updated: AdCampaign | null = null;
    const nextList = list.map(c => {
      if (c.id === campaignId) {
        const extraImpressions = Math.floor((amount / (c.cpm_rate || 10)) * 1000);
        const nextTarget = (c.target_impressions || 0) + extraImpressions;
        updated = {
          ...c,
          total_budget: c.total_budget + amount,
          target_impressions: nextTarget,
          status: 'active' as const
        };
        return updated;
      }
      return c;
    });
    localStorage.setItem('indihunt_ad_campaigns', JSON.stringify(nextList));
    return updated;
  }
  return null;
}

export async function deleteAdCampaign(campaignId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ success: boolean }>(`/t/ads/campaigns?id=${encodeURIComponent(campaignId)}`, {
      method: 'DELETE',
    });
    if (res && res.success) return true;
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_ad_campaigns') || '[]';
    const list: AdCampaign[] = JSON.parse(cached);
    const nextList = list.filter(c => c.id !== campaignId);
    localStorage.setItem('indihunt_ad_campaigns', JSON.stringify(nextList));
    return true;
  }
  return false;
}

export async function getActiveAdsPool(excludeProductId?: string): Promise<AdCampaign[]> {
  try {
    const res = await secureApiFetch<AdCampaign[]>('/t/ads/campaigns?all=true');
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      const valid = (res.data as AdCampaign[]).filter(c => {
        if (c.status !== 'active') return false;
        if (c.target_impressions && (c.delivered_impressions || 0) >= c.target_impressions) {
          return false;
        }
        return excludeProductId ? c.product_id !== excludeProductId : true;
      });
      return valid;
    }
  } catch (e) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_ad_campaigns') || '[]';
    try {
      const list: AdCampaign[] = JSON.parse(cached);
      const valid = list.filter(c => !c.target_impressions || (c.delivered_impressions || 0) < c.target_impressions);
      if (valid.length !== list.length) {
        localStorage.setItem('indihunt_ad_campaigns', JSON.stringify(valid));
      }
      const active = valid.filter(c => c.status === 'active');
      return excludeProductId ? active.filter(c => c.product_id !== excludeProductId) : active;
    } catch (e) { }
  }

  return [];
}

export function getCachedPromotedProducts(): Product[] {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_promoted_products');
    if (cached) {
      try { return JSON.parse(cached) as Product[]; } catch (e) { }
    }
  }
  return [];
}

export async function getPromotedProducts(existingProducts?: Product[]): Promise<Product[]> {
  const activeAdsPromise = getActiveAdsPool();
  const productsPromise = (existingProducts && existingProducts.length > 0) ? Promise.resolve(existingProducts) : getProducts();

  const [activeAds, allProducts] = await Promise.all([activeAdsPromise, productsPromise]);

  if (!activeAds || activeAds.length === 0) return [];
  if (!allProducts || allProducts.length === 0) return [];

  const productMap = new Map<string, Product>();
  allProducts.forEach(p => productMap.set(p.id, p));

  const promotedProducts: Product[] = [];
  const seenProductIds = new Set<string>();

  for (const ad of activeAds) {
    if (!ad.product_id || seenProductIds.has(ad.product_id)) continue;
    const prod = productMap.get(ad.product_id);
    if (prod) {
      seenProductIds.add(ad.product_id);
      promotedProducts.push({
        ...prod,
        is_promoted: true
      });
    }
  }

  if (typeof window !== 'undefined' && promotedProducts.length > 0) {
    try {
      localStorage.setItem('indihunt_promoted_products', JSON.stringify(promotedProducts));
    } catch (e) { }
  }

  return promotedProducts;
}

export async function getAdCampaignEvents(campaignId: string): Promise<AdEvent[]> {
  try {
    const res = await secureApiFetch<AdEvent[]>(`/t/ads/events?campaignId=${encodeURIComponent(campaignId)}`);
    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
  } catch { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`indihunt_ad_events_${campaignId}`) || '[]';
    return JSON.parse(cached);
  }
  return [];
}

// --- Vector & Semantic Search Engine ---

/**
 * Text Vectorizer: Computes a term-frequency char n-gram vector for semantic & fuzzy vector similarity matching
 */
export function computeTextEmbeddingVector(text: string, vocabSize = 128): number[] {
  if (!text) return new Array(vocabSize).fill(0);
  const normalized = text.toLowerCase().trim().replace(/[^\w\s]/g, " ");
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const vec = new Array(vocabSize).fill(0);

  let totalWeight = 0;
  for (const token of tokens) {
    // Word-level hash features
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) % vocabSize;
    }
    vec[hash] += 2;
    totalWeight += 2;

    // Substring 3-gram char hash features
    for (let i = 0; i < token.length - 2; i++) {
      const trigram = token.slice(i, i + 3);
      let triHash = 0;
      for (let j = 0; j < trigram.length; j++) {
        triHash = (triHash * 33 + trigram.charCodeAt(j)) % vocabSize;
      }
      vec[triHash] += 1;
      totalWeight += 1;
    }
  }

  // Normalize L2 norm
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vec;
  return vec.map((val) => val / norm);
}

/**
 * Calculates Cosine Similarity between two embedding vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

/**
 * Vector Search Engine across Products, Threads, and Users
 */
export async function performVectorSearch(
  query: string,
  options?: { limit?: number; minSimilarity?: number }
): Promise<MultiEntitySearchResults> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { products: [], threads: [], users: [], all: [] };
  }

  const queryVector = computeTextEmbeddingVector(q);

  // 1. Fetch Candidate Products across DB API (with search param) + localStorage + cache
  let candidateProducts: Product[] = [];
  try {
    const [searchRes, allRecent] = await Promise.all([
      secureApiFetch<Product[]>(`/t/products?q=${encodeURIComponent(q)}&limit=100`),
      getProducts(),
    ]);

    const map = new Map<string, Product>();
    if (searchRes && searchRes.success && Array.isArray(searchRes.data)) {
      searchRes.data.forEach(p => map.set(p.id, p));
    }
    if (Array.isArray(allRecent)) {
      allRecent.forEach(p => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('indihunt_products');
        if (raw) {
          const localProds: Product[] = JSON.parse(raw);
          localProds.forEach(p => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
        }
      } catch { }
    }
    candidateProducts = Array.from(map.values()).filter(p => !p.is_deleted);
  } catch {
    candidateProducts = await getProducts();
  }

  // 2. Fetch Candidate Threads across DB API + localStorage
  let candidateThreads: Thread[] = [];
  try {
    const [searchThreadsRes, allRecentThreads] = await Promise.all([
      secureApiFetch<Thread[]>(`/t/threads?q=${encodeURIComponent(q)}&limit=100`),
      getThreads(),
    ]);

    const map = new Map<string, Thread>();
    if (searchThreadsRes && searchThreadsRes.success && Array.isArray(searchThreadsRes.data)) {
      searchThreadsRes.data.forEach(t => map.set(t.id, t));
    }
    if (Array.isArray(allRecentThreads)) {
      allRecentThreads.forEach(t => {
        if (!map.has(t.id)) map.set(t.id, t);
      });
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('indihunt_threads');
        if (raw) {
          const localThreads: Thread[] = JSON.parse(raw);
          localThreads.forEach(t => {
            if (!map.has(t.id)) map.set(t.id, t);
          });
        }
      } catch { }
    }
    candidateThreads = Array.from(map.values());
  } catch {
    candidateThreads = await getThreads();
  }

  // 3. Fetch Candidate Profiles across DB API + Admin users
  const qClean = q.replace(/^@/, "");
  let candidateProfiles: Profile[] = [];
  try {
    const [searchProfilesRes, allAdminProfiles] = await Promise.all([
      secureApiFetch<Profile[]>(`/t/profiles?q=${encodeURIComponent(qClean)}`),
      getAllUsersAdmin(),
    ]);

    const map = new Map<string, Profile>();
    if (searchProfilesRes && searchProfilesRes.success && Array.isArray(searchProfilesRes.data)) {
      searchProfilesRes.data.forEach(u => map.set(u.id, u));
    }
    if (Array.isArray(allAdminProfiles)) {
      allAdminProfiles.forEach(u => {
        if (!map.has(u.id)) map.set(u.id, u);
      });
    }
    candidateProfiles = Array.from(map.values());
  } catch {
    candidateProfiles = await getAllUsersAdmin();
  }

  // 1. Vector match products
  const productResults: VectorSearchResult<Product>[] = candidateProducts
    .map((p) => {
      const textToEmbed = `${p.name} ${p.tagline} ${p.description || ""} ${(p.tags || []).join(" ")}`;
      const itemVector = computeTextEmbeddingVector(textToEmbed);
      let vectorScore = calculateCosineSimilarity(queryVector, itemVector);

      // Lexical exact / prefix / substring boost
      const nameLower = (p.name || '').toLowerCase();
      const taglineLower = (p.tagline || '').toLowerCase();
      const descLower = (p.description || '').toLowerCase();
      if (nameLower === q) vectorScore = 1.0;
      else if (nameLower.startsWith(q)) vectorScore = Math.max(vectorScore, 0.95);
      else if (nameLower.includes(q)) vectorScore = Math.max(vectorScore, 0.85 + (q.length / nameLower.length) * 0.15);
      else if (taglineLower.includes(q)) vectorScore = Math.max(vectorScore, 0.75);
      else if ((p.tags || []).some(t => t.toLowerCase().includes(q))) vectorScore = Math.max(vectorScore, 0.70);
      else if (descLower.includes(q)) vectorScore = Math.max(vectorScore, 0.60);

      return {
        item: p,
        type: "product" as const,
        vectorScore: Math.round(vectorScore * 100) / 100,
      };
    })
    .filter((res) => res.vectorScore > (options?.minSimilarity || 0.15))
    .sort((a, b) => b.vectorScore - a.vectorScore);

  // 2. Vector match threads
  const threadResults: VectorSearchResult<Thread>[] = candidateThreads
    .map((t) => {
      const textToEmbed = `${t.title} ${t.body} ${t.category || ""}`;
      const itemVector = computeTextEmbeddingVector(textToEmbed);
      let vectorScore = calculateCosineSimilarity(queryVector, itemVector);

      const titleLower = (t.title || '').toLowerCase();
      if (titleLower === q) vectorScore = 1.0;
      else if (titleLower.startsWith(q)) vectorScore = Math.max(vectorScore, 0.95);
      else if (titleLower.includes(q)) vectorScore = Math.max(vectorScore, 0.85);
      else if ((t.body || '').toLowerCase().includes(q)) vectorScore = Math.max(vectorScore, 0.65);

      return {
        item: t,
        type: "thread" as const,
        vectorScore: Math.round(vectorScore * 100) / 100,
      };
    })
    .filter((res) => res.vectorScore > (options?.minSimilarity || 0.15))
    .sort((a, b) => b.vectorScore - a.vectorScore);

  // 3. Vector match users
  const userResults: VectorSearchResult<Profile>[] = candidateProfiles
    .map((u) => {
      const fullName = u.full_name || "";
      const username = u.username || "";
      const bio = u.bio || "";
      const headline = u.headline || "";
      const role = u.role || "";
      const twitter = u.twitter_url || "";
      const github = u.github_url || "";
      const textToEmbed = `${fullName} ${username} ${bio} ${headline} ${role} ${twitter} ${github}`;
      const itemVector = computeTextEmbeddingVector(textToEmbed);
      let vectorScore = calculateCosineSimilarity(queryVector, itemVector);

      const userLower = username.toLowerCase();
      const nameLower = fullName.toLowerCase();
      if (userLower === qClean || nameLower === qClean) vectorScore = 1.0;
      else if (userLower.startsWith(qClean) || nameLower.startsWith(qClean)) vectorScore = Math.max(vectorScore, 0.95);
      else if (userLower.includes(qClean) || nameLower.includes(qClean)) vectorScore = Math.max(vectorScore, 0.85);
      else if (bio.toLowerCase().includes(qClean) || headline.toLowerCase().includes(qClean) || role.toLowerCase().includes(qClean)) vectorScore = Math.max(vectorScore, 0.65);

      return {
        item: u,
        type: "user" as const,
        vectorScore: Math.round(vectorScore * 100) / 100,
      };
    })
    .filter((res) => res.vectorScore > (options?.minSimilarity || 0.15))
    .sort((a, b) => b.vectorScore - a.vectorScore);

  // 4. Combined ALL results sorted by vector score
  const allResults: VectorSearchResult<Product | Thread | Profile>[] = [
    ...productResults,
    ...threadResults,
    ...userResults,
  ].sort((a, b) => b.vectorScore - a.vectorScore);

  const limit = options?.limit || 100;
  return {
    products: productResults.slice(0, limit),
    threads: threadResults.slice(0, limit),
    users: userResults.slice(0, limit),
    all: allResults.slice(0, limit),
  };
}

/**
 * Dedicated Vector Search for Users (Co-Makers)
 * Allows fast lookup by email, username, and full name.
 */
export async function searchUsersByEmailVector(query: string): Promise<Profile[]> {
  const allUsers = await getAllUsersAdmin();
  const qClean = query.trim().toLowerCase();
  if (!qClean) return [];

  const queryVector = computeTextEmbeddingVector(qClean);

  const results = allUsers.map(u => {
    const email = (u.work_email || (u as any).email || "").toLowerCase();
    const fullName = (u.full_name || "").toLowerCase();
    const username = (u.username || "").toLowerCase();

    // Direct exact or includes match
    if (email === qClean || username === qClean || fullName === qClean) {
      return { user: u, score: 1.0 };
    }
    if (email.includes(qClean) || username.includes(qClean) || fullName.includes(qClean)) {
      return { user: u, score: 0.9 };
    }

    const textToEmbed = `${email} ${fullName} ${username}`;
    const itemVector = computeTextEmbeddingVector(textToEmbed);
    const score = calculateCosineSimilarity(queryVector, itemVector);

    return { user: u, score };
  });

  return results
    .filter(r => r.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.user);
}

// --- Thread Management API ---

export async function updateThread(
  threadId: string,
  userId: string,
  updates: { title?: string; body?: string; category?: string }
): Promise<boolean> {
  clearCache();

  try {
    const res = await secureApiFetch(`/t/threads/${encodeURIComponent(threadId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        userId,
        ...updates,
      }),
    });

    if (res && res.success) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('indihunt_threads');
        if (cached) {
          try {
            const threadsList: Thread[] = JSON.parse(cached);
            const updated = threadsList.map(t =>
              t.id === threadId && (t.user_id === userId || !t.user_id)
                ? { ...t, ...updates }
                : t
            );
            localStorage.setItem('indihunt_threads', JSON.stringify(updated));
          } catch (e) { }
        }
      }
      return true;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_threads');
    if (cached) {
      try {
        const threadsList: Thread[] = JSON.parse(cached);
        const updated = threadsList.map(t =>
          t.id === threadId && (t.user_id === userId || !t.user_id)
            ? { ...t, ...updates }
            : t
        );
        localStorage.setItem('indihunt_threads', JSON.stringify(updated));
      } catch (e) { }
    }
  }
  return true;
}

export async function deleteThread(threadId: string, userId: string): Promise<boolean> {
  clearCache();

  try {
    await secureApiFetch(`/t/threads/${encodeURIComponent(threadId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_threads');
    if (cached) {
      try {
        const threadsList: Thread[] = JSON.parse(cached);
        const filtered = threadsList.filter(t => !(t.id === threadId && (t.user_id === userId || !t.user_id)));
        localStorage.setItem('indihunt_threads', JSON.stringify(filtered));
      } catch (e) { }
    }
  }
  return true;
}

// --- Thread Reports API ---

export async function reportThread(
  threadId: string,
  userId: string,
  reason: string,
  description?: string
): Promise<{ success: boolean; alreadyReported?: boolean }> {
  try {
    const res = await secureApiFetch<{ success: boolean; alreadyReported?: boolean }>('/t/reports', {
      method: 'POST',
      body: JSON.stringify({ threadId, userId, reason, description }),
    });
    if (res && res.success) {
      return res;
    }
  } catch { }

  if (typeof window !== 'undefined') {
    const key = 'indihunt_thread_reports';
    const cached = localStorage.getItem(key) || '[]';
    try {
      const list: ThreadReport[] = JSON.parse(cached);
      const exists = list.some(r => r.thread_id === threadId && r.user_id === userId);
      if (exists) return { success: false, alreadyReported: true };
      const newReport: ThreadReport = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rep_${Date.now()}`,
        thread_id: threadId,
        user_id: userId,
        reason,
        description: description || null,
        created_at: new Date().toISOString(),
      };
      list.push(newReport);
      localStorage.setItem(key, JSON.stringify(list));
      return { success: true, alreadyReported: false };
    } catch (e) {
      console.error("Error reporting thread in localStorage:", e);
    }
  }

  return { success: true };
}

// ─── Notification Feed ────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'mock-1',
    user_id: 'demo',
    type: 'upvote',
    actor_name: 'Priya Sharma',
    actor_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    product_name: 'IndiHunt',
    action_url: '/',
    action_label: 'View product',
    read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    user_id: 'demo',
    type: 'comment',
    actor_name: 'Arjun Mehta',
    actor_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    product_name: 'Your latest launch',
    action_url: '/',
    action_label: 'View comment',
    read: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    user_id: 'demo',
    type: 'follow',
    actor_name: 'Kavya Reddy',
    actor_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    action_url: '/profile',
    action_label: 'View profile',
    read: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

export async function getNotifications(userId?: string): Promise<NotificationItem[]> {
  if (userId) {
    try {
      const res = await secureApiFetch<any[]>(`/t/notifications?userId=${encodeURIComponent(userId)}&limit=50`);
      const rows = res?.data;
      if (rows && Array.isArray(rows) && rows.length > 0) {
        const mapped = rows.map((n: any) => {
          const d = n.data ?? {};
          return {
            id: n.id,
            user_id: n.user_id,
            type: n.type,
            actor_id: n.actor_id,
            actor_name: n.actor?.full_name || n.actor?.username || d.actor_name || 'Someone',
            actor_username: n.actor?.username,
            actor_avatar: n.actor?.avatar_url || d.actor_avatar || '',
            secondary_avatar: d.secondary_avatar,
            entity_type: n.entity_type,
            entity_id: n.entity_id,
            product_name: d.product_name,
            product_logo: d.product_logo,
            thread_title: d.thread_title,
            category: d.category,
            reason_text: d.reason_text,
            body_text: d.body_text,
            action_url: d.action_url,
            action_label: d.action_label,
            data: d,
            read: n.read,
            created_at: n.created_at,
          } as NotificationItem;
        });
        // Persist to localStorage so offline/fallback path works
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`indihunt_notifications_${userId}`, JSON.stringify(mapped));
          } catch (e) {}
        }
        return mapped;
      }
      // rows empty (no notifications in DB yet) — return empty, not mock
      if (res?.success && rows && Array.isArray(rows) && rows.length === 0) {
        return [];
      }
    } catch { }
  }

  if (typeof window !== 'undefined') {
    const key = `indihunt_notifications_${userId || 'guest'}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try { return JSON.parse(cached) as NotificationItem[]; } catch (e) { }
    }
  }

  // Only show mock notifications to guests (no userId)
  if (!userId) return MOCK_NOTIFICATIONS;
  return [];
}


export async function markNotificationAsRead(notifId: string, userId?: string): Promise<boolean> {
  try {
    await secureApiFetch('/t/notifications', {
      method: 'PUT',
      body: JSON.stringify({ id: notifId, userId }),
    });
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const key = `indihunt_notifications_${userId || 'guest'}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const list: NotificationItem[] = JSON.parse(cached);
        const nextList = list.map(n => n.id === notifId ? { ...n, read: true } : n);
        localStorage.setItem(key, JSON.stringify(nextList));
      } catch (e) { }
    }
  }

  return true;
}

export async function markAllNotificationsAsRead(userId?: string): Promise<boolean> {
  if (userId) {
    try {
      await secureApiFetch('/t/notifications', {
        method: 'PUT',
        body: JSON.stringify({ markAll: true, userId }),
      });
    } catch (err) { }
  }

  if (typeof window !== 'undefined') {
    const key = `indihunt_notifications_${userId || 'guest'}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const list: NotificationItem[] = JSON.parse(cached);
        const nextList = list.map(n => ({ ...n, read: true }));
        localStorage.setItem(key, JSON.stringify(nextList));
      } catch (e) { }
    }
  }

  return true;
}

export const DEFAULT_USER_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  user_id: "default",
  product_updates_inapp: true,
  forum_threads_inapp: true,
  forum_status_inapp: true,
  comment_digest_inapp: true,
  maker_reports_inapp: true,
  product_feedback_inapp: true,
  personal_achievements_inapp: true,
  product_recognitions_inapp: true,
  discovery_notifications: true,
  new_followers_inapp: true,
  new_followers_push: true,
  friend_posts_inapp: true,
  friend_posts_push: true,
  mentions_inapp: true,
  mentions_push: true,
  unsubscribe_all: false,
  auto_follow_commenting: true,
};

export async function getUserNotificationSettings(userId?: string): Promise<UserNotificationSettings> {
  if (userId) {
    try {
      const res = await secureApiFetch<UserNotificationSettings>(`/t/notifications/settings?userId=${encodeURIComponent(userId)}`);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) { }
  }

  if (typeof window !== 'undefined') {
    const key = `indihunt_notif_settings_${userId || 'guest'}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
  }

  return { ...DEFAULT_USER_NOTIFICATION_SETTINGS, user_id: userId || 'guest' };
}

export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<UserNotificationSettings>
): Promise<UserNotificationSettings> {
  const current = await getUserNotificationSettings(userId);
  const updated: UserNotificationSettings = {
    ...current,
    ...settings,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await secureApiFetch<UserNotificationSettings>('/t/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const key = `indihunt_notif_settings_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(updated));
  }

  return updated;
}

export async function addNotification(item: Partial<NotificationItem>): Promise<boolean> {
  const userId = item.user_id || 'u-1';

  // Check notification settings for the user
  const settings = await getUserNotificationSettings(userId);
  if (settings.unsubscribe_all) {
    return false;
  }

  // Type-specific toggle checks matching NotificationItem['type'] union
  if (item.type === 'hunted' && !settings.product_updates_inapp) return false;
  if (item.type === 'thread_status' && !settings.forum_status_inapp) return false;
  if ((item.type === 'comment' || item.type === 'reply') && !settings.comment_digest_inapp) return false;
  if (item.type === 'follow' && !settings.new_followers_inapp) return false;
  if (item.type === 'following_activity' && !settings.friend_posts_inapp) return false;
  if (item.type === 'mention' && !settings.mentions_inapp) return false;

  const newNotif: NotificationItem = {
    id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}`),
    user_id: userId,
    type: item.type || 'hunted',
    actor_name: item.actor_name,
    actor_username: item.actor_username,
    actor_avatar: item.actor_avatar,
    secondary_avatar: item.secondary_avatar,
    product_name: item.product_name,
    product_logo: item.product_logo,
    thread_title: item.thread_title,
    category: item.category,
    body_text: item.body_text,
    reason_text: item.reason_text,
    action_label: item.action_label,
    action_url: item.action_url,
    read: item.read ?? false,
    created_at: item.created_at || new Date().toISOString(),
  };

  try {
    await secureApiFetch('/t/notifications', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        actorId: (item as any).actor_id,
        title: item.product_name || item.thread_title || (item as any).title || 'New Notification',
        message: item.body_text || item.reason_text || (item as any).message || '',
        type: item.type,
        link: item.action_url || (item as any).link
      }),
    });
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const key = `indihunt_notifications_${userId}`;
    const cached = localStorage.getItem(key);
    let list: NotificationItem[] = [];
    if (cached) {
      try { list = JSON.parse(cached); } catch (e) { }
    } else {
      list = [...MOCK_NOTIFICATIONS];
    }
    list.unshift(newNotif);
    localStorage.setItem(key, JSON.stringify(list));
  }

  return true;
}

/**
 * Deactivate user account temporarily.
 */
export async function deactivateUserAccount(userId: string): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    await secureApiFetch('/t/account', {
      method: 'POST',
      body: JSON.stringify({ action: 'deactivate', userId }),
    });
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_profiles');
    if (cached) {
      try {
        const profs: Profile[] = JSON.parse(cached);
        const updated = profs.map(p => p.id === userId ? { ...p, is_deactivated: true, deactivated_at: now } : p);
        localStorage.setItem('indihunt_profiles', JSON.stringify(updated));
      } catch (e) { }
    }
  }

  await signOut();
  return true;
}

/**
 * Permanently delete and anonymize user account while preserving all products on IndiHunt.
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  const now = new Date().toISOString();

  try {
    await secureApiFetch('/t/account', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', userId }),
    });
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_profiles');
    if (cached) {
      try {
        const profs: Profile[] = JSON.parse(cached);
        const updated = profs.map(p => p.id === userId ? {
          ...p,
          full_name: 'Deleted User',
          username: `deleted_${userId.substring(0, 8)}`,
          bio: undefined,
          avatar_url: undefined,
          is_deactivated: true,
          deleted_at: now,
        } : p);
        localStorage.setItem('indihunt_profiles', JSON.stringify(updated));
      } catch (e) { }
    }
  }

  await signOut();
  return true;
}

/**
 * Check if a profile has admin privileges
 */
export function isAdminUser(profile?: Profile | null): boolean {
  if (!profile) return false;
  return profile.role === 'admin';
}

/**
 * Fetch all registered users for Admin Dashboard
 */
export async function getAllUsersAdmin(): Promise<Profile[]> {
  try {
    const res = await secureApiFetch<Profile[]>('/t/admin/users');
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_profiles');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
  }

  return Object.values(MOCK_PROFILES);
}

/**
 * Fetch all products for Admin Dashboard
 */
export async function getAllProductsAdmin(): Promise<Product[]> {
  const prods = await getProducts();
  return prods || [];
}

/**
 * Update user role (e.g. 'user' -> 'admin')
 */
export async function updateUserRole(userId: string, newRole: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ success: boolean }>('/t/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res && res.success) return true;
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_profiles');
    if (cached) {
      try {
        const list: Profile[] = JSON.parse(cached);
        const next = list.map(p => p.id === userId ? { ...p, role: newRole } : p);
        localStorage.setItem('indihunt_profiles', JSON.stringify(next));
      } catch (e) { }
    }
  }

  return true;
}

/**
 * Admin delete/suspend product
 */
export async function deleteProductAdmin(productId: string): Promise<boolean> {
  try {
    await secureApiFetch(`/t/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_products');
    if (cached) {
      try {
        const list: Product[] = JSON.parse(cached);
        const filtered = list.filter(p => p.id !== productId);
        localStorage.setItem('indihunt_products', JSON.stringify(filtered));
      } catch (e) { }
    }
  }

  return true;
}

/**
 * Delete product by user (only if product has not launched yet and user is maker)
 */
export async function deleteProductByUser(productId: string, userId: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ success: boolean }>(`/t/products/${encodeURIComponent(productId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('indihunt_products');
        if (cached) {
          try {
            const list: Product[] = JSON.parse(cached);
            const filtered = list.filter(p => p.id !== productId);
            localStorage.setItem('indihunt_products', JSON.stringify(filtered));
          } catch (e) { }
        }
        clearCache('products');
      }
      return true;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_products');
    if (cached) {
      try {
        const list: Product[] = JSON.parse(cached);
        const product = list.find(p => p.id === productId);
        if (product) {
          if (product.maker_id !== userId) {
            return false;
          }
          const scheduledTime = product.scheduled_for ? new Date(product.scheduled_for).getTime() : 0;
          if (scheduledTime <= Date.now()) {
            return false;
          }
          const filtered = list.filter(p => p.id !== productId);
          localStorage.setItem('indihunt_products', JSON.stringify(filtered));
        }
      } catch (e) { }
    }
    clearCache('products');
  }

  return true;
}

// ─── Indie Page Customizer Assets (Themes & Fonts) ─────────────────────────

export const INDIE_PAGE_FONTS: { id: string; name: string; fontFamily: string; previewText: string; category: "sans-serif" | "serif" | "monospace" | "display" | "handwriting"; isVariable?: boolean }[] = [
  // Sans-serif Fonts (User requested Geist, ABeeZee, AR One Sans, Abel, Aclonica, etc.)
  { id: "geist", name: "Geist", fontFamily: "'Geist', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "abeezee", name: "ABeeZee", fontFamily: "'ABeeZee', sans-serif", previewText: "Aa", category: "sans-serif" },
  { id: "ar-one-sans", name: "AR One Sans", fontFamily: "'AR One Sans', sans-serif", previewText: "Aa", category: "sans-serif" },
  { id: "abel", name: "Abel", fontFamily: "'Abel', sans-serif", previewText: "Aa", category: "sans-serif" },
  { id: "aclonica", name: "Aclonica", fontFamily: "'Aclonica', sans-serif", previewText: "Aa", category: "display" },
  { id: "inter", name: "Inter", fontFamily: "'Inter', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "outfit", name: "Outfit", fontFamily: "'Outfit', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "poppins", name: "Poppins", fontFamily: "'Poppins', sans-serif", previewText: "Aa", category: "sans-serif" },
  { id: "space-grotesk", name: "Space Grotesk", fontFamily: "'Space Grotesk', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "jakarta", name: "Plus Jakarta", fontFamily: "'Plus Jakarta Sans', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "montserrat", name: "Montserrat", fontFamily: "'Montserrat', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "roboto", name: "Roboto", fontFamily: "'Roboto', sans-serif", previewText: "Aa", category: "sans-serif" },
  { id: "open-sans", name: "Open Sans", fontFamily: "'Open Sans', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "lato", name: "Lato", fontFamily: "'Lato', sans-serif", previewText: "Aa", category: "sans-serif" },
  { id: "raleway", name: "Raleway", fontFamily: "'Raleway', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "urbanist", name: "Urbanist", fontFamily: "'Urbanist', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "work-sans", name: "Work Sans", fontFamily: "'Work Sans', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "dm-sans", name: "DM Sans", fontFamily: "'DM Sans', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "lexend", name: "Lexend", fontFamily: "'Lexend', sans-serif", previewText: "Aa", category: "sans-serif", isVariable: true },
  { id: "satoshi", name: "Satoshi", fontFamily: "'Satoshi', sans-serif", previewText: "Aa", category: "sans-serif" },
  { id: "cabinet", name: "Cabinet Grotesk", fontFamily: "'Cabinet Grotesk', sans-serif", previewText: "Aa", category: "sans-serif" },

  // Serif Fonts
  { id: "playfair", name: "Playfair Display", fontFamily: "'Playfair Display', serif", previewText: "Aa", category: "serif", isVariable: true },
  { id: "lora", name: "Lora", fontFamily: "'Lora', serif", previewText: "Aa", category: "serif", isVariable: true },
  { id: "merriweather", name: "Merriweather", fontFamily: "'Merriweather', serif", previewText: "Aa", category: "serif" },
  { id: "cinzel", name: "Cinzel", fontFamily: "'Cinzel', serif", previewText: "Aa", category: "serif", isVariable: true },
  { id: "serif", name: "Classic Serif", fontFamily: "Georgia, serif", previewText: "Aa", category: "serif" },
  { id: "cormorant", name: "Cormorant Garamond", fontFamily: "'Cormorant Garamond', serif", previewText: "Aa", category: "serif" },

  // Display Fonts
  { id: "syne", name: "Syne", fontFamily: "'Syne', sans-serif", previewText: "Aa", category: "display", isVariable: true },
  { id: "oswald", name: "Oswald", fontFamily: "'Oswald', sans-serif", previewText: "Aa", category: "display", isVariable: true },
  { id: "bebas", name: "Bebas Neue", fontFamily: "'Bebas Neue', sans-serif", previewText: "Aa", category: "display" },
  { id: "righteous", name: "Righteous", fontFamily: "'Righteous', cursive", previewText: "Aa", category: "display" },

  // Monospace Fonts
  { id: "mono", name: "Roboto Mono", fontFamily: "'Roboto Mono', monospace", previewText: "Aa", category: "monospace", isVariable: true },
  { id: "fira-code", name: "Fira Code", fontFamily: "'Fira Code', monospace", previewText: "Aa", category: "monospace", isVariable: true },
  { id: "space-mono", name: "Space Mono", fontFamily: "'Space Mono', monospace", previewText: "Aa", category: "monospace" },
  { id: "jetbrains", name: "JetBrains Mono", fontFamily: "'JetBrains Mono', monospace", previewText: "Aa", category: "monospace", isVariable: true },

  // Handwriting / Script Fonts
  { id: "pacifico", name: "Pacifico", fontFamily: "'Pacifico', cursive", previewText: "Aa", category: "handwriting" },
  { id: "dancing", name: "Dancing Script", fontFamily: "'Dancing Script', cursive", previewText: "Aa", category: "handwriting", isVariable: true },
  { id: "caveat", name: "Caveat", fontFamily: "'Caveat', cursive", previewText: "Aa", category: "handwriting", isVariable: true }
];

export const INDIE_PAGE_THEMES: { id: string; name: string; bg: string; sidebar: string; card: string; cardHover: string; text: string; textMuted: string; accent: string; border: string; swatch: string[] }[] = [
  // Original & Tweakcn Themes Presets
  { id: "light", name: "Clean Light", bg: "#f5f5f4", sidebar: "#f5f5f4", card: "#ffffff", cardHover: "#fafaf9", text: "#1c1917", textMuted: "#78716c", accent: "#ff5733", border: "#e7e5e4", swatch: ["#ffffff", "#f5f5f4", "#ff5733"] },
  { id: "dark", name: "Midnight Dark", bg: "#18181b", sidebar: "#18181b", card: "#27272a", cardHover: "#3f3f46", text: "#fafafa", textMuted: "#a1a1aa", accent: "#f97316", border: "#3f3f46", swatch: ["#18181b", "#27272a", "#f97316"] },
  { id: "tweakcn-light", name: "Tweakcn Light Warm", bg: "#f7f9fa", sidebar: "#edf1f3", card: "#ffffff", cardHover: "#f0f4f6", text: "#1e293b", textMuted: "#64748b", accent: "#ff453a", border: "#cbd5e1", swatch: ["#f7f9fa", "#ffffff", "#ff453a"] },
  { id: "tweakcn-dark", name: "Tweakcn Soft Dark", bg: "#181c24", sidebar: "#13161d", card: "#202530", cardHover: "#2a313f", text: "#f1f5f9", textMuted: "#94a3b8", accent: "#38bdf8", border: "#334155", swatch: ["#181c24", "#202530", "#38bdf8"] },
  { id: "neobrutalism-light", name: "Neo-Brutalist Light", bg: "#ffffff", sidebar: "#f4f4f5", card: "#ffffff", cardHover: "#fffbeb", text: "#000000", textMuted: "#3f3f46", accent: "#dc2626", border: "#000000", swatch: ["#ffffff", "#f4f4f5", "#dc2626"] },
  { id: "neobrutalism-dark", name: "Neo-Brutalist Dark", bg: "#000000", sidebar: "#18181b", card: "#27272a", cardHover: "#3f3f46", text: "#ffffff", textMuted: "#d4d4d8", accent: "#f43f5e", border: "#ffffff", swatch: ["#000000", "#27272a", "#f43f5e"] },
  { id: "emerald-mint", name: "Mint Emerald", bg: "#f0fdf4", sidebar: "#dcfce7", card: "#ffffff", cardHover: "#dcfce7", text: "#064e3b", textMuted: "#047857", accent: "#10b981", border: "#a7f3d0", swatch: ["#f0fdf4", "#ffffff", "#10b981"] },
  { id: "dracula", name: "Dracula Purple", bg: "#282a36", sidebar: "#21222c", card: "#44475a", cardHover: "#6272a4", text: "#f8f8f2", textMuted: "#bd93f9", accent: "#ff79c6", border: "#6272a4", swatch: ["#282a36", "#44475a", "#ff79c6"] },
  { id: "cyber-punk", name: "Cyber Neon", bg: "#09090b", sidebar: "#18181b", card: "#18181b", cardHover: "#27272a", text: "#fafafa", textMuted: "#a1a1aa", accent: "#a855f7", border: "#3f3f46", swatch: ["#09090b", "#18181b", "#a855f7"] },
  { id: "ocean", name: "Ocean Blue", bg: "#eff6ff", sidebar: "#dbeafe", card: "#ffffff", cardHover: "#dbeafe", text: "#1e3a5f", textMuted: "#64748b", accent: "#2563eb", border: "#bfdbfe", swatch: ["#eff6ff", "#ffffff", "#2563eb"] },
  { id: "oceanic-deep", name: "Oceanic Deep", bg: "#0b132b", sidebar: "#1c2541", card: "#1c2541", cardHover: "#3a506b", text: "#ffffff", textMuted: "#5bc0be", accent: "#6fffe9", border: "#3a506b", swatch: ["#0b132b", "#1c2541", "#6fffe9"] },
  { id: "forest", name: "Forest Deep", bg: "#052e16", sidebar: "#064e3b", card: "#14532d", cardHover: "#166534", text: "#f0fdf4", textMuted: "#86efac", accent: "#22c55e", border: "#166534", swatch: ["#052e16", "#14532d", "#22c55e"] },
  { id: "sunset", name: "Sunset Orange", bg: "#fff7ed", sidebar: "#ffedd5", card: "#ffffff", cardHover: "#ffedd5", text: "#431407", textMuted: "#78716c", accent: "#ea580c", border: "#fed7aa", swatch: ["#fff7ed", "#ffffff", "#ea580c"] },
  { id: "lavender", name: "Lavender Velvet", bg: "#faf5ff", sidebar: "#f3e8ff", card: "#ffffff", cardHover: "#f3e8ff", text: "#3b0764", textMuted: "#6b7280", accent: "#9333ea", border: "#e9d5ff", swatch: ["#faf5ff", "#ffffff", "#9333ea"] },
  { id: "rose", name: "Rose Velvet", bg: "#fff1f2", sidebar: "#ffe4e6", card: "#ffffff", cardHover: "#ffe4e6", text: "#4c0519", textMuted: "#6b7280", accent: "#e11d48", border: "#fecdd3", swatch: ["#fff1f2", "#ffffff", "#e11d48"] },
  { id: "slate", name: "Slate Modern", bg: "#f8fafc", sidebar: "#f1f5f9", card: "#ffffff", cardHover: "#f1f5f9", text: "#0f172a", textMuted: "#64748b", accent: "#475569", border: "#e2e8f0", swatch: ["#f8fafc", "#ffffff", "#475569"] },
  { id: "amber", name: "Golden Amber", bg: "#fffbeb", sidebar: "#fef3c7", card: "#ffffff", cardHover: "#fef3c7", text: "#451a03", textMuted: "#78716c", accent: "#d97706", border: "#fde68a", swatch: ["#fffbeb", "#ffffff", "#d97706"] },
  { id: "noir", name: "Noir Minimal", bg: "#0a0a0a", sidebar: "#171717", card: "#171717", cardHover: "#262626", text: "#f5f5f5", textMuted: "#737373", accent: "#e5e5e5", border: "#262626", swatch: ["#0a0a0a", "#171717", "#e5e5e5"] },
  { id: "nord", name: "Nordic Frost", bg: "#2e3440", sidebar: "#3b4252", card: "#3b4252", cardHover: "#434c5e", text: "#eceff4", textMuted: "#d8dee9", accent: "#88c0d0", border: "#4c566a", swatch: ["#2e3440", "#3b4252", "#88c0d0"] },
  { id: "nordic-frost", name: "Ice Blue Frost", bg: "#f0f9ff", sidebar: "#e0f2fe", card: "#ffffff", cardHover: "#bae6fd", text: "#0c4a6e", textMuted: "#0369a1", accent: "#0284c7", border: "#7dd3fc", swatch: ["#f0f9ff", "#ffffff", "#0284c7"] },
  { id: "synthwave", name: "Synthwave 80s", bg: "#1a103c", sidebar: "#130a24", card: "#2d1b69", cardHover: "#3d238c", text: "#f3e8ff", textMuted: "#c084fc", accent: "#f43f5e", border: "#4c1d95", swatch: ["#1a103c", "#2d1b69", "#f43f5e"] },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha", bg: "#1e1e2e", sidebar: "#181825", card: "#313244", cardHover: "#45475a", text: "#cdd6f4", textMuted: "#a6adc8", accent: "#cba6f7", border: "#45475a", swatch: ["#1e1e2e", "#313244", "#cba6f7"] },
  { id: "linear-dark", name: "Linear Dark Minimal", bg: "#0f1015", sidebar: "#0a0b0e", card: "#16181f", cardHover: "#21242e", text: "#f3f4f6", textMuted: "#9ca3af", accent: "#5e6ad2", border: "#262636", swatch: ["#0f1015", "#16181f", "#5e6ad2"] },
  { id: "matcha", name: "Matcha Latte", bg: "#f7fee7", sidebar: "#ecfccb", card: "#ffffff", cardHover: "#ecfccb", text: "#1a2e05", textMuted: "#4d7c0f", accent: "#65a30d", border: "#d9f99d", swatch: ["#f7fee7", "#ffffff", "#65a30d"] },
  { id: "bubblegum", name: "Bubblegum Pop", bg: "#fdf2f8", sidebar: "#fce7f3", card: "#ffffff", cardHover: "#fce7f3", text: "#701a75", textMuted: "#a21caf", accent: "#db2777", border: "#fbcfe8", swatch: ["#fdf2f8", "#ffffff", "#db2777"] },
  { id: "terminal", name: "Hacker Terminal", bg: "#0c100d", sidebar: "#0c100d", card: "#131a14", cardHover: "#1c261e", text: "#22c55e", textMuted: "#15803d", accent: "#4ade80", border: "#166534", swatch: ["#0c100d", "#131a14", "#4ade80"] },
  { id: "coffee", name: "Espresso Roast", bg: "#1c1917", sidebar: "#292524", card: "#292524", cardHover: "#44403c", text: "#fafaf9", textMuted: "#a8a29e", accent: "#d97706", border: "#44403c", swatch: ["#1c1917", "#292524", "#d97706"] },
  { id: "cream", name: "Soft Cream", bg: "#fafaf9", sidebar: "#f5f5f4", card: "#ffffff", cardHover: "#f5f5f4", text: "#292524", textMuted: "#78716c", accent: "#d97706", border: "#e7e5e4", swatch: ["#fafaf9", "#ffffff", "#d97706"] },
  { id: "electric", name: "Electric Purple", bg: "#31104b", sidebar: "#4a1275", card: "#4a1275", cardHover: "#5b1690", text: "#ffffff", textMuted: "#d8b4fe", accent: "#e879f9", border: "#6b21a8", swatch: ["#31104b", "#4a1275", "#e879f9"] },
  { id: "solarized-light", name: "Solarized Light", bg: "#fdf6e3", sidebar: "#eee8d5", card: "#ffffff", cardHover: "#eee8d5", text: "#073642", textMuted: "#657b83", accent: "#b58900", border: "#eee8d5", swatch: ["#fdf6e3", "#ffffff", "#b58900"] },
  { id: "solarized-dark", name: "Solarized Dark", bg: "#002b36", sidebar: "#073642", card: "#073642", cardHover: "#586e75", text: "#fdf6e3", textMuted: "#93a1a1", accent: "#268bd2", border: "#586e75", swatch: ["#002b36", "#073642", "#268bd2"] },
  { id: "monokai", name: "Monokai Pro", bg: "#2d2a2e", sidebar: "#221f22", card: "#403e41", cardHover: "#5b595c", text: "#fcfcfa", textMuted: "#939293", accent: "#ffd866", border: "#5b595c", swatch: ["#2d2a2e", "#403e41", "#ffd866"] },
  { id: "cherryblossom", name: "Sakura Blossom", bg: "#fff5f7", sidebar: "#ffe3e8", card: "#ffffff", cardHover: "#ffe3e8", text: "#501222", textMuted: "#9c2a47", accent: "#ff6584", border: "#ffccd5", swatch: ["#fff5f7", "#ffffff", "#ff6584"] },
  { id: "pastelmint", name: "Pastel Sage", bg: "#f2f7f4", sidebar: "#e1ede6", card: "#ffffff", cardHover: "#e1ede6", text: "#1b382b", textMuted: "#466e5b", accent: "#52b788", border: "#c7e0d4", swatch: ["#f2f7f4", "#ffffff", "#52b788"] },
  { id: "monochrome", name: "Monochrome Pitch", bg: "#ffffff", sidebar: "#fafafa", card: "#ffffff", cardHover: "#f4f4f5", text: "#000000", textMuted: "#52525b", accent: "#000000", border: "#18181b", swatch: ["#ffffff", "#ffffff", "#000000"] }
];


export async function getIndiePage(username: string): Promise<{ profile: Profile; products: Product[] } | null> {
  if (!username) return null;
  const cleanUser = username.replace(/^@/, '').toLowerCase().trim();

  let profile: Profile | null = null;

  try {
    profile = await getUserProfileByUsername(cleanUser);
  } catch (e) { }

  // Check for local storage profile override for instant theme & font updates
  if (typeof window !== 'undefined') {
    try {
      const profiles: Profile[] = JSON.parse(localStorage.getItem('indihunt_profiles') || '[]');
      const localProf = profiles.find(p => p.username?.toLowerCase() === cleanUser);
      const currentProf = JSON.parse(localStorage.getItem('indihunt_profile') || 'null');
      const currentUser = JSON.parse(localStorage.getItem('indihunt_user') || 'null');
      const resolvedProf = localProf ||
        (currentProf && currentProf.username?.toLowerCase() === cleanUser ? currentProf : null) ||
        (currentUser && currentUser.username?.toLowerCase() === cleanUser ? currentUser : null);

      if (resolvedProf) {
        profile = profile ? { ...profile, ...resolvedProf } : resolvedProf;
      }
    } catch (e) { }
  }

  // Fallback for sonu.hs9557 or default handles
  if (!profile && (cleanUser === "sonu.hs9557" || cleanUser === "himanshu")) {
    profile = {
      id: "usr-sonu-hs9557",
      username: "sonu.hs9557",
      full_name: "Himanshu Sharma",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
      headline: "Building next-gen indie maker tools • Founder @ IndiHunt",
      bio: "Indie hacker, product builder & hunter based in India.",
      location: "India",
      indie_page_enabled: true,
      indie_page_theme: "light",
      indie_page_font: "inter",
      monthly_revenue: "$1,200 MRR",
      created_at: new Date().toISOString()
    } as any;
  }

  if (!profile) return null;
  if (profile.indie_page_enabled === false) return null;

  const productMap = new Map<string, Product>();

  // 1. Fetch user products via API
  try {
    const userProducts = await getUserProducts(profile.id);
    if (Array.isArray(userProducts)) {
      userProducts.forEach(p => {
        if (p && p.id && !p.is_deleted && p.status !== 'draft') {
          productMap.set(p.id, p);
        }
      });
    }
  } catch (err) { }

  // 2. Fetch from localStorage to include any locally created products
  if (typeof window !== 'undefined') {
    try {
      const allLocal: Product[] = JSON.parse(localStorage.getItem('indihunt_products') || '[]');
      allLocal.forEach(p => {
        if (
          p &&
          p.id &&
          !p.is_deleted &&
          p.status !== 'draft' &&
          (
            p.maker_id === profile!.id ||
            p.maker?.id === profile!.id ||
            p.maker?.username?.toLowerCase() === cleanUser ||
            (p as any).maker_username?.toLowerCase() === cleanUser
          )
        ) {
          productMap.set(p.id, p);
        }
      });
    } catch (e) { }
  }

  // 3. Fallback to all products filter if map is still empty
  if (productMap.size === 0) {
    try {
      const allProds = await getProducts(profile.id);
      if (allProds && allProds.length > 0) {
        allProds.forEach(p => {
          if (
            p &&
            p.id &&
            !p.is_deleted &&
            p.status !== 'draft' &&
            (
              p.maker_id === profile!.id ||
              p.maker?.id === profile!.id ||
              p.maker?.username?.toLowerCase() === cleanUser
            )
          ) {
            productMap.set(p.id, p);
          }
        });
      }
    } catch (err) { }
  }

  let productsList = Array.from(productMap.values());

  // Only if zero products exist anywhere for mock demo user, provide starter demos
  if (productsList.length === 0 && (cleanUser === "sonu.hs9557" || cleanUser === "himanshu")) {
    const makerProd: Product = {
      id: "prod-sonu-maker-1",
      name: "IndiHunt",
      tagline: "The product discovery platform for Indian indie hackers & builders",
      description: "Discover, launch, and upvote indie software products built by Indian makers.",
      logo_url: "/logo.png",
      website_url: "https://indihunt.in",
      maker_id: profile.id,
      maker: profile,
      category: "Productivity",
      upvotes_count: 130,
      comments_count: 16,
      status: "published",
      created_at: new Date().toISOString(),
      worked_on_launch: true,
      role: "maker"
    } as any;

    productsList = [makerProd];
  }

  productsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { profile, products: productsList };
}

/* ==========================================================================
   Dodo Payments & Ad Budget Logs System (v3.6.0)
   ========================================================================== */

export async function getUserPolarPayments(userId: string): Promise<PaymentRecord[]> {
  return getUserPayments(userId);
}

export async function getUserPayments(userId: string): Promise<PaymentRecord[]> {
  try {
    const res = await secureApiFetch<PaymentRecord[]>(`/t/payments?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_payments') || localStorage.getItem('indihunt_polar_payments') || '[]';
    const list: PaymentRecord[] = JSON.parse(cached);
    return list.filter(p => p.user_id === userId);
  }
  return [];
}

export async function getAdBudgetTransactions(campaignId: string): Promise<AdBudgetTransaction[]> {
  try {
    const res = await secureApiFetch<AdBudgetTransaction[]>(`/t/payments?campaignId=${encodeURIComponent(campaignId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_ad_budget_tx') || '[]';
    const list: AdBudgetTransaction[] = JSON.parse(cached);
    return list.filter(t => t.campaign_id === campaignId);
  }
  return [];
}

export async function getAllPolarPayments(): Promise<PaymentRecord[]> {
  return getAllPayments();
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  try {
    const res = await secureApiFetch<PaymentRecord[]>('/t/payments?all=true');
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) { }

  // LocalStorage Fallback
  if (typeof window !== 'undefined') {
    const result: PaymentRecord[] = [];
    const cachedPayments = localStorage.getItem('indihunt_payments') || localStorage.getItem('indihunt_polar_payments');
    if (cachedPayments) {
      try {
        const list: PaymentRecord[] = JSON.parse(cachedPayments);
        result.push(...list);
      } catch (e) { }
    }
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }
  return [];
}

export async function recordPolarPayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {
  return recordPayment(payment);
}

export async function recordPayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {
  const newRecord: PaymentRecord = {
    id: payment.id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: payment.user_id || "admin",
    campaign_id: payment.campaign_id || null,
    dodo_payment_id: payment.dodo_payment_id || null,
    dodo_customer_id: payment.dodo_customer_id || null,
    polar_checkout_id: payment.polar_checkout_id || null,
    polar_order_id: payment.polar_order_id || null,
    amount: payment.amount || 0,
    currency: payment.currency || "usd",
    status: payment.status || "succeeded",
    payment_method: payment.payment_method || "dodo",
    metadata: payment.metadata || {},
    created_at: new Date().toISOString()
  };

  try {
    const res = await secureApiFetch<PaymentRecord>('/t/payments', {
      method: 'POST',
      body: JSON.stringify(newRecord),
    });
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_payments') || localStorage.getItem('indihunt_polar_payments');
    let list: PaymentRecord[] = cached ? JSON.parse(cached) : [];
    list.unshift(newRecord);
    localStorage.setItem('indihunt_payments', JSON.stringify(list));
  }

  return newRecord;
}

export async function updatePaymentStatusInDb(paymentId: string, status: "succeeded" | "pending" | "failed" | "refunded", notes?: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ success: boolean }>('/t/payments', {
      method: 'PUT',
      body: JSON.stringify({ paymentId, status, notes }),
    });
    if (res && res.success) return true;
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_payments') || localStorage.getItem('indihunt_polar_payments');
    let list: PaymentRecord[] = cached ? JSON.parse(cached) : [];
    list = list.map(p => p.id === paymentId ? { ...p, status, metadata: { ...p.metadata, notes } } : p);
    localStorage.setItem('indihunt_payments', JSON.stringify(list));
    return true;
  }
  return true;
}

export async function getAllAdCampaignsAllUsers(): Promise<AdCampaign[]> {
  try {
    const res = await secureApiFetch<AdCampaign[]>('/t/ads/campaigns?all=true');
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('indihunt_ad_campaigns');
    if (cached) {
      try {
        const list: AdCampaign[] = JSON.parse(cached);
        if (list.length > 0) return list;
      } catch (e) { }
    }
  }

  return [];
}

export async function getTopHuntersData(timeframe: string = "all_time"): Promise<Hunter[]> {
  const cacheKey = `public_top_hunters_${timeframe}_v2`;
  const cachedHunters = await getRedisCache<Hunter[]>(cacheKey);
  if (cachedHunters && Array.isArray(cachedHunters) && cachedHunters.length > 0) {
    return cachedHunters;
  }

  try {
    const res = await secureApiFetch<Hunter[]>(`/t/leaderboard/top-hunters?timeRange=${encodeURIComponent(timeframe)}&limit=100`);
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      setRedisCache(cacheKey, res.data, 60).catch(() => { });
      return res.data;
    }
  } catch { }

  const now = Date.now();
  let timeLimitMs = 0;
  if (timeframe === "weekly" || timeframe === "last_week") timeLimitMs = 7 * 86400000;
  else if (timeframe === "monthly" || timeframe === "last_month") timeLimitMs = 30 * 86400000;
  else if (timeframe === "yearly" || timeframe === "last_year") timeLimitMs = 365 * 86400000;

  // Load products to accurately calculate per-maker statistics
  let products = getCachedProducts();
  if (!products || products.length === 0) {
    try {
      products = await getProducts();
    } catch {
      products = [];
    }
  }

  if (timeLimitMs > 0 && products.length > 0) {
    products = products.filter(p => p.created_at && (now - new Date(p.created_at).getTime() <= timeLimitMs));
  }

  // Fallback: derive directly from products and profiles
  const hunterMap = new Map<string, Hunter>();

  products.forEach(p => {
    if (p.maker) {
      const key = (p.maker.username || p.maker.id || p.maker_id || '').toLowerCase();
      if (key) {
        const existing = hunterMap.get(key) || {
          id: p.maker.id || key,
          name: p.maker.full_name || p.maker.username || 'Indie Builder',
          username: p.maker.username || key,
          avatar_url: p.maker.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          bio: p.maker.headline || p.maker.bio || 'IndiHunt Creator',
          hunts_count: 0,
          upvotes_count: 0,
          comments_count: 0,
          first_places_count: 0,
          avg_upvotes: 0,
          avg_comments: 0,
          is_verified: !!p.maker.is_verified
        };
        existing.hunts_count += 1;
        existing.upvotes_count += (p.upvotes_count || 0);
        existing.comments_count += (p.comments_count || 0);
        if (p.featured || (p.quality_score && p.quality_score >= 75)) {
          existing.first_places_count += 1;
        }
        hunterMap.set(key, existing);
      }
    }
  });

  if (hunterMap.size === 0) {
    Object.values(MOCK_PROFILES).forEach((p: any) => {
      const key = (p.username || p.id || '').toLowerCase();
      if (key && !hunterMap.has(key)) {
        hunterMap.set(key, {
          id: p.id,
          name: p.full_name || p.username || 'Indie Maker',
          username: p.username || 'maker',
          avatar_url: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          bio: p.bio || p.headline || 'IndiHunt Hunter & Builder',
          hunts_count: 3,
          upvotes_count: (p.karma_points || 20) * 10,
          comments_count: 6,
          first_places_count: 1,
          avg_upvotes: Math.round(((p.karma_points || 20) * 10) / 3),
          avg_comments: 2,
          is_verified: !!p.is_verified
        });
      }
    });
  }

  const realHuntersList = Array.from(hunterMap.values());
  realHuntersList.forEach(h => {
    h.avg_upvotes = h.hunts_count > 0 ? Math.round(h.upvotes_count / h.hunts_count) : h.upvotes_count;
    h.avg_comments = h.hunts_count > 0 ? Math.round(h.comments_count / h.hunts_count) : h.comments_count;
  });

  realHuntersList.sort((a, b) => b.hunts_count - a.hunts_count || b.upvotes_count - a.upvotes_count);
  if (realHuntersList.length > 0) {
    setRedisCache(cacheKey, realHuntersList, 60).catch(() => { });
  }
  return realHuntersList;
}

// ==========================================
// BILLBOARD ADS (Landing Page Banners)
// ==========================================

export const DEFAULT_BILLBOARDS: BillboardAd[] = [
  {
    id: "bb_supabase_default",
    title: "Supabase — The Open Source Firebase Alternative",
    image_url: "/supabase_ad_banner.webp",
    destination_url: "https://supabase.com",
    is_active: true,
    views_count: 1420,
    clicks_count: 88,
    created_at: new Date().toISOString()
  },
  {
    id: "bb_indihunt_default",
    title: "Launch & Advertise Your Product on IndiHunt",
    image_url: "/indihunt_horizontal_banner.webp",
    destination_url: "/advertise",
    is_active: true,
    views_count: 2310,
    clicks_count: 145,
    created_at: new Date().toISOString()
  },
  {
    id: "bb_community_default",
    title: "Join 5,000+ Indian Builders & Makers Community",
    image_url: "/indihunt_origin.webp",
    destination_url: "/discussions",
    is_active: true,
    views_count: 1890,
    clicks_count: 112,
    created_at: new Date().toISOString()
  },
  {
    id: "bb_best_products_default",
    title: "Explore India's Top Rated Products & SaaS Tools",
    image_url: "/og-image.webp",
    destination_url: "/best-products",
    is_active: true,
    views_count: 3120,
    clicks_count: 204,
    created_at: new Date().toISOString()
  }
];

export async function getBillboardAds(adminMode: boolean = false): Promise<BillboardAd[]> {
  try {
    const res = await secureApiFetch<BillboardAd[] | { ads: BillboardAd[] }>(`/t/billboards?admin=${adminMode ? 'true' : 'false'}`);
    if (res && res.success && res.data) {
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      if (Array.isArray((res.data as any).ads) && (res.data as any).ads.length > 0) return (res.data as any).ads;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('indihunt_billboards');
      if (cached) {
        let ads: BillboardAd[] = JSON.parse(cached);
        if (!adminMode) ads = ads.filter(a => a.is_active);
        if (ads.length > 0) return ads;
      }
    } catch (e) { }
  }
  return adminMode ? [] : DEFAULT_BILLBOARDS;
}

export async function createBillboardAd(ad: Partial<BillboardAd>): Promise<BillboardAd | null> {
  try {
    const res = await secureApiFetch<BillboardAd>('/t/billboards', {
      method: 'POST',
      body: JSON.stringify(ad),
    });
    if (res && res.success && res.data) {
      updateLocalBillboardsCache(res.data, 'create');
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const newAd: BillboardAd = {
      id: `ad_${Date.now()}`,
      title: ad.title,
      image_url: ad.image_url || '',
      destination_url: ad.destination_url,
      is_active: ad.is_active ?? true,
      created_at: new Date().toISOString()
    };
    updateLocalBillboardsCache(newAd, 'create');
    return newAd;
  }
  return null;
}

export async function updateBillboardAd(id: string, updates: Partial<BillboardAd>): Promise<BillboardAd | null> {
  try {
    const res = await secureApiFetch<BillboardAd>('/t/billboards', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
    if (res && res.success && res.data) {
      updateLocalBillboardsCache(res.data, 'update');
      return res.data;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    const current = await getBillboardAds(true);
    const existing = current.find(a => a.id === id);
    if (existing) {
      const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
      updateLocalBillboardsCache(updated, 'update');
      return updated;
    }
  }
  return null;
}

export async function deleteBillboardAd(id: string): Promise<boolean> {
  try {
    const res = await secureApiFetch<{ success: boolean }>(`/t/billboards?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      updateLocalBillboardsCache({ id } as BillboardAd, 'delete');
      return true;
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    updateLocalBillboardsCache({ id } as BillboardAd, 'delete');
    return true;
  }
  return false;
}

export async function uploadBillboardImage(file: File): Promise<string | null> {
  if (supabase) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `ads/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('billboard-ads').upload(filePath, file);
    if (!uploadError) {
      const { data } = supabase.storage.from('billboard-ads').getPublicUrl(filePath);
      return data.publicUrl;
    }
    console.error("Upload error:", uploadError);
  }

  if (typeof window !== 'undefined') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }
  return null;
}

function updateLocalBillboardsCache(ad: BillboardAd, action: 'create' | 'update' | 'delete') {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('indihunt_billboards');
      let ads: BillboardAd[] = cached ? JSON.parse(cached) : [];
      if (action === 'create') {
        ads = [ad, ...ads];
      } else if (action === 'update') {
        ads = ads.map(a => a.id === ad.id ? { ...a, ...ad } : a);
      } else if (action === 'delete') {
        ads = ads.filter(a => a.id !== ad.id);
      }
      localStorage.setItem('indihunt_billboards', JSON.stringify(ads));
    } catch (e) { }
  }
}

// ==========================================
// LEADERBOARD (Products ranked by clicks & engagement)
// ==========================================

export async function incrementProductClicks(productId: string): Promise<void> {
  try {
    await secureApiFetch<{ success: boolean }>('/t/views', {
      method: 'POST',
      body: JSON.stringify({ itemId: productId, type: 'click' }),
    });
  } catch (err) { }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('indihunt_products');
      if (cached) {
        let prods: Product[] = JSON.parse(cached);
        const idx = prods.findIndex(p => p.id === productId);
        if (idx !== -1) {
          prods[idx].clicks_count = (prods[idx].clicks_count || 0) + 1;
          localStorage.setItem('indihunt_products', JSON.stringify(prods));
          clearCache('products');
        }
      }
    } catch (e) { }
  }
}

export const PRODUCT_LEADERBOARD_CATEGORIES = [
  "All",
  "SaaS",
  "Artificial Intelligence",
  "AI Agents & Automation",
  "Productivity",
  "Marketing Tools",
  "Finance & FinTech",
  "Developer Tools",
  "APIs & Integrations",
  "Open Source",
  "Design Tools",
  "Mobile Apps",
  "Web3 & Crypto",
  "E-Commerce & Retail",
  "Health & Fitness",
  "Education & EdTech",
  "Analytics & Data",
  "Cybersecurity",
  "Social & Community",
  "Media & Entertainment",
  "No-Code & Low-Code",
  "Customer Support & CRM",
  "AR/VR"
];

function isProductInLeaderboardCategory(product: Product, category: string): boolean {
  if (category === "All") return true;
  const pCat = (product.category || "").toLowerCase();
  const pTags = (product.tags || []).map(t => typeof t === "string" ? t.toLowerCase() : "");
  const pText = `${product.name} ${product.tagline} ${product.description || ""}`.toLowerCase();

  const matchKeywords = (keywords: string[]) => {
    return keywords.some(kw => pCat.includes(kw) || pTags.some(t => t.includes(kw)) || pText.includes(kw));
  };

  switch (category) {
    case "Artificial Intelligence":
      return matchKeywords(["ai", "artificial intelligence", "gpt", "llm", "bot", "ml", "neural", "chatgpt", "claude", "gemini", "genai"]);
    case "AI Agents & Automation":
      return matchKeywords(["agent", "agents", "automation", "workflow", "autonomous", "bot", "agentic", "notetaker"]);
    case "Developer Tools":
      return matchKeywords(["developer", "dev", "code", "coding", "compiler", "cli", "terminal", "sdk", "ide", "debugger"]);
    case "APIs & Integrations":
      return matchKeywords(["api", "apis", "integration", "integrations", "webhook", "connector", "sync", "rest", "graphql"]);
    case "SaaS":
      return matchKeywords(["saas", "b2b", "software", "enterprise", "platform", "cloud"]);
    case "Marketing Tools":
      return matchKeywords(["marketing", "seo", "ad", "ads", "advertising", "growth", "campaign", "email marketing", "lead generation"]);
    case "Productivity":
      return matchKeywords(["productivity", "task", "notes", "workflow", "todo", "calendar", "time", "project management", "workspace"]);
    case "Design Tools":
      return matchKeywords(["design", "creative", "ui", "ux", "graphic", "mockup", "vector", "canvas", "figma", "prototype"]);
    case "Finance & FinTech":
      return matchKeywords(["fintech", "finance", "pay", "payment", "bank", "money", "wallet", "invoice", "accounting", "budget"]);
    case "Web3 & Crypto":
      return matchKeywords(["crypto", "web3", "blockchain", "bitcoin", "ethereum", "solana", "token", "defi", "nft", "smart contract"]);
    case "E-Commerce & Retail":
      return matchKeywords(["e-commerce", "ecommerce", "shop", "store", "retail", "buy", "sell", "checkout", "cart", "products"]);
    case "Analytics & Data":
      return matchKeywords(["analytics", "data", "metric", "tracking", "bi", "dashboard", "insights", "database", "sql"]);
    case "Cybersecurity":
      return matchKeywords(["cybersecurity", "security", "auth", "firewall", "privacy", "compliance", "encryption", "password"]);
    case "Education & EdTech":
      return matchKeywords(["education", "edtech", "learn", "course", "study", "student", "teach", "school", "quiz", "tutor"]);
    case "Health & Fitness":
      return matchKeywords(["health", "fitness", "wellness", "gym", "habit", "mental", "workout", "nutrition", "diet"]);
    case "Social & Community":
      return matchKeywords(["social", "community", "chat", "forum", "network", "messaging", "feed", "creator"]);
    case "Media & Entertainment":
      return matchKeywords(["media", "entertainment", "video", "photo", "art", "music", "audio", "streaming", "podcast", "youtube", "voice modulator", "media player", "broadcast", "player", "modulator", "synth"]);
    case "No-Code & Low-Code":
      return matchKeywords(["no-code", "low-code", "nocode", "lowcode", "visual builder", "drag and drop", "website builder"]);
    case "Customer Support & CRM":
      return matchKeywords(["customer support", "support", "crm", "helpdesk", "ticketing", "live chat", "ticket"]);
    case "AR/VR":
      return matchKeywords(["ar/vr", "ar", "vr", "virtual reality", "augmented reality", "3d", "spatial", "metaverse"]);
    case "Mobile Apps":
      return matchKeywords(["mobile", "app", "ios", "android", "iphone", "ipad", "flutter", "react native"]);
    case "Open Source":
      return !!product.is_open_source || matchKeywords(["open source", "open-source", "oss", "github", "git", "foss"]);
    default:
      return pCat === category.toLowerCase() || pTags.includes(category.toLowerCase()) || matchKeywords([category.toLowerCase()]);
  }
}

export async function getLeaderboardProducts(
  categoryFilter: string,
  timeFilter: string,
  page: number,
  limit: number
): Promise<{
  products: Product[];
  topRanked: Product[];
  totalCount: number;
  totalPages: number;
  categoryTotals: CategorySummary[];
  latestBids: LeaderboardActivity[];
}> {
  let allProducts = await getProducts();
  if (!allProducts || allProducts.length === 0) {
    allProducts = getCachedProducts();
  }

  const now = Date.now();
  if (timeFilter === 'today') {
    allProducts = allProducts.filter(p => p.created_at && (now - new Date(p.created_at).getTime() < 86400000));
  }

  const categoryTotals: CategorySummary[] = PRODUCT_LEADERBOARD_CATEGORIES.map((catName, idx) => {
    const count = allProducts.filter(p => isProductInLeaderboardCategory(p, catName)).length;
    return {
      id: `cat_${idx}`,
      name: catName,
      count
    };
  });

  let filtered = allProducts;
  if (categoryFilter !== 'All') {
    filtered = filtered.filter(p => isProductInLeaderboardCategory(p, categoryFilter));
  }

  filtered.sort((a, b) => {
    const scoreA = (a.clicks_count || 0) + (a.upvotes_count || 0);
    const scoreB = (b.clicks_count || 0) + (b.upvotes_count || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;
  const pagedProducts = filtered.slice(offset, offset + limit);

  const topRanked = filtered.slice(0, 3);

  const latestBids: LeaderboardActivity[] = topRanked.map((p, i) => ({
    id: `act_${p.id}`,
    productName: p.name,
    rank: i + 1,
    timeAgo: i === 0 ? 'just now' : `${i * 2}m ago`
  }));

  return {
    products: pagedProducts,
    topRanked,
    totalCount,
    totalPages,
    categoryTotals,
    latestBids
  };
}

export const ALL_LEADERBOARD_CATEGORIES = [
  "SaaS",
  "Artificial Intelligence",
  "AI Agents & Automation",
  "Productivity",
  "Marketing Tools",
  "Finance & FinTech",
  "Developer Tools",
  "APIs & Integrations",
  "Open Source",
  "Design Tools",
  "Mobile Apps",
  "Web3 & Crypto",
  "E-Commerce & Retail",
  "Health & Fitness",
  "Education & EdTech",
  "Analytics & Data",
  "Cybersecurity",
  "Social & Community",
  "Media & Entertainment",
  "No-Code & Low-Code",
  "Customer Support & CRM",
  "AR/VR"
];

export async function placeLeaderboardBid(bid: {
  productId?: string;
  productName: string;
  productUrl: string;
  tagline: string;
  category: string;
  bidAmount: number;
  userEmail?: string;
}): Promise<{ success: boolean; message: string; checkoutUrl?: string }> {
  return { success: false, message: "Bidding is currently disabled." };
}

// ── CAREERS & JOB APPLICATIONS ENGINE ──────────────────────────────────────────

export const SEED_JOBS: JobPosting[] = [];

// Helper to initialize local jobs storage
function getLocalJobs(): JobPosting[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('ih_jobs');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveLocalJobs(jobs: JobPosting[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ih_jobs', JSON.stringify(jobs));
    } catch (e) { }
  }
}

// Fetch all jobs
export async function getJobs(includeInactive = false): Promise<JobPosting[]> {
  try {
    const res = await secureApiFetch<JobPosting[]>(`/t/jobs?includeInactive=${includeInactive ? 'true' : 'false'}`);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      saveLocalJobs(res.data);
      return res.data;
    }
  } catch (err) { }

  const local = getLocalJobs();
  return includeInactive ? local : local.filter(j => j.is_active);
}

// Fetch single job by ID
export async function getJobById(id: string): Promise<JobPosting | null> {
  if (!id) return null;
  try {
    const res = await secureApiFetch<JobPosting>(`/t/jobs/${encodeURIComponent(id)}`);
    if (res && res.success && res.data) {
      return res.data;
    }
  } catch (err) { }

  const local = getLocalJobs();
  return local.find(j => j.id === id) || null;
}

// Create Job (Admin)
export async function createJob(input: JobPostingInput): Promise<{ success: boolean; data?: JobPosting; error?: string }> {
  try {
    const res = await secureApiFetch<JobPosting>('/t/jobs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (res && res.success && res.data) {
      const local = getLocalJobs();
      saveLocalJobs([res.data, ...local]);
      return { success: true, data: res.data };
    }
    if (res && !res.success) {
      return { success: false, error: res.error };
    }
  } catch (err) { }

  const newJob: JobPosting = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: input.title,
    department: input.department || 'Engineering',
    location: input.location || 'Remote (India)',
    type: input.type || 'Full-time',
    experience: input.experience || '1-3 years',
    stipend_salary: input.stipend_salary || 'Competitive',
    description: input.description,
    responsibilities: input.responsibilities || [],
    requirements: input.requirements || [],
    perks: input.perks || [],
    is_active: input.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const local = getLocalJobs();
  const updated = [newJob, ...local];
  saveLocalJobs(updated);
  return { success: true, data: newJob };
}

// Update Job (Admin)
export async function updateJob(id: string, updates: Partial<JobPostingInput>): Promise<{ success: boolean; data?: JobPosting; error?: string }> {
  try {
    const res = await secureApiFetch<JobPosting>(`/t/jobs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (res && res.success && res.data) {
      const local = getLocalJobs();
      const updated = local.map(j => j.id === id ? res.data! : j);
      saveLocalJobs(updated);
      return { success: true, data: res.data };
    }
  } catch (err) { }

  const local = getLocalJobs();
  let updatedJob: JobPosting | undefined;
  const updated = local.map(j => {
    if (j.id === id) {
      updatedJob = {
        ...j,
        ...updates,
        updated_at: new Date().toISOString()
      };
      return updatedJob;
    }
    return j;
  });
  saveLocalJobs(updated);
  return { success: true, data: updatedJob };
}

// Delete Job (Admin)
export async function deleteJob(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await secureApiFetch<{ success: boolean }>(`/t/jobs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      const local = getLocalJobs();
      saveLocalJobs(local.filter(j => j.id !== id));
      return { success: true };
    }
  } catch (err) { }

  const local = getLocalJobs();
  saveLocalJobs(local.filter(j => j.id !== id));
  return { success: true };
}

// Helper for local applications storage
function getLocalApplications(): JobApplication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('ih_job_applications');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveLocalApplications(apps: JobApplication[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ih_job_applications', JSON.stringify(apps));
    } catch (e) { }
  }
}

// Upload Resume to Supabase Storage Bucket 'resumes'
export async function uploadResumeFile(file: File): Promise<{ url: string | null; filename: string | null; error: string | null }> {
  if (!file) return { url: null, filename: null, error: "No file provided" };

  // 5MB Limit Check
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, filename: null, error: "Resume file size exceeds the 5MB limit. Please upload a smaller file." };
  }

  const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${Date.now()}_${cleanFilename}`;

  if (supabase) {
    try {
      const { data, error } = await supabase.storage.from('resumes').upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

      if (!error && data) {
        const { data: publicData } = supabase.storage.from('resumes').getPublicUrl(data.path);
        return { url: publicData.publicUrl, filename: file.name, error: null };
      }
      if (error) {
        console.warn('[uploadResumeFile] Supabase bucket upload failed, using local DataURL fallback:', error.message);
      }
    } catch (err: any) {
      console.warn('[uploadResumeFile] Storage upload exception:', err);
    }
  }

  // Fallback: Read as Object URL or base64
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        filename: file.name,
        error: null
      });
    };
    reader.onerror = () => {
      resolve({
        url: null,
        filename: file.name,
        error: "Failed to read file on browser."
      });
    };
    reader.readAsDataURL(file);
  });
}

// Submit Job Application
export async function submitJobApplication(input: JobApplicationInput): Promise<{ success: boolean; data?: JobApplication; error?: string }> {
  if (!input.full_name || !input.email || !input.phone_number || !input.cover_note) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    const res = await secureApiFetch<JobApplication>('/t/job-applications', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (res && res.success && res.data) {
      const local = getLocalApplications();
      saveLocalApplications([res.data, ...local]);
      return { success: true, data: res.data };
    }
  } catch (err) { }

  const newApp: JobApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    job_id: input.job_id || null,
    role_title: input.role_title,
    full_name: input.full_name,
    email: input.email,
    phone_number: input.phone_number,
    current_location: input.current_location,
    linkedin_url: input.linkedin_url || null,
    github_url: input.github_url || null,
    portfolio_url: input.portfolio_url || null,
    twitter_url: input.twitter_url || null,
    current_ctc: input.current_ctc || null,
    expected_ctc: input.expected_ctc,
    experience_years: input.experience_years || 'Fresher',
    notice_period: input.notice_period || 'Immediate',
    cover_note: input.cover_note,
    resume_url: input.resume_url || null,
    resume_filename: input.resume_filename || null,
    status: 'pending',
    admin_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Local fallback
  const local = getLocalApplications();
  saveLocalApplications([newApp, ...local]);
  return { success: true, data: newApp };
}

// Get All Job Applications (Admin)
export async function getJobApplications(): Promise<JobApplication[]> {
  try {
    const res = await secureApiFetch<JobApplication[]>('/t/job-applications');
    if (res && res.success && Array.isArray(res.data)) {
      saveLocalApplications(res.data);
      return res.data;
    }
  } catch (err) { }

  return getLocalApplications();
}

// Update Job Application Status & Notes (Admin)
export async function updateJobApplicationStatus(
  id: string,
  status: JobApplicationStatus,
  admin_notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await secureApiFetch<{ success: boolean }>('/t/job-applications', {
      method: 'PATCH',
      body: JSON.stringify({ id, status, admin_notes }),
    });
    if (res && res.success) {
      const local = getLocalApplications();
      saveLocalApplications(local.map(a => a.id === id ? { ...a, status, admin_notes: admin_notes ?? a.admin_notes } : a));
      return { success: true };
    }
  } catch (err) { }

  const local = getLocalApplications();
  saveLocalApplications(local.map(a => a.id === id ? { ...a, status, admin_notes: admin_notes ?? a.admin_notes } : a));
  return { success: true };
}

// Delete Job Application (Admin)
export async function deleteJobApplication(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await secureApiFetch<{ success: boolean }>(`/t/job-applications?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      const local = getLocalApplications();
      saveLocalApplications(local.filter(a => a.id !== id));
      return { success: true };
    }
  } catch (err) { }

  const local = getLocalApplications();
  saveLocalApplications(local.filter(a => a.id !== id));
  return { success: true };
}

// ==========================================
// Launch Tags Management
// ==========================================

export const SEED_LAUNCH_TAGS: LaunchTag[] = [
  // 1. AI & Machine Learning
  { id: "tag-1", name: "AI Agents", slug: "ai-agents", category: "AI & Machine Learning", icon: "🤖", is_popular: true, is_active: true },
  { id: "tag-2", name: "AI Coding Agents", slug: "ai-coding-agents", category: "AI & Machine Learning", icon: "⚡", is_popular: true, is_active: true },
  { id: "tag-3", name: "LLM", slug: "llm", category: "AI & Machine Learning", icon: "🧠", is_popular: true, is_active: true },
  { id: "tag-4", name: "Chat Model", slug: "chat-model", category: "AI & Machine Learning", icon: "💬", is_popular: true, is_active: true },
  { id: "tag-5", name: "AI", slug: "ai", category: "AI & Machine Learning", icon: "✨", is_popular: true, is_active: true },
  { id: "tag-6", name: "Generative AI", slug: "generative-ai", category: "AI & Machine Learning", icon: "🪄", is_popular: true, is_active: true },
  { id: "tag-7", name: "AI Notetakers", slug: "ai-notetakers", category: "AI & Machine Learning", icon: "🎙️", is_popular: false, is_active: true },
  { id: "tag-8", name: "AI Presentation Software", slug: "presentation-software", category: "AI & Machine Learning", icon: "📊", is_popular: false, is_active: true },
  { id: "tag-9", name: "AI Workflow Automation", slug: "workflow-automation", category: "AI & Machine Learning", icon: "⚙️", is_popular: false, is_active: true },
  { id: "tag-10", name: "AI Sales Tools", slug: "ai-sales-tools", category: "AI & Machine Learning", icon: "🎯", is_popular: false, is_active: true },
  { id: "tag-11", name: "AI Code Editors", slug: "ai-code-editors", category: "AI & Machine Learning", icon: "💻", is_popular: false, is_active: true },
  { id: "tag-12", name: "AI Code Testing", slug: "ai-code-testing", category: "AI & Machine Learning", icon: "🧪", is_popular: false, is_active: true },
  { id: "tag-13", name: "AI Databases", slug: "ai-databases", category: "AI & Machine Learning", icon: "🗄️", is_popular: false, is_active: true },
  { id: "tag-14", name: "Predictive AI", slug: "predictive-ai", category: "AI & Machine Learning", icon: "📈", is_popular: false, is_active: true },
  { id: "tag-15", name: "Voice AI", slug: "voice-ai", category: "AI & Machine Learning", icon: "🗣️", is_popular: false, is_active: true },
  { id: "tag-16", name: "Computer Vision", slug: "computer-vision", category: "AI & Machine Learning", icon: "👁️", is_popular: false, is_active: true },
  { id: "tag-17", name: "Prompt Engineering", slug: "prompt-engineering", category: "AI & Machine Learning", icon: "📝", is_popular: false, is_active: true },

  // 2. Engineering & DevOps
  { id: "tag-18", name: "Deployment", slug: "deployment", category: "Engineering & DevOps", icon: "🚀", is_popular: true, is_active: true },
  { id: "tag-19", name: "Hosting", slug: "hosting", category: "Engineering & DevOps", icon: "🌐", is_popular: true, is_active: true },
  { id: "tag-20", name: "Developer Tools", slug: "developer-tools", category: "Engineering & DevOps", icon: "🛠️", is_popular: true, is_active: true },
  { id: "tag-21", name: "Open Source", slug: "open-source", category: "Engineering & DevOps", icon: "📖", is_popular: true, is_active: true },
  { id: "tag-22", name: "Security", slug: "security", category: "Engineering & DevOps", icon: "🛡️", is_popular: true, is_active: true },
  { id: "tag-23", name: "Cybersecurity", slug: "cybersecurity", category: "Engineering & DevOps", icon: "🔒", is_popular: false, is_active: true },
  { id: "tag-24", name: "APIs & Integrations", slug: "apis-integrations", category: "Engineering & DevOps", icon: "🔌", is_popular: false, is_active: true },
  { id: "tag-25", name: "Cloud Computing", slug: "cloud-computing", category: "Engineering & DevOps", icon: "☁️", is_popular: false, is_active: true },
  { id: "tag-26", name: "DevOps", slug: "devops", category: "Engineering & DevOps", icon: "♾️", is_popular: false, is_active: true },
  { id: "tag-27", name: "Databases", slug: "databases", category: "Engineering & DevOps", icon: "🗄️", is_popular: false, is_active: true },
  { id: "tag-28", name: "Vibe Coding", slug: "vibe-coding", category: "Engineering & DevOps", icon: "⚡", is_popular: false, is_active: true },
  { id: "tag-29", name: "Next.js", slug: "nextjs", category: "Engineering & DevOps", icon: "▲", is_popular: false, is_active: true },
  { id: "tag-30", name: "React", slug: "react", category: "Engineering & DevOps", icon: "⚛️", is_popular: false, is_active: true },
  { id: "tag-31", name: "TypeScript", slug: "typescript", category: "Engineering & DevOps", icon: "📘", is_popular: false, is_active: true },
  { id: "tag-32", name: "Python", slug: "python", category: "Engineering & DevOps", icon: "🐍", is_popular: false, is_active: true },
  { id: "tag-33", name: "Node.js", slug: "nodejs", category: "Engineering & DevOps", icon: "🟢", is_popular: false, is_active: true },
  { id: "tag-34", name: "Docker & Containers", slug: "docker-containers", category: "Engineering & DevOps", icon: "🐳", is_popular: false, is_active: true },
  { id: "tag-35", name: "Serverless", slug: "serverless", category: "Engineering & DevOps", icon: "⚡", is_popular: false, is_active: true },
  { id: "tag-36", name: "Testing & QA", slug: "testing-qa", category: "Engineering & DevOps", icon: "🧪", is_popular: false, is_active: true },
  { id: "tag-37", name: "Command Line", slug: "command-line", category: "Engineering & DevOps", icon: "📟", is_popular: false, is_active: true },
  { id: "tag-38", name: "Git & GitHub", slug: "git-github", category: "Engineering & DevOps", icon: "🐙", is_popular: false, is_active: true },

  // 3. Productivity & Workspace
  { id: "tag-39", name: "Productivity", slug: "productivity", category: "Productivity & Core Software", icon: "⚡", is_popular: true, is_active: true },
  { id: "tag-40", name: "SaaS", slug: "saas", category: "Productivity & Core Software", icon: "💼", is_popular: true, is_active: true },
  { id: "tag-41", name: "Task Management", slug: "task-management", category: "Productivity & Core Software", icon: "📋", is_popular: false, is_active: true },
  { id: "tag-42", name: "Calendar Apps", slug: "calendar-apps", category: "Productivity & Core Software", icon: "📅", is_popular: false, is_active: true },
  { id: "tag-43", name: "Note & Writing Apps", slug: "note-writing-apps", category: "Productivity & Core Software", icon: "✍️", is_popular: false, is_active: true },
  { id: "tag-44", name: "Project Management", slug: "project-management", category: "Productivity & Core Software", icon: "📊", is_popular: false, is_active: true },
  { id: "tag-45", name: "Team Collaboration", slug: "team-collaboration", category: "Productivity & Core Software", icon: "🤝", is_popular: false, is_active: true },
  { id: "tag-46", name: "Time Tracking", slug: "time-tracking", category: "Productivity & Core Software", icon: "⏱️", is_popular: false, is_active: true },
  { id: "tag-47", name: "Knowledge Base", slug: "knowledge-base", category: "Productivity & Core Software", icon: "📚", is_popular: false, is_active: true },
  { id: "tag-48", name: "Meeting Software", slug: "meeting-software", category: "Productivity & Core Software", icon: "📹", is_popular: false, is_active: true },
  { id: "tag-48b", name: "Video Conferencing", slug: "video-conferencing", category: "Productivity & Core Software", icon: "🎥", is_popular: true, is_active: true },
  { id: "tag-48c", name: "Video and Voice Calling", slug: "video-voice-calling", category: "Productivity & Core Software", icon: "📞", is_popular: false, is_active: true },
  { id: "tag-49", name: "E-Signature", slug: "e-signature-apps", category: "Productivity & Core Software", icon: "✒️", is_popular: false, is_active: true },
  { id: "tag-50", name: "PDF Editor", slug: "pdf-editor", category: "Productivity & Core Software", icon: "📄", is_popular: false, is_active: true },
  { id: "tag-51", name: "Password Managers", slug: "password-managers", category: "Productivity & Core Software", icon: "🔑", is_popular: false, is_active: true },
  { id: "tag-52", name: "Email Clients", slug: "email-clients", category: "Productivity & Core Software", icon: "✉️", is_popular: false, is_active: true },
  { id: "tag-53", name: "Ad Blockers", slug: "ad-blockers", category: "Productivity & Core Software", icon: "🛑", is_popular: false, is_active: true },
  { id: "tag-54", name: "CMS & Headless", slug: "cms", category: "Productivity & Core Software", icon: "📰", is_popular: false, is_active: true },
  { id: "tag-55", name: "No-Code & Low-Code", slug: "no-code-low-code", category: "Productivity & Core Software", icon: "🧩", is_popular: false, is_active: true },

  // 4. Design & Creative
  { id: "tag-56", name: "Design", slug: "design", category: "Design & Creative", icon: "🎨", is_popular: true, is_active: true },
  { id: "tag-57", name: "Design Tools", slug: "design-tools", category: "Design & Creative", icon: "📐", is_popular: false, is_active: true },
  { id: "tag-58", name: "UI/UX", slug: "ui-ux", category: "Design & Creative", icon: "✨", is_popular: false, is_active: true },
  { id: "tag-59", name: "3D & Animation", slug: "3d-animation", category: "Design & Creative", icon: "🧊", is_popular: false, is_active: true },
  { id: "tag-60", name: "AI Generative Media", slug: "ai-generative-media", category: "Design & Creative", icon: "🖼️", is_popular: false, is_active: true },
  { id: "tag-61", name: "AR/VR", slug: "ar-vr", category: "Design & Creative", icon: "🥽", is_popular: false, is_active: true },
  { id: "tag-62", name: "Figma Plugins", slug: "figma-plugins", category: "Design & Creative", icon: "🟣", is_popular: false, is_active: true },
  { id: "tag-63", name: "Icons & Illustration", slug: "icons-illustration", category: "Design & Creative", icon: "✏️", is_popular: false, is_active: true },
  { id: "tag-64", name: "Graphic Design", slug: "graphic-design", category: "Design & Creative", icon: "🖌️", is_popular: false, is_active: true },
  { id: "tag-65", name: "Video Editing", slug: "video-editing", category: "Design & Creative", icon: "🎬", is_popular: false, is_active: true },
  { id: "tag-66", name: "Audio & Music", slug: "audio-music", category: "Design & Creative", icon: "🎵", is_popular: false, is_active: true },

  // 5. Finance & Operations
  { id: "tag-67", name: "Fintech", slug: "fintech", category: "Finance & Operations", icon: "💳", is_popular: true, is_active: true },
  { id: "tag-68", name: "Finance", slug: "finance", category: "Finance & Operations", icon: "💰", is_popular: false, is_active: true },
  { id: "tag-69", name: "Payments", slug: "payments", category: "Finance & Operations", icon: "💸", is_popular: false, is_active: true },
  { id: "tag-70", name: "Accounting", slug: "accounting", category: "Finance & Operations", icon: "🧾", is_popular: false, is_active: true },
  { id: "tag-71", name: "Budgeting", slug: "budgeting", category: "Finance & Operations", icon: "🪙", is_popular: false, is_active: true },
  { id: "tag-72", name: "Invoicing", slug: "invoicing", category: "Finance & Operations", icon: "📑", is_popular: false, is_active: true },
  { id: "tag-73", name: "Legal Services", slug: "legal-services", category: "Finance & Operations", icon: "⚖️", is_popular: false, is_active: true },
  { id: "tag-74", name: "Compliance", slug: "compliance-software", category: "Finance & Operations", icon: "📋", is_popular: false, is_active: true },
  { id: "tag-75", name: "Hiring & HR", slug: "hiring-software", category: "Finance & Operations", icon: "👥", is_popular: false, is_active: true },

  // 6. Marketing & Sales
  { id: "tag-76", name: "Marketing", slug: "marketing", category: "Marketing & Sales", icon: "📢", is_popular: true, is_active: true },
  { id: "tag-77", name: "Analytics", slug: "analytics", category: "Marketing & Sales", icon: "📊", is_popular: true, is_active: true },
  { id: "tag-78", name: "SEO", slug: "seo", category: "Marketing & Sales", icon: "🔍", is_popular: false, is_active: true },
  { id: "tag-79", name: "Social Media", slug: "social-media", category: "Marketing & Sales", icon: "📱", is_popular: false, is_active: true },
  { id: "tag-80", name: "Email Marketing", slug: "email-marketing", category: "Marketing & Sales", icon: "📧", is_popular: false, is_active: true },
  { id: "tag-81", name: "CRM Software", slug: "crm-software", category: "Marketing & Sales", icon: "📇", is_popular: false, is_active: true },
  { id: "tag-82", name: "Growth Hacking", slug: "growth-hacking", category: "Marketing & Sales", icon: "📈", is_popular: false, is_active: true },
  { id: "tag-83", name: "Content Creation", slug: "content-creation", category: "Marketing & Sales", icon: "✍️", is_popular: false, is_active: true },
  { id: "tag-84", name: "Customer Support", slug: "customer-support-crm", category: "Marketing & Sales", icon: "🎧", is_popular: false, is_active: true },
  { id: "tag-85", name: "E-Commerce & Retail", slug: "e-commerce-retail", category: "Marketing & Sales", icon: "🛍️", is_popular: false, is_active: true },

  // 7. Web3, Mobile & Social
  { id: "tag-86", name: "Web3 & Crypto", slug: "web3-crypto", category: "Web3, Mobile & Social", icon: "🪙", is_popular: false, is_active: true },
  { id: "tag-87", name: "Mobile Apps", slug: "mobile-apps", category: "Web3, Mobile & Social", icon: "📱", is_popular: false, is_active: true },
  { id: "tag-88", name: "iOS Apps", slug: "ios-apps", category: "Web3, Mobile & Social", icon: "🍎", is_popular: false, is_active: true },
  { id: "tag-89", name: "Android Apps", slug: "android-apps", category: "Web3, Mobile & Social", icon: "🤖", is_popular: false, is_active: true },
  { id: "tag-90", name: "Browser Extensions", slug: "browser-extensions", category: "Web3, Mobile & Social", icon: "🧩", is_popular: false, is_active: true },
  { id: "tag-91", name: "Social & Community", slug: "social-community", category: "Web3, Mobile & Social", icon: "💬", is_popular: false, is_active: true },
  { id: "tag-92", name: "Forums & Communities", slug: "forums-communities", category: "Web3, Mobile & Social", icon: "🌐", is_popular: false, is_active: true },

  // 8. Health, Life & Education
  { id: "tag-93", name: "Health & Fitness", slug: "health-fitness", category: "Health, Life & Education", icon: "💪", is_popular: false, is_active: true },
  { id: "tag-94", name: "Education & EdTech", slug: "education-edtech", category: "Health, Life & Education", icon: "🎓", is_popular: false, is_active: true },
  { id: "tag-95", name: "Online Learning", slug: "online-learning", category: "Health, Life & Education", icon: "📖", is_popular: false, is_active: true },
  { id: "tag-96", name: "Career & Jobs", slug: "career-jobs", category: "Health, Life & Education", icon: "💼", is_popular: false, is_active: true },

  // 9. Media & Entertainment
  { id: "tag-97", name: "Media & Entertainment", slug: "media-entertainment", category: "Media & Entertainment", icon: "🎬", is_popular: true, is_active: true },
  { id: "tag-98", name: "Video Streaming", slug: "video-streaming", category: "Media & Entertainment", icon: "📺", is_popular: true, is_active: true },
  { id: "tag-99", name: "Podcast & Audio", slug: "podcast-audio", category: "Media & Entertainment", icon: "🎙️", is_popular: false, is_active: true },
  { id: "tag-100", name: "Music & Beats", slug: "music-beats", category: "Media & Entertainment", icon: "🎵", is_popular: false, is_active: true },
  { id: "tag-101", name: "Voice Modulator", slug: "voice-modulator", category: "Media & Entertainment", icon: "🗣️", is_popular: false, is_active: true },
  { id: "tag-102", name: "Media Players", slug: "media-players", category: "Media & Entertainment", icon: "▶️", is_popular: false, is_active: true },
  { id: "tag-103", name: "Screen Recording & Capture", slug: "screen-recording-capture", category: "Media & Entertainment", icon: "📹", is_popular: false, is_active: true },
  { id: "tag-104", name: "Animation & Video Rendering", slug: "animation-video-rendering", category: "Media & Entertainment", icon: "🎨", is_popular: false, is_active: true }
];

function getLocalLaunchTags(): LaunchTag[] {
  if (typeof window === 'undefined') return SEED_LAUNCH_TAGS;
  try {
    const raw = localStorage.getItem('ih_launch_tags');
    if (!raw) {
      localStorage.setItem('ih_launch_tags', JSON.stringify(SEED_LAUNCH_TAGS));
      return SEED_LAUNCH_TAGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existingNames = new Set(parsed.map((t: LaunchTag) => t.name?.toLowerCase()));
      const missing = SEED_LAUNCH_TAGS.filter(st => !existingNames.has(st.name.toLowerCase()));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem('ih_launch_tags', JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
    return SEED_LAUNCH_TAGS;
  } catch (e) {
    return SEED_LAUNCH_TAGS;
  }
}

function saveLocalLaunchTags(tags: LaunchTag[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ih_launch_tags', JSON.stringify(tags));
    } catch (e) { }
  }
}

// Fetch all launch tags
export async function getLaunchTags(includeInactive = false): Promise<LaunchTag[]> {
  try {
    const res = await secureApiFetch<LaunchTag[]>('/t/launch-tags');
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      saveLocalLaunchTags(res.data);
      return res.data;
    }
  } catch (err) { }

  const local = getLocalLaunchTags();
  return includeInactive ? local : local.filter(t => t.is_active);
}

// Create Launch Tag (Admin)
export async function createLaunchTag(input: LaunchTagInput): Promise<{ success: boolean; data?: LaunchTag; error?: string }> {
  if (!input.name || !input.name.trim()) {
    return { success: false, error: "Tag name is required." };
  }

  try {
    const res = await secureApiFetch<LaunchTag>('/t/launch-tags', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (res && res.success && res.data) {
      const local = getLocalLaunchTags();
      saveLocalLaunchTags([...local, res.data]);
      return { success: true, data: res.data };
    }
  } catch (err) { }

  const name = input.name.trim();
  const slug = input.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newTag: LaunchTag = {
    id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    slug,
    category: input.category || 'General',
    icon: input.icon || '🏷️',
    is_popular: input.is_popular ?? false,
    is_active: input.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const local = getLocalLaunchTags();
  if (local.some(t => t.name.toLowerCase() === name.toLowerCase())) {
    return { success: false, error: "A tag with this name already exists." };
  }
  const updated = [...local, newTag];
  saveLocalLaunchTags(updated);
  return { success: true, data: newTag };
}

// Update Launch Tag (Admin)
export async function updateLaunchTag(id: string, updates: Partial<LaunchTagInput>): Promise<{ success: boolean; data?: LaunchTag; error?: string }> {
  try {
    const res = await secureApiFetch<LaunchTag>('/t/launch-tags', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
    if (res && res.success && res.data) {
      const local = getLocalLaunchTags();
      saveLocalLaunchTags(local.map(t => t.id === id ? res.data! : t));
      return { success: true, data: res.data };
    }
  } catch (err) { }

  const local = getLocalLaunchTags();
  let updatedTag: LaunchTag | undefined;
  const updated = local.map(t => {
    if (t.id === id) {
      updatedTag = { ...t, ...updates, updated_at: new Date().toISOString() };
      return updatedTag;
    }
    return t;
  });
  saveLocalLaunchTags(updated);
  return { success: true, data: updatedTag };
}

// Delete Launch Tag (Admin)
export async function deleteLaunchTag(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await secureApiFetch<{ success: boolean }>(`/t/launch-tags?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res && res.success) {
      const local = getLocalLaunchTags();
      saveLocalLaunchTags(local.filter(t => t.id !== id));
      return { success: true };
    }
  } catch (err) { }

  const local = getLocalLaunchTags();
  saveLocalLaunchTags(local.filter(t => t.id !== id));
  return { success: true };
}

// Get scheduled product counts grouped by date (YYYY-MM-DD)
export async function getScheduledProductCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  const toDateKey = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  };

  const prods = await getProducts();
  if (prods && prods.length > 0) {
    prods.forEach((p: any) => {
      if (p.status === 'scheduled' && p.scheduled_for) {
        const key = toDateKey(p.scheduled_for);
        if (key) counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('indihunt_products');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            if (p.status === 'scheduled' && p.scheduled_for) {
              const key = toDateKey(p.scheduled_for);
              if (key) counts[key] = (counts[key] || 0) + 1;
            }
          });
        }
      }
    } catch (e) { }
  }

  return counts;
}


// ============================================================================
// 🚀 PAYMENT GATEWAY CONFIGURATION
// ============================================================================

/**
 * Gets the current Payment Gateway Configuration (Dodo Payments as Primary MoR).
 */
export async function getPaymentGatewayConfig(): Promise<PaymentGatewayConfig> {
  const defaultConfig: PaymentGatewayConfig = {
    active_gateway: "dodo",
    dodo_enabled: true,
    stripe_enabled: false,
    razorpay_enabled: false,
    updated_at: new Date().toISOString()
  };

  try {
    const res = await secureApiFetch<any>('/t/platform-settings?key=payment_gateways');
    if (res && res.success && res.data) {
      return { ...defaultConfig, ...res.data };
    }
  } catch (err) { }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('indihunt_payment_gateway_config');
      if (cached) {
        return { ...defaultConfig, ...JSON.parse(cached) };
      }
    } catch (e) { }
  }

  return defaultConfig;
}

/**
 * Updates the Payment Gateway Configuration.
 */
export async function setPaymentGatewayConfig(updates: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
  const current = await getPaymentGatewayConfig();
  const updated: PaymentGatewayConfig = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString()
  };

  try {
    await secureApiFetch('/t/platform-settings', {
      method: 'PUT',
      body: JSON.stringify({ key: 'payment_gateways', value: updated }),
    });
  } catch (err) { }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('indihunt_payment_gateway_config', JSON.stringify(updated));
    } catch (e) { }
  }

  return updated;
}



/**
 * Canonical platform ranking comparator.
 * Guarantees 100% strict deterministic uniqueness so NO two products ever share the same rank.
 * 1. Primary: Upvotes (descending)
 * 2. Secondary: Comments count (descending)
 * 3. Tertiary: Quality score (descending)
 * 4. Quaternary: Created At date (descending)
 * 5. Final: ID alphabetical order (deterministic tie-breaker)
 */
export function compareProductsForRanking(a: Product, b: Product): number {
  if (a.id === b.id) return 0;
  const upvotesDiff = (b.upvotes_count || 0) - (a.upvotes_count || 0);
  if (upvotesDiff !== 0) return upvotesDiff;

  const commentsDiff = (b.comments_count || 0) - (a.comments_count || 0);
  if (commentsDiff !== 0) return commentsDiff;

  const qualityDiff = (b.quality_score || 0) - (a.quality_score || 0);
  if (qualityDiff !== 0) return qualityDiff;

  const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
  const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
  if (timeB !== timeA) return timeB - timeA;

  return (a.id || "").localeCompare(b.id || "");
}

/**
 * Robust server-side ranking engine for products aligned strictly with feed cohorts.
 */
export function calculateProductRank(
  targetProduct: Product | null | undefined,
  allProducts: Product[]
): ProductRankDetails {
  if (!targetProduct) {
    return {
      rank: null,
      rankLabel: "Day Rank",
      isTopHunt: false,
      cohortProducts: [],
      prevProd: null,
      nextProd: null
    };
  }

  const now = new Date();
  const startOfToday = getISTStartOfDay(now);
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

  const isScheduled = !!(targetProduct.status === "scheduled" && targetProduct.scheduled_for && new Date(targetProduct.scheduled_for) > now);
  const targetLaunchDate = targetProduct.scheduled_for ? new Date(targetProduct.scheduled_for) : new Date(targetProduct.created_at);

  const pool = allProducts && allProducts.length > 0 ? allProducts : [targetProduct];
  const combined = pool.some(p => p.id === targetProduct.id) ? pool : [targetProduct, ...pool];

  // 0. Upcoming / Pre-launch
  if (isScheduled) {
    const upcomingProds = combined.filter(p => {
      if (p.status === "scheduled" && p.scheduled_for) {
        return new Date(p.scheduled_for) > now;
      }
      return false;
    });
    upcomingProds.sort((a, b) => {
      const timeDiff = new Date(a.scheduled_for || 0).getTime() - new Date(b.scheduled_for || 0).getTime();
      if (timeDiff !== 0) return timeDiff;
      return compareProductsForRanking(a, b);
    });
    const rankIdx = upcomingProds.findIndex(p => p.id === targetProduct.id);
    const cohort = upcomingProds.length > 0 ? upcomingProds : [targetProduct];
    const cIdx = cohort.findIndex(p => p.id === targetProduct.id);
    return {
      rank: rankIdx !== -1 ? rankIdx + 1 : 1,
      rankLabel: "Upcoming",
      isTopHunt: false,
      cohortProducts: cohort,
      prevProd: cIdx > 0 ? cohort[cIdx - 1] : null,
      nextProd: cIdx >= 0 && cIdx < cohort.length - 1 ? cohort[cIdx + 1] : null
    };
  }

  // Filter live products (exclude drafts and future scheduled)
  const liveProducts = combined.filter(p => {
    if (p.status === "scheduled" && p.scheduled_for) {
      return new Date(p.scheduled_for) <= now;
    }
    return p.status !== "scheduled" && p.status !== "draft";
  });

  const sortComparator = compareProductsForRanking;

  // 1. TODAY'S LAUNCHES
  if (targetLaunchDate >= startOfToday) {
    const todayProds = liveProducts.filter(p => {
      const pLaunch = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
      return pLaunch >= startOfToday;
    });
    todayProds.sort(sortComparator);
    const rankIdx = todayProds.findIndex(p => p.id === targetProduct.id);
    const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
    const cohort = todayProds.length > 0 ? todayProds : [targetProduct];
    const cIdx = cohort.findIndex(p => p.id === targetProduct.id);
    return {
      rank,
      rankLabel: "Day Rank",
      isTopHunt: rank === 1,
      cohortProducts: cohort,
      prevProd: cIdx > 0 ? cohort[cIdx - 1] : null,
      nextProd: cIdx >= 0 && cIdx < cohort.length - 1 ? cohort[cIdx + 1] : null
    };
  }

  // 2. YESTERDAY'S LAUNCHES
  if (targetLaunchDate >= startOfYesterday && targetLaunchDate < startOfToday) {
    const yesterdayProds = liveProducts.filter(p => {
      const pLaunch = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
      return pLaunch >= startOfYesterday && pLaunch < startOfToday;
    });
    yesterdayProds.sort(sortComparator);
    const rankIdx = yesterdayProds.findIndex(p => p.id === targetProduct.id);
    const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
    const cohort = yesterdayProds.length > 0 ? yesterdayProds : [targetProduct];
    const cIdx = cohort.findIndex(p => p.id === targetProduct.id);
    return {
      rank,
      rankLabel: "Day Rank",
      isTopHunt: false,
      cohortProducts: cohort,
      prevProd: cIdx > 0 ? cohort[cIdx - 1] : null,
      nextProd: cIdx >= 0 && cIdx < cohort.length - 1 ? cohort[cIdx + 1] : null
    };
  }

  // 3. Exact Same Calendar Day launches (if >= 2 products on that day)
  const targetDayStart = getISTStartOfDay(targetLaunchDate);
  const targetDayEnd = new Date(targetDayStart.getTime() + 24 * 60 * 60 * 1000);
  const sameCalendarDayProds = liveProducts.filter(p => {
    const pLaunch = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
    return pLaunch >= targetDayStart && pLaunch < targetDayEnd;
  });

  if (sameCalendarDayProds.length >= 2) {
    sameCalendarDayProds.sort(sortComparator);
    const rankIdx = sameCalendarDayProds.findIndex(p => p.id === targetProduct.id);
    const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
    const cIdx = sameCalendarDayProds.findIndex(p => p.id === targetProduct.id);
    return {
      rank,
      rankLabel: "Day Rank",
      isTopHunt: false,
      cohortProducts: sameCalendarDayProds,
      prevProd: cIdx > 0 ? sameCalendarDayProds[cIdx - 1] : null,
      nextProd: cIdx >= 0 && cIdx < sameCalendarDayProds.length - 1 ? sameCalendarDayProds[cIdx + 1] : null
    };
  }

  // 4. LAST WEEK'S LAUNCHES
  if (targetLaunchDate >= oneWeekAgo && targetLaunchDate < startOfYesterday) {
    const weekProds = liveProducts.filter(p => {
      const pLaunch = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
      return pLaunch >= oneWeekAgo && pLaunch < startOfYesterday;
    });
    weekProds.sort(sortComparator);
    const rankIdx = weekProds.findIndex(p => p.id === targetProduct.id);
    const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
    const cohort = weekProds.length > 0 ? weekProds : [targetProduct];
    const cIdx = cohort.findIndex(p => p.id === targetProduct.id);
    return {
      rank,
      rankLabel: "Week Rank",
      isTopHunt: false,
      cohortProducts: cohort,
      prevProd: cIdx > 0 ? cohort[cIdx - 1] : null,
      nextProd: cIdx >= 0 && cIdx < cohort.length - 1 ? cohort[cIdx + 1] : null
    };
  }

  // 5. LAST MONTH'S LAUNCHES
  if (targetLaunchDate >= oneMonthAgo && targetLaunchDate < oneWeekAgo) {
    const monthProds = liveProducts.filter(p => {
      const pLaunch = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at);
      return pLaunch >= oneMonthAgo && pLaunch < oneWeekAgo;
    });
    monthProds.sort(sortComparator);
    const rankIdx = monthProds.findIndex(p => p.id === targetProduct.id);
    const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
    const cohort = monthProds.length > 0 ? monthProds : [targetProduct];
    const cIdx = cohort.findIndex(p => p.id === targetProduct.id);
    return {
      rank,
      rankLabel: "Month Rank",
      isTopHunt: false,
      cohortProducts: cohort,
      prevProd: cIdx > 0 ? cohort[cIdx - 1] : null,
      nextProd: cIdx >= 0 && cIdx < cohort.length - 1 ? cohort[cIdx + 1] : null
    };
  }

  // 6. ALL-TIME / HISTORICAL LEADERBOARD
  const allTimeProds = [...liveProducts].sort(sortComparator);
  const rankIdx = allTimeProds.findIndex(p => p.id === targetProduct.id);
  const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
  const cohort = allTimeProds.length > 0 ? allTimeProds : [targetProduct];
  const cIdx = cohort.findIndex(p => p.id === targetProduct.id);
  return {
    rank,
    rankLabel: "All-Time",
    isTopHunt: false,
    cohortProducts: cohort,
    prevProd: cIdx > 0 ? cohort[cIdx - 1] : null,
    nextProd: cIdx >= 0 && cIdx < cohort.length - 1 ? cohort[cIdx + 1] : null
  };
}

export async function getUserProducts(userId: string): Promise<Product[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<Product[]>(`/t/products?makerId=${encodeURIComponent(userId)}&limit=100`);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.filter(p => !p.is_deleted);
    }
  } catch (e) { }

  try {
    const allProds = await getProducts(userId);
    const matched = allProds.filter(p => (p.maker_id === userId || p.maker?.id === userId) && !p.is_deleted);
    if (matched.length > 0) return matched;
  } catch (e) { }

  if (typeof window !== 'undefined') {
    try {
      const cached = getCachedProducts();
      return cached.filter(p => (p.maker_id === userId || p.maker?.id === userId) && !p.is_deleted);
    } catch (e) { }
  }

  return [];
}

export async function getUserUpvotedProductIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<{ product_id: string }[]>(`/t/upvotes?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data.map(u => u.product_id);
    }
  } catch (err) {
    console.warn('[getUserUpvotedProductIds] API call failed:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`indihunt_upvotes_${userId}`) || localStorage.getItem('indihunt_upvotes');
      if (raw) return JSON.parse(raw);
    } catch { }
  }
  return [];
}

export async function getUserUpvotedProducts(userId: string): Promise<Product[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<Product[]>(`/t/upvotes?userId=${encodeURIComponent(userId)}&withProducts=true`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('[getUserUpvotedProducts] API call failed:', err);
  }
  return [];
}

export async function getUserReviewsList(userId: string): Promise<Review[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<Review[]>(`/t/reviews?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('[getUserReviewsList] API call failed:', err);
  }
  return [];
}

export async function getUserThreadsList(userId: string): Promise<Thread[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<Thread[]>(`/t/threads?authorId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('[getUserThreadsList] API call failed:', err);
  }
  return [];
}

export async function getUserFollowersList(userId: string): Promise<Profile[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<Profile[]>(`/t/user-follows?userId=${encodeURIComponent(userId)}&type=followers`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('[getUserFollowersList] API call failed:', err);
  }
  return [];
}

export async function getUserFollowingList(userId: string): Promise<Profile[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<Profile[]>(`/t/user-follows?userId=${encodeURIComponent(userId)}&type=following`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('[getUserFollowingList] API call failed:', err);
  }
  return [];
}

export async function getUserFollowedProductsList(userId: string): Promise<Product[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<Product[]>(`/t/product-follows?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('[getUserFollowedProductsList] API call failed:', err);
  }
  return [];
}

export async function getUserPactsList(userId: string): Promise<any[]> {
  if (!userId) return [];
  try {
    const res = await secureApiFetch<any[]>(`/t/pacts?userId=${encodeURIComponent(userId)}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('[getUserPactsList] API call failed:', err);
  }
  return [];
}

export function getSimilarProducts(
  target: Product | null | undefined,
  allProducts: Product[],
  limit = 3
): Product[] {
  if (!target || !allProducts || allProducts.length === 0) return [];
  const targetCategory = (target.category || "").trim().toLowerCase();
  const targetTags = new Set(
    ((target.tags || []) as any[])
      .filter((t: any): t is string => typeof t === "string")
      .map((t: string) => t.trim().toLowerCase())
  );

  const filtered = allProducts.filter(
    (p: Product) =>
      p &&
      p.id !== target.id &&
      p.id !== "prod-media-1" &&
      p.id !== "prod-media-2" &&
      p.id !== "prod-media-3" &&
      p.name !== "StreamPulse AI" &&
      p.name !== "VoxWave Studio" &&
      p.name !== "OmniPlay Pro" &&
      getProductSlug(p.name) !== getProductSlug(target.name)
  );

  if (filtered.length === 0) return [];

  const scored = filtered.map((p) => {
    let score = 0;
    const pCat = (p.category || "").trim().toLowerCase();
    if (targetCategory && pCat && pCat === targetCategory) score += 5;
    if (p.tags && Array.isArray(p.tags)) {
      for (const t of p.tags) {
        if (typeof t === "string" && targetTags.has(t.trim().toLowerCase())) {
          score += 2;
        }
      }
    }
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score || (b.product.upvotes_count || 0) - (a.product.upvotes_count || 0));
  return scored.slice(0, limit).map((s) => s.product);
}




