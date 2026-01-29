# 📊 System Flow Diagrams

## 1️⃣ TEACHER AVAILABILITY SETUP FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Teacher Opens Settings → "Set Availability"                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TeacherAvailability Screen Loads                            │
│ - Fetches current schedule (if exists)                      │
│ - Displays 7 days with toggle switches                      │
│ - Shows time pickers for start/end                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Teacher Customizes Schedule:                                │
│ - Enable/Disable Monday (e.g., OFF)                        │
│ - Enable Tuesday-Friday (ON, 10:00-17:00)                  │
│ - Enable Saturday (ON, 14:00-20:00)                        │
│ - Disable Sunday (OFF)                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Teacher Clicks "Save"                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: setTeacherWeeklyAvailability()                     │
│ - Upserts each day in teacher_availability_schedule        │
│ - Updates is_active, start_time, end_time                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: generateAvailabilitySlots()                        │
│ - Reads weekly schedule                                     │
│ - Creates slots for next 30 days                            │
│ - Each slot: 1 hour, capacity=1, status=available          │
│ - Inserts into teacher_availability_slots                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ Teacher notified: "Availability updated!"               │
│ Ready to receive bookings                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ STUDENT BOOKING FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Student Views Teacher in Home Tab                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Student Clicks "📅 Book" Button                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Booking Modal Opens:                                        │
│ 1. Shows teacher info (name, price, rating)               │
│ 2. Calendar picker appears                                 │
│ 3. Load available slots for selected date                  │
│    (via getTeacherAvailableSlots())                        │
│ 4. Show available times as buttons                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Student Selects:                                            │
│ - Date (e.g., Jan 28, 2026)                                │
│ - Time (e.g., 14:00-15:00)                                 │
│ - Subject/Topic (required text field)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Student Sees Summary:                                       │
│ - Teacher: John Smith                                       │
│ - Date/Time: Jan 28, 14:00-15:00                          │
│ - Subject: Mathematics - Trigonometry                      │
│ - Price: ₹500                                               │
│ - Duration: 60 min                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Student Clicks "Confirm Booking"                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: bookAvailabilitySlot()                            │
│ - Creates booking record                                   │
│ - Status: "pending"                                        │
│ - Links to availability_slot_id                            │
│ - Updates slot: booked_count++                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: createNotification()                               │
│ - Type: "booking_request"                                  │
│ - To: Teacher                                              │
│ - Message: "New booking from [Student] for [Topic]"       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ Student sees: "Booking request sent!"                   │
│ Moves to Bookings Tab → "Pending" section                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ TEACHER CONFIRMATION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Teacher Receives Notification:                              │
│ "New booking request from Alice for Math"                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Teacher Opens Calls Tab                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Sees "Pending Confirmations" Section:                      │
│ ┌──────────────────────────────────────────┐              │
│ │ Alice                                    │ [1]           │
│ │ 📅 Jan 28, 2026, 14:00                  │              │
│ │ Subject: Mathematics                     │              │
│ │ ⏱️ 60 min | 💵 ₹500                    │              │
│ │                                          │              │
│ │ [✅ Confirm] [❌ Decline]               │              │
│ └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Teacher Clicks "✅ Confirm"                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: /api/bookings/confirm                             │
│ - Generates unique meetingId                               │
│ - Updates booking.status = "confirmed"                     │
│ - Sets booking.meeting_id                                  │
│ - Records teacher_confirmed_at timestamp                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: createNotification()                               │
│ - Type: "booking_confirmed"                                │
│ - To: Student                                              │
│ - Message: "Your booking confirmed! Meeting at 14:00"     │
│ - Include meetingId for reference                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Booking Moves from:                                         │
│ "Pending Confirmations" → "Upcoming Sessions"              │
│                                                             │
│ Student Sees:                                              │
│ Bookings Tab → "Confirmed" section                         │
│ "Join Meeting" button appears                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4️⃣ MEETING START FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ At Scheduled Time (14:00):                                  │
│ Teacher and Student both see meeting is ready              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5 Minutes Before (13:55):                                  │
│ Backend sends reminder notifications to both              │
│ "Your meeting starts in 5 minutes"                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Teacher Clicks "Start Meeting" (or "Start Class")          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: /api/meetings/start                               │
│ - Generates fresh VideoSDK token (24h expiry)             │
│ - Updates booking.status = "ongoing"                       │
│ - Records meeting_started_at timestamp                     │
│ - Creates entry in meeting_logs table                      │
│ - Returns meeting token + meetingId                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Join meeting with:                               │
│ - meetingId (from booking.meeting_id)                     │
│ - token (fresh from backend)                              │
│ - userId (teacher)                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Student gets notification:                                  │
│ "Meeting is live! Click to join"                          │
│                                                             │
│ OR                                                          │
│                                                             │
│ Student clicks "Join Meeting" button                       │
│ Frontend requests fresh token from backend                │
│ Joins same meeting with meetingId                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ Both in same VideoSDK meeting!                          │
│ - Can see each other (video/audio)                        │
│ - Can chat                                                 │
│ - Meeting logs record both joined                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ MEETING END FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Teacher clicks "End Meeting" (after 60 minutes)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend: recording duration = 61 minutes (example)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: /api/meetings/end                                 │
│ - Updates booking.status = "completed"                     │
│ - Records meeting_ended_at timestamp                       │
│ - Updates meeting_logs.ended_at                            │
│ - Stores duration_minutes = 61                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend: sendNotifications() to both                        │
│ - Type: "meeting_completed"                                │
│ - Message: "Session completed. Duration: 61 min"          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Both kicked out of meeting                                  │
│ (VideoSDK handles disconnection)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Booking Status: "completed"                                │
│ Meeting History Updated                                    │
│                                                             │
│ Teacher's earnings updated                                 │
│ Student's session history recorded                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ NOTIFICATION FLOW (Real-time)

