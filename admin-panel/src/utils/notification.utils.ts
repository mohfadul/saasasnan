/**
 * Notification Utility Functions
 * Centralized notification handling (replaces alert())
 * 
 * TODO: Replace with toast library like react-hot-toast or sonner
 * For now, using alert() but with consistent interface
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Show a notification to the user
 * @param message - Message to display
 * @param type - Notification type
 */
export const notify = (message: string, type: NotificationType = 'info'): void => {
  const emoji = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  
  // Using alert for now - should be replaced with toast library
  alert(`${emoji[type]} ${message}`);
};

/**
 * Show success notification
 */
export const notifySuccess = (message: string): void => {
  notify(message, 'success');
};

/**
 * Show error notification
 */
export const notifyError = (message: string): void => {
  notify(message, 'error');
};

/**
 * Show warning notification
 */
export const notifyWarning = (message: string): void => {
  notify(message, 'warning');
};

/**
 * Show info notification
 */
export const notifyInfo = (message: string): void => {
  notify(message, 'info');
};

/**
 * Show confirmation dialog
 * @param message - Message to display
 * @returns true if user confirmed
 */
export const confirmAction = (message: string): boolean => {
  return window.confirm(`⚠️ ${message}`);
};

/**
 * Extract and format error message from axios error
 * @param error - Error object
 * @returns Formatted error message
 */
export const extractErrorMessage = (error: any): string => {
  return error?.response?.data?.message || error?.message || 'An unexpected error occurred';
};

