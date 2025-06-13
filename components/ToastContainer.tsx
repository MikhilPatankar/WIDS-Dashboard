import React from 'react';
import ReactDOM from 'react-dom';
import { useToast } from '../contexts/ToastContext';
import ToastNotification from './ToastNotification';

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();
  const portalRoot = document.getElementById('toast-root');

  if (!portalRoot) {
    console.error("Toast root element 'toast-root' not found in the DOM.");
    return null; // Or render inline if portal fails, though less ideal for stacking
  }
  
  return ReactDOM.createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastNotification key={toast.id} toast={toast} />
      ))}
    </div>,
    portalRoot
  );
};

export default ToastContainer;