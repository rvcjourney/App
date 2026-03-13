-- ==========================================
-- Add percentage and GST columns to admin_charges
-- Run in Supabase SQL Editor if charges are set in percentage with GST.
-- ==========================================

ALTER TABLE admin_charges
ADD COLUMN IF NOT EXISTS admin_charge_percent NUMERIC(5,2) DEFAULT 0;

ALTER TABLE admin_charges
ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(5,2) DEFAULT 0;

-- Required for upsert from frontend (one row per teacher)
CREATE UNIQUE INDEX IF NOT EXISTS admin_charges_teacher_id_key ON admin_charges (teacher_id);

-- Optional: backfill from existing admin_charge_amount if you had fixed amounts
-- UPDATE admin_charges SET admin_charge_percent = ROUND((admin_charge_amount / NULLIF(base_charge_amount, 0)) * 100, 2) WHERE admin_charge_percent IS NULL AND base_charge_amount > 0;
