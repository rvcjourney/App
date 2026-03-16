import { supabase } from '../../supabase';
import logger from '../utils/logger';
import { API_URL } from '../api/api';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generic profile fetcher with error handling
 * @param {string} table - Table name (e.g., 'profiles', 'teacher_profiles')
 * @param {string} userId - User ID to fetch
 * @returns {Promise<object|null>}
 */
export const getProfileByUserId = async (table, userId) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (error) throw error;

    return Array.isArray(data) && data.length > 0 ? data[0] : data;
  } catch (error) {
    logger.error(`Error fetching ${table} profile:`, error);
    throw error;
  }
};

// ==========================================
// TEACHER QUERIES
// ==========================================

export const getTeacherProfile = async (teacherId) => {
  try {
    logger.info('🔵 Fetching teacher profile:', teacherId);
    
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .eq('id', teacherId)
      .single();

    if (error) throw error;
    
    logger.info('✅ Teacher profile fetched:', data);
    return data;
  } catch (error) {
    logger.error('🔴 Error fetching teacher profile:', error);
    throw error;
  }
};

export const getAllTeachers = async () => {
  try {
    logger.info('🔵 Fetching all teachers...');
    
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .order('rating', { ascending: false });

    if (error) {
      logger.error('🔴 Error fetching teachers:', error);
      throw error;
    }
    
    logger.info('✅ All teachers fetched:', data?.length);
    return data || [];
  } catch (error) {
    logger.error('🔴 Error fetching teachers:', error);
    throw error;
  }
};

export const searchTeachers = async (query) => {
  try {
    logger.info('🔵 Searching teachers:', query);
    
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
    
    logger.info('✅ Search results:', filtered.length);
    return filtered;
  } catch (error) {
    logger.error('🔴 Search error:', error);
    throw error;
  }
};

export const updateTeacherProfile = async (teacherId, updates) => {
  try {
    logger.info('🔵 Updating teacher profile:', teacherId);
    
    const { data, error } = await supabase
      .from('teacher_profiles')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', teacherId)
      .select();

    if (error) throw error;
    
    logger.info('✅ Teacher profile updated');
    return data?.[0];
  } catch (error) {
    logger.error('🔴 Update error:', error);
    throw error;
  }
};

export const getTeachersByProfession = async (profession) => {
  try {
    logger.info('🔵 Fetching teachers by profession:', profession);

    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .eq('profession', profession)
      .order('rating', { ascending: false });

    if (error) throw error;

    logger.info('✅ Teachers by profession fetched:', data?.length);
    return data || [];
  } catch (error) {
    logger.error('🔴 Error fetching teachers by profession:', error);
    throw error;
  }
};

export const getTeachersGroupedByProfession = async () => {
  try {
    logger.info('🔵 Fetching all teachers grouped by profession...');

    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .order('profession')
      .order('rating', { ascending: false });

    if (error) throw error;

    // Group teachers by profession
    const grouped = {};
    data?.forEach(teacher => {
      const profession = teacher.profession || 'Other';
      if (!grouped[profession]) {
        grouped[profession] = [];
      }
      grouped[profession].push(teacher);
    });

    logger.info('✅ Teachers grouped by profession');
    return grouped;
  } catch (error) {
    logger.error('🔴 Error grouping teachers:', error);
    throw error;
  }
};

/** Create a minimal teacher_profiles row (call after signup so edits work). */
export const createTeacherProfile = async (userId, { full_name, email, role } = {}) => {
  try {
    const { error } = await supabase
      .from('teacher_profiles')
      .upsert({
        id: userId,
        full_name: full_name ?? null,
        email: email ?? null,
        role: role ?? 'teacher',
        price_per_call: 500,
        specializations: '',
        bio: '',
        rating: 4.8,
        followers: 0,
        experience_years: 0,
        profession: null,
        updated_at: new Date(),
      }, { onConflict: 'id' });
    if (error) throw error;
    logger.info('✅ Teacher profile row created');
  } catch (error) {
    logger.error('🔴 createTeacherProfile error:', error);
    throw error;
  }
};

// ==========================================
// STUDENT QUERIES
// ==========================================

