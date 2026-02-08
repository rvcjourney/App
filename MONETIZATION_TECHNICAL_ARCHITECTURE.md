# 🏗️ Monetization System - Technical Architecture

## 🎯 System Overview

This document provides a comprehensive technical overview of the monetization system.

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT APP                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ StudentDashboard → Select Teacher → StudentCheckout   │  │
│  └───────────────────────────────────────────────────────┘  │
│              ↓                                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Razorpay Payment Gateway (react-native-razorpay)     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              ↓
         BACKEND (Node.js + Express)
         /api/payments/create-order
         /api/payments/verify
              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ payments → teacher_earnings → teacher_wallet         │  │
│  │ razorpay_orders → withdrawal_requests                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│               TEACHER APP                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ TeacherEarnings → WithdrawalRequest → Bank Transfer  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN APP                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AdminDashboard → Set Charges → Approve Withdrawals   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### Payment Flow
```
1. STUDENT INITIATES BOOKING
   └─ StudentCheckout component
   └─ route params: { booking, teacher, slot }

2. CALCULATE PRICING
   ├─ Fetch admin_charges for teacher
   ├─ basePrice = teacher.price_per_call (₹600)
   ├─ adminCharge = admin_charges.admin_charge_amount (₹150)
   └─ totalAmount = basePrice + adminCharge (₹750)

3. CREATE PAYMENT ORDER
   ├─ API: POST /api/payments/create-order
   ├─ Razorpay creates order_id
   ├─ Log to razorpay_orders table
   └─ Return: orderId, amount, keyId

4. STUDENT PAYS VIA RAZORPAY
   ├─ Opens Razorpay UI
   ├─ Student enters payment details
   └─ Razorpay processes payment

5. VERIFY PAYMENT
   ├─ API: POST /api/payments/verify
   ├─ Verify Razorpay signature
   ├─ Create payments table record
   ├─ Create teacher_earnings record
   ├─ Update bookings status to 'confirmed'
   ├─ Update teacher_wallet balance
   └─ Send notifications to both

6. PAYMENT COMPLETE ✓
   └─ Booking confirmed
   └─ Teacher wallet updated
   └─ Notifications sent
```

### Earnings Calculation
```
Student Pays (Total):          ₹750

Distribution:
├─ Admin Commission:            ₹150  (20%)   → Goes to admin Razorpay
├─ Platform Fee:                ₹100  (13.33%) → System
└─ Teacher Earnings:            ₹500  (66.67%) → Added to teacher_wallet

Teacher Gets: ₹500
```

### Withdrawal Flow
```
1. TEACHER REQUESTS WITHDRAWAL
   ├─ Amount: ₹ (must be ≤ available_balance)
   ├─ Bank Account Details
   │  ├─ Account Number
   │  ├─ IFSC Code
   │  └─ Account Holder Name
   └─ API: POST /api/teacher/withdrawal/request

2. SYSTEM VALIDATES
   ├─ Check: available_balance ≥ amount
   ├─ Check: total_balance ≥ ₹10,000
   ├─ Check: account_age ≥ 1 month
   └─ If fails: Return error reason

3. CREATE WITHDRAWAL REQUEST
   ├─ Insert to withdrawal_requests table
   ├─ Status: 'pending'
   ├─ Update teacher_wallet (reduce available_balance)
   └─ Send notification to teacher

4. ADMIN APPROVES
   ├─ Admin Dashboard → Withdrawals tab
   ├─ Review withdrawal request
   ├─ Click "Approve"
   ├─ API: POST /api/admin/withdrawals/:id/approve
   │  ├─ Update status to 'processing'
   │  ├─ Set admin_acknowledged = true
   │  └─ (Integration point: Razorpay Payouts)
   └─ Send notification to teacher

5. BANK TRANSFER
   ├─ Razorpay Payouts processes transfer
   ├─ Processing time: 2-3 business days
   ├─ Update withdrawal_requests (status = 'completed')
   └─ Update teacher_wallet (add to withdrawn_amount)

6. TEACHER RECEIVES MONEY ✓
   └─ Money in bank account
   └─ Can request withdrawal again (after balance conditions met)
```

