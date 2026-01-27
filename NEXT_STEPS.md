# 🎯 Next Steps - Your Action Items

## 📋 Summary

You now have a **fully functional booking UI** in StudentDashboard. Students can:
- ✅ See teachers
- ✅ Click "Book Now" 
- ✅ Fill in date/time/subject
- ✅ See booking summary
- ✅ Confirm booking

**However:** The bookings table doesn't exist in Supabase yet, so bookings can't be saved to the database.

---

## ⚡ **CRITICAL FIRST STEP: Create Bookings Table**

### **How to Create the Table (5 minutes)**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Login with your account
   - Select your project (LearnEasy)

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"
   - A blank SQL editor opens

3. **Copy the Table Creation SQL**
   - Open file: `DATABASE_SETUP.sql` in your project
   - Copy this SQL block:
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

4. **Paste into SQL Editor**
   - Paste the SQL into the query window
   - Click "Run" button
   - Wait for "Success" message

5. **Verify**
   - Go to "Tables" section in left sidebar
   - You should see `bookings` table listed
   - Click on it to verify columns: id, student_id, teacher_id, booked_date, subject, status, meeting_id

✅ **Done!** Now the booking system will work.

---

## 🔄 **PHASE 2: Wire Teacher Confirm/Decline Buttons** (10 minutes)

Once the bookings table exists, implement the teacher side:

### **File to Edit:** `src/scenes/TeacherDashboard.js`

### **What to Add:**

1. **In the Calls Tab section**, add confirm/decline buttons:

```javascript
// In Calls Tab render section
{pendingBookings.map(booking => (
  <View key={booking.id} style={styles.bookingCard}>
    <View>
      <Text style={styles.bookingTeacher}>{booking.student.profile.full_name}</Text>
      <Text style={styles.bookingSubject}>{booking.subject}</Text>
      <Text style={styles.bookingDate}>
        📅 {new Date(booking.booked_date).toLocaleString()}
      </Text>
    </View>
    
    {/* Confirm/Decline Buttons */}
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={styles.confirmBtn}
        onPress={() => handleConfirm(booking.id)}
      >
        <Text style={styles.confirmBtnText}>✅ Confirm</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.declineBtn}
        onPress={() => handleDecline(booking.id)}
      >
        <Text style={styles.declineBtnText}>❌ Decline</Text>
      </TouchableOpacity>
    </View>
  </View>
))}
```

2. **Add handler functions:**

```javascript
import { v4 as uuid } from 'uuid';
import { updateBookingStatus, getTeacherBookings } from '../../api/database';

const handleConfirm = async (bookingId) => {
  try {
    const meetingId = uuid(); // Generate unique meeting ID
    await updateBookingStatus(bookingId, 'confirmed', meetingId);
    
    Toast.show('✅ Booking confirmed!');
    
    // Refresh bookings list
    const updated = await getTeacherBookings(teacherId);
    setPendingBookings(updated.filter(b => b.status === 'pending'));
  } catch (error) {
    Alert.alert('Error', 'Failed to confirm booking');
  }
};

const handleDecline = async (bookingId) => {
  try {
    await updateBookingStatus(bookingId, 'cancelled');
    
    Toast.show('❌ Booking declined');
    
    // Refresh bookings list
    const updated = await getTeacherBookings(teacherId);
    setPendingBookings(updated.filter(b => b.status === 'pending'));
  } catch (error) {
    Alert.alert('Error', 'Failed to decline booking');
  }
};
```

3. **Add button styles:**

```javascript
const styles = StyleSheet.create({
  // ... existing styles ...
  
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  confirmBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
  },

  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },

  declineBtn: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
  },

  declineBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
});
```

---

## 🎥 **PHASE 3: Wire Meeting Buttons** (15 minutes)

After Phase 2 is working:

### **In StudentDashboard.js**

Replace the Join button with actual functionality:

```javascript
const handleJoinMeeting = async (booking) => {
  try {
    if (!booking.meeting_id) {
      Alert.alert('Error', 'Meeting not ready yet');
      return;
    }
    
    // Navigate to Join component with meeting details
    navigation.navigate(SCREEN_NAMES.Join, {
      meetingId: booking.meeting_id,
      name: studentName,
      isTeacher: false // Student role
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to join meeting');
  }
};
```

Update the Join button:
```javascript
<TouchableOpacity 
  style={styles.joinBtn}
  onPress={() => handleJoinMeeting(booking)}
>
  <Text style={styles.joinBtnText}>📹 Join</Text>
</TouchableOpacity>
```

### **In TeacherDashboard.js**

