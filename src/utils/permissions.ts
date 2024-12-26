import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const canEditProject = (
  userRole: UserRole | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManager?: string | null,
  userEmail?: string | null,
): boolean => {
  if (!userId) return false;
  if (userRole === "admin") return true;
  if (userId === projectOwnerId) return true;
  // Vérifie si l'utilisateur est le chef de projet assigné
  if (userEmail && projectManager && userEmail === projectManager) return true;
  return false;
};

export const canCreateProject = (userRole: UserRole | undefined): boolean => {
  return userRole === "admin" || userRole === "chef_projet";
};