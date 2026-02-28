-- ==========================================
-- NOTIFICATION SYSTEM IMPROVEMENTS
-- Avoid single-table bloat: recent vs archive, indexes, pagination-friendly
-- ==========================================

-- 1) Allow all notification types in use (relax CHECK if exists)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'booking_request', 'booking_confirmed', 'booking_cancelled',
    'meeting_reminder', 'meeting_started', 'meeting_completed',
    'payment_confirmed', 'payment_received', 'withdrawal_requested',
    'withdrawal_approved', 'earnings_added'
  ));

-- 2) Composite index for fast per-user, recent-first queries (reduces delay)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_desc
  ON notifications (user_id, created_at DESC);

-- 3) Archive table: old/read notifications moved here to keep main table small
CREATE TABLE IF NOT EXISTS notification_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_archive_user_created
  ON notification_archive (user_id, created_at DESC);

COMMENT ON TABLE notification_archive IS 'Read or old notifications; keeps public.notifications small for performance.';

-- 4) Optional: move read notifications older than 90 days to archive (run via cron or backend)
-- This is done by application code; no trigger to avoid locking.
