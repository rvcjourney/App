# Teacher Availability & Student Booking System - Complete Setup

## ✅ System Ready!

Your teaching platform now has a complete availability-based booking system where:
- Teachers set their weekly availability
- System auto-generates specific time slots
- Students book directly from available slots
- Bookings are instantly CONFIRMED (no approval needed)

---

## 🎯 How It Works

### **Teacher Flow:**

```
1. Teacher logs in → Settings (gear icon in profile)
2. Clicks "📅 Set Availability"
3. Selects each day of week
4. Sets start & end time (e.g., Mon 10:00-17:00)
5. Clicks "Save" for each day
6. Final step: Clicks "🚀 Generate Slots (Next 30 Days)"
   → Creates 60-min booking slots for next 30 days
```

**Example Teacher Schedule:**
- Monday-Friday: 10:00 AM - 5:00 PM
- Saturday: 2:00 PM - 7:00 PM
- Sunday: OFF

Result: 42 available 1-hour slots for students to book!

---

### **Student Flow:**

```
1. Student logs in → Home tab
2. Searches for teacher
3. Clicks "📅 Book" button
4. Modal shows: All teacher's available slots (next 30 days)
5. Student selects a time slot
6. Enters subject/topic (e.g., "Algebra - Quadratic Equations")
7. Clicks "✅ Confirm Booking"
8. ✅ INSTANTLY CONFIRMED! 
   - No teacher approval needed
   - Both see the meeting in dashboard
   - Teacher already knew availability
```

---

## 📱 UI Components

### **Teacher - Set Availability Screen**

```
┌─────────────────────────────────┐
│ ← Back      My Availability      │
├─────────────────────────────────┤
│ 📅 Set Your Working Hours       │
│ Define when you're available... │
├─────────────────────────────────┤
│ Select Day:                      │
│ [Sun] [Mon] [Tue] [Wed] [Thu] ..│  ← with ✓ badges
├─────────────────────────────────┤
│ Monday Schedule                  │
│ Start Time: [10:00] ▼            │
│ End Time:   [17:00] ▼            │
│ [💾 Save Monday]                │
│ [🗑️ Remove Monday]              │
├─────────────────────────────────┤
│ Your Weekly Schedule:            │
│ Mon 10:00 - 17:00               │
│ Tue 10:00 - 17:00               │
│ Wed 10:00 - 17:00               │
│ Thu 10:00 - 17:00               │
│ Fri 10:00 - 17:00               │
│ Sat 14:00 - 19:00               │
├─────────────────────────────────┤
│ [🚀 Generate Slots (Next 30d)]  │
│ After saving, generate slots    │
│ so students can book sessions   │
└─────────────────────────────────┘
```

### **Student - Booking Modal Screen**

```
┌─────────────────────────────────┐
│ ← Back  Select Available Slot    │
├─────────────────────────────────┤
│ 👨‍🏫 John Smith                    │
│    Physics Tutor                │
│    Price: ₹500/60 min           │
├─────────────────────────────────┤
│ 📅 Available Slots (Next 30d)   │
│ ┌─────────────────────────────┐ │
│ │ Mon, Jan 28 • 10:00 AM   ✓  │ │  Selected
│ │ 60 minutes session          │ │
│ ├─────────────────────────────┤ │
│ │ Mon, Jan 28 • 14:00 PM      │ │
│ │ 60 minutes session          │ │
│ ├─────────────────────────────┤ │
│ │ Tue, Jan 29 • 10:00 AM      │ │
│ │ 60 minutes session          │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 📚 Subject/Topic *               │
│ [Algebra, Physics...          ] │
├─────────────────────────────────┤
│ Booking Summary:                │
│ Teacher: John Smith            │
│ Date & Time: Jan 28 • 10:00 AM │
│ Duration: 60 minutes           │
│ Total: ₹500                    │
├─────────────────────────────────┤
│ [Cancel]        [✅ Confirm]   │
└─────────────────────────────────┘
```

---

## 🗄️ Database Tables

