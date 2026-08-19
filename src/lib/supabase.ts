import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const ADMIN_EMAILS = [
  'cameronnel111@gmail.com',
  'abby@snappy.click',
] as const;

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabaseKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
  || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  || ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('https://') && supabaseKey,
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'cam-abby-wedding-auth',
      },
    })
  : null;

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase() as (typeof ADMIN_EMAILS)[number]);
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the public project URL and publishable key.');
  }
  return supabase;
}
