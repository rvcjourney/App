# 🔧 Payment Database Update - Troubleshooting Guide

## Quick Diagnosis

Your bookings are not being updated after payment. Here's how to fix it:

### Step 1: Check Backend Connectivity
Run this command in your terminal:

```bash
curl http://localhost:3000/api/diagnostics
```

This will show:
- ✅/❌ Supabase URL configured
- ✅/❌ Service Role Key configured
- ✅/❌ Database connectivity
- ✅/❌ Bookings table accessible

### Step 2: Check Environment Variables

In your `backend/.env` file, verify you have:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...very_long_key...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is different from the `SUPABASE_ANON_KEY`. You need the SERVICE ROLE KEY, not the anon key.

**To get it from Supabase:**
1. Go to Supabase Dashboard → Your Project
2. Settings → API
3. Copy `service_role` key (under "Your API Queries")
4. Paste in `backend/.env`
5. **Restart backend** (`npm start`)

### Step 3: Enable RLS Policies

Run this SQL in Supabase (Database → SQL Editor):

```sql
-- Enable RLS on all payment tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_wallet ENABLE ROW LEVEL SECURITY;

-- Create basic policies for bookings
CREATE POLICY "Students can view own bookings" ON bookings
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view own bookings" ON bookings
FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Students can update own bookings" ON bookings
FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can update own bookings" ON bookings
FOR UPDATE USING (auth.uid() = teacher_id);
```

### Step 4: Test Payment Again

1. **Restart Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **In App:**
   - Student: Book a session → Go to checkout
   - Complete payment (use test Razorpay card)
   - Check logs

3. **Check Backend Logs** for:
   - `✅ Payment created`
   - `✅ Booking exists`
   - `✅ Booking status updated to confirmed`

### Step 5: Verify Teacher Sees the Booking

Teacher dashboard should show the booking within:
- **Immediately** (if Real-time subscription works)
- **15 seconds max** (fallback polling)
- **On refresh** (manual refresh)

---

## Common Errors & Fixes

### Error: "Service Role Key is not set!"
**Fix:**
1. Add `SUPABASE_SERVICE_ROLE_KEY` to `backend/.env`
2. Restart backend
3. Run `/api/diagnostics` to verify

### Error: "Booking not found"
**Fix:**
1. Check if booking ID is correct
2. Verify booking was created (check Supabase database)
3. Check if booking has correct UUIDs for student_id and teacher_id

### Error: "cannot insert a non-DEFAULT value into column teacher_earn"
**Fix:**
- Already fixed in code
- Restart backend to apply changes

### Teacher doesn't see booking
**Fix:**
1. Pull-to-refresh on teacher dashboard
2. Check backend logs for "Booking status updated to confirmed"
3. If not showing up, the update failed - check /api/diagnostics

---

## Debug Logs to Check

After payment, in backend console look for:

```
✅ Signature verified
✅ Payment created: [UUID]
✅ Earnings record created (PENDING)
✅ Booking exists: [booking details]
✅ Booking status updated to confirmed
✅ Updated booking: [new booking data with status: confirmed]
```

If you see any ❌ or 🔴 errors, share them and I can fix it immediately.

---

## Database Structure Check

Verify bookings table has these columns:
- `id` (UUID)
- `student_id` (UUID)
- `teacher_id` (UUID)
- `status` (TEXT: 'pending', 'confirmed', 'ongoing', 'cancelled')
- `payment_status` (TEXT: 'pending', 'completed')
- `payment_id` (UUID)
- `total_price` (DECIMAL)
- `teacher_confirmed_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `booked_date` (TIMESTAMP)

If any column is missing, the update will fail.

---

## Still Not Working?

1. Run `/api/diagnostics` - screenshot the output
2. Check backend logs - copy any error messages
3. Look in Supabase Database → bookings → verify one booking exists
4. Share these details and I can fix it!
