import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserRole } from "@/types/user";

export const getProjectManagers = async (
  userId: string | undefined,
  userRoles: UserRole[] | undefined
): Promise<UserProfile[]> => {
  if (!userId || !userRoles) return [];

  // Pour un admin : tous les chefs de projet
  if (userRoles.includes("admin")) {
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

    return data as UserProfile[];
  }

  // Pour un manager : chefs de projet dans sa hiérarchie
  if (userRoles.includes("manager")) {
    const { data: managerEntities, error: managerError } = await supabase
      .from("manager_assignments")
      .select("entity_type, entity_id")
      .eq("user_id", userId);

    if (managerError || !managerEntities?.length) {
      console.error("Error fetching manager entities:", managerError);
      return [];
    }

    // Construire la CTE pour les entités accessibles
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

    const { data: projectManagers, error: pmError } = await supabase
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
      ).data?.map(ur => ur.user_id) || [])
      .in('id', (
        await supabase
          .from('user_hierarchy_assignments')
          .select('user_id')
          .or(accessibleEntitiesQuery.join(' UNION '))
      ).data?.map(uha => uha.user_id) || []);

    if (pmError) {
      console.error("Error fetching project managers for manager:", pmError);
      return [];
    }

    return projectManagers as UserProfile[];
  }

  // Pour un chef de projet : uniquement son profil
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