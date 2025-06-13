
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../../types';
import { CHART_LINE_COLOR, CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../../constants';

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  xAxisKey: string;
  dataKey: string;
  lineColor?: string;
  height?: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, xAxisKey, dataKey, lineColor = CHART_LINE_COLOR, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
        <XAxis dataKey={xAxisKey} stroke={CHART_TEXT_COLOR} tick={{ fontSize: 12 }} />
        <YAxis stroke={CHART_TEXT_COLOR} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '0.5rem' }}
          labelStyle={{ color: CHART_TEXT_COLOR, fontWeight: 'bold' }}
          itemStyle={{ color: lineColor }}
        />
        <Legend wrapperStyle={{fontSize: "12px"}}/>
        <Line type="monotone" dataKey={dataKey} stroke={lineColor} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} name={dataKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SimpleLineChart;
