# Mobile App Migration Guide - Backend API Integration

## 📋 Overview

The mobile app has been restructured to follow **proper market-standard architecture**:

**OLD**: Mobile App → Direct Supabase Calls → Database
**NEW**: Mobile App → Backend API → Supabase → Database

This gives you **complete control** over business logic from the backend without needing to redeploy the app.

---

## 🚀 Key Changes

### **What Was Created**

1. **Backend API Layer** (`/backend/server.js`)
   - 20+ new endpoints for mobile app operations
   - All business logic moved to backend
   - Rate limiting and validation on server-side

2. **Mobile API Service** (`/src/api/mobileApi.js`)
   - Centralized API client for all backend calls
   - Handles requests/responses
   - Error handling

3. **Database Abstraction Layer** (`/src/database/databaseApi.js`)
   - Replaces direct Supabase calls
   - Same interface as old `database.js`
   - Calls backend API instead

---

## 📝 Migration Steps

### **Step 1: Update Imports in Mobile App Files**

**BEFORE** (Direct Supabase):
```javascript
import { supabase } from '../supabase';
import { getTeacherBookings, updateBookingStatus } from '../database/database';

// Direct Supabase calls
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('teacher_id', teacherId);
```

**AFTER** (Backend API):
```javascript
import databaseApi from '../database/databaseApi';

// Uses backend API
const bookings = await databaseApi.getTeacherBookings(teacherId);
```

### **Step 2: Replace Function Calls**

Update all files that import from `database/database.js` to use `databaseApi` instead:

**Files to Update:**
- `src/hooks/useStudentProfile.js`
- `src/hooks/useTeacherDashboard.js`
- `src/scenes/LoginScreen.js`
- `src/scenes/Student/StudentCheckout.js`
- `src/scenes/Teacher/TeacherAvailability.js`
- `src/scenes/TeacherDashboard.js`
- `src/scenes/StudentDashboard.js`
- And any other files calling database functions

### **Step 3: Update Function Names (if needed)**

All function names remain the same for backward compatibility:

```javascript
// These work exactly the same, but now call backend
getTeacherProfile(teacherId)
getStudentBookings(studentId)
createBooking(...)
updateBookingStatus(...)
getTeacherAvailability(...)
// ... etc
```

### **Step 4: Verify Environment Variables**

Ensure `.env` has API_URL configured:

**File**: `App/.env`
```env
REACT_APP_API_URL=http://localhost:3000      # Development
# REACT_APP_API_URL=https://api.yourserver.com # Production
```

---

## 📋 Complete API Reference

### **Profile Management**

```javascript
// Get user profile (Student or Teacher)
const profile = await databaseApi.getProfile(userId);

// Update user profile
await databaseApi.updateProfile(userId, {
  fullName: "New Name",
  gradeLevel: "10th",
  // ... other fields
});
```

### **Teacher Discovery**

```javascript
// Get all teachers
const teachers = await databaseApi.getAllTeachers();

// Search teachers
const results = await databaseApi.searchTeachers("Math");

// Get single teacher
const teacher = await databaseApi.getTeacherProfile(teacherId);

// Get teacher availability
const availability = await databaseApi.getTeacherWeeklyAvailability(teacherId);

// Set teacher availability
await databaseApi.setTeacherWeeklyAvailability(teacherId, [
  { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isActive: true },
  // ...
]);
```

### **Bookings**

```javascript
// Create booking
const booking = await databaseApi.bookAvailabilitySlot(
  studentId,
  teacherId,
  slotId,
  "Math Class"
);

// Get student bookings
const bookings = await databaseApi.getStudentBookings(studentId);

// Get teacher bookings
const bookings = await databaseApi.getTeacherBookings(teacherId);

// Update booking status
await databaseApi.updateBookingStatus(bookingId, 'confirmed');

// Get available slots
const slots = await databaseApi.getTeacherAvailableSlots(teacherId, '2026-03-20');
```

### **Favorites**

```javascript
// Add to favorites
await databaseApi.addToFavorites(studentId, teacherId);

// Remove from favorites
await databaseApi.removeFromFavorites(studentId, teacherId);

// Get favorites
const favorites = await databaseApi.getStudentFavorites(studentId);
```

### **Notifications**

```javascript
// Get notifications
const { notifications, unreadCount } = await databaseApi.getUnreadNotifications(userId);

// Mark as read
await databaseApi.markNotificationAsRead(notificationId);

// Subscribe to real-time notifications
const subscription = databaseApi.subscribeToNotifications(userId, (notifications) => {
  console.log('New notifications:', notifications);
});

// Unsubscribe
subscription.unsubscribe();
```

### **Payments & Earnings**

```javascript
// Create payment order
const order = await databaseApi.createPaymentOrder(
  bookingId,
  studentId,
  teacherId,
  500,      // base price
  50,       // admin charge
  550       // total
);

// Verify payment
const result = await databaseApi.verifyPayment({
  razorpayPaymentId: '...',
  razorpayOrderId: '...',
  razorpaySignature: '...',
  bookingId,
  // ...
});

// Get earnings
const earnings = await databaseApi.getTeacherEarnings(teacherId);

// Request withdrawal
await databaseApi.requestWithdrawal(teacherId, 5000, bankDetails);

// Get admin charges
const charges = await databaseApi.getAdminCharges(teacherId);
```

### **Video Meetings**

