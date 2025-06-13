
import React from 'react';
import { ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

interface ViewSwitcherProps {
  currentView: 'list' | 'card';
  onViewChange: (view: 'list' | 'card') => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center space-x-1 bg-secondary-dark p-1 rounded-lg">
      <button
        onClick={() => onViewChange('list')}
        title="List View"
        className={`p-2 rounded-md transition-colors ${
          currentView === 'list' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-tertiary-dark'
        }`}
      >
        <ListBulletIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onViewChange('card')}
        title="Card View"
        className={`p-2 rounded-md transition-colors ${
          currentView === 'card' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-tertiary-dark'
        }`}
      >
        <Squares2X2Icon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ViewSwitcher;
