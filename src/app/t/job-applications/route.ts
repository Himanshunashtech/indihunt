import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

// GET /t/job-applications — admin: list all applications
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure(applications || []);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch job applications', 500);
  }
}

// POST /t/job-applications — submit application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      job_id, role_title, full_name, email, phone_number, current_location,
      linkedin_url, github_url, portfolio_url, twitter_url, current_ctc,
      expected_ctc, experience_years, notice_period, cover_note,
      resume_url, resume_filename,
    } = body;

    if (!full_name || !email || !phone_number || !cover_note) {
      return apiFailure('full_name, email, phone_number, and cover_note are required', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: application, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: job_id || null,
        role_title,
        full_name,
        email,
        phone_number,
        current_location,
        linkedin_url: linkedin_url || null,
        github_url: github_url || null,
        portfolio_url: portfolio_url || null,
        twitter_url: twitter_url || null,
        current_ctc: current_ctc || null,
        expected_ctc,
        experience_years: experience_years || 'Fresher',
        notice_period: notice_period || 'Immediate',
        cover_note,
        resume_url: resume_url || null,
        resume_filename: resume_filename || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return apiFailure(error.message, 500);
    return apiSuccessSecure(application, 201);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to submit job application', 500);
  }
}

// PATCH /t/job-applications — admin: update status/notes
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, admin_notes } = body;

    if (!id || !status) return apiFailure('id and status are required', 400);

    const supabase = await createServerSupabaseClient();
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (admin_notes !== undefined) payload.admin_notes = admin_notes;

    const { error } = await supabase.from('job_applications').update(payload).eq('id', id);
    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to update application status', 500);
  }
}

// DELETE /t/job-applications?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return apiFailure('id is required', 400);

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('job_applications').delete().eq('id', id);
    if (error) return apiFailure(error.message, 500);

    return apiSuccessSecure({ success: true });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to delete application', 500);
  }
}
