import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return apiSuccess();
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to sign out', 500);
  }
}
