
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useReviewAccess = (projectId: string) => {
  const { isAdmin, isManager, userProfile } = usePermissionsContext();
  
  const { data: projectAccess } = useQuery({
    queryKey: ["projectReviewAccess", projectId, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !projectId) return {
        isProjectManager: false,
        isSecondaryProjectManager: false,
      };

      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .single();

      const isProjectManager = project?.project_manager === userProfile.email;

      // Vérifier si l'utilisateur est un chef de projet secondaire
      const { data: projectMember } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userProfile.id)
        .maybeSingle();

      const isSecondaryProjectManager = projectMember?.role === 'secondary_manager';

      return {
        isProjectManager,
        isSecondaryProjectManager,
      };
    },
    enabled: !!userProfile?.id && !!projectId,
  });
  
  // Seuls les admins, managers et chefs de projet principal peuvent créer des revues
  // Les chefs de projet secondaires ne peuvent pas créer de revues
  const canCreateReview = isAdmin || isManager || (projectAccess?.isProjectManager && !projectAccess?.isSecondaryProjectManager);

  return {
    canCreateReview,
    canViewReviews: true // Tout le monde peut voir les revues s'ils ont accès au projet
  };
};
