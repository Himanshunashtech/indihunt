import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { invalidateCache } from '@/lib/redis';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/jobs/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: job, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();

    if (error) return apiFailure(error.message, 500);
    if (!job) return apiFailure('Job not found', 404);

    return apiSuccessSecure(job);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch job', 500);
  }
}

// PUT /t/jobs/[id] — update job (admin)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: job, error } = await supabase
      .from('jobs')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return apiFailure(error.message, 500);

    await invalidateCache('jobs:active');
    await invalidateCache('jobs:all');
    return apiSuccessSecure(job);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update job', 500);
  }
}

// DELETE /t/jobs/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) return apiFailure(error.message, 500);

    await invalidateCache('jobs:active');
    await invalidateCache('jobs:all');
    return apiSuccessSecure({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete job', 500);
  }
}
