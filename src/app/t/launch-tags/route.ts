import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/launch-tags?category=xxx&search=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const cacheKey = `launch-tags:${category || 'all'}:${search || ''}`;
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached) return apiSuccessSecure(cached);

    const supabase = await createServerSupabaseClient();
    let query = supabase.from('launch_tags').select('*').order('name', { ascending: true });

    if (category && category !== 'All') query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data: tags, error } = await query;
    if (error) return apiFailure(error.message, 500);

    const list = tags || [];
    await setCachedData(cacheKey, list, 600);
    return apiSuccessSecure(list);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch launch tags', 500);
  }
}

// POST /t/launch-tags — create tag (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, description, icon, color } = body;

    if (!name) return apiFailure('name is required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: tag, error } = await supabase
      .from('launch_tags')
      .insert({ name, category: category || 'General', description: description || null, icon: icon || null, color: color || null })
      .select()
      .single();

    if (error) return apiFailure(error.message, 500);

    await invalidateCache('launch-tags:all:');
    return apiSuccessSecure(tag, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create launch tag', 500);
  }
}

// PUT /t/launch-tags — update tag (admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: tag, error } = await supabase
      .from('launch_tags')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return apiFailure(error.message, 500);

    await invalidateCache('launch-tags:all:');
    return apiSuccessSecure(tag);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update launch tag', 500);
  }
}

// DELETE /t/launch-tags?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('launch_tags').delete().eq('id', id);
    if (error) return apiFailure(error.message, 500);

    await invalidateCache('launch-tags:all:');
    return apiSuccessSecure({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete launch tag', 500);
  }
}
