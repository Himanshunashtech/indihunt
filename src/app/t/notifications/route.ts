import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!userId) {
      return apiFailure('Missing userId parameter', 400);
    }

    const countOnly = searchParams.get('count_only') === 'true' || searchParams.get('unread_count') === 'true';

    const supabase = await createServerSupabaseClient();

    if (countOnly) {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        return apiFailure(error.message, 500);
      }
      return apiSuccessSecure({ count: count || 0 });
    }

    let notifs: any[] = [];

    // Attempt select with joined actor profile
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, actor_id, entity_type, entity_id, data, read, created_at, actor:profiles!actor_id(id, username, full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Fallback without explicit relation name if join syntax differs
      const fallbackQuery = await supabase
        .from('notifications')
        .select('id, user_id, type, actor_id, entity_type, entity_id, data, read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackQuery.error) {
        console.warn('[GET /t/notifications] DB query warning:', fallbackQuery.error.message);
        return apiSuccessSecure([]);
      }
      notifs = fallbackQuery.data || [];
    } else {
      notifs = data || [];
    }

    return apiSuccessSecure(notifs);
  } catch (error: any) {
    console.error('[GET /t/notifications] Error:', error);
    return apiFailure(error?.message || 'Failed to fetch notifications', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, user_id, actorId, actor_id, title, message, type, link, entity_type, entityType, entity_id, entityId, data } = body;
    const targetUserId = userId || user_id;

    if (!targetUserId) {
      return apiFailure('Missing required user_id', 400);
    }

    const supabase = await createServerSupabaseClient();
    const notificationData = {
      title,
      message: message || '',
      link: link || null,
      ...(typeof data === 'object' && data !== null ? data : {})
    };

    const { data: newNotif, error } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        actor_id: actorId || actor_id || null,
        type: type || 'system',
        entity_type: entity_type || entityType || null,
        entity_id: entity_id || entityId || null,
        data: notificationData,
        read: false,
      })
      .select('*')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(newNotif, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create notification', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, id, userId, user_id, markAll } = body;

    const notifId = notificationId || id;
    const targetUserId = userId || user_id;
    const supabase = await createServerSupabaseClient();

    if (markAll && targetUserId) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', targetUserId);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ success: true, allRead: true });
    }

    if (notifId) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notifId);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ success: true, id: notifId, read: true });
    }

    return apiFailure('Missing notificationId or markAll+userId', 400);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update notification', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id') || searchParams.get('notificationId');
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    const clearAll = searchParams.get('clearAll') === 'true';

    const supabase = await createServerSupabaseClient();

    if (clearAll && userId) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ cleared: true });
    }

    if (notificationId) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) return apiFailure(error.message, 500);
      return apiSuccessSecure({ deleted: true, id: notificationId });
    }

    return apiFailure('Missing notificationId or clearAll+userId', 400);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete notification', 500);
  }
}
