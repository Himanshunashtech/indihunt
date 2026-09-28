// ============================================================================
// 🚀 INDIHUNT — CENTRAL TYPE DEFINITIONS & INTERFACES
// ============================================================================

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  is_maker: boolean;
  location?: string;
  headline?: string;
  karma_points?: number;
  followers_count?: number;
  is_verified?: boolean;
  streak_count?: number;
  work_email?: string;
  created_at?: string;
  tech_stack?: string[];
  is_deactivated?: boolean;
  deactivated_at?: string;
  deleted_at?: string;
  role?: "user" | "admin" | "moderator" | string;
  indie_page_enabled?: boolean;
  indie_page_theme?: string;
  indie_page_font?: string;
  monthly_revenue?: string;
  onboarding_completed?: boolean;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  website_url: string;
  logo_url: string;
  screenshots: string[];
  maker_id: string;
  maker?: Profile;
  upvotes_count: number;
  comments_count: number;
  clicks_count?: number;
  created_at: string;
  has_upvoted?: boolean;
  ai_summary?: string;
  pricing_type?: string;
  promo_offer?: string;
  promo_code?: string;
  promo_expiry?: string;
  video_url?: string;
  demo_url?: string;
  status?: string;
  scheduled_for?: string;
  makers?: string[];
  worked_on_launch?: boolean;
  funding_type?: 'bootstrapped' | 'y_combinator' | 'venture_backed';
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  medium_url?: string;
  is_open_source?: boolean;
  github_url?: string;
  is_student_project?: boolean;
  school?: string;
  additional_urls?: string[];
  tags?: string[];
  category?: string;
  show_pre_launch?: boolean;
  country?: string;
  shoutout_names?: string[];
  shoutout_notes?: Record<string, string>;
  shoutout_logos?: Record<string, string>;
  featured?: boolean;
  is_promoted?: boolean;
  quality_score?: number;
  engagement_score?: number;
  editor_pick?: boolean;
  never_feature?: boolean;
  featured_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  scheduled_deletion_date?: string;
  deletion_reason?: string;
  deleted_by?: string;
  fake_upvotes_count?: number;
  real_upvotes_count?: number;
}

export interface FakeUpvoteRecord {
  id: string;
  product_id: string;
  fake_count: number;
  target_count: number;
  launch_date: string;
  growth_rate: number;
  last_incremented_at?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface FakeUpvoteSettings {
  enabled: boolean;
  min_target: number;
  max_target: number;
  start_hour: number;
  end_hour: number;
  interval_mins: number;
}

export interface Comment {
  id: string;
  product_id?: string;
  thread_id?: string;
  user_id: string;
  user?: Profile;
  parent_id?: string | null;
  body: string;
  created_at: string;
  upvotes_count?: number;
  has_upvoted?: boolean;
  replies?: Comment[];
}

export interface Thread {
  id: string;
  title: string;
  body: string;
  user_id: string;
  user?: Profile;
  category: string;
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  has_upvoted?: boolean;
  product_id?: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user?: Profile;
  rating: number;
  body: string;
  created_at: string;
  easy_to_use?: number;
  customizable?: number;
  reliable?: number;
  value_for_money?: number;
  pros?: string[];
  cons?: string[];
  helpful_votes?: number;
  views?: number;
  alternatives_vs?: string;
}

export interface AlternativeProduct {
  id: string;
  product_id: string;
  alternative_id: string;
  created_by: string;
  votes_count: number;
  created_at: string;
  alternative_product?: Product;
  has_voted?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  products?: Product[];
}

export interface UserStack {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  category: string;
  user_id: string;
  user?: Profile;
  excerpt?: string;
  published_at: string;
  created_at: string;
}

export interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  user?: Profile;
  parent_id?: string | null;
  body: string;
  created_at: string;
  replies?: StoryComment[];
}

export interface ProductInvestorDetails {
  product_id: string;
  why_team?: string;
  why_idea?: string;
  competitors?: string;
  revenue?: string;
  anything_else?: string;
}

export interface ProductShoutout {
  id: string;
  product_id: string;
  shouted_product_id: string;
  note: string;
  logo_url?: string;
  created_at: string;
  shouted_product?: Product;
}

