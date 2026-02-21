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
    if (role === 'super_admin') return true;
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
// SUPER ADMIN QUERIES (requires RLS allowing super_admin role)
// ==========================================

/** Get all users (profiles) for super admin. Requires RLS policy allowing super_admin to select all. */
export const getAllUsersForAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email_verified, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('🔴 getAllUsersForAdmin error:', error);
    throw error;
  }
};

/** Update a user's profile (full_name, role) by super admin. */
export const updateUserProfileForAdmin = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select();
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('🔴 updateUserProfileForAdmin error:', error);
    throw error;
  }
};

/** Get all bookings for super admin overview. */
export const getAllBookingsForAdmin = async () => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booked_date', { ascending: false });
    if (error) throw error;
    if (!bookings?.length) return [];
    const studentIds = [...new Set(bookings.map(b => b.student_id).filter(Boolean))];
    const teacherIds = [...new Set(bookings.map(b => b.teacher_id).filter(Boolean))];
    const allIds = [...new Set([...studentIds, ...teacherIds])];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', allIds);
    const nameMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p.full_name || '—' }), {});
    return bookings.map(b => ({
      ...b,
      student_name: nameMap[b.student_id] || '—',
      teacher_name: nameMap[b.teacher_id] || '—',
    }));
  } catch (error) {
    console.error('🔴 getAllBookingsForAdmin error:', error);
    throw error;
  }
};

/** Get teacher profile by userId (for super admin edit). */
export const getTeacherProfileForAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('🔴 getTeacherProfileForAdmin error:', error);
    throw error;
  }
};

/** Update teacher profile by userId (super admin). */
export const updateTeacherProfileForAdmin = async (userId, updates) => {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('teacher_profiles')
      .upsert({ id: userId, ...payload }, { onConflict: 'id' })
      .select();
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('🔴 updateTeacherProfileForAdmin error:', error);
    throw error;
  }
};

/** Get student profile by userId (for super admin edit). */
export const getStudentProfileForAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('🔴 getStudentProfileForAdmin error:', error);
    throw error;
  }
};