export const getStudentProfile = async (studentId) => {
  try {
    logger.info('🔵 Fetching student profile:', studentId);
    
    const { data, error } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profile:profiles(id, full_name)
      `)
      .eq('id', studentId)
      .single();

    if (error) throw error;
    
    logger.info('✅ Student profile fetched');
    return data;
  } catch (error) {
    logger.error('🔴 Error fetching student profile:', error);
    throw error;
  }
};

export const updateStudentProfile = async (studentId, updates) => {
  try {
    logger.info('🔵 Updating student profile:', studentId);
    
    const { data, error } = await supabase
      .from('student_profiles')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', studentId)
      .select();

    if (error) throw error;
    
    logger.info('✅ Student profile updated');
    return data?.[0];
  } catch (error) {
    logger.error('🔴 Update error:', error);
    throw error;
  }
};

/** Create a minimal student_profiles row (call after signup so edits work). */
export const createStudentProfile = async (userId, { full_name, email } = {}) => {
  try {
    const { error } = await supabase
      .from('student_profiles')
      .upsert({
        id: userId,
        full_name: full_name ?? null,
        email: email ?? null,
        preferred_language: 'English',
        grade_level: '',
        subjects_interested: '',
        updated_at: new Date(),
      }, { onConflict: 'id' });
    if (error) throw error;
    logger.info('✅ Student profile row created');
  } catch (error) {
    logger.error('🔴 createStudentProfile error:', error);
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
    logger.error('🔴 isProfileComplete error:', error);
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
    logger.error('🔴 getAllUsersForAdmin error:', error);
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
    logger.error('🔴 updateUserProfileForAdmin error:', error);
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
    logger.error('🔴 getAllBookingsForAdmin error:', error);
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
    logger.error('🔴 getTeacherProfileForAdmin error:', error);
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
    logger.error('🔴 updateTeacherProfileForAdmin error:', error);
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
    logger.error('🔴 getStudentProfileForAdmin error:', error);
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
    logger.error('🔴 updateStudentProfileForAdmin error:', error);
    throw error;
  }
};

// ==========================================
// BOOKINGS QUERIES
// ==========================================

export const createBooking = async (studentId, teacherId, scheduledTime, subject = 'Tutoring Session') => {
  try {
    logger.info('🔵 Creating booking...');
    
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
    
    logger.info('✅ Booking created:', data?.[0]?.id);
    return data?.[0];
  } catch (error) {
    logger.error('🔴 Booking error:', error);
    throw error;
  }
};

export const getStudentBookings = async (studentId) => {
  try {
    logger.info('🔵 Fetching student bookings...');
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        teacher_profile:teacher_id(full_name)
      `)
      .eq('student_id', studentId)
      .order('booked_date', { ascending: false });

    if (error) throw error;
    
    logger.info('✅ Bookings fetched:', data?.length);
    return data || [];
  } catch (error) {
    logger.error('🔴 Error fetching bookings:', error);
    throw error;
  }
};

export const getTeacherBookings = async (teacherId) => {
  try {
    logger.info('🔵 Fetching teacher bookings...');
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('booked_date', { ascending: false });

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
      logger.info('✅ Teacher bookings fetched: 0');
      return [];
    }

    const studentIds = [...new Set(bookings.map(b => b.student_id).filter(Boolean))];

    let studentNames = {};
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      profiles?.forEach(p => {
        studentNames[p.id] = p.full_name || 'Student';
      });
    }

    const result = bookings.map(b => ({
      ...b,
      student: { full_name: studentNames[b.student_id] || 'Student' },
    }));
    logger.info('✅ Teacher bookings fetched:', result.length);
    return result;
  } catch (err) {
    logger.error('🔴 Error fetching teacher bookings:', err);
    throw err;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    logger.info('🔵 Updating booking status:', status);
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select();

    if (error) throw error;
    
    logger.info('✅ Booking status updated');
    return data?.[0];
  } catch (error) {
    logger.error('🔴 Error updating booking:', error);
    throw error;
  }
};

// ==========================================
// FAVORITES QUERIES
// ==========================================

export const addToFavorites = async (studentId, teacherId) => {
  try {
    logger.info('🔵 Adding to favorites...');
    
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
        logger.info('⚠️ Already in favorites');
        return null;
      }
      throw error;
    }
    
    logger.info('✅ Added to favorites');
    return data?.[0];
  } catch (error) {
    logger.error('🔴 Favorites error:', error);
    throw error;
  }
};

export const removeFromFavorites = async (studentId, teacherId) => {
  try {
    logger.info('🔵 Removing from favorites...');
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('student_id', studentId)
      .eq('teacher_id', teacherId);

    if (error) throw error;
    
    logger.info('✅ Removed from favorites');
    return true;
  } catch (error) {
    logger.error('🔴 Error removing favorite:', error);
    throw error;
  }
};

