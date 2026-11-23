import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return apiFailure('Missing setting key', 400);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure(data?.value || null);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to fetch platform settings', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;
    if (!key) return apiFailure('Missing setting key', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('platform_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure({ success: true, key, value });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to update platform settings', 500);
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
