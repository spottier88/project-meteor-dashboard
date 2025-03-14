
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserRole } from "@/types/user";

export const getProjectManagers = async (
  userId: string | undefined,
  userRoles: UserRole[] | undefined
): Promise<UserProfile[]> => {
  if (!userId || !userRoles) return [];

  // console.log("Getting project managers for user:", userId);
  // console.log("User roles:", userRoles);

  // Utiliser la nouvelle fonction RPC pour récupérer les chefs de projet accessibles
  const { data, error } = await supabase
    .rpc('get_accessible_project_managers', {
      p_user_id: userId
    });

  if (error) {
    console.error("Error fetching project managers:", error);
    return [];
  }

  // console.log("Found project managers:", data?.length);
  return data as UserProfile[];
};
