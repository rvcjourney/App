/**
 * Network error detection utility
 * Shared across auth and payment screens
 */

export const isNetworkError = (error) => {
  if (!error) return false;
  const errorMsg = (error.message || '').toLowerCase();
  return (
    errorMsg.includes('network') ||
    errorMsg.includes('failed to fetch') ||
    errorMsg.includes('enotfound') ||
    errorMsg.includes('econnrefused') ||
    errorMsg.includes('timeout') ||
    errorMsg.includes('offline')
  );
};

export default isNetworkError;
