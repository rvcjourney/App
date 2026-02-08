import { supabase } from '../../supabase';

// ==========================================
// TEACHER QUERIES
// ==========================================

export const getTeacherProfile = async (teacherId) => {
  try {
    console.log('🔵 Fetching teacher profile:', teacherId);
    
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .eq('id', teacherId)
      .single();

    if (error) throw error;
    
    console.log('✅ Teacher profile fetched:', data);
    return data;
  } catch (error) {
    console.error('🔴 Error fetching teacher profile:', error);
    throw error;
  }
};

export const getAllTeachers = async () => {
  try {
    console.log('🔵 Fetching all teachers...');
    
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .order('rating', { ascending: false });

    if (error) {
      console.error('🔴 Error fetching teachers:', error);
      throw error;
    }
    
    console.log('✅ All teachers fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching teachers:', error);
    throw error;
  }
};

export const searchTeachers = async (query) => {
  try {
    console.log('🔵 Searching teachers:', query);
    
    // Get all teachers and filter on client side for better search
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(full_name)
      `)
      .order('rating', { ascending: false });

    if (error) throw error;
    
    // Filter by teacher name or specializations
    const filtered = data?.filter(teacher => {
      const name = teacher.profile?.full_name?.toLowerCase() || '';
      const specs = (teacher.specializations || '').toLowerCase();
      const q = query.toLowerCase();
      return name.includes(q) || specs.includes(q);
    }) || [];
    
    console.log('✅ Search results:', filtered.length);
    return filtered;
  } catch (error) {
    console.error('🔴 Search error:', error);
    throw error;
  }
};

export const updateTeacherProfile = async (teacherId, updates) => {
  try {
    console.log('🔵 Updating teacher profile:', teacherId);
    
    const { data, error } = await supabase
      .from('teacher_profiles')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', teacherId)
      .select();

    if (error) throw error;
    
    console.log('✅ Teacher profile updated');
    return data?.[0];
  } catch (error) {
    console.error('🔴 Update error:', error);
    throw error;
  }
};

/** Create a minimal teacher_profiles row (call after signup so edits work). */
export const createTeacherProfile = async (userId) => {
  try {
    const { error } = await supabase
      .from('teacher_profiles')
      .upsert({
        id: userId,
        price_per_call: 500,
        specializations: '',
        bio: '',
        rating: 4.8,
        followers: 0,
        experience_years: 0,
        updated_at: new Date(),
      }, { onConflict: 'id' });
    if (error) throw error;
    console.log('✅ Teacher profile row created');
  } catch (error) {
    console.error('🔴 createTeacherProfile error:', error);
    throw error;
  }
};

// ==========================================
// STUDENT QUERIES
// ==========================================

export const getStudentProfile = async (studentId) => {
  try {
    console.log('🔵 Fetching student profile:', studentId);
    
    const { data, error } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .eq('id', studentId)
      .single();

    if (error) throw error;
    
    console.log('✅ Student profile fetched');
    return data;
  } catch (error) {
    console.error('🔴 Error fetching student profile:', error);
    throw error;
  }
};

export const updateStudentProfile = async (studentId, updates) => {
  try {
    console.log('🔵 Updating student profile:', studentId);
    
    const { data, error } = await supabase
      .from('student_profiles')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', studentId)
      .select();

    if (error) throw error;
    
    console.log('✅ Student profile updated');
    return data?.[0];
  } catch (error) {
    console.error('🔴 Update error:', error);
    throw error;
  }
};

/** Create a minimal student_profiles row (call after signup so edits work). */
export const createStudentProfile = async (userId) => {
  try {
    const { error } = await supabase
      .from('student_profiles')
      .upsert({
        id: userId,
        preferred_language: 'English',
        grade_level: '',
        subjects_interested: '',
        updated_at: new Date(),
      }, { onConflict: 'id' });
    if (error) throw error;
    console.log('✅ Student profile row created');
  } catch (error) {
    console.error('🔴 createStudentProfile error:', error);
    throw error;
  }
};

/** Check if role-specific profile is complete (required before using app). */
export const isProfileComplete = async (role, userId) => {
  try {
    if (role === 'teacher') {
      const { data } = await supabase
        .from('teacher_profiles')
        .select('specializations, bio')
        .eq('id', userId)
        .maybeSingle();
      return !!(data?.specializations?.trim() || data?.bio?.trim());
    }
    if (role === 'student') {
      const { data } = await supabase
        .from('student_profiles')
        .select('grade_level, subjects_interested')
        .eq('id', userId)
        .maybeSingle();
      return !!(data?.grade_level?.trim() || data?.subjects_interested?.trim());
    }
    return false;
  } catch (error) {
    console.error('🔴 isProfileComplete error:', error);
    return false;
  }
};

// ==========================================
// BOOKINGS QUERIES
// ==========================================

export const createBooking = async (studentId, teacherId, scheduledTime, subject = 'Tutoring Session') => {
  try {
    console.log('🔵 Creating booking...');
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          student_id: studentId,
          teacher_id: teacherId,
          booked_date: scheduledTime,
          subject: subject,
          status: 'pending',
          duration_minutes: 60
        }
      ])
      .select();

    if (error) throw error;
    
    console.log('✅ Booking created:', data?.[0]?.id);
    return data?.[0];
  } catch (error) {
    console.error('🔴 Booking error:', error);
    throw error;
  }
};

export const getStudentBookings = async (studentId) => {
  try {
    console.log('🔵 Fetching student bookings...');
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        teacher_profile:teacher_id(full_name)
      `)
      .eq('student_id', studentId)
      .order('booked_date', { ascending: false });

    if (error) throw error;
    
    console.log('✅ Bookings fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching bookings:', error);
    throw error;
  }
};

