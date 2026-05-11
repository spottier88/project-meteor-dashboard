/**
 * @hook useSuggestedManagerPaths
 * @description Calcule les chemins hiérarchiques suggérés pour un utilisateur
 * en fonction de son rôle (manager) et de son affectation hiérarchique propre
 * (user_hierarchy_assignments). Retourne aussi les chemins déjà affectés pour
 * permettre la dé-duplication côté UI.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HierarchyPath, EntityType } from "@/types/user";

export interface UserDirectAssignment {
  entity_id: string;
  entity_type: EntityType;
  entity_name: string;
  path_string: string;
}

export interface PathSuggestion {
  path: HierarchyPath;
  isAlreadyAssigned: boolean;
  /** true si le chemin correspond exactement à l'affectation directe de l'utilisateur */
  isDirect: boolean;
  /** affectation utilisateur source de la suggestion */
  sourceAssignmentType: EntityType;
}

export interface SuggestedManagerPathsResult {
  isManager: boolean;
  directAssignments: UserDirectAssignment[];
  suggestions: PathSuggestion[];
  assignedPathIds: string[];
  /** id du chemin correspondant à l'affectation directe la plus précise (pour pré-sélection) */
  defaultPathId: string | null;
}

export const useSuggestedManagerPaths = (userId: string | undefined) => {
  return useQuery<SuggestedManagerPathsResult>({
    queryKey: ["suggestedManagerPaths", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) {
        return {
          isManager: false,
          directAssignments: [],
          suggestions: [],
          assignedPathIds: [],
          defaultPathId: null,
        };
      }

      // 1. Rôles de l'utilisateur
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const isManager = !!roles?.some((r) => r.role === "manager");

      // 2. Affectations hiérarchiques propres de l'utilisateur
      const { data: userAssignments } = await supabase
        .from("user_hierarchy_assignments")
        .select("entity_id, entity_type")
        .eq("user_id", userId);

      // 3. Tous les chemins hiérarchiques
      const { data: allPaths } = await supabase
        .from("hierarchy_paths")
        .select("*")
        .order("path_string");

      // 4. Chemins déjà affectés en tant que manager
      const { data: existingMgrPaths } = await supabase
        .from("manager_path_assignments")
        .select("path_id")
        .eq("user_id", userId);

      const assignedPathIds = (existingMgrPaths ?? []).map((p) => p.path_id);
      const paths = (allPaths ?? []) as HierarchyPath[];

      // Enrichissement des affectations directes avec le nom lisible
      const directAssignments: UserDirectAssignment[] = [];
      for (const ua of userAssignments ?? []) {
        const type = ua.entity_type as EntityType;
        let name = "";
        let pathString = "";

        if (type === "service") {
          const match = paths.find((p) => p.service_id === ua.entity_id);
          if (match) {
            pathString = match.path_string;
            name = match.path_string;
          }
        } else if (type === "direction") {
          const match = paths.find(
            (p) => p.direction_id === ua.entity_id && !p.service_id,
          );
          if (match) {
            pathString = match.path_string;
            name = match.path_string;
          }
        } else if (type === "pole") {
          const match = paths.find(
            (p) => p.pole_id === ua.entity_id && !p.direction_id && !p.service_id,
          );
          if (match) {
            pathString = match.path_string;
            name = match.path_string;
          }
        }

        directAssignments.push({
          entity_id: ua.entity_id,
          entity_type: type,
          entity_name: name,
          path_string: pathString,
        });
      }

      // Construction des suggestions (dé-dupliquées par path.id)
      const suggestionMap = new Map<string, PathSuggestion>();

      for (const ua of userAssignments ?? []) {
        const type = ua.entity_type as EntityType;
        const matched: { path: HierarchyPath; isDirect: boolean }[] = [];

        if (type === "service") {
          paths
            .filter((p) => p.service_id === ua.entity_id)
            .forEach((p) => matched.push({ path: p, isDirect: true }));
        } else if (type === "direction") {
          paths
            .filter((p) => p.direction_id === ua.entity_id)
            .forEach((p) =>
              matched.push({ path: p, isDirect: !p.service_id }),
            );
        } else if (type === "pole") {
          paths
            .filter((p) => p.pole_id === ua.entity_id)
            .forEach((p) =>
              matched.push({
                path: p,
                isDirect: !p.direction_id && !p.service_id,
              }),
            );
        }

        for (const m of matched) {
          if (!suggestionMap.has(m.path.id)) {
            suggestionMap.set(m.path.id, {
              path: m.path,
              isAlreadyAssigned: assignedPathIds.includes(m.path.id),
              isDirect: m.isDirect,
              sourceAssignmentType: type,
            });
          }
        }
      }

      const suggestions = Array.from(suggestionMap.values()).sort((a, b) =>
        a.path.path_string.localeCompare(b.path.path_string),
      );

      const defaultPathId =
        suggestions.find((s) => s.isDirect && !s.isAlreadyAssigned)?.path.id ??
        null;

      return {
        isManager,
        directAssignments,
        suggestions,
        assignedPathIds,
        defaultPathId,
      };
    },
  });
};
