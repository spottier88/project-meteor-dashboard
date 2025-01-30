import { usePermissionsContext } from "@/contexts/PermissionsContext";

let hookCallCount = 0;

export const usePermissions = (projectId?: string) => {
  hookCallCount++;
  const context = usePermissionsContext();
  
  console.log(`[usePermissions] Hook called ${hookCallCount} times`, {
    projectId,
    userId: context.userProfile?.id,
    userEmail: context.userProfile?.email,
    isAdmin: context.isAdmin,
    isManager: context.isManager,
    timestamp: new Date().toISOString()
  });

  return context;
};