export const getTeacherBookings = async (teacherId) => {
  try {
    console.log('🔵 Fetching teacher bookings...');
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('booked_date', { ascending: false });

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
      console.log('✅ Teacher bookings fetched: 0');
      return [];
    }

    const studentIds = [...new Set(bookings.map(b => b.student_id).filter(Boolean))];
    const studentNames = {};
    for (const sid of studentIds) {
      const { data: row } = await supabase.from('profiles').select('full_name').eq('id', sid).limit(1).maybeSingle();
      const name = (Array.isArray(row) ? row[0] : row)?.full_name || 'Student';
      studentNames[sid] = name;
    }

    const result = bookings.map(b => ({
      ...b,
      student: { full_name: studentNames[b.student_id] || 'Student' },
    }));
    console.log('✅ Teacher bookings fetched:', result.length);
    return result;
  } catch (err) {
    console.error('🔴 Error fetching teacher bookings:', err);
    throw err;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    console.log('🔵 Updating booking status:', status);
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select();

    if (error) throw error;
    
    console.log('✅ Booking status updated');
    return data?.[0];
  } catch (error) {
    console.error('🔴 Error updating booking:', error);
    throw error;
  }
};

// ==========================================
// FAVORITES QUERIES
// ==========================================

export const addToFavorites = async (studentId, teacherId) => {
  try {
    console.log('🔵 Adding to favorites...');
    
    const { data, error } = await supabase
      .from('favorites')
      .insert([
        {
          student_id: studentId,
          teacher_id: teacherId
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('⚠️ Already in favorites');
        return null;
      }
      throw error;
    }
    
    console.log('✅ Added to favorites');
    return data?.[0];
  } catch (error) {
    console.error('🔴 Favorites error:', error);
    throw error;
  }
};

export const removeFromFavorites = async (studentId, teacherId) => {
  try {
    console.log('🔵 Removing from favorites...');
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId);

    if (error) throw error;
    
    console.log('✅ Removed from favorites');
    return true;
  } catch (error) {
    console.error('🔴 Error removing favorite:', error);
    throw error;
  }
};

