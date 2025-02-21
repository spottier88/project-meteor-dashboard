
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";

interface ActivityTypeData {
  type: string;
  total: number;
}

interface ActivityTypeChartProps {
  activities: Array<{
    activity_type: string;
    duration_minutes: number;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

export const ActivityTypeChart = ({ activities }: ActivityTypeChartProps) => {
  const data = activities.reduce((acc: ActivityTypeData[], activity) => {
    const existingType = acc.find(item => item.type === activity.activity_type);
    if (existingType) {
      existingType.total += activity.duration_minutes / 60;
    } else {
      acc.push({
        type: activity.activity_type,
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
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label={(entry) => `${entry.type} (${Math.round(entry.total)}h)`}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${Math.round(value * 10) / 10}h`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
