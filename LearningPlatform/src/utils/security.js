/**
 * Security utilities for protecting API calls
 * - CSRF token handling
 * - Secure fetch wrapper
 * - Request validation
 */

/**
 * Generate and store CSRF token
 * In production, this should be fetched from backend
 */
export const getCsrfToken = () => {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = generateToken();
    sessionStorage.setItem('csrf_token', token);
  }
  return token;
};

/**
 * Generate a random CSRF token (client-side fallback)
 * In production, get this from server headers
 */
const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Wrapper for fetch that adds CSRF protection
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const secureFetch = (url, options = {}) => {
  const method = options.method?.toUpperCase() || 'GET';

  // Add CSRF token to non-GET requests
  if (method !== 'GET') {
    const headers = {
      ...options.headers,
      'X-CSRF-Token': getCsrfToken(),
      'Content-Type': 'application/json',
    };

    return fetch(url, {
      ...options,
      method,
      headers,
      credentials: 'same-origin', // Send cookies with request
    });
  }

  return fetch(url, options);
};

/**
 * Validate that a POST request is safe to execute
 * @param {string} action - Action description
 * @param {boolean} confirmed - User confirmation
 * @returns {boolean} Whether action is safe
 */
export const validateSecureAction = (action, confirmed = false) => {
  if (!confirmed) {
    console.warn(`⚠️ Unconfirmed action attempted: ${action}`);
    return false;
  }
  return true;
};

/**
 * Log sensitive action for audit trail
 * @param {object} actionData - Action details to log
 */
export const logAuditAction = async (actionData) => {
  try {
    const auditLog = {
      timestamp: new Date().toISOString(),
      action: actionData.action,
      userId: actionData.userId,
      targetId: actionData.targetId,
      details: actionData.details,
      ip: actionData.ip, // Should be set by server
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Audit Log:', auditLog);
    }

    // In production, send to audit logging endpoint
    // await fetch('/api/audit/log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(auditLog),
    // });
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
};

/**
 * Validate financial amount
 * @param {number} amount - Amount to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
export const validateFinancialAmount = (amount, options = {}) => {
  const {
    min = 1,
    max = 10000000,
    decimalPlaces = 0,
  } = options;

  const errors = [];

  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push('Amount must be a valid number');
    return { valid: false, errors };
  }

  if (amount < min) {
    errors.push(`Amount must be at least ₹${min}`);
  }

  if (amount > max) {
    errors.push(`Amount cannot exceed ₹${max}`);
  }

  if (decimalPlaces === 0 && !Number.isInteger(amount)) {
    errors.push('Amount must be a whole number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate percentage value
 * @param {number} value - Percentage value
 * @returns {object} Validation result
 */
export const validatePercentage = (value) => {
  const errors = [];

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push('Percentage must be a valid number');
    return { valid: false, errors };
  }

  if (value < 0 || value > 100) {
    errors.push('Percentage must be between 0 and 100');
  }

  if (!Number.isInteger(value)) {
    errors.push('Percentage must be a whole number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate bank details
 * @param {object} bankDetails - Bank details object
 * @returns {object} Validation result
 */
export const validateBankDetails = (bankDetails) => {
  const errors = [];

  if (!bankDetails.accountNumber || bankDetails.accountNumber.trim().length === 0) {
    errors.push('Bank account number is required');
  }

  if (!bankDetails.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode)) {
    errors.push('Invalid IFSC code format (e.g., HDFC0000001)');
  }

  if (!bankDetails.accountHolderName || bankDetails.accountHolderName.trim().length === 0) {
    errors.push('Account holder name is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
