import { useProjectAccess } from "./use-project-access";

export const useReviewAccess = (projectId: string) => {
  const { canManage, userRoles } = useProjectAccess(projectId);
  
  const canCreateReview = canManage || userRoles?.includes("manager");

  return {
    canCreateReview,
    canViewReviews: true // Tout le monde peut voir les revues s'ils ont accès au projet
  };
};