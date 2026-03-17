/**
 * Mobile App API Service
 * Centralized API calls to backend for all mobile app operations
 * Replaces direct Supabase calls for better control and security
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Make authenticated API request
 */
const makeRequest = async (endpoint, method = 'GET', body = null, headers = {}) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

export const mobileApi = {
  /**
   * Get user profile (Student or Teacher)
   */
  getProfile: async (userId) => {
    return makeRequest(`/api/mobile/profile/${userId}`);
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, updates) => {
    return makeRequest(`/api/mobile/profile/${userId}`, 'PUT', updates);
  },

  // ==========================================
  // TEACHER DISCOVERY
  // ==========================================

  /**
   * Get all teachers (with optional search/filter)
   */
  getAllTeachers: async (search = '', profession = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (profession) params.append('profession', profession);

    return makeRequest(`/api/mobile/teachers?${params.toString()}`);
  },

  /**
   * Get single teacher profile with availability
   */
  getTeacherProfile: async (teacherId) => {
    return makeRequest(`/api/mobile/teacher/${teacherId}`);
  },

  /**
   * Get teacher's weekly availability schedule
   */
  getTeacherAvailability: async (teacherId) => {
    return makeRequest(`/api/mobile/teacher-availability/${teacherId}`);
  },

  /**
   * Set teacher's availability (teacher only)
   */
  setTeacherAvailability: async (teacherId, schedule) => {
    return makeRequest('/api/mobile/teacher-availability', 'POST', {
      teacherId,
      schedule,
    });
  },

  // ==========================================
  // BOOKINGS & SESSIONS
  // ==========================================

  /**
   * Create new booking
   */
  createBooking: async (studentId, teacherId, slotId, subject) => {
    return makeRequest('/api/mobile/bookings', 'POST', {
      studentId,
      teacherId,
      slotId,
      subject,
    });
  },

  /**
   * Get user's bookings (student or teacher)
   */
  getUserBookings: async (userId, role) => {
    return makeRequest(`/api/mobile/bookings/${userId}?role=${role}`);
  },

  /**
   * Get student bookings
   */
  getStudentBookings: async (studentId) => {
    return mobileApi.getUserBookings(studentId, 'student');
  },

  /**
   * Get teacher bookings
   */
  getTeacherBookings: async (teacherId) => {
    return mobileApi.getUserBookings(teacherId, 'teacher');
  },

  /**
   * Update booking status
   */
  updateBookingStatus: async (bookingId, status) => {
    return makeRequest(`/api/mobile/bookings/${bookingId}`, 'PUT', {
      status,
    });
  },

  /**
   * Get available slots for a teacher
   */
  getAvailableSlots: async (teacherId, date = '') => {
    const params = date ? `?date=${date}` : '';
    return makeRequest(`/api/mobile/availability/${teacherId}${params}`);
  },

  // ==========================================
  // FAVORITES
  // ==========================================

  /**
   * Add teacher to favorites
   */
  addToFavorites: async (studentId, teacherId) => {
    return makeRequest('/api/mobile/favorites', 'POST', {
      studentId,
      teacherId,
    });
  },

  /**
   * Remove teacher from favorites
   */
  removeFromFavorites: async (studentId, teacherId) => {
    return makeRequest(`/api/mobile/favorites/${studentId}/${teacherId}`, 'DELETE');
  },

  /**
   * Get student's favorite teachers
   */
  getFavorites: async (studentId) => {
    return makeRequest(`/api/mobile/favorites/${studentId}`);
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  /**
   * Get user notifications
   */
  getNotifications: async (userId, limit = 50) => {
    return makeRequest(`/api/mobile/notifications/${userId}?limit=${limit}`);
  },

  /**
   * Mark notification as read
   */
  markNotificationAsRead: async (notificationId, isRead = true) => {
    return makeRequest(`/api/mobile/notifications/${notificationId}`, 'PUT', {
      is_read: isRead,
    });
  },

  // ==========================================
  // VIDEO SDK TOKENS (Already Exists)
  // ==========================================

  /**
   * Get VideoSDK token for meeting
   */
  getVideoToken: async () => {
    return makeRequest('/get-token');
  },

  /**
   * Start meeting
   */
  startMeeting: async (bookingId, teacherId, meetingId) => {
    return makeRequest('/api/meetings/start', 'POST', {
      bookingId,
      teacherId,
      meetingId,
    });
  },

  /**
   * End meeting
   */
  endMeeting: async (bookingId, duration) => {
    return makeRequest('/api/meetings/end', 'POST', {
      bookingId,
      duration,
    });
  },

  // ==========================================
  // PAYMENTS
  // ==========================================

  /**
   * Create Razorpay payment order
   */
  createPaymentOrder: async (bookingId, studentId, teacherId, basePrice, adminCharge, totalAmount) => {
    return makeRequest('/api/payments/create-order', 'POST', {
      bookingId,
      studentId,
      teacherId,
      basePrice,
      adminCharge,
      totalAmount,
    });
  },

  /**
   * Verify payment
   */
  verifyPayment: async (paymentData) => {
    return makeRequest('/api/payments/verify', 'POST', paymentData);
  },

  /**
   * Get admin charges
   */
  getAdminCharges: async (teacherId) => {
    return makeRequest(`/api/admin/charges/${teacherId}`);
  },

  // ==========================================
  // EARNINGS & WALLET
  // ==========================================

  /**
   * Get teacher earnings (weekly, monthly, yearly breakdown)
   */
  getTeacherEarnings: async (teacherId) => {
    return makeRequest(`/api/teacher/earnings/${teacherId}`);
  },

  /**
   * Request withdrawal
   */
  requestWithdrawal: async (teacherId, amount, bankDetails) => {
    return makeRequest('/api/teacher/withdrawal/request', 'POST', {
      teacherId,
      amount,
      bankDetails,
    });
  },
};

export default mobileApi;
