-- Teachers table (if not already present, or extend users with a 'role' column)
-- Assuming you have a 'users' table with id, name, email, etc.

-- Teacher availability: each row is a time slot a teacher is available
CREATE TABLE IF NOT EXISTS teacher_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    is_booked boolean DEFAULT false
);

-- Bookings: student books a teacher's available slot
CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES users(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
    availability_id uuid REFERENCES teacher_availability(id) ON DELETE CASCADE,
    booked_at timestamptz DEFAULT now()
);

-- Add 'role' column to users if not present
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text;
-- Set role to 'teacher' or 'student' as needed
