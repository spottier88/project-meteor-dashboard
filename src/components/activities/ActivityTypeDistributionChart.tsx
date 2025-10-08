/**
 * Composant graphique affichant la répartition des points par type d'activité
 * pour la semaine en cours
 */
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useActivityTypes } from '@/hooks/useActivityTypes';

interface ActivityTypeDistributionChartProps {
  data: any[];
}

export const ActivityTypeDistributionChart = ({ data }: ActivityTypeDistributionChartProps) => {
  const { data: activityTypes, isLoading } = useActivityTypes();

  if (isLoading) {
    return <div className="flex justify-center items-center h-[300px]">Chargement des types d'activités...</div>;
  }

  // Agréger les points par type d'activité
  const aggregatedData: { [key: string]: number } = {};
  
  data.forEach(point => {
    const activityType = point.activity_type || 'non_categorise';
    if (!aggregatedData[activityType]) {
      aggregatedData[activityType] = 0;
    }
    aggregatedData[activityType] += point.points;
  });

  // Transformer en tableau pour le graphique
  const chartData = Object.entries(aggregatedData).map(([code, points]) => {
    const activityType = activityTypes?.find(type => type.code === code);
    return {
      code,
      label: code === 'non_categorise' 
        ? 'Non catégorisé' 
        : (activityType?.label || code),
      points,
      color: code === 'non_categorise' 
        ? '#6B7280' 
        : (activityType?.color || '#808080')
    };
  }).sort((a, b) => b.points - a.points); // Trier par points décroissants

  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[300px] text-muted-foreground">
        Aucune donnée à afficher
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 5,
            right: 30,
            left: 100,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" label={{ value: 'Points', position: 'insideBottom', offset: -5 }} />
          <YAxis type="category" dataKey="label" width={90} />
          <Tooltip 
            formatter={(value: number) => [`${value} pts`, 'Points']}
          />
          <Bar dataKey="points" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