export interface LaunchInsightsData {
  products: Product[];
  pointsTimeline: any[];
  commentsTimeline: any[];
  mostPoints: {
    product: Product;
    points: number;
    sparkline: number[];
  };
  mostComments: {
    product: Product;
    comments: number;
    sparkline: number[];
  };
  mostPopularTag: {
    name: string;
    count: number;
    products: Product[];
  };
  topComment: {
    comment: Comment;
    votes: number;
    user: Profile;
    product: Product;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
}

export interface AdCampaign {
  id: string;
  user_id: string;
  product_id?: string | null;
  name: string;
  headline: string;
  description: string;
  cta_text: string;
  destination_url: string;
  status: "draft" | "pending_payment" | "active" | "paused" | "paused_by_admin" | "completed" | "expired" | "archived";
  total_budget: number;
  daily_limit: number;
  cpm_rate: number;
  target_impressions: number;
  delivered_impressions: number;
  impressions: number;
  clicks: number;
  start_date: string;
  end_date?: string | null;
  created_at: string;
  placement_product_pages?: boolean;
  placement_feed?: boolean;
  placement_search?: boolean;
  placement_category?: boolean;
  placement_forums?: boolean;
  target_category?: string | null;
  target_country?: string | null;
  target_device?: "all" | "mobile" | "desktop";
  products?: { website_url: string; logo_url?: string } | null;
  logo_url?: string;
  image_url?: string;
  user?: { username?: string; full_name?: string } | null;
}

export interface AdEvent {
  id: string;
  campaign_id: string;
  event_type: 'impression' | 'click';
  session_id?: string;
  created_at: string;
}

export interface VectorSearchResult<T> {
  item: T;
  type: "product" | "thread" | "user";
  vectorScore: number;
  matchReason?: string;
}

export interface MultiEntitySearchResults {
  products: VectorSearchResult<Product>[];
  threads: VectorSearchResult<Thread>[];
  users: VectorSearchResult<Profile>[];
  all: VectorSearchResult<Product | Thread | Profile>[];
}

export interface ThreadReport {
  id: string;
  thread_id: string;
  user_id: string | null;
  reason: string;
  description: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'hunted' | 'thread_status' | 'following_activity' | 'comment' | 'upvote' | 'follow' | 'mention' | 'reply';
  actor_id?: string | null;
  actor_name?: string;
  actor_username?: string;
  actor_avatar?: string;
  secondary_avatar?: string;
  entity_type?: string | null;
  entity_id?: string | null;
  product_name?: string;
  product_logo?: string;
  thread_title?: string;
  category?: string;
  body_text?: string;
  reason_text?: string;
  action_label?: string;
  action_url?: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface UserNotificationSettings {
  user_id: string;
  product_updates_inapp: boolean;
  forum_threads_inapp: boolean;
  forum_status_inapp: boolean;
  comment_digest_inapp: boolean;
  maker_reports_inapp: boolean;
  product_feedback_inapp: boolean;
  personal_achievements_inapp: boolean;
  product_recognitions_inapp: boolean;
  discovery_notifications: boolean;
  new_followers_inapp: boolean;
  new_followers_push: boolean;
  friend_posts_inapp: boolean;
  friend_posts_push: boolean;
  mentions_inapp: boolean;
  mentions_push: boolean;
  unsubscribe_all: boolean;
  auto_follow_commenting: boolean;
  updated_at?: string;
}

export type PaymentGatewayType = "dodo" | "manual";

export interface PaymentRecord {
  id: string;
  user_id: string;
  campaign_id?: string | null;
  dodo_payment_id?: string | null;
  dodo_customer_id?: string | null;
  polar_checkout_id?: string | null;
  polar_order_id?: string | null;
  polar_customer_id?: string | null;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  payment_method: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Backward-compatible alias for existing components
export type PolarPayment = PaymentRecord;

export interface PaymentGatewayConfig {
  active_gateway: "dodo" | "manual";
  dodo_enabled: boolean;
  stripe_enabled?: boolean;
  razorpay_enabled?: boolean;
  updated_at: string;
}

export interface AdBudgetTransaction {
  id: string;
  campaign_id: string;
  user_id: string;
  payment_id?: string | null;
  amount: number;
  transaction_type: "topup" | "spend_deduction" | "refund" | "manual_override";
  balance_after: number;
  notes?: string | null;
  created_at: string;
}

export interface Hunter {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  bio?: string;
  hunts_count: number;
  upvotes_count: number;
  comments_count: number;
  first_places_count: number;
  avg_upvotes: number;
  avg_comments: number;
  is_verified?: boolean;
  created_at?: string;
}

export interface BillboardAd {
  id: string;
  title?: string;
  image_url: string;
  destination_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  views_count?: number;
  clicks_count?: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  count?: number;
}

export interface LeaderboardActivity {
  id: string;
  productName: string;
  rank: number;
  timeAgo: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string; // Full-time | Part-time | Internship | Contract
  experience: string;
  stipend_salary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobPostingInput {
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  stipend_salary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
  is_active?: boolean;
}

export type JobApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

export interface JobApplication {
  id: string;
  job_id?: string | null;
  role_title: string;
  full_name: string;
  email: string;
  phone_number: string;
  current_location: string;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  twitter_url?: string | null;
  current_ctc?: string | null;
  expected_ctc: string;
  experience_years: string;
  notice_period: string;
  cover_note: string;
  resume_url?: string | null;
  resume_filename?: string | null;
  status: JobApplicationStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationInput {
  job_id?: string | null;
  role_title: string;
  full_name: string;
  email: string;
  phone_number: string;
  current_location: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  twitter_url?: string;
  current_ctc?: string;
  expected_ctc: string;
  experience_years: string;
  notice_period: string;
  cover_note: string;
  resume_url?: string;
  resume_filename?: string;
}

export interface LaunchTag {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon?: string;
  is_popular: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LaunchTagInput {
  name: string;
  slug?: string;
  category?: string;
  icon?: string;
  is_popular?: boolean;
  is_active?: boolean;
}

export interface ProductRankDetails {
  rank: number | null;
  rankLabel: string;
  isTopHunt: boolean;
  cohortProducts: Product[];
  prevProd: Product | null;
  nextProd: Product | null;
}
