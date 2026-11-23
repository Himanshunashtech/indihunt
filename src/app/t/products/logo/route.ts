import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedProducts } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || id === '00000000-0000-0000-0000-000000000000') {
      return NextResponse.redirect(
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80',
        302
      );
    }

    let logoUrl: string | null = null;
    let websiteUrl: string | null = null;

    const supabase = await createServerSupabaseClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUUID) {
      const { data } = await supabase
        .from('products')
        .select('logo_url, website_url')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        logoUrl = data.logo_url || null;
        websiteUrl = data.website_url || null;
      }
    }

    if (!logoUrl) {
      const { data: allProds } = await supabase
        .from('products')
        .select('id, name, logo_url, website_url');

      if (allProds) {
        const found = allProds.find(
          (p: any) => p.id === id || p.name?.toLowerCase() === id.toLowerCase()
        );
        if (found) {
          logoUrl = found.logo_url || null;
          websiteUrl = found.website_url || null;
        }
      }
    }

    if (!logoUrl) {
      const cached = getCachedProducts();
      const match = cached.find(
        (p: any) => p.id === id || p.name?.toLowerCase() === id.toLowerCase()
      );
      if (match) {
        logoUrl = match.logo_url || null;
        websiteUrl = match.website_url || null;
      }
    }

    if (logoUrl && logoUrl.trim().length > 0) {
      return NextResponse.redirect(logoUrl, 302);
    }

    if (websiteUrl) {
      try {
        const hostname = new URL(websiteUrl).hostname;
        if (hostname) {
          return NextResponse.redirect(
            `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
            302
          );
        }
      } catch { }
    }

    return NextResponse.redirect(
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80',
      302
    );
  } catch {
    return NextResponse.redirect(
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80',
      302
    );
  }
}
