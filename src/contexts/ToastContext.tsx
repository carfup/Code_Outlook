/**
 * Toast notification context for displaying success/error messages
 */

import React, { createContext, useContext, useCallback, useId } from 'react';
import {
  Toaster,
  useToastController,
  ToastTitle,
  Toast,
} from '@fluentui/react-components';
import type { ToastIntent } from '@fluentui/react-components';

interface ToastContextValue {
  showToast: (message: string, intent: ToastIntent) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const showToast = useCallback(
    (message: string, intent: ToastIntent) => {
      dispatchToast(
        <Toast>
          <ToastTitle>{message}</ToastTitle>
        </Toast>,
        { intent, timeout: intent === 'error' ? 5000 : 3000, position: 'top-end' }
      );
    },
    [dispatchToast]
  );

  const showSuccess = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast]
  );

  const showError = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => showToast(message, 'warning'),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => showToast(message, 'info'),
    [showToast]
  );

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      <Toaster toasterId={toasterId} />
      {children}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
