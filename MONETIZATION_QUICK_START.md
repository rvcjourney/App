# ⚙️ Monetization Quick Setup Checklist

## 🚀 Install & Configure (5 minutes)

### Backend Configuration
- [ ] Run `npm install razorpay` in `/backend` folder
- [ ] Add Razorpay keys to `.env`:
  ```
  RAZORPAY_KEY_ID=your_key_here
  RAZORPAY_KEY_SECRET=your_secret_here
  ```
- [ ] Restart backend server

### Database Setup
- [ ] Copy SQL from `MONETIZATION_SCHEMA.sql`
- [ ] Open Supabase SQL Editor
- [ ] Paste and run all queries
- [ ] Verify 7 new tables created:
  - admin_charges
  - payments
  - teacher_earnings
  - teacher_wallet
  - withdrawal_requests
  - razorpay_orders
  - payment_analytics

### Frontend Libraries
- [ ] Install: `npm install react-native-razorpay`

---

## 📱 Integration Steps (15 minutes)

### 1. Add Navigation Routes
Add to your main navigator (RootNavigator.js or equivalent):

```jsx
import AdminDashboard from './src/scenes/Admin/AdminDashboard';
import StudentCheckout from './src/scenes/Student/StudentCheckout';
import TeacherEarnings from './src/scenes/Teacher/TeacherEarnings';
import WithdrawalRequest from './src/scenes/Teacher/WithdrawalRequest';

// Add to your Stack
<Stack.Screen name="AdminDashboard" component={AdminDashboard} />
<Stack.Screen name="StudentCheckout" component={StudentCheckout} />
<Stack.Screen name="TeacherEarnings" component={TeacherEarnings} />
<Stack.Screen name="WithdrawalRequest" component={WithdrawalRequest} />
```

### 2. Update Student Booking Flow
In `StudentDashboard.js`, when student books a teacher:

```jsx
// After selecting slot, navigate to checkout
navigation.navigate('StudentCheckout', {
  booking: bookingObject,
  teacher: selectedTeacher,
  slot: selectedSlot,
  onPaymentSuccess: (paymentData) => {
    Toast.show('Booking confirmed!');
    // Refresh bookings
    loadBookings();
  }
});
```

### 3. Add Earnings Link in Teacher Dashboard
In `TeacherDashboard.js` settings section:

```jsx
<TouchableOpacity
  style={styles.settingItem}
  onPress={() => navigation.navigate('TeacherEarnings')}
>
  <View style={styles.settingIconContainer}>
    <MoneyBag width={20} height={20} fill="#5568FE" />
  </View>
  <Text style={styles.settingText}>My Earnings & Withdrawals</Text>
  <ChevronRight width={16} height={16} fill="#999999" />
</TouchableOpacity>
```

### 4. Add Admin Dashboard Access
In your app's role-based navigation:

```jsx
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single();

if (profile.role === 'admin') {
  // Show admin tab or screen
  navigation.navigate('AdminDashboard');
}
```

---

## 💰 Configure Charges (Admin)

### First Time Setup:
1. Login as admin
2. Navigate to Admin Dashboard
3. Go to "Charges" tab
4. For each teacher:
   - Click on teacher name
   - Set Base Charge (teacher's hourly rate, e.g., ₹600)
   - Set Admin Charge (e.g., ₹150)
   - Save
5. Charges will now apply to all future bookings

### Example Calculation:
```
Teacher Rate:        ₹600
Admin Charge:        ₹150
─────────────────────────
Student Pays:        ₹750

After Payment:
├─ Admin: ₹150
├─ Platform Fee: ₹100
└─ Teacher: ₹500
```

---

## 🧪 Test the Payment Flow

### Razorpay Test Cards:
Use these to test without real payments:

**Success:**
- Card: 4111 1111 1111 1111
- Exp: 12/25
- CVV: 123

**Failure:**
- Card: 5555 5555 5555 4444
- Exp: 12/25
- CVV: 123

### Test Steps:
1. ✅ Student books teacher
2. ✅ Checkout shows prices ✓
3. ✅ Click "Pay ₹750"
4. ✅ Razorpay opens
5. ✅ Enter test card details
6. ✅ Payment completes
7. ✅ Booking marked confirmed
8. ✅ Teacher wallet updated

---

## 💳 Connect Real Razorpay (Go Live)

### When Ready for Production:
1. Get live credentials from Razorpay
2. Update `.env` with live keys
3. Remove test cards
4. Enable real payments
5. Test with small amount first

---

## 👨‍💼 Admin Workflow

### Daily Tasks:

**Morning:**
1. Check pending withdrawals
2. Approve eligible requests
3. Review payment analytics

### Process Withdrawal:
1. Open Admin Dashboard
2. Go to "Withdrawals" tab
3. Review request details
4. Click "Approve"
5. System processes transfer
6. Teacher notified

---

## 📊 Monitor & Report

### Available Analytics:
- Total revenue collected
- Pending withdrawal amount
- Top earning teachers
- Transaction count

### View Analytics:
1. Admin Dashboard
2. "Analytics" tab
3. All stats displayed

---

## 🔍 Verify Everything Works

### Checklist:
- [ ] Backend server running (port 5000 or configured)
- [ ] All database tables created
- [ ] Razorpay credentials configured
- [ ] Navigation routes added
- [ ] UI components integrated
- [ ] Test booking workflow successful
- [ ] Payment verified
- [ ] Teacher wallet updated
- [ ] Admin can see withdrawal requests
- [ ] Withdrawal approval works

---

## 🆘 Common Issues & Fixes

### "Payment Gateway Not Responding"
**Fix:** Check Razorpay credentials in `.env`

### "Database Error"
**Fix:** Verify all tables created from SQL script

### "Can't See Charges"
**Fix:** Admin must set charges first in Admin Dashboard

### "Withdrawal Button Disabled"
**Fix:** Check balance ≥ ₹10,000 AND account age ≥ 1 month

### "Bank Transfer Fails"
**Fix:** Verify bank details IFSC code (must be 11 chars)

---

## 📞 Need Help?

Refer to:
1. `MONETIZATION_IMPLEMENTATION_GUIDE.md` - Detailed guide
2. Component files for implementation details
3. Backend APIs for endpoint details

---

## 📈 Next Steps

After setup works:
1. ✅ Optimize UI/UX based on user feedback
2. ✅ Add more payment methods
3. ✅ Set up automated tax reports
4. ✅ Create bulk withdrawal feature
5. ✅ Add payment analytics for teachers

---

**System Status: READY FOR USE** ✅

All components created and configured. Follow this checklist to activate!