The system uses these tables (already in TEACHER_AVAILABILITY_SCHEMA.sql):

### **`teacher_availability_schedule`** (Weekly recurring)
```
id          UUID
teacher_id  UUID (→ profiles.id)
day_of_week INT  (0=Sun, 1=Mon, ..., 6=Sat)
start_time  TIME (e.g., "10:00:00")
end_time    TIME (e.g., "17:00:00")
is_active   BOOLEAN
created_at  TIMESTAMP
```

**Example:**
```sql
INSERT INTO teacher_availability_schedule VALUES
('teacher-123', 1, '10:00', '17:00', true),  -- Mon
('teacher-123', 2, '10:00', '17:00', true),  -- Tue
('teacher-123', 6, '14:00', '19:00', true);  -- Sat
```

### **`teacher_availability_slots`** (Specific dates)
```
id              UUID
teacher_id      UUID
available_date  DATE
start_time      TIMESTAMP (e.g., "2026-01-28T10:00:00")
end_time        TIMESTAMP (e.g., "2026-01-28T11:00:00")
capacity        INT (default 1, slots per time)
booked_count    INT (how many booked)
is_booked       BOOLEAN
slot_status     TEXT ('available'|'booked'|'blocked')
```

**Example:**
```
When teacher saves Mon 10:00-17:00:
System generates slots:
- 2026-01-28 10:00-11:00 (available)
- 2026-01-28 11:00-12:00 (available)
- 2026-01-28 12:00-13:00 (available)
- 2026-01-28 13:00-14:00 (available)
... and so on for next 30 days
```

### **Updated `bookings` Table**
```
id                      UUID
student_id             UUID
teacher_id             UUID
availability_slot_id   UUID (← NEW! Links to teacher_availability_slots)
booked_date            TIMESTAMP
subject                TEXT
status                 TEXT ('pending'|'confirmed'|'ongoing'|'completed')
meeting_id             TEXT (generated when teacher starts meeting)
```

---

## 🚀 Setup Checklist

- [x] **Database Schema** - TEACHER_AVAILABILITY_SCHEMA.sql created
- [x] **Database Functions** - All CRUD functions in database.js
- [x] **TeacherAvailability Component** - UI for setting availability
- [x] **TeacherStack Navigation** - Added route to availability screen
- [x] **StudentDashboard Booking Modal** - Updated to show available slots
- [x] **bookAvailabilitySlot Function** - Creates confirmed bookings from slots
- [x] **Meeting Start Flow** - Notifies student automatically

---

## 🧪 Testing

### **Step 1: Teacher Sets Availability**

1. Login as teacher
2. Open teacher dashboard
3. Tap gear icon (settings) → Profile tab
4. Scroll down to "📅 Set Availability"
5. Select "Monday"
6. Set times: 10:00 AM - 5:00 PM
7. Click "💾 Save Monday"
8. Repeat for Tue-Fri, set Sat 2:00-7:00 PM
9. Click "🚀 Generate Slots (Next 30 Days)"
10. ✅ Slots generated! Check console logs

### **Step 2: Student Books Slot**

1. Logout & login as student
2. Open student dashboard
3. Search for teacher
4. Click "📅 Book"
5. See 30+ available time slots! 🎉
6. Select one (e.g., "Mon, Jan 28 • 10:00 AM")
7. Enter subject: "Algebra Basics"
8. Click "✅ Confirm Booking"
9. ✅ Booking CONFIRMED! Check "My Bookings" tab
10. Status should be "✅ Confirmed" (not pending)

### **Step 3: Start Meeting**

