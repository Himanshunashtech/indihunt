-- Migration 82: Create launch_tags table with Admin RLS and Comprehensive Category Seeds

CREATE TABLE IF NOT EXISTS public.launch_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General',
  icon TEXT DEFAULT '🏷️',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_launch_tags_active ON public.launch_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_launch_tags_popular ON public.launch_tags(is_popular);
CREATE INDEX IF NOT EXISTS idx_launch_tags_slug ON public.launch_tags(slug);

-- Enable RLS
ALTER TABLE public.launch_tags ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can view active launch tags" ON public.launch_tags;
CREATE POLICY "Public can view active launch tags"
  ON public.launch_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage launch tags" ON public.launch_tags;
CREATE POLICY "Admins can manage launch tags"
  ON public.launch_tags FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Seed comprehensive launch tags categorized by IndiHunt directories
INSERT INTO public.launch_tags (name, slug, category, icon, is_popular, is_active)
VALUES
  -- 1. AI & Machine Learning
  ('AI Agents', 'ai-agents', 'AI & Machine Learning', '🤖', true, true),
  ('AI Coding Agents', 'ai-coding-agents', 'AI & Machine Learning', '⚡', true, true),
  ('LLM', 'llm', 'AI & Machine Learning', '🧠', true, true),
  ('Chat Model', 'chat-model', 'AI & Machine Learning', '💬', true, true),
  ('AI', 'ai', 'AI & Machine Learning', '✨', true, true),
  ('Generative AI', 'generative-ai', 'AI & Machine Learning', '🪄', true, true),
  ('AI Notetakers', 'ai-notetakers', 'AI & Machine Learning', '🎙️', false, true),
  ('AI Presentation Software', 'presentation-software', 'AI & Machine Learning', '📊', false, true),
  ('AI Workflow Automation', 'workflow-automation', 'AI & Machine Learning', '⚙️', false, true),
  ('AI Sales Tools', 'ai-sales-tools', 'AI & Machine Learning', '🎯', false, true),
  ('AI Code Editors', 'ai-code-editors', 'AI & Machine Learning', '💻', false, true),
  ('AI Code Testing', 'ai-code-testing', 'AI & Machine Learning', '🧪', false, true),
  ('AI Databases', 'ai-databases', 'AI & Machine Learning', '🗄️', false, true),
  ('Predictive AI', 'predictive-ai', 'AI & Machine Learning', '📈', false, true),
  ('Voice AI', 'voice-ai', 'AI & Machine Learning', '🗣️', false, true),
  ('Computer Vision', 'computer-vision', 'AI & Machine Learning', '👁️', false, true),
  ('Prompt Engineering', 'prompt-engineering', 'AI & Machine Learning', '📝', false, true),

  -- 2. Engineering, DevOps & Cloud
  ('Deployment', 'deployment', 'Engineering & DevOps', '🚀', true, true),
  ('Hosting', 'hosting', 'Engineering & DevOps', '🌐', true, true),
  ('Developer Tools', 'developer-tools', 'Engineering & DevOps', '🛠️', true, true),
  ('Open Source', 'open-source', 'Engineering & DevOps', '📖', true, true),
  ('Security', 'security', 'Engineering & DevOps', '🛡️', true, true),
  ('Cybersecurity', 'cybersecurity', 'Engineering & DevOps', '🔒', false, true),
  ('APIs & Integrations', 'apis-integrations', 'Engineering & DevOps', '🔌', false, true),
  ('Cloud Computing', 'cloud-computing', 'Engineering & DevOps', '☁️', false, true),
  ('DevOps', 'devops', 'Engineering & DevOps', '♾️', false, true),
  ('Databases', 'databases', 'Engineering & DevOps', '🗄️', false, true),
  ('Vibe Coding', 'vibe-coding', 'Engineering & DevOps', '⚡', false, true),
  ('Next.js', 'nextjs', 'Engineering & DevOps', '▲', false, true),
  ('React', 'react', 'Engineering & DevOps', '⚛️', false, true),
  ('TypeScript', 'typescript', 'Engineering & DevOps', '📘', false, true),
  ('Python', 'python', 'Engineering & DevOps', '🐍', false, true),
  ('Node.js', 'nodejs', 'Engineering & DevOps', '🟢', false, true),
  ('Docker & Containers', 'docker-containers', 'Engineering & DevOps', '🐳', false, true),
  ('Serverless', 'serverless', 'Engineering & DevOps', '⚡', false, true),
  ('Testing & QA', 'testing-qa', 'Engineering & DevOps', '🧪', false, true),
  ('Command Line', 'command-line', 'Engineering & DevOps', '📟', false, true),
  ('Git & GitHub', 'git-github', 'Engineering & DevOps', '🐙', false, true),

  -- 3. Productivity & Workspace
  ('Productivity', 'productivity', 'Productivity & Core Software', '⚡', true, true),
  ('SaaS', 'saas', 'Productivity & Core Software', '💼', true, true),
  ('Task Management', 'task-management', 'Productivity & Core Software', '📋', false, true),
  ('Calendar Apps', 'calendar-apps', 'Productivity & Core Software', '📅', false, true),
  ('Note & Writing Apps', 'note-writing-apps', 'Productivity & Core Software', '✍️', false, true),
  ('Project Management', 'project-management', 'Productivity & Core Software', '📊', false, true),
  ('Team Collaboration', 'team-collaboration', 'Productivity & Core Software', '🤝', false, true),
  ('Time Tracking', 'time-tracking', 'Productivity & Core Software', '⏱️', false, true),
  ('Knowledge Base', 'knowledge-base', 'Productivity & Core Software', '📚', false, true),
  ('Meeting Software', 'meeting-software', 'Productivity & Core Software', '📹', false, true),
  ('Video Conferencing', 'video-conferencing', 'Productivity & Core Software', '🎥', true, true),
  ('Video and Voice Calling', 'video-voice-calling', 'Productivity & Core Software', '📞', false, true),
  ('E-Signature', 'e-signature-apps', 'Productivity & Core Software', '✒️', false, true),
  ('PDF Editor', 'pdf-editor', 'Productivity & Core Software', '📄', false, true),
  ('Password Managers', 'password-managers', 'Productivity & Core Software', '🔑', false, true),
  ('Email Clients', 'email-clients', 'Productivity & Core Software', '✉️', false, true),
  ('Ad Blockers', 'ad-blockers', 'Productivity & Core Software', '🛑', false, true),
  ('CMS & Headless', 'cms', 'Productivity & Core Software', '📰', false, true),
  ('No-Code & Low-Code', 'no-code-low-code', 'Productivity & Core Software', '🧩', false, true),

  -- 4. Design & Creative
  ('Design', 'design', 'Design & Creative', '🎨', true, true),
  ('Design Tools', 'design-tools', 'Design & Creative', '📐', false, true),
  ('UI/UX', 'ui-ux', 'Design & Creative', '✨', false, true),
  ('3D & Animation', '3d-animation', 'Design & Creative', '🧊', false, true),
  ('AI Generative Media', 'ai-generative-media', 'Design & Creative', '🖼️', false, true),
  ('AR/VR', 'ar-vr', 'Design & Creative', '🥽', false, true),
  ('Figma Plugins', 'figma-plugins', 'Design & Creative', '🟣', false, true),
  ('Icons & Illustration', 'icons-illustration', 'Design & Creative', '✏️', false, true),
  ('Graphic Design', 'graphic-design', 'Design & Creative', '🖌️', false, true),
  ('Video Editing', 'video-editing', 'Design & Creative', '🎬', false, true),
  ('Audio & Music', 'audio-music', 'Design & Creative', '🎵', false, true),

  -- 5. Finance & FinTech
  ('Fintech', 'fintech', 'Finance & Operations', '💳', true, true),
  ('Finance', 'finance', 'Finance & Operations', '💰', false, true),
  ('Payments', 'payments', 'Finance & Operations', '💸', false, true),
  ('Accounting', 'accounting', 'Finance & Operations', '🧾', false, true),
  ('Budgeting', 'budgeting', 'Finance & Operations', '🪙', false, true),
  ('Invoicing', 'invoicing', 'Finance & Operations', '📑', false, true),
  ('Legal Services', 'legal-services', 'Finance & Operations', '⚖️', false, true),
  ('Compliance', 'compliance-software', 'Finance & Operations', '📋', false, true),
  ('Hiring & HR', 'hiring-software', 'Finance & Operations', '👥', false, true),

  -- 6. Marketing, Growth & Sales
  ('Marketing', 'marketing', 'Marketing & Sales', '📢', true, true),
  ('Analytics', 'analytics', 'Marketing & Sales', '📊', true, true),
  ('SEO', 'seo', 'Marketing & Sales', '🔍', false, true),
  ('Social Media', 'social-media', 'Marketing & Sales', '📱', false, true),
  ('Email Marketing', 'email-marketing', 'Marketing & Sales', '📧', false, true),
  ('CRM Software', 'crm-software', 'Marketing & Sales', '📇', false, true),
  ('Growth Hacking', 'growth-hacking', 'Marketing & Sales', '📈', false, true),
  ('Content Creation', 'content-creation', 'Marketing & Sales', '✍️', false, true),
  ('Customer Support', 'customer-support-crm', 'Marketing & Sales', '🎧', false, true),
  ('E-Commerce & Retail', 'e-commerce-retail', 'Marketing & Sales', '🛍️', false, true),

  -- 7. Web3, Mobile & Social
  ('Web3 & Crypto', 'web3-crypto', 'Web3, Mobile & Social', '🪙', false, true),
  ('Mobile Apps', 'mobile-apps', 'Web3, Mobile & Social', '📱', false, true),
  ('iOS Apps', 'ios-apps', 'Web3, Mobile & Social', '🍎', false, true),
  ('Android Apps', 'android-apps', 'Web3, Mobile & Social', '🤖', false, true),
  ('Browser Extensions', 'browser-extensions', 'Web3, Mobile & Social', '🧩', false, true),
  ('Social & Community', 'social-community', 'Web3, Mobile & Social', '💬', false, true),
  ('Forums & Communities', 'forums-communities', 'Web3, Mobile & Social', '🌐', false, true),

  -- 8. Health, Life & Education
  ('Health & Fitness', 'health-fitness', 'Health, Life & Education', '💪', false, true),
  ('Education & EdTech', 'education-edtech', 'Health, Life & Education', '🎓', false, true),
  ('Online Learning', 'online-learning', 'Health, Life & Education', '📖', false, true),
  ('Career & Jobs', 'career-jobs', 'Health, Life & Education', '💼', false, true)
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  is_popular = EXCLUDED.is_popular,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
