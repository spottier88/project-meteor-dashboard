
/**
 * @hook useVisibleProjects
 * @description Hook centralisé pour calculer la liste des projets visibles par l'utilisateur.
 * Prend en compte les permissions (admin, manager, chef de projet, membre) et retourne
 * la liste filtrée des projets accessibles ainsi que leurs IDs.
 * 
 * Ce hook remplace la logique dupliquée qui existait dans ProjectGrid et ProjectTable,
 * et élimine la boucle de rendu causée par la synchronisation enfant -> parent.
 */

import { useMemo } from "react";
import { useUser } from "@/contexts/AuthContext";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useUserProjectMemberships } from "./useUserProjectMemberships";
import { useManagerProjectAccess } from "./useManagerProjectAccess";
import { ProjectListItem } from "./useProjectsListView";

export const useVisibleProjects = (projects: ProjectListItem[] | undefined) => {
  const user = useUser();
  const { userProfile, isAdmin, isManager, isLoading: isPermissionsLoading } = usePermissionsContext();

  // IDs de tous les projets pour la requête d'accès manager
  const projectIds = useMemo(() => (projects || []).map(p => p.id), [projects]);

  // Adhésions explicites de l'utilisateur
  const { data: userMemberships } = useUserProjectMemberships();

  // Accès manager hiérarchique
  const { data: projectAccess } = useManagerProjectAccess(projectIds);

  // Calcul synchrone (useMemo) des projets visibles — pas de useQuery ni de useEffect
  const visibleProjects = useMemo(() => {
    if (!user || !projects) return [];
    if (isAdmin) return projects;

    return projects.filter(project => {
      const isProjectOwner = project.project_manager === userProfile?.email;
      const isMemberOfProject = userMemberships?.has(project.id) || false;
      const hasManagerAccess = isManager && (projectAccess?.get(project.id) || false);

      return isProjectOwner || isMemberOfProject || hasManagerAccess;
    });
  }, [projects, user, isAdmin, userProfile?.email, userMemberships, isManager, projectAccess]);

  // IDs des projets visibles (stable tant que visibleProjects ne change pas)
  const visibleProjectIds = useMemo(
    () => visibleProjects.map(p => p.id),
    [visibleProjects]
  );

  return {
    visibleProjects,
    visibleProjectIds,
    isLoading: isPermissionsLoading,
  };
};
