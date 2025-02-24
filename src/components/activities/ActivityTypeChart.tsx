
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";

interface ActivityTypeData {
  type: string;
  displayType: string;
  total: number;
}

interface ActivityTypeChartProps {
  activities: Array<{
    activity_type: string;
    duration_minutes: number;
  }>;
}

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

export const ActivityTypeChart = ({ activities }: ActivityTypeChartProps) => {
  const data = activities.reduce((acc: ActivityTypeData[], activity) => {
    const existingType = acc.find(item => item.type === activity.activity_type);
    if (existingType) {
      existingType.total += activity.duration_minutes / 60;
    } else {
      acc.push({
        type: activity.activity_type,
        displayType: ACTIVITY_LABELS[activity.activity_type as keyof typeof ACTIVITY_LABELS] || activity.activity_type,
        total: activity.duration_minutes / 60
      });
    }
    return acc;
  }, []);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Distribution par type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="displayType"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label={(entry) => `${entry.displayType} (${Math.round(entry.total)}h)`}
              >
                {data.map((entry) => (
                  <Cell 
                    key={entry.type} 
                    fill={ACTIVITY_COLORS[entry.type as keyof typeof ACTIVITY_COLORS] || '#999999'}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${Math.round(value * 10) / 10}h`,
                  name
                ]}
              />
              <Legend formatter={(value) => {
                if (typeof value === 'string') {
                  return ACTIVITY_LABELS[value as keyof typeof ACTIVITY_LABELS] || value;
                }
                return value;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

