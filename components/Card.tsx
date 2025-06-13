
import React from 'react';
import SkeletonLoader from './SkeletonLoader'; // New import

interface CardProps {
  title?: React.ReactNode; // Changed from string to React.ReactNode
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  icon?: React.ReactNode;
  isLoading?: boolean; // New prop for loading state
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '', bodyClassName = '', icon, isLoading }) => {
  return (
    <div className={`bg-secondary-dark rounded-lg shadow-xl overflow-hidden ${className}`}>
      {title !== undefined && ( // Check for undefined to allow titles like 0 or empty string if needed
        <div className={`p-4 sm:p-5 border-b border-tertiary-dark ${titleClassName}`}>
          {isLoading ? (
            <SkeletonLoader type="title" className="h-6" />
          ) : (
            <div className="flex items-center space-x-2">
              {icon && <span className="flex-shrink-0">{icon}</span>}
              {/* h3 can render ReactNode directly. Truncate class might only work well for string children. */}
              <h3 className="text-lg font-semibold text-text-primary truncate">{title}</h3>
            </div>
          )}
        </div>
      )}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>
        {isLoading && title === undefined ? <SkeletonLoader type="block" className="h-20" /> : children}
      </div>
    </div>
  );
};

export default Card;
