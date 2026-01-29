-- ==========================================
-- TEACHER AVAILABILITY SYSTEM
-- ==========================================

-- Teacher weekly availability slots (recurring schedule)
CREATE TABLE IF NOT EXISTS teacher_availability_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Specific date availability (overrides or additional slots)
CREATE TABLE IF NOT EXISTS teacher_availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  capacity INTEGER DEFAULT 1, -- How many bookings this slot can accommodate
  booked_count INTEGER DEFAULT 0,
  is_booked BOOLEAN DEFAULT false,
  slot_status TEXT DEFAULT 'available' CHECK (slot_status IN ('available', 'booked', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('booking_request', 'booking_confirmed', 'booking_cancelled', 'meeting_reminder', 'meeting_started')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting history and logs
CREATE TABLE IF NOT EXISTS meeting_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  meeting_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  teacher_joined BOOLEAN DEFAULT false,
  student_joined BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_teacher_availability_schedule_teacher_id ON teacher_availability_schedule(teacher_id);
CREATE INDEX idx_teacher_availability_schedule_day ON teacher_availability_schedule(day_of_week);

CREATE INDEX idx_teacher_availability_slots_teacher_id ON teacher_availability_slots(teacher_id);
CREATE INDEX idx_teacher_availability_slots_date ON teacher_availability_slots(available_date);
CREATE INDEX idx_teacher_availability_slots_status ON teacher_availability_slots(slot_status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

CREATE INDEX idx_meeting_logs_booking_id ON meeting_logs(booking_id);
CREATE INDEX idx_meeting_logs_meeting_id ON meeting_logs(meeting_id);

-- Add new columns to bookings table if not present
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS availability_slot_id UUID REFERENCES teacher_availability_slots(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS teacher_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_ended_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to update bookings updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_update_timestamp ON bookings;
CREATE TRIGGER bookings_update_timestamp
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- ==========================================
-- HOW TO USE THIS FILE
-- ==========================================

-- 1. Go to Supabase Dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste the content
-- 5. Click "Run" or press Ctrl+Enter
-- 6. Wait for success message

-- NEW TABLES CREATED:
-- - teacher_availability_schedule: Weekly recurring availability (e.g., Mon 10-17, Fri 14-19)
-- - teacher_availability_slots: Specific date/time slots created from schedule
-- - notifications: All notifications for users
-- - meeting_logs: Meeting history and participation

-- FEATURES ENABLED:
-- ✅ Teachers set weekly availability schedule
-- ✅ System auto-generates availability slots
-- ✅ Students see only available time slots
-- ✅ Notifications for booking requests
-- ✅ Notifications for confirmations/reminders
-- ✅ Meeting attendance tracking
