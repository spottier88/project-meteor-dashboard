
/**
 * @hook useFavoriteProjects
 * @description Hook pour gérer les projets favoris de l'utilisateur connecté.
 * Permet d'ajouter, retirer et consulter les projets favoris.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

// Type pour un projet favori avec les données du projet
export interface FavoriteProject {
  id: string;
  project_id: string;
  created_at: string;
  project: {
    id: string;
    title: string;
    status: string | null;
    lifecycle_status: string;
    last_review_date: string | null;
  };
}

export const useFavoriteProjects = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  // Récupérer les projets favoris de l'utilisateur
  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ["favoriteProjects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("project_favorites")
        .select(`
          id,
          project_id,
          created_at,
          project:projects(
            id,
            title,
            status,
            lifecycle_status,
            last_review_date
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur lors du chargement des favoris:", error);
        throw error;
      }

      // Filtrer les projets supprimés (project null)
      return (data || []).filter((f) => f.project !== null) as FavoriteProject[];
    },
    enabled: !!user?.id,
  });

  // Mutation pour ajouter un favori
  const addFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from("project_favorites")
        .insert({ user_id: user.id, project_id: projectId });

      if (error) {
        // Gérer le cas où le favori existe déjà
        if (error.code === "23505") {
          throw new Error("Ce projet est déjà dans vos favoris");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteProjects"] });
      toast.success("Projet ajouté aux favoris");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'ajout aux favoris");
    },
  });

  // Mutation pour retirer un favori
  const removeFavorite = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from("project_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("project_id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteProjects"] });
      toast.success("Projet retiré des favoris");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du favori");
    },
  });

  // Toggle favori (ajouter ou retirer)
  const toggleFavorite = async (projectId: string) => {
    if (isFavorite(projectId)) {
      await removeFavorite.mutateAsync(projectId);
    } else {
      await addFavorite.mutateAsync(projectId);
    }
  };

  // Vérifier si un projet est en favori
  const isFavorite = (projectId: string): boolean => {
    return favorites?.some((f) => f.project_id === projectId) ?? false;
  };

  return {
    favorites: favorites || [],
    isLoading,
    error,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
    toggleFavorite,
    isFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
  };
};
