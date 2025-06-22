
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserRole } from "@/types/user";

export const getProjectManagers = async (
  userId: string | undefined,
  userRoles: UserRole[] | undefined
): Promise<UserProfile[]> => {
  if (!userId) {
    console.log("No userId provided to getProjectManagers");
    return [];
  }

  try {
    console.log("Calling get_accessible_project_managers RPC with userId:", userId);
    console.log("User roles:", userRoles);
    
    // Utiliser la fonction RPC pour récupérer les chefs de projet accessibles
    const { data, error } = await supabase
      .rpc('get_accessible_project_managers', {
        p_user_id: userId
      });

    if (error) {
      console.error("Error fetching project managers:", error);
      
      // Fallback basé sur les rôles utilisateur
      console.log("Falling back to role-based query for project managers");
      
      const isAdmin = userRoles?.some(ur => ur === 'admin') || false;
      const isManager = userRoles?.some(ur => ur === 'manager') || false;
      const isChefProjet = userRoles?.some(ur => ur === 'chef_projet') || false;
      
      console.log("Role check - isAdmin:", isAdmin, "isManager:", isManager, "isChefProjet:", isChefProjet);
      
      if (isAdmin) {
        // Admin : tous les chefs de projet
        // D'abord récupérer les IDs des chefs de projet
        const { data: userRoleIds, error: userRoleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'chef_projet');

        if (userRoleError) {
          console.error("Error fetching user role IDs:", userRoleError);
          return [];
        }

        const userIds = userRoleIds?.map(ur => ur.user_id).filter(Boolean) || [];
        
        if (userIds.length === 0) {
          console.log("No chef_projet users found");
          return [];
        }

        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            first_name,
            last_name,
            created_at
          `)
          .in('id', userIds);

        if (adminError) {
          console.error("Admin fallback query failed:", adminError);
          return [];
        }

        console.log("Admin fallback data:", adminData);
        return adminData as UserProfile[];
        
      } else if (isManager) {
        // Manager : chefs de projet dans ses entités
        // Cette logique devrait être implémentée selon votre structure hiérarchique
        console.log("Manager fallback - implementing hierarchy-based access");
        
        // D'abord récupérer les IDs des chefs de projet
        const { data: userRoleIds, error: userRoleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'chef_projet');

        if (userRoleError) {
          console.error("Error fetching user role IDs:", userRoleError);
          return [];
        }

        const userIds = userRoleIds?.map(ur => ur.user_id).filter(Boolean) || [];
        
        if (userIds.length === 0) {
          console.log("No chef_projet users found");
          return [];
        }

        const { data: managerData, error: managerError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            first_name,
            last_name,
            created_at
          `)
          .in('id', userIds);

        if (managerError) {
          console.error("Manager fallback query failed:", managerError);
          return [];
        }

        console.log("Manager fallback data:", managerData);
        return managerData as UserProfile[];
        
      } else if (isChefProjet) {
        // Chef de projet : seulement lui-même
        const { data: selfData, error: selfError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            first_name,
            last_name,
            created_at
          `)
          .eq('id', userId)
          .single();

        if (selfError) {
          console.error("Self query failed:", selfError);
          return [];
        }

        console.log("Chef de projet fallback data:", [selfData]);
        return [selfData] as UserProfile[];
      }

      console.log("No matching role found, returning empty array");
      return [];
    }

    console.log("RPC returned data:", data);
    return data as UserProfile[];
  } catch (error) {
    console.error("Exception in getProjectManagers:", error);
    return [];
  }
};