export const getStudentFavorites = async (studentId) => {
  try {
    logger.info('🔵 Fetching favorites...');
    
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
    
    logger.info('✅ Favorites fetched:', data?.length);
    return data?.map(f => f.teacher) || [];
  } catch (error) {
    logger.error('🔴 Error fetching favorites:', error);
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
    logger.info('🔵 Setting teacher weekly availability...');
    
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
    
    logger.info('✅ Availability set:', data?.[0]);
    return data?.[0];
  } catch (error) {
    logger.error('🔴 Error setting availability:', error);
    throw error;
  }
};

/**
 * Get teacher's weekly availability schedule
 */
export const getTeacherWeeklyAvailability = async (teacherId) => {
  try {
    logger.info('🔵 Fetching teacher weekly availability...');
    
    const { data, error } = await supabase
      .from('teacher_availability_schedule')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });

    if (error) throw error;
    
    logger.info('✅ Availability fetched:', data?.length);
    return data || [];
  } catch (error) {
    logger.error('🔴 Error fetching availability:', error);
    throw error;
  }
};

/**
 * Create specific availability slots for a date range
 * Automatically generates slots based on teacher's weekly schedule
 */
export const generateAvailabilitySlots = async (teacherId, startDate, endDate, slotDurationMinutes = 60) => {
  try {
    logger.info('🔵 Generating availability slots...');
    
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
      
      logger.info('✅ Slots generated:', data?.length);
      return data || [];
    }

    return [];
  } catch (error) {
    logger.error('🔴 Error generating slots:', error);
    throw error;
  }
};

/**
 * Get available slots for a teacher on a specific date
 * Now includes booked slots so they can be displayed with different styling
 */
export const getTeacherAvailableSlots = async (teacherId, date) => {
  try {
    logger.info('🔵 Fetching available slots for:', date);
    
    const { data, error } = await supabase
      .from('teacher_availability_slots')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('available_date', date)
      .in('slot_status', ['available', 'booked'])
      .order('start_time', { ascending: true });

    if (error) throw error;
    
    logger.info('✅ Slots fetched:', data?.length);
    return data || [];
  } catch (error) {
    logger.error('🔴 Error fetching slots:', error);
    throw error;
  }
};

/**
 * Get all available slots for a teacher in a date range
 * Now includes booked slots so they can be displayed with different styling
 */
export const getTeacherSlotsByDateRange = async (teacherId, startDate, endDate) => {
  try {
    logger.info('🔵 Fetching slots in date range...');

    const { data, error } = await supabase
      .from('teacher_availability_slots')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('available_date', startDate)
      .lte('available_date', endDate)
      .in('slot_status', ['available', 'booked'])
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Filter out past slots (same day or earlier)
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
    const todayIST = istTime.toISOString().split('T')[0];
    const currentHour = istTime.getHours();
    const currentMinute = istTime.getMinutes();

    const futureSlots = data?.filter(slot => {
      // Always show slots from future dates
      if (slot.available_date > todayIST) {
        return true;
      }

      // For today's slots, only show if the slot time hasn't passed
      if (slot.available_date === todayIST && slot.start_time) {
        const [slotHour, slotMinute] = slot.start_time.split(':').map(Number);
        const slotMinutesFromMidnight = slotHour * 60 + slotMinute;
        const currentMinutesFromMidnight = currentHour * 60 + currentMinute;

        // Only show slots that start at least 30 minutes in the future
        return slotMinutesFromMidnight > currentMinutesFromMidnight;
      }

      // Don't show past slots
      return false;
    }) || [];

    logger.info('✅ Slots fetched:', futureSlots.length, 'out of', data?.length);
    return futureSlots;
  } catch (error) {
    logger.error('🔴 Error fetching slots:', error);
    throw error;
  }
};

/**
 * Book a specific availability slot
 * Creates booking immediately (no teacher confirmation needed)
 * Teacher gets notification about scheduled lecture
 * 
 * IMPROVED: Better conflict detection and atomic updates
 */
