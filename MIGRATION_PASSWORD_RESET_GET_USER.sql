-- Run this in Supabase Dashboard → SQL Editor
-- Allows password-reset OTP to find user by email without needing auth.admin (service_role) in the backend.
-- You still need the service_role key in backend/.env for the final step (updating the password).

CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE email = lower(trim(user_email)) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO service_role;

COMMENT ON FUNCTION public.get_auth_user_id_by_email(text) IS 'Used by backend to resolve email to auth user id for password reset OTP (callable with anon key).';
