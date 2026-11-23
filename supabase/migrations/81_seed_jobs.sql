-- Migration 81: Seed Initial Job Postings into public.jobs table

INSERT INTO public.jobs (
  id,
  title,
  department,
  location,
  type,
  experience,
  stipend_salary,
  description,
  responsibilities,
  requirements,
  perks,
  is_active,
  created_at,
  updated_at
)
VALUES
(
  'e1a10001-0000-0000-0000-000000000001',
  'Growth & Community Intern',
  'Growth & Marketing',
  'Remote (India)',
  'Internship',
  '0-1 years (College / Freshers)',
  '₹15,000 - ₹25,000 / month',
  'Drive community engagement, craft viral maker stories, orchestrate daily product launch spotlights, and expand IndiHunt''s creator loops across X (Twitter), LinkedIn, and tech campuses.',
  ARRAY[
    'Engage directly with indie founders, solo developers, and student builders to help them launch successfully.',
    'Create compelling content: product launch roundups, maker spotlights, Twitter/X threads, and newsletter summaries.',
    'Run growth experiments across X, LinkedIn, Discord communities, and college tech clubs.',
    'Facilitate discussions, AMAs, and moderate community posts on IndiHunt Threads and Stories.'
  ],
  ARRAY[
    'Deep curiosity and passion for startups, Product Hunt, SaaS products, AI tools, and indie hackers.',
    'Active on X (Twitter) or LinkedIn with strong written English storytelling and copywriting skills.',
    'Self-starter who thrives in an autonomous, high-speed remote startup environment.',
    'Bonus: Basic graphic design skills (Canva/Figma) or experience managing a tech community or newsletter.'
  ],
  ARRAY[
    'Mentorship directly from IndiHunt founders & top indie makers',
    'Official certificate + Letter of Recommendation',
    'Opportunity for full-time conversion based on performance',
    'Access to premium indie developer tooling & software credits'
  ],
  true,
  '2026-08-20T10:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000002',
  'Full-Stack Software Engineer (Next.js & Supabase)',
  'Engineering',
  'Remote (India)',
  'Full-time',
  '1-3 years',
  '₹8 LPA - ₹15 LPA',
  'Lead frontend and backend features for IndiHunt platform including real-time analytics, bidding engines, automated email digests, and maker collaboration tools.',
  ARRAY[
    'Architect and ship responsive, high-performance UI using Next.js 15 (App Router), React, and TailwindCSS.',
    'Develop secure Supabase PostgreSQL schemas, RPC functions, RLS policies, and background database cron triggers.',
    'Build real-time notification pipelines, WebSocket connections, and batch email dispatch engines.',
    'Collaborate closely with product design to optimize Core Web Vitals and SEO performance.'
  ],
  ARRAY[
    'Strong proficiency with TypeScript, Next.js (App Router), React, and modern CSS/Tailwind.',
    'Solid understanding of PostgreSQL, Supabase, database migrations, and Row Level Security (RLS).',
    'Experience integrating third-party APIs (Resend, Polar/Stripe, Cloudflare, Webhooks).',
    'Proven track record of shipping fast, clean, and well-tested code.'
  ],
  ARRAY[
    '100% remote flexibility with home office setup allowance',
    'Equity / ESOPs in IndiHunt',
    'Generous hardware and learning budget',
    'Unlimited paid time off (PTO)'
  ],
  true,
  '2026-08-22T10:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000003',
  'Developer Relations (DevRel) Lead',
  'Community & DevRel',
  'Bengaluru / Remote',
  'Full-time',
  '2-4 years',
  '₹10 LPA - ₹18 LPA',
  'Be the face and voice of IndiHunt for Indian developers. Host virtual demo days, write technical breakdowns of trending products, and build deep developer relationships.',
  ARRAY[
    'Organize virtual and in-person hackathons, maker demo nights, and launch workshops across India.',
    'Author in-depth technical blogs, open-source boilerplate projects, and case studies featuring maker architectures.',
    'Represent IndiHunt at major Indian developer conferences, college tech fests, and community meetups.',
    'Gather developer feedback to advocate for platform features that make launching effortless.'
  ],
  ARRAY[
    'Background in software development with great public speaking and technical writing ability.',
    'Active presence in developer communities (GitHub, X/Twitter, Discord, LinkedIn).',
    'Passionate about developer tooling, open source, and the Indian indie startup ecosystem.',
    'Experience creating technical video tutorials or live streams is a strong plus.'
  ],
  ARRAY[
    'Conference travel budget and community sponsorship allowance',
    'Competitive compensation + equity',
    'Direct collaboration with India''s leading startup founders & VCs',
    'Flexible hybrid/remote work setup'
  ],
  true,
  '2026-08-23T10:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000004',
  'Senior Product Designer (UI/UX & Design Systems)',
  'Design',
  'Remote (India)',
  'Full-time',
  '2-5 years',
  '₹9 LPA - ₹16 LPA',
  'Design world-class, pixel-perfect user interfaces, interactive micro-animations, and modern web experiences for IndiHunt''s consumer feeds, maker studio, and analytics dashboards.',
  ARRAY[
    'Own the end-to-end design lifecycle from user research, wireframes, and prototypes to production UI specs in Figma.',
    'Maintain and evolve IndiHunt''s comprehensive design system (dark/light themes, typography, accessible components).',
    'Design high-converting landing pages, promotional billboard graphics, and interactive badges.',
    'Conduct user testing with makers and hunters to refine usability and delight.'
  ],
  ARRAY[
    'Strong portfolio showcasing modern, clean, web application UI design (Figma mastery).',
    'Deep understanding of design systems, typography hierarchy, responsive design, and CSS capabilities.',
    'Appreciation for micro-interactions, subtle glassmorphic elements, and premium aesthetics.',
    'Ability to write clean CSS/Tailwind or communicate seamlessly with frontend engineers.'
  ],
  ARRAY[
    'Top-tier design tooling subscription (Figma, Spline, Midjourney, Adobe CC)',
    'Remote work culture with flexible hours',
    'Competitive salary + equity package',
    'Health insurance & wellness stipend'
  ],
  true,
  '2026-08-24T10:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000005',
  'AI Product Engineer (LLMs & Agents)',
  'Engineering',
  'Remote (India)',
  'Full-time',
  '1-4 years',
  '₹12 LPA - ₹22 LPA',
  'Build cutting-edge AI features for IndiHunt: automated launch pitch generation, automated product tagging, semantic AI search, smart product quality scoring, and community moderation bots.',
  ARRAY[
    'Develop and deploy LLM pipelines using OpenAI, Claude, DeepSeek, and Gemini APIs.',
    'Implement vector search, embeddings (pgvector), and semantic discovery engines for 10,000+ indie products.',
    'Fine-tune prompt chains and autonomous agents for maker analytics, content violation detection, and summarization.',
    'Benchmark latency, costs, and token efficiency across AI inference endpoints.'
  ],
  ARRAY[
    'Hands-on experience building production applications with LLM APIs, LangChain/LlamaIndex, and Vector DBs.',
    'Strong Python and TypeScript/Node.js programming skills.',
    'Familiarity with embeddings, prompt engineering, RAG architecture, and agent workflows.',
    'Eagerness to experiment with newest open-source models (Ollama, vLLM, HuggingFace).'
  ],
  ARRAY[
    'Unlimited AI compute & API credits for experiments',
    'Work on high-visibility AI features used by 50,000+ users',
    'High equity grant + competitive base salary',
    'Remote-first global team setup'
  ],
  true,
  '2026-08-25T10:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000006',
  'Content & SEO Growth Strategist',
  'Growth & Marketing',
  'Remote (India)',
  'Full-time',
  '1-3 years',
  '₹6 LPA - ₹11 LPA',
  'Own organic search acquisition and technical SEO to rank IndiHunt at #1 on Google for software product discovery, startup alternatives, and indie maker queries.',
  ARRAY[
    'Conduct programmatic SEO research to create automated directory pages, alternative comparison hubs, and keyword clusters.',
    'Write high-ranking editorial articles, founder interviews, and weekly industry roundups for IndiHunt Stories.',
    'Audit on-page SEO, schema markups, sitemaps, and Core Web Vitals alongside engineering.',
    'Build high-authority backlink partnerships with tech publications and university incubators.'
  ],
  ARRAY[
    'Demonstrated track record of scaling organic Google search traffic for SaaS or marketplace platforms.',
    'Familiarity with Ahrefs, SEMrush, Google Search Console, Screaming Frog, and Schema.org.',
    'Exceptional English writing and editorial storytelling ability.',
    'Basic knowledge of Next.js SEO tags, OpenGraph, and programmatic pages.'
  ],
  ARRAY[
    'Performance-based bonuses on organic traffic milestones',
    'Remote work autonomy',
    'Access to premium SEO & marketing tool stack',
    'Flexible schedule'
  ],
  true,
  '2026-08-26T10:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000007',
  'Frontend Engineer (React & Micro-Animations)',
  'Engineering',
  'Remote (India)',
  'Full-time',
  '1-3 years',
  '₹7 LPA - ₹13 LPA',
  'Craft high-performance, butter-smooth interactive interfaces with delightful micro-animations, accessible dialogs, and instant optimistic updates across IndiHunt feeds and profiles.',
  ARRAY[
    'Build reusable, accessible React components with TailwindCSS, Lucide icons, and Radix UI primitives.',
    'Implement client-side state caching with TanStack React Query and Redux Toolkit.',
    'Optimize rendering performance, bundle sizes, and mobile viewport responsiveness across all devices.',
    'Collaborate with backend engineers to integrate RESTful API endpoints and WebSocket channels.'
  ],
  ARRAY[
    'Solid expertise in React, TypeScript, Next.js, and modern CSS/Tailwind.',
    'Strong aesthetic sensibility and attention to detail for spacing, typography, and hover transitions.',
    'Experience with optimistic UI updates, local storage hydration, and responsive layout debugging.',
    'Passion for building web applications that load in milliseconds.'
  ],
  ARRAY[
    '100% remote flexibility with home office setup allowance',
    'Competitive salary and equity options',
    'Continuous learning budget',
    'Friendly, supportive engineering culture'
  ],
  true,
  '2026-08-27T10:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000008',
  'Backend & Database Engineer (Postgres & Systems)',
  'Engineering',
  'Remote (India)',
  'Full-time',
  '2-4 years',
  '₹10 LPA - ₹18 LPA',
  'Build robust backend microservices, real-time voting fraud detection algorithms, database replication strategies, and reliable background queuing systems at scale.',
  ARRAY[
    'Design and maintain PostgreSQL schemas, complex SQL queries, views, stored procedures, and triggers.',
    'Build automated anti-spam moderation triggers and upvote manipulation detection systems.',
    'Scale API endpoints to handle viral launch traffic spikes with Redis caching and rate-limiting.',
    'Ensure database backup reliability, security hardening, and audit logging compliance.'
  ],
  ARRAY[
    'Deep experience with PostgreSQL, SQL optimization, database indexing, and RLS security.',
    'Proficiency in Node.js, TypeScript, Next.js API Routes, and serverless architectures.',
    'Understanding of caching patterns (Redis/Upstash), queuing, and asynchronous workers.',
    'Strong debugging and systems performance tuning skills.'
  ],
  ARRAY[
    'Competitive compensation + equity ownership',
    'Flexible remote working setup',
    'Comprehensive medical insurance',
    'Annual team offsites'
  ],
  true,
  '2026-08-27T14:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000009',
  'Social Media & Community Manager',
  'Growth & Marketing',
  'Remote (India)',
  'Full-time',
  '1-3 years',
  '₹5 LPA - ₹9 LPA',
  'Lead IndiHunt''s viral social channels on X (Twitter), LinkedIn, and Instagram. Broadcast daily launch battles, engage with startup influencers, and host weekly maker spaces.',
  ARRAY[
    'Manage daily content calendar: launch announcements, winner reveals, maker memes, and product tear-downs.',
    'Engage in real-time with Indian indie makers, tech Twitter personalities, and early adopter communities.',
    'Organize weekly live audio spaces, Twitter AMAs, and launch day live commentary.',
    'Analyze post impressions, engagement rates, and follower growth to double down on winning formats.'
  ],
  ARRAY[
    'Deep understanding of Tech Twitter / X culture, LinkedIn organic algorithms, and startup discourse.',
    'Superb meme literacy, wit, and conversational copywriting skills.',
    'Proven track record of growing tech or creator brand social accounts organically.',
    'Ability to create quick visuals and short videos (Canva, CapCut, Figma).'
  ],
  ARRAY[
    'Direct visibility with tech influencers and founders',
    'Flexible work-from-anywhere model',
    'Performance incentives based on audience growth',
    'Full creative freedom to experiment with viral content'
  ],
  true,
  '2026-08-28T10:00:00Z',
  NOW()
),
(
  'e1a10001-0000-0000-0000-000000000010',
  'Launch Operations & Ecosystem Coordinator',
  'Operations',
  'Remote / Hybrid (Bengaluru)',
  'Full-time',
  '1-2 years',
  '₹5 LPA - ₹8.5 LPA',
  'Coordinate daily launch pipelines, verify product credentials, guide new makers through the launch wizard, and manage campus ambassador chapters across Indian universities.',
  ARRAY[
    'Review daily scheduled product launches, verify demo URLs, and assist makers with profile setups.',
    'Coordinate with campus ambassadors to organize college product demo days and student hackathon sponsorships.',
    'Handle incoming maker support queries and feature requests with empathy and fast turnaround.',
    'Manage badge disbursements, polar bidding verifications, and newsletter ad placement schedules.'
  ],
  ARRAY[
    'Organized, empathetic communicator with strong written and verbal English skills.',
    'Enthusiastic about startups, student builders, and helping people succeed.',
    'Ability to multitask and keep operational pipelines running smoothly under tight daily deadlines.',
    'Prior experience in customer operations, community management, or startup incubators is a plus.'
  ],
  ARRAY[
    'Hands-on exposure to hundreds of new tech products every week',
    'Mentorship from founding team members',
    'Flexible remote/hybrid working arrangement',
    'Rapid career progression in startup operations'
  ],
  true,
  '2026-08-28T15:00:00Z',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  location = EXCLUDED.location,
  type = EXCLUDED.type,
  experience = EXCLUDED.experience,
  stipend_salary = EXCLUDED.stipend_salary,
  description = EXCLUDED.description,
  responsibilities = EXCLUDED.responsibilities,
  requirements = EXCLUDED.requirements,
  perks = EXCLUDED.perks,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
