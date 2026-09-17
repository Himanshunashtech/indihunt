-- Migration to create billboard_ads table and its storage bucket

-- 1. Create Billboard Ads Table
CREATE TABLE IF NOT EXISTS public.billboard_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    image_url TEXT NOT NULL,
    destination_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.billboard_ads ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active billboard ads
CREATE POLICY "Anyone can view active billboard ads"
    ON public.billboard_ads FOR SELECT
    USING (is_active = true);

-- Policy: Admins can read all billboard ads
CREATE POLICY "Admins can view all billboard ads"
    ON public.billboard_ads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can insert billboard ads
CREATE POLICY "Admins can create billboard ads"
    ON public.billboard_ads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can update billboard ads
CREATE POLICY "Admins can update billboard ads"
    ON public.billboard_ads FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can delete billboard ads
CREATE POLICY "Admins can delete billboard ads"
    ON public.billboard_ads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create generic trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at timestamp
CREATE TRIGGER set_billboard_ads_updated_at
    BEFORE UPDATE ON public.billboard_ads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('billboard-ads', 'billboard-ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public can view billboard ads
CREATE POLICY "Public can view billboard ads"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'billboard-ads');

-- Storage Policy: Admins can upload billboard ads
CREATE POLICY "Admins can upload billboard ads"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'billboard-ads' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Storage Policy: Admins can update billboard ads
CREATE POLICY "Admins can update billboard ads"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'billboard-ads' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Storage Policy: Admins can delete billboard ads
CREATE POLICY "Admins can delete billboard ads"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'billboard-ads' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
