import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wgyoarzdzlkadefydfvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW9hcnpkemxrYWRlZnlkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzM5MDAsImV4cCI6MjA4NDQwOTkwMH0.q-m3bC7kkC7gLmeHFPOX4hI3n61f9jgxV38fEpmeCzk';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
