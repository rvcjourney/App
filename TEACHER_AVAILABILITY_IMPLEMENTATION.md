# 📚 Complete Teacher Availability & Booking System - Implementation Guide

## 🎯 Overview

Your app now has a **complete teacher availability and booking system** with the following features:

### ✅ What's Implemented

1. **Teacher Availability Management**
   - Teachers can set weekly recurring availability
   - Teachers choose which days they're available
   - Teachers set start & end times for each day
   - System auto-generates 30-day availability slots

2. **Student Booking System**
   - Students see available time slots for each teacher
   - Students can book specific slots
   - Booking status tracking (pending → confirmed → completed)

3. **Teacher Confirmation Flow**
   - Teachers receive pending booking requests
   - Teachers can confirm or decline bookings
   - Students get instant notifications

4. **Meeting Management**
   - Unique meeting IDs generated for each confirmed booking
   - Teachers can start meetings at scheduled time
   - Meeting logs track attendance and duration
   - Automatic status updates to completed

5. **Notifications System**
   - Real-time notifications for booking requests
   - Confirmations/decline notifications
   - Meeting reminders (5 minutes before)
   - Meeting completion notifications

---

## 🗄️ Database Schema

### New Tables Created

#### 1. `teacher_availability_schedule`
Stores teacher's weekly recurring availability
```sql
teacher_id (UUID)      -- Reference to teacher
day_of_week (0-6)      -- Sunday to Saturday
start_time (TIME)      -- e.g., "10:00"
end_time (TIME)        -- e.g., "17:00"
is_active (BOOLEAN)    -- Can disable a day
```

#### 2. `teacher_availability_slots`
Specific date/time slots generated from weekly schedule
```sql
teacher_id (UUID)           -- Reference to teacher
available_date (DATE)       -- Specific date
start_time (TIMESTAMP)      -- Exact start time
end_time (TIMESTAMP)        -- Exact end time
capacity (INT)              -- How many can book (usually 1)
booked_count (INT)          -- Current bookings
slot_status (TEXT)          -- 'available' | 'booked' | 'blocked'
```

#### 3. `notifications`
All notifications for users
```sql
user_id (UUID)              -- Who receives notification
notification_type (TEXT)    -- 'booking_request' | 'booking_confirmed' | etc.
title (TEXT)                -- Notification title
message (TEXT)              -- Notification message
booking_id (UUID)           -- Related booking (if any)
is_read (BOOLEAN)           -- Read status
created_at (TIMESTAMP)      -- When created
```

#### 4. `meeting_logs`
Meeting history and attendance tracking
```sql
booking_id (UUID)           -- Reference to booking
meeting_id (TEXT)           -- Unique meeting identifier
started_at (TIMESTAMP)      -- When meeting started
ended_at (TIMESTAMP)        -- When meeting ended
duration_minutes (INT)      -- Total duration
teacher_joined (BOOLEAN)    -- Did teacher join?
student_joined (BOOLEAN)    -- Did student join?
```

### Updated Tables

#### `bookings` - New Columns
```sql
availability_slot_id (UUID)     -- Which slot was booked
teacher_confirmed_at (TIMESTAMP) -- When teacher confirmed
meeting_started_at (TIMESTAMP)   -- When meeting started
meeting_ended_at (TIMESTAMP)     -- When meeting ended
```

---

## 🚀 Setup Steps

### Step 1: Run Database Migrations

1. Go to Supabase Dashboard
2. Click "SQL Editor" → "New Query"
3. Copy and run: [TEACHER_AVAILABILITY_SCHEMA.sql](TEACHER_AVAILABILITY_SCHEMA.sql)
4. Wait for success message

### Step 2: Update Backend .env

Add Supabase credentials to your `.env` file:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Install Dependencies

```bash
# Frontend - already installed
npm install

# Backend - add Supabase
cd backend
npm install @supabase/supabase-js
```

### Step 4: Add TeacherAvailability to Navigation

In `src/scenes/Teacher/TeacherStack.js` or `RootNavigator.js`:
```javascript
import TeacherAvailability from './TeacherAvailability';

// Add to stack navigator
<Stack.Screen 
  name="TeacherAvailability" 
  component={TeacherAvailability} 
/>
```

---

## 📱 User Workflows

### 👨‍🏫 TEACHER FLOW

#### 1. Set Availability
```
Settings Tab → "Set Availability" Button
  ↓
Select days they're available
  ↓
Set start & end times for each day
  ↓
Save → System generates 30 days of slots
```

