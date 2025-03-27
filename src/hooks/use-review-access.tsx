
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
  
  // Seuls les admins et chefs de projet (principaux ou secondaires) peuvent créer des revues
  // Les managers n'ont plus ce droit
  const canCreateReview = isAdmin || projectAccess?.isProjectManager || projectAccess?.isSecondaryProjectManager;
  
  // Nouvelle propriété pour contrôler qui peut supprimer des revues
  // Les managers ne peuvent pas supprimer de revues
  const canDeleteReview = isAdmin || projectAccess?.isProjectManager || projectAccess?.isSecondaryProjectManager;

  return {
    canCreateReview,
    canDeleteReview,
    canViewReviews: true // Tout le monde peut voir les revues s'ils ont accès au projet
  };
};
