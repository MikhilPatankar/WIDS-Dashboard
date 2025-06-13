import React, { ReactNode, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon } from '../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'; // Added new sizes
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const focusableElementsString =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

    let firstFocusableElement: HTMLElement | null = null;
    let lastFocusableElement: HTMLElement | null = null;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(focusableElementsString)
        ).filter(el => el.offsetParent !== null); // Filter for visible elements

        if (focusableElements.length === 0) return;

        firstFocusableElement = focusableElements[0];
        lastFocusableElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            event.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            event.preventDefault();
          }
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('keydown', handleTabKey);
      
      setTimeout(() => { 
        if (modalRef.current) {
          const focusableElements = Array.from(
            modalRef.current.querySelectorAll<HTMLElement>(focusableElementsString)
          ).filter(el => el.offsetParent !== null);
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            modalRef.current.focus(); 
          }
        }
      }, 100);


    }
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-primary-dark/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose} 
    >
      <div 
        ref={modalRef}
        className={`bg-secondary-dark rounded-lg shadow-xl w-full ${sizeClasses[size]} overflow-hidden transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-appear`}
        style={{ animationName: 'modalAppear', animationDuration: '0.3s', animationFillMode: 'forwards' }}
        onClick={(e) => e.stopPropagation()} 
        tabIndex={-1} 
      >
        <div className="flex justify-between items-center p-4 border-b border-tertiary-dark">
          <h2 id="modal-title" className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:bg-tertiary-dark hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto"> {/* Increased max-h for larger modals */}
          {children}
        </div>
      </div>
      <style>{`
        @keyframes modalAppear {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>,
    document.getElementById('modal-root')!
  );
};

export default Modal;
