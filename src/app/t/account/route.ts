import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return apiFailure('Missing userId', 400);
    }

    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    if (action === 'deactivate') {
      const { error } = await supabase.from('profiles').update({
        is_deactivated: true,
        deactivated_at: now,
      }).eq('id', userId);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ success: true, deactivated: true });
    }

    if (action === 'delete') {
      try {
        const { error } = await supabase.rpc('anonymize_and_delete_account', { target_user_id: userId });
        if (error) {
          await supabase.from('profiles').update({
            full_name: 'Deleted User',
            username: `deleted_${userId.substring(0, 8)}`,
            bio: null,
            avatar_url: null,
            location: null,
            website: null,
            is_deactivated: true,
            deleted_at: now,
          }).eq('id', userId);
        }
      } catch (e) {
        await supabase.from('profiles').update({
          full_name: 'Deleted User',
          username: `deleted_${userId.substring(0, 8)}`,
          bio: null,
          avatar_url: null,
          location: null,
          website: null,
          is_deactivated: true,
          deleted_at: now,
        }).eq('id', userId);
      }

      return apiSuccessSecure({ success: true, deleted: true });
    }

    return apiFailure('Invalid action', 400);
  } catch (err: any) {
    return apiFailure(err?.message || 'Failed to process account action', 500);
  }
}
