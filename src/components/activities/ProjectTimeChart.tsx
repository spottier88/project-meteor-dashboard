
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ProjectTimeData {
  project: string;
  total: number;
}

interface ProjectTimeChartProps {
  activities: Array<{
    duration_minutes: number;
    projects?: {
      title: string;
    } | null;
  }>;
}

export const ProjectTimeChart = ({ activities }: ProjectTimeChartProps) => {
  const data = activities.reduce((acc: ProjectTimeData[], activity) => {
    // Définir le nom du projet (ou "Sans projet" si aucun projet n'est associé)
    const projectName = activity.projects?.title || "Sans projet";
    
    const existingProject = acc.find(item => item.project === projectName);
    if (existingProject) {
      existingProject.total += activity.duration_minutes / 60;
    } else {
      acc.push({
        project: projectName,
        total: activity.duration_minutes / 60
      });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Temps par projet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" unit="h" />
              <YAxis 
                type="category" 
                dataKey="project" 
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${Math.round(value * 10) / 10}h`, 'Heures']}
              />
              <Bar 
                dataKey="total" 
                fill="#8884d8" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
