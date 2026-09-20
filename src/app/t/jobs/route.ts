import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCachedData, setCachedData, invalidateCache } from '@/lib/redis';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/jobs?includeInactive=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const cacheKey = includeInactive ? 'jobs:all' : 'jobs:active';
    const cached = await getCachedData<any[]>(cacheKey);
    if (cached) return apiSuccess(cached);

    const supabase = await createServerSupabaseClient();
    let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (!includeInactive) query = query.eq('is_active', true);

    const { data: jobs, error } = await query;
    if (error) return apiFailure(error.message, 500);

    const list = jobs || [];
    await setCachedData(cacheKey, list, 300);
    return apiSuccess(list);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch jobs', 500);
  }
}

// POST /t/jobs — create job (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, department, location, type, experience, stipend_salary, description, responsibilities, requirements, perks, is_active } = body;

    if (!title || !description) return apiFailure('title and description are required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title,
        department: department || 'Engineering',
        location: location || 'Remote (India)',
        type: type || 'Full-time',
        experience: experience || '1-3 years',
        stipend_salary: stipend_salary || 'Competitive',
        description,
        responsibilities: responsibilities || [],
        requirements: requirements || [],
        perks: perks || [],
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) return apiFailure(error.message, 500);

    await invalidateCache('jobs:active');
    await invalidateCache('jobs:all');
    return apiSuccess(job, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to create job', 500);
  }
}
