import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit } from '@/lib/rate-limit';
import { detectBotOrScraper } from '@/lib/bot-protection';
import { inspectSecurityThreats, getStrictCorsHeaders } from '@/lib/security';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const userAgent = request.headers.get('user-agent');
  const origin = request.headers.get('origin');

  const corsHeaders = getStrictCorsHeaders(origin);

  if (pathname === '/&' || pathname.startsWith('/&')) {
    return NextResponse.redirect(new URL('/', request.url), 301);
  }

  // ── 301 Permanent Canonical Redirects for Search Engines ──
  // 1. /categories?category=xyz -> /categories/xyz
  if (pathname === '/categories' && request.nextUrl.searchParams.has('category')) {
    const rawCat = request.nextUrl.searchParams.get('category') || '';
    const cleanCat = rawCat.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    const target = cleanCat ? `/categories/${cleanCat}` : '/categories';
    return NextResponse.redirect(new URL(target, request.url), 301);
  }

  // 2. /categories/[cat]?category=... -> strip duplicate query param
  if (pathname.startsWith('/categories/') && request.nextUrl.searchParams.has('category')) {
    return NextResponse.redirect(new URL(pathname, request.url), 301);
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const securityThreat = inspectSecurityThreats(`${pathname}${search}`);
  if (securityThreat.isThreat) {
    return NextResponse.json(
      { success: false, error: 'Access Denied - Security Threat Blocked', reason: securityThreat.reason, errors: [] },
      { status: 400, headers: { ...corsHeaders, 'x-request-id': requestId, 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff' } }
    );
  }

  // Trust internal SSR self-requests — they carry a bypass header set by secureApiFetch
  // so they won't be caught by the bot-detection layer (Node.js fetch UA triggers it)
  const isInternalSSR = request.headers.get('x-internal-ssr') === '1';

  if (!isInternalSSR) {
    const botResult = detectBotOrScraper(userAgent);
    if (botResult.isBot && !botResult.isLegitimateSeoBot) {
      return NextResponse.json(
        { success: false, error: 'Access Denied - Automated Request Blocked', reason: botResult.reason, errors: [] },
        { status: 403, headers: { ...corsHeaders, 'x-request-id': requestId, 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff' } }
      );
    }
  }

  const isApiOrProxy = pathname.startsWith('/t/') || pathname.startsWith('/api/');

  if (isApiOrProxy) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
    let limit = 60;
    if (pathname.includes('/upload') || pathname.includes('/ai/')) {
      limit = 15;
    } else if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH' || request.method === 'DELETE') {
      limit = 30;
    }
    const rateResult = checkRateLimit(`rate_${ip}_${pathname}`, { limit, windowMs: 60 * 1000 });
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too Many Requests - Rate Limit Exceeded', retryAfterSeconds: Math.ceil(rateResult.resetMs / 1000), errors: [] },
        { status: 429, headers: { ...corsHeaders, 'X-RateLimit-Limit': rateResult.limit.toString(), 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': rateResult.resetMs.toString(), 'Retry-After': Math.ceil(rateResult.resetMs / 1000).toString(), 'x-request-id': requestId } }
      );
    }

    if (pathname.startsWith('/t/proxy/supabase') || pathname.startsWith('/api/proxy/supabase')) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!supabaseUrl) {
        return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 });
      }
      const path = pathname.replace('/t/proxy/supabase', '').replace('/api/proxy/supabase', '');
      const targetUrl = `${supabaseUrl}${path}${search}`;
      const headers = new Headers(request.headers);
      headers.set('host', new URL(supabaseUrl).host);
      headers.set('x-request-id', requestId);
      return NextResponse.rewrite(new URL(targetUrl), { request: { headers } });
    }

    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    response.headers.set('X-RateLimit-Limit', rateResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateResult.remaining.toString());
    response.headers.set('x-request-id', requestId);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Default API routes to private no-store; public routes explicitly set PUBLIC_CACHE_HEADERS in their route handlers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }

  // ── Page routes: refresh Supabase session cookie or handle OAuth code ──
  const code = request.nextUrl.searchParams.get('code');
  const isAuthCallback = !!code;
  let redirectUrl = request.nextUrl.clone();
  
  if (isAuthCallback) {
    redirectUrl.searchParams.delete('code');
  }

  let response = isAuthCallback 
    ? NextResponse.redirect(redirectUrl)
    : NextResponse.next({ request: { headers: request.headers } });

  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-') || c.name.includes('auth-token') || c.name.includes('access_token'));

  const isProtectedPath = 
    pathname.startsWith('/admin') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/my-products') ||
    pathname.startsWith('/new') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings');

  if (isAuthCallback || (hasAuthCookie && isProtectedPath)) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              response = isAuthCallback
                ? NextResponse.redirect(redirectUrl)
                : NextResponse.next({ request: { headers: request.headers } });
              cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
          },
        }
      );

      if (isAuthCallback && code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else if (hasAuthCookie) {
        const { data: { user: _u } } = await supabase.auth.getUser(); // refresh session cookies if needed
        void _u;
      }
    } catch (authErr) {
      console.warn('[Middleware] Supabase auth refresh error:', authErr);
    }
  }

  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  response.headers.set('x-request-id', requestId);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Set Cache-Control: no-store for authenticated / protected pages, public edge cache for guest landing/content pages
  if (hasAuthCookie || isProtectedPath || isAuthCallback) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
  } else {
    response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=299');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
};