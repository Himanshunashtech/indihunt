import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const provider = requestUrl.searchParams.get('provider');

  if (!provider || (provider !== 'google' && provider !== 'github')) {
    return NextResponse.redirect(`${requestUrl.origin}/?error=invalid_provider`);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'google' | 'github',
    options: {
      redirectTo: `${requestUrl.origin}/`,
    },
  });

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/?error=auth_failed`);
  }

  if (data?.url) {
    return NextResponse.redirect(data.url);
  }

  return NextResponse.redirect(`${requestUrl.origin}/?error=no_url`);
}
