import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useReviewAccess = (projectId: string) => {
  const { isAdmin, isManager, isProjectManager } = usePermissionsContext();
  
  const canCreateReview = isAdmin || isManager || isProjectManager;

  return {
    canCreateReview,
    canViewReviews: true // Tout le monde peut voir les revues s'ils ont accès au projet
  };
};