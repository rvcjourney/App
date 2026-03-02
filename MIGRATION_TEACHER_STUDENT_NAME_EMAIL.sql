-- ==========================================
-- ADD full_name AND email TO teacher_profiles AND student_profiles
-- ==========================================
--
-- HOW TO RUN:
-- 1. Go to https://supabase.com/dashboard and open your project.
-- 2. In the left sidebar, click "SQL Editor".
-- 3. Click "New query".
-- 4. Copy this entire file (all lines) and paste into the editor.
-- 5. Click "Run" (or press Ctrl+Enter / Cmd+Enter).
-- 6. Wait for "Success. No rows returned" or similar.
--
-- ==========================================

-- Teacher profiles
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS role TEXT;

-- Student profiles
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS role TEXT;

-- Backfill full_name and role from profiles (run once)
UPDATE teacher_profiles tp SET full_name = p.full_name, role = COALESCE(tp.role, p.role)
FROM profiles p WHERE tp.id = p.id AND (tp.full_name IS NULL OR tp.full_name = '');

UPDATE student_profiles sp SET full_name = p.full_name, role = COALESCE(sp.role, p.role)
FROM profiles p WHERE sp.id = p.id AND (sp.full_name IS NULL OR sp.full_name = '');

-- Backfill email from auth.users (run once)
UPDATE teacher_profiles tp SET email = u.email
FROM auth.users u WHERE tp.id = u.id AND (tp.email IS NULL OR tp.email = '');

UPDATE student_profiles sp SET email = u.email
FROM auth.users u WHERE sp.id = u.id AND (sp.email IS NULL OR sp.email = '');
