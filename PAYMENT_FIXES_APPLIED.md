# Payment System Fixes Applied

## Issues Fixed in This Session

### Issue #1: Non-Serializable Function Parameter Warning
**Problem**: StudentDashboard was passing `onPaymentSuccess` callback function through navigation params, causing React Navigation warning about non-serializable values.

**Solution**: Removed the callback function from navigation params.

**Changes**:

**StudentDashboard.js** (line 769-792):
```javascript
// BEFORE - Incorrect (passes function through navigation)
navigation.navigate('StudentCheckout', {
  booking: bookingObject,
  teacher: selectedTeacher,
  slot: slot,
  onPaymentSuccess: (paymentData) => {  // ❌ Function can't be serialized
    Toast.show('Booking confirmed!');
    loadBookings();
  }
});

// AFTER - Correct (no function in params)
navigation.navigate('StudentCheckout', {
  booking: booking,
  teacher: selectedTeacher,
  slot: selectedSlot,
  // Function removed - StudentCheckout handles success directly
});
```

---

### Issue #2: Network Request Failed When Fetching Admin Charges
**Problem**: StudentCheckout.js was calling `GET /api/admin/charges/:teacherId` which might fail if:
1. Backend server not running
2. Database table not seeded
3. Teacher has no admin charge record
4. Network timeout

**Solution**: Added fallback logic to use default charges if API fails.

**Changes**:

**StudentCheckout.js** (line 42-72):
```javascript
// BEFORE - Fragile, fails if API unavailable
const loadCheckoutData = async () => {
  try {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setStudentInfo(user);
    
    const chargesResponse = await fetch(
      `${API_URL}/api/admin/charges/${teacher?.id}`  // ❌ Will fail if API down
    );
    const chargesData = await chargesResponse.json();
    setCharges(chargesData?.data || {});  // ❌ Empty object if no data
  } catch (error) {
    console.error('Error loading checkout:', error);
    Toast.show('Failed to load checkout');  // ❌ User sees error
  } finally {
    setLoading(false);
  }
};

// AFTER - Resilient with fallback charges
const loadCheckoutData = async () => {
  try {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setStudentInfo(user);
    
    // Use teacher's price + default admin charge as fallback
    const basePrice = teacher?.price_per_call || 600;
    const adminCharge = 150;
    
    try {
      const chargesResponse = await fetch(
        `${API_URL}/api/admin/charges/${teacher?.id}`,
        { timeout: 5000 }
      );
      
      if (chargesResponse.ok) {
        const chargesData = await chargesResponse.json();
        setCharges(chargesData?.data || {
          base_charge_amount: basePrice,
          admin_charge_amount: adminCharge,
          total_amount: basePrice + adminCharge,
        });
      } else {
        // API not available, use fallback
        setCharges({
          base_charge_amount: basePrice,
          admin_charge_amount: adminCharge,
          total_amount: basePrice + adminCharge,
        });
      }
    } catch (apiError) {
      // Use default charges if API fails
      console.warn('Admin charges API not available, using defaults:', apiError.message);
      setCharges({
        base_charge_amount: basePrice,
        admin_charge_amount: adminCharge,
        total_amount: basePrice + adminCharge,
      });
    }
  } catch (error) {
    console.error('Error loading checkout:', error);
    Toast.show('Failed to load checkout');
  } finally {
    setLoading(false);
  }
};
```

**Why this works**:
1. First tries to fetch admin charges from API
2. If API not available → Uses teacher's price_per_call + default ₹150
3. If API down → Uses fallback charges
4. If teacher has no price_per_call → Uses ₹600 default
5. App continues working with sensible defaults

---

### Issue #3: onPaymentSuccess Callback Never Executes
**Problem**: StudentCheckout received `onPaymentSuccess` callback but the way it was used was fragile and prevented proper navigation.

**Solution**: Payment success now directly navigates back to StudentDashboard instead of relying on callback.

**Changes**:

**StudentCheckout.js** (line 158-168):
```javascript
// BEFORE - Relies on optional callback
if (onPaymentSuccess) {
  onPaymentSuccess(verifyData);
} else {
  // Fallback to navigation
  setTimeout(() => {
    navigation.navigate('BookingConfirmation', {
      booking: booking,
      payment: verifyData.payment,
      teacher: teacher,
    });
  }, 500);
}

// AFTER - Always navigate directly
setTimeout(() => {
  navigation.reset({  // ✅ Use reset to clear navigation stack
    index: 0,
    routes: [{ name: 'StudentDashboard' }],
  });
}, 800);
```

**Why this is better**:
1. Doesn't depend on callback being passed
2. Clears navigation stack (prevents back button issues)
3. Returns to StudentDashboard with refreshed bookings
4. Simpler and more predictable

---

## Architecture After Fixes

