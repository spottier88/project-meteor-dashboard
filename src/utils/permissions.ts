import { UserRole } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";

export const canManageProjectItems = (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined
): boolean => {
  if (!roles || !userId) return false;

  // Les admins peuvent tout faire
  if (roles.includes("admin")) return true;

  // Le propriétaire du projet peut tout faire
  if (userId === projectOwnerId) return true;

  // Le chef de projet assigné peut tout faire
  if (projectManagerEmail && userEmail && projectManagerEmail === userEmail) return true;

  // Les managers peuvent consulter
  if (roles.includes("manager")) return true;

  return false;
};

export const canCreateProject = (roles: UserRole[] | undefined): boolean => {
  if (!roles) return false;
  // Les managers ne peuvent pas créer de projets
  return roles.some(role => role === "admin" || role === "chef_projet");
};

export const canEditProject = async (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined
): Promise<boolean> => {
  if (!roles || !userId || !projectId) return false;

  // Les admins peuvent tout faire
  if (roles.includes("admin")) return true;

  // Le propriétaire du projet peut tout faire
  if (userId === projectOwnerId) return true;

  // Le chef de projet assigné peut tout faire
  if (projectManagerEmail && userEmail && projectManagerEmail === userEmail) return true;

  // Vérifier si l'utilisateur est un manager avec accès au projet
  if (roles.includes("manager")) {
    const { data: canAccess, error } = await supabase
      .rpc('can_manager_access_project', {
        p_user_id: userId,
        p_project_id: projectId
      });

    if (error) {
      console.error("Error checking project access:", error);
      return false;
    }

    return canAccess;
  }

  return false;
};

export const canViewProjectHistory = (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined
): boolean => {
  return canManageProjectItems(roles, userId, projectOwnerId, projectManagerEmail, userEmail);
};

export const canManageTasks = (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined
): boolean => {
  if (!roles || !userId) return false;

  // Les admins peuvent tout faire
  if (roles.includes("admin")) return true;

  // Le propriétaire du projet peut tout faire
  if (userId === projectOwnerId) return true;

  // Le chef de projet assigné peut tout faire
  if (projectManagerEmail && userEmail && projectManagerEmail === userEmail) return true;

  // Les managers ne peuvent pas gérer les tâches
  return false;
};

export const canManageRisks = (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined
): boolean => {
  if (!roles || !userId) return false;

  // Les admins peuvent tout faire
  if (roles.includes("admin")) return true;

  // Le propriétaire du projet peut tout faire
  if (userId === projectOwnerId) return true;

  // Le chef de projet assigné peut tout faire
  if (projectManagerEmail && userEmail && projectManagerEmail === userEmail) return true;

  // Les managers ne peuvent pas gérer les risques
  return false;
};