export const bookAvailabilitySlot = async (studentId, teacherId, slotId, subject, hoursRequired = 1) => {
  try {
    logger.info('🔵 Booking availability slot...');

    // Validate required parameters
    if (!studentId || !teacherId || !slotId) {
      throw new Error(`Missing required parameters: studentId=${studentId}, teacherId=${teacherId}, slotId=${slotId}`);
    }

    // Step 1: Get slot details with FOR UPDATE lock (if supported) or optimistic locking
    const { data: slot, error: slotError } = await supabase
      .from('teacher_availability_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError) throw slotError;

    // Step 2: Double-check availability (prevent race conditions)
    if (slot.slot_status !== 'available' || slot.booked_count >= slot.capacity) {
      throw new Error('Slot is no longer available. Another student may have just booked it.');
    }

    // Step 3: Calculate new booking count
    const newBookedCount = slot.booked_count + 1;
    const isBooked = newBookedCount >= slot.capacity;

    // Step 4: Update slot FIRST with optimistic locking (check current booked_count)
    // This prevents double-booking if two students try to book simultaneously
    const { data: updatedSlot, error: updateSlotError } = await supabase
      .from('teacher_availability_slots')
      .update({
        booked_count: newBookedCount,
        is_booked: isBooked,
        slot_status: isBooked ? 'booked' : 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId)
      .eq('booked_count', slot.booked_count) // Optimistic locking: only update if booked_count hasn't changed
      .select()
      .single();

    // If update failed, it means slot was booked by someone else (race condition)
    if (updateSlotError || !updatedSlot) {
      // Re-check slot status
      const { data: currentSlot } = await supabase
        .from('teacher_availability_slots')
        .select('slot_status, booked_count, capacity')
        .eq('id', slotId)
        .single();
      
      if (currentSlot?.slot_status === 'booked' || currentSlot?.booked_count >= currentSlot?.capacity) {
        throw new Error('Slot was just booked by another student. Please select a different time slot.');
      }
      throw new Error('Failed to reserve slot. Please try again.');
    }

    // Step 5: Create booking with status "pending" (will be confirmed after payment)
    // Combine available_date with start_time to create proper booking datetime
    const [hours, minutes, seconds] = slot.start_time.split(':').map(Number);
    const bookingDateTime = new Date(`${slot.available_date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds || 0).padStart(2, '0')}Z`);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        student_id: studentId,
        teacher_id: teacherId,
        availability_slot_id: slotId,
        booked_date: bookingDateTime.toISOString(),
        subject: subject,
        status: 'pending', // Pending until payment is verified
        duration_minutes: hoursRequired * 60,
        teacher_confirmed_at: null // Will be set after payment confirmation
      }])
      .select();

    // Step 6: If booking creation fails, rollback slot update
    if (bookingError) {
      logger.error('🔴 Booking creation failed, rolling back slot update...');
      // Rollback: decrement booked_count
      await supabase
        .from('teacher_availability_slots')
        .update({
          booked_count: slot.booked_count, // Revert to original
          is_booked: slot.booked_count >= slot.capacity,
          slot_status: slot.booked_count >= slot.capacity ? 'booked' : 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);
      throw bookingError;
    }

    const bookingRecord = booking?.[0];
    const bookingId = bookingRecord?.id;

    // Step 7: Notify teacher and student that booking was created (pending payment)
    try {
      await createNotification(
        teacherId,
        'booking_request',
        '📅 New booking request',
        'A student has requested a session. They will complete payment to confirm.',
        bookingId
      );
      await createNotification(
        studentId,
        'booking_request',
        '📅 Booking created',
        'Complete payment to confirm your session with the teacher.',
        bookingId
      );
    } catch (notifErr) {
      logger.warn('⚠️ Could not create booking notifications:', notifErr?.message);
      // Don't fail the booking if notification fails
    }

    logger.info('✅ Slot booked successfully:', bookingId);
    return bookingRecord;
  } catch (error) {
    logger.error('🔴 Error booking slot:', error);
    throw error;
  }
};

/**
 * Free up a slot when booking is cancelled or payment fails
 * This ensures slots are released back to available status
 */
