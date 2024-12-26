import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const canEditProject = (
  userRole: UserRole | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined
): boolean => {
  if (!userId) return false;
  if (userRole === "admin") return true;
  return userId === projectOwnerId;
};

export const canCreateProject = (userRole: UserRole | undefined): boolean => {
  return userRole === "admin" || userRole === "chef_projet";
};