1. Teacher clicks booking
2. Clicks "Join Meeting"
3. Meeting starts → Teacher sees "Join with ID: meeting_xyz"
4. Backend sends notification to student
5. Student dashboard auto-updates with meeting ID
6. Student can copy ID and join from their side

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    TEACHER SIDE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Set Availability                                   │
│     TeacherAvailability Component                      │
│     ↓                                                  │
│  2. setTeacherWeeklyAvailability()                     │
│     teacher_availability_schedule ✓                    │
│     ↓                                                  │
│  3. generateAvailabilitySlots()                        │
│     teacher_availability_slots ✓ (42 slots)           │
│     ↓                                                  │
│  4. Start Meeting                                      │
│     TeacherDashboard → Join/Meeting                    │
│     ↓                                                  │
│  5. Meeting Started                                    │
│     POST /api/meetings/start                           │
│     → Update bookings.meeting_id                       │
│     → Send notification to student ✓                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    STUDENT SIDE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Browse Teachers                                    │
│     StudentDashboard                                   │
│     ↓                                                  │
│  2. Click "Book" Button                                │
│     ↓                                                  │
│  3. Load Available Slots                               │
│     getTeacherSlotsByDateRange()                       │
│     teacher_availability_slots ✓ (30 days)            │
│     ↓                                                  │
│  4. Select Slot + Subject                             │
│     Booking Modal                                      │
│     ↓                                                  │
│  5. Book Availability Slot                            │
│     bookAvailabilitySlot()                            │
│     → Insert into bookings (status='confirmed') ✓     │
│     → Update slot booked_count                        │
│     → Notify teacher ✓                                │
│     ↓                                                  │
│  6. Booking Confirmed!                                │
│     "My Bookings" tab shows "✅ Confirmed"            │
│     ↓                                                  │
│  7. Wait for Meeting                                  │
│     Real-time subscription                            │
│     When meeting_id appears → Copy & Join ✓           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Files Modified/Created

| File | Purpose | Status |
|------|---------|--------|
| `src/scenes/Teacher/TeacherAvailability.js` | Teacher availability UI | ✅ Complete |
| `src/scenes/StudentDashboard.js` | Updated booking modal | ✅ Updated |
| `src/database/database.js` | Availability functions | ✅ Complete |
| `src/navigators/screenNames.js` | Route names | ✅ Updated |
| `src/scenes/TeacherStack.js` | Navigation stack | ✅ Updated |
| `TEACHER_AVAILABILITY_SCHEMA.sql` | Database schema | ✅ Created |

---

## ❓ FAQs

### Q: What if teacher has no availability set?
**A:** Students see "😔 No available slots found. Teacher hasn't set their availability yet"

### Q: Can teacher edit availability?
**A:** Yes! Just select the day and click "Save Monday" again with new times

### Q: What about recurring vs one-time availability?
**A:** 
- `teacher_availability_schedule` = Weekly recurring (Mon 10-17, Fri 14-19)
- `teacher_availability_slots` = Specific dates generated from schedule

### Q: Can slots be for different durations?
**A:** Currently fixed at 60 minutes. Modify `generateAvailabilitySlots(teacherId, start, end, 60)` to support different durations

### Q: What if student books but then cancels?
**A:** Implement `cancelBooking()` function that:
   - Sets booking.status = 'cancelled'
   - Decrements slot.booked_count
   - If booked_count drops below capacity, mark slot as 'available'

### Q: Can teacher block specific slots?
**A:** Yes! Insert into `teacher_availability_slots` with `slot_status='blocked'` to hide from students

---

## 🐛 Testing Edge Cases

- [ ] Teacher with no availability set → Student sees "No slots"
- [ ] All slots for a time booked → Shows "Booked" status
- [ ] Teacher updates availability → New slots generated
- [ ] Student books → Booking instantly confirmed (not pending)
- [ ] Meeting starts → Student auto-notified with meeting ID
- [ ] Real-time subscription → Booking appears instantly on student dashboard

---

## 📞 Support

All database functions are in `src/database/database.js`:
- `setTeacherWeeklyAvailability()` - Save schedule
- `getTeacherWeeklyAvailability()` - Load schedule
- `generateAvailabilitySlots()` - Create slots
- `getTeacherAvailableSlots()` - Get specific date
- `getTeacherSlotsByDateRange()` - Get 30-day range
- `bookAvailabilitySlot()` - Create confirmed booking

Happy teaching! 🎉
