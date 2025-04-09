
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

    // Récupérer tous les pôles accessibles et leurs détails
    const { data: accessiblePoles } = await supabase
      .from("poles")
      .select("id, name")
      .in("id", Array.from(accessiblePoleIds))
      .order("name");
    
    // Pour chaque pôle accessible, récupérer toutes ses directions
    let allAccessibleDirectionIds = new Set<string>(accessibleDirectionIds);
    
    if (accessiblePoles && accessiblePoles.length > 0) {
      const { data: poleDirections } = await supabase
        .from("directions")
        .select("id, name")
        .in("pole_id", accessiblePoles.map(p => p.id))
        .order("name");
        
      if (poleDirections) {
        poleDirections.forEach(direction => {
          allAccessibleDirectionIds.add(direction.id);
        });
      }
    }
    
    // Convertir le Set en Array pour la requête
    const allAccessibleDirectionIdsArray = Array.from(allAccessibleDirectionIds);
    
    // Récupérer toutes les directions accessibles
    const { data: accessibleDirections } = await supabase
      .from("directions")
      .select("id, name")
      .in("id", allAccessibleDirectionIdsArray)
      .order("name");
      
    // Pour chaque direction accessible, récupérer tous ses services
    let allAccessibleServiceIds = new Set<string>(accessibleServiceIds);
    
    if (accessibleDirections && accessibleDirections.length > 0) {
      const { data: directionServices } = await supabase
        .from("services")
        .select("id, name")
        .in("direction_id", accessibleDirections.map(d => d.id))
        .order("name");
        
      if (directionServices) {
        directionServices.forEach(service => {
          allAccessibleServiceIds.add(service.id);
        });
      }
    }
    
    // Récupérer tous les services accessibles
    const { data: accessibleServices } = await supabase
      .from("services")
      .select("id, name")
      .in("id", Array.from(allAccessibleServiceIds))
      .order("name");

    return {
      poles: accessiblePoles || [],
      directions: accessibleDirections || [],
      services: accessibleServices || []
    };
  }

  // Pour les chefs de projet, récupérer les entités associées à leur affectation hiérarchique
  if (userId) {
    // Récupérer l'affectation hiérarchique de l'utilisateur
    const { data: userHierarchyAssignments } = await supabase
      .from("user_hierarchy_assignments")
      .select(`
        entity_id,
        entity_type
      `)
      .eq("user_id", userId);
    
    const poleIds = new Set<string>();
    const directionIds = new Set<string>();
    const serviceIds = new Set<string>();
    
    // Traiter les affectations hiérarchiques de l'utilisateur
    if (userHierarchyAssignments && userHierarchyAssignments.length > 0) {
      for (const assignment of userHierarchyAssignments) {
        if (assignment.entity_type === 'pole') {
          poleIds.add(assignment.entity_id);
          
          // Récupérer toutes les directions de ce pôle
          const { data: poleDirections } = await supabase
            .from("directions")
            .select("id")
            .eq("pole_id", assignment.entity_id);
          
          if (poleDirections) {
            poleDirections.forEach(direction => {
              directionIds.add(direction.id);
              
              // Récupérer tous les services de cette direction
              supabase
                .from("services")
                .select("id")
                .eq("direction_id", direction.id)
                .then(({ data: directionServices }) => {
                  if (directionServices) {
                    directionServices.forEach(service => {
                      serviceIds.add(service.id);
                    });
                  }
                });
            });
          }
        } else if (assignment.entity_type === 'direction') {
          directionIds.add(assignment.entity_id);
          
          // Récupérer le pôle parent de cette direction
          const { data: direction } = await supabase
            .from("directions")
            .select("pole_id")
            .eq("id", assignment.entity_id)
            .single();
          
          if (direction && direction.pole_id) {
            poleIds.add(direction.pole_id);
          }
          
          // Récupérer tous les services de cette direction
          const { data: directionServices } = await supabase
            .from("services")
            .select("id")
            .eq("direction_id", assignment.entity_id);
          
          if (directionServices) {
            directionServices.forEach(service => {
              serviceIds.add(service.id);
            });
          }
        } else if (assignment.entity_type === 'service') {
          serviceIds.add(assignment.entity_id);
          
          // Récupérer la direction et le pôle parents de ce service
          const { data: service } = await supabase
            .from("services")
            .select(`
              direction_id,
              directions:direction_id (
                id,
                pole_id
              )
            `)
            .eq("id", assignment.entity_id)
            .single();
          
          if (service) {
            directionIds.add(service.direction_id);
            if (service.directions && service.directions.pole_id) {
              poleIds.add(service.directions.pole_id);
            }
          }
        }
      }
    }
    
    // Récupérer également les entités associées aux projets gérés par l'utilisateur
    const { data: userProjects } = await supabase
      .from("projects")
      .select("pole_id, direction_id, service_id")
      .eq("project_manager_id", userId);
    
    if (userProjects && userProjects.length > 0) {
      userProjects.forEach(project => {
        if (project.pole_id) {
          poleIds.add(project.pole_id);
        }
        if (project.direction_id) {
          directionIds.add(project.direction_id);
        }
        if (project.service_id) {
          serviceIds.add(project.service_id);
        }
      });
    }

    // Récupérer les détails des entités
    const [polesResult, directionsResult, servicesResult] = await Promise.all([
      poleIds.size > 0 ? 
        supabase.from("poles").select("id, name").in("id", Array.from(poleIds)).order("name") : 
        { data: [] },
      directionIds.size > 0 ? 
        supabase.from("directions").select("id, name").in("id", Array.from(directionIds)).order("name") : 
        { data: [] },
      serviceIds.size > 0 ? 
        supabase.from("services").select("id, name").in("id", Array.from(serviceIds)).order("name") : 
        { data: [] }
    ]);

    // Vérifier que les données existent avant de filtrer
    const poles = polesResult.data || [];
    const directions = directionsResult.data || [];
    const services = servicesResult.data || [];
    
    return { poles, directions, services };
  }

  // Pour les autres utilisateurs, retourner des listes vides
  return { poles: [], directions: [], services: [] };
}
