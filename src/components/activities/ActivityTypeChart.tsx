
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";
import { useActivityTypes } from '@/hooks/useActivityTypes';

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

export const ActivityTypeChart = ({ activities }: ActivityTypeChartProps) => {
  const { data: activityTypes, isLoading } = useActivityTypes();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-[300px]">Chargement des types d'activités...</div>;
  }

  const data = activities.reduce((acc: ActivityTypeData[], activity) => {
    const existingType = acc.find(item => item.type === activity.activity_type);
    const activityTypeInfo = activityTypes?.find(type => type.code === activity.activity_type);
    
    if (existingType) {
      existingType.total += activity.duration_minutes / 60;
    } else {
      acc.push({
        type: activity.activity_type,
        displayType: activityTypeInfo?.label || activity.activity_type,
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
                {data.map((entry) => {
                  const activityTypeInfo = activityTypes?.find(type => type.code === entry.type);
                  return (
                    <Cell 
                      key={entry.type} 
                      fill={activityTypeInfo?.color || '#999999'}
                    />
                  );
                })}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${Math.round(value * 10) / 10}h`,
                  name
                ]}
              />
              <Legend formatter={(value) => {
                if (typeof value === 'string') {
                  const activityType = activityTypes?.find(type => type.code === value);
                  return activityType?.label || value;
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
