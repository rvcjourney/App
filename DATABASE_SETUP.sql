-- ==========================================
-- STEP 3: BOOKINGS TABLE
-- ==========================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booked_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  duration_minutes INTEGER DEFAULT 60,
  meeting_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booked_date ON bookings(booked_date);

-- ==========================================
-- STEP 4: FAVORITES TABLE
-- ==========================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, teacher_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_favorites_student_id ON favorites(student_id);
CREATE INDEX idx_favorites_teacher_id ON favorites(teacher_id);

-- ==========================================
-- STEP 5: REVIEWS TABLE
-- ==========================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_reviews_teacher_id ON reviews(teacher_id);
CREATE INDEX idx_reviews_student_id ON reviews(student_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ==========================================
-- HOW TO USE THIS FILE
-- ==========================================

-- 1. Go to Supabase Dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste each CREATE TABLE statement (one at a time)
-- 5. Click "Run" or press Ctrl+Enter
-- 6. Wait for success message

-- Expected results:
-- - 3 tables created: bookings, favorites, reviews
-- - 9 indexes created for performance optimization
-- - Foreign key relationships established with profiles table

-- NOTES:
-- - status field in bookings: pending → confirmed → completed/cancelled
-- - favorites table has UNIQUE constraint (student_id, teacher_id) to prevent duplicates
-- - reviews rating is 1-5 scale with CHECK constraint
-- - All tables have automatic created_at and updated_at timestamps
