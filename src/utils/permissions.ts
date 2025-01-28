import { UserRole } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";

export const canManageProjectItems = async (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined
): Promise<boolean> => {
  if (!roles || !userId || !projectId) return false;

  // Les admins peuvent tout faire
  if (roles.includes("admin")) return true;

  // Les managers peuvent tout faire dans leur périmètre
  if (roles.includes("manager")) {
    const { data: canAccess } = await supabase
      .rpc('can_manager_access_project', {
        p_user_id: userId,
        p_project_id: projectId
      });

    return !!canAccess;
  }

  // Le chef de projet assigné peut tout faire
  if (projectManagerEmail && userEmail && projectManagerEmail === userEmail) return true;

  return false;
};

export const canEditProjectItems = async (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined,
  isAssignedToTask?: boolean
): Promise<boolean> => {
  // Vérifier d'abord les droits de gestion généraux
  const canManage = await canManageProjectItems(roles, userId, projectId, projectManagerEmail, userEmail);
  if (canManage) return true;

  // Les utilisateurs peuvent modifier leurs tâches assignées
  if (isAssignedToTask) return true;

  return false;
};

export const canCreateProject = (roles: UserRole[] | undefined): boolean => {
  if (!roles) return false;
  return roles.some(role => role === "admin" || role === "chef_projet");
};

// Les autres fonctions sont supprimées car elles sont maintenant gérées par canManageProjectItems
