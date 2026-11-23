-- Migration 80: Create Careers, Job Postings, Job Applications, and Resumes Storage Bucket

-- 1. Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Engineering',
  location TEXT NOT NULL DEFAULT 'Remote (India)',
  type TEXT NOT NULL DEFAULT 'Full-time', -- Full-time, Part-time, Internship, Contract
  experience TEXT NOT NULL DEFAULT '1-3 years',
  stipend_salary TEXT NOT NULL DEFAULT 'Competitive',
  description TEXT NOT NULL,
  responsibilities TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  perks TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  role_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  current_location TEXT NOT NULL,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  twitter_url TEXT,
  current_ctc TEXT,
  expected_ctc TEXT NOT NULL,
  experience_years TEXT NOT NULL DEFAULT 'Fresher',
  notice_period TEXT NOT NULL DEFAULT 'Immediate',
  cover_note TEXT NOT NULL,
  resume_url TEXT,
  resume_filename TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewing, shortlisted, rejected, hired
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON public.job_applications(email);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs
CREATE POLICY "Public can view active jobs"
  ON public.jobs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage jobs"
  ON public.jobs FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for job_applications
CREATE POLICY "Anyone can submit job applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view and manage job applications"
  ON public.job_applications FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 3. Create 'resumes' storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Storage policies for resumes bucket
DROP POLICY IF EXISTS "Public resumes insert" ON storage.objects;
CREATE POLICY "Public resumes insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Public resumes select" ON storage.objects;
CREATE POLICY "Public resumes select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

