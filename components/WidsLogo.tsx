import React from 'react';

interface WidsLogoProps extends React.SVGProps<SVGSVGElement> {
  compact?: boolean;
}

const WidsLogo: React.FC<WidsLogoProps> = ({ compact = false, ...props }) => {
  if (compact) {
    return (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="WIDS Dashboard Logo Compact"
        {...props}
      >
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      </svg>
    );
  }

  return (
    <div className="flex items-center space-x-2" aria-label="WIDS Dashboard Logo">
       <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8" // Default size for the icon part
        {...props}
       >
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      </svg>
      <span className="font-bold text-xl tracking-tight" style={{ color: props.color || 'currentColor' }}>
        WIDS
      </span>
    </div>
  );
};

export default WidsLogo;