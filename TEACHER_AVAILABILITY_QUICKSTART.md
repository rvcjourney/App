# 🚀 QUICK START: Teacher Availability System

## ⚡ 5-Minute Setup

### 1. Run Database Migration (Supabase)
```bash
# Go to Supabase Dashboard → SQL Editor → New Query
# Copy entire contents of: TEACHER_AVAILABILITY_SCHEMA.sql
# Click Run
# Wait for ✅ Success
```

### 2. Update Backend
```bash
cd backend
npm install @supabase/supabase-js

# Update .env with:
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### 3. Add Navigation Route
In your navigation file, add:
```javascript
import TeacherAvailability from '../scenes/Teacher/TeacherAvailability';

// In stack navigator:
<Stack.Screen name="TeacherAvailability" component={TeacherAvailability} />
```

### 4. Restart Apps
```bash
npm start  # Frontend
node backend/server.js  # Backend
```

---

## 📋 User Guide

### For Teachers 👨‍🏫

1. **Set Availability:**
   - Open Settings Tab
   - Click "📅 Set Availability"
   - Toggle days ON/OFF
   - Set start & end times
   - Click "Save"
   - System auto-generates slots

2. **Confirm Bookings:**
   - Go to Calls Tab
   - See "Pending Confirmations" section
   - Click "✅ Confirm" to accept
   - Click "❌ Decline" to reject

3. **Start Meeting:**
   - At scheduled time
   - Meeting button appears
   - Click to start
   - Share meeting ID with student

---

### For Students 👨‍🎓

1. **Browse & Book:**
   - Home Tab → Click teacher
   - Click "📅 Book"
   - Select date from calendar
   - Select available time slot
   - Enter topic/subject
   - Click "Confirm Booking"

2. **Wait for Confirmation:**
   - Bookings Tab → "Pending"
   - Get notification when teacher confirms
   - Moves to "Confirmed" section

3. **Join Meeting:**
   - Confirmed section → Your booking
   - At scheduled time: "Join Meeting" button
   - Click to join

---

## 🔧 Files Changed

| File | Changes |
|------|---------|
| `TEACHER_AVAILABILITY_SCHEMA.sql` | NEW - Database tables |
| `src/database/database.js` | +25 new functions |
| `src/scenes/Teacher/TeacherAvailability.js` | NEW - Availability UI |
| `src/scenes/TeacherDashboard.js` | Updated Calls tab, added settings button |
| `backend/server.js` | +5 new API endpoints |
| `backend/package.json` | Added @supabase/supabase-js |

---

## 🎯 Key Features

✅ Weekly recurring availability schedule
✅ Automatic slot generation (30 days)
✅ Real-time booking confirmation
✅ Unique meeting IDs per session
✅ Notification system (pending → confirmed)
✅ Meeting logs with attendance tracking
✅ Status lifecycle (pending → confirmed → completed)

---

## 📞 Need Help?

1. Check database migration ran successfully (Supabase)
2. Verify .env variables are set
3. Check console logs for errors
4. Review TEACHER_AVAILABILITY_IMPLEMENTATION.md for detailed docs

---

**Status:** ✅ Ready to Deploy
