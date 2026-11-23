import { NextRequest } from 'next/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 8000;
const MAX_GALLERY = 5;

function isPrivateHostOrIp(hostname: string): boolean {
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname)) return true;
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (match) {
    const [, a, b] = match.map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }
  if (hostname.includes(':')) {
    const lower = hostname.toLowerCase();
    return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
  }
  return false;
}

async function assertSafeUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }
  const hostname = parsed.hostname;
  if (isPrivateHostOrIp(hostname)) throw new Error('Blocked host (private IP or localhost)');
  return parsed;
}

function decodeEntities(str: string) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .trim();
}

function resolveUrl(maybeRelative: string, base: URL) {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return '';
  }
}

function metaContent(html: string, attr: 'name' | 'property', key: string) {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["']`,
    'i'
  );
  const m = html.match(re);
  const val = m ? m[1] ?? m[2] : '';
  return val ? decodeEntities(val) : '';
}

function allMetaContent(html: string, attr: 'name' | 'property', key: string) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']`, 'gi');
  return [...html.matchAll(re)].map((m) => decodeEntities(m[1])).filter(Boolean);
}

function iconCandidates(html: string) {
  const linkTags = html.match(/<link[^>]+>/gi) || [];
  const icons: { href: string; rel: string; size: number }[] = [];
  for (const tag of linkTags) {
    const relMatch = tag.match(/rel=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!relMatch || !hrefMatch) continue;
    const rel = relMatch[1].toLowerCase();
    if (!rel.includes('icon')) continue;
    const sizeMatch = tag.match(/sizes=["'](\d+)x\d+["']/i);
    const size = sizeMatch ? parseInt(sizeMatch[1], 10) : rel.includes('apple') ? 152 : 32;
    icons.push({ href: hrefMatch[1].trim(), rel, size });
  }
  return icons.sort((a, b) => b.size - a.size);
}

const FALLBACK_LOGO = (hostname: string) =>
  `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;

export async function POST(request: NextRequest) {
  let parsedUrl: URL;
  try {
    const { url } = await request.json();
    if (!url) return apiFailure('URL is required', 400);
    parsedUrl = await assertSafeUrl(url);
  } catch (e: any) {
    return apiFailure(e.message || 'Invalid URL', 400);
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, '');
  const capitalizedName = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);

  const fallback = () =>
    apiSuccessSecure({
      name: capitalizedName,
      tagline: `${capitalizedName} — built by an indie maker`,
      description: 'Explore this product on IndiHunt.',
      logo_url: FALLBACK_LOGO(hostname),
      gallery: [],
      website: parsedUrl.toString(),
    });

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    clearTimeout(timeout);
    if (!response.ok) return fallback();

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return fallback();

    html = await response.text();
  } catch {
    return fallback();
  }

  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleTagMatch ? decodeEntities(titleTagMatch[1]) : '';
  const ogTitle = metaContent(html, 'property', 'og:title');
  const twitterTitle = metaContent(html, 'name', 'twitter:title');
  const siteName = metaContent(html, 'property', 'og:site_name');

  const bestTitle = ogTitle || twitterTitle || rawTitle || capitalizedName;
  const name = (siteName || bestTitle).split(/[-|·—]/)[0].trim().slice(0, 60) || capitalizedName;

  let tagline = (ogTitle || twitterTitle || rawTitle || `${name} on IndiHunt`).trim();
  if (siteName && tagline.toLowerCase().startsWith(siteName.toLowerCase())) {
    tagline = tagline.slice(siteName.length).replace(/^[-|·—:\s]+/, '');
  }
  tagline = tagline || `${name} — built by an indie maker`;
  if (tagline.length > 70) tagline = tagline.slice(0, 67).trimEnd() + '...';

  const description =
    metaContent(html, 'name', 'description') ||
    metaContent(html, 'property', 'og:description') ||
    metaContent(html, 'name', 'twitter:description') ||
    'Explore this amazing solution built by innovators.';

  const ogImages = allMetaContent(html, 'property', 'og:image');
  const twitterImages = allMetaContent(html, 'name', 'twitter:image');
  const gallery = Array.from(new Set([...ogImages, ...twitterImages]))
    .map((src) => resolveUrl(src, parsedUrl))
    .filter(Boolean)
    .slice(0, MAX_GALLERY);

  const icons = iconCandidates(html);
  let logoUrl = '';
  for (const icon of icons) {
    const resolved = resolveUrl(icon.href, parsedUrl);
    if (resolved) {
      logoUrl = resolved;
      break;
    }
  }
  if (!logoUrl) logoUrl = gallery[0] || FALLBACK_LOGO(hostname);

  return apiSuccessSecure({
    name,
    tagline,
    description: description.length > 200 ? description.slice(0, 200).trimEnd() + '...' : description,
    logo_url: logoUrl,
    gallery,
    website: parsedUrl.toString(),
  });
}
