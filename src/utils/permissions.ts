import { UserRole } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";

export const canViewProjectHistory = (
  userRoles?: UserRole[],
  userId?: string,
  ownerId?: string,
  projectManager?: string,
  userEmail?: string
): boolean => {
  if (!userRoles || !userId) return false;
  return true; // Tout le monde peut voir l'historique
};

export const canManageTasks = (
  userRoles?: UserRole[],
  userId?: string,
  ownerId?: string,
  projectManager?: string,
  userEmail?: string
): boolean => {
  if (!userRoles || !userId) return false;
  if (userRoles.includes("admin")) return true;
  if (projectManager && userEmail && projectManager === userEmail) return true;
  return userRoles.includes("manager");
};

export const canManageRisks = (
  userRoles?: UserRole[],
  userId?: string,
  ownerId?: string,
  projectManager?: string,
  userEmail?: string
): boolean => {
  if (!userRoles || !userId) return false;
  if (userRoles.includes("admin")) return true;
  if (projectManager && userEmail && projectManager === userEmail) return true;
  return userRoles.includes("manager");
};

export const canEditProject = async (
  userRoles?: UserRole[],
  userId?: string,
  ownerId?: string,
  projectId?: string,
  projectManager?: string,
  userEmail?: string
): Promise<boolean> => {
  if (!userRoles || !userId || !projectId) return false;
  
  // Admin peut tout faire
  if (userRoles.includes("admin")) return true;
  
  // Chef de projet peut modifier son projet
  if (projectManager && userEmail && projectManager === userEmail) return true;
  
  // Manager peut modifier dans son périmètre
  if (userRoles.includes("manager")) {
    const { data: canAccess } = await supabase.rpc('can_manager_access_project', {
      p_user_id: userId,
      p_project_id: projectId
    });
    return !!canAccess;
  }
  
  return false;
};

export const canManageProjectItems = async (
  userRoles?: UserRole[],
  userId?: string,
  projectId?: string,
  projectManager?: string,
  userEmail?: string
): Promise<boolean> => {
  if (!userRoles || !userId || !projectId) return false;

  // Les admins peuvent tout faire
  if (userRoles.includes("admin")) return true;

  // Les managers peuvent tout faire dans leur périmètre
  if (userRoles.includes("manager")) {
    const { data: canAccess } = await supabase.rpc('can_manager_access_project', {
      p_user_id: userId,
      p_project_id: projectId
    });
    return !!canAccess;
  }

  // Le chef de projet assigné peut tout faire
  if (projectManager && userEmail && projectManager === userEmail) return true;

  return false;
};

export const canEditProjectItems = async (
  userRoles?: UserRole[],
  userId?: string,
  projectId?: string,
  projectManager?: string,
  userEmail?: string,
  isAssignedToTask?: boolean
): Promise<boolean> => {
  // Vérifier d'abord les droits de gestion généraux
  const canManage = await canManageProjectItems(userRoles, userId, projectId, projectManager, userEmail);
  if (canManage) return true;

  // Les utilisateurs peuvent modifier leurs tâches assignées
  if (isAssignedToTask) return true;

  return false;
};

export const canCreateProject = (userRoles?: UserRole[]): boolean => {
  if (!userRoles) return false;
  return userRoles.some(role => role === "admin" || role === "chef_projet");
};