
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useActivityTypes } from '@/hooks/useActivityTypes';
import { useAuthContext } from "@/contexts/AuthContext";

interface ActivityFiltersProps {
  period: string;
  setPeriod: (period: string) => void;
  projectId: string;
  setProjectId: (projectId: string) => void;
  activityType: string;
  setActivityType: (type: string) => void;
  selectedUserId?: string;
  setSelectedUserId?: (id: string) => void;
}

export const ActivityFilters = ({ 
  period, 
  setPeriod, 
  projectId, 
  setProjectId, 
  activityType, 
  setActivityType,
  selectedUserId,
  setSelectedUserId
}: ActivityFiltersProps) => {
  const { isAdmin, isManager } = usePermissionsContext();
  const { user } = useAuthContext();
  const { data: activityTypes } = useActivityTypes();

  const { data: projects } = useQuery({
    queryKey: ['my-activity-projects-for-filter'],
    queryFn: async () => {
      // console.log("[ActivityFilters] Fetching my accessible projects with role context:", { isAdmin, isManager });
      
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          project_manager,
          project_manager_id,
          project_members!project_members_project_id_fkey (
            user_id
          ),
          profiles!projects_project_manager_id_fkey (
            id,
            email
          )
        `)
        .order('title');

      if (error) {
        console.error("[ActivityFilters] Error fetching projects:", error);
        throw error;
      }

      const filteredProjects = projectsData?.filter(project => {
        if (isAdmin) return true;
        if (isManager) return true;
        if (project.project_manager_id === user?.id) return true;
        return project.project_members?.some(member => member.user_id === user?.id);
      });

      // console.log("[ActivityFilters] Filtered projects:", filteredProjects);
      return filteredProjects || [];
    },
    enabled: !!user?.id,
  });

  const activityTypeLabels: Record<string, string> = {};

  if (activityTypes) {
    activityTypes.forEach(type => {
      activityTypeLabels[type.code] = type.label;
    });
  }

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
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {activityTypes?.map((type) => (
              <SelectItem key={type.id} value={type.code}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
