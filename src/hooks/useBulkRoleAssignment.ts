/**
 * Hook pour l'exécution en masse d'ajout/suppression de rôles utilisateurs.
 * Gère les opérations batch sur la table user_roles et l'invalidation des caches.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@/types/user";

export interface BulkRoleResult {
  success: number;
  errors: string[];
  total: number;
}

export const useBulkRoleAssignment = () => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Applique l'ajout ou la suppression d'un rôle pour une liste d'utilisateurs.
   * Traite chaque utilisateur individuellement pour capturer les erreurs sans bloquer le reste.
   */
  const applyBulkRole = async (
    action: "add" | "remove",
    role: UserRole,
    userIds: string[]
  ): Promise<BulkRoleResult> => {
    setIsProcessing(true);
    setProgress(0);

    const result: BulkRoleResult = { success: 0, errors: [], total: userIds.length };

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      try {
        if (action === "add") {
          // Insertion avec gestion du doublon (contrainte unique user_id + role)
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role });
          if (error) {
            // Si doublon, on considère comme un succès silencieux
            if (error.code === "23505") {
              result.success++;
            } else {
              result.errors.push(`${userId}: ${error.message}`);
            }
          } else {
            result.success++;
          }
        } else {
          // Suppression du rôle pour l'utilisateur
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", role);
          if (error) {
            result.errors.push(`${userId}: ${error.message}`);
          } else {
            result.success++;
          }
        }
      } catch (err: unknown) {
        result.errors.push(`${userId}: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
      }
      setProgress(Math.round(((i + 1) / userIds.length) * 100));
    }

    // Invalidation des caches pour rafraîchir la liste des utilisateurs
    await queryClient.invalidateQueries({ queryKey: ["users"] });
    await queryClient.invalidateQueries({ queryKey: ["lastActivities"] });
    await queryClient.invalidateQueries({ queryKey: ["managerAssignments"] });

    setIsProcessing(false);
    return result;
  };

  return { applyBulkRole, isProcessing, progress };
};
