import toast from 'react-hot-toast';

/**
 * Notification utilities for user feedback
 * Provides consistent error, success, and info messages
 */

/**
 * Show error toast notification
 * @param {string} message - Error message
 * @param {object} options - Toast options
 */
export const showError = (message, options = {}) => {
  toast.error(message, {
    duration: 4000,
    ...options,
  });
};

/**
 * Show success toast notification
 * @param {string} message - Success message
 * @param {object} options - Toast options
 */
export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Show info toast notification
 * @param {string} message - Info message
 * @param {object} options - Toast options
 */
export const showInfo = (message, options = {}) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    ...options,
  });
};

/**
 * Show loading toast notification
 * @param {string} message - Loading message
 * @returns {string} Toast ID for later dismissal
 */
export const showLoading = (message) => {
  return toast.loading(message, {
    duration: Infinity,
  });
};

/**
 * Dismiss a specific toast by ID
 * @param {string} toastId - Toast ID returned from showLoading
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.remove();
};

/**
 * Show promise-based toast (for async operations)
 * @param {Promise} promise - Promise to track
 * @param {object} messages - Success, error, loading messages
 */
export const showPromiseToast = (promise, messages = {}) => {
  const {
    loading = 'Loading...',
    success = 'Success!',
    error = 'Something went wrong',
  } = messages;

  toast.promise(
    promise,
    {
      loading,
      success,
      error,
    },
    {
      duration: 4000,
    }
  );
};

/**
 * Show confirmation dialog (uses toast as fallback)
 * @param {string} message - Confirmation message
 * @param {object} callbacks - onConfirm and onCancel callbacks
 */
export const showConfirmation = (message, callbacks = {}) => {
  const { onConfirm = () => {}, onCancel = () => {} } = callbacks;

  // Create a custom toast with buttons
  toast((t) => (
    <div className="d-flex justify-content-between align-items-center gap-2">
      <span>{message}</span>
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-success"
          onClick={() => {
            onConfirm();
            toast.dismiss(t.id);
          }}
        >
          Confirm
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => {
            onCancel();
            toast.dismiss(t.id);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  ), {
    duration: Infinity,
  });
};

/**
 * Handle API errors and show appropriate notification
 * @param {Error|object} error - Error object
 * @param {string} context - Context for error message
 */
export const handleApiError = (error, context = 'Operation') => {
  let message = `${context} failed. Please try again.`;

  if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      message = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('timeout') || error.message.includes('abort')) {
      message = 'Request timed out. Please try again.';
    } else {
      message = error.message;
    }
  } else if (error?.error?.message) {
    message = error.error.message;
  }

  showError(message);
};

/**
 * Show validation error with field details
 * @param {Array} errors - Array of validation errors
 */
export const showValidationError = (errors) => {
  if (Array.isArray(errors) && errors.length > 0) {
    const errorList = errors.map((err) => {
      if (typeof err === 'string') return err;
      if (err.message) return err.message;
      return 'Validation error';
    }).join('\n');

    showError(errorList);
  }
};

export default {
  showError,
  showSuccess,
  showInfo,
  showLoading,
  dismissToast,
  dismissAllToasts,
  showPromiseToast,
  showConfirmation,
  handleApiError,
  showValidationError,
};
