-- Migration: 64_create_newsletter_subscriptions_table.sql
-- Description: Create newsletter_subscriptions table and RLS policies for newsletter subscribers

CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Allow public / anon select for daily digest broadcast
CREATE POLICY "Public read for newsletter subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (true);