#### 2. Receive Booking Requests
```
New booking comes in
  ↓
Notification: "New booking request"
  ↓
Calls Tab → "Pending Confirmations" section
  ↓
View student details, date, time, subject
  ↓
✅ Confirm or ❌ Decline
```

#### 3. Confirm Booking
```
Teacher clicks "✅ Confirm"
  ↓
Backend generates unique meeting_id
  ↓
Updates booking status to "confirmed"
  ↓
Student gets notification: "Booking confirmed"
  ↓
Meeting ID sent to both parties
```

#### 4. Start Meeting
```
At scheduled time
  ↓
Meeting start button appears
  ↓
Teacher clicks "Start Meeting"
  ↓
Fresh VideoSDK token generated
  ↓
Meeting begins with unique meeting_id
```

#### 5. End Meeting
```
Meeting completes
  ↓
Teacher clicks "End Meeting"
  ↓
Duration recorded
  ↓
Booking status updated to "completed"
  ↓
Meeting log created
```

### 👨‍🎓 STUDENT FLOW

#### 1. Browse Teachers
```
Home Tab
  ↓
See all available teachers
  ↓
Each teacher shows: name, rating, price, specializations
```

#### 2. Check Availability
```
Click "📅 Book" button on teacher
  ↓
Calendar opens showing teacher's available dates
  ↓
Select date
  ↓
See available time slots
  ↓
Pick time slot
```

#### 3. Confirm Booking
```
Enter topic/subject
  ↓
See booking summary with price
  ↓
Click "Confirm Booking"
  ↓
Status: "Pending" (waiting for teacher confirmation)
  ↓
Notification: "Booking request sent"
```

#### 4. Wait for Confirmation
```
Bookings Tab → "Pending" section
  ↓
Wait for teacher to confirm
  ↓
Notification when confirmed
  ↓
Moves to "Confirmed" section
```

#### 5. Join Meeting
```
At scheduled time
  ↓
"Join Meeting" button appears
  ↓
Click button
  ↓
Gets fresh VideoSDK token
  ↓
Joins meeting
```

---

## 💻 Key Functions

### Backend API Endpoints (server.js)

#### `/api/bookings/confirm` (POST)
Confirms a booking and generates meeting ID
```javascript
{
  bookingId: "uuid",
  teacherId: "uuid"
}
→ Returns: { success: true, meetingId, booking }
```

#### `/api/bookings/decline` (POST)
Declines a booking
```javascript
{
  bookingId: "uuid",
  reason: "string (optional)"
}
→ Returns: { success: true }
```

#### `/api/meetings/start` (POST)
Starts a meeting, generates token
```javascript
{
  bookingId: "uuid",
  teacherId: "uuid"
}
→ Returns: { success: true, meetingToken, meetingId }
```

#### `/api/meetings/end` (POST)
Ends meeting, records duration
```javascript
{
  bookingId: "uuid",
  duration: "number (minutes)"
}
→ Returns: { success: true }
```

#### `/api/notifications/send-reminder` (POST)
Sends 5-minute reminder
```javascript
{
  bookingId: "uuid"
}
→ Returns: { success: true }
```

### Frontend Database Functions (database.js)

#### Availability Management
```javascript
// Set weekly availability
setTeacherWeeklyAvailability(teacherId, dayOfWeek, startTime, endTime, isActive)

// Get weekly schedule
getTeacherWeeklyAvailability(teacherId)

// Generate slots for date range
generateAvailabilitySlots(teacherId, startDate, endDate, slotDurationMinutes)

// Get available slots for specific date
getTeacherAvailableSlots(teacherId, date)

// Book a slot
bookAvailabilitySlot(studentId, teacherId, slotId, subject)
```

#### Notification Management
```javascript
// Create notification
createNotification(userId, notificationType, title, message, bookingId)

// Get unread notifications
getUnreadNotifications(userId)

// Get all notifications
getAllNotifications(userId, limit)

// Mark as read
markNotificationAsRead(notificationId)

// Subscribe to real-time updates
subscribeToNotifications(userId, callback)
```

#### Meeting Management
```javascript
// Start meeting
startMeeting(bookingId, meetingId)

// End meeting
endMeeting(bookingId, meetingId)

// Get meeting history
getMeetingHistory(userId, isTeacher)
```

---

## 🔔 Notification Types

