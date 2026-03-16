import { supabase } from '../config/supabase';
import {
  TeacherListSchema,
  StudentListSchema,
  DashboardDataSchema,
  WithdrawalListSchema,
  AdminChargeSchema,
  validateResponse,
} from '../schemas/responses';

/**
 * Backend API base URL
 * Uses environment variable VITE_API_URL for environment-specific configuration
 *
 * Development: typically http://localhost:3000
 * Production: typically https://api.example.com
 *
 * ⚠️ DO NOT use hardcoded IP addresses - use environment variables instead
 */
const API_URL = import.meta.env.VITE_API_URL?.trim();

if (!API_URL) {
  console.error(
    '❌ ERROR: VITE_API_URL environment variable not set.\n' +
    'Please configure it in your .env file (e.g., VITE_API_URL=http://localhost:3000)\n' +
    'See .env.example for details.'
  );
}

// Profile fields (minimal so it works even if profiles table has fewer columns)
const PROFILE_SELECT = 'id, full_name, email, role, email_verified, created_at';
const PROFILE_SELECT_MINIMAL = 'id, full_name, email';

const BACKEND_TIMEOUT_MS = 6000;

/** Fetch with timeout; rejects after ms if not resolved. */
const fetchWithTimeout = (url, ms = BACKEND_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .then((r) => { clearTimeout(timeout); return r; })
    .catch((e) => { clearTimeout(timeout); throw e; });
};

const profileFromRow = (row) => (!row ? null : { id: row.id, full_name: row.full_name ?? null, email: row.email ?? null, role: row.role ?? null, email_verified: row.email_verified ?? null, created_at: row.created_at ?? null });

// In-memory cache for list data (avoid refetch on tab switch)
const listCache = { teachers: null, students: null, teachersAt: 0, studentsAt: 0 };
const CACHE_TTL_MS = 90 * 1000;
export const getCachedTeachers = () => listCache.teachers && (Date.now() - listCache.teachersAt) < CACHE_TTL_MS ? listCache.teachers : null;
export const getCachedStudents = () => listCache.students && (Date.now() - listCache.studentsAt) < CACHE_TTL_MS ? listCache.students : null;
export const invalidateListCache = () => { listCache.teachers = null; listCache.students = null; };

// ==========================================
// TEACHER API FUNCTIONS
// ==========================================

/** Fetch all teachers. Supabase first (one query, teacher_profiles has full_name/email); backend fallback. Uses cache when valid. */
export const getAllTeachers = async () => {
  const cached = getCachedTeachers();
  if (cached) return cached;
  try {
    const { data: teachers, error: teErr } = await supabase
      .from('teacher_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!teErr && Array.isArray(teachers)) {
      const list = teachers.map((t) => ({ ...t, profile: profileFromRow(t) }));
      // Validate response structure
      const validation = validateResponse(list, TeacherListSchema, 'getAllTeachers (Supabase)');
      if (validation.success) {
        listCache.teachers = validation.data;
        listCache.teachersAt = Date.now();
        return validation.data;
      } else {
        console.warn('Teacher data validation warning:', validation.error.details);
        // Still return the data if validation fails, but log warning
        listCache.teachers = list;
        listCache.teachersAt = Date.now();
        return list;
      }
    }
  } catch (err) {
    console.warn('Supabase teacher fetch error:', err);
  }
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/admin/teachers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      const validation = validateResponse(data, TeacherListSchema, 'getAllTeachers (Backend)');
      if (validation.success) {
        listCache.teachers = validation.data;
        listCache.teachersAt = Date.now();
        return validation.data;
      }
    }
  } catch (err) {
    console.warn('Backend teacher fetch error:', err);
  }
  return [];
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
    listCache.teachers = null;
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
    listCache.teachers = null;
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

