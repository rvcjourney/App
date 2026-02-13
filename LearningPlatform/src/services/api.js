import { supabase } from '../config/supabase';

// Used by web app for any non-supabase backend calls.
// Keep env override, but default to your LAN IP.
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.130:3000';

// ==========================================
// TEACHER API FUNCTIONS
// ==========================================

export const getAllTeachers = async () => {
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name, role, email_verified, created_at)
      `);
    
    if (error) throw error;
    // Sort by profile created_at in JavaScript since Supabase ordering on joined fields can be tricky
    const sorted = (data || []).sort((a, b) => {
      const dateA = a.profile?.created_at ? new Date(a.profile.created_at) : new Date(0);
      const dateB = b.profile?.created_at ? new Date(b.profile.created_at) : new Date(0);
      return dateB - dateA; // Descending order (newest first)
    });
    return sorted;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
};

export const getTeacherById = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name, role, email_verified, created_at)
      `)
      .eq('id', teacherId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching teacher:', error);
    throw error;
  }
};

export const updateTeacher = async (teacherId, updates) => {
  try {
    // Update teacher_profiles
    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_profiles')
      .update({
        ...updates.teacherProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teacherId)
      .select()
      .single();
    
    if (teacherError) throw teacherError;

    // Update profiles if needed (profiles table has no updated_at column)
    if (updates.profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates.profile)
        .eq('id', teacherId);
      
      if (profileError) throw profileError;
    }

    return teacherData;
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
};

export const deleteTeacher = async (teacherId) => {
  try {
    // Delete from teacher_profiles (cascade will handle related records)
    const { error } = await supabase
      .from('teacher_profiles')
      .delete()
      .eq('id', teacherId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
};

// Teacher wallet (admin) – calls Node backend
export const getTeacherWallet = async (teacherId) => {
  const res = await fetch(`${API_URL}/api/teacher/earnings/${teacherId}`);
  const result = await res.json();
  if (!result.success) throw new Error(result.error || 'Failed to load wallet');
  return result.wallet || { total_balance: 0, available_balance: 0 };
};

// Full wallet history (wallet + earnings + withdrawals) for admin
export const getTeacherWalletHistory = async (teacherId) => {
  const res = await fetch(`${API_URL}/api/teacher/earnings/${teacherId}`);
  const result = await res.json();
  if (!result.success) throw new Error(result.error || 'Failed to load wallet history');
  return {
    wallet: result.wallet || { total_balance: 0, available_balance: 0 },
    earnings: result.earnings || [],
    withdrawals: result.withdrawals || [],
  };
};

export const updateTeacherWallet = async (teacherId, { total_balance, available_balance }) => {
  const res = await fetch(`${API_URL}/api/admin/teacher/${teacherId}/wallet`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_balance, available_balance }),
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.error || 'Failed to update wallet');
  return result.wallet;
};

// ==========================================
// STUDENT API FUNCTIONS
// ==========================================

export const getAllStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profile:profiles(id, full_name, role, email_verified, created_at)
      `);
    
    if (error) throw error;
    // Sort by profile created_at in JavaScript since Supabase ordering on joined fields can be tricky
    const sorted = (data || []).sort((a, b) => {
      const dateA = a.profile?.created_at ? new Date(a.profile.created_at) : new Date(0);
      const dateB = b.profile?.created_at ? new Date(b.profile.created_at) : new Date(0);
      return dateB - dateA; // Descending order (newest first)
    });
    return sorted;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const getStudentById = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profile:profiles(id, full_name, role, email_verified, created_at)
      `)
      .eq('id', studentId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
};

export const updateStudent = async (studentId, updates) => {
  try {
    // Update student_profiles
    const { data: studentData, error: studentError } = await supabase
      .from('student_profiles')
      .update({
        ...updates.studentProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .select()
      .single();
    
    if (studentError) throw studentError;

    // Update profiles if needed (profiles table has no updated_at column)
    if (updates.profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates.profile)
        .eq('id', studentId);
      
      if (profileError) throw profileError;
    }

    return studentData;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

export const deleteStudent = async (studentId) => {
  try {
    // Delete from student_profiles (cascade will handle related records)
    const { error } = await supabase
      .from('student_profiles')
      .delete()
      .eq('id', studentId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

export const getDashboardStats = async () => {
  try {
    const [teachersResult, studentsResult, bookingsResult] = await Promise.all([
      supabase.from('teacher_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('student_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalTeachers: teachersResult.count || 0,
      totalStudents: studentsResult.count || 0,
      totalBookings: bookingsResult.count || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// ==========================================
// AUDIT LOG (Get user activity)
// ==========================================

export const getAuditLog = async (userId, userType) => {
  try {
    // Get bookings related to this user
    const bookingsQuery = userType === 'teacher' 
      ? supabase.from('bookings').select('*').eq('teacher_id', userId)
      : supabase.from('bookings').select('*').eq('student_id', userId);

    const { data: bookings, error } = await bookingsQuery.order('created_at', { ascending: false }).limit(50);
    
    if (error) throw error;
    return bookings || [];
  } catch (error) {
    console.error('Error fetching audit log:', error);
    throw error;
  }
};
