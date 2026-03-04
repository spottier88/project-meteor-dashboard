/**
 * Hook pour gérer les tags de projets.
 * - Chargement des tags d'un projet
 * - Autocomplétion basée sur les tags existants
 * - Synchronisation des tags lors de la sauvegarde
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Récupère les tags d'un projet spécifique */
export const useProjectTags = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["project-tags", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_tags")
        .select("tag")
        .eq("project_id", projectId)
        .order("tag");

      if (error) {
        console.error("Erreur chargement tags projet:", error);
        return [];
      }
      return data.map((d) => d.tag);
    },
    enabled: !!projectId,
  });
};

/** Récupère tous les tags distincts pour l'autocomplétion */
export const useAllTags = () => {
  return useQuery({
    queryKey: ["all-project-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tags")
        .select("tag")
        .order("tag");

      if (error) {
        console.error("Erreur chargement tags:", error);
        return [];
      }
      // Dédupliquer côté client
      return [...new Set(data.map((d) => d.tag))];
    },
  });
};

/**
 * Synchronise les tags d'un projet : supprime les anciens, insère les nouveaux.
 * Retourne un objet { warning? } pour cohérence avec les autres helpers de sauvegarde.
 */
export const syncProjectTags = async (
  projectId: string,
  newTags: string[]
): Promise<{ warning?: string }> => {
  try {
    // Supprimer tous les tags existants
    const { error: deleteError } = await supabase
      .from("project_tags")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      console.error("Erreur suppression tags:", deleteError);
      return { warning: "Impossible de mettre à jour les tags." };
    }

    // Insérer les nouveaux tags
    if (newTags.length > 0) {
      const rows = newTags.map((tag) => ({ project_id: projectId, tag: tag.trim() }));
      const { error: insertError } = await supabase
        .from("project_tags")
        .insert(rows);

      if (insertError) {
        console.error("Erreur insertion tags:", insertError);
        return { warning: "Impossible de sauvegarder certains tags." };
      }
    }

    return {};
  } catch (error) {
    console.error("Erreur sync tags:", error);
    return { warning: "Erreur lors de la synchronisation des tags." };
  }
};

/**
 * Génère une couleur HSL déterministe à partir d'un tag.
 * Utilisé pour l'affichage des badges colorés.
 */
export const getTagColor = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 45%)`;
};

export const getTagBgColor = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 92%)`;
};
