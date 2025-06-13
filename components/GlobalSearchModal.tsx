import React from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon, MagnifyingGlassIcon } from '../constants';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const portalRoot = document.getElementById('search-modal-root');
  if (!portalRoot) {
    console.error("Search modal root element 'search-modal-root' not found in the DOM.");
    return null;
  }

  return ReactDOM.createPortal(
    <div 
      className="global-search-modal-overlay"
      onClick={onClose} // Close on overlay click
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-title"
    >
      <div 
        className="global-search-modal"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex items-center justify-between p-4 border-b border-tertiary-dark">
          <h2 id="global-search-title" className="text-lg font-semibold text-text-primary flex items-center">
            <MagnifyingGlassIcon className="w-5 h-5 mr-2 text-text-secondary"/>
            Global Search
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:bg-tertiary-dark hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            aria-label="Close search modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          <input
            type="search"
            placeholder="Search models, datasets, events..."
            className="w-full p-3 bg-primary-dark border border-tertiary-dark rounded-md text-text-primary focus:ring-2 focus:ring-accent-blue focus:border-accent-blue placeholder-text-secondary"
            autoFocus
          />
        </div>

        <div className="p-4 h-80 overflow-y-auto">
          {/* Placeholder for search results */}
          <div className="text-center text-text-secondary py-10">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-50"/>
            <p>Start typing to search across the WIDS Dashboard.</p>
            <p className="text-xs mt-2">(Search functionality is a UI placeholder in this demo)</p>
          </div>
          {/* Example of how results might look later:
          <ul className="space-y-2">
            <li className="p-3 hover:bg-tertiary-dark rounded-md cursor-pointer">
              <p className="font-medium text-text-primary">Model_Alpha_V2</p>
              <p className="text-xs text-text-secondary">Type: Model, Status: Production</p>
            </li>
             <li className="p-3 hover:bg-tertiary-dark rounded-md cursor-pointer">
              <p className="font-medium text-text-primary">AWID3_Training_Dataset</p>
              <p className="text-xs text-text-secondary">Type: Dataset, Status: Ready</p>
            </li>
          </ul>
          */}
        </div>
        <div className="p-3 border-t border-tertiary-dark text-xs text-text-secondary text-right">
          Powered by WIDS Search (Mock)
        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default GlobalSearchModal;