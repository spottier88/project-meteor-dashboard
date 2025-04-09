
import { supabase } from "@/integrations/supabase/client";
import { AccessibleOrganizations } from "@/types/user";

/**
 * Récupère les entités organisationnelles accessibles pour un utilisateur
 * 
 * @param userId ID de l'utilisateur
 * @param isAdmin Indique si l'utilisateur est administrateur
 * @param isManager Indique si l'utilisateur est manager
 * @returns Les entités organisationnelles accessibles
 */
export async function getUserAccessibleOrganizations(
  userId: string | undefined, 
  isAdmin: boolean, 
  isManager: boolean
): Promise<AccessibleOrganizations> {
  // Si l'utilisateur est administrateur, retourner toutes les entités
  if (isAdmin) {
    const [polesResult, directionsResult, servicesResult] = await Promise.all([
      supabase.from("poles").select("id, name").order("name"),
      supabase.from("directions").select("id, name").order("name"),
      supabase.from("services").select("id, name").order("name")
    ]);

    return {
      poles: polesResult.data || [],
      directions: directionsResult.data || [],
      services: servicesResult.data || []
    };
  }

  // Pour les managers, récupérer les entités associées à leurs attributions
  if (isManager && userId) {
    // Récupérer toutes les attributions du manager
    const { data: managerAssignments } = await supabase
      .from("manager_assignments")
      .select(`
        entity_id,
        entity_type
      `)
      .eq("user_id", userId);

    // Récupérer les chemins hiérarchiques accessibles au manager
    const { data: pathAssignments } = await supabase
      .from("manager_path_assignments")
      .select(`
        path_id,
        hierarchy_paths (
          id,
          pole_id,
          direction_id,
          service_id,
          path_string
        )
      `)
      .eq("user_id", userId);

    // Extraire les IDs des pôles, directions et services accessibles via les chemins
    const accessiblePoleIds = new Set<string>();
    const accessibleDirectionIds = new Set<string>();
    const accessibleServiceIds = new Set<string>();

    // Ajouter les entités directement assignées
    if (managerAssignments) {
      managerAssignments.forEach(assignment => {
        if (assignment.entity_type === 'pole') {
          accessiblePoleIds.add(assignment.entity_id);
        } else if (assignment.entity_type === 'direction') {
          accessibleDirectionIds.add(assignment.entity_id);
        } else if (assignment.entity_type === 'service') {
          accessibleServiceIds.add(assignment.entity_id);
        }
      });
    }

    // Ajouter les entités accessibles via les chemins hiérarchiques
    if (pathAssignments) {
      pathAssignments.forEach(assignment => {
        if (assignment.hierarchy_paths) {
          if (assignment.hierarchy_paths.pole_id) {
            accessiblePoleIds.add(assignment.hierarchy_paths.pole_id);
          }
          if (assignment.hierarchy_paths.direction_id) {
            accessibleDirectionIds.add(assignment.hierarchy_paths.direction_id);
          }
          if (assignment.hierarchy_paths.service_id) {
            accessibleServiceIds.add(assignment.hierarchy_paths.service_id);
          }
        }
      });
    }

    // Récupérer les détails des entités accessibles
    const [polesResult, directionsResult, servicesResult] = await Promise.all([
      accessiblePoleIds.size > 0 ? 
        supabase.from("poles").select("id, name").in("id", Array.from(accessiblePoleIds)).order("name") : 
        { data: [] },
      accessibleDirectionIds.size > 0 ? 
        supabase.from("directions").select("id, name").in("id", Array.from(accessibleDirectionIds)).order("name") : 
        { data: [] },
      accessibleServiceIds.size > 0 ? 
        supabase.from("services").select("id, name").in("id", Array.from(accessibleServiceIds)).order("name") : 
        { data: [] }
    ]);

    return {
      poles: polesResult.data || [],
      directions: directionsResult.data || [],
      services: servicesResult.data || []
    };
  }

  // Pour les autres utilisateurs, retourner des listes vides
  return { poles: [], directions: [], services: [] };
}
