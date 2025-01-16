import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserRole } from "@/types/user";

export const getProjectManagers = async (
  userId: string | undefined,
  userRoles: UserRole[] | undefined
): Promise<UserProfile[]> => {
  if (!userId || !userRoles) return [];

  console.log("Getting project managers for user:", userId);
  console.log("User roles:", userRoles);

  // Pour un admin : tous les chefs de projet
  if (userRoles.includes("admin")) {
    console.log("User is admin, fetching all project managers");
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        first_name,
        last_name,
        created_at
      `)
      .in('id', (
        await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'chef_projet')
      ).data?.map(ur => ur.user_id) || []);

    if (error) {
      console.error("Error fetching project managers:", error);
      return [];
    }

    console.log("Found project managers for admin:", data?.length);
    return data as UserProfile[];
  }

  // Pour un manager : chefs de projet dans sa hiérarchie
  if (userRoles.includes("manager")) {
    console.log("User is manager, fetching assigned project managers");
    
    const { data: managerEntities, error: managerError } = await supabase
      .from("manager_assignments")
      .select("entity_type, entity_id")
      .eq("user_id", userId);

    if (managerError || !managerEntities?.length) {
      console.error("Error fetching manager entities:", managerError);
      console.log("Manager entities:", managerEntities);
      return [];
    }

    console.log("Manager assignments:", managerEntities);

    // Construire la requête pour les entités accessibles
    const accessibleEntitiesQuery = managerEntities.map(entity => {
      if (entity.entity_type === "pole") {
        return `
          SELECT entity_id FROM user_hierarchy_assignments
          WHERE entity_id = '${entity.entity_id}'
          OR entity_id IN (
            SELECT id FROM directions WHERE pole_id = '${entity.entity_id}'
          )
          OR entity_id IN (
            SELECT s.id FROM services s
            JOIN directions d ON d.id = s.direction_id
            WHERE d.pole_id = '${entity.entity_id}'
          )
        `;
      }
      if (entity.entity_type === "direction") {
        return `
          SELECT entity_id FROM user_hierarchy_assignments
          WHERE entity_id = '${entity.entity_id}'
          OR entity_id IN (
            SELECT id FROM services WHERE direction_id = '${entity.entity_id}'
          )
        `;
      }
      return `
        SELECT entity_id FROM user_hierarchy_assignments
        WHERE entity_id = '${entity.entity_id}'
      `;
    });

    console.log("Accessible entities query:", accessibleEntitiesQuery);

    // Récupérer d'abord les IDs des chefs de projet
    const { data: chefProjetIds, error: chefProjetError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'chef_projet');

    if (chefProjetError) {
      console.error("Error fetching chef projet IDs:", chefProjetError);
      return [];
    }

    console.log("Chef projet IDs:", chefProjetIds);

    // Récupérer les affectations hiérarchiques
    const { data: hierarchyAssignments, error: hierarchyError } = await supabase
      .from('user_hierarchy_assignments')
      .select('user_id')
      .or(accessibleEntitiesQuery.join(' UNION '));

    if (hierarchyError) {
      console.error("Error fetching hierarchy assignments:", hierarchyError);
      return [];
    }

    console.log("Hierarchy assignments:", hierarchyAssignments);

    // Récupérer les profils des chefs de projet dans la hiérarchie
    const { data: projectManagers, error: pmError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        first_name,
        last_name,
        created_at
      `)
      .in('id', chefProjetIds?.map(cp => cp.user_id) || [])
      .in('id', hierarchyAssignments?.map(ha => ha.user_id) || []);

    if (pmError) {
      console.error("Error fetching project managers for manager:", pmError);
      return [];
    }

    console.log("Final project managers list:", projectManagers);
    return projectManagers as UserProfile[];
  }

  // Pour un chef de projet : uniquement son profil
  console.log("User is chef de projet, returning only their profile");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    return [];
  }

  return profile ? [profile as UserProfile] : [];
};