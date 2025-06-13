import React from 'react';
import { MetricDisplayProps } from '../types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { CHART_TEXT_COLOR } from '../constants';
import Card from './Card'; 
import SkeletonLoader from './SkeletonLoader'; // New import

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06 0L10 9.06l-3.71 3.73a.75.75 0 11-1.06-1.06l4.24-4.25a.75.75 0 011.06 0l4.24 4.25a.75.75 0 010 1.06z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

const MinusIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
  </svg>
);


const MetricDisplay: React.FC<MetricDisplayProps> = ({
  title,
  value,
  unit,
  delta,
  deltaType = 'neutral',
  helpText,
  icon,
  isLoading,
  trend
}) => {
  const getDeltaColor = () => {
    if (deltaType === 'positive') return 'text-success';
    if (deltaType === 'negative') return 'text-danger';
    return 'text-text-secondary';
  };

  const getDeltaIcon = () => {
    if (deltaType === 'positive') return <ChevronUpIcon />;
    if (deltaType === 'negative') return <ChevronDownIcon />;
    return <MinusIcon/>;
  };
  
  const trendData = trend?.data.map((val, index) => ({name: index.toString(), value: val}));
  const trendColor = trend?.positiveIsGood ? (trend?.data[trend.data.length -1] >= trend?.data[0] ? '#10B981' : '#EF4444') : (trend?.data[trend.data.length -1] <= trend?.data[0] ? '#10B981' : '#EF4444');


  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <div className="space-y-2">
          <SkeletonLoader type="text" lines={1} className="w-3/4 h-5" /> {/* Title */}
          <SkeletonLoader type="text" lines={1} className="w-1/2 h-8" /> {/* Value */}
          {delta !== undefined && <SkeletonLoader type="text" lines={1} className="w-1/4 h-4" />} {/* Delta */}
          {trend && trend.data.length > 1 && <SkeletonLoader type="block" className="h-16 opacity-30 absolute bottom-0 left-0 right-0" />}
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-text-secondary truncate" title={helpText}>{title}</h3>
        {icon && <span className="text-text-secondary">{icon}</span>}
      </div>
      <div className="mt-1">
        <span className="text-3xl font-semibold text-text-primary">{value}</span>
        {unit && <span className="ml-1 text-sm text-text-secondary">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={`mt-1 flex items-center text-xs ${getDeltaColor()}`}>
          {getDeltaIcon()}
          <span className="ml-1">{Math.abs(Number(delta))}{typeof delta === 'string' && delta.includes('%') ? '%' : ''}</span>
        </div>
      )}
       {trend && trend.data.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <Line type="monotone" dataKey="value" stroke={trendColor || CHART_TEXT_COLOR} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default MetricDisplay;