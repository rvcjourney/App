-- Fix: Allow payment_received, payment_confirmed, and other notification types
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'booking_request',
    'booking_confirmed',
    'booking_cancelled',
    'booking_rescheduled',
    'meeting_reminder',
    'meeting_started',
    'meeting_completed',
    'payment_confirmed',
    'payment_received',
    'withdrawal_requested',
    'withdrawal_approved',
    'earnings_added'
  ));
