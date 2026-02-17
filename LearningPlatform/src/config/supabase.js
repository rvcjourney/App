import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://wgyoarzdzlkadefydfvk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  // Fail fast so the web admin doesn't silently break.
  // Set this in LearningPlatform/.env as VITE_SUPABASE_ANON_KEY=...
  throw new Error('Missing VITE_SUPABASE_ANON_KEY. Add it to LearningPlatform/.env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
