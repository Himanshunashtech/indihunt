-- Migration 69: Categories & Tags management
-- Needed for: Categories & Tags admin module

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  seo_title TEXT,
  seo_description TEXT,
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Everyone can read product_categories"
  ON product_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage product_categories"
  ON product_categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Seed some default categories
INSERT INTO categories (name, slug, icon, description, sort_order) VALUES
  ('Artificial Intelligence', 'artificial-intelligence', '🤖', 'Generative AI systems, conversational search interfaces, LLMs, and chatbot models.', 1),
  ('AI Notetakers', 'ai-notetakers', '🤖', 'AI notetakers capture meetings, calls, and voice memos, then transcribe, summarize, and extract tasks across tools.', 2),
  ('AI Presentation Software', 'presentation-software', '🤖', 'Apps that use generative AI to create slide decks, pitch decks, and polished presentations faster.', 3),
  ('AI Workflow Automation', 'workflow-automation', '🤖', 'AI automation tools help design and run workflows that actually take action and reduce operational load.', 4),
  ('AI Agents & Automation', 'ai-agents-automation', '🤖', 'Intelligent autonomous agents, workflow triggers, and custom automation scripts.', 5),
  ('Analytics & Data', 'analytics-data', '🤖', 'Data visualization dashboards, pipelines, predictive modeling, and business intelligence.', 6),
  ('Productivity', 'productivity', '⚡', 'Centralized workspaces, team document planners, calendars, task managers, and note organization tools.', 7),
  ('SaaS', 'saas', '⚡', 'Software-as-a-service platforms, multi-tenant web tools, and cloud solutions.', 8),
  ('Ad blockers', 'ad-blockers', '⚡', 'Ad blockers remove ads, trackers, and nags for cleaner, faster browsing across browser tools and DNS filters.', 9),
  ('App switcher', 'app-switcher', '⚡', 'App switchers centralize launching, switching, and actions across apps with hotkeys and sidebars.', 10),
  ('Content Management Systems', 'cms', '⚡', 'Tools that create, organize, and publish website content from headless APIs to no-code site builders.', 11),
  ('Calendar apps', 'calendar-apps', '⚡', 'Calendar apps help you plan time, track events, and auto-schedule with team chat integrations.', 12),
  ('Compliance software', 'compliance-software', '⚡', 'Compliance software secures access, verifies identities, manages user data, and enforces infosec rules.', 13),
  ('Customer support tools', 'customer-support-crm', '⚡', 'Streamline customer support operations with ticket management, live chat, knowledge base, and CRM.', 14),
  ('E-signature apps', 'e-signature-apps', '⚡', 'E-signature apps enable secure electronic autographs on documents for sales, legal, HR, and finance.', 15),
  ('Email clients', 'email-clients', '⚡', 'Manage sending, receiving, and organizing messages with inbox apps, deliverability, and AI sorting.', 16),
  ('File storage and sharing apps', 'file-storage', '⚡', 'Store, sync, and share files so teams edit and manage content securely with cloud storage and privacy.', 17),
  ('Hiring software', 'hiring-software', '⚡', 'Source, vet, and manage candidates, run interviews, and handle onboarding to payroll for global teams.', 18),
  ('Knowledge base software', 'knowledge-base', '⚡', 'Knowledge base software stores and surfaces answers from docs, notes, and apps to centralize know-how.', 19),
  ('Meeting software', 'meeting-software', '⚡', 'Tools to make meetings easier, plan schedules, summarize calls, or make discussions more efficient.', 20),
  ('Note and writing apps', 'note-writing-apps', '⚡', 'Capture ideas, docs, and meetings in one place with voice-to-text, mind maps, and linked notes.', 21),
  ('PDF Editor', 'pdf-editor', '⚡', 'Modify, edit, and manipulate PDF files—edit text, add images, rearrange pages, and merge documents.', 22),
  ('Password managers', 'password-managers', '⚡', 'Securely store and autofill logins, 2FA, and secrets to protect accounts and stay compliant.', 23),
  ('Project management software', 'project-management', '⚡', 'Plan, organize, and track projects efficiently with centralized tasks, timelines, and communication.', 24),
  ('Scheduling software', 'scheduling-software', '⚡', 'Organize appointments and time slots, sync calendars, and auto-create events from messages.', 25),
  ('Team collaboration software', 'team-collaboration', '⚡', 'Centralized digital workspace for team members to communicate, collaborate, and work together.', 26),
  ('Time tracking apps', 'time-tracking', '⚡', 'Log work hours, focus, and tool use to reveal where time goes for freelancers, teams, and HR.', 27),
  ('Developer Tools', 'developer-tools', '🛠️', 'Compilers, CLI engines, debug tools, and code optimization helpers for program creation.', 28),
  ('AI Code Editors', 'ai-code-editors', '🛠️', 'AI coding tools and agentic IDEs that speed up software creation and edit multi-file projects.', 29),
  ('AI Code Testing', 'ai-code-testing', '🛠️', 'Automatically review, analyze, and validate code for errors or vulnerabilities early in dev.', 30),
  ('AI Coding Agents', 'ai-coding-agents', '🛠️', 'AI coding agents suggest code, refactor, debug, and integrate with editors, repos, and APIs.', 31),
  ('AI Databases', 'ai-databases', '🛠️', 'Vector and analytics databases for fast search, chat, embeddings, and real-time GenAI queries.', 32),
  ('APIs & Integrations', 'apis-integrations', '🛠️', 'Third-party APIs, webhooks, cloud connectors, and secure data sync libraries.', 33),
  ('Open Source', 'open-source', '🛠️', 'FOSS packages, libraries, modular components, and community repositories.', 34),
  ('Cybersecurity', 'cybersecurity', '🛠️', 'Identity managers, secure firewall frameworks, and network security utilities.', 35),
  ('No-Code & Low-Code', 'no-code-low-code', '🛠️', 'Visual builders, database creators, and systems that let you build without programming.', 36),
  ('Vibe Coding Tools', 'vibe-coding', '🛠️', 'AI-first editors, app builders, proxies, and Python/web stacks to speed building and deploying.', 37),
  ('Design Tools', 'design-tools', '🎨', 'Vector graphics editors, interactive canvas designers, and UI/UX mockup software.', 38),
  ('3D & Animation', '3d-animation', '🎨', 'Create and animate 3D scenes, motion graphics, models, and interactive visuals for apps and web.', 39),
  ('AI Generative Media', 'ai-generative-media', '🎨', 'Create images and videos from prompts, edit photos with smart effects, and power creative workflows.', 40),
  ('AR/VR', 'ar-vr', '🎨', 'Virtual and augmented reality frameworks, 3D modeling interfaces, and virtual spaces.', 41),
  ('Media & Entertainment', 'media-entertainment', '🎨', 'Video renderers, streaming servers, voice modulators, and media players.', 42),
  ('Finance & FinTech', 'finance-fintech', '💰', 'Budget trackers, payment gateways, accounting plugins, and banking tools.', 43),
  ('Accounting software', 'accounting', '💰', 'Centralize financial record-keeping, invoicing, receipts, taxes, and monetary tracking.', 44),
  ('Budgeting apps', 'budgeting', '💰', 'Categorize spending, forecast cash flow, and track expenses, plans, and subscriptions.', 45),
  ('Invoicing tools', 'invoicing', '💰', 'Generate professional invoices, track payments, and manage billing processes efficiently.', 46),
  ('Legal services', 'legal-services', '💰', 'Draft, review, and manage contracts, patents, compliance, IP, and legal tasks.', 47),
  ('Marketing Tools', 'marketing-tools', '📢', 'SEO optimization dashboards, social media schedulers, email campaigns, and brand hubs.', 48),
  ('AI sales tools', 'ai-sales-tools', '📢', 'AI sales and outreach tools that find, research, and qualify leads and automate follow-ups.', 49),
  ('CRM software', 'crm-software', '📢', 'Centralize contacts, conversations, deal data, email sync, and sales outreach workflows.', 50),
  ('E-Commerce & Retail', 'e-commerce-retail', '📢', 'Online storefronts, shopping carts, dropshipping hubs, and inventory systems.', 51),
  ('Mobile Apps', 'mobile-apps', '🌐', 'Native iOS and Android utilities, cross-platform apps, and mobile widgets.', 52),
  ('Web3 & Crypto', 'web3-crypto', '🌐', 'DeFi trackers, wallet utilities, smart contract tools, and token solutions.', 53),
  ('Social & Community', 'social-community', '🌐', 'Forum boards, group messaging platforms, interactive feed pages, and community networks.', 54),
  ('Health & Fitness', 'health-fitness', '💪', 'Diet planners, workout schedules, biometric metrics track logs, and wellness guides.', 55),
  ('Education & EdTech', 'education-edtech', '💪', 'LMS environments, school study aids, lecture tools, and remote classrooms.', 56)
ON CONFLICT (slug) DO NOTHING;

