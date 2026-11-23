import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return apiFailure('Unauthorized', 401);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return apiFailure('Forbidden - Admin access required', 403);
    }

    return apiSuccessSecure({
      isAdmin: true,
      role: 'admin',
    });
  } catch (err: any) {
    return apiFailure(err?.message || 'Admin debug failed', 500);
  }
}
