import { UserRole } from "@/types/user";

export const canEditProject = (
  userRoles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManager?: string | null,
  userEmail?: string | null,
): boolean => {
  if (!userId) return false;
  if (userRoles?.includes("admin")) return true;
  if (userId === projectOwnerId) return true;
  if (userEmail && projectManager && userEmail === projectManager) return true;
  return false;
};

export const canCreateProject = (userRoles: UserRole[] | undefined): boolean => {
  return userRoles?.some(role => ["admin", "chef_projet"].includes(role)) ?? false;
};

export const canManageProjectItems = (
  userRoles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined
): boolean => {
  if (!userId) return false;
  if (userRoles?.includes("admin")) return true;
  if (userId === projectOwnerId) return true;
  return false;
};

export const canViewProjectHistory = (
  userRoles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManager?: string | null,
  userEmail?: string | null,
): boolean => {
  if (!userId) return false;
  if (userRoles?.includes("admin")) return true;
  if (userId === projectOwnerId) return true;
  if (userEmail && projectManager && userEmail === projectManager) return true;
  return false;
};

export const canManageTasks = (
  userRoles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManager?: string | null,
  userEmail?: string | null,
): boolean => {
  if (!userId) return false;
  if (userRoles?.includes("admin")) return true;
  if (userId === projectOwnerId) return true;
  if (userEmail && projectManager && userEmail === projectManager) return true;
  return false;
};

export const canManageRisks = (
  userRoles: UserRole[] | undefined,
  userId: string | undefined,
  projectOwnerId: string | undefined,
  projectManager?: string | null,
  userEmail?: string | null,
): boolean => {
  if (!userId) return false;
  if (userRoles?.includes("admin")) return true;
  if (userId === projectOwnerId) return true;
  if (userEmail && projectManager && userEmail === projectManager) return true;
  return false;
};