```javascript
// Get VideoSDK token
const token = await databaseApi.getVideoToken();

// Start meeting
await databaseApi.startMeeting(bookingId, meetingId, teacherId);

// End meeting
await databaseApi.endMeeting(bookingId, durationMinutes);
```

---

## 📂 File Structure

```
src/
├── api/
│   ├── api.js                    (Original API)
│   └── mobileApi.js              (NEW: Backend API client)
├── database/
│   ├── database.js               (OLD: Direct Supabase - can be removed)
│   └── databaseApi.js            (NEW: Abstraction layer)
├── hooks/
│   ├── useStudentProfile.js      (Update to use databaseApi)
│   └── useTeacherDashboard.js    (Update to use databaseApi)
└── scenes/
    ├── LoginScreen.js             (Update if needed)
    ├── Student/
    │   ├── EditStudentProfile.js  (Update if needed)
    │   └── StudentCheckout.js     (Update if needed)
    └── Teacher/
        ├── TeacherAvailability.js  (Update if needed)
        └── TeacherEarnings.js      (Update if needed)
```

---

## 🔄 Migration Checklist

- [ ] Backend APIs created and tested
- [ ] `src/api/mobileApi.js` created
- [ ] `src/database/databaseApi.js` created
- [ ] `.env` has `REACT_APP_API_URL` configured
- [ ] `src/hooks/useStudentProfile.js` updated
- [ ] `src/hooks/useTeacherDashboard.js` updated
- [ ] `src/scenes/LoginScreen.js` updated (if needed)
- [ ] `src/scenes/Student/StudentCheckout.js` updated
- [ ] `src/scenes/Teacher/TeacherAvailability.js` updated
- [ ] `src/scenes/TeacherDashboard.js` updated
- [ ] All other files using database functions updated
- [ ] Testing completed - all features working
- [ ] Production deployment ready

---

## 🧪 Testing Checklist

### **Profile Management**
- [ ] Get user profile works
- [ ] Update profile works
- [ ] Profile changes persist

### **Teacher Discovery**
- [ ] Get all teachers works
- [ ] Search teachers works
- [ ] Teacher profile loads with details
- [ ] Availability schedule displays

### **Bookings**
- [ ] Create booking succeeds
- [ ] Get bookings lists correctly
- [ ] Update booking status works
- [ ] Available slots display properly

### **Payments**
- [ ] Create payment order works
- [ ] Razorpay integration works
- [ ] Payment verification works
- [ ] Booking confirmed after payment

### **Earnings & Withdrawals**
- [ ] Get earnings calculation correct
- [ ] Withdrawal request works
- [ ] Earnings display properly

### **Notifications**
- [ ] Get notifications works
- [ ] Mark as read works
- [ ] Unread count accurate

### **Video Meetings**
- [ ] Get VideoSDK token works
- [ ] Start meeting works
- [ ] End meeting works

---

## 🐛 Troubleshooting

### **"API_URL not configured" Error**

**Solution**: Add to `.env`:
```env
REACT_APP_API_URL=http://localhost:3000
```

### **"Failed to fetch" Error**

**Check:**
1. Backend server is running: `npm start` in `/backend`
2. `API_URL` matches backend URL
3. CORS is enabled (it is by default)
4. Network connection is working

### **"Profile not found" Error**

**Check:**
1. User ID is correct
2. Profile exists in database
3. User is authenticated

### **Real-time Notifications Not Working**

**Note**: Current implementation uses polling (5-second intervals)
For true real-time, implement WebSocket in future version

---

## 📊 Before & After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Logic Location** | Mobile App | Backend ✅ |
| **Control** | None - must redeploy app | Full - change backend only ✅ |
| **Security** | DB credentials in frontend | Secured on backend ✅ |
| **Maintenance** | Complex - scattered logic | Simple - centralized ✅ |
| **Testing** | Hard to test | Easy to test ✅ |
| **Scalability** | Limited | Unlimited ✅ |
| **Code Quality** | Mixed concerns | Clear separation ✅ |

---

## 🚀 Deployment

### **Development**
```bash
# Terminal 1: Start backend
cd backend
npm start
# Runs on http://localhost:3000

# Terminal 2: Start mobile app
cd ..
npm start
# Uses REACT_APP_API_URL=http://localhost:3000
```

### **Production**
```env
# Update .env
REACT_APP_API_URL=https://api.yourserver.com

# Rebuild and deploy
npm run build
```

---

## 📚 Related Documentation

- **Backend Architecture**: See `BACKEND_ARCHITECTURE.md`
- **API Endpoints**: See backend startup logs
- **Admin Panel Setup**: See `LearningPlatform` README

---

## ✅ Status

- ✅ Backend APIs implemented
- ✅ Mobile API service created
- ✅ Database abstraction layer ready
- ⏳ Mobile app files need to be updated (see Migration Checklist)
- ⏳ Testing required

**Next Steps:**
1. Update mobile app files to use `databaseApi`
2. Run comprehensive testing
3. Deploy to production

---

## 💡 Key Benefits of This Architecture

1. **You Control the Logic** - Change business rules without app update
2. **Better Security** - Database credentials never reach the client
3. **Easier Debugging** - All logic in one place (backend)
4. **Better Performance** - Centralized caching and optimization
5. **Future-Proof** - Easy to add new features or modify existing ones
6. **Professional Grade** - Follows industry best practices

---

**Questions?** Check the backend logs or API documentation.
**Ready to deploy?** See Deployment section above.
