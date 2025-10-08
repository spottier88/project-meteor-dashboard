/**
 * Composant graphique affichant la distribution des points par jour et par type d'activité
 */
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useActivityTypes } from '@/hooks/useActivityTypes';

interface PointsChartProps {
  data: any[];
}

export const PointsChart = ({ data }: PointsChartProps) => {
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
          <YAxis label={{ value: 'Points', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value: number, name: string) => {
              const activityType = activityTypes?.find(type => type.code === name);
              return [
                `${value} pts`,
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
