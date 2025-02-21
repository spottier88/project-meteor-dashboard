
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useUser } from "@supabase/auth-helpers-react";

type ActivityType = Database["public"]["Enums"]["activity_type"];

interface TeamActivityFiltersProps {
  period: string;
  setPeriod: (period: string) => void;
  projectId: string;
  setProjectId: (projectId: string) => void;
  activityType: 'all' | ActivityType;
  setActivityType: (type: 'all' | ActivityType) => void;
}

const activityTypeLabels: Record<ActivityType, string> = {
  meeting: "Réunion",
  development: "Développement",
  testing: "Test",
  documentation: "Documentation",
  support: "Support",
  other: "Autre"
};

export const TeamActivityFilters = ({ 
  period, 
  setPeriod, 
  projectId, 
  setProjectId, 
  activityType, 
  setActivityType 
}: TeamActivityFiltersProps) => {
  const { isAdmin, isManager } = usePermissionsContext();
  const user = useUser();

  const { data: projects } = useQuery({
    queryKey: ['team-activity-projects-for-filter'],
    queryFn: async () => {
      console.log("[TeamActivityFilters] Fetching projects with role context:", { isAdmin, isManager });
      
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          project_manager,
          profiles!projects_project_manager_fkey (
            email
          )
        `)
        .order('title');

      if (error) {
        console.error("[TeamActivityFilters] Error fetching projects:", error);
        throw error;
      }

      // Filtrer les projets - uniquement pour admin, manager ou chef de projet
      const filteredProjects = projectsData?.filter(project => {
        if (isAdmin) return true;
        if (isManager) return true;
        return project.project_manager === user?.email;
      });

      console.log("[TeamActivityFilters] Filtered projects:", filteredProjects);
      return filteredProjects || [];
    },
    enabled: !!user?.id,
  });

  const activityTypes: ActivityType[] = [
    "meeting",
    "development",
    "testing",
    "documentation",
    "support",
    "other"
  ];

  const currentMonth = format(new Date(), 'MMMM', { locale: fr });

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
            <SelectItem value="month">{currentMonth}</SelectItem>
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
                {activityTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
