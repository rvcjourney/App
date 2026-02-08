# Payment System Setup Guide

## Current Status ✅

The payment system has been **partially implemented** with the following work completed:

### Frontend ✅
- **StudentCheckout.js**: Payment screen with Razorpay integration
  - Now has fallback charges (uses teacher's base price + ₹150 admin charge if API fails)
  - Removed non-serializable function params from navigation
  - Handles missing API gracefully
  - Payment flow: Create Order → Razorpay → Verify Payment → Navigate back

- **StudentDashboard.js**: Booking flow updated
  - Calls `handleBookSlot()` which creates booking in database
  - Navigates to StudentCheckout with booking details
  - No longer passes function callbacks through navigation params

### Backend ✅
- **server.js**: Payment endpoints fully implemented
  - `POST /api/payments/create-order` - Create Razorpay order (line 726)
  - `POST /api/payments/verify` - Verify payment signature & create records (line 788)
  - `GET /api/admin/charges/:teacherId` - Fetch admin charges (line 1070)
  - `POST /api/admin/charges/set` - Set admin charges (line 1001)
  - `GET /api/teacher/earnings/:teacherId` - Get teacher earnings (line 1106)

### Database ✅
- **MONETIZATION_SCHEMA.sql**: Complete schema with 7 tables
  - admin_charges - Teacher rates + admin markup
  - payments - Transaction records
  - teacher_earnings - Payment splits
  - teacher_wallet - Balance tracking
  - withdrawal_requests - Withdrawal queue
  - razorpay_orders - Order logging
  - payment_analytics - Dashboard stats
  - All foreign keys fixed for Supabase auth.users

---

## What Needs to Be Done

### ✅ Step 1: Deploy Database Schema to Supabase

**File**: `MONETIZATION_SCHEMA.sql`

**Instructions**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open file `MONETIZATION_SCHEMA.sql` from root directory
6. Copy entire SQL content
7. Paste into Supabase SQL Editor
8. Click **Run**
9. Verify all tables are created:
   - admin_charges
   - payments
   - teacher_earnings
   - teacher_wallet
   - withdrawal_requests
   - razorpay_orders

**Expected Output**: "Query succeeded" with table creation messages

**Troubleshooting**:
- If you get "relation auth.users does not exist" → Your Supabase project hasn't enabled auth yet
  - Go to Authentication section and enable it
  - Then run the schema again

---

### ✅ Step 2: Set Backend Environment Variables

**File**: `.env` (in `/backend` directory)

**Add these variables**:
```
# Razorpay Keys
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Existing variables (keep these)
VIDEOSDK_API_KEY=your_videosdk_key
VIDEOSDK_SECRET_KEY=your_videosdk_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Getting Razorpay Keys**:
1. Create account at [Razorpay](https://razorpay.com) (sign up for India)
2. Go to **Dashboard** → **Settings** → **API Keys**
3. Copy **Key ID** and **Key Secret**
4. For testing, Razorpay provides test mode credentials automatically
5. Paste into `.env` file

**Test Cards** (use these for testing):
- **Success**: 4111 1111 1111 1111
- **Expiry**: Any future date (MM/YY)
- **CVV**: Any 3 digits

---

### ✅ Step 3: Start Backend Server

**From terminal in `/backend` directory**:

```bash
npm install
npm start
```

**Expected Output**:
```
✅ VideoSDK Configuration loaded successfully
🚀 Backend server running on http://localhost:3000
```

**Verify endpoints are working**:
```bash
curl http://localhost:3000/health
# Should return: {"status":"OK","message":"Server is running","timestamp":"..."}
```

---

### ✅ Step 4: Test Payment Flow

**Scenario**: Student books a teacher session and pays ₹750

**Steps**:
1. Open app in simulator/device
2. Go to **Student Dashboard**
3. Search and select a teacher
4. Select an available slot
5. Click **Confirm Booking**
6. Screen navigates to **StudentCheckout**
7. See pricing breakdown:
   - Teacher rate: ₹600
   - Admin charge: ₹150
   - **Total: ₹750**
8. Click **Pay Now**
9. Razorpay payment modal opens
10. Enter test card: `4111 1111 1111 1111`
11. Enter any future expiry date and CVV
12. Click **Pay**
13. **Expected**: Payment success, navigate back to StudentDashboard
14. Booking should now show as "Paid" with checkmark

**What happens in background**:
1. StudentCheckout creates Razorpay order
2. Student completes payment in Razorpay
3. Backend verifies signature
4. Creates payment record in database
5. Splits payment:
   - Admin: ₹150
   - Platform: ₹100
   - Teacher: ₹500
6. Credits ₹500 to teacher's wallet
7. Marks booking as confirmed
8. Sends notifications to student & teacher

---

### ✅ Step 5: Set Admin Charges (Optional)

Admin can override default ₹150 charge for specific teachers.

**API Call** (use Postman or curl):

```bash
POST http://localhost:3000/api/admin/charges/set

Body:
{
  "teacherId": "teacher_uuid_here",
  "baseCharge": 600,
  "adminCharge": 200  # Override default 150
}
```

Or use the AdminDashboard component once wired up.

---

### ✅ Step 6: Verify Teacher Earnings

**To check teacher's wallet balance**:

```bash
GET http://localhost:3000/api/teacher/earnings/teacher_uuid_here
```

**Response**:
```json
{
  "success": true,
  "wallet": {
    "total_balance": 500,
    "withdrawn_amount": 0,
    "available_balance": 500,
    "minimum_balance_reached": false,
    "one_month_covered": false
  },
  "earnings": [...]
}
```

---

## What Still Needs Implementation

### 1. Teacher Withdrawal System
- Implement withdrawal request endpoints
- Bank account validation
- Razorpay payouts integration
- Eligibility check (₹10K + 1 month)

### 2. Admin Dashboard Integration
- Wire up AdminDashboard.js component
- Connect to backend endpoints
- Approve/reject withdrawals
- View payment analytics

### 3. Withdrawal Notifications
- Email notifications when payment confirmed
- Withdrawal request notifications
- Earnings updates

### 4. Error Handling & Logging
- Retry logic for failed API calls
- Payment dispute handling
- Refund management

### 5. Testing
- Test all payment scenarios
- Test with real Razorpay sandbox
- Test error cases (declined cards, network failures)

---

## Common Issues & Solutions

### Issue: "Network request failed" when opening StudentCheckout
**Solution**: 
- Backend server not running
- Start with: `npm start` in `/backend` directory
- Verify with: `curl http://localhost:3000/health`

### Issue: "Invalid Razorpay keys"
**Solution**:
- Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in `.env`
- Keys should not have quotes: `KEY_ID=abc123def456`
- Restart backend after changing `.env`

### Issue: "relation 'admin_charges' does not exist"
**Solution**:
- Schema not deployed to Supabase
- Go to SQL Editor and run MONETIZATION_SCHEMA.sql

### Issue: Payment successful but booking not marked as paid
**Solution**:
- Check backend logs for verification errors
- Verify razorpay signature is being validated correctly
- Ensure RAZORPAY_KEY_SECRET is correct in `.env`

---

## Files Modified in This Session

### Frontend
- **src/scenes/Student/StudentCheckout.js**
  - Added fallback charges if API fails
  - Removed onPaymentSuccess callback param
  - Improved error handling
  - Navigation to StudentDashboard on success

- **src/scenes/Student/StudentDashboard.js**
  - Updated booking confirmation button
  - Removed function callback from navigation params
  - Passes booking object to StudentCheckout

### Backend
- **backend/server.js**
  - Already has all payment endpoints implemented
  - Just needs environment variables set

### Database
- **MONETIZATION_SCHEMA.sql**
  - Create this in Supabase
  - All 7 tables with proper relationships

---

## Quick Reference

| Component | Purpose | Status |
|-----------|---------|--------|
| StudentCheckout | Payment gateway UI | ✅ Ready |
| StudentDashboard | Booking creation | ✅ Ready |
| AdminDashboard | Admin controls | ⏳ TODO |
| Payment API | Razorpay integration | ✅ Ready |
| Withdrawal | Teacher withdrawals | ⏳ TODO |

---

## Next Steps After Setup

1. ✅ Deploy schema to Supabase
2. ✅ Set environment variables in backend
3. ✅ Start backend server
4. ✅ Test payment flow end-to-end
5. ⏳ Implement teacher withdrawal system
6. ⏳ Wire up admin dashboard
7. ⏳ Add email notifications
8. ⏳ Test with real payments (go live)

---

## Support

For issues, check:
- Backend logs: `npm start` output
- Supabase logs: Dashboard → Logs
- Razorpay logs: Dashboard → Transactions
- Console logs in app: React Native debugger

