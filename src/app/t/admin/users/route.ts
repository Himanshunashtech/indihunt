import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure(data || []);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to fetch admin users', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return apiFailure('Missing userId or role', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true, userId, role });
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to update user role', 500);
  }
}