---

## 📦 Component Structure

### Component Hierarchy
```
Admin/
├─ AdminDashboard.js
   ├─ Tab: "Charges" (Manage charges)
   ├─ Tab: "Withdrawals" (Approve requests)
   └─ Tab: "Analytics" (View stats)

Student/
├─ StudentCheckout.js
   ├─ Show price breakdown
   ├─ Create Razorpay order
   ├─ Verify payment
   └─ Confirm booking

Teacher/
├─ TeacherEarnings.js
   ├─ Display balance
   ├─ Show eligibility
   ├─ Recent earnings list
   └─ Request withdrawal button

├─ WithdrawalRequest.js
   ├─ Amount input
   ├─ Bank details form
   ├─ Transaction summary
   └─ Submit button
```

### Component Props & Navigation

**StudentCheckout:**
```jsx
route.params: {
  booking: {
    id: uuid,
    student_id: uuid,
    teacher_id: uuid,
    subject: string,
    status: string
  },
  teacher: {
    id: uuid,
    profile: { full_name, email },
    price_per_call: number,
    specializations: string
  },
  slot: {
    id: uuid,
    start_time: timestamp,
    end_time: timestamp
  },
  onPaymentSuccess: function
}
```

**TeacherEarnings:**
```jsx
receives automatically:
- Loads teacher id from auth
- API call: /api/teacher/earnings/:teacherId
- Returns: { wallet, earnings, eligibility }
```

**WithdrawalRequest:**
```jsx
route.params: {
  availableBalance: number,
  teacherId: uuid
}
```

---

## 🔌 API Endpoints Reference

### 1. Create Payment Order
```
POST /api/payments/create-order

Request:
{
  bookingId: uuid,
  studentId: uuid,
  teacherId: uuid,
  basePrice: number,         // Teacher rate (600)
  adminCharge: number,       // Admin fee (150)
  totalAmount: number        // Total (750)
}

Response:
{
  success: boolean,
  orderId: string,           // Razorpay order ID
  amount: number,
  currency: string,
  keyId: string              // Razorpay public key
}
```

### 2. Verify Payment
```
POST /api/payments/verify

Request:
{
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
  bookingId: uuid,
  studentId: uuid,
  teacherId: uuid,
  basePrice: number,
  adminCharge: number,
  totalAmount: number
}

Response:
{
  success: boolean,
  message: string,
  payment: { ...payment record... },
  earnings: {
    totalCollected: number,
    adminDeduction: number,
    platformFee: number,
    teacherEarn: number
  }
}
```

### 3. Set Admin Charge
```
POST /api/admin/charges/set

Request:
{
  teacherId: uuid,
  baseCharge: number,        // e.g., 600
  adminCharge: number        // e.g., 150
}

Response:
{
  success: boolean,
  data: { ...charge record... },
  totalAmount: number        // 750
}
```

### 4. Get Admin Charge
```
GET /api/admin/charges/:teacherId

Response:
{
  success: boolean,
  data: {
    id: uuid,
    teacher_id: uuid,
    base_charge_amount: number,
    admin_charge_amount: number,
    total_amount: number,
    is_active: boolean
  }
}
```

### 5. Get Teacher Earnings
```
GET /api/teacher/earnings/:teacherId

Response:
{
  success: boolean,
  wallet: {
    total_balance: number,
    available_balance: number,
    minimum_balance_reached: boolean,
    one_month_covered: boolean
  },
  earnings: [ ...earning records... ],
  eligibility: {
    can_withdraw: boolean,
    eligibility_reason: string
  }
}
```

