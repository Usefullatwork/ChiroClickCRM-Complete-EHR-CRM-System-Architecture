/**
 * Toast Notification Utility
 * Wrapper around Sonner toast library
 */

import { toast as sonnerToast } from 'sonner';

/**
 * Success toast
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 */
export const success = (message, options = {}) => {
  return sonnerToast.success(message, {
    duration: 4000,
    ...options
  });
};

/**
 * Error toast
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 */
export const error = (message, options = {}) => {
  return sonnerToast.error(message, {
    duration: 5000,
    ...options
  });
};

/**
 * Info toast
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 */
export const info = (message, options = {}) => {
  return sonnerToast.info(message, {
    duration: 4000,
    ...options
  });
};

/**
 * Warning toast
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 */
export const warning = (message, options = {}) => {
  return sonnerToast.warning(message, {
    duration: 4500,
    ...options
  });
};

/**
 * Loading toast
 * @param {string} message - Loading message
 * @returns {string|number} Toast ID
 */
export const loading = (message) => {
  return sonnerToast.loading(message);
};

/**
 * Promise toast
 * Shows loading state and resolves to success/error
 * @param {Promise} promise - Promise to track
 * @param {Object} messages - Messages for loading, success, error states
 */
export const promise = (promise, messages) => {
  return sonnerToast.promise(promise, messages);
};

/**
 * Dismiss a toast by ID
 * @param {string|number} toastId - Toast ID to dismiss
 */
export const dismiss = (toastId) => {
  return sonnerToast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAll = () => {
  return sonnerToast.dismiss();
};

// Export default object with all methods
const toast = {
  success,
  error,
  info,
  warning,
  loading,
  promise,
  dismiss,
  dismissAll
};

export default toast;
