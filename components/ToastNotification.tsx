import React, { useEffect, useState } from 'react';
import { ToastMessage, ToastType } from '../types';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon, ToastSuccessIcon, ToastErrorIcon, ToastWarningIcon, ToastInfoIcon } from '../constants';

interface ToastNotificationProps {
  toast: ToastMessage;
  autoDismissDelay?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, autoDismissDelay = 5000 }) => {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        setIsDismissing(true);
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismissDelay]);

  useEffect(() => {
    if (isDismissing) {
      const animationTimer = setTimeout(() => {
        removeToast(toast.id);
        setIsVisible(false); // Ensure it's fully removed from DOM if animation takes time
      }, 450); // Match animation duration in CSS
      return () => clearTimeout(animationTimer);
    }
  }, [isDismissing, removeToast, toast.id]);

  const handleClose = () => {
    setIsDismissing(true);
  };

  const getIcon = (type: ToastType) => {
    const iconProps = { className: "w-6 h-6" };
    switch (type) {
      case 'success': return <ToastSuccessIcon {...iconProps} />;
      case 'error': return <ToastErrorIcon {...iconProps} />;
      case 'warning': return <ToastWarningIcon {...iconProps} />;
      case 'info': return <ToastInfoIcon {...iconProps} />;
      default: return <ToastInfoIcon {...iconProps} />;
    }
  };

  const typeClasses: Record<ToastType, string> = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info',
  };

  if (!isVisible) return null;

  return (
    <div 
        className={`toast ${typeClasses[toast.type]} ${isDismissing ? 'animate-toast-out' : 'animate-toast-in'}`}
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true"
    >
      <div className="toast-icon">{getIcon(toast.type)}</div>
      <div className="toast-content">
        <p className="toast-title">{toast.title}</p>
        {toast.message && <p className="toast-message">{toast.message}</p>}
      </div>
      <button onClick={handleClose} className="toast-close-button text-text-secondary hover:text-text-primary" aria-label="Close notification">
        <XMarkIcon className="w-5 h-5" />
      </button>
      {!isDismissing && autoDismissDelay > 0 && (
        <div className="toast-progress-bar" style={{ animationDuration: `${autoDismissDelay}ms` }}></div>
      )}
    </div>
  );
};

export default ToastNotification;