
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserRole } from "@/types/user";

export const getProjectManagers = async (
  userId: string | undefined,
  userRoles: UserRole[] | undefined
): Promise<UserProfile[]> => {
  if (!userId || !userRoles) return [];

  // Utiliser la fonction RPC pour récupérer les chefs de projet accessibles
  const { data, error } = await supabase
    .rpc('get_accessible_project_managers', {
      p_user_id: userId
    });

  if (error) {
    console.error("Error fetching project managers:", error);
    return [];
  }

  return data as UserProfile[];
};