/** Update student profile by userId (super admin). */
export const updateStudentProfileForAdmin = async (userId, updates) => {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('student_profiles')
      .upsert({ id: userId, ...payload }, { onConflict: 'id' })
      .select();
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('🔴 updateStudentProfileForAdmin error:', error);
    throw error;
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
export const endMeeting = async (bookingId, meetingId, duration = 60) => {
  try {
    console.log('🔵 Ending meeting... BookingId:', bookingId);
    
    // Call backend endpoint to handle meeting completion
    // This will:
    // 1. Update booking status to 'completed'
    // 2. Update meeting log with end time
    // 3. Change earnings status from 'pending' to 'completed'
    // 4. Update teacher's wallet with earned amount
    
    const backendUrl = process.env.REACT_APP_AUTH_URL || 'http://192.168.0.130:3000';
    console.log('🌐 Backend URL:', backendUrl);
    
    const response = await fetch(`${backendUrl}/api/meetings/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: bookingId,
        duration: duration
      })
    });

    console.log('📤 Backend response status:', response.status);
    
    const data = await response.json();
    console.log('📨 Backend response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Meeting ended successfully:', data.bookingId);
      console.log('💰 Teacher earnings updated and wallet credited');
      return { success: true, bookingId: data.bookingId };
    } else {
      console.error('⚠️ Failed to end meeting - Error:', data.error);
      throw new Error(data.error || 'Failed to end meeting');
    }
  } catch (error) {
    console.error('🔴 Error ending meeting:', error.message);
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

/**
 * Calculate teacher earnings for different time periods
 * Uses teacher_earnings table which has actual amounts after deductions
 */
export const getTeacherEarnings = async (teacherId) => {
  try {
    console.log('🔵 Fetching teacher earnings...');
    
    // Get completed earnings only (not pending)
    const { data: earnings, error } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }); // Use created_at as fallback

    if (error) {
      console.error('🔴 Error querying earnings:', error);
      throw error;
    }

    console.log('✅ Earnings fetched from DB:', earnings?.length || 0, 'records');

    // Transform earnings array to add teacher_earn calculation
    const earningsWithCalculation = (earnings || []).map(e => ({
      ...e,
      teacher_earn: parseFloat(e.total_collected || 0) - parseFloat(e.admin_deduction || 0) - parseFloat(e.platform_fee || 0),
    }));

    if (!earningsWithCalculation || earningsWithCalculation.length === 0) {
      console.log('✅ No completed earnings found');
      return { 
        weekly: [{ day: 'Mon', amount: 0 }, { day: 'Tue', amount: 0 }, { day: 'Wed', amount: 0 }, { day: 'Thu', amount: 0 }, { day: 'Fri', amount: 0 }, { day: 'Sat', amount: 0 }, { day: 'Sun', amount: 0 }],
        monthly: [{ month: 'Week 1', amount: 0 }, { month: 'Week 2', amount: 0 }, { month: 'Week 3', amount: 0 }, { month: 'Week 4', amount: 0 }, { month: 'Week 5', amount: 0 }],
        yearly: [{ month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 }, { month: 'Mar', amount: 0 }, { month: 'Apr', amount: 0 }, { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 }, { month: 'Jul', amount: 0 }, { month: 'Aug', amount: 0 }, { month: 'Sep', amount: 0 }, { month: 'Oct', amount: 0 }, { month: 'Nov', amount: 0 }, { month: 'Dec', amount: 0 }],
        totalEarned: 0, 
        pendingCount: 0 
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Initialize data structures
    const weeklyData = {};
    const monthlyData = {};
    const yearlyData = {};

    // Calculate earnings from completed sessions
    earningsWithCalculation.forEach(earning => {
      // Use completed_at if available, otherwise use created_at
      const earningDate = earning.completed_at ? new Date(earning.completed_at) : new Date(earning.created_at);
      const amount = parseFloat(earning.teacher_earn) || 0;

      console.log('Processing earning:', { date: earningDate, amount, status: earning.status });

      // Weekly: Last 7 days
      const daysDiff = Math.floor((now - earningDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7 && daysDiff >= 0) {
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][earningDate.getDay()];
        weeklyData[dayName] = (weeklyData[dayName] || 0) + amount;
      }

      // Monthly: Current month by week
      if (earningDate.getFullYear() === currentYear && earningDate.getMonth() === currentMonth) {
        const weekOfMonth = Math.ceil(earningDate.getDate() / 7);
        const weekKey = `Week ${weekOfMonth}`;
        monthlyData[weekKey] = (monthlyData[weekKey] || 0) + amount;
      }

      // Yearly: Current year by month
      if (earningDate.getFullYear() === currentYear) {
        const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][earningDate.getMonth()];
        yearlyData[monthName] = (yearlyData[monthName] || 0) + amount;
      }
    });

    // Format weekly data (ensure all 7 days)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const formattedWeekly = days.map(day => ({
      day,
      amount: Math.round((weeklyData[day] || 0) * 100) / 100
    }));

    // Format monthly data (weeks 1-5)
    const formattedMonthly = [];
    for (let i = 1; i <= 5; i++) {
      formattedMonthly.push({
        month: `Week ${i}`,
        amount: Math.round(((monthlyData[`Week ${i}`] || 0) * 100) / 100)
      });
    }

    // Format yearly data (all months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedYearly = months.map(month => ({
      month,
      amount: Math.round(((yearlyData[month] || 0) * 100) / 100)
    }));

    // Get pending earnings count
    const { count: pendingCount } = await supabase
      .from('teacher_earnings')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('status', 'pending');

    const totalEarned = earningsWithCalculation.reduce((sum, e) => sum + (parseFloat(e.teacher_earn) || 0), 0);

    console.log('✅ Earnings calculated:', { totalEarned, pendingCount });
    return {
      weekly: formattedWeekly,
      monthly: formattedMonthly,
      yearly: formattedYearly,
      totalEarned: Math.round(totalEarned * 100) / 100,
      pendingCount: pendingCount || 0
    };
  } catch (error) {
    console.error('🔴 Error fetching earnings:', error);
    throw error;
  }
};

/**
 * Get teacher's today earnings (completed sessions only)
 */
export const getTeacherTodayEarnings = async (teacherId) => {
  try {
    console.log('🔵 Fetching today earnings...');
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    console.log('Date range:', startOfToday.toISOString(), '-', endOfToday.toISOString());

    // Get completed earnings for today (check both completed_at and created_at)
    const { data: earnings, error } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed');

    if (error) {
      console.error('🔴 Error querying today earnings:', error);
      throw error;
    }

    // Filter in JavaScript to handle null completed_at
    const todayCompletedEarnings = (earnings || []).filter(e => {
      const checkDate = e.completed_at ? new Date(e.completed_at) : new Date(e.created_at);
      return checkDate >= startOfToday && checkDate <= endOfToday;
    });

    console.log('Today completed earnings:', todayCompletedEarnings.length);

    const totalAmount = todayCompletedEarnings.reduce((sum, e) => sum + (parseFloat(e.total_collected || 0) - parseFloat(e.admin_deduction || 0) - parseFloat(e.platform_fee || 0)), 0);
    const sessionsCount = todayCompletedEarnings.length;

    // Get pending earnings for today (sessions booked but not yet completed) - check created_at
    const { data: pendingEarnings } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'pending');

    // Filter in JavaScript
    const todayPendingEarnings = (pendingEarnings || []).filter(e => {
      const createdDate = new Date(e.created_at);
      return createdDate >= startOfToday && createdDate <= endOfToday;
    });

    console.log('Today pending earnings:', todayPendingEarnings.length);

    const pendingAmount = todayPendingEarnings.reduce((sum, e) => sum + (parseFloat(e.total_collected || 0) - parseFloat(e.admin_deduction || 0) - parseFloat(e.platform_fee || 0)), 0);
    const pendingCount = todayPendingEarnings.length;

    console.log('✅ Today earnings:', { totalAmount, sessionsCount, pendingAmount, pendingCount });
    return {
      totalAmount: Math.round(totalAmount * 100) / 100,
      sessionsCount,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      pendingCount
    };
  } catch (error) {
    console.error('🔴 Error fetching today earnings:', error);
    return { totalAmount: 0, sessionsCount: 0, pendingAmount: 0, pendingCount: 0 };
  }
};