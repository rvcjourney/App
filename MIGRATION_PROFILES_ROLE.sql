-- ==========================================
-- ADD role (and full_name if missing) TO profiles
-- Run this if sign-in fails with 400 on GET /rest/v1/profiles
-- ==========================================
--
-- HOW TO RUN:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. Paste this script and click Run
-- ==========================================

-- Ensure profiles has role for super_admin check
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT;

-- Optional: ensure full_name exists (default trigger often adds it)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Set existing rows without role to a default if needed (e.g. super_admin for first user)
-- UPDATE profiles SET role = 'super_admin' WHERE id = 'YOUR-USER-UUID' AND (role IS NULL OR role = '');
