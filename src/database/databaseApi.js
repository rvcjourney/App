/**
 * Database API Abstraction Layer
 * Uses backend API instead of direct Supabase calls
 * Provides the same interface as the old database.js but calls backend endpoints
 */

import mobileApi from '../api/mobileApi';

/**
 * Profile Management
 */
export const getProfile = async (userId) => {
  // Generic profile getter that works for both students and teachers
  const response = await mobileApi.getProfile(userId);
  return response;
};

export const getTeacherProfile = async (teacherId) => {
  const response = await mobileApi.getTeacherProfile(teacherId);
  return response.teacher;
};

export const getStudentProfile = async (studentId) => {
  const response = await mobileApi.getProfile(studentId);
  return response.profile;
};

export const updateProfile = async (userId, updates) => {
  // Generic profile updater that works for both students and teachers
  await mobileApi.updateProfile(userId, updates);
  return true;
};

export const updateTeacherProfile = async (teacherId, updates) => {
  await mobileApi.updateProfile(teacherId, updates);
  return true;
};

export const updateStudentProfile = async (studentId, updates) => {
  await mobileApi.updateProfile(studentId, updates);
  return true;
};

export const getAllTeachers = async (search = '') => {
  const response = await mobileApi.getAllTeachers(search);
  return response.data || [];
};

export const getTeachersByProfession = async (profession) => {
  const response = await mobileApi.getAllTeachers('', profession);
  return response.data || [];
};

export const searchTeachers = async (query) => {
  return getAllTeachers(query);
};

/**
 * Booking Management
 */
export const createBooking = async (studentId, teacherId, scheduledTime, subject) => {
  // Note: frontend needs to pass slotId from availability slots
  // This is a simplified version - actual implementation would be in StudentCheckout
  const response = await mobileApi.createBooking(studentId, teacherId, null, subject);
  return response.booking;
};

export const getStudentBookings = async (studentId) => {
  const response = await mobileApi.getStudentBookings(studentId);
  return response.bookings || [];
};

export const getTeacherBookings = async (teacherId) => {
  const response = await mobileApi.getTeacherBookings(teacherId);
  return response.bookings || [];
};

export const updateBookingStatus = async (bookingId, status) => {
  await mobileApi.updateBookingStatus(bookingId, status);
  return true;
};

export const bookAvailabilitySlot = async (studentId, teacherId, slotId, subject) => {
  const response = await mobileApi.createBooking(studentId, teacherId, slotId, subject);
  return response.booking;
};

/**
 * Availability Management
 */
export const setTeacherWeeklyAvailability = async (teacherId, schedule) => {
  await mobileApi.setTeacherAvailability(teacherId, schedule);
  return true;
};

export const getTeacherWeeklyAvailability = async (teacherId) => {
  const response = await mobileApi.getTeacherAvailability(teacherId);
  return response.availability || [];
};

export const getTeacherAvailableSlots = async (teacherId, date) => {
  const response = await mobileApi.getAvailableSlots(teacherId, date);
  return response.slots || [];
};

/**
 * Favorites
 */
export const addToFavorites = async (studentId, teacherId) => {
  await mobileApi.addToFavorites(studentId, teacherId);
  return true;
};

export const removeFromFavorites = async (studentId, teacherId) => {
  await mobileApi.removeFromFavorites(studentId, teacherId);
  return true;
};

export const getStudentFavorites = async (studentId) => {
  const response = await mobileApi.getFavorites(studentId);
  return response.favorites || [];
};

/**
 * Notifications
 */
export const getUnreadNotifications = async (userId, limit = 50) => {
  const response = await mobileApi.getNotifications(userId, limit);
  return response.notifications || [];
};

export const markNotificationAsRead = async (notificationId) => {
  await mobileApi.markNotificationAsRead(notificationId, true);
  return true;
};

export const getNotificationsPage = async (userId, options = {}) => {
  const { limit = 50 } = options;
  const response = await mobileApi.getNotifications(userId, limit);
  return {
    data: response.notifications || [],
    count: response.notifications?.length || 0,
  };
};

export const subscribeToNotifications = (userId, callback) => {
  // Note: Real-time subscriptions would need WebSocket implementation
  // For now, polling can be implemented at the component level
  const interval = setInterval(async () => {
    try {
      const notifications = await getUnreadNotifications(userId);
      callback(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, 5000); // Poll every 5 seconds

  return { unsubscribe: () => clearInterval(interval) };
};

/**
 * Meetings
 */
export const startMeeting = async (bookingId, meetingId, teacherId) => {
  await mobileApi.startMeeting(bookingId, teacherId, meetingId);
  return true;
};

export const endMeeting = async (bookingId, duration) => {
  await mobileApi.endMeeting(bookingId, duration);
  return true;
};

/**
 * Earnings
 */
export const getTeacherEarnings = async (teacherId) => {
  const response = await mobileApi.getTeacherEarnings(teacherId);
  return response;
};

/**
 * Video SDK
 */
export const getVideoToken = async () => {
  const response = await mobileApi.getVideoToken();
  return response.token;
};

export const getAdminCharges = async (teacherId) => {
  try {
    const response = await mobileApi.getAdminCharges(teacherId);
    return response.data;
  } catch (error) {
    // Return defaults if API fails
    return {
      teacher_rate: 500,
      gross_amount: 500,
      gst_amount: 90,
      platform_fee_amount: 37.5,
      total_amount: 627.5,
    };
  }
};

export const createPaymentOrder = async (bookingId, studentId, teacherId, basePrice, adminCharge, totalAmount) => {
  const response = await mobileApi.createPaymentOrder(
    bookingId,
    studentId,
    teacherId,
    basePrice,
    adminCharge,
    totalAmount
  );
  return response;
};

export const verifyPayment = async (paymentData) => {
  const response = await mobileApi.verifyPayment(paymentData);
  return response;
};

export const requestWithdrawal = async (teacherId, amount, bankDetails) => {
  const response = await mobileApi.requestWithdrawal(teacherId, amount, bankDetails);
  return response;
};

export default {
  // Profile
  getTeacherProfile,
  getStudentProfile,
  updateTeacherProfile,
  updateStudentProfile,
  getAllTeachers,
  getTeachersByProfession,
  searchTeachers,

  // Bookings
  createBooking,
  getStudentBookings,
  getTeacherBookings,
  updateBookingStatus,
  bookAvailabilitySlot,

  // Availability
  setTeacherWeeklyAvailability,
  getTeacherWeeklyAvailability,
  getTeacherAvailableSlots,

  // Favorites
  addToFavorites,
  removeFromFavorites,
  getStudentFavorites,

  // Notifications
  getUnreadNotifications,
  markNotificationAsRead,
  getNotificationsPage,
  subscribeToNotifications,

  // Meetings
  startMeeting,
  endMeeting,

  // Earnings
  getTeacherEarnings,

  // Video SDK
  getVideoToken,
  getAdminCharges,
  createPaymentOrder,
  verifyPayment,
  requestWithdrawal,
};
