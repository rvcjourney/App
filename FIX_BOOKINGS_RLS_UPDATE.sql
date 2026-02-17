-- ==========================================
-- COMPLETE RLS SETUP FOR PAYMENT SYSTEM
-- ==========================================
-- Run this in Supabase SQL Editor to enable RLS on all payment-related tables

-- ==========================================
-- 1. BOOKINGS TABLE - Enable RLS and create policies
-- ==========================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Students can view their own bookings
CREATE POLICY "Students can view own bookings" ON bookings
FOR SELECT USING (auth.uid() = student_id);

-- Teachers can view their bookings
CREATE POLICY "Teachers can view own bookings" ON bookings
FOR SELECT USING (auth.uid() = teacher_id);

-- Students can create bookings
CREATE POLICY "Students can create bookings" ON bookings
FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can update their own bookings (for payment fields)
CREATE POLICY "Students can update own bookings" ON bookings
FOR UPDATE USING (auth.uid() = student_id);

-- Teachers can update their bookings
CREATE POLICY "Teachers can update own bookings" ON bookings
FOR UPDATE USING (auth.uid() = teacher_id);

-- ==========================================
-- 2. PAYMENTS TABLE - Enable RLS and create policies
-- ==========================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Students can view their payments
CREATE POLICY "Students can view own payments" ON payments
FOR SELECT USING (auth.uid() = student_id);

-- Teachers can view payments for their sessions
CREATE POLICY "Teachers can view own payments" ON payments
FOR SELECT USING (auth.uid() = teacher_id);

-- Backend can insert payments (using service role - bypasses RLS)
CREATE POLICY "Authenticated users can create payments" ON payments
FOR INSERT WITH CHECK (auth.uid() = student_id);

-- ==========================================
-- 3. TEACHER_EARNINGS TABLE - Enable RLS and create policies
-- ==========================================

ALTER TABLE teacher_earnings ENABLE ROW LEVEL SECURITY;

-- Teachers can view their earnings
CREATE POLICY "Teachers can view own earnings" ON teacher_earnings
FOR SELECT USING (auth.uid() = teacher_id);

-- Backend can insert earnings records
CREATE POLICY "Authenticated can create earnings" ON teacher_earnings
FOR INSERT WITH CHECK (true);

-- Teachers can view their earnings
CREATE POLICY "Teachers can update own earnings" ON teacher_earnings
FOR UPDATE USING (auth.uid() = teacher_id);

-- ==========================================
-- 4. TEACHER_WALLET TABLE - Enable RLS and create policies
-- ==========================================

ALTER TABLE teacher_wallet ENABLE ROW LEVEL SECURITY;

-- Teachers can view their wallet
CREATE POLICY "Teachers can view own wallet" ON teacher_wallet
FOR SELECT USING (auth.uid() = teacher_id);

-- Teachers can update their wallet
CREATE POLICY "Teachers can update own wallet" ON teacher_wallet
FOR UPDATE USING (auth.uid() = teacher_id);

-- Backend can insert wallets
CREATE POLICY "Authenticated can create wallet" ON teacher_wallet
FOR INSERT WITH CHECK (true);

-- ==========================================
-- 5. RAZORPAY_ORDERS TABLE - Enable RLS and create policies
-- ==========================================

ALTER TABLE razorpay_orders ENABLE ROW LEVEL SECURITY;

-- Students can view their orders
CREATE POLICY "Students can view own orders" ON razorpay_orders
FOR SELECT USING (auth.uid() = student_id);

-- Backend can create/update orders
CREATE POLICY "Authenticated can manage orders" ON razorpay_orders
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can update orders" ON razorpay_orders
FOR UPDATE WITH CHECK (true);

-- ==========================================
-- IMPORTANT NOTES:
-- ==========================================
-- 1. Service Role Key (used by backend) BYPASSES all RLS policies
--    So if you're using service role key in backend, RLS shouldn't block it
-- 
-- 2. If backend is still failing, check:
--    - Is SUPABASE_SERVICE_ROLE_KEY set correctly in .env?
--    - Does the booking ID actually exist in database?
--    - Check database logs in Supabase for any constraint errors
--
-- 3. If RLS prevents updates despite everything above, try adding:
--    CREATE POLICY "Service role can manage bookings" ON bookings
--    FOR ALL USING (true) WITH CHECK (true);


