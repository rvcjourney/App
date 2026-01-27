-- ==========================================
-- ADD EMAIL VERIFICATION COLUMNS TO PROFILES
-- ==========================================
-- 
-- Run this in Supabase SQL Editor to add email verification tracking
--

-- Add email_verified and verified_at columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster email_verified queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- ==========================================
-- HOW TO RUN THIS
-- ==========================================
--
-- 1. Go to https://app.supabase.com
-- 2. Select your project: wgyoarzdzlkadefydfvk
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this entire file
-- 6. Click "Run" or press Ctrl+Enter
-- 7. Should see success message
--
-- ==========================================
-- VERIFY IT WORKED
-- ==========================================
--
-- Run this query to see the updated profiles table structure:
--
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;
--
-- You should see:
-- - email_verified (boolean, default: false)
-- - verified_at (timestamp with time zone, nullable)
--