### 6. Request Withdrawal
```
POST /api/teacher/withdrawal/request

Request:
{
  teacherId: uuid,
  amount: number,
  bankAccountNumber: string,
  bankIFSCCode: string,      // 11 chars, e.g., "HDFC0000001"
  accountHolderName: string
}

Response:
{
  success: boolean,
  withdrawalRequestId: uuid,
  data: { ...withdrawal record... }
}
```

### 7. Get Pending Withdrawals (Admin)
```
GET /api/admin/withdrawals

Response:
{
  success: boolean,
  data: [ ...withdrawal requests... ],
  count: number
}
```

### 8. Approve Withdrawal (Admin)
```
POST /api/admin/withdrawals/:withdrawalId/approve

Request:
{
  adminId: uuid
}

Response:
{
  success: boolean,
  data: { ...updated withdrawal record... }
}
```

### 9. Get Analytics (Admin)
```
GET /api/admin/analytics

Response:
{
  success: boolean,
  analytics: {
    totalRevenue: number,
    totalPayments: number,
    pendingWithdrawals: number,
    topTeachers: [ ...array... ]
  }
}
```

---

## 🗄️ Database Schema Details

### admin_charges
```sql
id (uuid, PK)
teacher_id (uuid, FK → users)
base_charge_amount (decimal)
admin_charge_amount (decimal)
total_amount (generated: base + admin)
is_active (boolean, default true)
created_at (timestamp)
updated_at (timestamp)
```

### payments
```sql
id (uuid, PK)
booking_id (uuid, FK)
student_id (uuid, FK)
teacher_id (uuid, FK)
base_price (decimal)
admin_charge (decimal)
total_amount (decimal)
razorpay_payment_id (varchar, unique)
razorpay_order_id (varchar, unique)
razorpay_signature (varchar)
status (varchar: pending, completed, failed, refunded)
payment_method (varchar)
paid_at (timestamp)
created_at (timestamp)
updated_at (timestamp)
```

### teacher_earnings
```sql
id (uuid, PK)
teacher_id (uuid, FK)
payment_id (uuid, FK)
booking_id (uuid, FK)
total_collected (decimal)
admin_deduction (decimal)
platform_fee (decimal)
teacher_earn (generated: total - admin - platform_fee)
status (varchar: pending, credited, withdrawn)
transferred_to_bank (boolean)
transferred_at (timestamp)
transfer_reference_id (varchar)
created_at (timestamp)
updated_at (timestamp)
```

### teacher_wallet
```sql
id (uuid, PK)
teacher_id (uuid, FK, unique)
total_balance (decimal)
withdrawn_amount (decimal)
available_balance (decimal)
minimum_balance_reached (boolean)
one_month_covered (boolean)
last_withdrawal_date (timestamp)
created_at (timestamp)
updated_at (timestamp)
```

### withdrawal_requests
```sql
id (uuid, PK)
teacher_id (uuid, FK)
amount (decimal)
status (varchar: pending, approved, processing, completed, rejected)
bank_account_number (varchar)
bank_ifsc_code (varchar, 11 chars)
account_holder_name (varchar)
transaction_reference_id (varchar)
razorpay_payout_id (varchar)
requested_at (timestamp)
approved_at (timestamp)
processed_at (timestamp)
completed_at (timestamp)
rejected_reason (text)
admin_acknowledged (boolean)
admin_acknowledged_at (timestamp)
admin_id (uuid, FK)
updated_at (timestamp)
```

### razorpay_orders
```sql
id (uuid, PK)
booking_id (uuid, FK)
student_id (uuid, FK)
teacher_id (uuid, FK)
razorpay_order_id (varchar, unique)
amount (decimal)
currency (varchar, default 'INR')
status (varchar: created, attempted, paid, failed)
created_at (timestamp)
paid_at (timestamp)
```

---

## 🔐 Security Implementation

