
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useUser } from '@supabase/auth-helpers-react';

type ActivityType = Database["public"]["Enums"]["activity_type"];

interface TeamActivityFiltersProps {
  period: string;
  setPeriod: (period: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  activityType: 'all' | ActivityType;
  setActivityType: (type: 'all' | ActivityType) => void;
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

  // Récupérer la liste des utilisateurs
  const { data: users } = useQuery({
    queryKey: ["team-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) {
        console.error("[TeamActivityFilters] Error fetching users:", error);
        throw error;
      }
      return data;
    },
  });

  // Récupérer les projets accessibles en utilisant la nouvelle fonction
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["team-view-projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log("[TeamActivityFilters] Fetching team view projects for user:", user.id);
      
      const { data, error } = await supabase
        .rpc('get_team_view_projects', {
          p_user_id: user.id
        });

      if (error) {
        console.error("[TeamActivityFilters] Error fetching team view projects:", error);
        throw error;
      }

      console.log("[TeamActivityFilters] Fetched projects:", data);
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

      <Select value={activityType} onValueChange={(value) => setActivityType(value as 'all' | ActivityType)}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Type d'activité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="developpement">Développement</SelectItem>
          <SelectItem value="reunion">Réunion</SelectItem>
          <SelectItem value="analyse">Analyse</SelectItem>
          <SelectItem value="documentation">Documentation</SelectItem>
          <SelectItem value="support">Support</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
