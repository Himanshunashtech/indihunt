import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Admin Supabase client using Service Role Key.
 * MUST ONLY be called in secure server-side routes, background workers, and webhooks.
 * NEVER expose to the browser!
 */
export function createAdminSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase Admin client missing configuration (URL or Service Role Key).');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