/** Fetch all students. Supabase first (one query, student_profiles has full_name/email); backend fallback. Uses cache when valid. */
export const getAllStudents = async () => {
  const cached = getCachedStudents();
  if (cached) return cached;
  try {
    const { data: students, error: stErr } = await supabase
      .from('student_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!stErr && Array.isArray(students)) {
      const merged = students.map((s) => ({ ...s, profile: profileFromRow(s) }));
      const out = sortByCreated(merged);
      listCache.students = out;
      listCache.studentsAt = Date.now();
      return out;
    }
  } catch (_) {}
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/admin/students`);
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      const sorted = sortByCreated(data);
      listCache.students = sorted;
      listCache.studentsAt = Date.now();
      return sorted;
    }
  } catch (_) {}
  return [];
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
    listCache.students = null;
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
    listCache.students = null;
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

// ==========================================
// DASHBOARD (Supabase-only, no backend. Stats first for fast paint, then withdrawals.)
// ==========================================

/** Returns stats only (3 parallel count queries). Use for immediate card display. */
export const getDashboardStatsFast = async () => {
  try {
    const [t, s, b] = await Promise.all([
      supabase.from('teacher_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('student_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
    ]);
    return {
      totalTeachers: t?.error ? 0 : (t?.count ?? 0),
      totalStudents: s?.error ? 0 : (s?.count ?? 0),
      totalBookings: b?.error ? 0 : (b?.count ?? 0),
    };
  } catch (_) {
    return { totalTeachers: 0, totalStudents: 0, totalBookings: 0 };
  }
};

/** Returns withdrawals with sender names (teacher_profiles). */
export const getDashboardWithdrawals = async () => {
  try {
    const { data: list, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });
    if (error || !Array.isArray(list) || list.length === 0) return [];
    const ids = [...new Set(list.map((w) => w.teacher_id).filter(Boolean))];
    const senderMap = {};
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));
    const results = await Promise.all(chunks.map((c) => supabase.from('teacher_profiles').select('id, full_name, email').in('id', c)));
    results.forEach((r) => { if (Array.isArray(r?.data)) r.data.forEach((p) => { senderMap[p.id] = p; }); });
    return list.map((w) => ({ ...w, sender: senderMap[w.teacher_id] || null }));
  } catch (_) {
    return [];
  }
};

export const getDashboard = async () => {
  const defaults = { stats: { totalTeachers: 0, totalStudents: 0, totalBookings: 0 }, withdrawals: [] };
  try {
    const [stats, withdrawals] = await Promise.all([getDashboardStatsFast(), getDashboardWithdrawals()]);
    return { stats, withdrawals };
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return defaults;
  }
};

/** @deprecated Use getDashboard() for one-call load. */
export const getDashboardStats = async () => {
  const d = await getDashboard();
  return d.stats;
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
// ADMIN PAYOUT / WITHDRAWAL API (backend first, Supabase fallback when backend unreachable)
// ==========================================

export const getAdminWithdrawals = async () => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/admin/withdrawals`);
    const json = await res.json();
    if (json?.success && Array.isArray(json.data)) return json.data;
  } catch (_) {}
  return getDashboardWithdrawals();
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
// ADMIN CHARGES (Supabase only – no backend call, avoids connection timeout)
// ==========================================

export const getAdminCharges = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('admin_charges')
      .select('*')
      .eq('teacher_id', teacherId)
      .maybeSingle();
    return error ? null : data;
  } catch (_) {
    return null;
  }
};

export const setAdminCharges = async (teacherId, baseCharge, adminChargePercent, gstPercent) => {
  const base = Number(baseCharge);
  const adminPct = Number(adminChargePercent);
  const gstPct = Number(gstPercent);
  const adminAmt = Math.round((base * adminPct) / 100);
  const row = {
    teacher_id: teacherId,
    base_charge_amount: base,
    admin_charge_percent: adminPct,
    gst_percent: gstPct,
    admin_charge_amount: adminAmt,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('admin_charges')
    .upsert(row, { onConflict: 'teacher_id' });
  if (error) throw new Error(error.message || 'Failed to save charges');
  return { success: true, message: 'Charges saved' };
};
