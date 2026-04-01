import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Please set these in your Vercel Environment Variables.');
}

// Browser-safe singleton — uses anon key only.
// Never import SUPABASE_SERVICE_ROLE_KEY here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
