
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useActivityTypes } from '@/hooks/useActivityTypes';

interface ActivityChartProps {
  data: any[];
}

export const ActivityChart = ({ data }: ActivityChartProps) => {
  const { data: activityTypes, isLoading } = useActivityTypes();

  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">Chargement des types d'activités...</div>;
  }

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
            formatter={(value: number, name: string) => {
              // Trouve le label du type d'activité s'il existe
              const activityType = activityTypes?.find(type => type.code === name);
              return [
                `${Math.round(value * 10) / 10}h`,
                activityType ? activityType.label : name
              ];
            }}
          />
          <Legend 
            formatter={(value) => {
              const activityType = activityTypes?.find(type => type.code === value);
              return activityType ? activityType.label : value;
            }}
          />
          {activityTypes?.map((type) => (
            <Bar
              key={type.code}
              dataKey={type.code}
              fill={type.color}
              stackId="a"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
