
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ACTIVITY_COLORS = {
  development: '#8884d8',
  testing: '#82ca9d',
  documentation: '#ffc658',
  meeting: '#ff8042',
  support: '#a4de6c',
  training: '#d0ed57',
  other: '#b19cd9'
};

const ACTIVITY_LABELS = {
  development: 'Développement',
  testing: 'Test',
  documentation: 'Documentation',
  meeting: 'Réunion',
  support: 'Support',
  training: 'Formation',
  other: 'Autre'
};

interface ActivityChartProps {
  data: any[];
}

export const ActivityChart = ({ data }: ActivityChartProps) => {
  const activityTypes = [
    'development',
    'testing',
    'documentation',
    'meeting',
    'support',
    'training',
    'other'
  ];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis unit="h" />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `${Math.round(value * 10) / 10}h`,
              ACTIVITY_LABELS[name as keyof typeof ACTIVITY_LABELS] || name
            ]}
          />
          <Legend 
            formatter={(value) => ACTIVITY_LABELS[value as keyof typeof ACTIVITY_LABELS] || value}
          />
          {activityTypes.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              fill={ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS]}
              stackId="a"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

