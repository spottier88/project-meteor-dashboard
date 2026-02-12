
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from '@supabase/auth-helpers-react';
import { useActivityTypes } from '@/hooks/useActivityTypes';

interface TeamActivityFiltersProps {
  period: string;
  setPeriod: (period: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  activityType: string;
  setActivityType: (type: string) => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
}

export const TeamActivityFilters = ({
  period,
  setPeriod,
  projectId,
  setProjectId,
  activityType,
  setActivityType,
  selectedUserId,
  setSelectedUserId,
}: TeamActivityFiltersProps) => {
  const user = useUser();
  const { data: activityTypes } = useActivityTypes();

  // Récupérer la liste des utilisateurs en utilisant la nouvelle fonction
  const { data: users } = useQuery({
    queryKey: ["team-view-users", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_team_view_users', {
          p_user_id: user.id
        });

      if (error) {
        console.error("[TeamActivityFilters] Error fetching team view users:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Récupérer les projets accessibles
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["team-view-projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_team_view_projects', {
          p_user_id: user.id
        });

      if (error) {
        console.error("[TeamActivityFilters] Error fetching team view projects:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Sélectionner un utilisateur" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les utilisateurs</SelectItem>
          {users?.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.first_name} {user.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Sélectionner une période" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Jour</SelectItem>
          <SelectItem value="week">Semaine</SelectItem>
          <SelectItem value="month">Mois</SelectItem>
        </SelectContent>
      </Select>

      <Select value={projectId} onValueChange={setProjectId}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Sélectionner un projet" />
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

      <Select value={activityType} onValueChange={setActivityType}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Type d'activité" />
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
  );
};
