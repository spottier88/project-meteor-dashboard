
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
    
    // Utiliser la fonction RPC pour récupérer les chefs de projet accessibles
    const { data, error } = await supabase
      .rpc('get_accessible_project_managers', {
        p_user_id: userId
      });

    if (error) {
      console.error("Error fetching project managers:", error);
      
      // Fallback: si la RPC échoue, récupérer tous les utilisateurs avec le rôle chef_projet
      console.log("Falling back to direct query for project managers");
      
      // D'abord récupérer les IDs des utilisateurs ayant le rôle chef_projet
      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'chef_projet');

      if (userRoleError) {
        console.error("Error fetching user roles:", userRoleError);
        return [];
      }

      if (!userRoleData || userRoleData.length === 0) {
        console.log("No users found with chef_projet role");
        return [];
      }

      // Extraire les IDs
      const userIds = userRoleData.map(ur => ur.user_id);

      // Puis récupérer les profils correspondants
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at
        `)
        .in('id', userIds);

      if (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return [];
      }

      console.log("Fallback data:", fallbackData);
      return fallbackData as UserProfile[];
    }

    console.log("RPC returned data:", data);
    return data as UserProfile[];
  } catch (error) {
    console.error("Exception in getProjectManagers:", error);
    return [];
  }
};
