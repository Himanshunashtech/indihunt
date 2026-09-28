import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || !email.includes('@')) {
      return apiFailure('Valid email address is required', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({ email, created_at: new Date().toISOString() });

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({ message: 'Successfully subscribed to IndiHunt newsletter!' });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to subscribe', 500);
  }
}
