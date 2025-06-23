
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useReviewAccess = (projectId: string) => {
  const { isAdmin, userProfile } = usePermissionsContext();
  
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
  
  // Règles de revue : admins + chefs de projet (principaux ou secondaires) uniquement
  // Les managers n'ont PAS le droit de créer des revues (sauf s'ils sont aussi chef de projet)
  const canCreateReview = isAdmin || projectAccess?.isProjectManager || projectAccess?.isSecondaryProjectManager;
  
  // Même logique pour la suppression des revues
  const canDeleteReview = isAdmin || projectAccess?.isProjectManager || projectAccess?.isSecondaryProjectManager;

  return {
    canCreateReview,
    canDeleteReview,
    canViewReviews: true // Tout le monde peut voir les revues s'ils ont accès au projet
  };
};