Similarly for teachers:

```javascript
const handleStartMeeting = async (booking) => {
  try {
    if (!booking.meeting_id) {
      Alert.alert('Error', 'Meeting not ready');
      return;
    }
    
    navigation.navigate(SCREEN_NAMES.Join, {
      meetingId: booking.meeting_id,
      name: teacherName,
      isTeacher: true // Teacher role
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to start meeting');
  }
};
```

---

## 💾 **PHASE 4: Make Favorites Persistent** (10 minutes)

Currently favorites only save in local state. To persist:

### **In StudentDashboard.js**

Replace the `toggleFavorite` function:

```javascript
const toggleFavorite = async (teacher) => {
  try {
    const isFavorite = favoriteTeachers.find(t => t.id === teacher.id);
    
    if (isFavorite) {
      // Remove from favorites
      await removeFromFavorites(studentId, teacher.id);
      setFavoriteTeachers(prev => prev.filter(t => t.id !== teacher.id));
      Toast.show('❤️ Removed from favorites');
    } else {
      // Add to favorites
      await addToFavorites(studentId, teacher.id);
      setFavoriteTeachers(prev => [...prev, teacher]);
      Toast.show('❤️ Added to favorites');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to update favorites');
  }
};

// Load favorites on mount
useEffect(() => {
  const loadFavorites = async () => {
    try {
      const favorites = await getStudentFavorites(studentId);
      setFavoriteTeachers(favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };
  
  if (studentId) loadFavorites();
}, [studentId]);
```

Import the functions:
```javascript
import { 
  getAllTeachers, 
  getStudentBookings,
  createBooking,
  addToFavorites,
  removeFromFavorites,
  getStudentFavorites
} from '../../api/database';
```

---

## 🎓 **LEARNING CHECKLIST**

After implementing these phases, you will understand:

- ✅ How to create Supabase tables
- ✅ How database queries work
- ✅ How to handle async operations
- ✅ How to manage state with useState/useEffect
- ✅ How to build two-sided marketplace UX
- ✅ How to pass data between screens
- ✅ How to handle errors and show user feedback
- ✅ How to refresh data after database changes

---

## 📚 **Documentation Reference**

| Document | Purpose |
|----------|---------|
| [BOOKING_FLOW_GUIDE.md](BOOKING_FLOW_GUIDE.md) | Complete booking flow explanation |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Current status & progress |
| [src/api/database.js](src/api/database.js) | All database query functions |
| [DATABASE_SETUP.sql](DATABASE_SETUP.sql) | SQL table definitions |

---

## 🚀 **Your Path Forward**

```
TODAY:
1. Create bookings table in Supabase ← START HERE (5 min)
2. Test that booking UI works (1 min)

NEXT SESSION:
3. Wire TeacherDashboard confirm/decline buttons (10 min)
4. Test teacher workflow (5 min)

AFTER THAT:
5. Wire meeting join buttons (15 min)
6. Test full end-to-end flow (10 min)
7. Make favorites persistent (10 min)

FUTURE:
8. Add push notifications
9. Implement reviews system
10. Add payment integration
11. Add chat messaging
```

---

## ❓ **FAQ**

**Q: What if I get an error when creating the table?**  
A: Check that the `profiles` and `teacher_profiles` tables exist first. These are referenced by the bookings table.

**Q: Why do I need a meeting_id?**  
A: The meeting_id is a unique identifier for the video call. It's used by VideoSDK to create the room.

**Q: Can students book past dates?**  
A: Yes, the current UI allows it. You might want to add date validation to prevent past bookings.

**Q: What if a teacher doesn't confirm?**  
A: The booking stays in 'pending' status. The student sees it in "Waiting for Confirmation". After a certain time (e.g., 24 hours), you could auto-decline it.

---

## 💡 **Pro Tips**

1. **Always check Supabase logs** when something doesn't work
2. **Use console.log()** to debug state changes
3. **Test on actual device** (network issues differ)
4. **Start with Phase 2** after table creation - it's the quickest win
5. **Ask for help** if stuck - the code is well-structured

---

## 🎉 **Success Criteria**

You'll know everything is working when:

1. ✅ Student books → Booking appears in database
2. ✅ Teacher sees booking → Clicks Confirm → Status changes
3. ✅ Student sees Confirmed status → [Join] button appears
4. ✅ Both can click Join/Start → Video call works
5. ✅ After call → Booking marked 'completed'
6. ✅ Favorites save to database → Persist across sessions

---

**Ready to build?** Start with **"Create Bookings Table"** above. You've got this! 🚀
