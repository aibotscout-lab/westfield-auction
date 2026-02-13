import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Create client only if configured, otherwise create a dummy placeholder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: SupabaseClient<any, 'public', any>;

if (isSupabaseConfigured()) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
} else {
  // Create a placeholder that will be overridden on client-side if needed
  // This prevents build errors when env vars aren't set
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };
