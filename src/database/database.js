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

    if (error) throw error;
    
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
      .select(`*`)
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
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`*`)
      .eq('teacher_id', teacherId)
      .order('booked_date', { ascending: false });

    if (error) throw error;
    
    console.log('✅ Teacher bookings fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching teacher bookings:', error);
    throw error;
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
// LECTURE QUERIES (Group Classes)
// ==========================================

export const createLecture = async (teacherId, subject, description, scheduledDate, durationMinutes = 60, capacity = 30) => {
  try {
    console.log('🔵 Creating lecture:', subject);
    
    const { data, error } = await supabase
      .from('lectures')
      .insert([{
        teacher_id: teacherId,
        subject: subject,
        description: description,
        scheduled_date: scheduledDate.toISOString(),
        duration_minutes: durationMinutes,
        capacity: capacity,
        status: 'scheduled'
      }])
      .select();

    if (error) throw error;
    
    console.log('✅ Lecture created:', data[0]);
    return data[0];
  } catch (error) {
    console.error('🔴 Error creating lecture:', error);
    throw error;
  }
};

export const getAllLectures = async () => {
  try {
    console.log('🔵 Fetching all available lectures...');
    
    const { data, error } = await supabase
      .from('lectures')
      .select(`
        id,
        teacher_id,
        subject,
        description,
        scheduled_date,
        duration_minutes,
        capacity,
        meeting_id,
        status,
        created_at,
        teacher_profiles!teacher_id(
          id,
          specializations
        )
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    
    // Fetch teacher names separately
    if (data && data.length > 0) {
      const teacherIds = [...new Set(data.map(l => l.teacher_id))];
      const { data: teacherNames } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds);
      
      // Map teacher names to lectures
      const teacherMap = {};
      teacherNames?.forEach(t => {
        teacherMap[t.id] = t.full_name;
      });
      
      data.forEach(lecture => {
        if (lecture.teacher_profiles) {
          lecture.teacher_profiles.full_name = teacherMap[lecture.teacher_id];
        }
      });
    }
    
    console.log('✅ Lectures fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching lectures:', error);
    throw error;
  }
};

export const getLecturesBySubject = async (subject) => {
  try {
    console.log('🔵 Fetching lectures by subject:', subject);
    
    const { data, error } = await supabase
      .from('lectures')
      .select(`
        *,
        teacher:teacher_id(
          id,
          specializations,
          profile:id(full_name)
        )
      `)
      .ilike('subject', `%${subject}%`)
      .eq('status', 'scheduled')
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    
    console.log('✅ Lectures fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching lectures by subject:', error);
    throw error;
  }
};

export const getTeacherLectures = async (teacherId) => {
  try {
    console.log('🔵 Fetching teacher lectures:', teacherId);
    
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    
    console.log('✅ Teacher lectures fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching teacher lectures:', error);
    throw error;
  }
};

export const enrollInLecture = async (lectureId, studentId) => {
  try {
    console.log('🔵 Enrolling student in lecture:', lectureId);
    
    // Check if already enrolled
    const { data: existing } = await supabase
      .from('lecture_enrollments')
      .select('id')
      .eq('lecture_id', lectureId)
      .eq('student_id', studentId)
      .single();

    if (existing) {
      throw new Error('Already enrolled in this lecture');
    }

    // Enroll in lecture
    const { data, error } = await supabase
      .from('lecture_enrollments')
      .insert([{
        lecture_id: lectureId,
        student_id: studentId
      }])
      .select();

    if (error) throw error;
    
    console.log('✅ Enrolled in lecture:', data[0]);
    return data[0];
  } catch (error) {
    console.error('🔴 Error enrolling in lecture:', error);
    throw error;
  }
};

export const getStudentEnrolledLectures = async (studentId) => {
  try {
    console.log('🔵 Fetching student enrolled lectures...');
    
    const { data, error } = await supabase
      .from('lecture_enrollments')
      .select(`
        *,
        lecture:lecture_id(
          id,
          teacher_id,
          subject,
          description,
          scheduled_date,
          duration_minutes,
          capacity,
          meeting_id,
          status,
          created_at,
          teacher_profiles!teacher_id(
            id,
            specializations
          )
        )
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    
    // Fetch teacher names separately
    if (data && data.length > 0) {
      const teacherIds = [...new Set(data.map(e => e.lecture?.teacher_id).filter(Boolean))];
      const { data: teacherNames } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds);
      
      // Map teacher names to lectures
      const teacherMap = {};
      teacherNames?.forEach(t => {
        teacherMap[t.id] = t.full_name;
      });
      
      data.forEach(enrollment => {
        if (enrollment.lecture?.teacher_profiles) {
          enrollment.lecture.teacher_profiles.full_name = teacherMap[enrollment.lecture.teacher_id];
        }
      });
    }
    
    console.log('✅ Student lectures fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching student lectures:', error);
    throw error;
  }
};

export const getLectureEnrollments = async (lectureId) => {
  try {
    console.log('🔵 Fetching lecture enrollments:', lectureId);
    
    const { data, error } = await supabase
      .from('lecture_enrollments')
      .select(`
        *,
        student:student_id(
          profiles(full_name, email)
        )
      `)
      .eq('lecture_id', lectureId)
      .order('enrolled_at', { ascending: true });

    if (error) throw error;
    
    console.log('✅ Enrollments fetched:', data?.length);
    return data || [];
  } catch (error) {
    console.error('🔴 Error fetching enrollments:', error);
    throw error;
  }
};

export const cancelLecture = async (lectureId) => {
  try {
    console.log('🔵 Cancelling lecture:', lectureId);
    
    const { data, error } = await supabase
      .from('lectures')
      .update({ status: 'cancelled' })
      .eq('id', lectureId)
      .select();

    if (error) throw error;
    
    console.log('✅ Lecture cancelled:', data[0]);
    return data[0];
  } catch (error) {
    console.error('🔴 Error cancelling lecture:', error);
    throw error;
  }
};

export const unenrollFromLecture = async (lectureId, studentId) => {
  try {
    console.log('🔵 Unenrolling from lecture:', lectureId);
    
    const { error } = await supabase
      .from('lecture_enrollments')
      .delete()
      .eq('lecture_id', lectureId)
      .eq('student_id', studentId);

    if (error) throw error;
    
    console.log('✅ Unenrolled from lecture');
    return true;
  } catch (error) {
    console.error('🔴 Error unenrolling:', error);
    throw error;
  }
};