# 🧪 Meeting Start Flow - Testing Checklist

## Setup Requirements
- [ ] Backend running at `http://localhost:3000`
- [ ] Database (Supabase) connected
- [ ] Test teacher account created
- [ ] Test student account created
- [ ] At least one booking exists with `status = 'confirmed'` and future date

---

## Testing Scenario

### Step 1: Create Test Data ✓
```sql
-- Verify a booking exists:
SELECT * FROM bookings 
WHERE status = 'confirmed' 
  AND booked_date > NOW()
LIMIT 1;
```

---

## Test Flow

### 1️⃣ Teacher Side - View Upcoming Sessions

**Test:** Teacher Dashboard Calls Tab
- [ ] Login as teacher
- [ ] Tap "Calls" tab at bottom
- [ ] See "📌 Scheduled Lectures" section
- [ ] See booking card with:
  - [ ] Student name
  - [ ] Subject
  - [ ] Time
  - [ ] Duration
  - [ ] Price
- [ ] No errors in console

**Expected:** ✅ Bookings display correctly

---

### 2️⃣ Teacher Side - Navigate to Meeting

**Test:** Click Booking Card
- [ ] Tap on a booking card
- [ ] Console shows: 
  ```
  Join component mounted
  Join route params: { booking: {...}, isTeacher: true }
  ```
- [ ] Should navigate to Join screen
- [ ] See video controls (camera, mic icons)
- [ ] See "Create a meeting" button

**Expected:** ✅ Navigation works, route params received

---

### 3️⃣ Teacher Side - Start Meeting

**Test:** Create & Join Meeting
- [ ] Tap "Create a meeting" button
- [ ] Console shows:
  ```
  🟡 [Join] Getting token...
  ✅ [Join] Token received
  🟡 [Join] Creating meeting with VideoSDK...
  ✅ [Join] Meeting created: meeting_XXXXX_abc
  🟡 [Join] Navigating to meeting screen...
  ```
- [ ] Should navigate to Meeting screen
- [ ] See video call interface

**Expected:** ✅ Meeting created, navigation successful

---

### 4️⃣ Teacher Side - Meeting Started

**Test:** Meeting Joined
- [ ] Should see meeting view (video/conference interface)
- [ ] Console shows:
  ```
  📞 Meeting joined! Teacher: true, BookingId: XXXXX
  📱 Notifying student about meeting start...
  ✅ Student notified successfully with meeting ID: meeting_XXXXX_abc
  ```

**Expected:** ✅ Backend call successful, student notified

---

### 5️⃣ Student Side - Receives Notification

**Test:** Student Gets Notified
- [ ] Login as student (in another device/emulator if possible)
- [ ] Should receive notification:
  ```
  📞 Class is Starting!
  Your class with [Teacher] is starting now!
  Meeting ID: meeting_XXXXX_abc. Copy this ID and join the meeting.
  ```

**Note:** If not receiving push notification, check:
- [ ] Backend logs for notification sending
- [ ] Supabase notifications table for record creation
- [ ] Continue anyway - meeting ID will show on dashboard

---

### 6️⃣ Student Side - Check Dashboard

**Test:** View Meeting ID on Dashboard
- [ ] Open Student Dashboard
- [ ] Go to "My Bookings" tab
- [ ] Find the booking from the teacher
- [ ] Should see:
  ```
  ✅ Confirmed Sessions
  
  👤 [Teacher Name]
  📚 [Subject]
  📅 [Date & Time]
  
  📞 Meeting ID: meeting_XXXXX_abc
  Tap to Copy
  
  [📹 Join]
  ```

**Expected:** ✅ Meeting ID visible on booking card

---

### 7️⃣ Student Side - Copy Meeting ID

**Test:** Copy to Clipboard
- [ ] Tap "Tap to Copy" text
- [ ] Should see Alert:
  ```
  Meeting ID
  meeting_XXXXX_abc
  Copy this ID to join the meeting
  
  [Close] [Copy]
  ```
