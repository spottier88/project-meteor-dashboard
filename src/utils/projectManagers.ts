import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserRole } from "@/types/user";

export const getProjectManagers = async (
  userId: string | undefined,
  userRoles: UserRole[] | undefined
): Promise<UserProfile[]> => {
  if (!userId || !userRoles) return [];

  // console.log("Getting project managers for user:", userId);
  // console.log("User roles:", userRoles);

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

    // console.log("Found project managers for admin:", data?.length);
    return data as UserProfile[];
  }

  // Pour un manager : chefs de projet dans sa hiérarchie
  if (userRoles.includes("manager")) {
    // console.log("User is manager, fetching assigned project managers");
    
    // 1. Récupérer les entités gérées par le manager
    const { data: managerEntities, error: managerError } = await supabase
      .from("manager_assignments")
      .select("entity_type, entity_id")
      .eq("user_id", userId);

    if (managerError || !managerEntities?.length) {
      console.error("Error fetching manager entities:", managerError);
      console.log("Manager entities:", managerEntities);
      return [];
    }

    // console.log("Manager assignments:", managerEntities);

    // 2. Récupérer les IDs des chefs de projet
    const { data: chefProjetIds, error: chefProjetError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'chef_projet');

    if (chefProjetError) {
      console.error("Error fetching chef projet IDs:", chefProjetError);
      return [];
    }

    // console.log("Chef projet IDs:", chefProjetIds);

    // 3. Récupérer les entités accessibles pour chaque type
    let accessibleUserIds = new Set<string>();

    for (const entity of managerEntities) {
      if (entity.entity_type === 'pole') {
        // Récupérer les utilisateurs du pôle
        const { data: poleUsers } = await supabase
          .from('user_hierarchy_assignments')
          .select('user_id')
          .eq('entity_id', entity.entity_id);
        
        poleUsers?.forEach(u => u.user_id && accessibleUserIds.add(u.user_id));

        // Récupérer les directions du pôle
        const { data: directions } = await supabase
          .from('directions')
          .select('id')
          .eq('pole_id', entity.entity_id);

        // Récupérer les utilisateurs des directions
        for (const direction of directions || []) {
          const { data: directionUsers } = await supabase
            .from('user_hierarchy_assignments')
            .select('user_id')
            .eq('entity_id', direction.id);
          
          directionUsers?.forEach(u => u.user_id && accessibleUserIds.add(u.user_id));

          // Récupérer les services de la direction
          const { data: services } = await supabase
            .from('services')
            .select('id')
            .eq('direction_id', direction.id);

          // Récupérer les utilisateurs des services
          for (const service of services || []) {
            const { data: serviceUsers } = await supabase
              .from('user_hierarchy_assignments')
              .select('user_id')
              .eq('entity_id', service.id);
            
            serviceUsers?.forEach(u => u.user_id && accessibleUserIds.add(u.user_id));
          }
        }
      } else if (entity.entity_type === 'direction') {
        // Récupérer les utilisateurs de la direction
        const { data: directionUsers } = await supabase
          .from('user_hierarchy_assignments')
          .select('user_id')
          .eq('entity_id', entity.entity_id);
        
        directionUsers?.forEach(u => u.user_id && accessibleUserIds.add(u.user_id));

        // Récupérer les services de la direction
        const { data: services } = await supabase
          .from('services')
          .select('id')
          .eq('direction_id', entity.entity_id);

        // Récupérer les utilisateurs des services
        for (const service of services || []) {
          const { data: serviceUsers } = await supabase
            .from('user_hierarchy_assignments')
            .select('user_id')
            .eq('entity_id', service.id);
          
          serviceUsers?.forEach(u => u.user_id && accessibleUserIds.add(u.user_id));
        }
      } else if (entity.entity_type === 'service') {
        // Récupérer les utilisateurs du service
        const { data: serviceUsers } = await supabase
          .from('user_hierarchy_assignments')
          .select('user_id')
          .eq('entity_id', entity.entity_id);
        
        serviceUsers?.forEach(u => u.user_id && accessibleUserIds.add(u.user_id));
      }
    }

    // console.log("Accessible user IDs:", Array.from(accessibleUserIds));

    // 4. Récupérer les profils des chefs de projet dans la hiérarchie
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
      .in('id', Array.from(accessibleUserIds));

    if (pmError) {
      console.error("Error fetching project managers for manager:", pmError);
      return [];
    }

    console.log("Final project managers list:", projectManagers);
    return projectManagers as UserProfile[];
  }

  // Pour un chef de projet : uniquement son profil
 // console.log("User is chef de projet, returning only their profile");
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
