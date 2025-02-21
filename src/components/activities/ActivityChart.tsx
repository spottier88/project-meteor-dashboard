
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
  [key: string]: string | number;
}

interface ActivityChartProps {
  data: ChartData[];
}

const ACTIVITY_COLORS = {
  developpement: "#8884d8",
  reunion: "#82ca9d",
  analyse: "#ffc658",
  documentation: "#ff7300",
  support: "#0088fe",
};

export const ActivityChart = ({ data }: ActivityChartProps) => {
  // Extraire tous les types d'activités uniques des données
  const activityTypes = Array.from(
    new Set(
      data.flatMap(entry => 
        Object.keys(entry).filter(key => key !== 'day' && typeof entry[key] === 'number')
      )
    )
  );

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
          {activityTypes.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              name={type.charAt(0).toUpperCase() + type.slice(1)}
              stackId="a"
              fill={ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS] || "#8884d8"}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

