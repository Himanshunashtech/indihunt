import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { productId, threadId, userId, reason, description } = body;

    if (!reason || (!productId && !threadId)) {
      return apiFailure('Missing required report parameters (reason and productId or threadId)', 400);
    }

    const supabase = await createServerSupabaseClient();

    if (productId) {
      const { error } = await supabase
        .from('reports')
        .upsert(
          { product_id: productId, user_id: userId || null, reason, description: description || null },
          { onConflict: 'product_id,user_id', ignoreDuplicates: true }
        );

      if (error) {
        return apiFailure(error.message, 500);
      }
      return apiSuccessSecure({ success: true, alreadyReported: false });
    }

    if (threadId) {
      const { error } = await supabase
        .from('thread_reports')
        .upsert(
          { thread_id: threadId, user_id: userId || null, reason, description: description || null },
          { onConflict: 'thread_id,user_id', ignoreDuplicates: true }
        );

      if (error) {
        return apiFailure(error.message, 500);
      }
      return apiSuccessSecure({ success: true, alreadyReported: false });
    }

    return apiFailure('Invalid report target', 400);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to submit report', 500);
  }
}