export const releaseAvailabilitySlot = async (slotId, bookingId = null) => {
  try {
    logger.info('🔵 Releasing availability slot:', slotId);
    
    // Get current slot status
    const { data: slot, error: slotError } = await supabase
      .from('teacher_availability_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError) {
      logger.error('🔴 Error fetching slot for release:', slotError);
      return;
    }

    // Decrement booked_count
    const newBookedCount = Math.max(0, (slot.booked_count || 0) - 1);
    const isBooked = newBookedCount >= slot.capacity;

    // Update slot status
    const { error: updateError } = await supabase
      .from('teacher_availability_slots')
      .update({
        booked_count: newBookedCount,
        is_booked: isBooked,
        slot_status: isBooked ? 'booked' : 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', slotId);

    if (updateError) {
      logger.error('🔴 Error releasing slot:', updateError);
    } else {
      logger.info('✅ Slot released successfully. New booked_count:', newBookedCount);
    }
  } catch (error) {
    logger.error('🔴 Error in releaseAvailabilitySlot:', error);
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
    logger.info('🔵 Creating notification...');
    
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
    
    logger.info('✅ Notification created:', data?.[0]?.id);
    return data?.[0];
  } catch (error) {
    logger.error('🔴 Error creating notification:', error);
    throw error;
  }
};

/** Default page size for notification lists (keeps queries fast) */
const NOTIFICATION_PAGE_SIZE = 20;
/** Only fetch recent notifications from main table (days); older are in archive */
const NOTIFICATION_RECENT_DAYS = 90;

/**
 * Get unread notification count for a user (for badge display)
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    logger.error('🔴 Error fetching unread notification count:', error);
    return 0;
  }
};

/**
 * Get unread notifications for a user (capped for performance)
 */
export const getUnreadNotifications = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('🔴 Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get notifications for a user with pagination (recent table only; avoids full scan)
 */
export const getNotificationsPage = async (userId, { limit = NOTIFICATION_PAGE_SIZE, cursor = null } = {}) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // fetch one extra to know if there's next page

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const list = data || [];
    const hasMore = list.length > limit;
    const items = hasMore ? list.slice(0, limit) : list;
    const nextCursor = items.length > 0 ? items[items.length - 1].created_at : null;

    return { items, nextCursor, hasMore };
  } catch (error) {
    logger.error('🔴 Error fetching notifications page:', error);
    throw error;
  }
};

/**
 * Get recent notifications for a user (last N days from main table only)
 */
export const getRecentNotifications = async (userId, days = 30, limit = 50) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('🔴 Error fetching recent notifications:', error);
    throw error;
  }
};

/**
 * Get all notifications for a user (recent first, paginated - use getNotificationsPage for large lists)
 */
export const getAllNotifications = async (userId, limit = NOTIFICATION_PAGE_SIZE) => {
  const { items } = await getNotificationsPage(userId, { limit });
  return items;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    logger.error('🔴 Error marking notification:', error);
    throw error;
  }
};

/**
 * Move read notifications older than retentionDays from notifications to notification_archive.
 * Call periodically (e.g. from backend cron) to keep notifications table small.
 */
export const archiveOldNotifications = async (retentionDays = NOTIFICATION_RECENT_DAYS) => {
  try {
    const before = new Date();
    before.setDate(before.getDate() - retentionDays);
    const beforeIso = before.toISOString();

    const { data: toArchive, error: fetchErr } = await supabase
      .from('notifications')
      .select('id, user_id, notification_type, title, message, booking_id, is_read, created_at')
      .eq('is_read', true)
      .lt('created_at', beforeIso)
      .limit(500);

    if (fetchErr) throw fetchErr;
    if (!toArchive?.length) return { archived: 0 };

    const archiveRows = toArchive.map((row) => ({
      user_id: row.user_id,
      notification_type: row.notification_type,
      title: row.title,
      message: row.message,
      booking_id: row.booking_id,
      is_read: row.is_read,
      created_at: row.created_at,
    }));

    const { error: insertErr } = await supabase.from('notification_archive').insert(archiveRows);
    if (insertErr) throw insertErr;

    const ids = toArchive.map((r) => r.id);
    const { error: deleteErr } = await supabase.from('notifications').delete().in('id', ids);
    if (deleteErr) throw deleteErr;

    return { archived: ids.length };
  } catch (error) {
    logger.error('🔴 Error archiving notifications:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (userId, callback) => {
  try {
    const subscription = supabase
      .channel(`notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  } catch (error) {
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
    logger.info('🔵 Starting meeting...');
    
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

    logger.info('✅ Meeting started:', meetingId);
    return { booking: bookingData?.[0], log: logData?.[0] };
  } catch (error) {
    logger.error('🔴 Error starting meeting:', error);
    throw error;
  }
};

/**
 * End a meeting
 */
export const endMeeting = async (bookingId, meetingId, duration = 60) => {
  try {
    logger.info('🔵 Ending meeting... BookingId:', bookingId);
    
    // Call backend endpoint to handle meeting completion
    // This will:
    // 1. Update booking status to 'completed'
    // 2. Update meeting log with end time
    // 3. Change earnings status from 'pending' to 'completed'
    // 4. Update teacher's wallet with earned amount
    
    logger.info('🌐 Backend URL:', API_URL);
    
    const response = await fetch(`${API_URL}/api/meetings/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: bookingId,
        duration: duration
      })
    });

    logger.info('📤 Backend response status:', response.status);
    
    const data = await response.json();
    logger.info('📨 Backend response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      logger.info('✅ Meeting ended successfully:', data.bookingId);
      logger.info('💰 Teacher earnings updated and wallet credited');
      return { success: true, bookingId: data.bookingId };
    } else {
      logger.error('⚠️ Failed to end meeting - Error:', data.error);
      throw new Error(data.error || 'Failed to end meeting');
    }
  } catch (error) {
    logger.error('🔴 Error ending meeting:', error.message);
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
    let studentNames = {};
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      profiles?.forEach(p => {
        studentNames[p.id] = p.full_name || 'Student';
      });
    }

    return bookings.map(b => ({
      ...b,
      student: { full_name: studentNames[b.student_id] || 'Student' },
    }));
  } catch (err) {
    logger.error('🔴 Error fetching today call history:', err);
    return [];
  }
};