- [ ] Tap "Copy"
- [ ] Should see Toast: `Meeting ID: meeting_XXXXX_abc`

**Expected:** ✅ Meeting ID copied

---

### 8️⃣ Student Side - Join Meeting

**Test:** Enter Meeting with Copied ID
- [ ] Open VideoSDK app (or back to Join screen)
- [ ] Paste the meeting ID
- [ ] Click "Join"
- [ ] Should enter the same meeting as teacher
- [ ] Should see teacher's video

**Expected:** ✅ Student successfully joins teacher's meeting

---

## Console Logs to Check

### Teacher Console (When Meeting Starts)
```
✅ Meeting joined! Teacher: true, BookingId: XXXXX
✅ Notifying student about meeting start...
✅ Student notified successfully with meeting ID: meeting_XXXXX_abc
```

### Backend Console (When Endpoint Called)
```
✅ Meeting started: XXXXX, Meeting ID: meeting_XXXXX_abc
```

### Database Check (Booking Record)
```sql
SELECT 
  id, 
  status, 
  meeting_id, 
  meeting_started_at 
FROM bookings 
WHERE id = 'XXXXX';

-- Should show:
-- status: 'ongoing'
-- meeting_id: 'meeting_XXXXX_abc'
-- meeting_started_at: NOW()
```

---

## Possible Issues & Fixes

### Issue: "Join component mounted" but params are undefined
**Cause:** Navigation params not being passed
**Fix:** Check TeacherDashboard line 437 has correct navigation code

### Issue: Meeting created but notification not sent
**Cause:** Backend endpoint error
**Fix:** 
- Check backend server is running
- Check `/api/meetings/start` endpoint
- Check Supabase service role key is correct

### Issue: Student doesn't see meeting ID on dashboard
**Cause:** 
1. Booking data not refreshed
2. Database not updated
**Fix:**
- [ ] Go back to dashboard and return to Bookings tab (triggers refresh)
- [ ] Check database if meeting_id is set in booking record

### Issue: "Cannot find 'RootNavigator'" navigation error
**Cause:** Navigation structure issue
**Fix:** Already fixed in previous update - should not occur

---

## Quick Debug Checklist

If something isn't working:

1. **Check Backend Running**
   ```
   curl http://localhost:3000/health
   ```
   Should return: `{ message: "Server is running" }`

2. **Check Supabase Connection**
   - Open Supabase dashboard
   - Go to "bookings" table
   - Verify test booking exists with status='confirmed'

3. **Check Console Logs**
   - Teacher side: Look for booking ID in logs
   - Backend: Look for endpoint call logs
   - Check for any error messages

4. **Check Network Tab**
   - In React Native Debugger, check Network tab
   - Should see POST request to `/api/meetings/start`
   - Response should have `success: true`

5. **Verify Database Updated**
   ```sql
   SELECT 
     id, 
     status, 
     meeting_id,
     meeting_started_at
   FROM bookings 
   WHERE student_id = 'STUDENT_ID'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - Should show meeting_id populated
   - Should show meeting_started_at is recent

---

## Success Criteria

✅ **All of the following must be true:**

- [ ] Teacher sees bookings in Calls tab
- [ ] Teacher can click and navigate to Join screen
- [ ] Teacher can create a meeting
- [ ] Meeting screen loads with video interface
- [ ] Console shows "Student notified successfully"
- [ ] Student receives notification (or sees it on dashboard)
- [ ] Student sees meeting ID on booking card
- [ ] Student can copy meeting ID
- [ ] Student can join using the copied ID
- [ ] Both teacher and student see each other in video call

---

## Notes

- If notifications don't arrive, the system still works - just check the dashboard
- Meeting ID appears when teacher joins, not when creating
- Student must be in the app or dashboard to see the meeting ID
- Refresh booking screen if meeting ID doesn't immediately appear

---

**Ready to test?** Follow the steps above and let me know if you encounter any issues! 🚀

