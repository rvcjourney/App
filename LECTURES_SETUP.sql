-- LECTURES TABLE (For scheduled classes/group sessions)
CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  capacity INTEGER DEFAULT 30,
  meeting_id TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- LECTURE ENROLLMENTS (Students enrolling in lectures)
CREATE TABLE lecture_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  attended BOOLEAN DEFAULT FALSE
);

-- INDEXES for performance
CREATE INDEX idx_lectures_teacher_id ON lectures(teacher_id);
CREATE INDEX idx_lectures_status ON lectures(status);
CREATE INDEX idx_lectures_scheduled_date ON lectures(scheduled_date);
CREATE INDEX idx_lecture_enrollments_student_id ON lecture_enrollments(student_id);
CREATE INDEX idx_lecture_enrollments_lecture_id ON lecture_enrollments(lecture_id);
CREATE UNIQUE INDEX idx_lecture_enrollments_unique ON lecture_enrollments(lecture_id, student_id);
