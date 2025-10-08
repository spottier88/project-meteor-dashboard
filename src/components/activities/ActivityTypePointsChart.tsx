/**
 * Composant graphique affichant la distribution des points par type d'activité (diagramme circulaire)
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useActivityTypes } from '@/hooks/useActivityTypes';

interface ActivityTypePointsChartProps {
  points: Array<{
    points: number;
    activity_type?: string;
    activity_types?: {
      label: string;
      color: string;
    } | null;
  }>;
}

export const ActivityTypePointsChart = ({ points }: ActivityTypePointsChartProps) => {
  const { data: activityTypes } = useActivityTypes();

  const data = points.reduce((acc: any[], point) => {
    if (!point.activity_type) return acc;
    
    const activityType = activityTypes?.find(type => type.code === point.activity_type);
    const label = activityType?.label || point.activity_type;
    const color = activityType?.color || '#808080';
    
    const existing = acc.find(item => item.name === label);
    if (existing) {
      existing.value += point.points;
    } else {
      acc.push({
        name: label,
        value: point.points,
        color: color
      });
    }
    return acc;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Points par type d'activité</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} pts`, 'Points']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