| Type | Receiver | Message |
|------|----------|---------|
| `booking_request` | Teacher | "New booking request from [Student]" |
| `booking_confirmed` | Student | "Your booking has been confirmed!" |
| `booking_cancelled` | Student | "Booking was declined" |
| `meeting_reminder` | Both | "Meeting starts in 5 minutes" |
| `meeting_started` | Both | "Session completed" |

---

## 📊 Status Lifecycle

### Booking Status Flow
```
pending
  ↓ (Teacher confirms)
confirmed
  ↓ (Teacher starts meeting)
ongoing
  ↓ (Meeting ends)
completed

OR

pending
  ↓ (Teacher declines)
cancelled
```

### Availability Slot Status
```
available  → booked  → blocked
```

---

## 🎨 UI Components Added

### 1. TeacherAvailability Screen
- Weekly day toggles
- Time picker for start/end times
- Real-time preview
- Save with validation
- Automatic slot generation

### 2. TeacherDashboard - Calls Tab
- **Pending Confirmations Section**
  - Shows pending bookings needing confirmation
  - Confirm button (green)
  - Decline button (red)
  - Notification badge with count

- **Upcoming Sessions Section**
  - Confirmed bookings ready to start
  - Join button for each session

### 3. StudentDashboard - Updated
- Available slots filtered by teacher availability
- Can only book available time slots
- Clear booking status indicators

---

## ⚙️ Configuration

### Environment Variables Needed

Backend (.env):
```
VIDEOSDK_API_KEY=your_key
VIDEOSDK_SECRET_KEY=your_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

Frontend (.env):
```
REACT_APP_AUTH_URL=http://localhost:3000
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your_anon_key
```

---

## 🧪 Testing Checklist

### Teacher Features
- [ ] Teacher can set weekly availability
- [ ] Availability slots generated for 30 days
- [ ] Pending bookings show in Calls tab
- [ ] Can confirm booking
- [ ] Can decline booking
- [ ] Notifications sent to student on confirm/decline
- [ ] Meeting can be started at scheduled time
- [ ] Meeting can be ended and duration recorded

### Student Features
- [ ] Can see available time slots
- [ ] Can book available slots only
- [ ] Cannot book unavailable slots
- [ ] Booking shows as "Pending" initially
- [ ] Receives notification when confirmed
- [ ] Can join confirmed meetings
- [ ] Meeting history shows completed sessions

### Notifications
- [ ] Booking request notification sent to teacher
- [ ] Confirmation notification sent to student
- [ ] Decline notification sent to student
- [ ] 5-minute reminders sent before meeting
- [ ] Completion notification sent to both

---

## 🔐 Security & Best Practices

1. **Supabase RLS Policies**
   - Teachers can only see their own availability
   - Students can only see others' availability
   - Notifications are user-specific

2. **Meeting Token Security**
   - Fresh tokens generated for each meeting
   - Tokens expire after 24 hours
   - Secret key never exposed in frontend

3. **Data Validation**
   - Booking times must be within availability slots
   - Status transitions follow defined flow
   - Duplicate bookings prevented

4. **Audit Trail**
   - Meeting logs record all sessions
   - Notifications timestamped
   - All actions logged with user ID

---

## 🐛 Troubleshooting

### Slots Not Generating
- Check teacher has weekly availability set
- Verify date range is correct
- Check Supabase quota

### Bookings Not Showing
- Verify availability slots exist for that date
- Check booking status (pending/confirmed)
- Refresh data with pull-to-refresh

### Notifications Not Arriving
- Check notifications table in Supabase
- Verify user_id is correct
- Check notification subscription

### Meetings Not Starting
- Verify meeting_id was created during confirmation
- Check VideoSDK credentials in backend
- Verify booking status is "confirmed"

---

## 📈 Future Enhancements

- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Email reminders before sessions
- [ ] Recurring bookings/subscriptions
- [ ] Payment integration
- [ ] Ratings and reviews system
- [ ] Student availability (reverse booking)
- [ ] Group sessions support
- [ ] Calendar sync (Google, Outlook)
- [ ] Video recording
- [ ] Session notes/homework

---

## 📞 Support

For detailed questions about specific components:
1. Check individual file comments
2. Review database.js for function signatures
3. Check server.js for API endpoint details
4. Review TeacherAvailability.js for UI implementation

---

**Last Updated:** January 27, 2026
**Status:** ✅ Complete & Ready for Testing
