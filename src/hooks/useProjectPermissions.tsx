
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProjectPermissions = (projectId: string) => {
  const { userProfile, isAdmin, accessibleOrganizations } = usePermissionsContext();
  
  const { data: projectAccess } = useQuery({
    queryKey: ["projectAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return {
        canEdit: false,
        isProjectManager: false,
        isSecondaryProjectManager: false,
        isMember: false
      };

      const { data: project } = await supabase
        .from("projects")
        .select("project_manager, pole_id, direction_id, service_id")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === userProfile.email;

      if (isAdmin || isProjectManager) {
        return {
          canEdit: true,
          isProjectManager,
          isSecondaryProjectManager: false,
          isMember: true,
          projectOrganization: {
            pole_id: project?.pole_id,
            direction_id: project?.direction_id,
            service_id: project?.service_id
          }
        };
      }

      // Vérifier si l'utilisateur est un chef de projet secondaire
      const { data: projectMember } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      const isSecondaryProjectManager = projectMember?.role === 'secondary_manager';

      // Vérifier l'accès en tant que manager
      const { data: canAccess } = await supabase
        .rpc('can_manager_access_project', {
          p_user_id: userProfile.id,
          p_project_id: projectId
        });

      const { data: isMember } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      return {
        canEdit: !!canAccess || isSecondaryProjectManager,
        isProjectManager,
        isSecondaryProjectManager,
        isMember: !!isMember,
        projectOrganization: {
          pole_id: project?.pole_id,
          direction_id: project?.direction_id,
          service_id: project?.service_id
        }
      };
    },
    enabled: !!userProfile?.id && !!projectId,
    staleTime: 300000, // 5 minutes
  });

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userProfile.id);
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  const isProjectManager = userRoles?.some(ur => ur.role === 'chef_projet') || false;
  const isManager = userRoles?.some(ur => ur.role === 'manager') || false;

  // Vérifier si les entités du projet sont dans le périmètre accessible
  const canEditOrganization = () => {
    if (isAdmin) return true;
    if (!accessibleOrganizations || !projectAccess?.projectOrganization) return false;

    const { pole_id, direction_id, service_id } = projectAccess.projectOrganization;
    
    // Vérifier l'accès au pôle
    const hasPoleAccess = !pole_id || 
      accessibleOrganizations.poles.some(p => p.id === pole_id);
    
    // Vérifier l'accès à la direction
    const hasDirectionAccess = !direction_id || 
      accessibleOrganizations.directions.some(d => d.id === direction_id);
    
    // Vérifier l'accès au service
    const hasServiceAccess = !service_id || 
      accessibleOrganizations.services.some(s => s.id === service_id);
    
    return hasPoleAccess && hasDirectionAccess && hasServiceAccess;
  };

  return {
    canManageRisks: isAdmin || projectAccess?.canEdit || projectAccess?.isSecondaryProjectManager || false,
    canEdit: projectAccess?.canEdit || false,
    canCreate: isAdmin || isProjectManager,
    canEditOrganization: canEditOrganization(),
    canManageTeam: isAdmin || projectAccess?.isProjectManager || projectAccess?.isSecondaryProjectManager || false,
    isAdmin,
    isManager,
    isProjectManager: projectAccess?.isProjectManager || false,
    isSecondaryProjectManager: projectAccess?.isSecondaryProjectManager || false,
    isMember: projectAccess?.isMember || false,
    userEmail: userProfile?.email,
    accessibleOrganizations
  };
};
