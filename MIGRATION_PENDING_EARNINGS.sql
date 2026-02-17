-- Migration: Add pending earnings tracking
-- Run this in Supabase SQL Editor

-- 1. Add pending_balance column to teacher_wallet
ALTER TABLE teacher_wallet 
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(10, 2) DEFAULT 0;

-- 2. Add completed_at column to teacher_earnings
ALTER TABLE teacher_earnings 
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 3. Update existing 'pending' status entries based on booking completion
-- This updates teacher_earnings where the associated booking is already completed
UPDATE teacher_earnings te
SET 
    status = 'completed',
    completed_at = b.meeting_ended_at
FROM bookings b
WHERE te.booking_id = b.id 
    AND b.status = 'completed' 
    AND b.meeting_ended_at IS NOT NULL
    AND te.status = 'pending';

-- 4. Comment explaining the flow:
-- 
-- PAYMENT FLOW:
-- 1. Student makes payment → teacher_earnings created with status='pending'
--    - Wallet pending_balance increases
--    - Wallet total_balance does NOT increase yet
-- 
-- 2. Meeting ends → teacher_earnings status changes to 'completed'
--    - Wallet total_balance increases by teacher_earn
--    - Wallet available_balance increases by teacher_earn
--    - Wallet pending_balance decreases by teacher_earn
-- 
-- 3. Teacher can withdraw only when:
--    - total_balance >= 10,000
--    - Account age >= 1 month
