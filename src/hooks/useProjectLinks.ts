/**
 * @file useProjectLinks.ts
 * @description Hook pour gérer les liens entre projets (création, suppression, récupération)
 * Permet de lier des projets en double avec un système de projet maître et projets liés
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useProjectLinks = (projectId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer les projets liés à un projet maître
  const { data: linkedProjects, isLoading: isLoadingLinked } = useQuery({
    queryKey: ["linkedProjects", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_linked_projects", { p_master_project_id: projectId });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Vérifier si le projet est un projet lié
  const { data: masterProjectId, isLoading: isLoadingMaster } = useQuery({
    queryKey: ["masterProject", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_master_project", { p_linked_project_id: projectId });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Créer un lien entre projets
  const linkProjects = useMutation({
    mutationFn: async ({ masterProjectId, linkedProjectId }: { 
      masterProjectId: string; 
      linkedProjectId: string; 
    }) => {
      const { data, error } = await supabase
        .from("project_links")
        .insert({
          master_project_id: masterProjectId,
          linked_project_id: linkedProjectId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedProjects"] });
      queryClient.invalidateQueries({ queryKey: ["masterProject"] });
      toast({
        title: "Projets liés",
        description: "Les projets ont été liés avec succès",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de lier les projets",
      });
    },
  });

  // Supprimer un lien entre projets
  const unlinkProject = useMutation({
    mutationFn: async (linkedProjectId: string) => {
      const { error } = await supabase
        .from("project_links")
        .delete()
        .eq("linked_project_id", linkedProjectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedProjects"] });
      queryClient.invalidateQueries({ queryKey: ["masterProject"] });
      toast({
        title: "Lien supprimé",
        description: "Le lien entre les projets a été supprimé",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le lien",
      });
    },
  });

  return {
    linkedProjects,
    masterProjectId,
    isLoadingLinked,
    isLoadingMaster,
    linkProjects,
    unlinkProject,
    isLinkedProject: !!masterProjectId,
  };
};
