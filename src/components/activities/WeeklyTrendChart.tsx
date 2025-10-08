/**
 * Composant graphique affichant l'évolution des points sur plusieurs semaines
 * avec répartition par type d'activité
 */
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useActivityTypes } from '@/hooks/useActivityTypes';

interface WeeklyTrendChartProps {
  data: any[];
}

export const WeeklyTrendChart = ({ data }: WeeklyTrendChartProps) => {
  const { data: activityTypes, isLoading } = useActivityTypes();

  if (isLoading) {
    return <div className="flex justify-center items-center h-[350px]">Chargement des types d'activités...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-[350px] text-muted-foreground">
        Aucune donnée à afficher
      </div>
    );
  }

  // Récupérer tous les types d'activités présents dans les données
  const activityTypeCodes = new Set<string>();
  data.forEach(week => {
    Object.keys(week).forEach(key => {
      if (key !== 'week' && key !== 'weekStart') {
        activityTypeCodes.add(key);
      }
    });
  });

  const typesArray = Array.from(activityTypeCodes);

  return (
    <div className="w-full h-[350px]">
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
          <XAxis dataKey="week" />
          <YAxis label={{ value: 'Points', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'non_categorise') {
                return [`${value} pts`, 'Non catégorisé'];
              }
              const activityType = activityTypes?.find(type => type.code === name);
              return [
                `${value} pts`,
                activityType ? activityType.label : name
              ];
            }}
          />
          <Legend 
            formatter={(value) => {
              if (value === 'non_categorise') {
                return 'Non catégorisé';
              }
              const activityType = activityTypes?.find(type => type.code === value);
              return activityType ? activityType.label : value;
            }}
          />
          {typesArray.map((code) => {
            const activityType = activityTypes?.find(type => type.code === code);
            const color = code === 'non_categorise' 
              ? '#6B7280' 
              : (activityType?.color || '#808080');
            
            return (
              <Bar
                key={code}
                dataKey={code}
                fill={color}
                stackId="a"
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
