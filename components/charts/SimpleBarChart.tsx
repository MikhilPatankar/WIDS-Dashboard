
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../../types';
import { CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../../constants';

interface SimpleBarChartProps {
  data: ChartDataPoint[];
  xAxisKey: string;
  dataKey: string;
  barColor?: string;
  height?: number;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, xAxisKey, dataKey, barColor = "#8B5CF6", height = 300 }) => { // accent-purple
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
        <XAxis dataKey={xAxisKey} stroke={CHART_TEXT_COLOR} tick={{ fontSize: 12 }} />
        <YAxis stroke={CHART_TEXT_COLOR} tick={{ fontSize: 12 }}/>
        <Tooltip
          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '0.5rem' }}
          labelStyle={{ color: CHART_TEXT_COLOR, fontWeight: 'bold' }}
          itemStyle={{ color: barColor }}
          cursor={false} // Disable the default tooltip cursor background
        />
        <Legend wrapperStyle={{fontSize: "12px"}}/>
        <Bar 
          dataKey={dataKey} 
          fill={barColor} 
          radius={[4, 4, 0, 0]} 
          name={dataKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          activeBar={false} // Keep this as it might handle the bar itself if styled differently by default
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SimpleBarChart;