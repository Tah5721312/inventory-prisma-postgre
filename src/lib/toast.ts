/**
 * Toast notification utility functions
 * Provides a unified interface for showing notifications
 */

import { toast, ToastOptions } from 'react-toastify';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessageOptions extends ToastOptions {
  message: string;
  type?: ToastType;
}

/**
 * Show a toast notification
 */
export const showToast = (message: string, type: ToastType = 'info', options?: ToastOptions) => {
  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: type === 'error' ? 5000 : 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  };

  switch (type) {
    case 'success':
      return toast.success(message, toastOptions);
    case 'error':
      return toast.error(message, toastOptions);
    case 'warning':
      return toast.warning(message, toastOptions);
    case 'info':
    default:
      return toast.info(message, toastOptions);
  }
};

/**
 * Success toast
 */
export const toastSuccess = (message: string, options?: ToastOptions) => {
  return showToast(message, 'success', options);
};

/**
 * Error toast
 */
export const toastError = (message: string, options?: ToastOptions) => {
  return showToast(message, 'error', options);
};

/**
 * Warning toast
 */
export const toastWarning = (message: string, options?: ToastOptions) => {
  return showToast(message, 'warning', options);
};

/**
 * Info toast
 */
export const toastInfo = (message: string, options?: ToastOptions) => {
  return showToast(message, 'info', options);
};

/**
 * Replace alert() with toast
 * This function can be used as a drop-in replacement for alert()
 */
export const toastAlert = (message: string, type: ToastType = 'info') => {
  showToast(message, type);
};

