/**
 * Centralized logging utility
 * Wraps console methods with __DEV__ flag to prevent debug logs in production
 */

const logger = {
  info: (title, ...args) => {
    if (__DEV__) {
      console.log(`🔵 ${title}`, ...args);
    }
  },

  success: (title, ...args) => {
    if (__DEV__) {
      console.log(`✅ ${title}`, ...args);
    }
  },

  error: (title, ...args) => {
    console.error(`🔴 ${title}`, ...args); // Always log errors, even in production
  },

  warn: (title, ...args) => {
    if (__DEV__) {
      console.warn(`⚠️ ${title}`, ...args);
    }
  },

  wait: (title, ...args) => {
    if (__DEV__) {
      console.log(`⏳ ${title}`, ...args);
    }
  },
};

export default logger;
