
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface ChartData {
  day: string;
  total: number;
}

interface ActivityChartProps {
  data: ChartData[];
}

export const ActivityChart = ({ data }: ActivityChartProps) => {
  return (
    <div className="w-full aspect-[2/1]">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
        >
          <XAxis 
            dataKey="day" 
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fill: '#666' }}
          />
          <YAxis 
            tickFormatter={(value) => `${value}h`}
            tick={{ fill: '#666' }}
          />
          <Tooltip 
            formatter={(value) => [`${value}h`, 'Heures']}
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="total" 
            name="Heures" 
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