export const getStudentFavorites = async (studentId) => {
  try {
    console.log('🔵 Fetching favorites...');
    
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        teacher:teacher_id(
          id,
          price_per_call,
          rating,
          followers,
          specializations,
          profile:profiles(full_name)
        )
      `)
      .eq('student_id', studentId);

    if (error) throw error;
    
    console.log('✅ Favorites fetched:', data?.length);
    return data?.map(f => f.teacher) || [];
  } catch (error) {
    console.error('🔴 Error fetching favorites:', error);
    throw error;
  }
};

export const isFavorite = async (studentId, teacherId) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId)
      .single();

    return !error && data !== null;
  } catch (error) {
    return false;
  }
};

// ==========================================
// TEACHER AVAILABILITY QUERIES
// ==========================================

/**
 * Create or update teacher's weekly availability schedule
 * @param {string} teacherId - Teacher user ID
 * @param {number} dayOfWeek - 0 (Sunday) to 6 (Saturday)
 * @param {string} startTime - Time in HH:mm format (e.g., "10:00")
 * @param {string} endTime - Time in HH:mm format (e.g., "17:00")
 */
export const setTeacherWeeklyAvailability = async (teacherId, dayOfWeek, startTime, endTime, isActive = true) => {
  try {
    console.log('🔵 Setting teacher weekly availability...');
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('teacher_availability_schedule')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('day_of_week', dayOfWeek)
      .single();

    let data, error;
    
    if (existing) {
      // Update existing
      ({ data, error } = await supabase
        .from('teacher_availability_schedule')
        .update({
          start_time: startTime,
          end_time: endTime,
          is_active: isActive,
          updated_at: new Date()
        })
        .eq('id', existing.id)
        .select());
    } else {
      // Create new
      ({ data, error } = await supabase
        .from('teacher_availability_schedule')
        .insert([{
          teacher_id: teacherId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_active: isActive
        }])
        .select());
    }

    if (error) throw error;
    
    console.log('✅ Availability set:', data?.[0]);
    return data?.[0];
  } catch (error) {
    console.error('🔴 Error setting availability:', error);
    throw error;
  }
};

/**
 * Get teacher's weekly availability schedule
 */
export const getTeacherWeeklyAvailability = async (teacherId) => {
  try {
    console.log('🔵 Fetching teacher weekly availability...');
    
    const { data, error } = await supabase
      .from('teacher_availability_schedule')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });

    if (error) throw error;
    
    console.log('✅ Availability fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching availability:', error);
    throw error;
  }
};

/**
 * Create specific availability slots for a date range
 * Automatically generates slots based on teacher's weekly schedule
 */
export const generateAvailabilitySlots = async (teacherId, startDate, endDate, slotDurationMinutes = 60) => {
  try {
    console.log('🔵 Generating availability slots...');
    
    // Get teacher's weekly schedule
    const schedule = await getTeacherWeeklyAvailability(teacherId);
    
    if (!schedule || schedule.length === 0) {
      throw new Error('No weekly availability schedule found');
    }

    const slots = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    // Create schedule map for quick lookup
    const scheduleMap = {};
    schedule.forEach(s => {
      scheduleMap[s.day_of_week] = {
        startTime: s.start_time,
        endTime: s.end_time
      };
    });

    // Generate slots for each day in range
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const availSchedule = scheduleMap[dayOfWeek];

      if (availSchedule) {
        // Parse times
        const [startHour, startMin] = availSchedule.startTime.split(':').map(Number);
        const [endHour, endMin] = availSchedule.endTime.split(':').map(Number);

        let slotStart = new Date(current);
        slotStart.setHours(startHour, startMin, 0);

        let slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);

        const dayEnd = new Date(current);
        dayEnd.setHours(endHour, endMin, 0);

        // Create slots for this day
        while (slotEnd <= dayEnd) {
          slots.push({
            teacher_id: teacherId,
            available_date: current.toISOString().split('T')[0],
            start_time: slotStart.toISOString(),
            end_time: slotEnd.toISOString(),
            capacity: 1,
            booked_count: 0,
            is_booked: false,
            slot_status: 'available'
          });

          slotStart = new Date(slotEnd);
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);
        }
      }

      current.setDate(current.getDate() + 1);
    }

    // Insert all slots
    if (slots.length > 0) {
      const { data, error } = await supabase
        .from('teacher_availability_slots')
        .insert(slots)
        .select();

      if (error) throw error;
      
      console.log('✅ Slots generated:', data?.length);
      return data || [];
    }

    return [];
  } catch (error) {
    console.error('🔴 Error generating slots:', error);
    throw error;
  }
};

/**
 * Get available slots for a teacher on a specific date
 * Now includes booked slots so they can be displayed with different styling
 */
export const getTeacherAvailableSlots = async (teacherId, date) => {
  try {
    console.log('🔵 Fetching available slots for:', date);
    
    const { data, error } = await supabase
      .from('teacher_availability_slots')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('available_date', date)
      .in('slot_status', ['available', 'booked'])
      .order('start_time', { ascending: true });

    if (error) throw error;
    
    console.log('✅ Slots fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching slots:', error);
    throw error;
  }
};

/**
 * Get all available slots for a teacher in a date range
 * Now includes booked slots so they can be displayed with different styling
 */
export const getTeacherSlotsByDateRange = async (teacherId, startDate, endDate) => {
  try {
    console.log('🔵 Fetching slots in date range...');
    
    const { data, error } = await supabase
      .from('teacher_availability_slots')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('available_date', startDate)
      .lte('available_date', endDate)
      .in('slot_status', ['available', 'booked'])
      .order('start_time', { ascending: true });

    if (error) throw error;
    
    console.log('✅ Slots fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching slots:', error);
    throw error;
  }
};

/**
 * Book a specific availability slot
 * Creates booking immediately (no teacher confirmation needed)
 * Teacher gets notification about scheduled lecture
 */
export const bookAvailabilitySlot = async (studentId, teacherId, slotId, subject, hoursRequired = 1) => {
  try {
    console.log('🔵 Booking availability slot...');
    
    // Get slot details
    const { data: slot, error: slotError } = await supabase
      .from('teacher_availability_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError) throw slotError;

    // Check if slot is still available
    if (slot.slot_status !== 'available' || slot.booked_count >= slot.capacity) {
      throw new Error('Slot is no longer available');
    }

    // Create booking with status "pending" (will be confirmed after payment)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        student_id: studentId,
        teacher_id: teacherId,
        availability_slot_id: slotId,
        booked_date: new Date(slot.start_time),
        subject: subject,
        status: 'pending', // Pending until payment is verified
        duration_minutes: hoursRequired * 60,
        teacher_confirmed_at: null // Will be set after payment confirmation
      }])
      .select();

    if (bookingError) throw bookingError;

    // Update slot booking count
    const newBookedCount = slot.booked_count + 1;
    const isBooked = newBookedCount >= slot.capacity;

    const { error: updateError } = await supabase
      .from('teacher_availability_slots')
      .update({
        booked_count: newBookedCount,
        is_booked: isBooked,
        slot_status: isBooked ? 'booked' : 'available',
        updated_at: new Date()
      })
      .eq('id', slotId);

    if (updateError) throw updateError;

    // Don't create notification here - it will be created after payment verification
    console.log('✅ Slot booked:', booking?.[0]?.id);
    return booking?.[0];
  } catch (error) {
    console.error('🔴 Error booking slot:', error);
    throw error;
  }
};

// ==========================================
// NOTIFICATIONS QUERIES
// ==========================================

/**
 * Create a notification
 */
export const createNotification = async (userId, notificationType, title, message, bookingId = null) => {
  try {
    console.log('🔵 Creating notification...');
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        notification_type: notificationType,
        title: title,
        message: message,
        booking_id: bookingId,
        is_read: false
      }])
      .select();

    if (error) throw error;
    
    console.log('✅ Notification created:', data?.[0]?.id);
    return data?.[0];
  } catch (error) {
    console.error('🔴 Error creating notification:', error);
    throw error;
  }
};

/**
 * Get unread notifications for a user
 */
export const getUnreadNotifications = async (userId) => {
  try {
    console.log('🔵 Fetching unread notifications...');
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('✅ Notifications fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 */
export const getAllNotifications = async (userId, limit = 50) => {
  try {
    console.log('🔵 Fetching all notifications...');
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    console.log('✅ Notifications fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    console.log('🔵 Marking notification as read...');
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select();

    if (error) throw error;
    
    console.log('✅ Notification marked as read');
    return data?.[0];
  } catch (error) {
    console.error('🔴 Error marking notification:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (userId, callback) => {
  try {
    console.log('🔵 Subscribing to notifications for:', userId);
    
    const subscription = supabase
      .from(`notifications:user_id=eq.${userId}`)
      .on('INSERT', (payload) => {
        console.log('📬 New notification:', payload.new);
        callback(payload.new);
      })
      .subscribe();

    return subscription;
  } catch (error) {
    console.error('🔴 Error subscribing to notifications:', error);
    throw error;
  }
};

// ==========================================
// MEETING QUERIES
// ==========================================

/**
 * Start a meeting and log it
 */
export const startMeeting = async (bookingId, meetingId) => {
  try {
    console.log('🔵 Starting meeting...');
    
    // Update booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .update({
        meeting_id: meetingId,
        meeting_started_at: new Date(),
        status: 'ongoing'
      })
      .eq('id', bookingId)
      .select();

    if (bookingError) throw bookingError;

    // Create meeting log
    const { data: logData, error: logError } = await supabase
      .from('meeting_logs')
      .insert([{
        booking_id: bookingId,
        meeting_id: meetingId,
        started_at: new Date(),
        teacher_joined: false,
        student_joined: false
      }])
      .select();

    if (logError) throw logError;

    console.log('✅ Meeting started:', meetingId);
    return { booking: bookingData?.[0], log: logData?.[0] };
  } catch (error) {
    console.error('🔴 Error starting meeting:', error);
    throw error;
  }
};

/**
 * End a meeting
 */
export const endMeeting = async (bookingId, meetingId) => {
  try {
    console.log('🔵 Ending meeting...');
    
    // Update booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .update({
        meeting_ended_at: new Date(),
        status: 'completed'
      })
      .eq('id', bookingId)
      .select();

    if (bookingError) throw bookingError;

    // Update meeting log
    const { data: logData, error: logError } = await supabase
      .from('meeting_logs')
      .update({
        ended_at: new Date()
      })
      .eq('meeting_id', meetingId)
      .select();

    if (logError) throw logError;

    console.log('✅ Meeting ended:', meetingId);
    return { booking: bookingData?.[0], log: logData?.[0] };
  } catch (error) {
    console.error('🔴 Error ending meeting:', error);
    throw error;
  }
};

/**
 * Get teacher's call history for today only.
 * After the day ends, this returns empty so history is not visible on other days.
 */
export const getTeacherTodayCallHistory = async (teacherId) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed')
      .not('meeting_ended_at', 'is', null)
      .gte('meeting_ended_at', startOfToday.toISOString())
      .lte('meeting_ended_at', endOfToday.toISOString())
      .order('meeting_ended_at', { ascending: false });

    if (error) throw error;
    if (!bookings || bookings.length === 0) return [];

    const studentIds = [...new Set(bookings.map(b => b.student_id).filter(Boolean))];
    const studentNames = {};
    for (const sid of studentIds) {
      const { data: row } = await supabase.from('profiles').select('full_name').eq('id', sid).limit(1).maybeSingle();
      const name = (Array.isArray(row) ? row[0] : row)?.full_name || 'Student';
      studentNames[sid] = name;
    }

    return bookings.map(b => ({
      ...b,
      student: { full_name: studentNames[b.student_id] || 'Student' },
    }));
  } catch (err) {
    console.error('🔴 Error fetching today call history:', err);
    return [];
  }
};

/**
 * Get meeting history
 */
export const getMeetingHistory = async (userId, isTeacher = false) => {
  try {
    console.log('🔵 Fetching meeting history...');
    
    let query = supabase
      .from('meeting_logs')
      .select(`
        *,
        booking:booking_id(*)
      `);

    if (isTeacher) {
      query = query.eq('booking.teacher_id', userId);
    } else {
      query = query.eq('booking.student_id', userId);
    }

    const { data, error } = await query
      .order('started_at', { ascending: false });

    if (error) throw error;
    
    console.log('✅ Meeting history fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching meeting history:', error);
    throw error;
  }
};