# 📚 LearnEasy Booking Flow - Complete Guide

## Overview
The booking system is a two-sided marketplace where students discover teachers, make booking requests, and teachers confirm/decline them before meeting.

---

## 🎯 User Journeys

### **STUDENT JOURNEY**

#### Phase 1: Discovery
1. Student opens StudentDashboard → **Home Tab**
2. Views all available teachers with:
   - Name, specialization, rating, follower count
   - Price per call
   - "📅 Book Now" button
   - "❤️ Add to Favorites" button
3. Can search by teacher name or subject
4. Can filter by category (All, Math, Science, English, etc.)

#### Phase 2: Booking
1. Clicks "📅 Book" on desired teacher
2. **Booking Modal** appears showing:
   - Teacher avatar & name
   - Teacher's specialization & price
3. Student fills in:
   - **Select Date** - Calendar picker (defaults to today)
   - **Select Time** - 6 time slots (10:00, 12:00, 14:00, 16:00, 18:00, 20:00)
   - **Subject/Topic** * (required) - What they want to study
4. Booking Summary shows:
   - Teacher name
   - Date & time
   - Duration (60 minutes)
   - **Total Price** (calculated from teacher's price_per_call)
5. Student clicks "✅ Confirm Booking"
   - System creates booking record with **status: 'pending'**
   - Toast: "✅ Booking request sent!"
   - Modal closes
   - App auto-switches to **Bookings Tab**

#### Phase 3: Monitoring Bookings
1. Student navigates to **Bookings Tab**
2. Sees three sections:
   - **✅ Confirmed Sessions** - Teachers who accepted
     - Shows teacher name, subject, date/time
     - Has "📹 Join" button to start meeting
   - **⏳ Waiting for Confirmation** - Pending bookings
     - Shows teacher name, subject, date/time
     - Shows "Pending" badge in orange
---

## 💻 Code Implementation

### **StudentDashboard.js - Booking Modal**

The modal appears when user clicks "📅 Book" on a teacher card:

```javascript
if (showBookingModal && selectedTeacher) {
  return (
    <View>
      {/* Teacher Info Card */}
      <View style={styles.teacherInfoCard}>
        <Text>{selectedTeacher.profile.full_name}</Text>
        <Text>₹{selectedTeacher.price_per_call}/60 min</Text>
      </View>

      {/* Date Picker */}
      <View>
        <Text>📅 Select Date</Text>
        <TouchableOpacity onPress={() => /* show date picker */}>
          <Text>{bookingDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
      </View>

      {/* Time Buttons */}
      <View>
        <Text>🕐 Select Time</Text>
        {['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => (
          <TouchableOpacity
            key={time}
            onPress={() => setBookingTime(time)}
            style={[
              styles.timeBtn,
              bookingTime === time && styles.timeBtnActive
            ]}
          >
            <Text>{time}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Subject Input */}
      <TextInput
        placeholder="e.g., Algebra, Physics"
        value={bookingSubject}
        onChangeText={setBookingSubject}
      />

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text>Booking Summary</Text>
        <Text>Date: {bookingDate.toLocaleDateString()} at {bookingTime}</Text>
        <Text>Total: ₹{selectedTeacher.price_per_call}</Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity onPress={() => setShowBookingModal(false)}>
        <Text>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleBookTeacher}>
        <Text>✅ Confirm Booking</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### **StudentDashboard.js - Booking Creation**

```javascript
const handleBookTeacher = async () => {
  if (!bookingSubject.trim()) {
    Alert.alert('Error', 'Please enter subject');
    return;
  }

  setBookingInProgress(true);
  
  try {
    // Combine date and time
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const dateTime = new Date(bookingDate);
    dateTime.setHours(hours, minutes, 0);

    // Create booking in database
    await createBooking(
      studentId,
      selectedTeacher.id,
      dateTime,
      bookingSubject
    );

    Toast.show('✅ Booking request sent!');
    
    // Reset form
    setShowBookingModal(false);
    setBookingSubject('');
    
    // Refresh bookings list
    const updated = await getStudentBookings(studentId);
    setMyBookings(updated || []);
    
    // Go to bookings tab
    setActiveTab('bookings');
    
  } catch (error) {
    Alert.alert('Error', 'Failed to create booking');
  } finally {
    setBookingInProgress(false);
  }
};
```

### **StudentDashboard.js - Bookings Tab Display**

```javascript
if (activeTab === 'bookings') {
  const pending = myBookings.filter(b => b.status === 'pending');
  const confirmed = myBookings.filter(b => b.status === 'confirmed');
  const completed = myBookings.filter(b => b.status === 'completed');

  return (
    <ScrollView>
      {/* Confirmed Sessions */}
      {confirmed.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>✅ Confirmed Sessions</Text>
          {confirmed.map(booking => (
            <View key={booking.id} style={styles.bookingCard}>
              <View>
                <Text>{booking.teacher.profile.full_name}</Text>
                <Text>{booking.subject}</Text>
                <Text>📅 {new Date(booking.booked_date).toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.joinBtn}>
                <Text>📹 Join</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* Pending Bookings */}
      {pending.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>⏳ Waiting for Confirmation</Text>
          {pending.map(booking => (
            <View key={booking.id} style={styles.bookingCard}>
              <View>
                <Text>{booking.teacher.profile.full_name}</Text>
                <Text>{booking.subject}</Text>
                <Text>📅 {new Date(booking.booked_date).toLocaleString()}</Text>
              </View>
              <Text style={styles.pendingBadge}>Pending</Text>
            </View>
          ))}
        </>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📋 Completed</Text>
          {completed.map(booking => (
            <View key={booking.id} style={styles.bookingCard}>
              <Text>{booking.teacher.profile.full_name}</Text>
              <Text style={styles.completedBadge}>✓ Done</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
```

### **TeacherDashboard.js - Calls Tab (TODO)**

```javascript
// TODO: Wire up confirm/decline buttons
const handleConfirm = async (bookingId) => {
  try {
    const meetingId = generateMeetingId(); // Generate UUID
    await updateBookingStatus(bookingId, 'confirmed', meetingId);
    
    // Refresh bookings
    const updated = await getTeacherBookings(teacherId);
    setUpcomingBookings(updated);
  } catch (error) {
    Alert.alert('Error', 'Failed to confirm');
  }
};

const handleDecline = async (bookingId) => {
  try {
    await updateBookingStatus(bookingId, 'cancelled');
    
    // Refresh bookings
    const updated = await getTeacherBookings(teacherId);
    setUpcomingBookings(updated);
  } catch (error) {
    Alert.alert('Error', 'Failed to decline');
  }
};

// In Calls Tab render:
{upcomingBookings.map(booking => (
  <View key={booking.id} style={styles.bookingCard}>
    <View>
      <Text>{booking.student.profile.full_name}</Text>
      <Text>{booking.subject}</Text>
      <Text>📅 {new Date(booking.booked_date).toLocaleString()}</Text>
    </View>
    {booking.status === 'pending' ? (
      <>
        <TouchableOpacity onPress={() => handleConfirm(booking.id)}>
          <Text>✅ Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDecline(booking.id)}>
          <Text>❌ Decline</Text>
        </TouchableOpacity>
      </>
    ) : (
      <TouchableOpacity>
        <Text>📹 Start</Text>
      </TouchableOpacity>
    )}
  </View>
))}
```

---

## 🗄️ Database Schema

### **bookings Table**
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teacher_profiles(user_id) ON DELETE CASCADE,
  booked_date TIMESTAMP NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  meeting_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_teacher ON bookings(teacher_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### **Status Lifecycle**
```
pending
  ↓
confirmed → completed
  ↓
cancelled
```

---

## 🔄 Complete Timeline Example

**2:00 PM** - Student Books
- Student: Clicks "Book Now" on Math Teacher
- Student: Selects Dec 25, 14:00, "Algebra Problems"
- System: Creates booking with status='pending'
- Database: `INSERT INTO bookings VALUES (...)`
- UI: Booking appears in "Waiting for Confirmation"

**2:05 PM** - Teacher Sees Notification
- Teacher: Opens Calls Tab
- UI: Shows pending request with [Confirm] [Decline]
- Teacher: Clicks [Confirm]
- System: Calls updateBookingStatus(bookingId, 'confirmed')
- Database: `UPDATE bookings SET status='confirmed', meeting_id='...'`
- UI: Booking moves to "Upcoming Sessions" with [Start] button

**Real-time** - Student Sees Update
- Student: Refreshes dashboard
- UI: Booking moves to "Confirmed Sessions" with [Join] button

**Dec 25, 1:50 PM** - Meeting Time Approaches
- Teacher: Sees "5 min until Math - Algebra with Student Name"
- Teacher: Clicks [Start Meeting]
- System: Launches video call with generated meeting_id
- Both: Connected via VideoSDK

**After 60 minutes** - Session Ends
- System: Automatically marks booking as 'completed'
- UI: Both see in history section
- Teacher: Earns ₹X (teacher's price_per_call)

---

## 📊 Query Functions

### **Create Booking**
```javascript
async function createBooking(studentId, teacherId, bookedDate, subject) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      student_id: studentId,
      teacher_id: teacherId,
      booked_date: bookedDate.toISOString(),
      subject: subject,
      status: 'pending'
    }])
    .select();
  
  if (error) throw error;
  return data[0];
}
```

### **Get Student Bookings**
```javascript
async function getStudentBookings(studentId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      teacher:teacher_id(
        *,
        profile:user_id(full_name, email)
      )
    `)
    .eq('student_id', studentId)
    .order('booked_date', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### **Get Teacher Bookings**
```javascript
async function getTeacherBookings(teacherId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      student:student_id(
        *,
        profile:id(full_name, email)
      )
    `)
    .eq('teacher_id', teacherId)
    .order('booked_date', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### **Update Booking Status**
```javascript
async function updateBookingStatus(bookingId, newStatus, meetingId = null) {
  const update = { status: newStatus };
  if (meetingId) update.meeting_id = meetingId;
  
  const { data, error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', bookingId)
    .select();
  
  if (error) throw error;
  return data[0];
}
```

---

## ✅ Implementation Checklist

### **Phase 1: Core Booking (✅ DONE)**
- [x] StudentDashboard Home Tab with "Book Now" button
- [x] Booking Modal with form (date/time/subject)
- [x] Booking Summary card with price calculation
- [x] handleBookTeacher() creates booking in database
- [x] StudentDashboard Bookings Tab displays bookings
- [x] Bookings grouped by status (pending/confirmed/completed)
- [x] Toast notifications on booking creation
- [x] Styles for modal, buttons, cards

### **Phase 2: Teacher Actions (🔄 IN PROGRESS)**
- [ ] TeacherDashboard Calls Tab shows pending bookings
- [ ] [Confirm] [Decline] buttons functional
- [ ] updateBookingStatus() generates meeting_id
- [ ] Confirmed bookings show in both dashboards
- [ ] Teacher sees upcoming sessions

### **Phase 3: Meeting Integration (⏳ PENDING)**
- [ ] Meeting start using generated meeting_id
- [ ] [Join] / [Start] buttons launch video call
- [ ] Mark booking 'completed' after call ends
- [ ] Show meeting duration

### **Phase 4: Favorites & Reviews (⏳ PENDING)**
- [ ] Favorites table & functions
- [ ] Reviews table & ratings
- [ ] Teacher profile enhancements

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Booking not showing | Ensure `getStudentBookings()` is called after creation |
| Modal not opening | Check `setSelectedTeacher()` and `setShowBookingModal(true)` |
| Subject validation failing | Check `bookingSubject.trim()` logic |
| Price not calculated | Verify `selectedTeacher.price_per_call` exists |
| Status not updating | Add console logs to `updateBookingStatus()` |
| Database insert failing | Check Supabase RLS policies |

---

## 📝 Current Status

**What's Done:**
- ✅ StudentDashboard.js with complete booking UI
- ✅ Booking Modal with form
- ✅ Bookings Tab with status grouping
- ✅ All database.js query functions
- ✅ Integration of createBooking() and getStudentBookings()

**What's Next:**
1. Create bookings table in Supabase (if not done)
2. Wire TeacherDashboard Calls Tab buttons
3. Implement meeting_id generation
4. Add [Join]/[Start] meeting functionality

---

**Last Updated:** 2024-12-20  
**Status:** 60% Complete - Ready for next phase


2. Teacher clicks [Confirm]
   → updateBookingStatus(bookingId, 'confirmed')

3. updateBookingStatus() in database.js:
   → UPDATE bookings SET status='confirmed'
   → Generate meeting_id
   → Returns updated booking

4. Both dashboards refresh (useFocusEffect)
   → Status shows as "Confirmed"
   → [Join Meeting] button appears
```

---

## 🎬 **Key Components to Build**

### **1. BookTeacher Modal** (NEW)
- Date picker
- Time picker
- Subject input
- "Confirm Booking" button

### **2. Bookings Tab** (UPDATE)
- List of student's bookings
- Filter by status (Pending, Confirmed, Completed)
- Show teacher name, date, time, status
- "Join Meeting" button for confirmed bookings
- "Cancel" button for pending bookings

### **3. Calls Tab (Teacher)** (UPDATE)
- Show pending bookings with Confirm/Decline buttons
- Show confirmed bookings with Join button
- Show past bookings in history

### **4. StudentDashboard Card** (UPDATE)
- Add "Book Now" button to each teacher card

---

## ✅ **Implementation Checklist**

- [ ] Add "Book Now" button to teacher cards
- [ ] Create BookTeacherModal component
- [ ] Integrate createBooking() function
- [ ] Update Bookings Tab UI with real data
- [ ] Integrate getStudentBookings() function
- [ ] Update Calls Tab UI with confirm/decline
- [ ] Integrate updateBookingStatus() function
- [ ] Add useFocusEffect to refresh bookings
- [ ] Test end-to-end flow