### Payment Verification
```javascript
// Backend verification
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
hmac.update(orderId + '|' + paymentId);
const generatedSignature = hmac.digest('hex');
// Compare with provided signature
if (generatedSignature !== providedSignature) {
  throw new Error('Invalid signature');
}
```

### Withdrawal Eligibility Validation
```
1. Server-side check (not client):
   ├─ available_balance >= amount
   ├─ total_balance >= 10000
   ├─ (now - created_at) >= 1 month
   └─ account verified

2. Admin verification:
   ├─ Bank details verified
   ├─ Withdrawal request reviewed
   ├─ Admin approval logged
   └─ Audit trail created
```

### Data Protection
- HTTPS/TLS for all communications
- Bank details stored encrypted
- API keys in environment variables (not hardcoded)
- RLS policies on profiles table
- All transactions logged

---

## 🧪 Testing Strategy

### Unit Tests
```javascript
// Test payment verification
test('should verify valid razorpay signature', () => {
  const result = verifySignature(paymentId, orderId, signature);
  expect(result).toBe(true);
});

// Test withdrawal eligibility
test('should reject withdrawal if balance < 10000', () => {
  const result = checkWithdrawalEligibility(wallet);
  expect(result.canWithdraw).toBe(false);
});
```

### Integration Tests
```
1. End-to-end booking with payment
   - Create booking
   - Fetch charges
   - Create order
   - Verify payment
   - Check wallet updated
   - Verify booking status

2. Withdrawal request flow
   - Create withdrawal request
   - Verify eligibility check
   - Admin approves
   - Check status updated
   - Check wallet reduced
```

---

## ⚡ Performance Considerations

### Database Indexes
```sql
-- Speed up queries
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_teacher ON payments(teacher_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_teacher_wallet_teacher ON teacher_wallet(teacher_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
```

### Query Optimization
```javascript
// Use SELECT with JOIN instead of multiple queries
const { data } = await supabase
  .from('withdrawal_requests')
  .select(`
    *,
    teacher:teacher_id(profile:profiles(full_name, email))
  `)
  .eq('status', 'pending');
```

### Caching
```javascript
// Cache admin charges to reduce DB queries
const chargeCache = new Map();
const getCachedCharge = (teacherId) => {
  if (chargeCache.has(teacherId)) {
    return chargeCache.get(teacherId);
  }
  // Fetch from DB and cache
};
```

---

## 🚀 Deployment Checklist

- [ ] All dependencies installed (`npm install razorpay`)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Razorpay credentials (live keys)
- [ ] SSL/TLS enabled
- [ ] Error logging configured
- [ ] Monitoring set up
- [ ] Backup strategy enabled
- [ ] Rate limiting configured
- [ ] Load testing passed

---

## 📈 Scalability Notes

### Current Limitations
- In-memory OTP storage (use Redis for production)
- Single instance backend (use load balancer for scale)
- No caching layer (add Redis for frequently accessed data)

### Future Optimizations
1. Redis for session/cache management
2. Connection pooling for database
3. API rate limiting
4. Batch processing for withdrawals
5. Asynchronous payment verification
6. Event-driven architecture

---

## 🔍 Monitoring & Logging

### Key Metrics to Track
```
1. Payment Success Rate
   - Successful payments / Total attempts

2. Average Processing Time
   - Time from order creation to verification

3. Withdrawal Processing Time
   - Time from request to bank transfer

4. Withdrawal Success Rate
   - Completed / Total requests

5. System Uptime
   - API availability
   - Database availability
```

### Logging Strategy
```javascript
// Log all important events
console.log('🔵 Payment order created:', orderId);
console.log('✅ Payment verified:', paymentId);
console.log('🔴 Payment failed:', error);
console.log('📤 Withdrawal requested:', withdrawalId);
console.log('💰 Withdrawal approved:', withdrawalId);
```

---

## 📝 Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-06 | Initial release |

---

This completes the technical architecture documentation for the monetization system.