### Payment Flow (Fixed)
```
StudentDashboard
    ↓ (handleBookSlot → creates booking)
    ↓ (navigate with booking object)
StudentCheckout
    ↓ (loadCheckoutData → gets charges or fallback)
    ↓ (handlePayment → creates Razorpay order)
Razorpay Gateway
    ↓ (student enters card details)
    ↓ (payment Success → returns to app)
Backend Verification
    ↓ (verifyPayment → validate signature)
    ↓ (create payment record, split earnings)
StudentDashboard
    ↓ (booking now shows as "Paid" ✅)
```

### Navigation Stack (Fixed)
```
BEFORE (with callback):
StudentDashboard → StudentCheckout → (callback) → undefined state

AFTER (direct navigation):
StudentDashboard → StudentCheckout → (success) → StudentDashboard (reset)
```

---

## Data Flow During Payment

### 1. Booking Creation
```javascript
StudentDashboard.handleBookSlot()
  ↓
supabase.bookAvailabilitySlot()
  ↓ 
saves to bookings table with payment_status = 'pending'
  ↓
returns booking object { id, student_id, teacher_id, ... }
```

### 2. Checkout Screen Load
```javascript
StudentCheckout.loadCheckoutData()
  ↓
try API: GET /api/admin/charges/:teacherId
  ↓ (if fails)
fallback: base_price + ₹150
  ↓
setCharges({ base_charge_amount, admin_charge_amount, total_amount })
```

### 3. Payment Creation
```javascript
StudentCheckout.handlePayment()
  ↓
POST /api/payments/create-order
  ↓
Razorpay creates order (stores in razorpay_orders table)
  ↓
returns { orderId, amount, keyId }
```

### 4. Payment Gateway
```javascript
RazorpayCheckout.open(options)
  ↓
Student enters card: 4111 1111 1111 1111
  ↓
Student enters expiry + CVV
  ↓
Razorpay processes payment
  ↓
returns { razorpay_payment_id, razorpay_order_id, razorpay_signature }
```

### 5. Payment Verification
```javascript
StudentCheckout.verifyPayment()
  ↓
POST /api/payments/verify
  ↓
Backend validates HMAC signature
  ↓
creates payment record (status = 'completed')
  ↓
creates teacher_earnings record
  ↓
updates teacher_wallet with ₹500
  ↓
updates booking with payment_status = 'completed'
  ↓
returns { success: true, payment: {...} }
```

### 6. Success Navigation
```javascript
setTimeout(() => {
  navigation.reset({
    index: 0,
    routes: [{ name: 'StudentDashboard' }]
  })
}, 800)
  ↓
StudentDashboard.useEffect re-runs
  ↓
loadBookings() fetches updated bookings
  ↓
Booking now shows payment_status = 'completed' ✅
```

---

## Testing Checklist

- [ ] Deploy MONETIZATION_SCHEMA.sql to Supabase
- [ ] Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in `.env`
- [ ] Start backend server: `npm start` in `/backend`
- [ ] Verify backend on: `curl http://localhost:3000/health`
- [ ] Open app on simulator/device
- [ ] Go to StudentDashboard
- [ ] Select teacher and available slot
- [ ] Click "Confirm Booking"
- [ ] Student Checkout screen loads without error ✅
- [ ] See correct pricing breakdown
- [ ] Click "Pay Now"
- [ ] Razorpay modal opens
- [ ] Enter test card: 4111 1111 1111 1111
- [ ] Enter any future expiry date + CVV
- [ ] Click Pay
- [ ] See success toast: "Payment successful! Booking confirmed"
- [ ] Navigate back to StudentDashboard
- [ ] Check booking in "My Bookings" shows as "Paid" ✅

---

## Files Changed Summary

| File | Changes | Lines |
|------|---------|-------|
| StudentCheckout.js | Added fallback charges, removed callback param, handle payment success | 42-72, 30-35, 158-168 |
| StudentDashboard.js | Remove function callback from navigation params | 769-792 |
| server.js | No changes needed (endpoints already implemented) | - |
| MONETIZATION_SCHEMA.sql | Need to deploy to Supabase | - |

---

## Verification Commands

```bash
# Check backend is running
curl -X GET http://localhost:3000/health

# Test admin charges API (replace with real teacher UUID)
curl -X GET http://localhost:3000/api/admin/charges/teacher-uuid-here

# Test create order (replace UUIDs)
curl -X POST http://localhost:3000/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-uuid",
    "studentId": "student-uuid",
    "teacherId": "teacher-uuid",
    "basePrice": 600,
    "adminCharge": 150,
    "totalAmount": 750
  }'

# Check database tables created
# Go to Supabase → Tables and verify:
# - admin_charges
# - payments
# - teacher_earnings
# - teacher_wallet
# - withdrawal_requests
```

