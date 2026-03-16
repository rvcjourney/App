/**
 * Application Configuration Constants
 * Centralized hardcoded values used across the app
 */

// Payment & Charges Configuration
export const PAYMENT_CONFIG = {
  GST_RATE: 0.18, // 18% GST
  PLATFORM_FEE_RATE: 0.075, // 7.5% platform fee
  RAZORPAY_KEY_ID: 'YOUR_RAZORPAY_KEY_ID', // Move to .env for production
};

// Meeting Configuration
export const MEETING_CONFIG = {
  AUTO_END_CHECK_INTERVAL_MS: 15000, // Check for auto-end every 15 seconds
  TOKEN_FETCH_TIMEOUT_MS: 15000, // 15 second timeout for token fetch
  ROOM_CREATION_TIMEOUT_MS: 20000, // 20 second timeout for room creation
  PROFILE_SYNC_RETRY_COUNT: 6, // Retry profile sync 6 times
  PROFILE_SYNC_RETRY_INTERVAL_MS: 600, // 600ms between retries
};

// UI Configuration
export const UI_CONFIG = {
  NOTIFICATION_DEBOUNCE_MS: 400, // Debounce notification toasts
};

// Teacher Configuration
export const TEACHER_CONFIG = {
  DEFAULT_RATING: 4.8,
  DEFAULT_FOLLOWERS: 0,
  DEFAULT_EXPERIENCE_YEARS: 0,
  DEFAULT_PRICE_PER_CALL: 500,
};

// Categories
export const CATEGORIES = [
  'All',
  'Math',
  'Physics',
  'Chemistry',
  'English',
  'Science',
];

export default {
  PAYMENT_CONFIG,
  MEETING_CONFIG,
  UI_CONFIG,
  TEACHER_CONFIG,
  CATEGORIES,
};
