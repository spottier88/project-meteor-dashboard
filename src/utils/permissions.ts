import { UserRole } from "@/types/user";

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

  // Les managers ne peuvent que consulter
  if (roles.includes("manager")) return false;

  return false;
};

export const canCreateProject = (roles: UserRole[] | undefined): boolean => {
  if (!roles) return false;
  // Les managers ne peuvent pas créer de projets
  return roles.some(role => role === "admin" || role === "chef_projet");
};

export const canEditProject = (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined
): boolean => {
  return canManageProjectItems(roles, userId, projectOwnerId, projectManagerEmail, userEmail);
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
  return canManageProjectItems(roles, userId, projectOwnerId, projectManagerEmail, userEmail);
};

export const canManageRisks = (
  roles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManagerEmail?: string | undefined,
  userEmail?: string | undefined
): boolean => {
  return canManageProjectItems(roles, userId, projectOwnerId, projectManagerEmail, userEmail);
};