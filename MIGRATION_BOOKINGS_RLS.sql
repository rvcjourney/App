-- Allow teachers and students to see their bookings
-- Run this in Supabase SQL Editor if teachers cannot see booked sessions.

-- Enable RLS on bookings (skip if already enabled)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Teachers: can read their own bookings (where they are the teacher)
DROP POLICY IF EXISTS "Teachers can read own bookings" ON bookings;
CREATE POLICY "Teachers can read own bookings"
ON bookings FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

-- Students: can read their own bookings
DROP POLICY IF EXISTS "Students can read own bookings" ON bookings;
CREATE POLICY "Students can read own bookings"
ON bookings FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Students: can insert bookings (when they are the student)
DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
CREATE POLICY "Students can create bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Teachers: can update their bookings (e.g. status, meeting_id)
DROP POLICY IF EXISTS "Teachers can update own bookings" ON bookings;
CREATE POLICY "Teachers can update own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);
