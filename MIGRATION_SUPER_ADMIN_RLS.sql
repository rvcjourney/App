-- ==========================================
-- Super Admin RLS Policies
-- Run this in Supabase SQL Editor after ensuring you have at least one user with role = 'super_admin'
-- ==========================================
-- To set a user as super admin, run (replace USER_UUID with the user's id from auth.users):
--   UPDATE public.profiles SET role = 'super_admin' WHERE id = 'USER_UUID';
-- ==========================================

-- Helper: allow if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Profiles: allow super_admin to read all profiles
DROP POLICY IF EXISTS "Super admin can read all profiles" ON public.profiles;
CREATE POLICY "Super admin can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_super_admin());

-- Profiles: allow super_admin to update any profile (full_name, role, etc.)
DROP POLICY IF EXISTS "Super admin can update all profiles" ON public.profiles;
CREATE POLICY "Super admin can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Bookings: allow super_admin to read all bookings (for Admin Bookings list)
DROP POLICY IF EXISTS "Super admin can read all bookings" ON public.bookings;
CREATE POLICY "Super admin can read all bookings"
  ON public.bookings
  FOR SELECT
  USING (public.is_super_admin());

-- Teacher profiles: super_admin can read, update, and insert any row
DROP POLICY IF EXISTS "Super admin can read all teacher_profiles" ON public.teacher_profiles;
CREATE POLICY "Super admin can read all teacher_profiles"
  ON public.teacher_profiles FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin can update all teacher_profiles" ON public.teacher_profiles;
CREATE POLICY "Super admin can update all teacher_profiles"
  ON public.teacher_profiles FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin can insert teacher_profiles" ON public.teacher_profiles;
CREATE POLICY "Super admin can insert teacher_profiles"
  ON public.teacher_profiles FOR INSERT WITH CHECK (public.is_super_admin());

-- Student profiles: super_admin can read, update, and insert any row
DROP POLICY IF EXISTS "Super admin can read all student_profiles" ON public.student_profiles;
CREATE POLICY "Super admin can read all student_profiles"
  ON public.student_profiles FOR SELECT USING (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin can update all student_profiles" ON public.student_profiles;
CREATE POLICY "Super admin can update all student_profiles"
  ON public.student_profiles FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "Super admin can insert student_profiles" ON public.student_profiles;
CREATE POLICY "Super admin can insert student_profiles"
  ON public.student_profiles FOR INSERT WITH CHECK (public.is_super_admin());

-- Note: If you have existing RLS that only allows users to read their own profile, you may need to
-- add OR public.is_super_admin() to those policies, or ensure the above SELECT policy is sufficient
-- (Supabase combines policies with OR for the same operation). If "Super admin can read all profiles"
-- is the only SELECT policy, it might block normal users. So typically you'd have:
--   - "Users can read own profile" USING (auth.uid() = id)
--   - "Super admin can read all profiles" USING (public.is_super_admin())
-- Both together allow: own row for everyone, or all rows for super_admin. Run this migration
-- in addition to your existing profiles policies.
