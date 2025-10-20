/**
 * @file useAggregatedProjectData.ts
 * @description Hook pour agréger les données des projets liés (tâches, risques, membres, activités)
 * Utilisé dans les projets maîtres pour afficher toutes les données consolidées
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProjectLinks } from "./useProjectLinks";

export const useAggregatedProjectData = (masterProjectId: string) => {
  const { linkedProjects } = useProjectLinks(masterProjectId);

  // Liste de tous les IDs de projets (maître + liés)
  const allProjectIds = [
    masterProjectId,
    ...(linkedProjects?.map((p: any) => p.id) || []),
  ];

  // Récupérer les tâches agrégées
  const { data: aggregatedTasks } = useQuery({
    queryKey: ["aggregatedTasks", allProjectIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, project:projects(title)")
        .in("project_id", allProjectIds);

      if (error) throw error;
      return data;
    },
    enabled: allProjectIds.length > 0,
  });

  // Récupérer les risques agrégés
  const { data: aggregatedRisks } = useQuery({
    queryKey: ["aggregatedRisks", allProjectIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*, project:projects(title)")
        .in("project_id", allProjectIds);

      if (error) throw error;
      return data;
    },
    enabled: allProjectIds.length > 0,
  });

  // Récupérer les membres agrégés
  const { data: aggregatedMembers } = useQuery({
    queryKey: ["aggregatedMembers", allProjectIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select("*, profile:profiles(*), project:projects(title)")
        .in("project_id", allProjectIds);

      if (error) throw error;
      return data;
    },
    enabled: allProjectIds.length > 0,
  });

  // Récupérer les activités agrégées
  const { data: aggregatedActivities } = useQuery({
    queryKey: ["aggregatedActivities", allProjectIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_points")
        .select("*, profile:profiles(*), project:projects(title)")
        .in("project_id", allProjectIds);

      if (error) throw error;
      return data;
    },
    enabled: allProjectIds.length > 0,
  });

  return {
    aggregatedTasks,
    aggregatedRisks,
    aggregatedMembers,
    aggregatedActivities,
    linkedProjectsCount: linkedProjects?.length || 0,
  };
};
