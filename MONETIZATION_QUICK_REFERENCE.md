# 🎯 Monetization - Quick Reference Card

## 📊 Payment Formula
```
₹750 = ₹600 (Teacher) + ₹150 (Admin)
                ↓
        Student Pays This
                ↓
    ├─ Admin: ₹150 (commission)
    ├─ Platform: ₹100 (fee)
    └─ Teacher: ₹500 (earn)
```

## 🗂️ Files Created

| File | Purpose | Size |
|------|---------|------|
| MONETIZATION_SCHEMA.sql | Database tables | 545 lines |
| AdminDashboard.js | Manage charges & withdrawals | 400 lines |
| StudentCheckout.js | Payment gateway | 450 lines |
| TeacherEarnings.js | View earnings & eligibility | 380 lines |
| WithdrawalRequest.js | Request withdrawal | 400 lines |
| backend/server.js | Payment APIs (+9 endpoints) | 300 lines |

## ⚡ Quick Setup (5 min)

```bash
1. npm install razorpay (in /backend)
2. Add RAZORPAY keys to .env
3. Run SQL from MONETIZATION_SCHEMA.sql
4. Add 4 new routes to navigator
5. Done! ✓
```

## 🔌 Main APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/payments/create-order | Create Razorpay order |
| POST | /api/payments/verify | Verify payment ↓ earn |
| POST | /api/admin/charges/set | Set admin charges |
| GET | /api/teacher/earnings/:id | Get wallet & earnings |
| POST | /api/teacher/withdrawal/request | Request to withdraw |
| POST | /api/admin/withdrawals/:id/approve | Approve withdrawal |

## 💰 Components Navigation

```
StudentDashboard
    ↓ (book teacher)
StudentCheckout
    ↓ (pay)
BookingConfirmed
    ↓
TeacherDashboard
    ↓ (settings)
TeacherEarnings
    ↓ (eligible?)
WithdrawalRequest
    ↓ (submit)
Pending
    ↓ (admin approves)
Bank Transfer ✓
```

## ✅ Withdrawal Conditions

Both must be TRUE:
- Balance ≥ ₹10,000 ✓
- Account Age ≥ 1 month ✓

## 🎯 Integration Checklist

- [ ] npm install razorpay
- [ ] .env: RAZORPAY_KEY_ID & SECRET
- [ ] SQL: Run MONETIZATION_SCHEMA.sql
- [ ] Navigator: Add 4 routes
- [ ] StudentDashboard: Link to Checkout
- [ ] TeacherDashboard: Link to Earnings
- [ ] Admin: Link to AdminDashboard
- [ ] Test: Book & pay with test card

## 🧪 Test Razorpay Card

```
Card: 4111 1111 1111 1111
Exp: 12/25
CVV: 123
Month: Any
Year: Any
```

## 📊 Database Tables

1. **admin_charges** - Teacher rates + admin fee
2. **payments** - All payment records
3. **teacher_earnings** - How money splits
4. **teacher_wallet** - Teacher balance
5. **withdrawal_requests** - Withdrawal queue
6. **razorpay_orders** - Razorpay logs
7. **payment_analytics** - Admin stats

## 🔑 Key Functions

```javascript
// Create payment order
POST /api/payments/create-order
→ Returns: orderId, amount, keyId

// Verify payment
POST /api/payments/verify
→ Signature check → Wallet update → Notification

// Check withdrawal eligibility
GET /api/teacher/earnings/{id}
→ Returns: can_withdraw true/false + reason

// Request withdrawal
POST /api/teacher/withdrawal/request
→ Creates request → Awaits admin approval

// Admin approves
POST /api/admin/withdrawals/{id}/approve
→ Marks processing → Notification sent
```

## 💾 Important Constants

| Field | Value | Notes |
|-------|-------|-------|
| Min Withdrawal | ₹10,000 | Minimum balance required |
| Wait Period | 1 month | Account age required |
| Admin Fee % | 20% | On each transaction |
| Platform Fee | ₹100 | Fixed per transaction |
| Bank Transfer | 2-3 days | After approval |
| Admin Response | 24-48 hrs | Expected approval time |

## 🚀 Test Workflow

### Test 1: Simple Payment
1. Student books teacher
2. Shows: ₹750 (₹600+₹150)
3. Click "Pay ₹750"
4. Use test card
5. Success → Booking confirmed ✓

### Test 2: Withdrawal
1. Ensure teacher balance ≥ ₹10,000
2. Account age ≥ 1 month
3. Click "Request Withdrawal"
4. Enter amount & bank details
5. Submit → Shows "Pending"
6. Admin approves → "Processing"
7. After 2-3 days → "Completed" ✓

## 📱 Component Props

**StudentCheckout:**
```
route.params.booking (id, student_id, teacher_id, subject)
route.params.teacher (id, profile, price_per_call)
route.params.slot (start_time, end_time)
route.params.onPaymentSuccess (callback)
```

**WithdrawalRequest:**
```
route.params.availableBalance (max amount)
route.params.teacherId (who withdrawing)
```

## 🎓 Documentation Files

| File | For | Length |
|------|-----|--------|
| MONETIZATION_COMPLETE_SUMMARY.md | Overview | 300 lines |
| MONETIZATION_QUICK_START.md | Setup | 250 lines |
| MONETIZATION_IMPLEMENTATION_GUIDE.md | Details | 400 lines |
| MONETIZATION_TECHNICAL_ARCHITECTURE.md | Deep dive | 500 lines |
| MONETIZATION_SCHEMA.sql | Database | 545 lines |

## 🔓 Security Checks

Before launch:
- [ ] Razorpay signature verified server-side
- [ ] Bank details encrypted in DB
- [ ] API keys in .env (not hardcoded)
- [ ] RLS policies on profiles
- [ ] Admin role verified for approvals
- [ ] All APIs logged

## 📞 Debugging

| Issue | Solution |
|-------|----------|
| Payment fails | Check RAZORPAY keys in .env |
| Can't see earnings | Check wallet table created in DB |
| Withdrawal disabled | Check balance ≥₹10,000 & age ≥1 month |
| Admin can't approve | Check user has 'admin' role |
| DB error | Verify all tables from SQL created |

## ✨ Production Checklist

- [ ] Live Razorpay credentials
- [ ] All tables created (7 total)
- [ ] Backend APIs tested
- [ ] All navigation routes added
- [ ] Test transaction successful
- [ ] Admin charges configured
- [ ] Error logging enabled
- [ ] Monitoring setup
- [ ] SSL/TLS enabled
- [ ] Backup strategy ready

---

**Status:** ✅ READY TO USE

Keep this card handy while integrating!
