import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return apiSuccessSecure();
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to sign out', 500);
  }
}
