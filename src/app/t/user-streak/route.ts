import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure, isValidUUID } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return apiFailure('userId is required', 400);
    }

    if (!isValidUUID(userId)) {
      return apiSuccessSecure({ streak_count: 1, last_active_date: new Date().toISOString() });
    }

    const supabase = await createServerSupabaseClient();

    // Call database stored procedure
    try {
      await supabase.rpc('update_user_streak', { p_user_id: userId });
    } catch (rpcErr) {
      // ignore if RPC not present in older DB
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('streak_count, last_active_date')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(profile || { streak_count: 1, last_active_date: new Date().toISOString() });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update user streak', 500);
  }
}
