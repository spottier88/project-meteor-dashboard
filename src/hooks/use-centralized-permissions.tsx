import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useProjectAccess } from "./use-project-access";

let hookCallCount = 0;

export const useCentralizedPermissions = (projectId?: string) => {
  hookCallCount++;
  const { userProfile, isAdmin, isManager } = usePermissionsContext();
  const projectAccess = projectId ? useProjectAccess(projectId) : undefined;

  console.log(`[useCentralizedPermissions] Hook called ${hookCallCount} times`, {
    hookCallCount,
    projectId,
    userId: userProfile?.id,
    userEmail: userProfile?.email,
    isAdmin,
    isManager,
    projectAccess,
    timestamp: new Date().toISOString()
  });

  return {
    isAdmin,
    isManager,
    canEdit: isAdmin || projectAccess?.canEdit || false,
    canManage: isAdmin || projectAccess?.canManage || false,
    canAccess: isAdmin || projectAccess?.canAccess || false,
    userEmail: userProfile?.email,
    projectAccess
  };
};