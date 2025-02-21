
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyDashboard } from './WeeklyDashboard';
import { ActivityEntry } from './ActivityEntry';

export const ActivityManagement = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Mes activités</h1>
        <ActivityEntry />
      </div>
      <WeeklyDashboard />
    </div>
  );
};

