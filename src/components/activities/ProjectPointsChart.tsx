/**
 * Composant graphique affichant la distribution des points par projet
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ProjectPointsData {
  project: string;
  total: number;
}

interface ProjectPointsChartProps {
  points: Array<{
    points: number;
    projects?: {
      title: string;
    } | null;
  }>;
}

export const ProjectPointsChart = ({ points }: ProjectPointsChartProps) => {
  const data = points.reduce((acc: ProjectPointsData[], point) => {
    const projectName = point.projects?.title || "Sans projet";
    
    const existingProject = acc.find(item => item.project === projectName);
    if (existingProject) {
      existingProject.total += point.points;
    } else {
      acc.push({
        project: projectName,
        total: point.points
      });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Points par projet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" label={{ value: 'Points', position: 'insideBottom', offset: -5 }} />
              <YAxis 
                type="category" 
                dataKey="project" 
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} pts`, 'Points']}
              />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
