-- Add availability status for teachers (online / away / offline)
-- Run in Supabase SQL Editor if teacher_profiles already exists.

ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'offline'
CHECK (availability_status IN ('online', 'away', 'offline'));

-- Optional: comment for documentation
COMMENT ON COLUMN teacher_profiles.availability_status IS 'Teacher presence: online, away, offline';
