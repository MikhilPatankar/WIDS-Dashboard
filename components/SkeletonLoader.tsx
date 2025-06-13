import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  type?: 'text' | 'title' | 'block' | 'circle' | 'line'; // Future use for more specific skeletons
  lines?: number; // For multi-line text skeletons
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = '', type = 'block', lines = 1 }) => {
  if (type === 'text' || type === 'title' || type === 'line') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-tertiary-dark rounded animate-skeleton-pulse ${
              type === 'title' ? 'w-3/4' : 
              type === 'line' ? 'w-full' :
              i === lines - 1 && lines > 1 ? 'w-5/6' : 'w-full' // Last line of multi-line text
            }`}
          />
        ))}
      </div>
    );
  }
  
  if (type === 'circle') {
    return <div className={`bg-tertiary-dark rounded-full animate-skeleton-pulse ${className || 'w-10 h-10'}`}></div>;
  }

  // Default 'block' type
  return <div className={`bg-tertiary-dark rounded animate-skeleton-pulse ${className || 'h-20 w-full'}`}></div>;
};

export default SkeletonLoader;