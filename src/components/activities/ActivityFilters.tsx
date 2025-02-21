
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ActivityType = Database["public"]["Enums"]["activity_type"];

interface ActivityFiltersProps {
  period: string;
  setPeriod: (period: string) => void;
  projectId: string;
  setProjectId: (projectId: string) => void;
  activityType: 'all' | ActivityType;
  setActivityType: (type: 'all' | ActivityType) => void;
}

export const ActivityFilters = ({ 
  period, 
  setPeriod, 
  projectId, 
  setProjectId, 
  activityType, 
  setActivityType 
}: ActivityFiltersProps) => {
  const { data: projects } = useQuery({
    queryKey: ['projects-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      return data;
    },
  });

  const activityTypes: ActivityType[] = [
    "meeting",
    "development",
    "testing",
    "documentation",
    "support",
    "other"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="space-y-2">
        <Label htmlFor="period">Période</Label>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger id="period">
            <SelectValue placeholder="Sélectionner une période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Jour</SelectItem>
            <SelectItem value="week">Semaine</SelectItem>
            <SelectItem value="month">Mois</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="project">Projet</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger id="project">
            <SelectValue placeholder="Tous les projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type d'activité</Label>
        <Select value={activityType} onValueChange={setActivityType as (value: string) => void}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {activityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
