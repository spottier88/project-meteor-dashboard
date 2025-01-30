

export const useManagerPermissions = (projectId: string) => {
  const permissions = usePermissions(projectId);
  const projectAccess = useProjectAccess(projectId);
  
  const isManagerWithAccess = permissions.isManager && projectAccess.canAccess;
  
  console.log('useManagerPermissions for project:', projectId, {
    isAdmin: permissions.isAdmin,
    isManager: permissions.isManager,
    projectAccess: projectAccess.canAccess,
    result: permissions.isAdmin || isManagerWithAccess
  });
  
  // Un manager a les mêmes droits qu'un admin sur son périmètre
  return permissions.isAdmin || isManagerWithAccess;
};
