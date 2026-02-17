-- ==========================================
-- MONETIZATION SCHEMA
-- Payment, Admin Charges, Earnings & Withdrawals
-- ==========================================

-- 1. ADMIN CHARGES TABLE
-- Stores additional charges added by admin on top of teacher rates
CREATE TABLE IF NOT EXISTS admin_charges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    base_charge_amount DECIMAL(10, 2) NOT NULL, -- Teacher's hourly rate (e.g., 600)
    admin_charge_amount DECIMAL(10, 2) NOT NULL DEFAULT 150, -- Admin additional charge (e.g., 150)
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (base_charge_amount + admin_charge_amount) STORED,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. PAYMENTS TABLE
-- Records all payments made by students for bookings
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Payment amounts breakdown
    base_price DECIMAL(10, 2) NOT NULL, -- Teacher's hourly rate (e.g., 600)
    admin_charge DECIMAL(10, 2) NOT NULL DEFAULT 150, -- Admin charge
    total_amount DECIMAL(10, 2) NOT NULL, -- Total paid by student (e.g., 750)
    
    -- Razorpay details
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_signature VARCHAR(255),
    
    -- Payment status
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_method VARCHAR(50) DEFAULT 'razorpay', -- razorpay, upi, card, etc.
    
    -- Payment timestamps
    paid_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. TEACHER EARNINGS TABLE
-- Track how much teacher earns after admin deduction
CREATE TABLE IF NOT EXISTS teacher_earnings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Earnings breakdown
    total_collected DECIMAL(10, 2) NOT NULL, -- Total from student (1000)
    admin_deduction DECIMAL(10, 2) NOT NULL, -- GST (18% of total)
    platform_fee DECIMAL(10, 2) NOT NULL, -- Platform fee (15% of total)
    teacher_earn DECIMAL(10, 2) NOT NULL, -- Net earning (67% of total - calculated in backend)
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, credited, withdrawn
    
    -- Bank transfer details (once approved for withdrawal)
    transferred_to_bank boolean DEFAULT false,
    transferred_at timestamptz,
    transfer_reference_id VARCHAR(255),
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. TEACHER WALLET TABLE
-- Accumulated balance for withdrawal
CREATE TABLE IF NOT EXISTS teacher_wallet (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Balance tracking
    total_balance DECIMAL(10, 2) DEFAULT 0, -- Total available balance
    withdrawn_amount DECIMAL(10, 2) DEFAULT 0, -- Total withdrawn so far
    available_balance DECIMAL(10, 2) DEFAULT 0, -- Available to withdraw
    
    -- Withdrawal eligibility conditions
    minimum_balance_reached boolean DEFAULT false, -- Amount > 10,000
    one_month_covered boolean DEFAULT false, -- 1 month has passed since account creation
    last_withdrawal_date timestamptz,
    
    -- Tracking dates
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. WITHDRAWAL REQUESTS TABLE
-- Track teacher withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Withdrawal details
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, processing, completed, rejected
    
    -- Bank account details
    bank_account_number VARCHAR(255),
    bank_ifsc_code VARCHAR(20),
    account_holder_name VARCHAR(255),
    
    -- Transaction tracking
    transaction_reference_id VARCHAR(255),
    razorpay_payout_id VARCHAR(255),
    
    -- Timestamps
    requested_at timestamptz DEFAULT now(),
    approved_at timestamptz,
    processed_at timestamptz,
    completed_at timestamptz,
    rejected_reason text,
    
    -- Admin acknowledgement
    admin_acknowledged boolean DEFAULT false,
    admin_acknowledged_at timestamptz,
    admin_id uuid REFERENCES auth.users(id),
    
    updated_at timestamptz DEFAULT now()
);

-- 6. RAZORPAY ORDER LOG TABLE
-- Log all Razorpay orders for tracking
CREATE TABLE IF NOT EXISTS razorpay_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    status VARCHAR(50) DEFAULT 'created', -- created, attempted, paid, failed
    
    created_at timestamptz DEFAULT now(),
    paid_at timestamptz
);

-- 7. PAYMENT ANALYTICS TABLE (Optional - for admin dashboard)
CREATE TABLE IF NOT EXISTS payment_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE,
    total_revenue DECIMAL(10, 2) DEFAULT 0, -- Total collected
    admin_commission DECIMAL(10, 2) DEFAULT 0, -- Admin's share
    net_to_teachers DECIMAL(10, 2) DEFAULT 0, -- Teacher's share
    transactions_count INTEGER DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- INDEXES for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_teacher ON payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher ON teacher_earnings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_status ON teacher_earnings(status);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_payment ON teacher_earnings(payment_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_teacher ON withdrawal_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

CREATE INDEX IF NOT EXISTS idx_admin_charges_teacher ON admin_charges(teacher_id, is_active);

CREATE INDEX IF NOT EXISTS idx_razorpay_orders_booking ON razorpay_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_student ON razorpay_orders(student_id);

-- ==========================================
-- Add new columns to existing tables
-- ==========================================

-- Add to bookings table if not exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'; -- pending, completed, refunded
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2); -- Total price paid
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES payments(id);

-- Add bank account columns to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_verified boolean DEFAULT false;

-- ==========================================
-- SAMPLE DATA (for testing)
-- ==========================================

-- Sample admin charge
INSERT INTO admin_charges (teacher_id, base_charge_amount, admin_charge_amount, is_active)
SELECT id, 600.00, 150.00, true
FROM profiles
WHERE full_name LIKE '%teacher%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ==========================================
-- VIEWS for easier queries
-- ==========================================

-- View for payment summary
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.booking_id,
    p.student_id,
    p.teacher_id,
    p.total_amount,
    p.status,
    p.created_at,
    te.teacher_earn,
    te.admin_deduction,
    te.platform_fee
FROM payments p
LEFT JOIN teacher_earnings te ON p.id = te.payment_id;

-- View for teacher withdrawal eligibility
CREATE OR REPLACE VIEW teacher_withdrawal_eligibility AS
SELECT 
    tw.teacher_id,
    tw.total_balance,
    tw.available_balance,
    tw.minimum_balance_reached,
    tw.one_month_covered,
    CASE 
        WHEN tw.total_balance >= 10000 AND tw.one_month_covered THEN true
        ELSE false
    END AS can_withdraw,
    CASE 
        WHEN tw.total_balance < 10000 THEN 'Minimum balance not reached: Need ₹' || (10000 - tw.total_balance)
        WHEN NOT tw.one_month_covered THEN 'Insufficient time: Wait 1 month from account creation'
        ELSE 'Eligible to withdraw'
    END AS eligibility_reason
FROM teacher_wallet tw;
