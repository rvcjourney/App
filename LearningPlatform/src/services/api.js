import { supabase } from '../config/supabase';

// Backend API base URL – use 192.168.1.7 so LearningPlatform can reach the server
const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://192.168.1.7:3000';

// Profile fields (minimal so it works even if profiles table has fewer columns)
const PROFILE_SELECT = 'id, full_name, email, role, email_verified, created_at';
const PROFILE_SELECT_MINIMAL = 'id, full_name, email';

// ==========================================
// TEACHER API FUNCTIONS
// ==========================================

/** Fetch all teachers. Prefer backend (has name/email); fallback to Supabase list only. */
export const getAllTeachers = async () => {
  try {
    const res = await fetch(`${API_URL}/api/admin/teachers`);
    const data = await res.json();
    if (res.ok && Array.isArray(data)) return data;
  } catch (_) {}
  try {
    const { data: teachers, error: teErr } = await supabase
      .from('teacher_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (teErr) throw teErr;
    const list = Array.isArray(teachers) ? teachers : [];
    if (list.length === 0) return [];
    const ids = [...new Set(list.map((t) => t.id).filter(Boolean))];
    const profileMap = {};
    const chunkSize = 50;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      let res = await supabase.from('profiles').select(PROFILE_SELECT).in('id', chunk);
      if (res.error) res = await supabase.from('profiles').select(PROFILE_SELECT_MINIMAL).in('id', chunk);
      if (!res.error && Array.isArray(res.data)) res.data.forEach((p) => { profileMap[p.id] = p; });
    }
    return list.map((t) => ({ ...t, profile: profileMap[t.id] || null }));
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
};

export const getTeacherById = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles(id, full_name, email, role, email_verified, created_at)
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
    const res = await fetch(`${API_URL}/api/admin/teachers/${teacherId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherProfile: updates.teacherProfile || {},
        profile: updates.profile || {},
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to update teacher');
    return data;
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

const sortByCreated = (list) =>
  list.sort((a, b) => {
    const dateA = a.profile?.created_at ? new Date(a.profile.created_at) : new Date(0);
    const dateB = b.profile?.created_at ? new Date(b.profile.created_at) : new Date(0);
    return dateB - dateA;
  });

/** Fetch all students. Prefer backend (has name/email); fallback to Supabase list only. */
export const getAllStudents = async () => {
  try {
    const res = await fetch(`${API_URL}/api/admin/students`);
    const data = await res.json();
    if (res.ok && Array.isArray(data)) return sortByCreated(data);
  } catch (_) {}
  try {
    const { data: students, error: stErr } = await supabase
      .from('student_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (stErr) throw stErr;
    const list = Array.isArray(students) ? students : [];
    if (list.length === 0) return [];
    const ids = [...new Set(list.map((s) => s.id).filter(Boolean))];
    const profileMap = {};
    const chunkSize = 50;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      let res = await supabase.from('profiles').select(PROFILE_SELECT).in('id', chunk);
      if (res.error) res = await supabase.from('profiles').select(PROFILE_SELECT_MINIMAL).in('id', chunk);
      if (!res.error && Array.isArray(res.data)) res.data.forEach((p) => { profileMap[p.id] = p; });
    }
    const merged = list.map((s) => ({ ...s, profile: profileMap[s.id] || null }));
    return sortByCreated(merged);
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const getStudentById = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profile:profiles(id, full_name, email, role, email_verified, created_at)
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
  const defaults = { totalTeachers: 0, totalStudents: 0, totalBookings: 0 };
  try {
    const [teachersResult, studentsResult, bookingsResult] = await Promise.all([
      supabase.from('teacher_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('student_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalTeachers: teachersResult?.error ? 0 : (teachersResult?.count ?? 0),
      totalStudents: studentsResult?.error ? 0 : (studentsResult?.count ?? 0),
      totalBookings: bookingsResult?.error ? 0 : (bookingsResult?.count ?? 0),
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return defaults;
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

// ==========================================
// ADMIN PAYOUT / WITHDRAWAL API (same as mobile admin)
// ==========================================

export const getAdminWithdrawals = async () => {
  const res = await fetch(`${API_URL}/api/admin/withdrawals`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load withdrawals');
  return json.data || [];
};

export const getAdminWithdrawalDetail = async (id) => {
  const res = await fetch(`${API_URL}/api/admin/withdrawals/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load request');
  return json.data;
};

export const getAdminWithdrawalReveal = async (id) => {
  const res = await fetch(`${API_URL}/api/admin/withdrawals/${id}/reveal`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to reveal account');
  return json.data;
};

export const approveAdminWithdrawal = async (withdrawalId, adminId) => {
  const res = await fetch(`${API_URL}/api/admin/withdrawals/${withdrawalId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: adminId || 'web-admin' }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to approve');
  return json;
};

export const getAdminAnalytics = async () => {
  const res = await fetch(`${API_URL}/api/admin/analytics`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load analytics');
  return json.analytics || {};
};

// ==========================================
// ADMIN CHARGES (teacher base + admin charge)
// ==========================================

export const getAdminCharges = async (teacherId) => {
  const res = await fetch(`${API_URL}/api/admin/charges/${teacherId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load charges');
  return json.data || null;
};

export const setAdminCharges = async (teacherId, baseCharge, adminCharge) => {
  const res = await fetch(`${API_URL}/api/admin/charges/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teacherId,
      baseCharge: Number(baseCharge),
      adminCharge: Number(adminCharge),
    }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to set charges');
  return json;
};
