import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return apiFailure('Missing userId parameter', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: pacts, error } = await supabase
      .from('pacts')
      .select('*, product_1:products!product_1(id, name, scheduled_for, logo_url), product_2:products!product_2(id, name, scheduled_for, logo_url), user_1:profiles!user_1(id, full_name, avatar_url), user_2:profiles!user_2(id, full_name, avatar_url)')
      .or(`user_1.eq.${userId},user_2.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(pacts || []);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch pacts', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user1Id, user2Id, product1Id, product2Id } = body;

    if (!user1Id || !user2Id || !product1Id || !product2Id) {
      return apiFailure('Missing required pact fields', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: newPact, error } = await supabase
      .from('pacts')
      .insert({
        user_1: user1Id,
        user_2: user2Id,
        product_1: product1Id,
        product_2: product2Id,
        status: 'active',
      })
      .select('*')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(newPact);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create pact', 500);
  }
}