```
┌────────────────────────────────────────────────────────────┐
│ Event Happens (e.g., booking confirmed)                   │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ Backend creates notification in DB                         │
│ - user_id = recipient                                     │
│ - notification_type = "booking_confirmed"                │
│ - is_read = false                                         │
│ - created_at = now                                        │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ Option 1: Real-time Subscription (RECOMMENDED)            │
│                                                            │
│ Frontend subscribed via:                                   │
│ subscribeToNotifications(userId, callback)                │
│                                                            │
│ Supabase detects INSERT on notifications table            │
│ Triggers real-time event to all clients                   │
│ Callback fires immediately                                │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ Option 2: Polling (FALLBACK)                              │
│                                                            │
│ Frontend periodically calls:                              │
│ getUnreadNotifications(userId)                            │
│                                                            │
│ Fetches all where is_read = false                         │
│ Updates local state                                       │
│ Displays notification badge/toast                         │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ User sees notification:                                   │
│ 🔔 "Booking Confirmed!"                                   │
│    "Your session with John Smith is ready at 14:00"      │
│                                                            │
│ Can tap to navigate to booking                            │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ User clicks notification (optional)                        │
│ Frontend calls: markNotificationAsRead(notificationId)    │
│ Database updates: is_read = true                          │
└────────────────────────────────────────────────────────────┘
```

---

## 7️⃣ COMPLETE BOOKING STATUS JOURNEY

```
BOOKING LIFECYCLE:

1. CREATED
   ├─ status: "pending"
   ├─ meeting_id: null
   ├─ created_at: now
   └─ teacher_confirmed_at: null
        ↓ [Student creates booking]
        
2. WAITING FOR CONFIRMATION
   ├─ Status stays "pending"
   ├─ Teacher notified
   ├─ Shows in Teacher's "Pending Confirmations"
   ├─ Availability slot updated (booked_count++)
   └─ Student sees "Pending" badge
        ↓ [Teacher confirms]
        
3. CONFIRMED
   ├─ status: "confirmed"
   ├─ meeting_id: generated (e.g., "meeting_1674999600_abc123")
   ├─ teacher_confirmed_at: now
   ├─ Moves to "Upcoming Sessions" (Teacher)
   ├─ Moves to "Confirmed" (Student)
   ├─ "Join Meeting" button appears
   └─ Student notified
        ↓ [At scheduled time]
        
4. ONGOING (During Meeting)
   ├─ status: "ongoing"
   ├─ meeting_started_at: now
   ├─ meeting_logs created
   ├─ Token issued to both
   ├─ VideoSDK meeting active
   └─ Teacher & Student in meeting room
        ↓ [Teacher ends meeting]
        
5. COMPLETED
   ├─ status: "completed"
   ├─ meeting_ended_at: now
   ├─ duration_minutes: recorded
   ├─ Both notified: "Session complete"
   ├─ Meeting history updated
   ├─ Earnings credited
   └─ Can leave review/rating


CANCELLATION PATH (Alternative):

PENDING → [Teacher declines]
      ├─ status: "cancelled"
      ├─ Student notified: "Booking declined"
      ├─ Availability slot: booked_count--
      └─ Cannot be restored (new booking needed)
```

---

## 8️⃣ DATA RELATIONSHIPS

```
TEACHER
├── teacher_profiles
│   ├── id (PK)
│   ├── price_per_call
│   ├── specializations
│   └── ...
│
├── teacher_availability_schedule (Weekly)
│   ├── id (PK)
│   ├── teacher_id (FK)
│   ├── day_of_week (0-6)
│   ├── start_time
│   ├── end_time
│   └── is_active
│
├── teacher_availability_slots (Specific dates)
│   ├── id (PK)
│   ├── teacher_id (FK)
│   ├── available_date
│   ├── start_time
│   ├── slot_status
│   └── booked_count
│
├── bookings
│   ├── id (PK)
│   ├── teacher_id (FK)
│   ├── availability_slot_id (FK)
│   ├── meeting_id
│   └── teacher_confirmed_at
│
└── meeting_logs
    ├── id (PK)
    ├── booking_id (FK)
    ├── started_at
    ├── ended_at
    └── duration_minutes


STUDENT
├── student_profiles
│   ├── id (PK)
│   └── ...
│
├── bookings (as student_id)
│   ├── id (PK)
│   ├── student_id (FK)
│   ├── status (pending/confirmed/completed)
│   └── booked_date
│
└── notifications
    ├── id (PK)
    ├── user_id (FK) = student_id
    ├── booking_id (FK)
    └── notification_type
```

---

## Summary

This system creates a complete marketplace flow:
1. ✅ Teacher sets availability
2. ✅ System generates slots
3. ✅ Student discovers and books
4. ✅ Teacher approves/declines
5. ✅ Meeting ID generated
6. ✅ Both join at scheduled time
7. ✅ Meeting recorded and logged
8. ✅ Status updated to completed
9. ✅ Earnings credited
10. ✅ History maintained

All with real-time notifications and proper data validation!