/**
 * Get meeting history
 */
export const getMeetingHistory = async (userId, isTeacher = false) => {
  try {
    logger.info('🔵 Fetching meeting history...');
    
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
    
    logger.info('✅ Meeting history fetched:', data?.length);
    return data || [];
  } catch (error) {
    logger.error('🔴 Error fetching meeting history:', error);
    throw error;
  }
};

/**
 * Calculate teacher earnings for different time periods
 * Uses teacher_earnings table which has actual amounts after deductions
 */
export const getTeacherEarnings = async (teacherId) => {
  try {
    logger.info('🔵 Fetching teacher earnings...');
    
    // Get completed earnings only (not pending)
    const { data: earnings, error } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }); // Use created_at as fallback

    if (error) {
      logger.error('🔴 Error querying earnings:', error);
      throw error;
    }

    logger.info('✅ Earnings fetched from DB:', earnings?.length || 0, 'records');

    // Transform earnings array to add teacher_earn calculation
    const earningsWithCalculation = (earnings || []).map(e => ({
      ...e,
      teacher_earn: parseFloat(e.total_collected || 0) - parseFloat(e.admin_deduction || 0) - parseFloat(e.platform_fee || 0),
    }));

    if (!earningsWithCalculation || earningsWithCalculation.length === 0) {
      logger.info('✅ No completed earnings found');
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

      logger.info('Processing earning:', { date: earningDate, amount, status: earning.status });

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

    logger.info('✅ Earnings calculated:', { totalEarned, pendingCount });
    return {
      weekly: formattedWeekly,
      monthly: formattedMonthly,
      yearly: formattedYearly,
      totalEarned: Math.round(totalEarned * 100) / 100,
      pendingCount: pendingCount || 0
    };
  } catch (error) {
    logger.error('🔴 Error fetching earnings:', error);
    throw error;
  }
};

/**
 * Get teacher's today earnings (completed sessions only)
 */
export const getTeacherTodayEarnings = async (teacherId) => {
  try {
    logger.info('🔵 Fetching today earnings...');
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    logger.info('Date range:', startOfToday.toISOString(), '-', endOfToday.toISOString());

    // Get completed earnings for today (check both completed_at and created_at)
    const { data: earnings, error } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed');

    if (error) {
      logger.error('🔴 Error querying today earnings:', error);
      throw error;
    }

    // Filter in JavaScript to handle null completed_at
    const todayCompletedEarnings = (earnings || []).filter(e => {
      const checkDate = e.completed_at ? new Date(e.completed_at) : new Date(e.created_at);
      return checkDate >= startOfToday && checkDate <= endOfToday;
    });

    logger.info('Today completed earnings:', todayCompletedEarnings.length);

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

    logger.info('Today pending earnings:', todayPendingEarnings.length);

    const pendingAmount = todayPendingEarnings.reduce((sum, e) => sum + (parseFloat(e.total_collected || 0) - parseFloat(e.admin_deduction || 0) - parseFloat(e.platform_fee || 0)), 0);
    const pendingCount = todayPendingEarnings.length;

    logger.info('✅ Today earnings:', { totalAmount, sessionsCount, pendingAmount, pendingCount });
    return {
      totalAmount: Math.round(totalAmount * 100) / 100,
      sessionsCount,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      pendingCount
    };
  } catch (error) {
    logger.error('🔴 Error fetching today earnings:', error);
    return { totalAmount: 0, sessionsCount: 0, pendingAmount: 0, pendingCount: 0 };
  }
};