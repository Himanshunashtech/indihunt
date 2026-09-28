import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: members, error } = await supabase
      .from('product_members')
      .select('*, user:profiles(id, username, full_name, avatar_url, headline, is_maker)')
      .eq('product_id', id);

    if (error) {
      return apiFailure(error.message, 500);
    }

    const profiles = (members || []).map((m: any) => m.user || m);
    return apiSuccessSecure(profiles);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch team members', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return apiFailure('Missing userId', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('product_members')
      .insert({
        product_id: id,
        user_id: userId,
        role: role || 'co-maker',
      })
      .select('*, user:profiles(*)')
      .single();

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure(data);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to add team member', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return apiFailure('Missing userId', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('product_members')
      .delete()
      .eq('product_id', id)
      .eq('user_id', userId);

    if (error) {
      return apiFailure(error.message, 500);
    }

    return apiSuccessSecure({ removed: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to remove team member', 500);
  }
}
