import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  REACT_APP_SUPABASE_URL,
  REACT_APP_SUPABASE_ANON_KEY,
} from '@env';

// Support both SUPABASE_* and REACT_APP_SUPABASE_* (some setups only inject REACT_APP_ vars)
const url = (SUPABASE_URL || REACT_APP_SUPABASE_URL || '').trim();
const anonKey = (SUPABASE_ANON_KEY || REACT_APP_SUPABASE_ANON_KEY || '').trim();

if (!url || !anonKey) {
  const msg =
    'Missing Supabase credentials. Add to .env in project root:\n' +
    'SUPABASE_URL=https://your-project.supabase.co\n' +
    'SUPABASE_ANON_KEY=your-anon-key\n' +
    'Then restart Metro with: npx react-native start --reset-cache';
  throw new Error(msg);
}

export const supabase = createClient(url, anonKey);
