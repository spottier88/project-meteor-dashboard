
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Activity {
  id: string;
  start_time: string;
  duration_minutes: number;
  activity_type: string;
  description?: string;
  projects: {
    title: string;
  };
}

interface DayActivities {
  date: Date;
  day: string;
  activities: Activity[];
  total: number;
}

interface ActivityListProps {
  dailyActivities: DayActivities[];
}

const ACTIVITY_LABELS: { [key: string]: string } = {
  development: 'Développement',
  testing: 'Test',
  documentation: 'Documentation',
  meeting: 'Réunion',
  support: 'Support',
  training: 'Formation',
  other: 'Autre'
};

export const ActivityList = ({ dailyActivities }: ActivityListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dailyActivities.map(({ date, day, activities: dayActivities, total }) => (
        <Card key={day} className={dayActivities.length === 0 ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="capitalize flex justify-between items-center">
              <span>
                {format(date, 'EEEE dd', { locale: fr })}
              </span>
              {total > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {Math.round((total / 60) * 100) / 100}h
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dayActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucune activité
              </p>
            ) : (
              <div className="space-y-2">
                {dayActivities.map((activity: Activity) => (
                  <div key={activity.id} className="flex justify-between items-start border-b py-2">
                    <div>
                      <p className="font-medium">{activity.projects?.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {ACTIVITY_LABELS[activity.activity_type] || activity.activity_type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(activity.start_time), 'HH:mm')}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {activity.duration_minutes}min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

